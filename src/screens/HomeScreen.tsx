import homeIcon from '@app/components/homeIcon'
import Logo from '@app/components/Logo'
import {
  useAppDispatch,
  useAppSelector,
  useBodyInsets,
  useHeaderHeight,
  useWindowShape,
} from '@app/hooks'
import { receiveSharedFile } from '@app/modules/favoritesSlice'
import { HomeNavigatorScreenProps } from '@app/navigation/navigationParams'
import React, { useEffect, useState } from 'react'
import {
  Linking,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native'
import { Divider, List, Portal, Snackbar, useTheme } from 'react-native-paper'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

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
  const headerHeight = useHeaderHeight()

  const LOGO_SIZE = 28

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.secondaryContainer,
      paddingBottom: Math.max(insets.bottom, 10),
    },
    statusBarSpacer: {
      height: shallowScreen && showStatusBar ? insets.top : 0,
    },
    buttonHolder: { alignItems: 'flex-start' },
    logoHolder: {
      paddingHorizontal: 15,
      backgroundColor: theme.colors.primary,
      alignItems: 'center',
      justifyContent: 'flex-end',
      height: headerHeight,
    },
    logo: {
      marginBottom: 3,
    },
    navHolder: {
      flex: 1,
      width: '100%',
      marginVertical: 5,
      paddingVertical: 5,
    },
    subheader: { marginLeft: 0, paddingBottom: 5, marginBottom: 0 },
    listHolder: {
      backgroundColor: theme.colors.surface,
      paddingHorizontal: 5,
      borderRadius: 10,
      marginVertical: 5,
    },
    listItem: {
      height: 56,
      flexDirection: 'row',
      paddingLeft: 5,
      paddingRight: 5,
      paddingVertical: 4,
    },
    listItemTitle: {
      fontSize: 18,
    },
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
  })

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

  const themedStyles = StyleSheet.create({
    listContainer: {
      flex: 1,
      paddingLeft: shallowScreen ? Math.max(paddingLeft, 30) : paddingLeft,
      paddingRight,
      width: '100%',
    },
    scrollContentContainer: {
      paddingTop: 10,
      paddingHorizontal: 20,
      width: '100%',
    },
  })

  return (
    <View style={styles.container} testID="home_container">
      <View style={styles.logoHolder}>
        <Logo size={LOGO_SIZE} style={styles.logo} dark={false} />
      </View>
      <ScrollView
        showsVerticalScrollIndicator={false}
        style={themedStyles.listContainer}
        contentContainerStyle={themedStyles.scrollContentContainer}
      >
        <View style={styles.columnsContainer}>
          <View style={styles.column}>
            <View style={styles.listHolder}>
              <TouchableOpacity onPress={() => navigation.navigate('Popular')}>
                <List.Item
                  title="popular"
                  left={PopularIcon}
                  right={RightIcon}
                  style={styles.listItem}
                  titleStyle={styles.listItemTitle}
                  contentStyle={styles.listItemContent}
                />
              </TouchableOpacity>
              <Divider />
              <TouchableOpacity onPress={() => navigation.navigate('Classic')}>
                <List.Item
                  title="classic"
                  left={ClassicIcon}
                  right={RightIcon}
                  style={styles.listItem}
                  titleStyle={styles.listItemTitle}
                  contentStyle={styles.listItemContent}
                />
              </TouchableOpacity>
              <Divider />
              <TouchableOpacity onPress={() => navigation.navigate('Easy')}>
                <List.Item
                  title="easy"
                  left={EasyIcon}
                  right={RightIcon}
                  style={styles.listItem}
                  titleStyle={styles.listItemTitle}
                  contentStyle={styles.listItemContent}
                />
              </TouchableOpacity>
              <Divider />
              <TouchableOpacity onPress={() => navigation.navigate('New')}>
                <List.Item
                  title="new"
                  left={NewIcon}
                  right={RightIcon}
                  style={styles.listItem}
                  titleStyle={styles.listItemTitle}
                  contentStyle={styles.listItemContent}
                />
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.column}>
            <View style={styles.listHolder}>
              <TouchableOpacity
                onPress={() => {
                  const parent = navigation.getParent()
                  const root = parent?.getParent()
                  root?.navigate('Random' as never)
                }}
              >
                <List.Item
                  title="random tag"
                  left={RandomIcon}
                  right={RightIcon}
                  style={styles.listItem}
                  titleStyle={styles.listItemTitle}
                  contentStyle={styles.listItemContent}
                />
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.column}>
            <View style={styles.listHolder}>
              <TouchableOpacity
                onPress={() => {
                  navigation.navigate('Labels')
                }}
              >
                <List.Item
                  title="labels"
                  left={LabelsIcon}
                  right={RightIcon}
                  style={styles.listItem}
                  titleStyle={styles.listItemTitle}
                  contentStyle={styles.listItemContent}
                />
              </TouchableOpacity>
              <Divider />
              <TouchableOpacity
                onPress={() => {
                  navigation.navigate('Options')
                }}
              >
                <List.Item
                  title="options"
                  left={OptionsIcon}
                  right={RightIcon}
                  style={styles.listItem}
                  titleStyle={styles.listItemTitle}
                  contentStyle={styles.listItemContent}
                />
              </TouchableOpacity>
              <Divider />
              <TouchableOpacity
                onPress={() => {
                  navigation.navigate('Data')
                }}
              >
                <List.Item
                  title="data"
                  left={DataIcon}
                  right={RightIcon}
                  style={styles.listItem}
                  titleStyle={styles.listItemTitle}
                  contentStyle={styles.listItemContent}
                />
              </TouchableOpacity>
              <Divider />
              <TouchableOpacity
                onPress={() => {
                  navigation.navigate('About')
                }}
              >
                <List.Item
                  title="about"
                  left={AboutIcon}
                  testID="about_button"
                  right={RightIcon}
                  style={styles.listItem}
                  titleStyle={styles.listItemTitle}
                  contentStyle={styles.listItemContent}
                />
              </TouchableOpacity>
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

const PopularIcon = homeIcon('star')
const ClassicIcon = homeIcon('pillar')
const EasyIcon = homeIcon('teddy-bear')
const NewIcon = homeIcon('leaf')
const RightIcon = homeIcon('chevron-right')
const LabelsIcon = homeIcon('tag-multiple-outline')
const AboutIcon = homeIcon('information-outline')
const OptionsIcon = homeIcon('cog-outline')
const DataIcon = homeIcon('database')
const RandomIcon = homeIcon('shuffle')
