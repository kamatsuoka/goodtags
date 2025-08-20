import * as fs from 'fs'
import path from 'node:path'
import process from 'node:process'

// Share app code constants to reduce duplication, reduce drift
import {
  DbManifest,
  MANIFEST_NAME,
  REMOTE_ASSET_BASE_URL,
  SRC_RELATIVE_APP_BUNDLE_DB_DIR,
  TAGS_DB_NAME,
  VALID_SCHEMA_VERSION,
} from '../src/constants/sql'

const OUT_DIR = path.join(__dirname, `../src/${SRC_RELATIVE_APP_BUNDLE_DB_DIR}`)
const MANIFEST_PATH = path.join(OUT_DIR, MANIFEST_NAME)
const LOCAL_SQL_PATH = path.join(OUT_DIR, TAGS_DB_NAME)

async function downloadLatestSearchDb() {
  try {
    const manifestContents = await fetchRemoteManifest()
    // TODO - Should we put the DB md5sum in the manifest and use that to validate the DB (for both checking
    //  existing and downloading new)?
    if (shouldDownload(manifestContents)) {
      console.log('Downloading remote database...')
      await downloadDb(manifestContents)
    }
  } catch (e) {
    console.error(e)
    process.exit(1)
  }
}

async function assertResponseOk(response: Response): Promise<Response> {
  if (!response.ok) {
    throw new Error(
      'Request failed. status: ' +
        response.status +
        ', body: ' +
        (await response.text()),
    )
  }

  return response
}

/**
 * Downloads the current manifest and returns its contents
 */
async function fetchRemoteManifest(): Promise<Uint8Array> {
  const response = await fetch(
    `${REMOTE_ASSET_BASE_URL}/${path.basename(MANIFEST_PATH)}`,
    {
      method: 'GET',
    },
  ).then(assertResponseOk)

  return new Uint8Array(await response.arrayBuffer())
}

/**
 * Checks whether we should download the full database and write out both the manifest and database to disk.
 *
 * Specifically compares the downloaded manifest contents against what's on disk (if anything), and also looks
 * to see if the database file exists.
 */
function shouldDownload(remoteManifestContents: Uint8Array): boolean {
  const existingManifestContents = fs.existsSync(MANIFEST_PATH)
    ? fs.readFileSync(MANIFEST_PATH)
    : Buffer.from([])
  const manifestsDiffer = !existingManifestContents.equals(
    remoteManifestContents,
  )
  const dbMissing = !fs.existsSync(LOCAL_SQL_PATH)
  return manifestsDiffer || dbMissing
}

/**
 * Downloads the DB and writes both the manifest and DB to disk
 */
async function downloadDb(remoteManifestContents: Uint8Array) {
  fs.mkdirSync(OUT_DIR, { recursive: true })

  const remoteManifest: DbManifest = JSON.parse(
    new TextDecoder().decode(remoteManifestContents),
  )
  const remoteSqlName = remoteManifest.db_name_by_version[VALID_SCHEMA_VERSION]
  if (remoteSqlName == null) {
    throw new Error(
      `Unable to find remote SQL database with expected schema version of ${VALID_SCHEMA_VERSION}. Options:\n` +
        JSON.stringify(remoteManifest.db_name_by_version),
    )
  }

  const response = await fetch(`${REMOTE_ASSET_BASE_URL}/${remoteSqlName}`, {
    method: 'GET',
  }).then(assertResponseOk)

  const dbFile = fs.openSync(LOCAL_SQL_PATH, 'w')
  const reader = response.body?.getReader()
  if (reader == null) {
    throw new Error('Unable to get response reader for DB request!')
  }

  while (true) {
    const readVal = await reader.read()
    const { done, value } = readVal
    // May not be set when done is true
    if (value != null) {
      fs.writeSync(dbFile, value)
    }
    if (done) {
      fs.closeSync(dbFile)
      break
    }
  }

  // Only write out the manifest once we're done downloading the DB
  fs.writeFileSync(MANIFEST_PATH, remoteManifestContents)
}

downloadLatestSearchDb()
