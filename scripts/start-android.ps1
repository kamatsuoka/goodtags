# start react-native, android logger, and android emulator
$dir = resolve-path "$PSScriptRoot\.."
wt pwsh -NoExit -wd $dir -Command "yarn start"
wt pwsh -NoExit -wd $dir -Command "yarn log-android"
wt pwsh -NoExit -wd $dir -Command "yarn android"


