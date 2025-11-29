#!/usr/bin/env node

/**
 * Syncs version from package.json to iOS project.pbxproj
 * Run this script whenever you update the version in package.json
 */

const fs = require('fs')
const path = require('path')

const rootDir = path.join(__dirname, '..')
const packageJsonPath = path.join(rootDir, 'package.json')
const projectPbxprojPath = path.join(
  rootDir,
  'ios/goodtags.xcodeproj/project.pbxproj',
)

// Read version from package.json
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))
const version = packageJson.version

console.log(`Syncing version ${version} to iOS project...`)

// Read project.pbxproj
let projectContent = fs.readFileSync(projectPbxprojPath, 'utf8')

// Replace MARKETING_VERSION in both Debug and Release configurations
const regex = /MARKETING_VERSION = [^;]+;/g
const newValue = `MARKETING_VERSION = ${version};`

let matches = 0
projectContent = projectContent.replace(regex, match => {
  matches++
  return newValue
})

if (matches === 0) {
  console.error('Error: Could not find MARKETING_VERSION in project.pbxproj')
  process.exit(1)
}

// Write back
fs.writeFileSync(projectPbxprojPath, projectContent, 'utf8')

console.log(`✓ Updated ${matches} MARKETING_VERSION entries to ${version}`)
console.log('✓ iOS version synced successfully')
