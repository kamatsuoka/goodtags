import homeIcon from '@app/components/homeIcon'
import { useAppDispatch, useAppSelector, useBodyInsets } from '@app/hooks'
import { useListStyles } from '@app/hooks/useListStyles'
import { FavoritesActions } from '@app/modules/favoritesSlice'
import { HomeNavigatorScreenProps } from '@app/navigation/navigationParams'
import { Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { Button, Divider, List, useTheme } from 'react-native-paper'

/**
 * List of labels for navigating to labeled tags
 */
export default function LabelsScreen({ navigation }: HomeNavigatorScreenProps<'Labels'>) {
  const theme = useTheme()
  const { paddingLeft, paddingRight } = useBodyInsets()
  const labels = useAppSelector(state => state.favorites.labels)
  const dispatch = useAppDispatch()
  const { listStyles, pressableStyle } = useListStyles()

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.secondaryContainer,
      paddingLeft,
      paddingRight,
    },
    scrollContent: {
      paddingHorizontal: 15,
      paddingBottom: 20,
    },
    section: {
      paddingHorizontal: 10,
    },
    emptyText: {
      color: theme.colors.outline,
      fontStyle: 'italic',
    },
    actionBar: {
      flexDirection: 'row',
      gap: 10,
      paddingHorizontal: 15,
      paddingVertical: 15,
      paddingBottom: 10,
      backgroundColor: theme.colors.secondaryContainer,
    },
    actionButton: {
      flex: 1,
      borderRadius: 20,
      backgroundColor: theme.colors.surface,
    },
  })

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <List.Section style={styles.section}>
          <View style={listStyles.listHolder}>
            {labels.length > 0 ? (
              labels.map((label, index) => (
                <View key={`label_${index}`}>
                  <Pressable
                    onPress={() => {
                      dispatch(FavoritesActions.selectLabel(label))
                      navigation.navigate('Labeled', { label })
                    }}
                    style={pressableStyle}
                  >
                    <List.Item
                      title={label}
                      left={LabelIcon}
                      right={RightIcon}
                      style={listStyles.listItem}
                      titleStyle={theme.fonts.bodyLarge}
                    />
                  </Pressable>
                  {index === labels.length - 1 ? null : <Divider />}
                </View>
              ))
            ) : (
              <List.Item
                title="no labels yet"
                titleStyle={styles.emptyText}
                style={listStyles.listItem}
              />
            )}
          </View>
        </List.Section>
      </ScrollView>
      <View style={styles.actionBar}>
        <Button
          mode="outlined"
          icon="plus"
          onPress={() => navigation.navigate('CreateLabel', {})}
          style={styles.actionButton}
        >
          new label
        </Button>
        <Button
          mode="outlined"
          icon="pencil-outline"
          onPress={() => navigation.navigate('LabelEditor')}
          style={styles.actionButton}
          disabled={labels.length === 0}
        >
          edit labels
        </Button>
      </View>
    </View>
  )
}

const RightIcon = homeIcon('chevron-right')
const LabelIcon = homeIcon('tag-outline')
