#!/bin/bash
set -e

VARIANT="${1:-debug}"
DEST="${2:-}"

find_emulator_by_avd() {
  adb devices | grep "^emulator" | grep "device$" | awk '{print $1}' | while read -r s; do
    avd=$(adb -s "$s" emu avd name 2>/dev/null | head -1 | tr -d '\r')
    if [ "$avd" = "$1" ]; then
      echo "$s"
      break
    fi
  done
}

if [ "$DEST" = "device" ]; then
  SERIAL=$(adb devices | grep -v "List of devices" | grep -v "^emulator" | grep "device$" | awk '{print $1}' | head -1)
  if [ -z "$SERIAL" ]; then
    echo "No physical device connected"
    exit 1
  fi
elif [ -n "$DEST" ]; then
  SERIAL=$(find_emulator_by_avd "$DEST")
  if [ -z "$SERIAL" ]; then
    echo "Starting $DEST..."
    "${ANDROID_HOME:-$HOME/Library/Android/sdk}/emulator/emulator" -avd "$DEST" &
    echo "Waiting for boot..."
    until SERIAL=$(find_emulator_by_avd "$DEST") && [ -n "$SERIAL" ]; do sleep 2; done
    adb -s "$SERIAL" wait-for-device
    until adb -s "$SERIAL" shell getprop sys.boot_completed 2>/dev/null | grep -q "1"; do sleep 2; done
  fi
else
  SERIAL=$(adb devices | grep "^emulator" | grep "device$" | awk '{print $1}' | head -1)
  if [ -z "$SERIAL" ]; then
    echo "No emulator running"
    exit 1
  fi
fi

if [ "$VARIANT" = "release" ]; then
  GRADLE_TASK="assembleRelease"
  APK="android/app/build/outputs/apk/release/app-release.apk"
else
  GRADLE_TASK="assembleDebug"
  APK="android/app/build/outputs/apk/debug/app-debug.apk"
fi

(cd android && ./gradlew "$GRADLE_TASK")

adb -s "$SERIAL" uninstall com.fogcitysingers.goodtags || true
adb -s "$SERIAL" install -r "$APK"
adb -s "$SERIAL" shell am start -n "com.fogcitysingers.goodtags/.MainActivity"
