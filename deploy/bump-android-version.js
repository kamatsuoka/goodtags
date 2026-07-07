#!/usr/bin/env node

/**
 * Bumps the Android versionCode in app/build.gradle
 */

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')
const rootDir = path.join(__dirname, '..')
const buildGradlePath = path.join(rootDir, 'android/app/build.gradle')

// Read current versionCode
let buildGradle = fs.readFileSync(buildGradlePath, 'utf8')
const versionCodeRegex = /versionCode\s+(\d+)/
const versionMatch = buildGradle.match(versionCodeRegex)

if (!versionMatch) {
  console.error('Error: Could not find versionCode in build.gradle')
  process.exit(1)
}

const oldVersionCode = parseInt(versionMatch[1], 10)
const newVersionCode = oldVersionCode + 1
exports.newVersionCode = newVersionCode

console.log(`Bumping Android versionCode from ${oldVersionCode} to ${newVersionCode}...`)

// Replace versionCode
buildGradle = buildGradle.replace(versionCodeRegex, `versionCode ${newVersionCode}`)

// Write back
fs.writeFileSync(buildGradlePath, buildGradle, 'utf8')

console.log(`✓ Updated versionCode to ${newVersionCode}`)

const tagName = `android-${newVersionCode}`
console.log(`Committing build.gradle and adding git tag ${tagName}`)
execSync(`git add ${buildGradlePath}`, { cwd: rootDir, stdio: 'inherit' })
execSync(`git commit -m "Bump android versionCode to ${newVersionCode}"`, {
  cwd: rootDir,
  stdio: 'inherit',
})
execSync(`git tag ${tagName}`, { cwd: rootDir, stdio: 'inherit' })
