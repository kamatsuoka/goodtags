// NOTE: This should match the `LATEST_SCHEMA_VERSION` in `scripts/fetch_search_database.py`
export const VALID_SCHEMA_VERSION = 1
export const REMOTE_ASSET_BASE_URL = "https://kamatsuoka.github.io/goodtags"

// NOTE: This should match the structure generated by `scripts/fetch_search_database.py`
export interface DbManifest {
  generated_at_epoch_seconds: number
  db_name_by_version: {[schema_version: number]: string | undefined}
}

// Name for the file that's used locally, also used for the asset packaged into the app bundle.
export const TAGS_DB_NAME = "tags_db.sqlite" // Must match `require`s below
export const MANIFEST_NAME = "manifest.json" // Must match `require`s below
export const SRC_RELATIVE_APP_BUNDLE_DB_DIR = "assets/generated_db" // Must match `require`s below

/*
 * Putting these here because we need to pass a static string to `require` and I want this duplication between the
 * above variables and the below requires to be as close as possible. Unfortunately it means they're not constants.
 */
export function getReactNativeAppSqlModule(): number {
  return require(`../assets/generated_db/tags_db.sqlite`) // Must match the variables above
}

export function getReactNativeAppManifestModule(): DbManifest {
  return require(`../assets/generated_db/manifest.json`) // Must match the variables above
}