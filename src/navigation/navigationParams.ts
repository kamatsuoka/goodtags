import Tag from "@app/lib/models/Tag"

export type StackParamList = {
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

export type TabsParamList = {
  Search: undefined
  Favorites: {
    label?: string
  }
  HomeNavigator: undefined
  History: undefined
}

export type HomeParamList = {
  Home: undefined
  Popular: undefined
  Labeled: {label: string}
  Options: undefined
}

export type RootStackParamList = TabsParamList & StackParamList & HomeParamList
