import {useAppSelector} from "@app/hooks"
import {StyleSheet, useWindowDimensions, View} from "react-native"
import {ActivityIndicator, Text} from "react-native-paper"
import Pdf from "react-native-pdf"
import WebView from "react-native-webview"

const isPdf = (uri: string) => uri.toLowerCase().endsWith(".pdf")
const BACKGROUND_COLOR = "#fcfcff"

type Props = {
  uri: string
  onPress: () => void
}

/**
 * Sheet musics viewer. Supports pdfs, pdfs, gifs, etc.
 */
export default function SheetMusic(props: Props) {
  const {uri, onPress} = props
  const {width, height} = useWindowDimensions()
  const wideMode = width >= height
  const doAutoRotate = useAppSelector(state => state.options.autoRotate)
  // on android, sometimes pdfs render before orientation change registers
  const showPdf = wideMode || !doAutoRotate

  if (uri) {
    if (isPdf(uri)) {
      return showPdf ? (
        <Pdf
          trustAllCerts={false}
          source={{uri}}
          onPageSingleTap={onPress}
          onError={error => console.log(error)}
          fitPolicy={0}
          minScale={0.5}
          maxScale={2.0}
          renderActivityIndicator={() => <ActivityIndicator />}
          style={styles.pdf}
        />
      ) : null
    } else {
      const source = imageSource(uri)
      return (
        <WebView
          key={uri}
          source={source}
          renderError={() => <Text>Unable to load image</Text>}
          onMessage={event => {
            if (event.nativeEvent?.data === "click") {
              onPress()
            }
          }}
        />
      )
    }
  } else {
    return (
      <View style={styles.emptyHolder}>
        <Text style={styles.emptyText}>No sheet music</Text>
      </View>
    )
  }
}

/**
 * HTML page for viewing non-pdf images in WebView.
 * Designed for landscape or wide screens, puts music full width.
 */
function imageSource(uri: string): {html: string} {
  return {
    html: `<head>
         <title>sheet music</title>
         <script>
          function handleClick() {
            // noinspection JSUnresolvedVariable
            window.ReactNativeWebView.postMessage("click");
          }
          window.onclick = handleClick;
         </script>
         <style>
           body {
             margin: 0;
             background-color: ${BACKGROUND_COLOR};
           }
           div#positioner {
             display: flex;
             min-height: 100vh;
             align-items: center;
             justify-content: center;
           }
           img#music {
             object-fit: contain;
             width: 100%;
             box-shadow: 0 0 1px 1px #eee;
           }
         </style>
       </head>
       <body>
         <div id="positioner">
           <img id="music" alt=${uri} src="${uri}"/>
         </div>
       </body>`,
  }
}

const styles = StyleSheet.create({
  pdf: {
    backgroundColor: BACKGROUND_COLOR,
    flex: 1,
    elevation: 4,
  },
  emptyHolder: {padding: 20},
  emptyText: {
    textAlign: "center",
  },
})
