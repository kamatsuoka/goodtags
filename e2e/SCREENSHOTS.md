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

# build and install binary on simulator
yarn ios           # debug
yarn ios:release   # release

# android
yarn android          # debug
yarn android:release  # release
```

## usage

```bash
To run screenshots on the release version:

# ios default device (iPhone 17)
yarn ios:screenshots

# ios app store sizes
yarn ios:screenshots small   # iphone 13 mini
yarn ios:screenshots large   # ipad pro 13" — not currently working

# android default device (Pixel 9)
yarn android:screenshots

# other android devices
yarn android:screenshots small

# all sizes — iPhone 17, iPhone 13 mini, Pixel 9
yarn screenshots

# release version
To run screenshots on the release version,
append `:release` after the platform, e.g.:

yarn ios:screenshots:release
yarn android:screenshots:release pixel7

# physical device (android only)
To run screenshots on a physical android device connected by usb:

yarn android:screenshots[:release] device  
```

## how it works

the flow is defined in [e2e/maestro/screenshots.yaml](maestro/screenshots.yaml). screenshots are saved to `screenshots/[platform]/[build-type]/[device]/[timestamp]/`.

to add or change screenshots, edit that YAML file. available commands: `tapOn`, `assertVisible`, `waitForAnimationToEnd`, `takeScreenshot`. element IDs match `testID` props in the app.

## android setup

start an emulator first:
```bash
emulator -avd Pixel_9   # or whatever avd you have
```
then run `yarn android:screenshots`.

You can list available emulators with `emulator -list-avds`.

(Note: you can also just run any of the `yarn screenshots:*` scripts and that will 
launch the requested emulator, but due to timing issues it may to start the app.
In that case, you can just run the script again.)

## troubleshooting

- **element not found**: run `maestro studio` for an interactive inspector
- **wrong device**: check available simulators with `xcrun simctl list devices available`
- **list not loaded**: add a `waitForAnimationToEnd` or `extendedWaitUntil` before the screenshot
