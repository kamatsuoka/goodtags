# automated screenshot generation

two tools are available: **Maestro** (recommended, iOS + Android) and **Detox** (iOS only, legacy).

---

## Maestro (recommended)

### setup

```bash
brew install maestro
```

### usage

```bash
# ios default device (iPhone 17)
yarn screenshots:ios

# ios app store sizes
yarn screenshots:ios:6.5inch   # iphone xs max
yarn screenshots:ios:13inch    # ipad pro 13"

# android (requires a running emulator or connected device)
yarn screenshots:android

# all sizes — ios 6.5", ios 13", android
yarn screenshots:all
```

### how it works

the flow is defined in [e2e/maestro/screenshots.yaml](maestro/screenshots.yaml). screenshots are saved to `screenshots/[platform]/[size]/[timestamp]/`.

to add or change screenshots, edit that YAML file. available commands: `tapOn`, `assertVisible`, `waitForAnimationToEnd`, `takeScreenshot`. element IDs match `testID` props in the app.

### android setup

start an emulator first:
```bash
emulator -avd Pixel_9_API_35   # or whatever avd you have
```
then run `yarn screenshots:android`.

### troubleshooting

- **element not found**: run `maestro studio` for an interactive inspector
- **wrong device**: check available simulators with `xcrun simctl list devices available`
- **list not loaded**: add a `waitForAnimationToEnd` or `extendedWaitUntil` before the screenshot

---

## Detox (iOS only, legacy)

generate ios app store screenshots automatically using detox e2e tests.

## setup

1. install detox (if not already installed):
```bash
yarn add -D detox
```

2. ensure xcode simulators are set up for required device sizes

## usage

### quick start - single device

```bash
# ios default device
yarn e2e:screenshots:ios
```

### generate all required sizes

```bash
# generates screenshots for all app store required device sizes
yarn e2e:screenshots:all
```

### custom device size

```bash
./scripts/generate-screenshots.sh 13inch   # ipad
./scripts/generate-screenshots.sh 6.5inch  # iphone pro max sizes
```

## output

screenshots are saved to `screenshots/ios/[size]/[timestamp]/[test-name]/` with test-specific filenames:
- `01-welcome-screen/01-welcome-screen.png`
- `02-home-screen/02-home-screen.png`
- `03-popular-tags/03-popular-tags.png`
- `04-search-form/04-search-form.png`

## app store requirements

### ios app store
requires 2 device sizes:
- **13" display** (ipad pro): 2048 x 2732 px
- **6.5" display** (iphone xs max, 11 pro max, 12 pro max, 13 pro max, 14 plus): 1242 x 2688 px

## customization

### add/modify screenshots

edit [e2e/screenshots.test.js](../e2e/screenshots.test.js) to:
- add new screenshots
- change navigation flows
- adjust wait times for animations
- modify element selectors

### update device configurations

edit `.detoxrc.js` to change simulator/emulator settings or add new device configurations.

## tips

1. **wait times**: adjust `waitFor()` calls if screens need more time to load
2. **element ids**: ensure testID props are set on key ui elements in the app
3. **framing**: use tools like [shotbot](https://app.shotbot.io/) or [app mockup](https://app-mockup.com/) to add device frames
4. **localization**: duplicate tests with different device languages for international markets
5. **clean state**: tests run with `newInstance: true` to ensure fresh app state

## troubleshooting

**screenshots missing elements:**
- increase wait times in test
- check that animations have completed
- verify element testIDs match

**tests failing:**
- run regular e2e tests first: `yarn e2e:test:ios`
- check that app builds: `yarn e2e:build:ios`
- verify simulator/emulator is running

**wrong device size:**
- check device name matches available simulators: `xcrun simctl list devices`
- update device configurations in [generate-screenshots.sh](../scripts/generate-screenshots.sh)