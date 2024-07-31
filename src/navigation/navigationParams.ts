import Tag from "@app/lib/models/Tag"

export type StackParamList = {
  Welcome: undefined
  Tabs: undefined
  Popular: undefined
  Favorites: undefined
  Label: {label: string}
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
  Home: undefined
  History: undefined
}

export type RootStackParamList = TabsParamList & StackParamList
