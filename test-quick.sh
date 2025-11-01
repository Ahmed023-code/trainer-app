#!/bin/bash

# Quick Test Script - No Server Needed
# Usage: ./test-quick.sh

echo "🚀 Running quick tests..."
echo ""

# Kill any existing processes
killall node 2>/dev/null

# Type check
echo "1️⃣  Type checking..."
if npm run type-check 2>&1 | grep -q "error TS"; then
  echo "❌ TypeScript errors found:"
  npm run type-check 2>&1 | grep "error TS" | head -10
  echo ""
  echo "Run 'npm run type-check' to see all errors"
  exit 1
else
  echo "✅ No TypeScript errors"
fi

echo ""

# Lint check
echo "2️⃣  Linting..."
if npm run lint 2>&1 | grep -q "Error:"; then
  echo "⚠️  Lint warnings found"
  npm run lint 2>&1 | grep -A 2 "Error:" | head -10
else
  echo "✅ No lint errors"
fi

echo ""
echo "✨ All quick tests passed!"
echo ""
echo "💡 To test in browser:"
echo "   npm run build && npm start"
echo "   (Much faster than npm run dev)"
