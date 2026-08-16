import {
  DbManifest,
  getReactNativeAppManifestModule,
  getReactNativeAppSqlModule,
  MANIFEST_NAME,
  REMOTE_ASSET_BASE_URL,
  TAGS_DB_NAME,
  VALID_SCHEMA_VERSION,
} from '@app/constants/sql'
import getUrl from '@app/modules/getUrl'
import { Asset } from 'expo-asset'
import { Directory, File, Paths } from 'expo-file-system'
import { copyAsync } from 'expo-file-system/legacy'
import * as SQLite from 'expo-sqlite'

// expo-sqlite keeps a process-global, refcounted connection cache keyed by database
// NAME (see the Android SQLiteModule NativeDatabase constructor). With the default
// `useNewConnection: false`, openDatabaseAsync hands back a cached connection for a
// given name instead of reopening the file. That's wrong for us: this module deletes
// and moves the DB file on disk (seeding from the bundle, swapping in a remote
// download) and then reopens the same name. A cached/aliased connection can then point
// at the pre-move file -- or a handle opened while the file was momentarily absent --
// producing "no such table: tags" against what is actually a valid DB on disk. Opening
// with a fresh connection every time forces a real sqlite3_open of the current file and
// a real close, so every handle reflects exactly what's on disk right now.
//
// `finalizeUnusedStatementsBeforeClosing: false` works around a double-finalize bug in
// expo-sqlite's own close-time statement cleanup: our search uses an FTS virtual table
// (`tags_fts`, currently fts4), and FTS finalizes its own internal statements when the
// connection closes. expo-sqlite's "finalize anything left open" pass on close doesn't
// know that and finalizes the same (already-freed) statement again, corrupting the heap
// and crashing with SIGABRT inside exsqlite3_finalize (see
// https://github.com/expo/expo/issues/38168 -- reported against fts5, but the mechanism
// is the same for the fts4 table we use). Disabling that pass avoids the double free;
// any statements we actually leak get cleaned up by sqlite3_close itself.
const DB_OPEN_OPTIONS: SQLite.SQLiteOpenOptions = {
  useNewConnection: true,
  finalizeUnusedStatementsBeforeClosing: false,
}

// The parts of SQLiteDatabase we use. It's an interface so tests can supply a stub
// and so callers don't couple to expo-sqlite directly.
export interface InnerDb {
  getAllAsync: <T = any>(source: string, ...params: any[]) => Promise<T[]>
}

/**
 * Kick off process of creating db and checking for updates,
 * which can be done before we actually need access to db object itself.
 */
export function warmupDb() {
  // Fire-and-forget: this catch only keeps the warmup path from surfacing as an
  // unhandled promise rejection. Real callers await getDbConnection() themselves and
  // see any error; a failed init clears the singleton (see getDbConnection) so the next
  // call retries rather than being stuck on a cached failure.
  getDbConnection().catch(e => console.error('warmupDb failed:', e))
}

// One shared connection, opened lazily and reused by every caller. Automatic remote
// updates are adopted on the *next* launch (see backgroundCheckForRemoteUpdates), not
// hot-swapped into a running app. The connection can still be replaced *wholesale* in
// two cases -- a manual force refresh (refreshDbNow) and re-init after a failed open
// (getDbConnection) -- but it is never mutated in place or closed mid-query, so there is
// no refcounting or locking. The search DB is read-only content, so reads run directly
// against it with no wrapping transaction (see fetchAndConvertTags); SQLite manages its own
// concurrency for the reads we issue.
//
// Module-private, so a plain reassignable binding is enough -- every read and write
// goes through installConnection/getDbConnection below.
let dbConnectionPromise: Promise<InnerDb> | null = null

/**
 * Installs `open()`'s connection as the shared one and returns it.
 *
 * Clear-on-failure is a property of the slot, not of any one writer: a promise that
 * rejects must not stay memoized, or every later caller replays the same failure and
 * only an app restart recovers. Both writers (first init and refreshDbNow) go through
 * here so neither can forget it.
 */
function installConnection(open: () => Promise<InnerDb>): Promise<InnerDb> {
  const attempt: Promise<InnerDb> = open().catch(e => {
    // Only clear if nothing replaced it meanwhile (e.g. refreshDbNow installing a
    // new connection while this attempt was in flight).
    if (dbConnectionPromise === attempt) dbConnectionPromise = null
    throw e
  })
  dbConnectionPromise = attempt
  return attempt
}

/**
 * Resolves to the shared DB connection, initializing it on first call and reusing it
 * thereafter, so every caller shares one connection.
 */
export async function getDbConnection(): Promise<InnerDb> {
  return await (dbConnectionPromise ?? installConnection(initializeDbConnection))
}

const SQLITE_DIR = 'SQLite'

function dbPaths() {
  // "SQLite" directory is required and assumed by SQLite.openDatabase
  const sqlDir = `${Paths.document.uri}${SQLITE_DIR}/`
  const currentSqlPath = sqlDir + TAGS_DB_NAME
  const currentManifestPath = sqlDir + MANIFEST_NAME
  return {
    sqlDir,
    currentSqlPath,
    currentManifestPath,
    tmpSqlPath: `${currentSqlPath}.tmp`,
    tmpManifestPath: `${currentManifestPath}.tmp`,
  }
}

/**
 * Open a fresh connection to a DB in the SQLite directory (see DB_OPEN_OPTIONS).
 *
 * Always by basename: openDatabaseAsync treats its argument as a name relative to
 * defaultDatabaseDirectory (it just strips a leading slash and prepends the dir), so
 * passing a full path URI resolves to a bogus path and silently opens a brand-new empty
 * DB -> "no such table: tags". Every open in this module goes through here so none of
 * them can drop DB_OPEN_OPTIONS or reintroduce the full-path mistake.
 */
async function openConnection(name: string = TAGS_DB_NAME): Promise<SQLite.SQLiteDatabase> {
  return SQLite.openDatabaseAsync(name, DB_OPEN_OPTIONS)
}

/** Outcome of a remote-update check, for user-facing feedback. */
export enum DbUpdateResult {
  Updated = 'updated', // a newer DB was downloaded, validated, and staged on disk
  UpToDate = 'up-to-date', // remote is not newer than what we already have
  Unavailable = 'unavailable', // couldn't fetch or validate a usable update
}

// Serializes update checks so the startup check and a manual refresh (or a second tap)
// never run two downloads into the same tmp file at once. Each run waits for the
// previous to finish, then proceeds. The chain never rejects (see below), so a failed
// check can't break it for everyone after.
let updateChain: Promise<unknown> = Promise.resolve()

/**
 * Runs a remote-update check, serialized against every other one, and decides what a
 * failure means -- so this never rejects.
 *
 * Both callers want the same answer from a failure ("no usable update"): the startup
 * check has nowhere to report it, and the manual refresh shows the same snackbar
 * whether the download 404'd or came back corrupt. Owning that here keeps them from
 * each re-catching and re-logging the same event in their own words.
 */
function checkForRemoteUpdate(force: boolean): Promise<DbUpdateResult> {
  const run = updateChain
    .then(() => {
      const { currentSqlPath, currentManifestPath, tmpSqlPath, tmpManifestPath } = dbPaths()
      return backgroundCheckForRemoteUpdates(
        currentSqlPath,
        currentManifestPath,
        tmpSqlPath,
        tmpManifestPath,
        force,
      )
    })
    .catch(e => {
      console.error('Remote DB update check failed:', e)
      return DbUpdateResult.Unavailable
    })
  updateChain = run
  return run
}

/**
 * Check for a newer DB and adopt it into the running app now (for a manual "refresh"
 * button). With `force`, re-download and re-adopt even when the on-disk DB already
 * looks current -- the way to recover from a stale or corrupted local DB.
 *
 * On success the live connection is replaced without closing the old one: an in-flight
 * query finishes against it and the next query uses the new file, so we never close a
 * connection mid-query (the FTS finalize SIGABRT). Serialized via checkForRemoteUpdate
 * so it can't race the startup check or a second tap.
 */
export async function refreshDbNow(force: boolean = false): Promise<DbUpdateResult> {
  const result = await checkForRemoteUpdate(force)
  if (result === DbUpdateResult.Updated) {
    installConnection(openConnection)
  }
  return result
}

// Test-only: reset module singletons between cases.
export function __resetDbStateForTest() {
  dbConnectionPromise = null
  updateChain = Promise.resolve()
}

/**
 * Opens the DB connection. Copies from app storage if needed before opening, and
 * kicks off a background check for a newer remote DB (adopted on the next launch).
 */
async function initializeDbConnection(): Promise<InnerDb> {
  const { sqlDir, currentSqlPath, currentManifestPath, tmpSqlPath, tmpManifestPath } = dbPaths()
  const appSqlUri = Asset.fromModule(getReactNativeAppSqlModule()).uri
  const appManifestObject = getReactNativeAppManifestModule()

  const sqlDirectory = new Directory(sqlDir)
  if (!sqlDirectory.exists) {
    sqlDirectory.create()
  }

  // Initialize DB from local storage if needed
  const needsCopy =
    (await shouldCopyFromApp(currentSqlPath, currentManifestPath, appManifestObject)) ||
    !(await currentDbHasTags())
  if (needsCopy) {
    console.debug('Copying DB from app storage')
    // To avoid getting into a bad state if app dies mid-copy,
    // write to temp files and then move files into place.
    // There's still potential for a race condition where we've moved one file but not other,
    // but consequences should be much less bad (eg unlikely to brick app).

    // In dev mode, assets are served via HTTP by Metro bundler, so use downloadFileAsync
    // In prod mode, assets are local asset:// URIs, so use legacy copyAsync which handles asset URIs
    if (__DEV__) {
      await File.downloadFileAsync(appSqlUri, new File(tmpSqlPath), {
        idempotent: true,
      })
    } else {
      await copyAsync({ from: appSqlUri, to: tmpSqlPath })
    }

    new File(tmpManifestPath).write(JSON.stringify(appManifestObject))
    await moveIntoPlace(tmpSqlPath, tmpManifestPath, currentSqlPath, currentManifestPath)
  } else {
    console.debug(
      'Not seeding DB from app bundle: on-device DB is at least as new as the ' +
        'bundled copy and has tags. (Will still check the remote server next.)',
    )
  }

  const db = await openConnection()

  // We've seeded from local data; also check the server for a newer DB. This writes
  // any newer copy to disk for the *next* launch to pick up -- it does not touch the
  // connection we just opened. Kicked off once per app open, through the shared guard
  // so a manual refresh can't race it. Deliberately not awaited; checkForRemoteUpdate
  // never rejects, so there's no unhandled rejection to guard against here.
  checkForRemoteUpdate(false)

  return db
}

/**
 * Moves a staged DB + manifest pair onto the live paths.
 *
 * Shared by the two writers (seeding from the bundle, staging a remote download) so the
 * two rules here are stated and enforced once:
 *  - `overwrite: true`, because File.move() defaults to overwrite: false and rejects
 *    with DestinationAlreadyExists when the destination is there -- which it is on every
 *    move after the first launch. The option makes the native side delete the
 *    destination for us; it is not atomic-replace, so a crash mid-call can still leave
 *    the DB moved and the manifest not. Consequences are mild (the mismatch just
 *    triggers a re-seed on the next launch) rather than a bricked app.
 *  - `await` every move. File.move() is async, and an un-awaited one lets a subsequent
 *    openDatabaseAsync race it and open the not-yet-moved-into path, silently creating a
 *    fresh empty DB -> "no such table: tags".
 */
async function moveIntoPlace(
  tmpSqlPath: string,
  tmpManifestPath: string,
  currentSqlPath: string,
  currentManifestPath: string,
): Promise<void> {
  await new File(tmpSqlPath).move(new File(currentSqlPath), { overwrite: true })
  await new File(tmpManifestPath).move(new File(currentManifestPath), { overwrite: true })
}

async function currentDbHasTags(): Promise<boolean> {
  try {
    const db = await openConnection()
    try {
      await db.getAllAsync('SELECT COUNT(*) FROM tags LIMIT 1')
      return true
    } finally {
      await db.closeAsync()
    }
  } catch {
    return false
  }
}

/** Whether we should copy SQL and manifest from app's built-in assets */
async function shouldCopyFromApp(
  currentSqlPath: string,
  currentManifestPath: string,
  appManifestContents: DbManifest,
): Promise<boolean> {
  // If either are missing, we should obviously copy
  if (!new File(currentSqlPath).exists || !new File(currentManifestPath).exists) {
    return true
  }

  // If they're present, see if app manifest is newer
  const currentGeneratedAt = await generatedAtFromPath(currentManifestPath)
  const appGeneratedAt = appManifestContents.generated_at_epoch_seconds
  return appGeneratedAt > currentGeneratedAt
}

/**
 * The manifest's generated_at, or 0 if it is missing or unreadable.
 *
 * A seed that died partway through leaves exactly that state -- no manifest, or a
 * truncated one -- and it is also the state in which the user most needs both callers
 * to keep working. Reading it strictly threw before either could act: the update check
 * never reached the network, so a refresh reported Unavailable and the UI blamed the
 * server, and the launch path failed before it could re-seed. Treating "no readable
 * manifest" as older than anything makes both do the recovering thing instead.
 */
async function generatedAtFromPath(manifestPath: string): Promise<number> {
  try {
    const contents = await new File(manifestPath).text()
    const manifest: DbManifest = JSON.parse(contents)
    return manifest.generated_at_epoch_seconds
  } catch (e) {
    console.debug('No readable local manifest; treating as absent:', e)
    return 0
  }
}

/**
 * Checks the server for a newer DB and, if found and valid, writes it into place on
 * disk. It never touches the live connection itself -- it only stages files. The
 * automatic (background) caller leaves the staged file to be adopted on the next launch,
 * when initializeDbConnection opens it; the manual refreshDbNow caller adopts it
 * immediately by reopening. The seed logic won't clobber a staged update, because the
 * manifest we write is newer than the bundled one.
 *
 * Exported for unit testing (see sqlUtil.test.ts); otherwise reached via
 * checkForRemoteUpdate (from initializeDbConnection and refreshDbNow).
 */
export async function backgroundCheckForRemoteUpdates(
  currentSqlPath: string,
  currentManifestPath: string,
  tmpSqlPath: string,
  tmpManifestPath: string,
  force: boolean = false,
): Promise<DbUpdateResult> {
  const remoteManifestUrl = `${REMOTE_ASSET_BASE_URL}/${MANIFEST_NAME}`

  // Tolerant read (see generatedAtFromPath): a missing/corrupt local manifest must not
  // abort the check, since that is precisely the state a refresh is meant to recover from.
  const currentGeneratedAt = await generatedAtFromPath(currentManifestPath)
  // Get generated at for remote manifest
  const remoteManifestContents = await getUrl<DbManifest>(remoteManifestUrl)
  const remoteGeneratedAt = remoteManifestContents.generated_at_epoch_seconds

  if (!force && remoteGeneratedAt <= currentGeneratedAt) {
    // It's not newer, bail. A forced refresh skips this so it can re-download and
    // re-adopt the current remote DB -- the way to recover a stale/corrupted local DB.
    console.debug('Remote DB not newer, done checking for updates')
    return DbUpdateResult.UpToDate
  }

  const remoteSqlName = remoteManifestContents.db_name_by_version[VALID_SCHEMA_VERSION]
  if (remoteSqlName == null) {
    // Remote is newer but has nothing for our schema version, so there's no usable
    // update for this app build -- from the user's view they're as current as they can be.
    console.debug(`Unable to find remote DB with valid schema version of ${VALID_SCHEMA_VERSION}`)
    return DbUpdateResult.UpToDate
  }

  const remoteSqlUrl = `${REMOTE_ASSET_BASE_URL}/${remoteSqlName}`

  // Go ahead and download/write out both
  // To avoid race conditions, first write out to temp files,
  // then move into place, as when copying from app files.
  // NOTE: Do NOT set Accept-Encoding manually. iOS/Android only transparently
  // decompress gzip responses when the platform added the Accept-Encoding header
  // itself. Setting it here disables that decompression, so we'd write the raw
  // gzipped bytes to disk and SQLite would fail with "no such table". The platform
  // negotiates gzip on its own, so we still get the ~4x over-the-wire savings.
  console.debug('Downloading remote DB')
  const responseBuffer = await getUrl<ArrayBuffer>(remoteSqlUrl, {
    // "stream" isn't a valid type in React Native so we need to save it all to an in-memory buffer
    responseType: 'arraybuffer',
  })
  const tmpSqlFile = new File(tmpSqlPath)
  tmpSqlFile.write(new Uint8Array(responseBuffer))

  // Validate the downloaded file is a usable SQLite DB before swapping it in.
  // A bad download (HTML error page, truncated response) would otherwise replace
  // the current DB with an empty SQLite file that has no tables.
  //
  // The tmp file lives in the SQLite directory, so openConnection's basename-only
  // contract applies to it too.
  const tmpDb = await openConnection(`${TAGS_DB_NAME}.tmp`)
  try {
    const rows = await tmpDb.getAllAsync<{ count: number }>(`SELECT COUNT(*) as count FROM tags`)
    // Reject a missing, unreadable, or empty tags table: a structurally valid but
    // zero-row DB would otherwise replace the working DB with a useless one.
    if (!rows[0]?.count) {
      throw new Error('tags table missing, unreadable, or empty in downloaded DB')
    }
    console.debug(`Remote DB validated: ${rows[0].count} tags`)
  } catch (e) {
    await tmpDb.closeAsync()
    new File(tmpSqlPath).delete()
    console.error('Downloaded remote DB failed validation, discarding:', e)
    return DbUpdateResult.Unavailable
  }
  await tmpDb.closeAsync()

  new File(tmpManifestPath).write(JSON.stringify(remoteManifestContents))

  // Move the validated download into place for the next launch to open. The current
  // session's connection is still open on currentSqlPath; deleting and replacing that
  // file underneath it is safe because the open connection keeps reading its original
  // file via its existing descriptor (POSIX unlink-while-open), while the new bytes
  // take the path for the next openDatabaseAsync. We deliberately do NOT reopen here.
  await moveIntoPlace(tmpSqlPath, tmpManifestPath, currentSqlPath, currentManifestPath)
  console.debug('Remote DB staged; will be adopted on next launch')
  return DbUpdateResult.Updated
}
