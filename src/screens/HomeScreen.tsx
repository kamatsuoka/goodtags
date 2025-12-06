import homeIcon from '@app/components/homeIcon'
import Logo from '@app/components/Logo'
import SharedHeader, { BackType } from '@app/components/SharedHeader'
import {
  useAppDispatch,
  useAppSelector,
  useBodyInsets,
  useWindowShape,
} from '@app/hooks'
import { useListStyles } from '@app/hooks/useListStyles'
import { receiveSharedFile } from '@app/modules/favoritesSlice'
import {
  HomeNavigatorParamList,
  HomeNavigatorScreenProps,
  RootStackParamList,
} from '@app/navigation/navigationParams'
import React, { useEffect, useMemo, useState } from 'react'
import {
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native'
import { Divider, List, Portal, Snackbar, useTheme } from 'react-native-paper'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

const LOGO_SIZE = 26
const logoTitle = <Logo size={LOGO_SIZE} dark={false} />

type HomeItemProps = {
  title: string
  leftIcon: (props?: any) => React.ReactNode
  dest?: keyof HomeNavigatorParamList | keyof RootStackParamList
  onPress?: () => void
  testID?: string
}

/**
 * Home screen
 */
export default function HomeScreen({
  navigation,
}: HomeNavigatorScreenProps<'Home'>) {
  const theme = useTheme()
  const insets = useSafeAreaInsets()
  const { paddingLeft, paddingRight } = useBodyInsets()
  const { shallowScreen } = useWindowShape()
  const dispatch = useAppDispatch()
  const showStatusBar = useAppSelector(state => state.options.showStatusBar)
  const [snackBarVisible, setSnackBarVisible] = useState(false)
  const [snackBarMessage, setSnackBarMessage] = useState('')
  const { width, height } = useWindowDimensions()
  const isLandscape = width > height
  const { listStyles, pressableStyle } = useListStyles()

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.secondaryContainer,
      paddingBottom: Math.max(insets.bottom, 10),
    },
    listContainer: {
      flex: 1,
      width: '100%',
    },
    scrollContentContainer: {
      paddingTop: 10,
      paddingHorizontal: 20,
      width: '100%',
    },
    statusBarSpacer: {
      height: shallowScreen && showStatusBar ? insets.top : 0,
    },
    buttonHolder: { alignItems: 'flex-start' },
    navHolder: {
      flex: 1,
      width: '100%',
      marginVertical: 5,
      paddingVertical: 5,
    },
    subheader: { marginLeft: 0, paddingBottom: 5, marginBottom: 0 },
    listItemContent: {
      paddingVertical: 4,
    },
    iconStyle: {
      marginTop: 4,
    },
    columnsContainer: {
      flexDirection: isLandscape ? 'row' : 'column',
      width: '100%',
      justifyContent: 'space-between',
    },
    column: {
      width: isLandscape ? '32%' : '100%',
      marginBottom: isLandscape ? 0 : 5,
    },
    headerCenterStyle: {
      marginBottom: 0,
    },
  })

  /**
   * A pressable list item for the home screen
   */
  const HomeItem = React.useCallback(
    ({ title, leftIcon, dest, onPress, testID }: HomeItemProps) => {
      const handlePress =
        onPress ||
        (() => {
          if (dest) {
            navigation.navigate(dest, undefined as never)
          }
        })
      return (
        <Pressable onPress={handlePress} style={pressableStyle}>
          <List.Item
            title={title}
            left={leftIcon}
            right={RightIcon}
            style={listStyles.listItem}
            titleStyle={theme.fonts.bodyLarge}
            contentStyle={styles.listItemContent}
            testID={testID}
          />
        </Pressable>
      )
    },
    [
      navigation,
      listStyles,
      pressableStyle,
      theme.fonts.bodyLarge,
      styles.listItemContent,
    ],
  )

  useEffect(() => {
    const handleOpenUrl = async (event: { url: string }) => {
      try {
        if (event.url.startsWith('file://')) {
          dispatch(receiveSharedFile(event.url))
        } else {
          throw new Error(`unknown url type ${event.url}`)
        }
      } catch (e) {
        console.error('an error occurred in handleOpenUrl', e)
        setSnackBarMessage(`handleOpenUrl error: ${e}`)
        setSnackBarVisible(true)
      }
    }

    Linking.getInitialURL().then(url => {
      if (url) handleOpenUrl({ url })
    })
    // Modern subscription API (RN >= 0.65) returns a subscription with remove()
    const subscription = Linking.addEventListener('url', handleOpenUrl)
    return () => subscription.remove()
  }, [dispatch])

  const listContainerStyles = useMemo(
    () => ({
      paddingLeft: shallowScreen ? Math.max(paddingLeft, 30) : paddingLeft,
      paddingRight,
    }),
    [shallowScreen, paddingLeft, paddingRight],
  )

  return (
    <View style={styles.container} testID="home_container">
      <SharedHeader
        backType={BackType.None}
        title={logoTitle}
        headerCenterStyle={styles.headerCenterStyle}
      />
      <ScrollView
        showsVerticalScrollIndicator={false}
        style={[styles.listContainer, listContainerStyles]}
        contentContainerStyle={styles.scrollContentContainer}
      >
        <View style={styles.columnsContainer}>
          <View style={styles.column}>
            <View style={listStyles.listHolder}>
              <HomeItem title="popular" leftIcon={PopularIcon} dest="Popular" />
              <Divider />
              <HomeItem title="classic" leftIcon={ClassicIcon} dest="Classic" />
              <Divider />
              <HomeItem title="easy" leftIcon={EasyIcon} dest="Easy" />
              <Divider />
              <HomeItem title="new" leftIcon={NewIcon} dest="New" />
            </View>
          </View>
          <View style={styles.column}>
            <View style={listStyles.listHolder}>
              <HomeItem
                title="random tag"
                leftIcon={RandomIcon}
                dest="Random"
              />
            </View>
          </View>
          <View style={styles.column}>
            <View style={listStyles.listHolder}>
              <HomeItem
                title="about"
                leftIcon={AboutIcon}
                dest="About"
                testID="about_button"
              />
              <Divider />
              <HomeItem title="options" leftIcon={OptionsIcon} dest="Options" />
              <Divider />
              <HomeItem title="labels" leftIcon={LabelsIcon} dest="Labels" />
              <Divider />
              <HomeItem title="data" leftIcon={DataIcon} dest="Data" />
            </View>
          </View>
        </View>
      </ScrollView>
      <Portal>
        <Snackbar
          visible={snackBarVisible}
          onDismiss={() => setSnackBarVisible(false)}
          action={{ label: 'close' }}
        >
          {snackBarMessage}
        </Snackbar>
      </Portal>
    </View>
  )
}

export const PopularIcon = homeIcon('star')
const ClassicIcon = homeIcon('pillar')
const EasyIcon = homeIcon('teddy-bear')
const NewIcon = homeIcon('leaf')
export const RightIcon = homeIcon('chevron-right')
const LabelsIcon = homeIcon('tag-multiple-outline')
const AboutIcon = homeIcon('information-outline')
const OptionsIcon = homeIcon('cog-outline')
const DataIcon = homeIcon('database')
const RandomIcon = homeIcon('shuffle')
