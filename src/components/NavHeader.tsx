import { getHeaderTitle } from '@react-navigation/elements'
import { NativeStackHeaderProps } from '@react-navigation/native-stack'
import React from 'react'
import SharedHeader, { BackType } from './SharedHeader'

export { BackType }

/**
 * Navigation header component that can be used directly as a header in React Navigation
 */
export default function NavHeader(props: NativeStackHeaderProps) {
  const title = getHeaderTitle(props.options, props.route.name)
  const backType =
    props.options.headerBackTitle === 'cancel' ? BackType.Close : BackType.Back

  return (
    <SharedHeader
      title={title}
      backType={backType}
      headerRight={props.options.headerRight}
    />
  )
}
