import Tag from "@app/lib/models/Tag"
import {NavigatorScreenParams} from "@react-navigation/native"

export type StackParamList = {
  Welcome: undefined
  Drawer: NavigatorScreenParams<DrawerParamList>
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

export type DrawerParamList = {
  Tabs: {
    cameFromTagScreen: boolean
  }
}

export type TabsParamList = {
  Search: undefined
  Favorites: {
    label?: string
  }
  Popular: undefined
  History: undefined
}

export type RootStackParamList = TabsParamList &
  StackParamList &
  DrawerParamList
