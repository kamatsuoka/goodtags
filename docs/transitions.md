# Transitions

Transitions from tag lists to sheet music can be rough. Both those screens are rich and complex. The situation is made worse on iOS by [bugs in react-native-screens](https://github.com/software-mansion/react-native-screens/issues/1341). Without extra help, iOS screens can end up in a paradoxical state where they seem to display portrait screens in landscape mode -- with the width extending off the screen -- and vice-versa. There can also be lots of glitching when returning to tag lists as the screen re-renders.

I tried a number of workarounds for this problem, most of which didn't work reliable. What I've landed on is a system using two transition screens. The way they work in autorotate mode is:

- use react navigation's built-in orientation lock to set tag list screens to portrait and the the sheet music screen to landscape
- on tapping a tag in a tag list, fade to a portrait transition screen (this avoids the tag list needing to rotate during the transition)
- from the portrait transition screen, automatically navigate to a landscape transition screen
- from the landscape transition screen, automatically navigate to the sheet music screen (since we're already in landscape mode, there's no rotation of the sheet music necessary)
- when going back to the tag list, do the same process in reverse: fade to the landscape transition screen, automatically navigate back to the portrait screen, then automatically navigate back to the tag list

There are a few important components of this solution:

- animation = "fade" as the default for react navigation screens in the stack
- animation = "none" for the transition screens
- delay on the transition screens after changing orientation
- using "navigation.goBack" to navigate back to the tag list
- freezeOnBlur = true for stack screens

Since the transition screens behave differently depending on whether you're opening the sheet music or going back to the tag list, I originally used route parameters to differentiate the two cases. (The same was true for deciding whether to automatically scroll the tag list to the last selected tag: we only want to do that when returning from the sheet music screen.) That ended up creating some complicated code that was a little hard to understand. It also meant that I couldn't simply call `navigation.goBack()` to go pop screens off the stack: I had to do a new navigation to a named screen. I'm not sure if this contributed to glitches on the tag lists or not. In any case, I ended up adding a `tagState = opening|closing` variable to the `visit` slice, and using that to distinguish the two cases. I don't know if it's an abuse of redux to store navigation state this way, but it ended up simplifying my code.

Things I tried that didn't work:

- not using transition screens and relying on any of the following to lock orientations on tag lists and sheet music screens:
  - react navigation
  - [react-native-orientation-locker](https://github.com/wonday/react-native-orientation-locker)
  - expo-screen-orientation
- using transition screens and relying react-native-orientation-locker to lock their orientations
- not using a delay on the transition screens after changing orientation
