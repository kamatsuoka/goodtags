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

// These are parts of SQLiteDatabase we use; it's an interface so we can swap out objects in testing
export interface InnerDb {
  withTransactionAsync: (asyncCallback: () => Promise<void>) => Promise<void>
  getAllAsync: <T = any>(source: string, ...params: any[]) => Promise<T[]>
  closeAsync: () => void
}
type ReplaceDbCallback = () => Promise<InnerDb>

/**
 * This class gives access to underlying database while also allowing
 * it to be safely replaced on fly. In particular, just writing to file might cause
 * corrupted reads if a query is ongoing simultaneously (which could be possible because
 * both queries and writing are async and can therefore give up control), and just moving
 * a new file atomically into place likely wouldn't get used because underlying DB handle
 * would be pointing at old file descriptor.
 *
 * This class exposes a single entry point of `runTransactionAsync` and keeps track of
 * how many active calls there are to that method. When a request comes in to replace
 * underlying database, it waits for all transactions to end then runs replacement
 * callback (which presumably changes things on disk). While replacement callback is
 * running, new calls to `runTransactionAsync` will wait until replacement is finished,
 * at which point pending and subsequent transactions will use new DB.
 *
 * It is expected that instances of this class act a singleton points of access for
 * a given DB path.
 */
export class DbWrapper {
  private db: InnerDb
  private txnCount: number
  private pendingReplaceDbCallback: ReplaceDbCallback | null
  private replaceDbInProgress: Promise<void> | null

  constructor(db: InnerDb) {
    this.db = db
    this.txnCount = 0
    this.pendingReplaceDbCallback = null
    this.replaceDbInProgress = null
  }

  async runTransactionAsync(asyncCallback: () => Promise<void>): Promise<void> {
    while (this.replaceDbInProgress != null) {
      await this.replaceDbInProgress
    }
    this.txnCount += 1
    await this.db.withTransactionAsync(asyncCallback)
    this.txnCount -= 1
    this.maybeDoDbReplacement()
  }

  async getAllAsync<T = any>(source: string, ...params: any[]): Promise<T[]> {
    while (this.replaceDbInProgress != null) {
      await this.replaceDbInProgress
    }
    return await this.db.getAllAsync<T>(source, ...params)
  }

  async queueDbReplacement(replaceDbCallback: ReplaceDbCallback) {
    // Note: If this method is called multiple times while a replacement is in progress,
    // first call will make progress first, which means it'll likely "win" by setting callback,
    // but if it's also able to immediately start replacement, subsequent calls may
    // remain in while loop and effectively be "queued".
    // Having multiple replacements simultaneously seems very unlikely to happen at all
    // so it's not worth turning the `pendingReplaceDbCallback` into an actual queue.
    while (this.replaceDbInProgress != null) {
      await this.replaceDbInProgress
    }
    if (this.pendingReplaceDbCallback == null) {
      this.pendingReplaceDbCallback = replaceDbCallback
      this.maybeDoDbReplacement()
    }
  }

  private maybeDoDbReplacement() {
    if (
      this.txnCount === 0 &&
      this.pendingReplaceDbCallback != null &&
      this.replaceDbInProgress == null
    ) {
      const replaceDbCallback = this.pendingReplaceDbCallback
      // This allows others to wait until replacement is done
      this.replaceDbInProgress = (async () => {
        this.db.closeAsync()
        this.db = await replaceDbCallback()
        this.pendingReplaceDbCallback = null
        this.replaceDbInProgress = null
      })()
    }
  }
}

/**
 * Kick off process of creating db and checking for updates,
 * which can be done before we actually need access to db object itself.
 */
export function warmupDb() {
  getDbConnection().then(/* Ignore, let run in background */)
}

// Singleton with our db.
// Is an array because assigning to a global wasn't updating value on subsequent usages.
const dbConnectionPromise: [Promise<DbWrapper> | null] = [null]

/**
 * On first call will kick off initializing SQL db and resolve to db once done. Subsequent calls
 * will wait for that init (if it's in progress) or immediately resolve to db (if it's done).
 */
export async function getDbConnection(): Promise<DbWrapper> {
  const [existing] = dbConnectionPromise
  if (existing == null) {
    // Initializ database. We *must* immediately set dbConnectionPromise
    // (before, eg, awaiting anything) to avoid race conditions.
    console.debug('Initializing new DB wrapper')
    const nonNullPromise = initializeDbConnection()
    dbConnectionPromise[0] = nonNullPromise
    return await nonNullPromise
  } else {
    return await existing
  }
}

const SQLITE_DIR = 'SQLite'

/**
 * Create db wrapper. Copies from app storage if needed before creating wrapper
 * and kicks off a check of remote DB after creating and returning wrapper.
 */
async function initializeDbConnection(): Promise<DbWrapper> {
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
  if (await shouldCopyFromApp(currentSqlPath, currentManifestPath, appManifestObject)) {
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
    tmpSqlFile.move(new File(currentSqlPath))
    tmpManifestFile.move(new File(currentManifestPath))
  } else {
    console.debug('Not copying DB from app storage, current DB already new enough')
  }

  // Note we intentionally are just using basename and not full path.
  const db = await SQLite.openDatabaseAsync(TAGS_DB_NAME)
  const dbWrapper = new DbWrapper(db)

  // We've updated based on local data, but should also check server for updates
  // Kick this off once per app open, first time we load DB
  // (which should be roughly when app is opened)
  backgroundCheckForRemoteUpdates(
    dbWrapper,
    currentSqlPath,
    currentManifestPath,
    tmpSqlPath,
    tmpManifestPath,
  ).then(/* Ignore, let run in background */)

  return dbWrapper
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
 * Checks db on server and downloads it if newer, replacing backing db in wrapper
 */
async function backgroundCheckForRemoteUpdates(
  dbWrapper: DbWrapper,
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
  // It's important to set Accept-Encoding header since that should result in
  // over-the-wire transfer sizes being reduced by ~4x
  console.debug('Downloading remote DB')
  const responseBuffer = await getUrl<ArrayBuffer>(remoteSqlUrl, {
    // "stream" isn't a valid type in React Native so we need to save it all to an in-memory buffer
    responseType: 'arraybuffer',
    headers: { 'Accept-Encoding': 'gzip' },
  })
  const tmpSqlFile = new File(tmpSqlPath)
  tmpSqlFile.write(new Uint8Array(responseBuffer))

  const tmpManifestFile = new File(tmpManifestPath)
  tmpManifestFile.write(JSON.stringify(remoteManifestContents))

  // Actually queue up replacement
  dbWrapper
    .queueDbReplacement(async () => {
      // Delete existing files before moving (move doesn't overwrite)
      const currentSql = new File(currentSqlPath)
      if (currentSql.exists) {
        currentSql.delete()
      }
      const currentManifest = new File(currentManifestPath)
      if (currentManifest.exists) {
        currentManifest.delete()
      }

      const tmpSql = new File(tmpSqlPath)
      tmpSql.move(new File(currentSqlPath))
      const tmpManifest = new File(tmpManifestPath)
      tmpManifest.move(new File(currentManifestPath))
      console.debug('Done updating DB from remote')
      return await SQLite.openDatabaseAsync(TAGS_DB_NAME)
    })
    .then(/* ignore promise */)
}
