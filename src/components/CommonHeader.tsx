import { MaterialCommunityIcons as Icon } from '@expo/vector-icons'
import { getHeaderTitle } from '@react-navigation/elements'
import { NativeStackHeaderProps } from '@react-navigation/native-stack'
import React, { ComponentProps } from 'react'
import SharedHeader, { BackType } from './SharedHeader'

type CommonHeaderProps = {
  backType?: BackType
  title?: string | React.ReactNode
  titleIcon?: ComponentProps<typeof Icon>['name']
  headerRight?: (props: any) => React.ReactNode
}

export { BackType }

export const navHeader = () => (props: NativeStackHeaderProps) => {
  const title = getHeaderTitle(props.options, props.route.name)
  const backType =
    props.options.headerBackTitle === 'cancel' ? BackType.Cancel : BackType.Back
  return (
    <CommonHeader
      title={title}
      backType={backType}
      headerRight={props.options.headerRight}
    />
  )
}

/**
 * Header to go atop tag list
 */
export default function CommonHeader({
  backType = BackType.Back,
  title = '',
  titleIcon,
  headerRight,
}: CommonHeaderProps) {
  return (
    <SharedHeader
      title={title}
      titleIcon={titleIcon}
      backType={backType}
      headerRight={headerRight}
    />
  )
}
