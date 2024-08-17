import homeIcon from "@app/components/homeIcon"
import {useAppDispatch, useAppSelector} from "@app/hooks"
import {receiveSharedFile, shareFavorites} from "@app/modules/favoritesSlice"
import {ScrollView, StyleSheet, TouchableOpacity, View} from "react-native"
import DocumentPicker from "react-native-document-picker"
import {List, useTheme} from "react-native-paper"
import {useSafeAreaInsets} from "react-native-safe-area-context"

/**
 * Share screen
 */
export default function ShareScreen() {
  const theme = useTheme()
  const insets = useSafeAreaInsets()
  const dispatch = useAppDispatch()
  const favorites = useAppSelector(state => state.favorites)

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      alignItems: "flex-start",
      backgroundColor: theme.colors.secondaryContainer,
      paddingTop: insets.top,
      paddingBottom: Math.max(insets.bottom, 20),
      paddingHorizontal: 15,
    },
    listHolder: {
      backgroundColor: theme.colors.surface,
      paddingHorizontal: 5,
      borderRadius: 10,
      marginVertical: 5,
    },
    listItem: {
      height: 50,
      flexDirection: "row",
      paddingLeft: 5,
      paddingRight: 0,
    },
    buttonHolder: {
      paddingVertical: 10,
      paddingLeft: insets.left,
      alignItems: "flex-start",
    },
  })

  return (
    <View style={styles.container}>
      <List.Section>
        <ScrollView>
          <View style={styles.listHolder}>
            <TouchableOpacity onPress={() => shareFavorites(favorites)}>
              <List.Item
                title="export favorites and labels"
                left={ExportIcon}
                right={RightIcon}
                style={styles.listItem}
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={async () => {
                try {
                  const pickerResult = await DocumentPicker.pickSingle({
                    presentationStyle: "fullScreen",
                  })
                  console.log(
                    `result from DocumentPicker.pickSingle: ${pickerResult}`,
                  )
                  if (pickerResult?.uri) {
                    dispatch(receiveSharedFile(pickerResult.uri))
                  }
                } catch (e) {
                  console.error(e)
                }
              }}>
              <List.Item
                title="import favorites and labels"
                left={ImportIcon}
                right={RightIcon}
                style={styles.listItem}
              />
            </TouchableOpacity>
          </View>
        </ScrollView>
      </List.Section>
    </View>
  )
}

const RightIcon = homeIcon("chevron-right")
const ExportIcon = homeIcon("export")
const ImportIcon = homeIcon("import")
