# 🚀 App Deployment Guide

Automated deployment scripts for both iOS (App Store) and Android (Google Play).

## Quick Start

### iOS Deployment
```bash
yarn deploy:ios
```

### Android Deployment
```bash
# First time only: Set up release signing
yarn setup:android-signing

# Then deploy
yarn deploy:android
```

## 📱 Platform-Specific Guides

- **[iOS Deployment](./IOS_DEPLOYMENT.md)** - Detailed iOS App Store deployment instructions
- **[Android Deployment](./ANDROID_DEPLOYMENT.md)** - Detailed Google Play deployment instructions

## 📋 Available Commands

### Version Management

| Command | Description |
|---------|-------------|
| `yarn bump-package-version patch` | Bump patch version in package.json (4.0.1 → 4.0.2) |
| `yarn bump-package-version minor` | Bump minor version in package.json (4.0.1 → 4.1.0) |
| `yarn bump-package-version major` | Bump major version in package.json (4.0.1 → 5.0.0) |
| `yarn bump-ios-version` | Sync version from package.json + bump iOS build number |
| `yarn bump-android-version` | Bump Android version code |

### iOS Commands

| Command | Description |
|---------|-------------|
| `yarn deploy:ios` | Full iOS deployment (auto-bumps build + uploads) |

### Android Commands

| Command | Description |
|---------|-------------|
| `yarn deploy:android` | Full Android deployment (auto-bumps versionCode + builds AAB) |
| `./deploy/deploy-android.sh --apk` | Build APK instead of AAB (for testing) |
| `yarn setup:android-signing` | Set up release signing (first-time setup) |

## 🔄 Typical Workflows

### Regular Deployment (Most Common)

**iOS:**
```bash
yarn deploy:ios  # Auto-bumps build number and uploads
```

**Android:**
```bash
yarn deploy:android  # Auto-bumps versionCode and builds AAB
```

### Release New Marketing Version

```bash
# 1. Bump marketing version in package.json
yarn bump-package-version patch  # or minor/major

# 2. Deploy to iOS (syncs version from package.json)
yarn deploy:ios

# 3. Deploy to Android
yarn deploy:android
```

### Testing Locally

**iOS:**
```bash
# Build and test in simulator
yarn ios
```

**Android:**
```bash
# Build APK and install on device
yarn deploy:android --apk
adb install -r android/app/build/outputs/apk/release/app-release.apk
```

## 📊 Version Tracking

The app uses consistent versioning across platforms:

| Platform | Version Name | Build Number | Source |
|----------|--------------|--------------|--------|
| **iOS** | MARKETING_VERSION (e.g., "4.0.1") | CURRENT_PROJECT_VERSION (e.g., 104) | package.json → project.pbxproj |
| **Android** | versionName (e.g., "4.0.1") | versionCode (e.g., 1) | package.json → build.gradle |

- **Version Name** (4.0.1) = User-facing version, synced via `package.json`
- **Build Numbers** = Platform-specific, auto-incremented with each build

## ⚙️ First-Time Setup

### iOS Setup

1. **Xcode Configuration:**
   - Open Xcode and sign in with your Apple ID
   - Ensure "Automatically manage signing" is enabled
   - Verify your Team ID is set

2. **Optional - App Store Connect API:**
   - Create API key in App Store Connect
   - Set environment variables (see [DEPLOYMENT.md](./DEPLOYMENT.md))

### Android Setup

1. **Generate Release Keystore:**
   ```bash
   yarn setup:android-signing
   ```
   This will:
   - Generate a release keystore
   - Create keystore.properties
   - Update .gitignore
   - Provide instructions for build.gradle updates

2. **🔐 CRITICAL:** Back up your keystore and passwords!
   - Store in a secure password manager
   - Keep an encrypted backup
   - If lost, you cannot update your app on Google Play

## 🛠️ Manual Steps After Automated Build

### iOS
After `yarn deploy:ios` completes:
- If automatic upload fails, use Xcode Organizer or Transporter app
- Submit for review in App Store Connect
- Configure release details and screenshots

### Android
After `yarn deploy:android` completes:
1. Go to [Google Play Console](https://play.google.com/console)
2. Select your app
3. Choose a testing track or production
4. Upload the AAB file from `android/app/build/outputs/bundle/release/app-release.aab`
5. Add release notes and submit

## 🐛 Troubleshooting

### iOS Build Fails
```bash
cd ios
pod deintegrate
pod install
rm -rf build/
rm -rf ~/Library/Developer/Xcode/DerivedData/goodtags-*
```

### Android Build Fails
```bash
cd android
./gradlew clean
rm -rf .gradle build app/build
```

### Signing Issues

**iOS:** Check Xcode → Settings → Accounts → Manage Certificates

**Android:** Verify keystore exists and properties are correct
```bash
ls -la android/app/*.keystore
cat android/keystore.properties
```

## 📝 Best Practices

1. ✅ **Test locally before deploying**
2. ✅ **Use semantic versioning** (major.minor.patch)
3. ✅ **Commit version bumps to git**
4. ✅ **Tag releases:**
   ```bash
   git tag -a v4.0.2 -m "Version 4.0.2"
   git push origin v4.0.2
   ```
5. ✅ **Use TestFlight (iOS) and Internal Testing (Android)** for beta testing
6. ✅ **Keep keystores and signing certificates backed up securely**
7. ✅ **Monitor crash reports** after releases

## 📚 Resources

### iOS
- [App Store Connect](https://appstoreconnect.apple.com/)
- [TestFlight](https://developer.apple.com/testflight/)
- [App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)

### Android
- [Google Play Console](https://play.google.com/console)
- [Publishing Overview](https://developer.android.com/studio/publish)
- [App Signing](https://developer.android.com/studio/publish/app-signing)

## 🆘 Need Help?

See platform-specific guides:
- [iOS Deployment Guide](./DEPLOYMENT.md)
- [Android Deployment Guide](./ANDROID_DEPLOYMENT.md)
