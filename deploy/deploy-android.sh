#!/bin/bash
set -e

# Android Play Store Deployment Script
# This script automates the entire process of building and preparing an AAB for upload

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
ANDROID_DIR="$PROJECT_DIR/android"
APP_DIR="$ANDROID_DIR/app"
BUILD_DIR="$APP_DIR/build/outputs/bundle/release"
AAB_FILE="$BUILD_DIR/app-release.aab"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Parse arguments
SKIP_BUMP=false
VERSION_BUMP=""
BUILD_TYPE="bundle"  # bundle (AAB) or apk

while [[ $# -gt 0 ]]; do
  case $1 in
    --skip-bump)
      SKIP_BUMP=true
      shift
      ;;
    --bump)
      VERSION_BUMP="$2"
      shift 2
      ;;
    --apk)
      BUILD_TYPE="apk"
      shift
      ;;
    *)
      echo -e "${RED}Unknown option: $1${NC}"
      echo "Usage: $0 [--skip-bump] [--bump patch|minor|major] [--apk]"
      exit 1
      ;;
  esac
done

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Android Play Store Deployment${NC}"
echo -e "${GREEN}========================================${NC}"

# Step 1: Bump version code (and optionally version)
if [ "$SKIP_BUMP" = false ]; then
  echo -e "\n${YELLOW}Step 1: Bumping version code...${NC}"
  if [ -n "$VERSION_BUMP" ]; then
    node "$SCRIPT_DIR/bump-android-version.js" "$VERSION_BUMP"
  else
    node "$SCRIPT_DIR/bump-android-version.js"
  fi
else
  echo -e "\n${YELLOW}Step 1: Skipping version code bump${NC}"
fi

# Step 2: Clean previous builds
echo -e "\n${YELLOW}Step 2: Cleaning previous builds...${NC}"
cd "$ANDROID_DIR"
./gradlew clean

# Step 3: Build the release bundle/APK
if [ "$BUILD_TYPE" = "bundle" ]; then
  echo -e "\n${YELLOW}Step 3: Building release AAB (Android App Bundle)...${NC}"
  echo -e "${YELLOW}This may take a few minutes...${NC}"
  ./gradlew bundleRelease
  
  OUTPUT_FILE="$BUILD_DIR/app-release.aab"
  OUTPUT_NAME="AAB"
else
  echo -e "\n${YELLOW}Step 3: Building release APK...${NC}"
  echo -e "${YELLOW}This may take a few minutes...${NC}"
  ./gradlew assembleRelease
  
  OUTPUT_FILE="$APP_DIR/build/outputs/apk/release/app-release.apk"
  OUTPUT_NAME="APK"
fi

if [ ! -f "$OUTPUT_FILE" ]; then
  echo -e "${RED}Build failed! ${OUTPUT_NAME} not found.${NC}"
  exit 1
fi

echo -e "${GREEN}✓ ${OUTPUT_NAME} built successfully${NC}"

# Step 4: Information about the build
echo -e "\n${YELLOW}Step 4: Build information${NC}"
FILE_SIZE=$(du -h "$OUTPUT_FILE" | cut -f1)
echo -e "File: ${OUTPUT_FILE}"
echo -e "Size: ${FILE_SIZE}"

# Show version info
VERSION_NAME=$(grep "version" "$PROJECT_DIR/package.json" | head -1 | sed 's/.*: "\(.*\)".*/\1/')
VERSION_CODE=$(grep "versionCode" "$APP_DIR/build.gradle" | head -1 | sed 's/.*versionCode \([0-9]*\).*/\1/')
echo -e "Version: ${VERSION_NAME} (${VERSION_CODE})"

echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}Build Complete!${NC}"
echo -e "${GREEN}========================================${NC}"

if [ "$BUILD_TYPE" = "bundle" ]; then
  echo -e "\n${YELLOW}Next Steps:${NC}"
  echo -e "1. Go to Google Play Console: https://play.google.com/console"
  echo -e "2. Select your app"
  echo -e "3. Production → Create new release (or Internal testing/Closed testing)"
  echo -e "4. Upload the AAB file: ${OUTPUT_FILE}"
  echo -e "5. Complete the release details and submit for review"
  echo -e "\n${YELLOW}Or use the Google Play Console upload command (if configured):${NC}"
  echo -e "cd android && ./gradlew publishBundle"
else
  echo -e "\n${YELLOW}APK Location:${NC}"
  echo -e "${OUTPUT_FILE}"
  echo -e "\n${YELLOW}Note:${NC} For Play Store, you should use AAB instead of APK."
  echo -e "Run without --apk flag to build an AAB."
fi

echo -e "\n${YELLOW}Optional: Test the build first${NC}"
if [ "$BUILD_TYPE" = "apk" ]; then
  echo -e "adb install -r ${OUTPUT_FILE}"
else
  echo -e "Use bundletool to test the AAB locally:"
  echo -e "bundletool build-apks --bundle=${OUTPUT_FILE} --output=/tmp/app.apks"
  echo -e "bundletool install-apks --apks=/tmp/app.apks"
fi
