import Tag, { SearchResult } from '@app/lib/models/Tag'
import { TagListType } from '@app/modules/tagLists'
import { isFavoriteOrLabel } from '@app/modules/tagListUtil'
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons'
import React from 'react'
import { StyleSheet, View } from 'react-native'
import { Pressable } from 'react-native-gesture-handler'
import { Text, useTheme } from 'react-native-paper'
import TagId from './TagId'
import { arranger } from './tagInfo'

export type ComponentProps = {
  tag: Tag
  tagListType: TagListType
  index: number
  selected: boolean
  onPress?: () => void
}

type Props = ComponentProps

/**
 * A tag displayed in a list
 */
const TagListItem = React.memo((props: Props) => {
  const theme = useTheme()

  const themedStyles = StyleSheet.create({
    listItem: {
      flex: 1,
      flexDirection: 'row',
      paddingHorizontal: 0,
      paddingVertical: 2,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 0,
      borderBottomWidth: 1,
      borderColor: theme.colors.outlineVariant,
    },
    title: {
      color: theme.colors.primary,
      overflow: 'hidden',
      marginRight: 0,
      textAlign: 'left',
      fontSize: 18,
    },
    arranger: {
      color: theme.colors.secondary,
      fontSize: 13,
    },
    downloads: {
      color: theme.colors.outline,
      fontSize: 12,
    },
    downloadIcon: {
      color: theme.colors.outline,
    },
    id: {
      color: theme.colors.primary,
      fontSize: 18,
      textAlign: 'left',
      width: 69,
    },
    aka: {
      color: theme.colors.secondary,
      fontSize: 12,
    },
  })

  const renderDownloads = (tag: Tag) => {
    return isFavoriteOrLabel(props.tagListType) ? null : (
      <>
        <Text style={themedStyles.downloads}>
          <Icon name="download" size={14} style={themedStyles.downloadIcon} />
          {(tag as SearchResult).downloaded}
        </Text>
      </>
    )
  }

  const tag = props.tag

  const content = (
    <View style={themedStyles.listItem}>
      <View style={styles.dotHolder}>
        <Text testID={`tagleft_${tag.id}`} style={styles.selectedDot}>
          {props.selected ? '•' : ''}
        </Text>
      </View>
      <View style={styles.body}>
        <View style={styles.titleView}>
          <Text
            testID={`title_${tag.id}`}
            numberOfLines={1}
            style={themedStyles.title}
          >
            {tag.title}&nbsp;
            <Text
              numberOfLines={1}
              style={themedStyles.aka}
              ellipsizeMode="tail"
            >
              {tag.aka ? `aka ${tag.aka}` : null}
            </Text>
          </Text>
        </View>
        <View style={styles.metadataContainer}>
          <View style={styles.metadataLeft}>
            <Text numberOfLines={1} style={themedStyles.arranger}>
              {arranger(tag)}
              &nbsp;
              {renderDownloads(tag)}
            </Text>
          </View>
          <TagId id={tag.id} style={themedStyles.id} />
        </View>
      </View>
    </View>
  )

  if (!props.onPress) {
    return content
  }

  return <Pressable onPress={props.onPress}>{content}</Pressable>
})

const styles = StyleSheet.create({
  ripple: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  body: {
    flex: 1,
    alignItems: 'flex-start',
  },
  tagIcon: {
    alignSelf: 'center',
    paddingTop: 10,
  },
  metadataContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metadataLeft: {
    flexGrow: 1,
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  titleView: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dotHolder: {
    flex: 0,
    paddingHorizontal: 3,
  },
  selectedDot: {
    alignSelf: 'flex-start',
    fontSize: 14,
    width: 8,
  },
})

export default React.memo(TagListItem)
