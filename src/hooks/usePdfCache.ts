import * as FileSystem from 'expo-file-system'
import { useCallback, useEffect, useState } from 'react'

interface PdfCacheState {
  localPath: string | null
  isLoading: boolean
  error: string | null
}

const isPdf = (uri: string) => uri.toLowerCase().endsWith('.pdf')

const getCacheKey = (uri: string): string => {
  // Create a safe filename from the URI
  return uri.replace(/[^a-zA-Z0-9]/g, '_') + '.pdf'
}

const getCachePath = (cacheKey: string): string => {
  const cacheDir = `${FileSystem.cacheDirectory}pdfs/`
  return `${cacheDir}${cacheKey}`
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
  })

  const downloadPdf = useCallback(async (pdfUri: string) => {
    if (!isPdf(pdfUri)) {
      setState({
        localPath: null,
        isLoading: false,
        error: null,
      })
      return
    }

    // If it's already a local file, return it directly
    if (pdfUri.startsWith('file://')) {
      setState({
        localPath: pdfUri,
        isLoading: false,
        error: null,
      })
      return
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      const cacheKey = getCacheKey(pdfUri)
      const cachePath = getCachePath(cacheKey)

      // Ensure cache directory exists
      const cacheDir = `${FileSystem.cacheDirectory}pdfs/`
      const dirInfo = await FileSystem.getInfoAsync(cacheDir)
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(cacheDir, { intermediates: true })
      }

      // Check if file is already cached
      const fileInfo = await FileSystem.getInfoAsync(cachePath)
      if (fileInfo.exists) {
        setState({
          localPath: cachePath,
          isLoading: false,
          error: null,
        })
        return
      }

      // Download the file
      const downloadResult = await FileSystem.downloadAsync(pdfUri, cachePath)

      if (downloadResult.status === 200) {
        setState({
          localPath: downloadResult.uri,
          isLoading: false,
          error: null,
        })
      } else {
        setState({
          localPath: null,
          isLoading: false,
          error: `Download failed with status ${downloadResult.status}`,
        })
      }
    } catch (error) {
      console.error('PDF download error:', error)
      setState({
        localPath: null,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Download failed',
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
      })
    }
  }, [uri, downloadPdf])

  return state
}

/**
 * Clears the PDF cache directory
 */
export const clearPdfCache = async (): Promise<void> => {
  try {
    const cacheDir = `${FileSystem.cacheDirectory}pdfs/`
    const dirInfo = await FileSystem.getInfoAsync(cacheDir)
    if (dirInfo.exists) {
      await FileSystem.deleteAsync(cacheDir, { idempotent: true })
    }
  } catch (error) {
    console.error('Failed to clear PDF cache:', error)
  }
}
