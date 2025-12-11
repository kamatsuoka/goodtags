# Android Deployment Automation

This directory contains scripts to automate the Android app deployment process for Google Play Store.

## Quick Start

### One-Command Deployment

```bash
yarn deploy:android
```

This will:
1. ✅ Bump the versionCode automatically
2. ✅ Clean previous builds
3. ✅ Build the release AAB (Android App Bundle)
4. ✅ Provide upload instructions

## Available Scripts

### 1. Deploy to Play Store (Recommended)

```bash
yarn deploy:android
```

This automatically:
- Bumps `versionCode` in build.gradle
- Builds the release AAB
- Provides upload instructions

### 2. Build APK for Testing

```bash
./deploy/deploy-android.sh --apk
```

Builds an APK instead of AAB, useful for local testing.

### 3. Bump Package Version (Infrequent)

```bash
# Patch version (4.0.1 → 4.0.2)
yarn bump-package-version patch

# Minor version (4.0.1 → 4.1.0)
yarn bump-package-version minor

# Major version (4.0.1 → 5.0.0)
yarn bump-package-version major
```

This only updates `package.json` version.

### 4. Manually Bump Android Version (Rare)

```bash
yarn bump-android-version
```

This bumps the versionCode.
Normally you don't need this since `deploy:android` does it automatically.

## 🔐 Setup: Release Signing (Required for Production)

Before you can deploy to Google Play, you need to set up release signing. Currently, your app uses debug signing for releases.

### Step 1: Generate a Release Keystore

```bash
cd android/app
keytool -genkeypair -v \
  -storetype PKCS12 \
  -keystore goodtags-release.keystore \
  -alias goodtags-release \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000
```

You'll be asked for:
- Keystore password (REMEMBER THIS!)
- Key password (REMEMBER THIS!)
- Your name, organization, etc.

**⚠️ CRITICAL:** Back up this keystore file and passwords securely! If you lose them, you cannot update your app on Google Play.

### Step 2: Create Keystore Properties File

Create `android/keystore.properties`:

```properties
storePassword=YOUR_KEYSTORE_PASSWORD
keyPassword=YOUR_KEY_PASSWORD
keyAlias=goodtags-release
storeFile=goodtags-release.keystore
```

**⚠️ SECURITY:** Add this file to `.gitignore`! Never commit it to git.

### Step 3: Update build.gradle

Add to `android/app/build.gradle` (before `android {`):

```gradle
// Load keystore properties
def keystorePropertiesFile = rootProject.file("keystore.properties")
def keystoreProperties = new Properties()
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}
```

Then update the `signingConfigs` section:

```gradle
signingConfigs {
    debug {
        storeFile file('debug.keystore')
        storePassword 'android'
        keyAlias 'androiddebugkey'
        keyPassword 'android'
    }
    release {
        if (keystorePropertiesFile.exists()) {
            storeFile file(keystoreProperties['storeFile'])
            storePassword keystoreProperties['storePassword']
            keyAlias keystoreProperties['keyAlias']
            keyPassword keystoreProperties['keyPassword']
        }
    }
}
```

And update the `release` buildType:

```gradle
buildTypes {
    debug {
        signingConfig signingConfigs.debug
    }
    release {
        signingConfig signingConfigs.release  // Changed from debug
        minifyEnabled enableProguardInReleaseBuilds
        proguardFiles getDefaultProguardFile("proguard-android.txt"), "proguard-rules.pro"
    }
}
```

### Step 4: Update .gitignore

Add to `.gitignore`:

```
# Release keystore
android/keystore.properties
android/app/*.keystore
!android/app/debug.keystore
```

## 📤 Uploading to Google Play

After running `yarn deploy:android`, you'll have an AAB file at:
```
android/app/build/outputs/bundle/release/app-release.aab
```

### Manual Upload

1. Go to [Google Play Console](https://play.google.com/console)
2. Select your app
3. Choose a track:
   - **Internal testing** - Quick testing with small group
   - **Closed testing** - Beta testing with invited testers
   - **Open testing** - Public beta
   - **Production** - Live release
4. Click "Create new release"
5. Upload the AAB file
6. Add release notes
7. Review and roll out

### Automated Upload (Optional)

You can use the Gradle Play Publisher plugin for automated uploads:

1. Set up Google Play API access
2. Add the plugin to `android/app/build.gradle`
3. Use: `cd android && ./gradlew publishBundle`

See: https://github.com/Triple-T/gradle-play-publisher

## 📋 Version Management

### Android Versioning

- **versionName**: User-facing version (e.g., "4.0.1") - read from `package.json`
- **versionCode**: Internal build number (e.g., 1, 2, 3...) - must increase with each release

### Best Practices

1. **Increment versionCode for every release** (even if versionName doesn't change)
2. **Use semantic versioning** for versionName (major.minor.patch)
3. **Keep iOS and Android versionNames in sync** (via package.json)

## 🚀 Workflow Examples

### Regular Release (Most Common)

```bash
# Auto-increments versionCode and builds
yarn deploy:android
```

### New Marketing Version Release

```bash
# 1. Bump package version (4.0.1 → 4.0.2)
yarn bump-package-version patch

# 2. Build and deploy
yarn deploy:android
```

### Testing Local Build

```bash
# Build APK for testing
yarn deploy:android --apk

# Install on connected device
adb install -r android/app/build/outputs/apk/release/app-release.apk
```

## 🔧 Troubleshooting

### Build Fails

1. **Clean everything:**
   ```bash
   cd android
   ./gradlew clean
   rm -rf .gradle build app/build
   ```

2. **Clear global Gradle cache:**
   ```bash
   rm -rf ~/.gradle/caches/
   ```

### Signing Errors

1. **Verify keystore exists:**
   ```bash
   ls -la android/app/*.keystore
   ```

2. **Check keystore.properties:**
   ```bash
   cat android/keystore.properties
   ```

3. **Test keystore:**
   ```bash
   keytool -list -v -keystore android/app/goodtags-release.keystore
   ```

### Upload Rejected

- **Make sure versionCode is higher** than the previous release
- **Check signing key** - must use the same key as the original upload
- **Review Google Play policies** - ensure compliance

## 📝 What Gets Modified

When running `yarn deploy:android`:
- `android/app/build.gradle` - versionCode (always auto-incremented)

When running `yarn bump-package-version`:
- `package.json` - version field (marketing version)

## 🎯 Tips

1. **Always test locally first** before uploading to Play Store
2. **Use Internal Testing track** for initial validation
3. **Keep keystore backup** in a secure location (password manager, encrypted drive)
4. **Tag releases in git:**
   ```bash
   git tag -a v4.0.2-android -m "Android version 4.0.2"
   git push origin v4.0.2-android
   ```
5. **Monitor crash reports** in Google Play Console after release

## 🔗 Resources

- [Google Play Console](https://play.google.com/console)
- [Publishing Overview](https://developer.android.com/studio/publish)
- [App Signing](https://developer.android.com/studio/publish/app-signing)
- [Android App Bundle](https://developer.android.com/guide/app-bundle)
