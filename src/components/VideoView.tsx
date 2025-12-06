import { useHorizontalInset } from '@app/hooks'
import { Video } from '@app/lib/models/Tag'
import { RootStackParamList } from '@app/navigation/navigationParams'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { useMemo, useRef, useState } from 'react'
import {
  Dimensions,
  FlatList,
  Platform,
  StyleSheet,
  View,
  ViewToken,
} from 'react-native'
import { useTheme } from 'react-native-paper'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import YoutubePlayer from 'react-native-youtube-iframe'

type Props = NativeStackScreenProps<RootStackParamList, 'TagVideos'>

/**
 * Full-screen carousel view for youtube videos
 */
const VideoView = ({ route }: Props) => {
  const theme = useTheme()
  const tag = route.params.tag
  const insets = useSafeAreaInsets()
  const paddingHorizontal = useHorizontalInset()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [playing, setPlaying] = useState(false)
  const flatListRef = useRef<FlatList<Video>>(null)

  const screen = Dimensions.get('window')
  const deviceAspectRatio = screen.width / screen.height

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index !== null) {
        const newIndex = viewableItems[0].index
        setCurrentIndex(newIndex)
        setPlaying(false)
      }
    },
  ).current

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current

  const containerDynamicStyles = useMemo(
    () => ({
      backgroundColor: theme.colors.background,
      paddingHorizontal,
      paddingBottom: Platform.OS === 'android' ? insets.bottom : 0,
    }),
    [theme.colors.background, paddingHorizontal, insets.bottom],
  )

  function getVideoSize() {
    const availableWidth = screen.width - paddingHorizontal * 2
    // Use more screen height in landscape mode
    const maxHeightPercent = deviceAspectRatio > VIDEO_ASPECT_RATIO ? 0.75 : 0.5
    const maxHeight = screen.height * maxHeightPercent

    if (deviceAspectRatio > VIDEO_ASPECT_RATIO) {
      // landscape mode - height constrained
      const height = Math.min(maxHeight, availableWidth / VIDEO_ASPECT_RATIO)
      const width = height * VIDEO_ASPECT_RATIO
      return { height, width }
    } else {
      // portrait mode - width constrained
      const width = availableWidth
      const height = width / VIDEO_ASPECT_RATIO
      return { height, width }
    }
  }

  const videoSize = getVideoSize()

  const renderVideo = ({ item, index }: { item: Video; index: number }) => (
    <View
      style={[
        styles.videoCard,
        { width: screen.width - paddingHorizontal * 2 },
      ]}
      key={`video-card-${index}`}
    >
      {index === currentIndex ? (
        <YoutubePlayer
          height={videoSize.height}
          width={videoSize.width}
          videoId={item.code}
          play={playing}
          onChangeState={(state: string) => {
            setPlaying(state === 'playing')
          }}
          webViewStyle={styles.webView}
          webViewProps={{
            containerStyle: {
              borderRadius: 12,
              borderWidth: 2,
              borderColor: theme.colors.outline,
            },
          }}
        />
      ) : (
        <View
          style={[
            styles.placeholder,
            {
              backgroundColor: theme.colors.surfaceVariant,
              borderColor: theme.colors.outline,
              height: videoSize.height,
              width: videoSize.width,
            },
          ]}
        />
      )}
    </View>
  )

  const renderIndicators = () => (
    <View style={styles.indicatorContainer}>
      {tag.videos.map((_, index) => (
        <View
          key={index}
          style={[
            styles.indicator,
            {
              backgroundColor:
                index === currentIndex
                  ? theme.colors.primary
                  : theme.colors.surfaceVariant,
            },
          ]}
        />
      ))}
    </View>
  )

  return (
    <View style={[styles.container, containerDynamicStyles]}>
      <FlatList
        ref={flatListRef}
        data={tag.videos}
        renderItem={renderVideo}
        keyExtractor={(item, index) => `video-${index}`}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        decelerationRate="fast"
        snapToAlignment="center"
      />
      {tag.videos.length > 1 && renderIndicators()}
    </View>
  )
}

const VIDEO_ASPECT_RATIO = 16 / 9

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  videoCard: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
  },
  videoInfo: {
    marginTop: 16,
    alignItems: 'center',
  },
  videoCounter: {
    fontSize: 14,
  },
  backButton: {
    alignSelf: 'flex-start',
    margin: 15,
  },
  webView: {
    elevation: 0,
    borderRadius: 12,
  },
  indicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  placeholder: {
    borderRadius: 12,
    borderWidth: 2,
  },
})

export default VideoView
