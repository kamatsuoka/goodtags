import type { AppState } from '@app/store'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Alert } from 'react-native'

/**
 * CURRENTLY UNUSED
 * 
 * the idea is to remind users periodically to back up their data
 */

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
    'Backup your data',
    "We recommend backing up your favorites and labels in the cloud somewhere so you can restore them when you get a new device. Would you like to do that now?",
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
          // todo: navigate to DataScreen and open share dialog --- IGNORE ---
          await markBackupCreated()
        },
      },
    ],
  )
}
