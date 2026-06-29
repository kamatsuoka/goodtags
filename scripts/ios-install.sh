#!/bin/bash
set -e

CONFIGURATION="${1:-Debug}"
DEST="${2:-}"

if [ "$DEST" = "device" ]; then
  "$(dirname "$0")/xcodebuild.sh" -configuration "$CONFIGURATION" -destination 'platform=iOS'
else
  SIM="${DEST:-iPhone 17}"
  "$(dirname "$0")/xcodebuild.sh" -configuration "$CONFIGURATION" -destination "platform=iOS Simulator,name=$SIM"
  UDID=$(xcrun simctl list devices | grep "    ${SIM} (" | grep -oE '[0-9A-F-]{36}' | head -1)
  xcrun simctl boot "$UDID" || true
  open -a Simulator --args -CurrentDeviceUDID "$UDID"
  xcrun simctl install "$UDID" "ios/build/Build/Products/${CONFIGURATION}-iphonesimulator/goodtags.app"
  xcrun simctl launch "$UDID" com.fogcitysingers.goodtags
fi
