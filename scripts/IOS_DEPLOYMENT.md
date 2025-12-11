# iOS Deployment Automation

This directory contains scripts to automate the iOS app deployment process.

## Quick Start

### One-Command Deployment

```bash
yarn deploy:ios
```

This will:
1. ✅ Bump the build number automatically
2. ✅ Clean previous builds
3. ✅ Install CocoaPods dependencies
4. ✅ Archive the app
5. ✅ Export the IPA
6. ✅ Upload to App Store Connect (if configured)

## Available Scripts

### 1. Bump Build Number Only

```bash
yarn bump-ios-build
```

Increments `CURRENT_PROJECT_VERSION` (e.g., 104 → 105)

### 2. Bump Version and Build Number

```bash
# Patch version (4.0.1 → 4.0.2)
yarn bump-ios-version patch

# Minor version (4.0.1 → 4.1.0)
yarn bump-ios-version minor

# Major version (4.0.1 → 5.0.0)
yarn bump-ios-version major
```

This updates both:
- `package.json` version
- `MARKETING_VERSION` in project.pbxproj
- `CURRENT_PROJECT_VERSION` in project.pbxproj

### 3. Deploy with Custom Options

```bash
# Deploy with version bump
./scripts/deploy-ios.sh --bump patch

# Deploy without bumping build number
./scripts/deploy-ios.sh --skip-bump
```

## Setup for Automatic Upload

To enable automatic upload to App Store Connect, you need to configure App Store Connect API credentials.

### Option 1: Using App Store Connect API (Recommended)

1. **Create an API Key:**
   - Go to [App Store Connect](https://appstoreconnect.apple.com/)
   - Users and Access → Keys → App Store Connect API
   - Click "+" to generate a new key
   - Give it "Admin" or "App Manager" role
   - Download the `.p8` file

2. **Set Environment Variables:**

   Add to your `~/.bash_profile` or `~/.zshrc`:

   ```bash
   export APP_STORE_API_KEY="YOUR_KEY_ID"
   export APP_STORE_API_ISSUER="YOUR_ISSUER_ID"
   export APP_STORE_API_KEY_PATH="/path/to/AuthKey_XXXXX.p8"
   ```

3. **Reload your shell:**
   ```bash
   source ~/.bash_profile  # or ~/.zshrc
   ```

### Option 2: Manual Upload

If automatic upload fails or you prefer manual upload:

1. **Using Xcode Organizer:**
   - Open Xcode
   - Window → Organizer → Archives
   - Select the archive and click "Distribute App"

2. **Using Transporter App:**
   - Download Transporter from the Mac App Store
   - Drag and drop the IPA file: `ios/build/ipa/goodtags.ipa`

## Troubleshooting

### Build Fails

1. **Clean build folders:**
   ```bash
   cd ios
   rm -rf build/
   rm -rf ~/Library/Developer/Xcode/DerivedData/goodtags-*
   ```

2. **Reinstall pods:**
   ```bash
   cd ios
   pod deintegrate
   pod install
   ```

### Signing Issues

1. Make sure you're logged into Xcode with your Apple ID:
   - Xcode → Settings → Accounts

2. Check your provisioning profiles:
   - Xcode → Settings → Accounts → Your Apple ID → Manage Certificates

3. In the project settings, ensure "Automatically manage signing" is enabled

### Upload Fails

If the automated upload fails, the script will provide the IPA location for manual upload.

## Workflow Example

### Releasing a New Patch Version

```bash
# 1. Bump to new version (e.g., 4.0.1 → 4.0.2)
yarn bump-ios-version patch

# 2. Deploy (build number will be auto-incremented)
yarn deploy:ios
```

### Releasing Without Version Change

```bash
# Just deploy with incremented build number
yarn deploy:ios
```

## What Gets Modified

- `package.json` - version field (only if using `--bump`)
- `ios/goodtags.xcodeproj/project.pbxproj`:
  - `MARKETING_VERSION` (e.g., "4.0.1") - only if using `--bump`
  - `CURRENT_PROJECT_VERSION` (e.g., "104" → "105") - always

## Tips

1. **Always test locally first** before deploying
2. **Commit version bumps** to git after deployment
3. **Tag releases** in git:
   ```bash
   git tag -a v4.0.2 -m "Version 4.0.2"
   git push origin v4.0.2
   ```
4. Use **TestFlight** for beta testing before production release
