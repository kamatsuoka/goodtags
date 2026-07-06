#!/bin/bash
set -euo pipefail

# Integration test for the remote-DB swap on an Android emulator.
#
# Reproduces the 4.2.1 field failure: the app downloads a newer DB, swaps it in
# mid-session, and then queries must run against the swapped-in handle. With
# expo-sqlite's name-keyed connection cache this used to return a stale handle
# ("no such table: tags"); sqlUtil now opens with useNewConnection to avoid it.
#
# Steps:
#   1. Clear app data and launch once so the DB seeds from the app bundle
#   2. Backdate the on-device manifest.json so the remote DB looks newer
#   3. Relaunch; drive the popular list while the swap runs in the background
#   4. Wait for "Done updating DB from remote" in logcat
#   5. Run a search AFTER the swap and assert results appear
#   6. Fail on any "no such table" / validation failure in logcat
#
# Requires: a running Android emulator, maestro, and a DEBUG build installed
# (debug is needed for run-as, and means JS is served live from Metro -- so the
# current working tree is what's tested, no rebuild needed for JS changes).
# Usage: ./scripts/integration-test-db-swap.sh
#   SKIP_BUILD=1  skip gradle build/install if the app is already installed

PKG="com.fogcitysingers.goodtags"
MANIFEST_DEVICE_PATH="files/SQLite/manifest.json"
SWAP_LOG_MARKER="Done updating DB from remote"
SWAP_TIMEOUT_SECS=90

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
FLOW_DIR="$PROJECT_DIR/e2e/maestro"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

fail() {
  echo -e "${RED}FAIL: $1${NC}"
  exit 1
}

TMP_DIR="$(mktemp -d)"
STARTED_METRO_PID=""
cleanup() {
  rm -rf "$TMP_DIR"
  if [ -n "$STARTED_METRO_PID" ]; then
    echo "Stopping Metro (started by this script, pid $STARTED_METRO_PID)"
    kill "$STARTED_METRO_PID" 2>/dev/null || true
  fi
}
trap cleanup EXIT

# --- 0. Preconditions -------------------------------------------------------

SERIAL="$(adb devices | grep '^emulator' | grep 'device$' | awk '{print $1}' | head -1)"
[ -n "$SERIAL" ] || fail "no running emulator found (start one first)"
echo "Using emulator: $SERIAL"
ADB=(adb -s "$SERIAL")

command -v maestro >/dev/null || fail "maestro not installed"

# The swap can only trigger if the server DB is newer than the app-bundled one:
# backdating the device manifest below the bundled manifest's timestamp makes the
# app re-seed from the bundle on relaunch (bundle newer than device -> copy), so
# the effective comparison is always remote vs bundle. Check that up front rather
# than timing out confusingly later.
BUNDLE_TS="$(python3 -c "import json; print(json.load(open('$PROJECT_DIR/src/assets/generated_db/manifest.json'))['generated_at_epoch_seconds'])")"
REMOTE_TS="$(curl -fsSL https://kamatsuoka.github.io/goodtags/manifest.json | python3 -c "import json,sys; print(json.load(sys.stdin)['generated_at_epoch_seconds'])")"
if [ "$REMOTE_TS" -le "$BUNDLE_TS" ]; then
  fail "remote DB (generated $REMOTE_TS) is not newer than the bundled DB ($BUNDLE_TS); \
the swap cannot trigger. Re-run after the daily DB workflow publishes a newer DB, \
or temporarily commit an older bundled manifest."
fi
echo "Remote DB ($REMOTE_TS) is newer than bundled ($BUNDLE_TS); swap can trigger."

# run-as (needed to backdate the manifest) only works on debuggable builds
if ! "${ADB[@]}" shell run-as "$PKG" true 2>/dev/null; then
  echo "App not installed or not a debug build; will build+install debug."
  SKIP_BUILD=""
fi
if [ -z "${SKIP_BUILD:-}" ]; then
  echo "Building and installing debug APK..."
  (cd "$PROJECT_DIR/android" && ./gradlew assembleDebug)
  # Uninstall first: an existing release install has a different signature
  "${ADB[@]}" uninstall "$PKG" >/dev/null 2>&1 || true
  "${ADB[@]}" install "$PROJECT_DIR/android/app/build/outputs/apk/debug/app-debug.apk"
fi

# Debug builds load JS from Metro; make sure it's reachable
"${ADB[@]}" reverse tcp:8081 tcp:8081
if ! curl -s http://localhost:8081/status 2>/dev/null | grep -q "running"; then
  echo "Starting Metro..."
  (cd "$PROJECT_DIR" && yarn start >"$TMP_DIR/metro.log" 2>&1) &
  STARTED_METRO_PID=$!
  until curl -s http://localhost:8081/status 2>/dev/null | grep -q "running"; do
    sleep 1
  done
fi
echo "Metro is running."

# --- 1. Fresh state: seed the DB from the app bundle ------------------------

echo "Clearing app data and launching to seed DB..."
"${ADB[@]}" shell pm clear "$PKG" >/dev/null
"${ADB[@]}" shell am start -n "$PKG/.MainActivity" >/dev/null

# Seeding is done once the manifest has been moved into place
SECONDS=0
until "${ADB[@]}" shell run-as "$PKG" test -f "$MANIFEST_DEVICE_PATH" 2>/dev/null; do
  [ "$SECONDS" -lt 60 ] || fail "timed out waiting for DB seed (is Metro serving the app?)"
  sleep 2
done
# Give any first-launch background remote check a moment to settle
sleep 5
echo "DB seeded."

# --- 2. Backdate the on-device manifest so the remote looks newer -----------

echo "Backdating on-device manifest..."
"${ADB[@]}" shell am force-stop "$PKG"
"${ADB[@]}" exec-out run-as "$PKG" cat "$MANIFEST_DEVICE_PATH" >"$TMP_DIR/manifest.json"
python3 - "$TMP_DIR/manifest.json" <<'PY'
import json, sys
path = sys.argv[1]
m = json.load(open(path))
old = m["generated_at_epoch_seconds"]
m["generated_at_epoch_seconds"] = 1000000000  # 2001; remote is guaranteed newer
json.dump(m, open(path, "w"))
print(f"generated_at: {old} -> 1000000000")
PY
"${ADB[@]}" push "$TMP_DIR/manifest.json" /data/local/tmp/gt-manifest.json >/dev/null
"${ADB[@]}" shell run-as "$PKG" cp /data/local/tmp/gt-manifest.json "$MANIFEST_DEVICE_PATH"
"${ADB[@]}" shell rm /data/local/tmp/gt-manifest.json
"${ADB[@]}" exec-out run-as "$PKG" cat "$MANIFEST_DEVICE_PATH" | grep -q 1000000000 ||
  fail "backdating the manifest did not stick"
echo "Manifest backdated."

# --- 3. Relaunch and query while the swap happens ----------------------------

"${ADB[@]}" logcat -c
echo "Relaunching app (Maestro): popular list while swap runs in background..."
maestro --device "$SERIAL" test "$FLOW_DIR/db-swap-launch.yaml" ||
  fail "phase 1 (launch + popular list) failed"

# --- 4. Wait for the swap to complete ----------------------------------------

echo "Waiting for '$SWAP_LOG_MARKER' in logcat..."
SECONDS=0
until "${ADB[@]}" logcat -d ReactNativeJS:V '*:S' | grep -q "$SWAP_LOG_MARKER"; do
  [ "$SECONDS" -lt "$SWAP_TIMEOUT_SECS" ] || {
    "${ADB[@]}" logcat -d ReactNativeJS:V '*:S' | tail -40
    fail "swap never completed (marker not seen in ${SWAP_TIMEOUT_SECS}s); log tail above"
  }
  sleep 2
done
echo "Swap completed."

# --- 5. Query through the swapped-in handle ----------------------------------

echo "Running post-swap search (Maestro)..."
maestro --device "$SERIAL" test "$FLOW_DIR/db-swap-search.yaml" ||
  fail "phase 2 (post-swap search) failed -- query against swapped-in DB handle"

# --- 6. Logcat assertions -----------------------------------------------------

LOG="$TMP_DIR/reactnative.log"
"${ADB[@]}" logcat -d ReactNativeJS:V '*:S' >"$LOG"

if grep -i "no such table" "$LOG"; then
  fail "'no such table' appeared in logs (stale connection after swap)"
fi
if grep -i "failed validation" "$LOG"; then
  fail "downloaded DB failed validation during the test"
fi
grep -q "Remote DB validated" "$LOG" ||
  fail "expected 'Remote DB validated' in logs (swap path not exercised?)"

echo -e "${GREEN}PASS: DB swapped in mid-session and post-swap queries succeeded.${NC}"
