#!/bin/bash
set -e

# iOS App Store Deployment Script
# This script automates the entire process of building and uploading to App Store Connect

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
IOS_DIR="$PROJECT_DIR/ios"
SCHEME="goodtags"
WORKSPACE="$IOS_DIR/goodtags.xcworkspace"
ARCHIVE_PATH="$IOS_DIR/build/goodtags.xcarchive"
EXPORT_PATH="$IOS_DIR/build/ipa"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Parse arguments
SKIP_BUMP=false
VERSION_BUMP=""

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
    *)
      echo -e "${RED}Unknown option: $1${NC}"
      echo "Usage: $0 [--skip-bump] [--bump patch|minor|major]"
      exit 1
      ;;
  esac
done

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}iOS App Store Deployment${NC}"
echo -e "${GREEN}========================================${NC}"

# Step 1: Bump build number (and optionally version)
if [ "$SKIP_BUMP" = false ]; then
  echo -e "\n${YELLOW}Step 1: Bumping build number...${NC}"
  if [ -n "$VERSION_BUMP" ]; then
    node "$SCRIPT_DIR/bump-ios-build.js" "$VERSION_BUMP"
  else
    node "$SCRIPT_DIR/bump-ios-build.js"
  fi
else
  echo -e "\n${YELLOW}Step 1: Skipping build number bump${NC}"
fi

# Step 2: Clean previous builds
echo -e "\n${YELLOW}Step 2: Cleaning previous builds...${NC}"
rm -rf "$ARCHIVE_PATH"
rm -rf "$EXPORT_PATH"
xcodebuild clean \
  -workspace "$WORKSPACE" \
  -scheme "$SCHEME" \
  -configuration Release

# Step 3: Install/update CocoaPods
echo -e "\n${YELLOW}Step 3: Installing CocoaPods dependencies...${NC}"
cd "$IOS_DIR"
pod install

# Step 4: Archive the app
echo -e "\n${YELLOW}Step 4: Archiving the app (this may take a while)...${NC}"
xcodebuild archive \
  -workspace "$WORKSPACE" \
  -scheme "$SCHEME" \
  -configuration Release \
  -archivePath "$ARCHIVE_PATH" \
  -allowProvisioningUpdates \
  CODE_SIGN_STYLE=Automatic \
  | xcpretty || xcodebuild archive \
    -workspace "$WORKSPACE" \
    -scheme "$SCHEME" \
    -configuration Release \
    -archivePath "$ARCHIVE_PATH" \
    -allowProvisioningUpdates \
    CODE_SIGN_STYLE=Automatic

if [ ! -d "$ARCHIVE_PATH" ]; then
  echo -e "${RED}Archive failed!${NC}"
  exit 1
fi

echo -e "${GREEN}✓ Archive created successfully${NC}"

# Step 5: Export the IPA
echo -e "\n${YELLOW}Step 5: Exporting IPA...${NC}"
xcodebuild -exportArchive \
  -archivePath "$ARCHIVE_PATH" \
  -exportPath "$EXPORT_PATH" \
  -exportOptionsPlist "$SCRIPT_DIR/ExportOptions.plist" \
  -allowProvisioningUpdates \
  | xcpretty || xcodebuild -exportArchive \
    -archivePath "$ARCHIVE_PATH" \
    -exportPath "$EXPORT_PATH" \
    -exportOptionsPlist "$SCRIPT_DIR/ExportOptions.plist" \
    -allowProvisioningUpdates

if [ ! -f "$EXPORT_PATH/$SCHEME.ipa" ]; then
  echo -e "${RED}Export failed!${NC}"
  exit 1
fi

echo -e "${GREEN}✓ IPA exported successfully${NC}"

# Step 6: Upload to App Store Connect
echo -e "\n${YELLOW}Step 6: Uploading to App Store Connect...${NC}"
xcrun altool --upload-app \
  --type ios \
  --file "$EXPORT_PATH/$SCHEME.ipa" \
  --apiKey "$APP_STORE_API_KEY" \
  --apiIssuer "$APP_STORE_API_ISSUER" \
  || echo -e "${YELLOW}Note: Upload failed. You may need to configure API keys or use Application Loader.${NC}"

echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}Deployment Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "Archive: ${ARCHIVE_PATH}"
echo -e "IPA: ${EXPORT_PATH}/${SCHEME}.ipa"
echo -e "\nIf automatic upload failed, you can manually upload using:"
echo -e "1. Xcode → Window → Organizer → Archives"
echo -e "2. Or use Transporter app with the IPA file"
