import { FABDown } from '@app/components/FABDown'
import homeIcon from '@app/components/homeIcon'
import { MAX_FONT_SIZE_MULTIPLIER, Text } from '@app/components/Text'
import CommonStyles from '@app/constants/CommonStyles'
import { useAppDispatch, useAppSelector, useBodyInsets } from '@app/hooks'
import { useFabDownStyle } from '@app/hooks/useFabDownStyle'
import { useListStyles } from '@app/hooks/useListStyles'
import { FavoritesActions } from '@app/modules/favoritesSlice'
import { HomeNavigatorScreenProps } from '@app/navigation/navigationParams'
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet'
import { useCallback, useLayoutEffect, useRef, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { Button, Divider, IconButton, List, useTheme } from 'react-native-paper'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

function LabelsMenuButton({ color, onPress }: { color: string; onPress: () => void }) {
  return <IconButton icon="menu" iconColor={color} size={22} onPress={onPress} testID="menu" />
}

/**
 * List of labels for navigating to labeled tags
 */
export default function LabelsScreen({ navigation }: HomeNavigatorScreenProps<'Labels'>) {
  const theme = useTheme()
  const insets = useSafeAreaInsets()
  const { paddingLeft, paddingRight } = useBodyInsets()
  const labels = useAppSelector(state => state.favorites.labels)
  const dispatch = useAppDispatch()
  const { listStyles, pressableStyle } = useListStyles()
  const [fabOpen, setFabOpen] = useState(false)
  const fabStyleSheet = useFabDownStyle()
  const confirmSheetRef = useRef<BottomSheetModal>(null)

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.3}
        pressBehavior="close"
      />
    ),
    [],
  )

  const openFab = useCallback(() => setFabOpen(true), [])
  const headerRight = useCallback(
    () => <LabelsMenuButton color={theme.colors.onPrimary} onPress={openFab} />,
    [theme.colors.onPrimary, openFab],
  )

  useLayoutEffect(() => {
    navigation.setOptions({ headerRight })
  }, [navigation, headerRight])

  const fabActions = [
    {
      icon: 'broom',
      label: 'remove all labels',
      onPress: () => confirmSheetRef.current?.present(),
      testID: 'remove-all',
    },
  ]

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
    sheetContainer: {
      paddingHorizontal: Math.max(24, insets.left + 24, insets.right + 24),
      paddingTop: 8,
      paddingBottom: Math.max(24, insets.bottom),
    },
    sheetAction: {
      alignItems: 'center',
      paddingVertical: 18,
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
                      titleMaxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER}
                      testID={label}
                    />
                  </Pressable>
                  {index === labels.length - 1 ? null : <Divider />}
                </View>
              ))
            ) : (
              <List.Item
                title="no labels yet"
                titleStyle={styles.emptyText}
                titleMaxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER}
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
          labelStyle={theme.fonts.bodyLarge}
          maxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER}
          testID="labels_new"
        >
          new
        </Button>
        <Button
          mode="outlined"
          icon="pencil-outline"
          onPress={() => navigation.navigate('LabelEditor')}
          style={styles.actionButton}
          labelStyle={theme.fonts.bodyLarge}
          maxFontSizeMultiplier={MAX_FONT_SIZE_MULTIPLIER}
          disabled={labels.length === 0}
          testID="labels_edit"
        >
          edit
        </Button>
      </View>
      <FABDown
        open={fabOpen}
        actions={fabActions}
        onStateChange={({ open }) => setFabOpen(open)}
        style={fabStyleSheet.fabGroup}
        fabStyle={CommonStyles.fabDown}
        color={theme.colors.onPrimary}
        theme={theme}
      />
      <BottomSheetModal
        ref={confirmSheetRef}
        enableDynamicSizing
        enablePanDownToClose
        backgroundStyle={{ backgroundColor: theme.colors.surface }}
        handleIndicatorStyle={{ backgroundColor: theme.colors.outline }}
        backdropComponent={renderBackdrop}
      >
        <BottomSheetView style={styles.sheetContainer}>
          <Pressable
            onPress={() => {
              confirmSheetRef.current?.dismiss()
              dispatch(FavoritesActions.resetLabels())
            }}
            style={styles.sheetAction}
            testID="remove-labels-confirm"
          >
            <Text variant="bodyLarge" style={{ color: theme.colors.error }}>
              remove all labels
            </Text>
          </Pressable>
          <Divider />
          <Pressable onPress={() => confirmSheetRef.current?.dismiss()} style={styles.sheetAction}>
            <Text variant="bodyLarge">cancel</Text>
          </Pressable>
        </BottomSheetView>
      </BottomSheetModal>
    </View>
  )
}

const RightIcon = homeIcon('chevron-right')
const LabelIcon = homeIcon('tag-outline')
