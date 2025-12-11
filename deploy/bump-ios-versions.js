#!/usr/bin/env node

/**
 * updates the ios project config file, project.pbxproj
 * - bumps the ios project version (CURRENT_PROJECT_VERSION)
 * - syncs the marketing version (MARKETING_VERSION) from package.json
 */

const fs = require('fs')
const path = require('path')

const rootDir = path.join(__dirname, '..')
const projectPbxprojPath = path.join(rootDir, 'ios/goodtags.xcodeproj/project.pbxproj')
const packageJsonPath = path.join(rootDir, 'package.json')

const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))
const packageVersion = packageJson.version

// sync package version to iOS marketing version
let projectContent = fs.readFileSync(projectPbxprojPath, 'utf8')
const marketingRegex = /MARKETING_VERSION = [^;]+;/g
projectContent = projectContent.replace(marketingRegex, `MARKETING_VERSION = ${packageVersion};`)
console.log(`✓ Updating MARKETING_VERSION to ${packageVersion} ...`)

const projectVersionMatch = projectContent.match(/CURRENT_PROJECT_VERSION = (\d+);/)

if (!projectVersionMatch) {
  console.error('Error: Could not find CURRENT_PROJECT_VERSION in project.pbxproj')
  process.exit(1)
}

const oldProjectVersion = parseInt(projectVersionMatch[1], 10)
const newProjectVersion = oldProjectVersion + 1

console.log(`Bumping CURRENT_PROJECT_VERSION from ${oldProjectVersion} to ${newProjectVersion} ...`)

// replace all occurrences of CURRENT_PROJECT_VERSION
projectContent = projectContent.replace(
  /CURRENT_PROJECT_VERSION = \d+;/g,
  `CURRENT_PROJECT_VERSION = ${newProjectVersion};`,
)

// write back
fs.writeFileSync(projectPbxprojPath, projectContent, 'utf8')

console.log(`✓ Updated CURRENT_PROJECT_VERSION to ${newProjectVersion}`)
console.log(`✓ Updated MARKETING_VERSION to ${packageVersion} ...`)
console.log('✓ ios versions bumped successfully')
