#!/usr/bin/env node

/**
 * Bumps the Android versionCode in app/build.gradle
 * Optionally can also bump the version in package.json
 */

const fs = require('fs')
const path = require('path')

const rootDir = path.join(__dirname, '..')
const buildGradlePath = path.join(rootDir, 'android/app/build.gradle')
const packageJsonPath = path.join(rootDir, 'package.json')

// Check if we should bump version (major, minor, patch)
const versionBump = process.argv[2] // e.g., 'patch', 'minor', 'major'

if (versionBump) {
  console.log(`Bumping ${versionBump} version...`)
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))
  const [major, minor, patch] = packageJson.version.split('.').map(Number)

  let newVersion
  if (versionBump === 'major') {
    newVersion = `${major + 1}.0.0`
  } else if (versionBump === 'minor') {
    newVersion = `${major}.${minor + 1}.0`
  } else if (versionBump === 'patch') {
    newVersion = `${major}.${minor}.${patch + 1}`
  } else {
    console.error('Invalid version bump type. Use: major, minor, or patch')
    process.exit(1)
  }

  packageJson.version = newVersion
  fs.writeFileSync(
    packageJsonPath,
    JSON.stringify(packageJson, null, 2) + '\n',
    'utf8',
  )
  console.log(`✓ Updated package.json version to ${newVersion}`)
}

// Read current versionCode
let buildGradleContent = fs.readFileSync(buildGradlePath, 'utf8')
const versionCodeRegex = /versionCode\s+(\d+)/
const versionMatch = buildGradleContent.match(versionCodeRegex)

if (!versionMatch) {
  console.error('Error: Could not find versionCode in build.gradle')
  process.exit(1)
}

const currentVersionCode = parseInt(versionMatch[1], 10)
const newVersionCode = currentVersionCode + 1

console.log(
  `Bumping Android versionCode from ${currentVersionCode} to ${newVersionCode}...`,
)

// Replace versionCode
buildGradleContent = buildGradleContent.replace(
  versionCodeRegex,
  `versionCode ${newVersionCode}`,
)

// Write back
fs.writeFileSync(buildGradlePath, buildGradleContent, 'utf8')

console.log(`✓ Updated versionCode to ${newVersionCode}`)
console.log('✓ Android build number bumped successfully')

// Output the new version code for use in scripts
if (process.env.OUTPUT_VERSION_CODE === 'true') {
  console.log(`NEW_VERSION_CODE=${newVersionCode}`)
}
