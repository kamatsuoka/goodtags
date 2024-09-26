import {StyleSheet} from "react-native"
import {InversePrimaryHighAlpha} from "../lib/theme"

export const FAB_GROUP_PADDING_BOTTOM = 35

const CommonStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    fontSize: 18,
  },
  modal: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 0,
  },
  fabGroup: {
    paddingRight: 0,
    paddingBottom: FAB_GROUP_PADDING_BOTTOM,
  },
  fab: {
    backgroundColor: InversePrimaryHighAlpha,
    marginRight: 23,
    opacity: 0.85,
  },
  fabDown: {
    backgroundColor: "transparent", // MainTheme.colors.inversePrimary,
    marginBottom: 15,
  },
  sheetMusicLeft: {
    left: 25,
  },
  spinnerHolder: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
  },
  redBox: {
    borderWidth: 1,
    borderColor: "red",
  },
  greenBox: {
    borderWidth: 1,
    borderColor: "green",
  },
  blueBox: {
    borderWidth: 1,
    borderColor: "blue",
  },
})

export default CommonStyles
