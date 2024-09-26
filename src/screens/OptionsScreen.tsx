import {useAppDispatch, useAppSelector, useBodyInsets} from "@app/hooks"
import {TabBarBackground} from "@app/lib/theme"
import {OptionsActions} from "@app/modules/optionsSlice"
import Slider from "@react-native-community/slider"
import {useState} from "react"
import {ScrollView, StyleSheet, View} from "react-native"
import {Checkbox, List, Text} from "react-native-paper"

function checkBox(selected: boolean, onPress: Function) {
  return () => (
    <Checkbox.Android
      status={selected ? "checked" : "unchecked"}
      onPress={() => onPress()}
    />
  )
}

/**
 * Screen for setting ui options
 */
export default function OptionsScreen() {
  const {paddingLeft, paddingRight} = useBodyInsets()
  const serifsSelected = useAppSelector(state => state.options.serifs)
  const autoRotateSelected = useAppSelector(state => state.options.autoRotate)
  const autoRotateDelay = useAppSelector(state => state.options.autoRotateDelay)
  const [delayDraft, setDelayDraft] = useState(autoRotateDelay)
  const dispatch = useAppDispatch()

  const autoRotateDelaySlider = (
    <View style={styles.delayHolder}>
      <View style={styles.sliderHolder}>
        <Text style={styles.delayText}>
          delay (increase if auto-rotate glitches)
        </Text>
        <Slider
          value={delayDraft}
          onValueChange={value => setDelayDraft(value)}
          onSlidingComplete={value =>
            dispatch(OptionsActions.setAutoRotateDelay(value))
          }
          step={10}
          style={styles.slider}
          minimumValue={200}
          maximumValue={1000}
          maximumTrackTintColor="#aaaaaa"
        />
        <Text style={styles.sliderValue}>{delayDraft}</Text>
      </View>
    </View>
  )

  const themedStyles = StyleSheet.create({
    listContainer: {
      flex: 1,
      paddingLeft,
      paddingRight,
    },
  })

  return (
    <ScrollView style={themedStyles.listContainer}>
      <View style={styles.container}>
        <List.Item
          left={checkBox(serifsSelected, () =>
            dispatch(OptionsActions.setSerifs(!serifsSelected)),
          )}
          title="serifs"
          titleStyle={styles.listItemTitle}
          description="use serif fonts"
        />
        <List.Item
          left={checkBox(autoRotateSelected, () =>
            dispatch(OptionsActions.setAutoRotate(!autoRotateSelected)),
          )}
          title="auto-rotate"
          titleStyle={styles.listItemTitle}
          description="automatically rotate to optimal orientation"
          descriptionNumberOfLines={2}
        />
        {autoRotateSelected ? autoRotateDelaySlider : null}
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    backgroundColor: TabBarBackground,
    paddingLeft: 11,
  },
  spacer: {
    height: 20,
  },
  listItemTitle: {
    marginVertical: 5,
  },
  infoIcon: {
    padding: 5,
  },
  bottom: {
    flex: 1,
    justifyContent: "flex-end",
  },
  headerRight: {
    width: 10,
  },
  title: {
    paddingTop: 2,
    marginLeft: 6,
  },
  delayHolder: {
    flex: 1,
    marginTop: 5,
    marginLeft: 50,
    marginRight: 40,
    flexDirection: "row",
  },
  delayText: {
    textAlign: "center",
  },
  sliderHolder: {
    marginLeft: 10,
    // flex: 1,
  },
  slider: {
    height: 40,
  },
  sliderValue: {
    fontSize: 14,
    textAlign: "center",
    margin: 0,
  },
})
