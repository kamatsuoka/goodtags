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
  Tabs: undefined
}

export type TabsParamList = {
  Search: undefined
  Library: {
    label?: string
  }
  Popular: undefined
  History: undefined
}

export type RootStackParamList = TabsParamList &
  StackParamList &
  DrawerParamList
