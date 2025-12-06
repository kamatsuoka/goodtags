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

  const renderDownloads = (tag: Tag) => {
    return isFavoriteOrLabel(props.tagListType) ? null : (
      <>
        <Text
          style={[
            theme.fonts.labelSmall,
            {
              color: theme.colors.outline,
            },
          ]}
        >
          <Icon
            name="download"
            size={14}
            style={{ color: theme.colors.outline }}
          />
          {(tag as SearchResult).downloaded}
        </Text>
      </>
    )
  }

  const tag = props.tag

  const content = (
    <View
      style={[
        styles.listItem,
        {
          borderColor: theme.colors.outlineVariant,
        },
      ]}
    >
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
            style={[
              styles.title,
              theme.fonts.bodyLarge,
              {
                color: theme.colors.primary,
              },
            ]}
          >
            {tag.title}&nbsp;
            <Text
              numberOfLines={1}
              style={[
                theme.fonts.labelSmall,
                {
                  color: theme.colors.secondary,
                },
              ]}
              ellipsizeMode="tail"
            >
              {tag.aka ? `aka ${tag.aka}` : null}
            </Text>
          </Text>
        </View>
        <View style={styles.metadataContainer}>
          <View style={styles.metadataLeft}>
            <Text
              numberOfLines={1}
              style={[
                theme.fonts.labelSmall,
                { color: theme.colors.secondary },
              ]}
            >
              {arranger(tag)}
              &nbsp;
              {renderDownloads(tag)}
            </Text>
          </View>
          <TagId
            id={tag.id}
            style={[
              styles.id,
              theme.fonts.bodyLarge,
              {
                color: theme.colors.primary,
              },
            ]}
          />
        </View>
      </View>
    </View>
  )

  if (!props.onPress) {
    return content
  }

  return (
    <Pressable
      onPress={props.onPress}
      style={({ pressed }) => [
        {
          backgroundColor: pressed
            ? theme.colors.surfaceVariant
            : 'transparent',
        },
      ]}
    >
      {content}
    </Pressable>
  )
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
  listItem: {
    flex: 1,
    flexDirection: 'row',
    paddingHorizontal: 0,
    paddingVertical: 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0,
    borderBottomWidth: 1,
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
    width: 8,
  },
  id: {
    textAlign: 'left',
    width: 69,
  },
  title: {
    overflow: 'hidden',
    marginRight: 0,
    textAlign: 'left',
  },
})

export default React.memo(TagListItem)
