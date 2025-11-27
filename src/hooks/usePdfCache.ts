import { Directory, File, Paths } from 'expo-file-system'
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
      const cacheDir = new Directory(Paths.cache, 'pdfs')
      if (!cacheDir.exists) {
        await cacheDir.create()
      }

      // Check if file is already cached
      if (new File(cachePath).exists) {
        setState({
          localPath: cachePath,
          isLoading: false,
          error: null,
        })
        return
      }

      // Download the file
      const downloadedFile = await File.downloadFileAsync(
        pdfUri,
        new File(cachePath),
      )

      setState({
        localPath: downloadedFile.uri,
        isLoading: false,
        error: null,
      })
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
    const cacheDir = new Directory(Paths.cache, 'pdfs')
    if (cacheDir.exists) {
      cacheDir.delete()
    }
  } catch (error) {
    console.error('Failed to clear PDF cache:', error)
  }
}
