#!/bin/bash
# generate app store screenshots using Maestro
# usage: ./scripts/maestro-screenshots.sh [ios|android] [device-type] [flow...]
#
# ios device types:  default (iPhone 17), 6.5inch (iPhone Xs Max), 13inch (iPad Pro 13")
# android device types: default (Pixel 9), pixel7 (Pixel 7 API 33)
# flow: one or more flow files under e2e/maestro/ (default: screenshots.yaml); all flows are combined into a single wrapper with app launch

set -e

PLATFORM=${1:-ios}
DEVICE_TYPE=${2:-default}
shift $(( $# < 2 ? $# : 2 ))
if [ $# -eq 0 ]; then
  FLOWS=(screenshots.yaml)
else
  FLOWS=("$@")
fi
BUILD_TYPE=${BUILD_TYPE:-release}
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
OUTPUT_DIR="screenshots/${PLATFORM}/${BUILD_TYPE}/${DEVICE_TYPE}/${TIMESTAMP}"
SCREENSHOT_DIR="screenshots/maestro/${PLATFORM}/${BUILD_TYPE}"

echo "generating ${PLATFORM} screenshots (${DEVICE_TYPE})..."
mkdir -p "${OUTPUT_DIR}" "${SCREENSHOT_DIR}"

# build a single wrapper that launches the app then runs all flows in sequence
WRAPPER=$(mktemp /tmp/maestro-wrapper-XXXXXX.yaml)
{
  echo "appId: com.fogcitysingers.goodtags"
  echo "---"
  echo "- launchApp:"
  echo "    clearState: true"
  echo "- tapOn:"
  echo "    id: welcome_forward_button"
  echo "- assertVisible:"
  echo "    id: home_container"
  for FLOW in "${FLOWS[@]}"; do
    echo "- runFlow: $(pwd)/e2e/maestro/${FLOW}"
  done
} > "${WRAPPER}"

case "${PLATFORM}" in
  ios)
    case "${DEVICE_TYPE}" in
      "13inch")  DEVICE_NAME="iPad Pro 13-inch (M5)" ;;
      "6.5inch") DEVICE_NAME="iPhone Xs Max" ;;
      *)         DEVICE_NAME="iPhone 17" ;;
    esac

    echo "device: ${DEVICE_NAME}"

    # anchor grep so "iPhone 17" doesn't match "iPhone 17 Pro" etc.
    DEVICE_ID=$(xcrun simctl list devices available | grep "${DEVICE_NAME} (" | head -1 | grep -Eo '\([A-F0-9-]{36}\)' | tr -d '()')

    if [ -z "${DEVICE_ID}" ]; then
      echo "error: simulator '${DEVICE_NAME}' not found. run: xcrun simctl list devices" >&2
      exit 1
    fi

    echo "udid: ${DEVICE_ID}"

    # boot if needed
    DEVICE_STATE=$(xcrun simctl list devices available | grep "${DEVICE_ID}" | grep -Eo 'Booted|Shutdown' || echo "Shutdown")
    if [ "${DEVICE_STATE}" != "Booted" ]; then
      echo "booting ${DEVICE_NAME}..."
      xcrun simctl boot "${DEVICE_ID}"
      open -a Simulator
      sleep 3
    fi

    # install app on simulator (required for Maestro's clearState to work)
    case "${BUILD_TYPE}" in
      debug)   APP_PATH="ios/build/Build/Products/Debug-iphonesimulator/goodtags.app" ;;
      *)       APP_PATH="ios/build/Build/Products/Release-iphonesimulator/goodtags.app" ;;
    esac
    if [ ! -d "${APP_PATH}" ]; then
      echo "error: app binary not found at ${APP_PATH}" >&2
      echo "build first with: yarn e2e:build:ios (release) or yarn e2e:build:ios:debug (debug)" >&2
      exit 1
    fi
    echo "installing app..."
    xcrun simctl install "${DEVICE_ID}" "${APP_PATH}"

    maestro --device "${DEVICE_ID}" test \
      --output "${OUTPUT_DIR}" \
      --env SCREENSHOT_DIR="${SCREENSHOT_DIR}" \
      --env runId="${TIMESTAMP}" \
      "${WRAPPER}"
    ;;

  android)
    case "${DEVICE_TYPE}" in
      "pixel7") AVD_NAME="Pixel_7_API_33" ;;
      *)        AVD_NAME="Pixel_9" ;;
    esac

    echo "avd: ${AVD_NAME}"

    # boot emulator if no Android device/emulator is running
    ANDROID_DEVICE=$(adb devices | grep -v "^List" | grep -E "emulator|device" | awk '{print $1}' | head -1)
    if [ -z "${ANDROID_DEVICE}" ]; then
      echo "starting emulator ${AVD_NAME}..."
      emulator -avd "${AVD_NAME}" -no-audio -no-boot-anim &
      echo "waiting for emulator to boot..."
      adb wait-for-device
      until [ "$(adb shell getprop sys.boot_completed 2>/dev/null)" = "1" ]; do
        sleep 2
      done
      echo "emulator ready"
    else
      echo "device: ${ANDROID_DEVICE}"
    fi

    # install APK (required for Maestro's clearState to work)
    case "${BUILD_TYPE}" in
      debug) APK_PATH="android/app/build/outputs/apk/debug/app-debug.apk" ;;
      *)     APK_PATH="android/app/build/outputs/apk/release/app-release.apk" ;;
    esac
    if [ ! -f "${APK_PATH}" ]; then
      echo "error: APK not found at ${APK_PATH}" >&2
      echo "build first with: cd android && ./gradlew assembleRelease" >&2
      exit 1
    fi
    echo "installing APK..."
    adb uninstall com.fogcitysingers.goodtags 2>/dev/null || true
    adb install "${APK_PATH}"

    maestro test \
      --output "${OUTPUT_DIR}" \
      --env SCREENSHOT_DIR="${SCREENSHOT_DIR}" \
      --env runId="${TIMESTAMP}" \
      "${WRAPPER}"
    ;;

  *)
    echo "error: unknown platform '${PLATFORM}'. use 'ios' or 'android'" >&2
    exit 1
    ;;
esac

echo ""
echo "screenshots saved to: ${SCREENSHOT_DIR}"
