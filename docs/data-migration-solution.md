# Data Migration Solution for goodtags

## Problem Summary

User data in the goodtags app was not being migrated when users got new phones because:

1. **Android**: Backup was explicitly disabled (`android:allowBackup="false"`)
2. **iOS**: AsyncStorage backup setting was correct but may not be reliable
3. **No comprehensive backup solution**: The app only had limited export/import for favorites and labels
4. **Storage location issues**: Some data might be stored in locations not included in system backups

## Solution Implemented

### 1. Android Backup Configuration

**Fixed AndroidManifest.xml:**
- Changed `android:allowBackup="false"` to `android:allowBackup="true"`
- Added `android:fullBackupContent="@xml/backup_rules"`
- Added `android:dataExtractionRules="@xml/data_extraction_rules"` for Android 12+

**Created backup configuration files:**
- `android/app/src/main/res/xml/backup_rules.xml` - Defines what gets backed up
- `android/app/src/main/res/xml/data_extraction_rules.xml` - For Android 12+ cloud backup and device transfer

These ensure that:
- SharedPreferences (AsyncStorage) are included in backups
- Database files are included in backups  
- User files are included in backups
- Cache and temporary files are excluded

### 2. iOS Configuration

**Verified Info.plist settings:**
- `RCTAsyncStorageExcludeFromBackup` is set to `false`, ensuring AsyncStorage is included in iCloud/iTunes backups

### 3. Comprehensive App Data Backup System

**New module: `src/modules/dataMigration.ts`**

Features implemented:
- **Full app backup**: Creates JSON backup of complete Redux state
- **Backup sharing**: Users can share backup files via email, cloud storage, etc.
- **Restore functionality**: Can restore complete app state from backup files
- **Backup reminders**: Periodic reminders to create backups
- **Backward compatibility**: Can still import legacy favorites-only exports

**Enhanced DataScreen functionality:**
- Added "create full backup" option
- Enhanced import to handle both legacy favorites and full app backups
- Better user feedback and error handling

**App-level backup reminders:**
- Automatic reminder every 30 days
- Triggered after app startup
- Non-intrusive but encourages good backup habits

## User Experience Improvements

### For New Users:
- Will be reminded to create backup within 30 days
- System-level backups now work properly on both platforms

### For Existing Users:
- Can create comprehensive backups manually
- Enhanced import/export in Data screen
- Automatic migration reminder after 30 days

### When Getting New Device:
- **Option 1**: Restore from system backup (now works properly)
- **Option 2**: Import previously created full app backup
- **Option 3**: Import legacy favorites export (backward compatible)

## Technical Details

### What Gets Backed Up:

**System-level backups now include:**
- AsyncStorage (Redux persist data)
- SQLite databases
- User files
- App preferences

**Manual app backups include:**
- Complete Redux state (favorites, labels, search history, preferences)
- Metadata (timestamp, platform, app version)
- Version information for future migration compatibility

### File Locations:

**Android:**
- Backups: `Download/goodtags-backups/`
- Uses Android Auto Backup and backup transport

**iOS:**
- Backups: `Documents/goodtags-backups/`
- Included in iCloud/iTunes backups automatically

## Testing Recommendations

To verify the solution works:

1. **System backup test:**
   - Set up app with favorites/labels on Device A
   - Create system backup
   - Restore to Device B
   - Verify data appears

2. **Manual backup test:**
   - Create full backup in app
   - Fresh install on new device
   - Import backup file
   - Verify complete restoration

3. **Reminder system test:**
   - Fresh install
   - Wait 30 days or modify reminder logic for testing
   - Verify reminder appears

## Migration Path

For users upgrading to this fixed version:
1. No action required - system backups will work going forward
2. Optionally create manual backup for extra safety
3. Future device migrations will work properly

This solution provides both automatic system-level backup restoration and user-controlled comprehensive backup options, ensuring users never lose their data when getting new devices.
