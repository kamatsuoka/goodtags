#!/bin/bash
# generate app store screenshots using Maestro
# usage: ./scripts/maestro-screenshots.sh [ios|android] [device-type] [flow]
#
# ios device types:  default (iPhone 17), 6.5inch (iPhone Xs Max), 13inch (iPad Pro 13")
# android device types: default (whatever emulator is booted)
# flow: flow file under e2e/maestro/ (default: screenshots.yaml); fragment files starting with _ are auto-wrapped with app launch

set -e

PLATFORM=${1:-ios}
DEVICE_TYPE=${2:-default}
FLOW=${3:-screenshots.yaml}
BUILD_TYPE=${BUILD_TYPE:-release}
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
OUTPUT_DIR="screenshots/${PLATFORM}/${BUILD_TYPE}/${DEVICE_TYPE}/${TIMESTAMP}"
SCREENSHOT_DIR="screenshots/maestro/${PLATFORM}/${BUILD_TYPE}"

echo "generating ${PLATFORM} screenshots (${DEVICE_TYPE})..."
mkdir -p "${OUTPUT_DIR}" "${SCREENSHOT_DIR}"

# if flow is a fragment (starts with _), wrap it with the standard app launch preamble;
# wrapper is written into e2e/maestro/ so that relative runFlow paths resolve correctly
FLOW_FILE="e2e/maestro/${FLOW}"
if [[ "${FLOW}" == _* ]]; then
  WRAPPER=$(mktemp /tmp/maestro-wrapper-XXXXXX.yaml)
  trap 'rm -f "${WRAPPER}"' EXIT
  FRAGMENT_PATH="$(pwd)/e2e/maestro/${FLOW}"
  printf 'appId: com.fogcitysingers.goodtags\n---\n- launchApp:\n    clearState: true\n- tapOn:\n    id: welcome_forward_button\n- assertVisible:\n    id: home_container\n- runFlow: %s\n' "${FRAGMENT_PATH}" > "${WRAPPER}"
  FLOW_FILE="${WRAPPER}"
fi

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
      "${FLOW_FILE}"
    ;;

  android)
    # assumes an emulator or device is already running (adb devices)
    maestro test \
      --output "${OUTPUT_DIR}" \
      --env SCREENSHOT_DIR="${SCREENSHOT_DIR}" \
      "${FLOW_FILE}"
    ;;

  *)
    echo "error: unknown platform '${PLATFORM}'. use 'ios' or 'android'" >&2
    exit 1
    ;;
esac

echo ""
echo "screenshots saved to: ${SCREENSHOT_DIR}"
