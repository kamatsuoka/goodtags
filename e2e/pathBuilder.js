// custom artifact path builder for detox screenshots
// removes spaces, emoji, and unnecessary nesting from default detox paths

const path = require('path')

module.exports = class CustomPathBuilder {
  constructor(config) {
    this._rootDir = config.rootDir || '.'
  }

  buildPathForTestArtifact(artifactName, testSummary) {
    // structure: <rootDir>/<testName>/<artifactName>
    // handle startup artifacts that don't have a test context
    if (!testSummary || !testSummary.title) {
      return path.join(this._rootDir, artifactName)
    }
    const testName = testSummary.title.replace(/\s+/g, '-')
    return path.join(this._rootDir, testName, artifactName)
  }
}
