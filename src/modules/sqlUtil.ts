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
// expo-sqlite's own close-time statement cleanup: our search queries use FTS5
// (tags_fts), and FTS5 already finalizes its internal statements when the connection
// closes. expo-sqlite's "finalize anything left open" pass on close doesn't know that
// and finalizes the same (already-freed) statement again, corrupting the heap and
// crashing with SIGABRT inside exsqlite3_finalize (see
// https://github.com/expo/expo/issues/38168). Disabling that pass avoids the double
// free; any statements we actually leak get cleaned up by sqlite3_close itself.
const DB_OPEN_OPTIONS: SQLite.SQLiteOpenOptions = {
  useNewConnection: true,
  finalizeUnusedStatementsBeforeClosing: false,
}

// The parts of SQLiteDatabase we use. It's an interface so tests can supply a stub
// and so callers don't couple to expo-sqlite directly.
//
// The connection is opened once per app launch and never swapped mid-session: the
// search DB is read-only content, and a newer remote copy is adopted on the *next*
// launch (see backgroundCheckForRemoteUpdates), not hot-swapped into a running app.
// That makes the connection an immutable, shared handle -- no refcounting, locking,
// or replace-in-place machinery needed. SQLite manages its own concurrency for the
// reads we issue against it.
export interface InnerDb {
  withTransactionAsync: (asyncCallback: () => Promise<void>) => Promise<void>
  getAllAsync: <T = any>(source: string, ...params: any[]) => Promise<T[]>
}

/**
 * Kick off process of creating db and checking for updates,
 * which can be done before we actually need access to db object itself.
 */
export function warmupDb() {
  // Fire-and-forget: real callers await getDbConnection() and will see any error
  // (it's cached on the singleton promise). This catch only keeps the warmup path
  // from surfacing as an unhandled promise rejection.
  getDbConnection().catch(e => console.error('warmupDb failed:', e))
}

// Singleton with our db.
// Is an array because assigning to a global wasn't updating value on subsequent usages.
const dbConnectionPromise: [Promise<InnerDb> | null] = [null]

/**
 * On first call will kick off initializing SQL db and resolve to db once done. Subsequent calls
 * will wait for that init (if it's in progress) or immediately resolve to db (if it's done).
 */
export async function getDbConnection(): Promise<InnerDb> {
  const [existing] = dbConnectionPromise
  if (existing == null) {
    // Initialize database. We *must* immediately set dbConnectionPromise
    // (before, eg, awaiting anything) to avoid race conditions.
    console.debug('Initializing DB connection')
    const nonNullPromise = initializeDbConnection()
    dbConnectionPromise[0] = nonNullPromise
    return await nonNullPromise
  } else {
    return await existing
  }
}

const SQLITE_DIR = 'SQLite'

/**
 * Opens the DB connection. Copies from app storage if needed before opening, and
 * kicks off a background check for a newer remote DB (adopted on the next launch).
 */
async function initializeDbConnection(): Promise<InnerDb> {
  // "SQLite" directory is required and assumed by SQLite.openDatabase
  const sqlDir = `${Paths.document.uri}${SQLITE_DIR}/`
  const currentSqlPath = sqlDir + TAGS_DB_NAME
  const currentManifestPath = sqlDir + MANIFEST_NAME
  const tmpSqlPath = `${currentSqlPath}.tmp`
  const tmpManifestPath = `${currentManifestPath}.tmp`
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

    const tmpManifestFile = new File(tmpManifestPath)
    tmpManifestFile.write(JSON.stringify(appManifestObject))

    // Delete existing files before moving (move doesn't overwrite)
    const currentSqlFile = new File(currentSqlPath)
    if (currentSqlFile.exists) {
      currentSqlFile.delete()
    }
    const currentManifestFile = new File(currentManifestPath)
    if (currentManifestFile.exists) {
      currentManifestFile.delete()
    }

    const tmpSqlFile = new File(tmpSqlPath)
    // File.move() is async; without awaiting it, the subsequent openDatabaseAsync
    // below can race the in-flight move and open the (not-yet-moved-into) path
    // before the file lands, silently creating a fresh empty DB -> "no such
    // table: tags". Must await so the move is guaranteed complete before we open.
    await tmpSqlFile.move(new File(currentSqlPath))
    await tmpManifestFile.move(new File(currentManifestPath))
  } else {
    console.debug(
      'Not seeding DB from app bundle: on-device DB is at least as new as the ' +
        'bundled copy and has tags. (Will still check the remote server next.)',
    )
  }

  // Note we intentionally are just using basename and not full path.
  const db = await SQLite.openDatabaseAsync(TAGS_DB_NAME, DB_OPEN_OPTIONS)

  // We've seeded from local data; also check the server for a newer DB. This writes
  // any newer copy to disk for the *next* launch to pick up -- it does not touch the
  // connection we just opened. Kicked off once per app open.
  // Runs in the background; getUrl rejects on network failure/non-200, so this must
  // catch or the rejection becomes an unhandled promise rejection.
  backgroundCheckForRemoteUpdates(
    currentSqlPath,
    currentManifestPath,
    tmpSqlPath,
    tmpManifestPath,
  ).catch(e => console.error('Background remote DB update check failed:', e))

  return db
}

async function currentDbHasTags(): Promise<boolean> {
  try {
    const db = await SQLite.openDatabaseAsync(TAGS_DB_NAME, DB_OPEN_OPTIONS)
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

async function generatedAtFromPath(manifestPath: string): Promise<number> {
  const manifestFile = new File(manifestPath)
  const contents = await manifestFile.text()
  const manifest: DbManifest = JSON.parse(contents)
  return manifest.generated_at_epoch_seconds
}

/**
 * Checks the server for a newer DB and, if found and valid, writes it into place on
 * disk. This does NOT touch the live connection: the updated file is adopted the next
 * time the app launches and initializeDbConnection opens it. The seed logic there
 * won't clobber it, because the manifest we write is newer than the bundled one.
 *
 * Exported for unit testing (see sqlUtil.test.ts); normally only called by
 * initializeDbConnection.
 */
export async function backgroundCheckForRemoteUpdates(
  currentSqlPath: string,
  currentManifestPath: string,
  tmpSqlPath: string,
  tmpManifestPath: string,
) {
  const remoteManifestUrl = `${REMOTE_ASSET_BASE_URL}/${MANIFEST_NAME}`

  // Assume we have a current manifest by this point
  const currentGeneratedAt = await generatedAtFromPath(currentManifestPath)
  // Get generated at for remote manifest
  const remoteManifestContents = await getUrl<DbManifest>(remoteManifestUrl)
  const remoteGeneratedAt = remoteManifestContents.generated_at_epoch_seconds

  if (remoteGeneratedAt <= currentGeneratedAt) {
    // It's not newer, bail
    console.debug('Remote DB not newer, done checking for updates')
    return
  }

  const remoteSqlName = remoteManifestContents.db_name_by_version[VALID_SCHEMA_VERSION]
  if (remoteSqlName == null) {
    console.debug(`Unable to find remote DB with valid schema version of ${VALID_SCHEMA_VERSION}`)
    return
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
  // NOTE: openDatabaseAsync treats its argument as a name relative to
  // defaultDatabaseDirectory (it just strips a leading slash and prepends the dir),
  // so passing the full tmpSqlPath URI resolves to a bogus path and silently opens a
  // brand-new empty DB -> "no such table: tags". The tmp file lives in that same
  // directory, so open it by basename, exactly as we do for TAGS_DB_NAME elsewhere.
  const tmpDbName = `${TAGS_DB_NAME}.tmp`
  const tmpDb = await SQLite.openDatabaseAsync(tmpDbName, DB_OPEN_OPTIONS)
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
    return
  }
  await tmpDb.closeAsync()

  const tmpManifestFile = new File(tmpManifestPath)
  tmpManifestFile.write(JSON.stringify(remoteManifestContents))

  // Move the validated download into place for the next launch to open. The current
  // session's connection is still open on currentSqlPath; deleting and replacing that
  // file underneath it is safe because the open connection keeps reading its original
  // file via its existing descriptor (POSIX unlink-while-open), while the new bytes
  // take the path for the next openDatabaseAsync. We deliberately do NOT reopen here.
  //
  // Delete existing files before moving (move doesn't overwrite).
  const currentSql = new File(currentSqlPath)
  if (currentSql.exists) {
    currentSql.delete()
  }
  const currentManifest = new File(currentManifestPath)
  if (currentManifest.exists) {
    currentManifest.delete()
  }

  await tmpSqlFile.move(new File(currentSqlPath))
  await tmpManifestFile.move(new File(currentManifestPath))
  console.debug('Remote DB staged; will be adopted on next launch')
}
