import * as fs from "fs"
import path from "node:path"
import process from "node:process"

const ASSETS_URL_PREFIX = "https://kamatsuoka.github.io/goodtags"

const OUT_DIR = path.join(__dirname, "../src/assets/generated_db")
const MANIFEST_PATH = path.join(OUT_DIR, "manifest.json")
const SQL_NAME_REMOTE = "tags_db.sqlite.otf"
const SQL_NAME_LOCAL = path.join(OUT_DIR, "tags_db.sqlite")

async function downloadLatestSearchDb() {
  try {
    const manifestContents = await fetchRemoteManifest()
    // TODO - Should we put the DB md5sum in the manifest and use that to validate the DB (for both checking
    //  existing and downloading new)?
    if (shouldDownload(manifestContents)) {
      console.log("Downloading latest database...")
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
      "Request failed. status: " +
        response.status +
        ", body: " +
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
    `${ASSETS_URL_PREFIX}/${path.basename(MANIFEST_PATH)}`,
    {
      method: "GET",
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
function shouldDownload(latestManifestContents: Uint8Array): boolean {
  const existingManifestContents = fs.existsSync(MANIFEST_PATH)
    ? fs.readFileSync(MANIFEST_PATH)
    : Buffer.from([])
  const manifestsDiffer = !existingManifestContents.equals(
    latestManifestContents,
  )
  const dbMissing = !fs.existsSync(SQL_NAME_LOCAL)
  return manifestsDiffer || dbMissing
}

/**
 * Downloads the DB and writes both the manifest and DB to disk
 */
async function downloadDb(latestManifestContents: Uint8Array) {
  fs.mkdirSync(OUT_DIR, {recursive: true})

  const response = await fetch(`${ASSETS_URL_PREFIX}/${SQL_NAME_REMOTE}`, {
    method: "GET",
  }).then(assertResponseOk)

  const dbFile = fs.openSync(SQL_NAME_LOCAL, "w")
  const reader = response.body?.getReader()
  if (reader == null) {
    throw new Error("Unable to get response reader for DB request!")
  }

  while (true) {
    const readVal = await reader.read()
    const {done, value} = readVal
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
  fs.writeFileSync(MANIFEST_PATH, latestManifestContents)
}

downloadLatestSearchDb()
