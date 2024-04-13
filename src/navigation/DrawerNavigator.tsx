import LabelNavigator from "@app/components/LabelNavigator"
import Logo from "@app/components/Logo"
import useShallowScreen from "@app/hooks/useShallowScreen"
import {createDrawerNavigator} from "@react-navigation/drawer"
import {useNavigation} from "@react-navigation/native"
import {NativeStackNavigationProp} from "@react-navigation/native-stack"
import {StyleSheet, View} from "react-native"
import {Button, useTheme} from "react-native-paper"
import {useSafeAreaInsets} from "react-native-safe-area-context"
import TabNavigator from "./TabNavigator"
import {DrawerParamList, StackParamList} from "./navigationParams"

const Drawer = createDrawerNavigator<DrawerParamList>()

const DrawerView = () => {
  const shallowScreen = useShallowScreen()
  const navigation = useNavigation<NativeStackNavigationProp<StackParamList>>()
  const theme = useTheme()
  const insets = useSafeAreaInsets()

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      paddingVertical: 5,
      alignItems: "flex-start",
      backgroundColor: theme.colors.surface,
      paddingTop: insets.top,
      paddingBottom: Math.max(insets.bottom, 20),
      paddingLeft: 10,
    },
    buttonHolder: {
      paddingLeft: insets.left,
      alignItems: "flex-start",
    },
    logoHolder: {
      justifyContent: "center",
      paddingLeft: insets.left,
      flexBasis: 50,
      marginLeft: 18,
      marginBottom: 5,
    },
    navHolder: {
      flex: 1,
      width: "100%",
      marginVertical: 5,
      paddingVertical: 5,
    },
  })

  return (
    <View style={styles.container} testID="drawer_container">
      <View style={styles.logoHolder}>
        <Logo size={shallowScreen ? 24 : 30} dark />
      </View>
      <View style={styles.navHolder}>
        <LabelNavigator />
      </View>
      <View style={styles.buttonHolder}>
        <Button
          icon="label-multiple-outline"
          onPress={() => navigation.navigate("LabelEditor")}>
          edit labels
        </Button>
        {shallowScreen ? null : (
          <>
            <Button
              icon="information-outline"
              onPress={() => navigation.navigate("About")}
              testID="about_button">
              about
            </Button>
            <Button
              icon="cog-outline"
              onPress={() => navigation.navigate("Options")}>
              options
            </Button>
          </>
        )}
      </View>
    </View>
  )
}

/**
 * Drawer navigator
 */
export default function DrawerNavigator() {
  return (
    <Drawer.Navigator
      screenOptions={{headerShown: false}}
      drawerContent={DrawerView}>
      <Drawer.Screen name="Tabs" component={TabNavigator} />
    </Drawer.Navigator>
  )
}
