import { receiveSharedFile } from '@app/modules/favoritesSlice'
import {
  errorCodes,
  isErrorWithCode,
  pick as pickDocument,
  types,
} from '@react-native-documents/picker'
import { useRef } from 'react'
import { useAppDispatch } from './useAppDispatch'

interface ImportResult {
  message: string
  showSnackBar: boolean
}

export function useDataImport() {
  const dispatch = useAppDispatch()
  const isPicking = useRef(false)

  const handleImport = async (): Promise<ImportResult> => {
    if (isPicking.current) return { message: '', showSnackBar: false }
    isPicking.current = true
    try {
      const pickerResults = await pickDocument({
        presentationStyle: 'fullScreen',
        mode: 'import',
        type: [types.json, types.allFiles],
      })
      const pickerResult = pickerResults[0] // Get first file
      console.log(`result from pickDocument: ${pickerResult}`)

      if (pickerResult?.error) {
        console.error(`error with file: ${pickerResult.error}`)
      }

      if (pickerResult?.uri) {
        try {
          const importPayload = await dispatch(receiveSharedFile(pickerResult.uri))
          const importResult = importPayload.payload
          console.log(`importResult:`, importResult)

          if (importPayload.type.endsWith('/rejected')) {
            // Handle rejection
            const errorMessage = typeof importResult === 'string' ? importResult : 'import failed'
            return { message: errorMessage, showSnackBar: true }
          } else if (typeof importResult === 'string') {
            return { message: importResult, showSnackBar: true }
          } else if (importResult?.favorites) {
            const favCount = importResult.favorites.length
            const labelCount = importResult.receivedLabels.length
            const message =
              `imported ${favCount} favorite${favCount !== 1 ? 's' : ''}` +
              ` and ${labelCount} label${labelCount !== 1 ? 's' : ''}`
            return { message, showSnackBar: true }
          } else {
            return { message: 'import failed', showSnackBar: true }
          }
        } catch (parseError) {
          console.error('Parse error:', parseError)
          return { message: 'invalid file format', showSnackBar: true }
        }
      }

      return { message: '', showSnackBar: false }
    } catch (e) {
      if (isErrorWithCode(e) && e.code === errorCodes.OPERATION_CANCELED) {
        console.log('document picker canceled')
        return { message: '', showSnackBar: false }
      } else {
        console.error(JSON.stringify(e))
        return { message: `import error: ${e}`, showSnackBar: true }
      }
    } finally {
      isPicking.current = false
    }
  }

  return { handleImport }
}
