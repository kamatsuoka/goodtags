import { usePdfCache } from '@app/hooks'

import { Platform, StyleSheet, View } from 'react-native'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import { ActivityIndicator, Button, Text } from 'react-native-paper'
import PdfRendererView from 'react-native-pdf-renderer'
import { EdgeInsets, useSafeAreaInsets } from 'react-native-safe-area-context'
import WebView from 'react-native-webview'
import { scheduleOnRN } from 'react-native-worklets'

const isPdf = (uri: string) => uri.toLowerCase().endsWith('.pdf')
const BACKGROUND_COLOR = '#fcfcff'

type Props = {
  uri: string
  onPress: () => void
}

/**
 * Sheet musics viewer. Supports pdfs, gifs, etc.
 */
export default function SheetMusic(props: Props) {
  const { uri, onPress } = props
  const rawInsets = useSafeAreaInsets()
  const insets =
    Platform.OS === 'android'
      ? rawInsets
      : { top: 0, bottom: 0, left: 0, right: 0 }

  // Use the PDF cache hook for handling remote PDF downloads
  const { localPath, isLoading, error, retry } = usePdfCache(uri)

  // Single tap gesture that only fires if not part of a pinch/pan
  const tap = Gesture.Tap()
    .maxDuration(250)
    .onEnd(() => {
      scheduleOnRN(onPress)
    })

  // Allow simultaneous gestures so PDF viewer can handle pinch/pan
  const composed = Gesture.Simultaneous(tap)

  const pdfStyle = {
    ...styles.pdf,
    elevation: 0,
    paddingTop: insets.top,
    paddingBottom: insets.bottom,
    paddingLeft: insets.left,
    paddingRight: insets.right,
  }

  if (uri) {
    if (isPdf(uri)) {
      if (isLoading) {
        return (
          <View style={[pdfStyle, styles.centerContent]}>
            <ActivityIndicator size="large" />
            <Text style={styles.loadingText}>loading pdf...</Text>
          </View>
        )
      }

      if (error) {
        return (
          <View style={[pdfStyle, styles.centerContent]}>
            <Text style={styles.errorIcon}>⚠️</Text>
            <Text style={styles.errorTitle}>Unable to load sheet music</Text>
            <Text style={styles.errorMessage}>{uri}</Text>
            <Text style={styles.errorMessage}>
              Check your network connection and try again
            </Text>
            <Button
              mode="contained"
              onPress={retry}
              style={styles.retryButton}
              buttonColor="#6200ee"
            >
              <Text style={styles.retryText}>Retry</Text>
            </Button>
          </View>
        )
      }

      if (localPath) {
        return (
          <GestureDetector gesture={composed}>
            <View style={pdfStyle}>
              <PdfRendererView
                source={localPath}
                onError={() => console.log('PDF render error')}
                maxZoom={2.0}
                distanceBetweenPages={16}
                style={styles.pdfRenderer}
              />
            </View>
          </GestureDetector>
        )
      }

      return null
    } else {
      const source = imageSource(uri, insets)
      return (
        <WebView
          key={uri}
          source={source}
          renderError={() => <Text>Unable to load image</Text>}
          onMessage={event => {
            const data = event.nativeEvent?.data
            if (data === 'click') {
              onPress()
            } else if (data === 'retry') {
              // Force WebView to reload by updating key
              retry()
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
function imageSource(uri: string, insets: EdgeInsets): { html: string } {
  return {
    html: `<head>
         <title>sheet music</title>
         <meta name="viewport" content="width=device-width, initial-scale=1.0">
         <script>
          let imageLoadFailed = false;
          
          function handleClick() {
            if (imageLoadFailed) return; // Don't trigger onPress if image failed
            // noinspection JSUnresolvedVariable
            window.ReactNativeWebView.postMessage("click");
          }
          
          function handleImageError() {
            imageLoadFailed = true;
            const positioner = document.getElementById('positioner');
            positioner.innerHTML = \`
              <div id="error-container">
                <div id="error-icon">⚠️</div>
                <div id="error-title">Unable to load sheet music</div>
                <div id="error-message">
                  <p>${uri}</p>
                  Check your network connection and try again
                </div>
                <button id="retry-button" onclick="retryLoad()">Retry</button>
              </div>
            \`;
          }
          
          function retryLoad() {
            imageLoadFailed = false;
            const positioner = document.getElementById('positioner');
            positioner.innerHTML = \`
              <div id="loading-container">
                <div id="loading-text">Loading...</div>
              </div>
            \`;
            
            // Create new image element
            const img = document.createElement('img');
            img.id = 'music';
            img.alt = '${uri}';
            img.src = '${uri}';
            img.onerror = handleImageError;
            img.onload = function() {
              positioner.innerHTML = '';
              positioner.appendChild(img);
            };
          }
          
          window.onclick = handleClick;
         </script>
         <style>
           body {
             margin: 0;
             background-color: ${BACKGROUND_COLOR};
             font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
           }
           div#positioner {
             display: flex;
             min-height: 100vh;
             align-items: center;
             justify-content: center;
             padding: ${insets.top}px ${insets.right}px ${insets.bottom}px ${insets.left}px;
           }
           img#music {
             object-fit: contain;
             width: 100%;
             box-shadow: 0 0 1px 1px #eee;
           }
           #error-container {
             text-align: center;
             padding: 20px;
             max-width: 300px;
           }
           #error-icon {
             font-size: 48px;
             margin-bottom: 16px;
           }
           #error-title {
             font-size: 18px;
             font-weight: 600;
             color: #333;
             margin-bottom: 8px;
           }
           #error-message {
             font-size: 14px;
             color: #666;
             margin-bottom: 20px;
             line-height: 1.4;
           }
           #retry-button {
             background-color: #6200ee;
             border-radius: 2px;
             color: white;
             border: none;
             padding: 12px 24px;
             font-size: 16px;
             font-weight: 500;
             cursor: pointer;
             min-width: 100px;
           }
           #retry-button:active {
             background-color: #3700b3;
           }
           #loading-container {
             text-align: center;
             padding: 20px;
           }
           #loading-text {
             font-size: 16px;
             color: #666;
           }
         </style>
       </head>
       <body>
         <div id="positioner">
           <img id="music" alt="${uri}" src="${uri}" onerror="handleImageError()"/>
         </div>
       </body>`,
  }
}

const styles = StyleSheet.create({
  pdf: { backgroundColor: BACKGROUND_COLOR, flex: 1, elevation: 4 },
  pdfRenderer: { flex: 1, backgroundColor: BACKGROUND_COLOR },
  emptyHolder: { padding: 20 },
  emptyText: { textAlign: 'center' },
  centerContent: { justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 16, textAlign: 'center' },
  errorIcon: { fontSize: 48, marginBottom: 16, textAlign: 'center' },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
    fontFamily: Platform.select({ ios: 'System', android: 'sans-serif' }),
  },
  errorMessage: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 20,
    fontFamily: Platform.select({ ios: 'System', android: 'sans-serif' }),
  },
  retryButton: {
    marginTop: 8,
    borderRadius: 3,
  },
  retryText: {
    color: 'white',
    fontFamily: Platform.select({ ios: 'System', android: 'sans-serif' }),
    fontSize: 17,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
})
