# Mobile App Installation Guide

This guide will help you build and install the Trainer App as a native mobile app on your phone (iOS or Android). The app will run completely offline with all data stored locally on your device.

## Table of Contents

- [iOS Installation](#ios-installation)
- [Android Installation](#android-installation)
- [Troubleshooting](#troubleshooting)

---

## iOS Installation

### Prerequisites

- **macOS computer** (required for iOS builds)
- **Xcode** (download from Mac App Store)
- **iOS device** or iPhone
- **Apple Developer Account** (free account works for personal use)

### Step 1: Install Dependencies

```bash
# Install Xcode Command Line Tools
xcode-select --install

# Install CocoaPods (iOS dependency manager)
sudo gem install cocoapods
```

### Step 2: Build the App

```bash
# Build the web app and sync to iOS
npm run mobile:build

# Add iOS platform (first time only)
npx cap add ios

# Open in Xcode
npm run cap:open:ios
```

### Step 3: Configure Xcode

1. **Xcode will open** with your project
2. **Select your development team:**
   - Click on the project name in the left sidebar
   - Go to "Signing & Capabilities" tab
   - Select your Apple ID under "Team"
3. **Connect your iPhone:**
   - Plug in your iPhone via USB
   - Select your device from the device dropdown (top of Xcode)
4. **Trust your developer certificate on iPhone:**
   - On iPhone: Settings → General → VPN & Device Management
   - Tap your Apple ID and select "Trust"

### Step 4: Build and Run

1. **In Xcode, click the "Play" button** (▶️) or press `Cmd + R`
2. **The app will install and launch on your iPhone**
3. **Done!** The app is now installed on your phone

### Updating the App

When you make changes:

```bash
# Rebuild and sync
npm run mobile:build

# Xcode will auto-reload, just press Play again
```

---

## Android Installation

### Prerequisites

- **Android Studio** (download from https://developer.android.com/studio)
- **Android device** or Android phone
- **USB cable** for connecting phone to computer

### Step 1: Install Android Studio

1. Download and install [Android Studio](https://developer.android.com/studio)
2. During installation, make sure to install:
   - Android SDK
   - Android SDK Platform
   - Android Virtual Device (optional, for emulator)

### Step 2: Build the App

```bash
# Build the web app and sync to Android
npm run mobile:build

# Add Android platform (first time only)
npx cap add android

# Open in Android Studio
npm run cap:open:android
```

### Step 3: Configure Android Device

**Option A: Physical Device (Recommended)**

1. **Enable Developer Options on your phone:**
   - Go to Settings → About Phone
   - Tap "Build Number" 7 times
   - "Developer options" will appear in Settings

2. **Enable USB Debugging:**
   - Go to Settings → Developer Options
   - Enable "USB Debugging"

3. **Connect your phone via USB:**
   - Plug in your Android phone
   - Allow USB debugging when prompted on phone
   - Select "File Transfer" mode if asked

4. **Verify connection:**
   ```bash
   # Check if device is detected
   adb devices
   ```

**Option B: Android Emulator**

1. In Android Studio, click "Device Manager"
2. Click "Create Device"
3. Select a device (e.g., Pixel 5)
4. Download and select a system image (Android 11+)
5. Finish setup and start the emulator

### Step 4: Build and Run

1. **In Android Studio:**
   - Wait for Gradle sync to complete (bottom of window)
   - Select your device from the device dropdown
   - Click the "Run" button (▶️) or press `Shift + F10`

2. **The app will install and launch on your device**

3. **Done!** The app is now installed on your phone

### Installing APK Directly (Alternative Method)

If you want to share the app with others or install without Android Studio:

```bash
# Build the APK
cd android
./gradlew assembleDebug

# APK location:
# android/app/build/outputs/apk/debug/app-debug.apk
```

**To install on phone:**
1. Transfer the APK to your phone (email, USB, cloud drive)
2. Open the APK file on your phone
3. Allow "Install from Unknown Sources" if prompted
4. Install and open the app

### Updating the App

When you make changes:

```bash
# Rebuild and sync
npm run mobile:build

# In Android Studio, just press Run again
```

---

## Building for Production (Optional)

### iOS Production Build

1. **Join the Apple Developer Program** ($99/year)
2. **In Xcode:**
   - Product → Archive
   - Distribute App → App Store Connect
   - Follow the upload wizard

3. **In App Store Connect:**
   - Create your app listing
   - Submit for review
   - Once approved, publish to App Store

### Android Production Build

1. **Generate a signing key:**
   ```bash
   cd android
   keytool -genkey -v -keystore my-release-key.keystore \
     -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000
   ```

2. **Configure signing in `android/app/build.gradle`:**
   ```gradle
   android {
     signingConfigs {
       release {
         storeFile file('my-release-key.keystore')
         storePassword 'your-password'
         keyAlias 'my-key-alias'
         keyPassword 'your-password'
       }
     }
     buildTypes {
       release {
         signingConfig signingConfigs.release
       }
     }
   }
   ```

3. **Build the release APK:**
   ```bash
   cd android
   ./gradlew assembleRelease

   # APK location:
   # android/app/build/outputs/apk/release/app-release.apk
   ```

4. **Upload to Google Play:**
   - Create a developer account ($25 one-time fee)
   - Go to Google Play Console
   - Create app and upload APK
   - Submit for review

---

## Troubleshooting

### iOS Issues

**"No provisioning profiles found"**
- Solution: Select your Apple ID team in Xcode signing settings

**"Untrusted Developer"**
- Solution: On iPhone, go to Settings → General → VPN & Device Management → Trust your developer certificate

**CocoaPods installation fails**
- Solution: Try `sudo gem install cocoapods` or use Homebrew: `brew install cocoapods`

### Android Issues

**"SDK location not found"**
- Solution: Set `ANDROID_HOME` environment variable:
  ```bash
  export ANDROID_HOME=$HOME/Library/Android/sdk
  export PATH=$PATH:$ANDROID_HOME/tools:$ANDROID_HOME/platform-tools
  ```

**"Device not detected"**
- Solution: Enable USB debugging, try different USB cable, install device drivers

**Gradle build fails**
- Solution: In Android Studio: File → Invalidate Caches → Invalidate and Restart

### General Issues

**"App crashes on launch"**
- Check that `npm run build` completed successfully
- Verify `out/` directory exists with built files
- Try `npx cap sync` to resync files

**"Changes not showing in app"**
- Always run `npm run mobile:build` before opening in Xcode/Android Studio
- The web assets need to be rebuilt and synced

---

## What You Get

✅ **Native mobile app** installed on your phone
✅ **Runs completely offline** (no internet needed)
✅ **All data stored locally** on your device
✅ **Same experience** as a regular app from App Store/Play Store
✅ **Works anywhere** you have your phone

## Next Steps

- **Make it yours:** Customize the app icon and splash screen
- **Add features:** The app code is in `app/` directory
- **Share it:** Build release APK/IPA and share with friends
- **Publish it:** Submit to App Store and Google Play

---

## Quick Reference

```bash
# Initial setup (first time only)
npm run mobile:build
npx cap add ios        # For iOS
npx cap add android    # For Android

# Regular workflow
npm run mobile:build   # Build web app and sync to mobile
npm run cap:open:ios   # Open in Xcode
npm run cap:open:android  # Open in Android Studio

# Update after changes
npm run mobile:build   # Rebuild and sync
# Then press Run in Xcode/Android Studio
```

For more help, see the [Capacitor Documentation](https://capacitorjs.com/docs).
