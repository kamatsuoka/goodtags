# Data migration for goodtags

## Problem Summary

User data in the goodtags app was not being migrated when users got new phones because:

1. **Android**: Backup was explicitly disabled (`android:allowBackup="false"`)
1. **iOS**: AsyncStorage backup setting was correct but may not be reliable

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
