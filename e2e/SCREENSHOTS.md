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
To run screenshots on the release version:

# ios default device (iPhone 17)
yarn screenshots:ios

# ios app store sizes
yarn screenshots:ios small   # iphone 13 mini
yarn screenshots:ios large    # ipad pro 13" — not currently working

# android default device (Pixel 0)
yarn screenshots:android

# other android devices
yarn screenshots:android pixel7

# all sizes — iPhone 17, iPhone 13 mini, Pixel 9
yarn screenshots:all

To run screenshots on the debug version, which is quicker when adding new screenshots (and working out tap targets),
append `:debug` after the platform, e.g.:

yarn screenshots:ios:debug
yarn screenshots:android:debug pixel7
```

## how it works

the flow is defined in [e2e/maestro/screenshots.yaml](maestro/screenshots.yaml). screenshots are saved to `screenshots/[platform]/[build-type]/[device]/[timestamp]/`.

to add or change screenshots, edit that YAML file. available commands: `tapOn`, `assertVisible`, `waitForAnimationToEnd`, `takeScreenshot`. element IDs match `testID` props in the app.

## android setup

start an emulator first:
```bash
emulator -avd Pixel_9   # or whatever avd you have
```
then run `yarn screenshots:android`.

You can list available emulators with `emulator -list-avds`.

(Note: you can also just run any of the `yarn screenshots:*` scripts and that will 
launch the requested emulator, but due to timing issues it may to start the app.
In that case, you can just run the script again.)

## troubleshooting

- **element not found**: run `maestro studio` for an interactive inspector
- **wrong device**: check available simulators with `xcrun simctl list devices available`
- **list not loaded**: add a `waitForAnimationToEnd` or `extendedWaitUntil` before the screenshot
