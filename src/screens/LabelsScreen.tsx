// import {StackParamList} from "@app/navigation/navigationParams"
import homeIcon from "@app/components/homeIcon"
import {useAppDispatch, useAppSelector, useBodyInsets} from "@app/hooks"
import {FavoritesActions} from "@app/modules/favoritesSlice"
import {HomeNavigatorScreenProps} from "@app/navigation/navigationParams"
import {ScrollView, StyleSheet, TouchableOpacity, View} from "react-native"
import {Divider, List, useTheme} from "react-native-paper"
import {useSafeAreaInsets} from "react-native-safe-area-context"

/**
 * List of labels for navigating to labeled tags
 */
export default function LabelsScreen({
  navigation,
}: HomeNavigatorScreenProps<"Labels">) {
  const theme = useTheme()
  const insets = useSafeAreaInsets()
  const {paddingLeft, paddingRight} = useBodyInsets()
  const labels = useAppSelector(state => state.favorites.labels)
  const dispatch = useAppDispatch()

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      alignItems: "flex-start",
      backgroundColor: theme.colors.secondaryContainer,
      paddingBottom: Math.max(insets.bottom, 20),
      paddingHorizontal: 15,
      paddingLeft,
      paddingRight,
    },
    section: {
      paddingHorizontal: 10,
    },
    listHolder: {
      backgroundColor: theme.colors.surface,
      borderRadius: 10,
      marginVertical: 5,
      paddingHorizontal: 10,
    },
    listItem: {
      height: 50,
      flexDirection: "row",
      paddingLeft: 5,
      paddingRight: 0,
    },
    buttonHolder: {
      paddingVertical: 10,
      alignItems: "flex-start",
    },
  })

  return (
    <View style={styles.container}>
      <List.Section style={styles.section}>
        <ScrollView>
          <View style={styles.listHolder}>
            {labels.map((label, index) => (
              <View key={`label_${index}`}>
                <TouchableOpacity
                  onPress={() => {
                    dispatch(FavoritesActions.selectLabel(label))
                    navigation.navigate("Labeled", {label})
                  }}>
                  <List.Item
                    title={label}
                    left={LabelIcon}
                    right={RightIcon}
                    style={styles.listItem}
                  />
                </TouchableOpacity>
                {index === labels.length - 1 ? null : <Divider />}
              </View>
            ))}
          </View>
          <View style={styles.listHolder}>
            <TouchableOpacity
              onPress={() => navigation.navigate("CreateLabel", {})}>
              <List.Item
                title="new label"
                left={AddLabelIcon}
                right={RightIcon}
                style={styles.listItem}
              />
            </TouchableOpacity>
          </View>
          <View style={styles.listHolder}>
            <TouchableOpacity
              onPress={() => navigation.navigate("LabelEditor")}>
              <List.Item
                title="edit labels"
                left={EditLabelsIcon}
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
const AddLabelIcon = homeIcon("tag-plus-outline")
const LabelIcon = homeIcon("tag-outline")
const EditLabelsIcon = homeIcon("tag-multiple-outline")
