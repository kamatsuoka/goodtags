#!/bin/bash
# Wrapper around xcodebuild that strips session-specific paths from PATH.
#
# /private/tmp/xfs-XXXXXXXX entries appear in the PATH seen by xcodebuild
# (injected somewhere in the yarn → node → detox chain) but not in the
# interactive shell. The hex suffix changes between sessions. Xcode embeds
# the full PATH in each script phase's task signature in the build manifest,
# so a changed PATH invalidates ~55 PhaseScriptExecution signatures and forces
# Create Symlinks, Hermes Replace, Generate Specs, and their downstream
# Libtool re-links to re-run on every build even when nothing changed.
# Stripping xfs-* here makes the manifest signature stable across sessions,
# allowing llbuild to correctly skip unchanged script phases.
export PATH
PATH="$(printf '%s' "$PATH" | tr ':' '\n' | grep -v '^/private/tmp/xfs-' | paste -sd':')"
exec xcodebuild "$@"
