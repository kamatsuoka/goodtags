import {useAppDispatch, useAppSelector} from "@app/hooks"
import {FavoritesActions} from "@app/modules/favoritesSlice"
import {StackParamList} from "@app/navigation/navigationParams"
import {useNavigation} from "@react-navigation/native"
import {NativeStackScreenProps} from "@react-navigation/native-stack"
import {useState} from "react"
import {StyleSheet, View} from "react-native"
import {Text, TextInput, useTheme} from "react-native-paper"

type Props = NativeStackScreenProps<StackParamList, "CreateLabel">

export default function CreateLabel({route}: Props) {
  const {tag} = route.params
  const labels = useAppSelector(state => state.favorites.labels)
  const navigation = useNavigation()
  const [draft, setDraft] = useState("")
  const dispatch = useAppDispatch()
  const theme = useTheme()

  const labelAlreadyExists = (label: string) => labels.includes(label)

  const createLabel = (label: string) => {
    if (label && !labelAlreadyExists(label)) {
      if (tag) {
        dispatch(FavoritesActions.addLabel({label, tag}))
      } else {
        dispatch(FavoritesActions.createLabel(label))
      }
      navigation.goBack()
    }
  }

  const themedStyles = StyleSheet.create({
    warning: {
      color: theme.colors.error,
      marginLeft: 12,
      marginTop: 8,
    },
  })

  return (
    <View style={styles.container}>
      <View style={styles.inputAndMessage}>
        <TextInput
          value={draft}
          mode="flat"
          autoFocus
          autoCapitalize="none"
          onChangeText={setDraft}
          onSubmitEditing={() => createLabel(draft.trim())}
          placeholder="label"
          maxLength={32}
          dense
          style={[styles.textInput]}
        />
        {labelAlreadyExists(draft.trim()) ? (
          <Text style={themedStyles.warning} variant="labelSmall">
            label already exists
          </Text>
        ) : null}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    padding: 10,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  inputHolder: {
    flexDirection: "row",
    alignItems: "center",
  },
  inputAndMessage: {
    alignItems: "flex-start",
    marginTop: 20,
  },
  textInput: {
    width: 250,
  },
})
