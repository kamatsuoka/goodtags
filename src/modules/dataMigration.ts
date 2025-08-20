import type { AppState } from '@app/store'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Alert, Platform } from 'react-native'
import ReactNativeBlobUtil from 'react-native-blob-util'
import Share from 'react-native-share'

/**
 * Data migration utility for goodtags app
 * Helps users backup and restore their data when getting new devices
 */

export interface BackupData {
  version: string
  timestamp: string
  platform: 'ios' | 'android'
  reduxState: AppState
  metadata: {
    appVersion: string
    deviceInfo?: string
  }
}

/**
 * Creates a complete backup of user data
 */
export const createFullBackup = async (): Promise<string> => {
  try {
    // Get the current Redux state from AsyncStorage
    const persistedState = await AsyncStorage.getItem('persist:root')

    if (!persistedState) {
      throw new Error('No user data found to backup')
    }

    const backupData: BackupData = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      platform: Platform.OS as 'ios' | 'android',
      reduxState: JSON.parse(persistedState),
      metadata: {
        appVersion: '3.0.5', // TODO: Get this dynamically from package.json
      },
    }

    const backupString = JSON.stringify(backupData, null, 2)

    // Save to file
    const fs = ReactNativeBlobUtil.fs
    const dir =
      Platform.OS === 'ios'
        ? fs.dirs.DocumentDir + '/goodtags-backups'
        : fs.dirs.DownloadDir + '/goodtags-backups'

    const dirExists = await fs.isDir(dir)
    if (!dirExists) {
      await fs.mkdir(dir)
    }

    const filename = `goodtags-backup-${getDateString(new Date())}.json`
    const filepath = `${dir}/${filename}`

    await fs.writeFile(filepath, backupString, 'utf8')

    return filepath
  } catch (error) {
    console.error('Error creating backup:', error)
    throw error
  }
}

/**
 * Restores user data from a backup file
 */
export const restoreFromBackup = async (
  backupContent: string,
): Promise<boolean> => {
  try {
    const backupData: BackupData = JSON.parse(backupContent)

    // Validate backup format
    if (!backupData.version || !backupData.reduxState) {
      throw new Error('Invalid backup format')
    }

    // Show confirmation dialog
    return new Promise(resolve => {
      Alert.alert(
        'Restore Backup',
        `This will restore data from ${new Date(
          backupData.timestamp,
        ).toLocaleDateString()}. Your current data will be replaced. Continue?`,
        [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => resolve(false),
          },
          {
            text: 'Restore',
            style: 'destructive',
            onPress: async () => {
              try {
                // Clear existing data
                await AsyncStorage.clear()

                // Restore the Redux state
                await AsyncStorage.setItem(
                  'persist:root',
                  JSON.stringify(backupData.reduxState),
                )

                Alert.alert(
                  'Restore Complete',
                  'Your data has been restored. Please restart the app to see the changes.',
                  [{ text: 'OK' }],
                )

                resolve(true)
              } catch (error) {
                console.error('Error restoring backup:', error)
                Alert.alert(
                  'Restore Failed',
                  'There was an error restoring your data. Please try again.',
                )
                resolve(false)
              }
            },
          },
        ],
      )
    })
  } catch (error) {
    console.error('Error parsing backup:', error)
    Alert.alert(
      'Invalid Backup',
      'The backup file appears to be corrupted or invalid.',
    )
    return false
  }
}

/**
 * Shares a backup file with other apps
 */
export const shareBackup = async (): Promise<void> => {
  try {
    const backupPath = await createFullBackup()

    const shareOptions = {
      title: 'goodtags Data Backup',
      message: "Here's your goodtags app data backup. Keep this file safe!",
      url: `file://${backupPath}`,
      type: 'application/json',
      filename: 'goodtags-backup.json',
    }

    await Share.open(shareOptions)
  } catch (error) {
    console.error('Error sharing backup:', error)
    Alert.alert('Share Failed', 'Unable to share backup file.')
  }
}

/**
 * Checks if user needs to be reminded about backing up data
 */
export const shouldRemindBackup = async (): Promise<boolean> => {
  try {
    const lastBackupReminder = await AsyncStorage.getItem('lastBackupReminder')
    const lastBackup = await AsyncStorage.getItem('lastBackupDate')

    if (!lastBackupReminder && !lastBackup) {
      return true // New user, show reminder
    }

    const now = Date.now()
    const reminderInterval = 30 * 24 * 60 * 60 * 1000 // 30 days

    if (lastBackupReminder) {
      const lastReminderTime = parseInt(lastBackupReminder, 10)
      return now - lastReminderTime > reminderInterval
    }

    return false
  } catch (error) {
    console.error('Error checking backup reminder:', error)
    return false
  }
}

/**
 * Marks that user was reminded about backup
 */
export const markBackupReminderShown = async (): Promise<void> => {
  try {
    await AsyncStorage.setItem('lastBackupReminder', Date.now().toString())
  } catch (error) {
    console.error('Error marking backup reminder:', error)
  }
}

/**
 * Marks that user created a backup
 */
export const markBackupCreated = async (): Promise<void> => {
  try {
    await AsyncStorage.setItem('lastBackupDate', Date.now().toString())
  } catch (error) {
    console.error('Error marking backup created:', error)
  }
}

/**
 * Shows backup reminder dialog
 */
export const showBackupReminder = (): void => {
  Alert.alert(
    'Backup Your Data',
    "To ensure you don't lose your favorites and labels when getting a new device, we recommend creating a backup. Would you like to create one now?",
    [
      {
        text: 'Later',
        style: 'cancel',
        onPress: markBackupReminderShown,
      },
      {
        text: 'Create Backup',
        onPress: async () => {
          await markBackupReminderShown()
          await shareBackup()
          await markBackupCreated()
        },
      },
    ],
  )
}

// Helper function
const getDateString = (date: Date): string => {
  const zeroPad = (num: number): string => num.toString().padStart(2, '0')
  const year = date.getFullYear()
  const month = zeroPad(date.getMonth() + 1)
  const day = zeroPad(date.getDate())
  const hours = zeroPad(date.getHours())
  const minutes = zeroPad(date.getMinutes())
  return `${year}-${month}-${day}T${hours}-${minutes}`
}
