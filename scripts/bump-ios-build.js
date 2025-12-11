#!/usr/bin/env node

/**
 * Bumps the build number (CURRENT_PROJECT_VERSION) in iOS project.pbxproj
 * Optionally can also bump the version in package.json
 */

const fs = require('fs')
const path = require('path')

const rootDir = path.join(__dirname, '..')
const projectPbxprojPath = path.join(
  rootDir,
  'ios/goodtags.xcodeproj/project.pbxproj',
)
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

  // Sync to iOS
  let projectContent = fs.readFileSync(projectPbxprojPath, 'utf8')
  const marketingRegex = /MARKETING_VERSION = [^;]+;/g
  projectContent = projectContent.replace(
    marketingRegex,
    `MARKETING_VERSION = ${newVersion};`,
  )
  fs.writeFileSync(projectPbxprojPath, projectContent, 'utf8')
  console.log(`✓ Updated MARKETING_VERSION to ${newVersion}`)
}

// Read current build number
let projectContent = fs.readFileSync(projectPbxprojPath, 'utf8')
const buildRegex = /CURRENT_PROJECT_VERSION = (\d+);/
const buildMatch = projectContent.match(buildRegex)

if (!buildMatch) {
  console.error(
    'Error: Could not find CURRENT_PROJECT_VERSION in project.pbxproj',
  )
  process.exit(1)
}

const currentBuild = parseInt(buildMatch[1], 10)
const newBuild = currentBuild + 1

console.log(`Bumping build number from ${currentBuild} to ${newBuild}...`)

// Replace all occurrences of CURRENT_PROJECT_VERSION
const newBuildRegex = /CURRENT_PROJECT_VERSION = \d+;/g
let matches = 0
projectContent = projectContent.replace(newBuildRegex, () => {
  matches++
  return `CURRENT_PROJECT_VERSION = ${newBuild};`
})

if (matches === 0) {
  console.error('Error: Could not replace CURRENT_PROJECT_VERSION')
  process.exit(1)
}

// Write back
fs.writeFileSync(projectPbxprojPath, projectContent, 'utf8')

console.log(
  `✓ Updated ${matches} CURRENT_PROJECT_VERSION entries to ${newBuild}`,
)
console.log('✓ Build number bumped successfully')

// Output the new build number for use in scripts
if (process.env.OUTPUT_BUILD_NUMBER === 'true') {
  console.log(`NEW_BUILD_NUMBER=${newBuild}`)
}
