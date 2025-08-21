#!/bin/bash

echo "=== AppDelegate Files Status ==="
echo ""

echo "Files in ios/goodtags directory:"
ls -la ios/goodtags/AppDelegate.*

echo ""
echo "Files referenced in Xcode project:"
grep -n "AppDelegate" ios/goodtags.xcodeproj/project.pbxproj

echo ""
echo "=== Current AppDelegate Configuration ==="
echo "Swift file exists: $([ -f ios/goodtags/AppDelegate.swift ] && echo "✅ YES" || echo "❌ NO")"
echo "Objective-C header exists: $([ -f ios/goodtags/AppDelegate.h ] && echo "⚠️  YES (should be removed)" || echo "✅ NO")"
echo "Objective-C implementation exists: $([ -f ios/goodtags/AppDelegate.mm ] && echo "⚠️  YES (should be removed)" || echo "✅ NO")"

echo ""
echo "=== Next Steps ==="
echo "1. Open Xcode workspace: ios/goodtags.xcworkspace"
echo "2. Remove AppDelegate.h and AppDelegate.mm from project"
echo "3. Add AppDelegate.swift to project"
echo "4. Configure Swift language version in Build Settings"
echo "5. Clean and rebuild project"
