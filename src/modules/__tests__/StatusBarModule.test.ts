import { NativeModules, Platform } from 'react-native'
import StatusBarModule from '../StatusBarModule'

jest.mock('react-native', () => ({
  NativeModules: {
    StatusBarModule: {
      setHidden: jest.fn(),
    },
  },
  Platform: {
    OS: 'android',
  },
}))

describe('StatusBarModule', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('on Android', () => {
    beforeAll(() => {
      ;(Platform as any).OS = 'android'
    })

    it('should export the native module', () => {
      expect(StatusBarModule).toBeDefined()
      expect(StatusBarModule).toBe(NativeModules.StatusBarModule)
    })

    it('should have setHidden method', () => {
      expect(StatusBarModule?.setHidden).toBeDefined()
      expect(typeof StatusBarModule?.setHidden).toBe('function')
    })

    it('should call setHidden with true', () => {
      StatusBarModule?.setHidden(true)
      expect(NativeModules.StatusBarModule.setHidden).toHaveBeenCalledWith(true)
    })

    it('should call setHidden with false', () => {
      StatusBarModule?.setHidden(false)
      expect(NativeModules.StatusBarModule.setHidden).toHaveBeenCalledWith(false)
    })
  })

  describe('on iOS', () => {
    beforeAll(() => {
      ;(Platform as any).OS = 'ios'
    })

    it('should be null on iOS', () => {
      // Re-import to get the new Platform.OS value
      jest.resetModules()
      jest.mock('react-native', () => ({
        NativeModules: {
          StatusBarModule: {
            setHidden: jest.fn(),
          },
        },
        Platform: {
          OS: 'ios',
        },
      }))
      const StatusBarModuleIOS = require('../StatusBarModule').default
      expect(StatusBarModuleIOS).toBeNull()
    })
  })
})
