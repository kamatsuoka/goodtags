#!/bin/bash
set -e

# The AVD used when no target is given. Pinning it keeps the target from
# depending on which emulator happens to be running, or on the alphabetical
# order of `emulator -list-avds`.
DEFAULT_AVD="Pixel_9"

VARIANT="${1:-debug}"
# Emulator AVD to build for, or "device" for a connected phone.
DEST="${2:-${ANDROID_AVD:-$DEFAULT_AVD}}"

find_emulator_by_avd() {
  adb devices | grep "^emulator" | grep "device$" | awk '{print $1}' | while read -r s; do
    avd=$(adb -s "$s" emu avd name 2>/dev/null | head -1 | tr -d '\r')
    if [ "$avd" = "$1" ]; then
      echo "$s"
      break
    fi
  done
}

start_and_wait_for_avd() {
  local avd="$1"
  echo "Starting $avd..."
  "${ANDROID_HOME:-$HOME/Library/Android/sdk}/emulator/emulator" -avd "$avd" &
  echo "Waiting for boot..."
  until SERIAL=$(find_emulator_by_avd "$avd") && [ -n "$SERIAL" ]; do sleep 2; done
  adb -s "$SERIAL" wait-for-device
  until adb -s "$SERIAL" shell getprop sys.boot_completed 2>/dev/null | grep -q "1"; do sleep 2; done
}

if [ "$DEST" = "device" ]; then
  SERIAL=$(adb devices | grep -v "List of devices" | grep -v "^emulator" | grep "device$" | awk '{print $1}' | head -1)
  if [ -z "$SERIAL" ]; then
    echo "No physical device connected"
    exit 1
  fi
else
  SERIAL=$(find_emulator_by_avd "$DEST")
  if [ -z "$SERIAL" ]; then
    if ! "${ANDROID_HOME:-$HOME/Library/Android/sdk}/emulator/emulator" -list-avds | grep -qx "$DEST"; then
      echo "No AVD named '$DEST'. Available AVDs:"
      "${ANDROID_HOME:-$HOME/Library/Android/sdk}/emulator/emulator" -list-avds
      echo "Pass one as the second argument or set ANDROID_AVD."
      exit 1
    fi
    start_and_wait_for_avd "$DEST"
  fi
fi

if [ "$VARIANT" = "release" ]; then
  GRADLE_TASK="assembleRelease"
  APK="android/app/build/outputs/apk/release/app-release.apk"
  GRADLE_ARGS=()
else
  GRADLE_TASK="assembleDebug"
  APK="android/app/build/outputs/apk/debug/app-debug.apk"
  # Debug builds are only ever installed on the emulator/device under test, so
  # restrict native libs to its architecture instead of bundling all of them
  # (a universal debug APK is ~220MB and can exhaust emulator storage on install).
  # Override with e.g. DEBUG_ARCH=x86_64 for an Intel/x86 emulator.
  GRADLE_ARGS=("-PreactNativeArchitectures=${DEBUG_ARCH:-arm64-v8a}")
fi

(cd android && ./gradlew "$GRADLE_TASK" "${GRADLE_ARGS[@]}")

adb -s "$SERIAL" uninstall com.fogcitysingers.goodtags || true
adb -s "$SERIAL" install -r "$APK"
adb -s "$SERIAL" shell am start -n "com.fogcitysingers.goodtags/.MainActivity"
