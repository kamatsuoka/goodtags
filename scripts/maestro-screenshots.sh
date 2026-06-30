#!/bin/bash
# generate app store screenshots using Maestro
# usage: ./scripts/maestro-screenshots.sh [ios|android] [device-type] [fragment...]
#
# ios device types:   default (iPhone 17), small (iPhone 13 mini), large (iPad Pro 13") (note: iPad not working as of June 2026)
# android device types: default (Pixel 9), small (Pixel 7 API 33), large (Pixel 9 Pro XL API 36), xlarge (Pixel Tablet API 36), device (connected USB device)
# fragment: one or more fragment files under e2e/maestro/;
# all fragments are combined into a single wrapper with app launch

set -e

PLATFORM=${1:-ios}
DEVICE_TYPE=${2:-default}
shift $(( $# < 2 ? $# : 2 ))
BUILD_TYPE=${BUILD_TYPE:-release}
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
OUTPUT_DIR="screenshots/${PLATFORM}/${BUILD_TYPE}/${DEVICE_TYPE}/${TIMESTAMP}"
SCREENSHOT_DIR="screenshots/maestro/${PLATFORM}/${BUILD_TYPE}"

echo "generating ${PLATFORM} screenshots (${DEVICE_TYPE})..."
mkdir -p "${OUTPUT_DIR}" "${SCREENSHOT_DIR}"

if [ $# -eq 0 ]; then
  # no fragments — run screenshots.yaml directly
  FLOW_FILE="$(pwd)/e2e/maestro/screenshots.yaml"
else
  # build a wrapper that launches the app then runs each fragment with a SEQ number
  FLOW_FILE=$(mktemp /tmp/maestro-wrapper-XXXXXX.yaml)
  {
    echo "appId: com.fogcitysingers.goodtags"
    echo "---"
    echo "- launchApp:"
    echo "    clearState: true"
    echo "- waitForAnimationToEnd"
    echo "- tapOn:"
    echo "    id: welcome_forward_button"
    echo "- assertVisible:"
    echo "    id: home_container"
    SEQ_NUM=0
    for FLOW in "$@"; do
      SEQ_NUM=$((SEQ_NUM + 1))
      SEQ=$(printf "%02d" $SEQ_NUM)
      echo "- runFlow:"
      echo "    file: $(pwd)/e2e/maestro/${FLOW}"
      echo "    env:"
      echo "        SEQ: ${SEQ}"
    done
  } > "${FLOW_FILE}"
fi

case "${PLATFORM}" in
  ios)
    case "${DEVICE_TYPE}" in
      "large")  DEVICE_NAME="iPad Pro 13-inch (M5)" ;;
      "small") DEVICE_NAME="iPhone 13 mini" ;;
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
      echo "build first with: yarn ios (debug) or yarn ios:release" >&2
      exit 1
    fi
    echo "installing app..."
    xcrun simctl install "${DEVICE_ID}" "${APP_PATH}"

    # pre-grant all permissions so iOS doesn't show system dialogs on first launch
    xcrun simctl privacy "${DEVICE_ID}" grant all com.fogcitysingers.goodtags

    maestro --device "${DEVICE_ID}" test \
      --output "${OUTPUT_DIR}" \
      --env SCREENSHOT_DIR="${SCREENSHOT_DIR}" \
      --env runId="${TIMESTAMP}" \
      "${FLOW_FILE}"
    ;;

  android)
    case "${DEVICE_TYPE}" in
      "small")    AVD_NAME="Pixel_7_API_33" ;;
      "large")    AVD_NAME="Pixel_9_Pro_XL_API_36" ;;
      "xlarge")   AVD_NAME="Pixel_Tablet_API_36" ;;
      "device") AVD_NAME="" ;;
      *)          AVD_NAME="Pixel_9" ;;
    esac

    if [ "${DEVICE_TYPE}" = "device" ]; then
      # use the connected device device (non-emulator), ignoring any running emulators
      ANDROID_DEVICE=$(adb devices | grep -v "^List" | grep -v "emulator" | grep "device$" | awk '{print $1}' | head -1)
      if [ -z "${ANDROID_DEVICE}" ]; then
        echo "error: no device Android device found. connect a device with USB debugging enabled." >&2
        exit 1
      fi
      echo "using device device: ${ANDROID_DEVICE}"
      if [ "${BUILD_TYPE}" = "debug" ]; then
        echo "setting up adb reverse for Metro bundler..."
        adb -s "${ANDROID_DEVICE}" reverse tcp:8081 tcp:8081
      fi
    else
      echo "avd: ${AVD_NAME}"

      # boot the correct emulator if needed
      ANDROID_DEVICE=$(adb devices | grep -v "^List" | grep "emulator" | awk '{print $1}' | head -1)
      if [ -n "${ANDROID_DEVICE}" ]; then
        RUNNING_AVD=$(adb -s "${ANDROID_DEVICE}" emu avd name 2>/dev/null | head -1 | tr -d '\r')
      fi

      if [ -z "${ANDROID_DEVICE}" ] || [ "${RUNNING_AVD}" != "${AVD_NAME}" ]; then
        if [ -n "${ANDROID_DEVICE}" ]; then
          echo "running emulator is '${RUNNING_AVD}', need '${AVD_NAME}' — starting correct emulator..."
        else
          echo "starting emulator ${AVD_NAME}..."
        fi
        emulator -avd "${AVD_NAME}" -no-audio -no-boot-anim &
        echo "waiting for emulator to boot..."
        # wait for the new emulator specifically
        sleep 3
        ANDROID_DEVICE=$(adb devices | grep -v "^List" | grep "emulator" | awk '{print $1}' | tail -1)
        adb -s "${ANDROID_DEVICE}" wait-for-device
        until [ "$(adb -s "${ANDROID_DEVICE}" shell getprop sys.boot_completed 2>/dev/null)" = "1" ]; do
          sleep 2
        done
        echo "emulator ready"
      else
        echo "using running emulator: ${ANDROID_DEVICE} (${RUNNING_AVD})"
      fi
    fi

    # install APK (required for Maestro's clearState to work)
    case "${BUILD_TYPE}" in
      debug) APK_PATH="android/app/build/outputs/apk/debug/app-debug.apk" ;;
      *)     APK_PATH="android/app/build/outputs/apk/release/app-release.apk" ;;
    esac
    if [ ! -f "${APK_PATH}" ]; then
      echo "error: APK not found at ${APK_PATH}" >&2
      echo "build first with: yarn android (debug) or yarn android:release" >&2
      exit 1
    fi
    echo "installing APK..."
    adb -s "${ANDROID_DEVICE}" uninstall com.fogcitysingers.goodtags 2>/dev/null || true
    adb -s "${ANDROID_DEVICE}" install "${APK_PATH}"

    # Maestro's auto-install of its driver APKs can silently fail on newer API levels.
    # Pre-install them explicitly to ensure gRPC connectivity on tcp:7001.
    if ! adb -s "${ANDROID_DEVICE}" shell pm list packages 2>/dev/null | grep -q "dev.mobile.maestro.test"; then
      echo "installing Maestro driver APKs..."
      MAESTRO_CLIENT_JAR=$(find /opt/homebrew/Cellar/maestro -name "maestro-client.jar" 2>/dev/null | head -1)
      if [ -z "${MAESTRO_CLIENT_JAR}" ]; then
        echo "error: could not find maestro-client.jar; install Maestro via brew" >&2
        exit 1
      fi
      MAESTRO_TMP=$(mktemp -d)
      (cd "${MAESTRO_TMP}" && jar xf "${MAESTRO_CLIENT_JAR}" maestro-app.apk maestro-server.apk)
      adb -s "${ANDROID_DEVICE}" install -r "${MAESTRO_TMP}/maestro-app.apk"
      adb -s "${ANDROID_DEVICE}" install -r "${MAESTRO_TMP}/maestro-server.apk"
      rm -rf "${MAESTRO_TMP}"
    fi

    maestro --device "${ANDROID_DEVICE}" test \
      --output "${OUTPUT_DIR}" \
      --env SCREENSHOT_DIR="${SCREENSHOT_DIR}" \
      --env runId="${TIMESTAMP}" \
      "${FLOW_FILE}"
    ;;

  *)
    echo "error: unknown platform '${PLATFORM}'. use 'ios' or 'android'" >&2
    exit 1
    ;;
esac

echo ""
echo "screenshots saved to: ${SCREENSHOT_DIR}"
