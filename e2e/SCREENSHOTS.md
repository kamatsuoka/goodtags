# automated screenshot generation

## setup

```bash
brew install maestro
```

## prerequisites

build the app for the simulator before running screenshots:

```bash
# install/update pods (when dependencies change)
yarn pods

# build release binary for simulator
yarn build:ios           # release
yarn build:ios:debug     # debug

# android
yarn build:android       # release
yarn build:android:debug # debug
```

## usage

```bash
# ios default device (iPhone 17)
yarn screenshots:ios

# ios app store sizes
yarn screenshots:ios:small   # iphone 13 mini
yarn screenshots:ios:large    # ipad pro 13"

# android (requires a running emulator or connected device)
yarn screenshots:android

# all sizes — ios 6.5", ios 13", android
yarn screenshots:all
```

## how it works

the flow is defined in [e2e/maestro/screenshots.yaml](maestro/screenshots.yaml). screenshots are saved to `screenshots/[platform]/[build-type]/[device]/[timestamp]/`.

to add or change screenshots, edit that YAML file. available commands: `tapOn`, `assertVisible`, `waitForAnimationToEnd`, `takeScreenshot`. element IDs match `testID` props in the app.

## android setup

start an emulator first:
```bash
emulator -avd Pixel_9_API_35   # or whatever avd you have
```
then run `yarn screenshots:android`.

## troubleshooting

- **element not found**: run `maestro studio` for an interactive inspector
- **wrong device**: check available simulators with `xcrun simctl list devices available`
- **list not loaded**: add a `waitForAnimationToEnd` or `extendedWaitUntil` before the screenshot
