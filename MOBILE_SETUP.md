# 📱 Mobile App Setup with Capacitor

This guide will help you convert your trainer web app into native iOS and Android apps.

## Prerequisites

- **For iOS**: Mac with Xcode installed (from App Store)
- **For Android**: Android Studio installed
- Node.js and npm already installed ✅

## Step 1: Install Capacitor (Already Done ✅)

```bash
npm install @capacitor/core @capacitor/cli @capacitor/ios @capacitor/android
```

## Step 2: Update Next.js Configuration

Your Next.js app needs to export as static files for Capacitor:

**Edit `next.config.mjs`:**
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',  // Add this line
  images: {
    unoptimized: true,  // Required for static export
  },
  // ... rest of config
};
export default nextConfig;
```

**Add to `package.json` scripts:**
```json
{
  "scripts": {
    "build": "next build",
    "export": "next build && next export",
    "cap:copy": "npm run build && npx cap copy",
    "cap:sync": "npm run build && npx cap sync"
  }
}
```

## Step 3: Initialize Capacitor

```bash
npx cap init
```

You'll be asked:
- **App name**: `Trainer App`
- **Package ID**: `com.yourname.trainerapp` (use your actual name)
- **Web asset directory**: `out` (Next.js export folder)

This creates a `capacitor.config.ts` file.

## Step 4: Build Your App

```bash
npm run build
```

This creates the `out/` folder with your static website.

## Step 5: Add iOS Platform

```bash
npx cap add ios
```

This creates an `ios/` folder with your Xcode project.

## Step 6: Add Android Platform

```bash
npx cap add android
```

This creates an `android/` folder with your Android Studio project.

## Step 7: Sync Your Web Code to Native Apps

Every time you make changes to your web code:

```bash
npx cap sync
```

This copies your `out/` folder to both iOS and Android projects.

## Step 8: Open in Native IDEs

### For iOS:
```bash
npx cap open ios
```

This opens Xcode. Then:
1. Select your device/simulator from the top dropdown
2. Click the ▶️ Play button to run
3. The app will install on your iPhone/simulator

### For Android:
```bash
npx cap open android
```

This opens Android Studio. Then:
1. Wait for Gradle sync to complete
2. Select your device/emulator
3. Click the ▶️ Run button

## Step 9: Test on Your Physical Phone

### iOS (iPhone):
1. Connect your iPhone via USB
2. In Xcode, select your iPhone from the device dropdown
3. Click Run
4. First time: You may need to trust your Apple Developer account in Settings

### Android:
1. Enable Developer Mode on your Android phone:
   - Settings → About Phone → Tap "Build Number" 7 times
2. Enable USB Debugging:
   - Settings → Developer Options → USB Debugging
3. Connect via USB
4. In Android Studio, select your device and Run

## Step 10: Install Directly on Your Phone (No Computer Needed After First Build)

### iOS - TestFlight (Recommended):
1. Enroll in Apple Developer Program ($99/year)
2. In Xcode: Product → Archive
3. Upload to App Store Connect
4. Add to TestFlight
5. Install from TestFlight app on your iPhone

### Android - Direct APK Install (Free):
1. In Android Studio: Build → Build Bundle(s) / APK(s) → Build APK(s)
2. Find the APK in `android/app/build/outputs/apk/debug/app-debug.apk`
3. Transfer to your phone (AirDrop, Google Drive, USB)
4. On Android phone: Enable "Install from Unknown Sources"
5. Tap the APK file to install

## Common Capacitor Plugins (Optional)

Add native features to your app:

```bash
# Camera access
npm install @capacitor/camera
npx cap sync

# File system access
npm install @capacitor/filesystem
npx cap sync

# App notifications
npm install @capacitor/local-notifications
npx cap sync

# Device info
npm install @capacitor/device
npx cap sync
```

## Workflow After Initial Setup

Every time you make code changes:

```bash
# 1. Build your Next.js app
npm run build

# 2. Sync to native projects
npx cap sync

# 3. Open and run in IDE
npx cap open ios
# OR
npx cap open android
```

## Troubleshooting

### "out/ folder not found"
- Make sure you run `npm run build` first
- Check that `next.config.mjs` has `output: 'export'`

### iOS build errors
- Open Xcode and check the Build Settings
- Make sure you have the latest Xcode version
- Try cleaning the build: Product → Clean Build Folder

### Android build errors
- Let Gradle finish syncing completely
- Check that Android SDK is properly installed
- Try: File → Invalidate Caches and Restart

### App crashes on startup
- Check the console logs in Xcode/Android Studio
- Make sure all assets compiled correctly
- Try deleting `ios/` and `android/` folders and re-adding platforms

## Next Steps

1. **Add App Icons**: Replace default icons in `ios/App/Assets.xcassets` and `android/app/src/main/res/`
2. **Add Splash Screen**: Configure in `capacitor.config.ts`
3. **Configure App Permissions**: Edit `ios/App/Info.plist` and `android/app/src/main/AndroidManifest.xml`
4. **Publish to App Stores**: Follow Apple App Store and Google Play Store submission guidelines

## Quick Reference Commands

```bash
# Install dependencies
npm install @capacitor/core @capacitor/cli @capacitor/ios @capacitor/android

# Initialize
npx cap init

# Add platforms
npx cap add ios
npx cap add android

# Build and sync
npm run build
npx cap sync

# Open in IDEs
npx cap open ios
npx cap open android

# Update native plugins
npx cap sync

# List installed platforms
npx cap ls
```

## Resources

- [Capacitor Docs](https://capacitorjs.com/docs)
- [Next.js Static Export](https://nextjs.org/docs/pages/building-your-application/deploying/static-exports)
- [iOS App Store Submission](https://developer.apple.com/app-store/submissions/)
- [Google Play Console](https://play.google.com/console)
