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
echo "   Option A - Simulator (Verify persistence only):"
echo "   -----------------------------------------------"
echo "   ⚠️  NOTE: Simulator does NOT test backup/restore!"
echo "   ⚠️  Deleting the app from simulator deletes its data."
echo "   ⚠️  Use Option B (real device) to test actual backup/restore."
echo ""
echo "   This option only verifies data persists across app restarts:"
echo "   1. Run app on iOS Simulator"
echo "   2. Add some favorites/labels"
echo "   3. Close and restart the app (don't delete it)"
echo "   4. Check Metro logs on restart - you should see:"
echo "      • '[Redux Persist] Rehydration complete'"
echo "      • '[Redux Persist] Favorites count: X' (where X > 0)"
echo "      • '[Redux Persist] Labels: Y' (if you added labels)"
echo "   5. Verify favorites/labels are still visible in the UI"
echo ""
echo "   Option B - Real Device (REQUIRED for backup/restore test):"
echo "   ----------------------------------------------------------"
echo "   1. Ensure iCloud Backup is enabled:"
echo "      Settings > [Your Name] > iCloud > iCloud Backup > ON"
echo "   2. Install and use the app, add favorites/labels"
echo "   3. Close and restart app to verify data persists (check logs)"
echo "   4. Force an iCloud backup:"
echo "      Settings > [Your Name] > iCloud > iCloud Backup > Back Up Now"
echo "   5. Delete the app (this deletes local data)"
echo "   6. Reinstall the app from App Store/TestFlight"
echo "   7. Launch app - iCloud will restore the data automatically"
echo "   8. Check Metro logs - should show same counts as step 3"
echo "   9. Verify favorites/labels are visible in the UI"
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
echo "🐛 Debugging Steps if Data Doesn't Restore:"
echo "   ----------------------------------------"
echo "   1. Check Metro/Xcode logs for Redux Persist messages"
echo "   2. Look for migration errors or version mismatches"
echo "   3. Verify AsyncStorage key 'persist:root' exists after backup"
echo "   4. Check if rehydration is completing but state is empty"
echo ""
echo "   To manually inspect AsyncStorage on device:"
echo "   • Install Flipper or React Native Debugger"
echo "   • Use AsyncStorage inspector to see 'persist:root' key"
echo "   • The key should contain your favorites and labels data"
echo ""
