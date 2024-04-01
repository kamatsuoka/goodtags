import * as fs from "fs"
import http from "node:http"
import https from "node:https"
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

/**
 * Downloads the current manifest and returns its contents
 */
async function fetchRemoteManifest(): Promise<Uint8Array> {
  // What an ugly API; If we require Node >= 18 we can just use the new `fetch` API
  return await new Promise((resolve, reject) => {
    const req = https.get(
      `${ASSETS_URL_PREFIX}/${path.basename(MANIFEST_PATH)}`,
      (res: http.IncomingMessage) => {
        let chunks: Uint8Array[] = []
        res.on("data", (chunk: Uint8Array) => chunks.push(chunk))
        res.on("error", reject)
        res.on("end", () => {
          const body = Buffer.concat(chunks)
          if (
            res.statusCode != null &&
            res.statusCode >= 200 &&
            res.statusCode <= 299
          ) {
            resolve(body)
          } else {
            reject(
              "Request failed. status: " + res.statusCode + ", body: " + body,
            )
          }
        })
      },
    )
    req.on("error", reject)
    req.end()
  })
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
  fs.writeFileSync(MANIFEST_PATH, latestManifestContents)

  return new Promise((resolve, reject) => {
    const req = https.get(
      `${ASSETS_URL_PREFIX}/${SQL_NAME_REMOTE}`,
      (res: http.IncomingMessage) => {
        const dbFile = fs.openSync(SQL_NAME_LOCAL, "w")
        res.on("data", (chunk: Uint8Array) => fs.writeSync(dbFile, chunk))
        res.on("error", reject)
        res.on("end", () => {
          fs.closeSync(dbFile)
          if (
            res.statusCode != null &&
            res.statusCode >= 200 &&
            res.statusCode <= 299
          ) {
            resolve(null)
          } else {
            reject("Request failed. status: " + res.statusCode)
          }
        })
      },
    )
    req.on("error", reject)
    req.end()
  })
}

downloadLatestSearchDb()
