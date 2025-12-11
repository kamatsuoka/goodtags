#!/usr/bin/env node

/**
 * Bumps the package version in package.json, which serves as the
 * public-facing or marketing version of this app.
 */

const fs = require('fs')
const path = require('path')

const rootDir = path.join(__dirname, '..')
const packageJsonPath = path.join(rootDir, 'package.json')

const versionBump = process.argv[2]

if (!versionBump) {
  console.error('Usage: bump-package-version.js (major|minor|patch)')
  process.exit(1)
}

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
fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n', 'utf8')
console.log(`✓ Updated package.json version to ${newVersion}`)
