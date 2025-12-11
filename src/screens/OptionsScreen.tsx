import CommonStyles from '@app/constants/CommonStyles'
import { useAppDispatch, useAppSelector, useBodyInsets } from '@app/hooks'
import { TabBarBackground } from '@app/lib/theme'
import { OptionsActions } from '@app/modules/optionsSlice'
import React, { useCallback, useMemo } from 'react'
import { ScrollView, StyleSheet, View } from 'react-native'
import { Checkbox, List } from 'react-native-paper'

const CheckBoxComponent = ({ selected, onPress }: { selected: boolean; onPress: () => void }) => (
  <Checkbox.Android status={selected ? 'checked' : 'unchecked'} onPress={onPress} />
)

/**
 * Screen for setting ui options
 */
export default function OptionsScreen() {
  const { paddingLeft, paddingRight } = useBodyInsets()
  const serifsSelected = useAppSelector(state => state.options.serifs)
  const showStatusBar = useAppSelector(state => state.options.showStatusBar)
  const keepAwake = useAppSelector(state => state.options.keepAwake)
  const dispatch = useAppDispatch()

  const toggleSerifs = useCallback(() => {
    dispatch(OptionsActions.setSerifs(!serifsSelected))
  }, [dispatch, serifsSelected])

  const toggleStatusBar = useCallback(() => {
    dispatch(OptionsActions.setShowStatusBar(!showStatusBar))
  }, [dispatch, showStatusBar])

  const toggleKeepAwake = useCallback(() => {
    dispatch(OptionsActions.setKeepAwake(!keepAwake))
  }, [dispatch, keepAwake])

  const listContainerPadding = useMemo(
    () => ({
      paddingLeft,
      paddingRight,
    }),
    [paddingLeft, paddingRight],
  )

  const renderSerifsCheckbox = useCallback(
    () => <CheckBoxComponent selected={serifsSelected} onPress={toggleSerifs} />,
    [serifsSelected, toggleSerifs],
  )

  const renderStatusBarCheckbox = useCallback(
    () => <CheckBoxComponent selected={showStatusBar} onPress={toggleStatusBar} />,
    [showStatusBar, toggleStatusBar],
  )

  const renderKeepAwakeCheckbox = useCallback(
    () => <CheckBoxComponent selected={keepAwake} onPress={toggleKeepAwake} />,
    [keepAwake, toggleKeepAwake],
  )

  return (
    <ScrollView style={[CommonStyles.listContainer, listContainerPadding]}>
      <View style={styles.container}>
        <List.Item
          left={renderSerifsCheckbox}
          title="serifs"
          titleStyle={styles.listItemTitle}
          description="use serif fonts"
          onPress={toggleSerifs}
        />
        <List.Item
          left={renderStatusBarCheckbox}
          title="show status bar"
          titleStyle={styles.listItemTitle}
          description="show the system status bar"
          onPress={toggleStatusBar}
        />
        <List.Item
          left={renderKeepAwakeCheckbox}
          title="keep screen awake"
          titleStyle={styles.listItemTitle}
          description="prevent screen from sleeping while viewing tags"
          descriptionNumberOfLines={2}
          onPress={toggleKeepAwake}
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
