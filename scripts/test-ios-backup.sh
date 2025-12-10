#!/bin/bash

# Script to verify iOS backup configuration
# iOS backups happen automatically via iCloud/iTunes

set -e

echo "🧪 Testing iOS Backup Configuration"
echo ""

# Check if we're on macOS
if [[ "$OSTYPE" != "darwin"* ]]; then
    echo "❌ This script requires macOS"
    exit 1
fi

# Check for iOS project
if [ ! -d "ios/goodtags.xcworkspace" ]; then
    echo "❌ iOS project not found"
    exit 1
fi

echo "1️⃣  Checking Info.plist configuration..."
echo ""

# Check RCTAsyncStorageExcludeFromBackup setting
if grep -q "<key>RCTAsyncStorageExcludeFromBackup</key>" ios/goodtags/Info.plist; then
    if grep -A1 "RCTAsyncStorageExcludeFromBackup" ios/goodtags/Info.plist | grep -q "<false/>"; then
        echo "✅ RCTAsyncStorageExcludeFromBackup is set to false (data WILL be backed up)"
    else
        echo "⚠️  RCTAsyncStorageExcludeFromBackup is set to true (data will NOT be backed up)"
    fi
else
    echo "✅ RCTAsyncStorageExcludeFromBackup not set (defaults to false - data WILL be backed up)"
fi

echo ""
echo "2️⃣  Manual Testing Steps:"
echo ""
echo "   Option A - Simulator (Quick check):"
echo "   -----------------------------------"
echo "   1. Run app on iOS Simulator"
echo "   2. Add some favorites/labels"
echo "   3. Delete the app"
echo "   4. Reinstall and launch"
echo "   5. Data should persist (simulator keeps app data between installs)"
echo ""
echo "   Option B - Real Device (Full test):"
echo "   -----------------------------------"
echo "   1. Ensure iCloud Backup is enabled on device (Settings > [Your Name] > iCloud > iCloud Backup)"
echo "   2. Install and use the app, add favorites/labels"
echo "   3. Create a backup:"
echo "      - Settings > [Your Name] > iCloud > iCloud Backup > Back Up Now"
echo "   4. Delete the app"
echo "   5. Restore from iCloud backup (or just reinstall - local data may persist)"
echo "   6. Launch app and verify data is present"
echo ""
echo "   Option C - iTunes/Finder Backup:"
echo "   --------------------------------"
echo "   1. Connect device to Mac"
echo "   2. Open Finder > [Your Device]"
echo "   3. Create backup (unencrypted or encrypted)"
echo "   4. Delete app from device"
echo "   5. Restore from backup"
echo "   6. Verify data is present"
echo ""

echo "💡 Tips:"
echo "   - iOS automatically backs up app data to iCloud (if enabled)"
echo "   - AsyncStorage data is stored in Library/Preferences"
echo "   - You can inspect backup contents using tools like iBackup Viewer"
echo ""
