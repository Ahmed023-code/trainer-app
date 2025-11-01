#!/bin/bash

echo "🚀 Installing VS Code Extensions for Instant Testing..."
echo ""

# Check if VS Code CLI is available
if ! command -v code &> /dev/null; then
    echo "❌ VS Code CLI not found!"
    echo ""
    echo "To install:"
    echo "1. Open VS Code"
    echo "2. Press Cmd+Shift+P (Mac) or Ctrl+Shift+P (Windows)"
    echo "3. Type 'Shell Command: Install code command in PATH'"
    echo "4. Run this script again"
    exit 1
fi

echo "Installing extensions..."
echo ""

# Essential TypeScript/Error checking
echo "1/8 📍 Error Lens (shows errors inline)"
code --install-extension usernamehm.errorlens

echo "2/8 🔤 TypeScript Error Translator"
code --install-extension mattpocock.ts-error-translator

echo "3/8 ✨ Pretty TypeScript Errors"
code --install-extension yoavbls.pretty-ts-errors

echo "4/8 🔍 ESLint"
code --install-extension dbaeumer.vscode-eslint

echo "5/8 🎨 Tailwind CSS IntelliSense"
code --install-extension bradlc.vscode-tailwindcss

echo "6/8 🌐 Live Server"
code --install-extension ritwickdey.LiveServer

echo "7/8 👁️ Live Preview"
code --install-extension ms-vscode.live-server

echo "8/8 💅 Prettier"
code --install-extension esbenp.prettier-vscode

echo ""
echo "✅ All extensions installed!"
echo ""
echo "📝 Next steps:"
echo "1. Restart VS Code"
echo "2. Open any TypeScript file"
echo "3. Make an error (e.g., const x: number = 'hello')"
echo "4. See the error appear INSTANTLY inline!"
echo ""
echo "🎯 No more waiting for npm commands!"
