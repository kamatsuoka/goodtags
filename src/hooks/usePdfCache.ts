import { Directory, File, Paths } from 'expo-file-system'
import { useCallback, useEffect, useState } from 'react'

interface PdfCacheState {
  localPath: string | null
  isLoading: boolean
  error: string | null
  retry: () => void
}

const isPdf = (uri: string) => uri.toLowerCase().endsWith('.pdf')

const getCacheKey = (uri: string): string => {
  // Create a safe filename from the URI
  return uri.replace(/[^a-zA-Z0-9]/g, '_') + '.pdf'
}

const getCachePath = (cacheKey: string): string => {
  const cacheDir = new Directory(Paths.cache, 'pdfs')
  return `${cacheDir.uri}${cacheKey}`
}

/**
 * Hook for downloading and caching PDF files locally.
 * Returns local file path for use with react-native-pdf-renderer.
 */
export const usePdfCache = (uri: string): PdfCacheState => {
  const [state, setState] = useState<PdfCacheState>({
    localPath: null,
    isLoading: false,
    error: null,
    retry: () => {},
  })
  const [retryCount, setRetryCount] = useState(0)

  const downloadPdf = useCallback(async (pdfUri: string) => {
    if (!isPdf(pdfUri)) {
      setState({
        localPath: null,
        isLoading: false,
        error: null,
        retry: () => {},
      })
      return
    }

    // If it's already a local file, return it directly
    if (pdfUri.startsWith('file://')) {
      setState({
        localPath: pdfUri,
        isLoading: false,
        error: null,
        retry: () => {},
      })
      return
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      const cacheKey = getCacheKey(pdfUri)
      const cachePath = getCachePath(cacheKey)

      // Ensure cache directory exists
      const cacheDir = new Directory(Paths.cache, 'pdfs')
      if (!cacheDir.exists) {
        cacheDir.create()
      }

      // Check if file is already cached
      if (new File(cachePath).exists) {
        setState({
          localPath: cachePath,
          isLoading: false,
          error: null,
          retry: () => {},
        })
        return
      }

      // Download the file
      const downloadedFile = await File.downloadFileAsync(pdfUri, new File(cachePath))

      setState({
        localPath: downloadedFile.uri,
        isLoading: false,
        error: null,
        retry: () => {},
      })
    } catch (error) {
      const e = error

      // Extract root cause from error
      let errMsg = 'Download failed'
      if (e instanceof Error) {
        // Start with the main error message
        const fullErrorString = e.toString()
        errMsg = e.message

        // Look for common error patterns and extract the key part
        if (fullErrorString.includes('UnknownHostException')) {
          errMsg = 'Unable to resolve host - check internet connection'
        } else if (fullErrorString.includes('No address associated with hostname')) {
          errMsg = 'No internet connection'
        } else if (fullErrorString.includes('status 404')) {
          errMsg = 'File not found (404)'
        } else if (fullErrorString.includes('status 403')) {
          errMsg = 'Access forbidden (403)'
        } else if (fullErrorString.includes('status 500')) {
          errMsg = 'Server error (500)'
        } else if (fullErrorString.includes('Network request failed')) {
          errMsg = 'Network request failed - check connection'
        } else if (fullErrorString.includes('timeout')) {
          errMsg = 'Download timeout - try again'
        }
      }

      const msg = `${errMsg}\n${pdfUri}`
      console.error(`${errMsg}: ${pdfUri}`)

      setState({
        localPath: null,
        isLoading: false,
        error: msg,
        retry: () => setRetryCount(c => c + 1),
      })
    }
  }, [])

  useEffect(() => {
    if (uri) {
      downloadPdf(uri)
    } else {
      setState({
        localPath: null,
        isLoading: false,
        error: null,
        retry: () => {},
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uri, retryCount]) // Retry when retryCount changes

  return state
}

/**
 * Clears the PDF cache directory
 */
export const clearPdfCache = async (): Promise<void> => {
  try {
    const cacheDir = new Directory(Paths.cache, 'pdfs')
    if (cacheDir.exists) {
      cacheDir.delete()
    }
  } catch (error) {
    console.error('Failed to clear PDF cache:', error)
  }
}
