import {
  DbManifest,
  getReactNativeAppManifestModule,
  getReactNativeAppSqlModule,
  MANIFEST_NAME,
  REMOTE_ASSET_BASE_URL,
  TAGS_DB_NAME,
  VALID_SCHEMA_VERSION,
} from "@app/constants/sql"
import getUrl from "@app/modules/getUrl"
import {Buffer} from "buffer"
import {Asset} from "expo-asset"
import * as FileSystem from "expo-file-system"
import {EncodingType} from "expo-file-system"
import * as SQLite from "expo-sqlite"
import {SQLTransactionAsyncCallback} from "expo-sqlite"

// These are the parts of SQLiteDatabase we use; it's an interface so we can swap out objects in testing
export interface InnerDb {
  transactionAsync: (
    asyncCallback: SQLTransactionAsyncCallback,
    readOnly?: boolean,
  ) => Promise<void>
  closeAsync: () => void
}
type ReplaceDbCallback = () => Promise<InnerDb>

/**
 * The point of this class is to give access to the underlying database while also allowing it to be safely replaced on
 * the fly. In particular, just writing to the file might cause corrupted reads if a query is ongoing simultaneously
 * (which could be possible because both the queries and the writing are async and can therefore give up control),
 * and just moving a new file atomically into place likely wouldn't get used because the underlying DB handle would be
 * pointing at the old file descriptor.
 *
 * This class exposes a single entry point of `transactionAsync` and keeps track of how many active calls there are to
 * that method. When a request comes in to replace the underlying database, it waits for all transactions to end then
 * runs the replacement callback (which presumably changes things on disk). While the replacement callback is running,
 * new calls to `transactionAsync` will wait until the replacement is finished, at which point pending and subsequent
 * transactions will use the new DB.
 *
 * It is expected that instances of this class act a singleton points of access for a given DB path.
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

  async runTransactionAsync(
    asyncCallback: SQLTransactionAsyncCallback,
    readOnly: boolean = false,
  ): Promise<void> {
    while (this.replaceDbInProgress != null) {
      await this.replaceDbInProgress
    }
    this.txnCount += 1
    await this.db.transactionAsync(asyncCallback, readOnly)
    this.txnCount -= 1
    this.maybeDoDbReplacement()
  }

  async queueDbReplacement(replaceDbCallback: ReplaceDbCallback) {
    // Note: If this method is called multiple times while a replacement is in progress the first call will make
    // progress first, which means it'll likely "win" by setting the callback, but if it's also able to immediately
    // start the replacement the subsequent calls may remain in the while loop and effectively be "queued".
    // Having multiple replacements simultaneously seems very unlikely to happen at all so it's not worth turning the
    // `pendingReplaceDbCallback` into an actual queue.
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
      // This allows others to wait until the replacement is done
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
 * Used to kick off the process of creating the DB and checking for updates, which can be done before we actually need
 * access to the DB object itself.
 */
export function warmupDb() {
  getDbConnection().then(/* Ignore, let run in background */)
}

// Singleton with our database. Is an array because assigning to a global wasn't updating the value on subsequent usages.
const dbConnectionPromise: [Promise<DbWrapper> | null] = [null]

/**
 * On the first call will kick off initializing the SQL database and resolve to the DB once done. Subsequent calls
 * will wait for that initialization (if it's in progress) or immediately resolve to the DB (if it's done).
 */
export async function getDbConnection(): Promise<DbWrapper> {
  const [existing] = dbConnectionPromise
  if (existing == null) {
    // Initialize the database. We *must* immediately set dbConnectionPromise (before, eg, awaiting anything)
    // to avoid race conditions.
    console.debug("Initializing new DB wrapper")
    const nonNullPromise = initializeDbConnection()
    dbConnectionPromise[0] = nonNullPromise
    return await nonNullPromise
  } else {
    console.debug("Using existing DB wrapper")
    return await existing
  }
}

const SQLITE_DIR = "SQLite"

/**
 * Create the DB wrapper. Copies from the app storage if needed before creating the wrapper and kicks off a check of
 * the remote DB after creating and returning the wrapper.
 */
async function initializeDbConnection(): Promise<DbWrapper> {
  // The "SQLite" directory is required and assumed by SQLite.openDatabase
  const sqlDir = `${FileSystem.documentDirectory}${SQLITE_DIR}/`
  const currentSqlPath = sqlDir + TAGS_DB_NAME
  const currentManifestPath = sqlDir + MANIFEST_NAME
  const tmpSqlPath = `${currentSqlPath}.tmp`
  const tmpManifestPath = `${currentManifestPath}.tmp`
  const appSqlPath = Asset.fromModule(getReactNativeAppSqlModule()).uri
  const appManifestObject = getReactNativeAppManifestModule()

  if (!(await FileSystem.getInfoAsync(sqlDir)).exists) {
    await FileSystem.makeDirectoryAsync(sqlDir)
  }

  // Initialize the DB from local storage if needed
  if (
    await shouldCopyFromApp(
      currentSqlPath,
      currentManifestPath,
      appManifestObject,
    )
  ) {
    console.debug("Copying DB from app storage")
    // To avoid getting into a bad state if the app dies mid-copy, we write to temp files and then move the files into
    // place. There's still potential for a race condition where we've moved one file but not the other, but the
    // consequences should be much less bad (eg unlikely to brick the app).
    await FileSystem.downloadAsync(appSqlPath, tmpSqlPath)
    await FileSystem.writeAsStringAsync(
      tmpManifestPath,
      JSON.stringify(appManifestObject),
    )
    await FileSystem.moveAsync({from: tmpSqlPath, to: currentSqlPath})
    await FileSystem.moveAsync({from: tmpManifestPath, to: currentManifestPath})
  } else {
    console.debug(
      "Not copying DB from app storage, current DB already new enough",
    )
  }

  // Note we intentionally are just using the basename and not the full path.
  const dbWrapper = new DbWrapper(SQLite.openDatabase(TAGS_DB_NAME))

  // We've updated based on local data, but we should also check the server for updates. Kick this off once per app
  // open, the first time we load the DB (which should be roughly when the app is opened).
  backgroundCheckForRemoteUpdates(
    dbWrapper,
    currentSqlPath,
    currentManifestPath,
    tmpSqlPath,
    tmpManifestPath,
  ).then(/* Ignore, let run in background */)

  return dbWrapper
}

/** Whether we should copy the SQL and manifest from the app's built-in assets */
async function shouldCopyFromApp(
  currentSqlPath: string,
  currentManifestPath: string,
  appManifestContents: DbManifest,
): Promise<boolean> {
  // If either are missing, we should obviously copy
  if (
    !(await FileSystem.getInfoAsync(currentSqlPath)).exists ||
    !(await FileSystem.getInfoAsync(currentManifestPath)).exists
  ) {
    return true
  }

  // If they're present, see if the app manifest is newer
  const currentGeneratedAt = await generatedAtFromPath(currentManifestPath)
  const appGeneratedAt = appManifestContents.generated_at_epoch_seconds
  return appGeneratedAt > currentGeneratedAt
}

async function generatedAtFromPath(manifestPath: string): Promise<number> {
  const contents = await FileSystem.readAsStringAsync(manifestPath, {
    encoding: "utf8",
  })
  const manifest: DbManifest = JSON.parse(contents)
  return manifest.generated_at_epoch_seconds
}

/**
 * Checks for a newer DB on the server and downloads it if so, replacing the backing DB in the wrapper.
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
  // Get the generated at for the remote manifest
  const remoteManifestContents = await getUrl<DbManifest>(remoteManifestUrl)
  const remoteGeneratedAt = remoteManifestContents.generated_at_epoch_seconds

  if (remoteGeneratedAt <= currentGeneratedAt) {
    // It's not newer, bail
    console.debug("Remote DB not newer, done checking for updates")
    return
  }

  const remoteSqlName =
    remoteManifestContents.db_name_by_version[VALID_SCHEMA_VERSION]
  if (remoteSqlName == null) {
    console.debug(
      `Unable to find remote DB with valid schema version of ${VALID_SCHEMA_VERSION}`,
    )
    return
  }

  const remoteSqlUrl = `${REMOTE_ASSET_BASE_URL}/${remoteSqlName}`

  // Go ahead and download/write out both
  // To avoid race conditions, first write out to temp files then move into place, as when copying from the app files.
  // It's important to set the Accept-Encoding header since that should result in over-the-wire transfer sizes
  // being reduced by ~4x
  console.debug("Downloading remote DB")
  const responseBuffer = await getUrl<ArrayBuffer>(remoteSqlUrl, {
    // "stream" isn't a valid type in React Native apparently so we need to save it all to an in-memory buffer.
    responseType: "arraybuffer",
    headers: {"Accept-Encoding": "gzip"},
  })
  // This is *wild*, the API has no way to write binary content to a file, have to b64 encode it first and write
  // as a string >.>
  const responseBase64 = Buffer.from(responseBuffer).toString("base64")
  await FileSystem.writeAsStringAsync(tmpSqlPath, responseBase64, {
    encoding: EncodingType.Base64,
  })
  await FileSystem.writeAsStringAsync(
    tmpManifestPath,
    JSON.stringify(remoteManifestContents),
  )

  // Actually queue up the replacement
  dbWrapper
    .queueDbReplacement(async () => {
      await FileSystem.moveAsync({from: tmpSqlPath, to: currentSqlPath})
      await FileSystem.moveAsync({
        from: tmpManifestPath,
        to: currentManifestPath,
      })
      console.debug("Done updating DB from remote")
      return SQLite.openDatabase(TAGS_DB_NAME)
    })
    .then(/* ignore promise */)
}
