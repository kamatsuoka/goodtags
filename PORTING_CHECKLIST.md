# Porting Checklist

This checklist lists important files and folders from the old `goodtags` project to review and (optionally) port into `goodtags-0.81.5`.

**Repo Metadata**
- `LICENSE`
- `CONTRIBUTING.md`
- `.github/` (issue templates, workflows)
- `README.md` (review for docs and badges)

**Linters & Formatters**
- `.eslintrc.js` (diffed — merge carefully)
- `.eslintignore`
- `.prettierrc.js` (diffed), `.prettierignore`
- `.yarnrc.yml` (diffed), `.gitattributes`
- `.vscode/settings.json`, `jsconfig.json`, `.xcode.env`

**App Entry & Bundler**
- `app.json` (app id, display name, icons)
- `index.js`, `App.tsx` (both differed — merge app logic)
- `babel.config.js`, `react-native.config.js`

**iOS (native)**
- `ios/AppDelegate.swift` (platform glue; port changes carefully)
- `ios/LaunchScreen.xib` and `ios/goodtags/Images.xcassets/**` (icons/splash)
- `ios/Podfile`, `ios/Podfile.default` (compare and merge; do NOT copy `Pods/`)
- `ios/fastlane/**` (Appfile, Fastfile, snapshot helpers)

**Android (native)**
- `android/app/goodtags-upload.keystore` (signing)
- `android/app/src/main/java/...` (application classes — `MainActivity`, `MainApplication`, package name)
- `android/app/src/main/res/**` (drawables, `raw/*.mp3`, `values/colors.xml`, `values-*/styles.xml`, `xml/*`)
- `android/app/build.gradle`, `android/build.gradle`, `android/gradle.properties`, `android/settings.gradle` (merge carefully)
- `android/fastlane/**` and `android/link-assets-manifest.json`

**Scripts, Patches & Tooling**
- `scripts/**` (DB scripts, helpers, requirements)
- `patches/**` (local patches applied to node modules)
- `check_appdelegate.sh` (helper script)

**Tests & E2E**
- `e2e/**` (end-to-end tests and configs)
- `__tests__/` (unit tests that differ)
- `ios/goodtagsUITests/`, `ios/goodtagsTests/`

**Docs & Misc**
- `docs/**` — migration notes, FAQ, transitions
- `fastlane/metadata/**` (store listing images and descriptions)
- `out/*` (exported DBs or seed data — copy if required)

Notes
- DO NOT copy `node_modules/`, `Pods/`, `android/.cxx/`, `.git/`, `.mypy_cache/`, `.venv/` or other generated/build artifacts.
- When porting native files (`android/` or `ios/`), compare files and merge changes — don't overwrite blindly. Watch for package/applicationId and signing configs.

Quick dry-run rsync example (preview only):
```
rsync -av --dry-run \
  --exclude='.git/' --exclude='node_modules/' --exclude='Pods/' --exclude='android/.cxx/' --exclude='android/build/' --exclude='ios/Pods/' \
  goodtags/ goodtags-0.81.5/ \
  --include='LICENSE' --include='CONTRIBUTING.md' --include='.github/***' --include='app.json' --include='babel.config.js' --include='index.js' \
  --include='README.md' --include='react-native.config.js' --include='jsconfig.json' \
  --include='ios/AppDelegate.swift' --include='ios/LaunchScreen.xib' --include='ios/goodtags/Images.xcassets/***' --include='ios/Podfile*' --include='ios/fastlane/***' \
  --include='android/app/goodtags-upload.keystore' --include='android/fastlane/***' --include='android/app/src/main/res/***' --include='android/app/src/main/java/***' \
  --include='scripts/***' --include='patches/***' --include='docs/***' \
  --exclude='**'
```

File saved: `goodtags-0.81.5/PORTING_CHECKLIST.md`

If you want, I can run the dry-run for you and show the output or create a PR/patch to copy selected categories.
