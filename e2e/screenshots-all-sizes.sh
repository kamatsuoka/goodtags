#!/bin/bash
# generate screenshots for all required ios device sizes

set -e

echo "🎬 generating ios screenshots for all app store device sizes..."
echo ""

# apple requires screenshots for multiple device sizes
echo "📱 generating 13inch (ipad) screenshots..."
./scripts/generate-screenshots.sh 13inch

echo ""
echo "📱 generating 6.5inch (iphone) screenshots..."
./scripts/generate-screenshots.sh 6.5inch

echo ""
echo "✅ all screenshots generated!"
echo "📂 check the screenshots/ios/ directory for all captures
