#!/bin/bash
set -euo pipefail

# Refresh the DB bundled into the app binary with the latest validated copy that the
# daily "Generate offline search database" GitHub Action publishes to GitHub Pages.
#
# Run this intentionally (e.g. before cutting a release) and commit the two updated
# files. Do NOT wire it into the build: it depends on the network and changes a
# committed artifact. The app also downloads the latest DB at runtime -- this just
# keeps the offline seed (used on first launch / before that download lands)
# reasonably fresh.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

# Keep in sync with src/constants/sql.ts
BASE_URL="https://kamatsuoka.github.io/goodtags"
DEST_DIR="$PROJECT_DIR/src/assets/generated_db"
DEST_DB="$DEST_DIR/tags_db.sqlite"      # TAGS_DB_NAME
DEST_MANIFEST="$DEST_DIR/manifest.json" # MANIFEST_NAME
MIN_EXPECTED_TAGS=5000

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

echo -e "${GREEN}Refreshing bundled DB from ${BASE_URL}${NC}"

# 1. Download the manifest that describes the current remote DB.
curl -fsSL "$BASE_URL/manifest.json" -o "$TMP_DIR/manifest.json"

# 2. Read the remote DB filename + generated_at, and the currently-bundled
#    generated_at, so we can report dates and skip if we're already current.
export TMP_MANIFEST="$TMP_DIR/manifest.json"
export DEST_MANIFEST
read -r DB_NAME REMOTE_TS CURRENT_TS REMOTE_HUMAN CURRENT_HUMAN <<EOF
$(python3 - <<'PY'
import datetime, json, os

def human(ts):
    if not ts:
        return "(none)"
    return datetime.datetime.fromtimestamp(ts, datetime.timezone.utc).strftime("%Y-%m-%dT%H:%MZ")

m = json.load(open(os.environ["TMP_MANIFEST"]))
names = m["db_name_by_version"]
db_name = names[max(names, key=int)]
remote_ts = int(m["generated_at_epoch_seconds"])

dest = os.environ["DEST_MANIFEST"]
current_ts = 0
if os.path.exists(dest):
    current_ts = int(json.load(open(dest)).get("generated_at_epoch_seconds", 0))

print(db_name, remote_ts, current_ts, human(remote_ts), human(current_ts))
PY
)
EOF

echo "Remote DB:   $DB_NAME (generated $REMOTE_HUMAN)"
echo "Bundled now: generated $CURRENT_HUMAN"

if [ "$REMOTE_TS" -le "$CURRENT_TS" ]; then
  echo -e "${YELLOW}Bundled DB is already at least as new as the remote copy. Nothing to do.${NC}"
  exit 0
fi

# 3. Download the DB. --compressed lets curl negotiate + transparently decompress
#    the gzip transfer encoding (the file is named .otf so GitHub's CDN gzips it).
echo "Downloading $DB_NAME ..."
curl -fsSL --compressed "$BASE_URL/$DB_NAME" -o "$TMP_DIR/tags_db.sqlite"

# 4. Validate before overwriting the committed asset: real SQLite header + a tags
#    table with a sane number of rows. Mirrors the app's runtime validation and the
#    build-time floor, so a bad/partial download can never clobber the good bundle.
python3 - "$TMP_DIR/tags_db.sqlite" "$MIN_EXPECTED_TAGS" <<'PY'
import sqlite3, sys

path, min_tags = sys.argv[1], int(sys.argv[2])
with open(path, "rb") as f:
    if f.read(16) != b"SQLite format 3\x00":
        sys.exit("Downloaded file is not a valid SQLite database; refusing to use it")
db = sqlite3.connect(path)
try:
    (count,) = db.execute("SELECT COUNT(*) FROM tags").fetchone()
finally:
    db.close()
if count < min_tags:
    sys.exit(f"Downloaded DB has only {count} tags, below minimum {min_tags}; refusing to use it")
print(f"Validated downloaded DB: {count} tags")
PY

# 5. Move into place only after validation passed.
mkdir -p "$DEST_DIR"
mv "$TMP_DIR/tags_db.sqlite" "$DEST_DB"
mv "$TMP_DIR/manifest.json" "$DEST_MANIFEST"

echo -e "${GREEN}Done.${NC} Updated:"
echo "  $DEST_DB"
echo "  $DEST_MANIFEST"
echo -e "${YELLOW}Remember to commit these two files.${NC}"
