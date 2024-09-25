import Tag from "@app/lib/models/Tag"
import {BottomTabScreenProps} from "@react-navigation/bottom-tabs"
import {CompositeScreenProps} from "@react-navigation/native"
import {NativeStackScreenProps} from "@react-navigation/native-stack"

export type RootStackParamList = {
  Welcome: undefined
  Tabs: undefined
  Favorites: undefined
  History: undefined
  Tag: undefined
  About: undefined
  Options: undefined
  LabelEditor: undefined
  CreateLabel: {
    tag?: Tag
  }
  TagLabels: undefined
  PortraitTransition: undefined
  LandscapeTransition: undefined
}

export type RootStackScreenProps<T extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, T>

export type TabsParamList = {
  Search: undefined
  Favorites: undefined
  HomeNavigator: undefined
  History: undefined
}

export type TabsScreenProps<T extends keyof TabsParamList> =
  CompositeScreenProps<
    BottomTabScreenProps<TabsParamList, T>,
    RootStackScreenProps<keyof RootStackParamList>
  >

export type HomeNavigatorParamList = {
  Home: undefined
  Popular: undefined
  Classic: undefined
  Easy: undefined
  Labels: undefined
  Labeled: {label: string}
  LabelEditor: undefined
  Options: undefined
  Data: undefined
}

export type HomeNavigatorScreenProps<T extends keyof HomeNavigatorParamList> =
  CompositeScreenProps<
    NativeStackScreenProps<HomeNavigatorParamList, T>,
    TabsScreenProps<keyof TabsParamList>
  >

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
