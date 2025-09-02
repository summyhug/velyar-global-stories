#!/bin/bash

# StoryCamera Plugin Build Script
# This script builds the plugin for both iOS and Android

set -e

echo "🚀 Building StoryCamera Plugin..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "plugin.json" ]; then
    print_error "Please run this script from the StoryCamera plugin directory"
    exit 1
fi

# Clean previous builds
print_status "Cleaning previous builds..."
rm -rf dist/
rm -rf android/build/
rm -rf ios/build/

# Install dependencies
print_status "Installing dependencies..."
npm install

# Build TypeScript
print_status "Building TypeScript..."
npm run build

# Build Android
print_status "Building Android..."
cd android
./gradlew clean build
cd ..

# Build iOS
print_status "Building iOS..."
cd ios
pod install
cd ..

print_status "✅ StoryCamera Plugin build completed successfully!"

echo ""
echo "📱 Build outputs:"
echo "  - TypeScript: dist/"
echo "  - Android: android/build/"
echo "  - iOS: ios/build/"

echo ""
echo "🔧 Next steps:"
echo "  1. Copy the plugin to your main project"
echo "  2. Run 'npx cap sync' in your main project"
echo "  3. Test the plugin on both platforms"

echo ""
print_status "Build script completed! 🎉"
