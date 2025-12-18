#!/bin/bash
# generate ios screenshots for app store using detox
# usage: ./scripts/generate-screenshots.sh [device-type] [--build]

set -e

DEVICE_TYPE=${1:-default}
BUILD=false

# check for --build flag in any argument position
for arg in "$@"; do
  if [ "$arg" = "--build" ]; then
    BUILD=true
  fi
done

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
OUTPUT_DIR="screenshots/ios/${DEVICE_TYPE}/${TIMESTAMP}"

echo "🎬 generating ios screenshots..."
echo "📁 output directory: ${OUTPUT_DIR}"

# create output directory
mkdir -p "${OUTPUT_DIR}"

# ios device configurations for app store
case $DEVICE_TYPE in
  "13inch")
    DEVICE="iPad Pro 13-inch (M5)"
    ;;
  "6.5inch")
    DEVICE="iPhone Xs Max"
    ;;
  *)
    # default: latest standard size
    DEVICE="iPhone 17"
    ;;
esac

echo "📱 device: ${DEVICE}"

# build app if needed
if [ "$BUILD" = true ]; then
  echo "🔨 building ios app..."
  detox build --configuration ios.sim.release
else
  echo "⏭️  skipping build (using existing binary)"
fi

# run screenshot tests
echo "📸 capturing screenshots..."
detox test e2e/screenshots.test.js \
  --configuration ios.sim.release \
  --device-name="${DEVICE}" \
  --artifacts-location "${OUTPUT_DIR}" \
  --cleanup \
  --loglevel info

echo ""
echo "✅ screenshots generated successfully!"
echo "📂 location: ${OUTPUT_DIR}"
echo ""
echo "next steps:"
echo "  1. review screenshots in ${OUTPUT_DIR}"
echo "  2. frame with device bezels (use shotbot or similar tool)"
echo "  3. upload to app store connect"
