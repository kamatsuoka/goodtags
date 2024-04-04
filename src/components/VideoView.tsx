import {useState} from "react"
import {Dimensions, StyleSheet, View} from "react-native"
import {IconButton, useTheme} from "react-native-paper"
import YoutubePlayer from "react-native-youtube-iframe"
import Tag, {Video} from "../lib/models/Tag"

/**
 * View youtube videos for a tag
 */
const VideoView = (props: {tag: Tag}) => {
  const theme = useTheme()
  const {tag} = props
  const [videoIndex, setVideoIndex] = useState(0)
  const getSelectedVideo = (): Video => tag.videos[videoIndex]

  const prevVideo = () => {
    if (videoIndex > 0) setVideoIndex(videoIndex - 1)
  }
  const nextVideo = () => {
    if (videoIndex < tag.videos.length) setVideoIndex(videoIndex + 1)
  }

  const hasPrev = videoIndex > 0
  const hasNext = videoIndex < tag.videos.length - 1
  const screen = Dimensions.get("window")
  const deviceAspectRatio = screen.width / screen.height

  const styles = StyleSheet.create({
    body: {
      margin: MARGIN,
      alignItems: "center",
      borderRadius: 20,
      justifyContent: "space-between",
    },
    webView: {
      flex: 1,
      elevation: 0,
      borderTopLeftRadius: 30,
      width: "100%",
    },
    videoView: {
      aspectRatio: VIDEO_ASPECT_RATIO,
      paddingLeft: 0,
      paddingRight: 0,
      backgroundColor: "transparent",
      margin: 0,
      alignItems: "center",
    },
    videoInner: {
      alignItems: "center",
      flexDirection: "row",
      overflow: "hidden",
      padding: 0,
      margin: 0,
    },
    arrow: {justifyContent: "center"},
  })

  function getVideoSize() {
    if (deviceAspectRatio > VIDEO_ASPECT_RATIO) {
      // normally landscape mode
      const height = screen.height - 2 * MARGIN
      const width = height * VIDEO_ASPECT_RATIO
      return {height, width}
    } else {
      const width = screen.width - 2 * MARGIN
      const height = width / VIDEO_ASPECT_RATIO
      return {height, width}
    }
  }

  const videoSize = getVideoSize()
  const buttonMode = "contained"
  const bodyStyle = StyleSheet.compose(styles.body, videoSize)

  return (
    <View style={bodyStyle}>
      <View style={styles.videoInner}>
        <IconButton
          icon="arrow-left"
          disabled={!hasPrev}
          mode={buttonMode}
          onPress={prevVideo}
          iconColor={
            hasPrev ? theme.colors.primary : theme.colors.onSurfaceDisabled
          }
          style={styles.arrow}
        />
        <YoutubePlayer
          height={videoSize.height}
          width={videoSize.width}
          videoId={getSelectedVideo().code}
          webViewStyle={styles.webView}
          webViewProps={{
            containerStyle: {
              borderRadius: 20,
              borderWidth: 2,
              borderColor: theme.colors.outline,
            },
          }}
        />
        <IconButton
          icon="arrow-right"
          disabled={!hasNext}
          mode={buttonMode}
          onPress={nextVideo}
          iconColor={
            hasNext ? theme.colors.primary : theme.colors.onSurfaceDisabled
          }
          style={styles.arrow}
        />
      </View>
    </View>
  )
}

const MARGIN = 40
const VIDEO_ASPECT_RATIO = 16 / 9

export default VideoView
