# 🚀 START HERE - iPhone App in 5 Commands

## Copy & Paste These 5 Commands (One at a Time)

Open **Terminal** on your Mac and run these commands **one by one**:

### 1️⃣ Go to project
```bash
cd /Users/ahmedrami/Desktop/trainer-app
```

### 2️⃣ Build the app
```bash
npm run build
```
⏳ *Wait for "Compiled successfully"*

### 3️⃣ Add iPhone support
```bash
npx cap add ios
```
⏳ *Wait for it to finish (creates ios/ folder)*

### 4️⃣ Open Xcode
```bash
npx cap open ios
```
✅ *Xcode opens automatically*

### 5️⃣ In Xcode:
1. **Plug in your iPhone** (USB cable)
2. **Top-left dropdown** → Select your iPhone
3. **Click ▶️ Play button**
4. **Wait 1-2 minutes**
5. **Done! App is on your iPhone!** 🎉

---

## 🔧 First Time? Need to Trust Yourself

If you see "Untrusted Developer" on your iPhone:

**On your iPhone:**
1. Settings
2. General
3. VPN & Device Management
4. Tap your name
5. Trust → Trust
6. Go back to Xcode, click ▶️ again

---

## 📖 Need More Help?

- **Simple guide**: [IPHONE_GUIDE.md](IPHONE_GUIDE.md)
- **Complete guide**: [MOBILE_SETUP.md](MOBILE_SETUP.md)
- **Quick reference**: [QUICKSTART.md](QUICKSTART.md)

---

## ⚡ Super Quick Summary

```bash
# Run these 4 commands in Terminal:
cd /Users/ahmedrami/Desktop/trainer-app
npm run build
npx cap add ios
npx cap open ios

# Then in Xcode:
# Connect iPhone → Select iPhone → Click ▶️
```

**That's literally it! 🎯**
