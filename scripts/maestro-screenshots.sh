#!/bin/bash
# generate app store screenshots using Maestro
# usage: ./scripts/maestro-screenshots.sh [ios|android] [device-type]
#
# ios device types:  default (iPhone 17), 6.5inch (iPhone Xs Max), 13inch (iPad Pro 13")
# android device types: default (whatever emulator is booted)

set -e

PLATFORM=${1:-ios}
DEVICE_TYPE=${2:-default}
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
OUTPUT_DIR="screenshots/${PLATFORM}/${DEVICE_TYPE}/${TIMESTAMP}"
SCREENSHOT_DIR="screenshots/maestro/${PLATFORM}"

echo "generating ${PLATFORM} screenshots (${DEVICE_TYPE})..."
mkdir -p "${OUTPUT_DIR}" "${SCREENSHOT_DIR}"

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
    APP_PATH="ios/build/Build/Products/Release-iphonesimulator/goodtags.app"
    if [ ! -d "${APP_PATH}" ]; then
      echo "error: app binary not found at ${APP_PATH}" >&2
      echo "build first with: yarn e2e:build:ios" >&2
      exit 1
    fi
    echo "installing app..."
    xcrun simctl install "${DEVICE_ID}" "${APP_PATH}"

    maestro --device "${DEVICE_ID}" test \
      --output "${OUTPUT_DIR}" \
      --env SCREENSHOT_DIR="${SCREENSHOT_DIR}" \
      e2e/maestro/screenshots.yaml
    ;;

  android)
    # assumes an emulator or device is already running (adb devices)
    maestro test \
      --output "${OUTPUT_DIR}" \
      --env SCREENSHOT_DIR="${SCREENSHOT_DIR}" \
      e2e/maestro/screenshots.yaml
    ;;

  *)
    echo "error: unknown platform '${PLATFORM}'. use 'ios' or 'android'" >&2
    exit 1
    ;;
esac

echo ""
echo "screenshots saved to: ${SCREENSHOT_DIR}"
