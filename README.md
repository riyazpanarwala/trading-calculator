# 📈 Universal Trading Calculator (Expo / React Native)

A powerful and flexible **trading calculator** built using **React Native + Expo**.
This calculator automatically derives values such as **SL %, Target %, Quantity, Position Size, Risk Amount, Risk–Reward, Profit**, and more — all interconnected and updated in real time.

🌐 **Live Web App:** https://riyaz-trading-calc.expo.app/

---

## 🚀 Features

- 🔄 **Real-time auto-calculation** based on any field input
- 🔗 **Full bi-directional dependency logic** (SL Price ↔ SL %, Target Price ↔ Target %, Quantity ↔ Position Amount)
- 🔁 **Reset button** to clear all fields instantly
- 🚫 **Negative value protection**
- 🌓 **Built-in Light & Dark Theme**
- 📱 **Responsive 2-column grid layout**
- ⚠️ **Missing field highlights** with dynamic validation

---

## 📂 Project Structure

```
/App.js                        # Expo entry point
/src/components/CalculatorScreen.js   # Main calculator logic + UI
/src/components/styles.js             # Light & dark theme + layout styles
/index.js                      # Root component registration
/app.json                      # Expo app config
/eas.json                      # EAS Build profiles
```

---

## 🛠 Prerequisites

Before running or deploying, make sure you have the following installed:

| Tool | Version | Install |
|------|---------|---------|
| Node.js | 18+ | https://nodejs.org |
| npm or yarn | latest | comes with Node |
| Expo CLI | latest | `npm install -g expo-cli` |
| EAS CLI | latest | `npm install -g eas-cli` |

---

## ▶️ Local Development Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Start the dev server

```bash
npx expo start
```

This opens the **Expo Dev Tools** in your browser. From there you can:
- Press `w` → open in **Web browser**
- Press `a` → open in **Android emulator** (requires Android Studio)
- Press `i` → open in **iOS simulator** (requires Xcode, macOS only)
- Scan the **QR code** with the **Expo Go** app on your phone

---

## 🌐 Deploy — Expo Web (via EAS Hosting)

This project deploys to **Expo's own hosting** using EAS Deploy.

### Step 1: Install / update EAS CLI

```bash
npm install -g eas-cli
```

### Step 2: Login to your Expo account

```bash
eas login
```

### Step 3: Build the web bundle

```bash
npx expo export --platform web
```

This generates the production-ready static files in the `dist/` folder.

### Step 4: Deploy to Expo Hosting

```bash
eas deploy --prod
```

EAS uploads the `dist/` folder and gives you a live **`.expo.app` URL** (e.g. `https://trading-calc-xxxx.expo.app`).

That's it — your app is live! 🎉

---

### Re-deploying after changes

Every time you make code changes, just run both commands again:

```bash
npx expo export --platform web
eas deploy --prod
```

### Preview deployments (optional)

To deploy a non-production preview (e.g. for testing before going live):

```bash
npx expo export --platform web
eas deploy
```

This creates a temporary preview URL without affecting the production deployment.

### View all deployments

```bash
eas deploy:list
```

Or visit your project dashboard at https://expo.dev to see all deployments, URLs, and history.

### Run locally in browser (development only)

```bash
npx expo start --web
```

---

## 🤖 Deploy — Android

There are two paths: **Expo Go (quick preview)** or **EAS Build (production APK/AAB)**.

### Path 1: Quick preview via Expo Go

1. Install **Expo Go** from the [Google Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)
2. Run `npx expo start`
3. Scan the QR code in the terminal with the Expo Go app

### Path 2: Build a standalone APK (for testing / sharing directly)

```bash
# Login to your Expo account first
eas login

# Build an APK
npm run build:apk
# or directly:
eas build --profile apk --platform android
```

Once the build is done, EAS provides a **download link** for the `.apk` file. Share it or install it directly on any Android device.

### Path 3: Build a release AAB (for Google Play Store)

```bash
eas build --profile production --platform android
```

This produces a `.aab` (Android App Bundle) — the format required by the Play Store.

**Submit to Google Play Store:**
```bash
eas submit --platform android
```

> ⚠️ You need a [Google Play Developer account](https://play.google.com/console) ($25 one-time fee) and must configure `eas.json` with your service account credentials.

### Android Build Profiles (from `eas.json`)

| Profile | Command | Output | Use Case |
|---------|---------|--------|----------|
| `apk` | `npm run build:apk` | `.apk` | Direct install / testing |
| `preview` | `npm run build:preview` | `.apk` | Internal testing |
| `production` | `npm run build:aab` | `.aab` | Google Play Store |

---

## 🍎 Deploy — iOS

> ⚠️ iOS builds require a **Mac with Xcode** for local builds, or you can use **EAS cloud builds** from any OS. An **Apple Developer account** ($99/year) is required for real device testing and App Store submission.

### Path 1: Quick preview via Expo Go

1. Install **Expo Go** from the [App Store](https://apps.apple.com/app/expo-go/id982107779)
2. Run `npx expo start`
3. Scan the QR code with your iPhone Camera app

### Path 2: Run on iOS Simulator (macOS only)

```bash
npx expo start --ios
# or press 'i' after running npx expo start
```

Requires **Xcode** installed from the Mac App Store.

### Path 3: Build for TestFlight / App Store via EAS

```bash
# Login to Expo and Apple accounts
eas login
eas credentials   # set up your Apple credentials

# Build for iOS
eas build --profile production --platform ios
```

EAS will prompt you to log in with your **Apple ID** and handle provisioning profiles automatically.

**Submit to App Store:**
```bash
eas submit --platform ios
```

This uploads the build to **App Store Connect**. From there:
1. Log into [App Store Connect](https://appstoreconnect.apple.com)
2. Go to your app → **TestFlight** to share with testers
3. Go to **App Store** → submit for Apple review when ready

---

## 🔐 Environment & Credentials Setup

### EAS Project Link

Make sure your `app.json` has the correct project ID:

```json
"extra": {
  "eas": {
    "projectId": "8a034061-cf97-46fe-ac18-18463127a599"
  }
}
```

### First-time EAS setup

```bash
npm install -g eas-cli
eas login
eas build:configure   # creates/updates eas.json
```

---

## 📜 Available Scripts

| Script | Command | Description |
|--------|---------|-------------|
| Start dev server | `npm start` | Opens Expo Dev Tools |
| Web | `npm run web` | Start on web |
| Android | `npm run android` | Start on Android emulator |
| iOS | `npm run ios` | Start on iOS simulator |
| Build APK | `npm run build:apk` | EAS cloud APK build |
| Build Preview | `npm run build:preview` | EAS internal preview APK |
| Build AAB | `npm run build:aab` | EAS production AAB for Play Store |
| Build iOS | `npm run build:ios` | EAS production iOS build |

---

## 🧩 Available Form Fields

| Field Key | Label |
|-----------|-------|
| entryPrice | Entry Price |
| slPrice | SL Price |
| slPercent | SL % |
| riskAmount | Risk Amount |
| positionAmount | Position Amount |
| quantity | Quantity |
| targetPercent | Target % |
| targetPrice | Target Price |
| riskReward | Risk : Reward |
| profitAmount | Profit Amount |

---

## 🧪 Usage Instructions

1. Enter any values among Entry Price, SL Price / SL %, Target Price / %, Quantity / Position Amount, or Risk Amount
2. The remaining fields **auto-fill instantly**
3. Tap **↺ Reset** to clear all fields and start fresh
4. If too few fields are filled, missing required fields are highlighted in orange
5. Toggle between **Light / Dark** theme using the button in the header

---

## 📜 License

This project is free to use, modify, or integrate into your personal or commercial trading applications.
