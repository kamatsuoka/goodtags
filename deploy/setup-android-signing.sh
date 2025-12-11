#!/bin/bash
set -e

# Android Release Signing Setup Helper
# This script helps you configure release signing for your Android app

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
ANDROID_DIR="$PROJECT_DIR/android"
APP_DIR="$ANDROID_DIR/app"
KEYSTORE_FILE="$APP_DIR/goodtags-release.keystore"
KEYSTORE_PROPS="$ANDROID_DIR/keystore.properties"
GITIGNORE="$PROJECT_DIR/.gitignore"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Android Release Signing Setup${NC}"
echo -e "${GREEN}========================================${NC}"

# Check if already configured
if [ -f "$KEYSTORE_FILE" ] && [ -f "$KEYSTORE_PROPS" ]; then
  echo -e "${YELLOW}Release signing appears to already be configured.${NC}"
  echo -e "Keystore: $KEYSTORE_FILE"
  echo -e "Properties: $KEYSTORE_PROPS"
  echo -e "\nDo you want to reconfigure? (y/N)"
  read -r response
  if [[ ! "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
    echo "Aborted."
    exit 0
  fi
fi

echo -e "\n${BLUE}This script will help you set up release signing for your Android app.${NC}"
echo -e "${YELLOW}You'll need to remember the passwords you create!${NC}\n"

# Step 1: Generate keystore
echo -e "${GREEN}Step 1: Generate Release Keystore${NC}"
echo -e "Creating keystore at: $KEYSTORE_FILE\n"

if [ -f "$KEYSTORE_FILE" ]; then
  echo -e "${YELLOW}Warning: Keystore already exists. Overwrite? (y/N)${NC}"
  read -r response
  if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
    rm "$KEYSTORE_FILE"
  else
    echo "Using existing keystore."
  fi
fi

if [ ! -f "$KEYSTORE_FILE" ]; then
  keytool -genkeypair -v \
    -storetype PKCS12 \
    -keystore "$KEYSTORE_FILE" \
    -alias goodtags-release \
    -keyalg RSA \
    -keysize 2048 \
    -validity 10000
  
  echo -e "\n${GREEN}✓ Keystore created successfully${NC}"
else
  echo -e "${GREEN}✓ Using existing keystore${NC}"
fi

# Step 2: Create keystore.properties
echo -e "\n${GREEN}Step 2: Create keystore.properties${NC}"

# Extract info from keystore
KEYSTORE_NAME=$(basename "$KEYSTORE_FILE")

echo -e "Enter your keystore password:"
read -s STORE_PASSWORD
echo -e "Enter your key password (or press Enter if same as keystore password):"
read -s KEY_PASSWORD
if [ -z "$KEY_PASSWORD" ]; then
  KEY_PASSWORD="$STORE_PASSWORD"
fi

# Create properties file
cat > "$KEYSTORE_PROPS" << EOF
storePassword=$STORE_PASSWORD
keyPassword=$KEY_PASSWORD
keyAlias=goodtags-release
storeFile=$KEYSTORE_NAME
EOF

echo -e "${GREEN}✓ Created keystore.properties${NC}"

# Step 3: Update .gitignore
echo -e "\n${GREEN}Step 3: Update .gitignore${NC}"

GITIGNORE_ENTRIES="
# Android release signing
android/keystore.properties
android/app/*.keystore
!android/app/debug.keystore
"

if grep -q "android/keystore.properties" "$GITIGNORE" 2>/dev/null; then
  echo -e "${GREEN}✓ .gitignore already configured${NC}"
else
  echo "$GITIGNORE_ENTRIES" >> "$GITIGNORE"
  echo -e "${GREEN}✓ Updated .gitignore${NC}"
fi

# Step 4: Check build.gradle configuration
echo -e "\n${GREEN}Step 4: Updating build.gradle configuration${NC}"

BUILD_GRADLE="$APP_DIR/build.gradle"

if grep -q "keystoreProperties" "$BUILD_GRADLE"; then
  echo -e "${GREEN}✓ build.gradle already configured for release signing${NC}"
else
  echo -e "Running automatic configuration..."
  node "$SCRIPT_DIR/update-gradle-signing.js"
  
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ build.gradle updated successfully${NC}"
  else
    echo -e "${YELLOW}⚠ Could not automatically update build.gradle${NC}"
    echo -e "\nPlease update ${BUILD_GRADLE} manually"
    echo -e "See scripts/ANDROID_DEPLOYMENT.md for instructions"
  fi
fi

# Summary
echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}Setup Complete!${NC}"
echo -e "${GREEN}========================================${NC}"

echo -e "\n${YELLOW}Important:${NC}"
echo -e "1. ${RED}BACKUP YOUR KEYSTORE AND PASSWORDS!${NC}"
echo -e "   Keystore: $KEYSTORE_FILE"
echo -e "   Store in a secure location (password manager, encrypted backup)"
echo -e ""
echo -e "2. ${YELLOW}NEVER commit keystore.properties to git${NC}"
echo -e "   It's been added to .gitignore"
echo -e ""
echo -e "3. If build.gradle needs updates, follow the instructions above"
echo -e ""
echo -e "4. Test your release build:"
echo -e "   ${BLUE}cd android && ./gradlew assembleRelease${NC}"
echo -e ""
echo -e "5. Deploy to Play Store:"
echo -e "   ${BLUE}yarn deploy:android${NC}"

echo -e "\n${GREEN}Next Steps:${NC}"
echo -e "Run: ${BLUE}yarn deploy:android${NC} to build your release AAB"
