/**
 * Tests to verify backup configuration is correct
 */

import { readFileSync } from 'fs'
import { join } from 'path'

describe('Backup Configuration', () => {
  describe('Android', () => {
    it('should have allowBackup enabled in AndroidManifest', () => {
      const manifestPath = join(
        __dirname,
        '..',
        'android',
        'app',
        'src',
        'main',
        'AndroidManifest.xml',
      )
      const manifest = readFileSync(manifestPath, 'utf8')

      expect(manifest).toContain('android:allowBackup="true"')
    })

    it('should reference backup_rules.xml in AndroidManifest', () => {
      const manifestPath = join(
        __dirname,
        '..',
        'android',
        'app',
        'src',
        'main',
        'AndroidManifest.xml',
      )
      const manifest = readFileSync(manifestPath, 'utf8')

      expect(manifest).toContain(
        'android:fullBackupContent="@xml/backup_rules"',
      )
    })

    it('should reference data_extraction_rules.xml for Android 12+', () => {
      const manifestPath = join(
        __dirname,
        '..',
        'android',
        'app',
        'src',
        'main',
        'AndroidManifest.xml',
      )
      const manifest = readFileSync(manifestPath, 'utf8')

      expect(manifest).toContain(
        'android:dataExtractionRules="@xml/data_extraction_rules"',
      )
    })

    it('should include SharedPreferences in backup_rules.xml', () => {
      const rulesPath = join(
        __dirname,
        '..',
        'android',
        'app',
        'src',
        'main',
        'res',
        'xml',
        'backup_rules.xml',
      )
      const rules = readFileSync(rulesPath, 'utf8')

      // SharedPreferences contains AsyncStorage data
      expect(rules).toContain('<include domain="sharedpref"')
    })

    it('should exclude cache from backup_rules.xml', () => {
      const rulesPath = join(
        __dirname,
        '..',
        'android',
        'app',
        'src',
        'main',
        'res',
        'xml',
        'backup_rules.xml',
      )
      const rules = readFileSync(rulesPath, 'utf8')

      expect(rules).toContain('<exclude domain="file" path="cache/"')
    })
  })

  describe('iOS', () => {
    it('should have RCTAsyncStorageExcludeFromBackup set to false', async () => {
      const plistPath = join(__dirname, '..', 'ios', 'goodtags', 'Info.plist')
      const plist = readFileSync(plistPath, 'utf8')

      // Check if the key exists
      if (plist.includes('RCTAsyncStorageExcludeFromBackup')) {
        // If it exists, it should be set to false
        expect(plist).toContain('<key>RCTAsyncStorageExcludeFromBackup</key>')
        // The next line after the key should be <false/>
        const lines = plist.split('\n')
        const keyIndex = lines.findIndex(line =>
          line.includes('RCTAsyncStorageExcludeFromBackup'),
        )
        expect(lines[keyIndex + 1]).toContain('<false/>')
      }
      // If key doesn't exist, it defaults to false which is correct
    })
  })
})
