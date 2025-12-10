#!/bin/bash

# Mobile App Setup Script
# Automates the initial setup for iOS and Android platforms

set -e

echo ""
echo "📱 Trainer App - Mobile Setup"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Detect platform
OS="$(uname -s)"
case "${OS}" in
    Darwin*)    PLATFORM=mac;;
    Linux*)     PLATFORM=linux;;
    MINGW*|MSYS*|CYGWIN*) PLATFORM=windows;;
    *)          PLATFORM=unknown;;
esac

echo "🔍 Detected platform: $PLATFORM"
echo ""

# Check Node.js
if ! command_exists node; then
    echo "❌ Node.js not found. Please install Node.js first."
    exit 1
fi

echo "✅ Node.js installed: $(node --version)"
echo "✅ npm installed: $(npm --version)"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install
echo "✅ Dependencies installed"
echo ""

# Build the web app
echo "🔨 Building web app for mobile..."
npm run build
echo "✅ Web app built"
echo ""

# Sync with Capacitor
echo "🔄 Syncing with Capacitor..."
npx cap sync 2>/dev/null || echo "⚠️  Platforms not added yet"
echo ""

# Platform-specific setup
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📱 Choose your platform:"
echo "  1) iOS (macOS only)"
echo "  2) Android (all platforms)"
echo "  3) Both"
echo "  4) Skip platform setup"
echo ""
read -p "Enter your choice (1-4): " choice

case $choice in
    1)
        if [ "$PLATFORM" != "mac" ]; then
            echo "❌ iOS development requires macOS"
            exit 1
        fi
        echo ""
        echo "🍎 Setting up iOS platform..."
        npx cap add ios
        echo "✅ iOS platform added"
        echo ""
        echo "📖 Next steps:"
        echo "  1. Run: npm run cap:open:ios"
        echo "  2. In Xcode, select your team in Signing & Capabilities"
        echo "  3. Connect your iPhone and click Run"
        echo ""
        ;;
    2)
        echo ""
        echo "🤖 Setting up Android platform..."
        npx cap add android
        echo "✅ Android platform added"
        echo ""
        echo "📖 Next steps:"
        echo "  1. Install Android Studio if not already installed"
        echo "  2. Run: npm run cap:open:android"
        echo "  3. Connect your phone or start emulator and click Run"
        echo ""
        ;;
    3)
        if [ "$PLATFORM" != "mac" ]; then
            echo "⚠️  iOS requires macOS. Setting up Android only..."
            echo ""
            echo "🤖 Setting up Android platform..."
            npx cap add android
            echo "✅ Android platform added"
        else
            echo ""
            echo "🍎 Setting up iOS platform..."
            npx cap add ios
            echo "✅ iOS platform added"
            echo ""
            echo "🤖 Setting up Android platform..."
            npx cap add android
            echo "✅ Android platform added"
        fi
        echo ""
        echo "📖 Next steps:"
        echo "  iOS: npm run cap:open:ios"
        echo "  Android: npm run cap:open:android"
        echo ""
        ;;
    4)
        echo "⏭️  Skipping platform setup"
        echo ""
        echo "You can add platforms later with:"
        echo "  npx cap add ios"
        echo "  npx cap add android"
        echo ""
        ;;
    *)
        echo "❌ Invalid choice"
        exit 1
        ;;
esac

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "✨ Setup complete!"
echo ""
echo "📚 For detailed instructions, see: MOBILE_INSTALLATION.md"
echo ""
