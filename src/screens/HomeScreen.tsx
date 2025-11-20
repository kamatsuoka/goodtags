import homeIcon from '@app/components/homeIcon'
import Logo from '@app/components/Logo'
import { useAppDispatch, useBodyInsets } from '@app/hooks'
import useShallowScreen from '@app/hooks/useShallowScreen'
import { receiveSharedFile } from '@app/modules/favoritesSlice'
import { HomeNavigatorScreenProps } from '@app/navigation/navigationParams'
import { useEffect, useState } from 'react'
import {
  Linking,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
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
  const shallow = useShallowScreen()
  const dispatch = useAppDispatch()
  const [snackBarVisible, setSnackBarVisible] = useState(false)
  const [snackBarMessage, setSnackBarMessage] = useState('')

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      paddingVertical: 5,
      alignItems: 'flex-start',
      backgroundColor: theme.colors.secondaryContainer,
      paddingTop: insets.top,
      paddingBottom: Math.max(insets.bottom, 10),
      paddingHorizontal: 15,
    },
    buttonHolder: { paddingLeft: insets.left, alignItems: 'flex-start' },
    logoHolder: {
      justifyContent: 'center',
      paddingLeft: insets.left,
      flexBasis: 50,
      marginBottom: 5,
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
      // borderColor: "red",
      // borderWidth: 1,
      height: 50,
      flexDirection: 'row',
      paddingLeft: 5,
      paddingRight: 0,
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
    listContainer: { flex: 1, paddingLeft, paddingRight },
  })

  return (
    <View style={styles.container} testID="home_container">
      {shallow ? null : (
        <View style={styles.logoHolder}>
          <Logo size={30} dark />
        </View>
      )}
      <ScrollView
        showsVerticalScrollIndicator={false}
        style={themedStyles.listContainer}
      >
        <View style={styles.listHolder}>
          <TouchableOpacity onPress={() => navigation.navigate('Popular')}>
            <List.Item
              title="popular tags"
              left={PopularIcon}
              right={RightIcon}
              style={styles.listItem}
            />
          </TouchableOpacity>
          <Divider />
          <TouchableOpacity onPress={() => navigation.navigate('Classic')}>
            <List.Item
              title="classic tags"
              left={ClassicIcon}
              right={RightIcon}
              style={styles.listItem}
            />
          </TouchableOpacity>
          <Divider />
          <TouchableOpacity onPress={() => navigation.navigate('Easy')}>
            <List.Item
              title="easy tags"
              left={EasyIcon}
              right={RightIcon}
              style={styles.listItem}
            />
          </TouchableOpacity>
          <Divider />
          <TouchableOpacity onPress={() => navigation.navigate('New')}>
            <List.Item
              title="new tags"
              left={NewIcon}
              right={RightIcon}
              style={styles.listItem}
            />
          </TouchableOpacity>
        </View>
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
            />
          </TouchableOpacity>
        </View>
        <View style={styles.listHolder}>
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
            />
          </TouchableOpacity>
          <Divider />
          <TouchableOpacity
            onPress={() => {
              navigation.navigate('Data')
            }}
          >
            <List.Item
              title="my data"
              left={DataIcon}
              right={RightIcon}
              style={styles.listItem}
            />
          </TouchableOpacity>
        </View>
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
            />
          </TouchableOpacity>
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
