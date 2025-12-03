#!/usr/bin/env node

/**
 * Updates android/app/build.gradle to use release signing configuration
 */

const fs = require('fs')
const path = require('path')

const rootDir = path.join(__dirname, '..')
const buildGradlePath = path.join(rootDir, 'android/app/build.gradle')

console.log('Updating build.gradle for release signing...')

let content = fs.readFileSync(buildGradlePath, 'utf8')

// Check if already configured
if (content.includes('keystoreProperties')) {
  console.log('✓ build.gradle already configured for release signing')
  process.exit(0)
}

// Add keystore properties loading before android { block
const androidBlockRegex =
  /(\/\/ Read version from package\.json[\s\S]*?\n)(android \{)/
if (!androidBlockRegex.test(content)) {
  console.error('Error: Could not find expected structure in build.gradle')
  console.error('Please update build.gradle manually.')
  process.exit(1)
}

content = content.replace(
  androidBlockRegex,
  `$1
// Load keystore properties for release signing
def keystorePropertiesFile = rootProject.file("keystore.properties")
def keystoreProperties = new Properties()
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}

$2`,
)

// Update signingConfigs to include release configuration
const signingConfigsRegex =
  /(signingConfigs \{[\s\S]*?debug \{[\s\S]*?\})\s*(\})/
content = content.replace(
  signingConfigsRegex,
  `$1
        release {
            if (keystorePropertiesFile.exists()) {
                storeFile file(keystoreProperties['storeFile'])
                storePassword keystoreProperties['storePassword']
                keyAlias keystoreProperties['keyAlias']
                keyPassword keystoreProperties['keyPassword']
            }
        }
    $2`,
)

// Update release buildType to use release signing
content = content.replace(
  /release \{[\s\S]*?signingConfig signingConfigs\.debug/,
  `release {
            signingConfig signingConfigs.release`,
)

// Write back
fs.writeFileSync(buildGradlePath, content, 'utf8')

console.log('✓ Updated build.gradle successfully')
console.log('\nChanges made:')
console.log('1. Added keystoreProperties loading')
console.log('2. Added release signing configuration')
console.log('3. Updated release buildType to use release signing')
console.log('\nYou can now build release APKs/AABs with proper signing.')
