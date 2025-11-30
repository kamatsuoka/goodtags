import { useBodyInsets, useHorizontalInset } from '@app/hooks'
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons'
import { getHeaderTitle } from '@react-navigation/elements'
import { useNavigation } from '@react-navigation/native'
import { NativeStackHeaderProps } from '@react-navigation/native-stack'
import React, { ComponentProps } from 'react'
import { StyleSheet, TouchableWithoutFeedback, View } from 'react-native'
import { Text, useTheme } from 'react-native-paper'
import useHeaderHeight from '../hooks/useHeaderHeight'
import BackButton from './BackButton'
import homeIcon from './homeIcon'

type CommonHeaderProps = {
  backType?: BackType
  title?: string | React.ReactNode
  titleIcon?: ComponentProps<typeof Icon>['name']
  insetHeader?: boolean
  headerRight?: (props: any) => React.ReactNode
}

const LOGO_SIZE = 30
const BUTTON_SIZE = LOGO_SIZE + 10

export enum BackType {
  Back,
  Cancel,
}

export const navHeader =
  (insetHeader: boolean) => (props: NativeStackHeaderProps) => {
    const title = getHeaderTitle(props.options, props.route.name)
    const backType =
      props.options.headerBackTitle === 'cancel'
        ? BackType.Cancel
        : BackType.Back
    return (
      <CommonHeader
        title={title}
        backType={backType}
        insetHeader={insetHeader}
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
  insetHeader = false,
  headerRight,
}: CommonHeaderProps) {
  const { paddingLeft } = useBodyInsets()
  const headerInset = useHorizontalInset()
  const navigation = useNavigation()
  const headerHeight = useHeaderHeight()
  const theme = useTheme()

  const themedStyles = StyleSheet.create({
    logoButton: {
      width: BUTTON_SIZE,
      height: BUTTON_SIZE,
      backgroundColor: 'transparent',
    },
    header: {
      backgroundColor: theme.colors.primary,
      height: headerHeight,
      paddingHorizontal: 0,
    },
    title: {
      ...styles.title,
      color: theme.colors.onPrimary,
    },
    headerContent: {
      ...styles.headerContent,
      paddingHorizontal: insetHeader ? headerInset : paddingLeft,
    },
  })

  const backButton = () => {
    if (backType === BackType.Cancel) {
      return (
        <Text style={styles.cancel} onPress={navigation.goBack}>
          cancel
        </Text>
      )
    }
    if (backType === BackType.Back) {
      return (
        <TouchableWithoutFeedback>
          <BackButton />
        </TouchableWithoutFeedback>
      )
    }
    return <View style={styles.spacer} />
  }

  const titleComponent =
    typeof title === 'string' ? (
      <View style={styles.titleHolder}>
        {titleIcon ? homeIcon(titleIcon)() : null}
        <Text variant="titleMedium" style={themedStyles.title}>
          {title}
        </Text>
      </View>
    ) : (
      title
    )

  return (
    <View style={themedStyles.header}>
      <View style={themedStyles.headerContent}>
        {backButton()}
        {titleComponent}
        {headerRight ? headerRight({}) : <View style={styles.spacer} />}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  headerContent: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    justifyContent: 'space-between',
    flex: 1,
  },
  cancel: {
    marginLeft: 10,
    marginBottom: 12,
  },
  spacer: {
    width: 50,
  },
  titleHolder: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    marginLeft: 5,
  },
})
