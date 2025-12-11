import * as React from 'react'
import {
  Animated,
  GestureResponderEvent,
  ScrollView,
  StyleProp,
  StyleSheet,
  TextStyle,
  TouchableWithoutFeedback,
  View,
  ViewStyle,
} from 'react-native'

import { Card, FAB, Text } from 'react-native-paper'
import { getFABGroupColors } from 'react-native-paper/lib/module/components/FAB/utils'
import { IconSource } from 'react-native-paper/lib/module/components/Icon'
import { MD3Theme } from 'react-native-paper/lib/typescript/types'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

export type Props = {
  /**
   * Action items to display in the form of a speed dial.
   * An action item should contain the following properties:
   * - `icon`: icon to display (required)
   * - `label`: optional label text
   * - `color`: custom icon color of the action item
   * - `labelTextColor`: custom label text color of action items
   * - `style`: pass additional styles for the fab item, for example, `backgroundColor`
   * - `containerStyle`: pass additional styles for fab item label container, e.g. `backgroundColor`
   * - `labelStyle`: pass additional styles for the fab item label, for example, `fontSize`
   * - `onPress`: callback that is called when `FAB` is pressed (required)
   * - `size`: size of action item. Defaults to `small`
   * - `testID`: testID to be used on tests
   */
  actions: Array<{
    icon: IconSource
    label?: string
    color?: string
    labelTextColor?: string
    style?: StyleProp<ViewStyle>
    containerStyle?: StyleProp<ViewStyle>
    labelStyle?: StyleProp<TextStyle>
    onPress: (e: GestureResponderEvent) => void
    size?: 'small' | 'medium'
    testID?: string
  }>
  /**
   * Accessibility label for the FAB. This is read by the screen reader when the user taps the FAB.
   */
  accessibilityLabel?: string
  /**
   * Custom color for the `FAB`.
   */
  color?: string
  /**
   * Custom backdrop color for opened speed dial background.
   */
  backdropColor?: string
  /**
   * Function to execute on pressing the `FAB`.
   */
  onPress?: (e: GestureResponderEvent) => void
  /**
   * Whether the speed dial is open.
   */
  open: boolean
  /**
   * Callback which is called on opening and closing the speed dial.
   * The open state needs to be updated when it's called, otherwise the change is dropped.
   */
  onStateChange: (state: { open: boolean }) => void
  /**
   * Whether `FAB` is currently visible.
   */
  visible?: boolean
  /**
   * Style for the group. You can use it to pass additional styles if you need.
   * For example, you can set an additional padding if you have a tab bar at the bottom.
   */
  style?: StyleProp<ViewStyle>
  /**
   * Style for the FAB. It allows to pass the FAB button styles, such as backgroundColor.
   */
  fabStyle?: StyleProp<ViewStyle>
  /**
   * @optional
   */
  theme: MD3Theme
  /**
   * Pass down testID from Group props to FAB.
   */
  testID?: string
}

/**
 * A downward-opening version of FabGroup.
 */
export const FABDown = ({
  actions,
  open,
  theme,
  style,
  onStateChange,
  backdropColor: customBackdropColor,
}: Props) => {
  const { current: backdrop } = React.useRef<Animated.Value>(new Animated.Value(0))
  const animations = React.useRef<Animated.Value[]>(
    actions.map(() => new Animated.Value(open ? 1 : 0)),
  )

  const [prevActions, setPrevActions] = React.useState<
    | {
        label?: string
        color?: string
        accessibilityLabel?: string
        style?: StyleProp<ViewStyle>
        onPress: (e: GestureResponderEvent) => void
        testID?: string
      }[]
    | null
  >(null)

  const { scale } = theme.animation

  React.useEffect(() => {
    if (open) {
      Animated.parallel([
        Animated.timing(backdrop, {
          toValue: 1,
          duration: 250 * scale,
          useNativeDriver: true,
        }),
        Animated.stagger(
          15,
          animations.current
            .map(animation =>
              Animated.timing(animation, {
                toValue: 1,
                duration: 150 * scale,
                useNativeDriver: true,
              }),
            )
            .reverse(),
        ),
      ]).start()
    } else {
      Animated.parallel([
        Animated.timing(backdrop, {
          toValue: 0,
          duration: 200 * scale,
          useNativeDriver: true,
        }),
        ...animations.current.map(animation =>
          Animated.timing(animation, {
            toValue: 0,
            duration: 150 * scale,
            useNativeDriver: true,
          }),
        ),
      ]).start()
    }
  }, [open, actions, backdrop, scale])

  const close = () => onStateChange({ open: false })

  const { labelColor, backdropColor, stackedFABBackgroundColor } = getFABGroupColors({
    theme,
    customBackdropColor,
  })

  const backdropOpacity = open
    ? backdrop.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: [0, 1, 1],
      })
    : backdrop

  const opacities = animations.current
  const scales = opacities.map(opacity =>
    open
      ? opacity.interpolate({
          inputRange: [0, 1],
          outputRange: [0.5, 1],
        })
      : 1,
  )

  const translations = opacities.map(opacity =>
    open
      ? opacity.interpolate({
          inputRange: [0, 1],
          outputRange: [-8, 8],
        })
      : 8,
  )
  const labelTranslations = opacities.map(opacity =>
    open
      ? opacity.interpolate({
          inputRange: [0, 1],
          outputRange: [-8, 8],
        })
      : 8,
  )

  const { top, bottom, right, left } = useSafeAreaInsets()

  if (actions.length !== prevActions?.length) {
    animations.current = actions.map(
      (_, i) => animations.current[i] || new Animated.Value(open ? 1 : 0),
    )
    setPrevActions(actions)
  }

  return (
    <View
      pointerEvents={open ? 'box-none' : 'none'}
      style={[
        styles.container,
        {
          paddingTop: top,
          paddingBottom: bottom,
          paddingRight: right,
          paddingLeft: left,
        },
        style,
      ]}
    >
      <TouchableWithoutFeedback accessibilityRole="button" onPress={close}>
        <Animated.View
          pointerEvents={open ? 'auto' : 'none'}
          style={[
            styles.backdrop,
            {
              opacity: backdropOpacity,
              backgroundColor: backdropColor,
            },
          ]}
        />
      </TouchableWithoutFeedback>
      <View pointerEvents="box-none" style={styles.safeArea}>
        <ScrollView pointerEvents={open ? 'box-none' : 'none'}>
          {actions.map((it, i) => {
            const labelTextStyle = {
              color: it.labelTextColor ?? labelColor,
              ...theme.fonts.titleMedium,
            }
            const marginHorizontal = typeof it.size === 'undefined' || it.size === 'small' ? 24 : 16
            const accessLabel = it.label
            const actionSize = typeof it.size !== 'undefined' ? it.size : 'small'

            return (
              <View
                key={i}
                style={[
                  styles.item,
                  {
                    marginHorizontal,
                  },
                ]}
                pointerEvents={open ? 'box-none' : 'none'}
              >
                {it.label && (
                  <View>
                    <Card
                      mode="contained"
                      onPress={e => {
                        it.onPress(e)
                        close()
                      }}
                      accessibilityLabel={accessLabel}
                      accessibilityRole="button"
                      style={
                        [
                          styles.containerStyle,
                          {
                            transform: [{ translateY: labelTranslations[i] }],
                            opacity: opacities[i],
                          },
                          styles.v3ContainerStyle,
                          it.containerStyle,
                        ] as StyleProp<ViewStyle>
                      }
                    >
                      <Text variant="titleMedium" style={[labelTextStyle, it.labelStyle]}>
                        {it.label}
                      </Text>
                    </Card>
                  </View>
                )}
                <FAB
                  size={actionSize}
                  icon={it.icon}
                  color={it.color}
                  style={
                    [
                      {
                        transform: [{ scale: scales[i] }],
                        opacity: opacities[i],
                        backgroundColor: stackedFABBackgroundColor,
                      },
                      { transform: [{ translateY: translations[i] }] },
                      it.style,
                    ] as StyleProp<ViewStyle>
                  }
                  onPress={e => {
                    it.onPress(e)
                    close()
                  }}
                  accessibilityLabel={it.label}
                  accessibilityRole="button"
                  testID={it.testID}
                  visible={open}
                />
              </View>
            )
          })}
        </ScrollView>
      </View>
    </View>
  )
}

FABDown.displayName = 'FAB.GroupDown'

const styles = StyleSheet.create({
  safeArea: {
    alignItems: 'flex-end',
    paddingTop: 35,
  },
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-start',
  },
  fab: {
    marginHorizontal: 16,
    marginBottom: 0,
    marginTop: 0,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  containerStyle: {
    borderRadius: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginVertical: 8,
    marginHorizontal: 16,
    elevation: 2,
  },
  item: {
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  v3ContainerStyle: {
    backgroundColor: 'transparent',
    elevation: 0,
  },
})
