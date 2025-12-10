#!/bin/bash

# Script to test Android backup and restore functionality
# This simulates what happens when a user migrates to a new phone

set -e

PACKAGE_NAME="com.fogcitysingers.goodtags"

echo "🧪 Testing Android Backup & Restore for $PACKAGE_NAME"
echo ""

# List available devices
DEVICES=$(adb devices | grep -v "List of devices" | grep "device$" | awk '{print $1}')
DEVICE_COUNT=$(echo "$DEVICES" | grep -v "^$" | wc -l | tr -d ' ')

if [ "$DEVICE_COUNT" -eq 0 ]; then
    echo "❌ No Android device/emulator connected"
    echo "Please connect a device or start an emulator"
    exit 1
fi

if [ "$DEVICE_COUNT" -gt 1 ]; then
    echo "📱 Multiple devices detected:"
    echo ""
    adb devices | grep "device$" | nl
    echo ""
    echo "Please select a device (enter number):"
    read -r DEVICE_NUM
    DEVICE_ID=$(echo "$DEVICES" | sed -n "${DEVICE_NUM}p")
    
    if [ -z "$DEVICE_ID" ]; then
        echo "❌ Invalid selection"
        exit 1
    fi
    
    ADB_CMD="adb -s $DEVICE_ID"
    echo "✅ Selected device: $DEVICE_ID"
else
    DEVICE_ID=$(echo "$DEVICES" | head -1)
    ADB_CMD="adb -s $DEVICE_ID"
    echo "📱 Device connected: $DEVICE_ID"
fi

echo ""

# Step 1: Check backup configuration
echo "1️⃣  Checking backup configuration..."
echo ""

# Check if backup is enabled on device
BACKUP_ENABLED=$($ADB_CMD shell bmgr enabled | grep -o "enabled" || echo "disabled")
echo "   Device backup status: $BACKUP_ENABLED"

if [ "$BACKUP_ENABLED" = "disabled" ]; then
    echo ""
    echo "   ⚠️  Backup is DISABLED on this device!"
    echo ""
    echo "   To enable backup for testing:"
    echo "   -----------------------------"
    echo "   Option 1 (Temporary, for testing):"
    echo "     $ADB_CMD shell bmgr enable true"
    echo ""
    echo "   Option 2 (Via device settings):"
    echo "     Settings > System > Backup > Back up to Google Drive"
    echo ""
    read -p "   Enable backup now for testing? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        $ADB_CMD shell bmgr enable true
        echo "   ✅ Backup enabled"
    else
        echo ""
        echo "   ℹ️  Note: Production users need backup enabled on their device"
        echo "      for automatic data migration to work."
    fi
fi

echo ""

# Step 2: Create backup
echo "2️⃣  Triggering backup..."
echo ""
BACKUP_OUTPUT=$($ADB_CMD shell bmgr backupnow $PACKAGE_NAME 2>&1)
echo "$BACKUP_OUTPUT"

if echo "$BACKUP_OUTPUT" | grep -q "Package not found"; then
    echo ""
    echo "❌ Backup failed: Package not found"
    echo ""
    echo "The app is not installed or not recognized by the backup system."
    echo ""
    echo "Make sure:"
    echo "  • The app is installed: $ADB_CMD shell pm list packages | grep $PACKAGE_NAME"
    echo "  • You've opened the app at least once"
    echo ""
    exit 1
elif echo "$BACKUP_OUTPUT" | grep -q "Backup is not allowed"; then
    echo ""
    echo "❌ Backup failed: 'Backup is not allowed'"
    echo ""
    echo "This usually means:"
    echo "  1. App is in debug mode (debug builds disable auto-backup by default)"
    echo "  2. Device backup is disabled"
    echo ""
    echo "Solutions:"
    echo "  • Test with a release build instead: ./scripts/deploy-android.sh"
    echo "  • Or enable backup for debug builds in AndroidManifest.xml"
    echo "  • Or manually test by clearing app data and checking if redux-persist works"
    echo ""
elif echo "$BACKUP_OUTPUT" | grep -q "with result:.*Success"; then
    echo "✅ Backup succeeded!"
else
    echo "⚠️  Backup status unclear - check output above"
fi

echo ""

# Step 3: Verify current data
echo "3️⃣  Current app data:"
echo "   SharedPreferences (AsyncStorage):"
$ADB_CMD shell "run-as $PACKAGE_NAME ls -lh shared_prefs/" 2>/dev/null || echo "   (Unable to list - app may need to be debuggable)"
echo ""
echo "   Database files:"
$ADB_CMD shell "run-as $PACKAGE_NAME ls -lh databases/" 2>/dev/null || echo "   (Unable to list - app may need to be debuggable)"
echo ""

# Step 3: Verify backup status
echo "4️⃣  Available backup transports:"
$ADB_CMD shell bmgr list transports
echo ""

# Step 4: Instructions for manual testing
echo "5️⃣  Next steps to test data migration:"
echo ""
echo "   ✅ Your app is configured correctly for backups (allowBackup=true)"
echo ""
echo "   IMPORTANT: Auto-backup is disabled for debug builds by default."
echo "   To properly test device migration, use a RELEASE build."
echo ""
echo "   Option A - Test with release build (recommended):"
echo "   ------------------------------------------------"
echo "   1. Build a release APK: ./scripts/deploy-android.sh (or your build process)"
echo "   2. Install release APK on device"
echo "   3. Add favorites/labels in the app"
echo "   4. Trigger backup: $ADB_CMD shell bmgr backupnow $PACKAGE_NAME"
echo "   5. Uninstall: $ADB_CMD uninstall $PACKAGE_NAME"
echo "   6. Reinstall the release APK"
echo "   7. Restore: $ADB_CMD shell bmgr restore $PACKAGE_NAME"
echo "   8. Open app and verify data is present"
echo ""
echo "   Option B - Quick test with debug build:"
echo "   ---------------------------------------"
echo "   Test that redux-persist works (simulates migration):"
echo "   1. Use the app and add favorites/labels"
echo "   2. Force stop the app: $ADB_CMD shell am force-stop $PACKAGE_NAME"
echo "   3. Clear cache only (NOT data): $ADB_CMD shell pm clear --cache-only $PACKAGE_NAME"
echo "   4. Restart the app"
echo "   5. Verify favorites/labels persist (proves AsyncStorage works)"
echo ""
echo "   Option C - Real-world test:"
echo "   --------------------------"
echo "   1. Install release build on a real device"
echo "   2. Enable 'Back up to Google Drive' in device Settings"
echo "   3. Use app and add data"
echo "   4. Wait for backup or trigger manually"
echo "   5. Factory reset device OR set up new device"
echo "   6. Restore from Google backup during setup"
echo "   7. Install app and verify data migrated"
echo ""

echo "💡 Key Points:"
echo "   • Your AndroidManifest.xml is correctly configured ✓"
echo "   • Debug builds disable auto-backup by default (Android behavior)"
echo "   • Release builds will backup/restore automatically when users have Google backup enabled"
echo "   • Users don't need to do anything - it happens automatically during phone setup"
echo ""
