import { useAppDispatch, useAppSelector, useBodyInsets } from '@app/hooks'
import { TabBarBackground } from '@app/lib/theme'
import { OptionsActions } from '@app/modules/optionsSlice'
import Slider from '@react-native-community/slider'
import React, { useCallback, useMemo, useState } from 'react'
import { ScrollView, StyleSheet, View } from 'react-native'
import { Checkbox, List, Text } from 'react-native-paper'

const CheckBoxComponent = ({
  selected,
  onPress,
}: {
  selected: boolean
  onPress: () => void
}) => (
  <Checkbox.Android
    status={selected ? 'checked' : 'unchecked'}
    onPress={onPress}
  />
)

/**
 * Screen for setting ui options
 */
export default function OptionsScreen() {
  const { paddingLeft, paddingRight } = useBodyInsets()
  const serifsSelected = useAppSelector(state => state.options.serifs)
  const autoRotateSelected = useAppSelector(state => state.options.autoRotate)
  const autoRotateDelay = useAppSelector(state => state.options.autoRotateDelay)
  const showStatusBar = useAppSelector(state => state.options.showStatusBar)
  const [delayDraft, setDelayDraft] = useState(autoRotateDelay)
  const dispatch = useAppDispatch()

  const toggleSerifs = useCallback(() => {
    dispatch(OptionsActions.setSerifs(!serifsSelected))
  }, [dispatch, serifsSelected])

  const toggleAutoRotate = useCallback(() => {
    dispatch(OptionsActions.setAutoRotate(!autoRotateSelected))
  }, [dispatch, autoRotateSelected])

  const toggleStatusBar = useCallback(() => {
    dispatch(OptionsActions.setShowStatusBar(!showStatusBar))
  }, [dispatch, showStatusBar])

  const handleAutoRotateDelay = useCallback(
    (value: number) => {
      dispatch(OptionsActions.setAutoRotateDelay(value))
    },
    [dispatch],
  )

  const autoRotateDelaySlider = (
    <View style={styles.delayHolder}>
      <View style={styles.sliderHolder}>
        <Text style={styles.delayText}>
          delay (increase if auto-rotate glitches)
        </Text>
        <Slider
          value={delayDraft}
          onValueChange={setDelayDraft}
          onSlidingComplete={handleAutoRotateDelay}
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

  const themedStyles = useMemo(
    () =>
      StyleSheet.create({
        listContainer: {
          flex: 1,
          paddingLeft,
          paddingRight,
        },
      }),
    [paddingLeft, paddingRight],
  )

  const renderSerifsCheckbox = useCallback(
    () => (
      <CheckBoxComponent selected={serifsSelected} onPress={toggleSerifs} />
    ),
    [serifsSelected, toggleSerifs],
  )

  const renderAutoRotateCheckbox = useCallback(
    () => (
      <CheckBoxComponent
        selected={autoRotateSelected}
        onPress={toggleAutoRotate}
      />
    ),
    [autoRotateSelected, toggleAutoRotate],
  )

  const renderStatusBarCheckbox = useCallback(
    () => (
      <CheckBoxComponent selected={showStatusBar} onPress={toggleStatusBar} />
    ),
    [showStatusBar, toggleStatusBar],
  )

  return (
    <ScrollView style={themedStyles.listContainer}>
      <View style={styles.container}>
        <List.Item
          left={renderSerifsCheckbox}
          title="serifs"
          titleStyle={styles.listItemTitle}
          description="use serif fonts"
        />
        <List.Item
          left={renderAutoRotateCheckbox}
          title="auto-rotate"
          titleStyle={styles.listItemTitle}
          description="automatically rotate to optimal orientation"
          descriptionNumberOfLines={2}
        />
        {autoRotateSelected ? autoRotateDelaySlider : null}
        <List.Item
          left={renderStatusBarCheckbox}
          title="show status bar"
          titleStyle={styles.listItemTitle}
          description="show the system status bar"
        />
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
    justifyContent: 'flex-end',
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
    flexDirection: 'row',
  },
  delayText: {
    textAlign: 'center',
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
    textAlign: 'center',
    margin: 0,
  },
})
