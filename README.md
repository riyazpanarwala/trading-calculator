# 📈 Universal Trading & Wealth Calculator (Expo / React Native)

A powerful, high-precision **Trading Risk & Wealth Compounding Calculator** built with **React Native + Expo**. Designed with institutional-grade fintech aesthetics, responsive desktop/mobile layouts, and real-time bi-directional derivations.

🌐 **Live Web App:** [https://riyaz-trading-calc.expo.app/](https://riyaz-trading-calc.expo.app/)

---

## 🚀 Key Features

### 1. 📈 Universal Trading Calculator
- 🔄 **10-Variable Bi-Directional Derivation**: Enter any 2–3 parameters to automatically derive the rest:
  - `Entry Price`, `Stop Loss Price`, `SL %`
  - `Target Price`, `Target %`, `Risk : Reward (R:R)`
  - `Quantity`, `Position Amount`, `Risk Amount (Max Loss)`, `Profit Amount`
- 🎯 **Trade Quality Scorecard**: Live trade grading (`Poor ⚠️`, `Acceptable 🔶`, `Good ✅`, `Excellent 🚀`) based on risk-to-reward ratio.
- 📊 **Visual R:R Distribution Bar**: Real-time visual comparison of risk outlay vs. projected reward with localized currency amounts.
- 🪜 **Interactive Price Ladder Chart**: SVG-rendered price action ladder illustrating Target, Entry, and Stop Loss thresholds with distance percentages.
- 📤 **Screenshot Sharing & Export**: Instant high-resolution screenshot export for trade setups on Web (Web Share / direct download), iOS, and Android.

### 2. 💰 SIP & Lumpsum Wealth Calculator
- 📅 **Dual Compounding Modes**: Seamlessly switch between **Monthly SIP** and **One-Time Lumpsum** investment models.
- ⚡ **Quick-Select Horizon Chips**: One-tap duration selection (`1Y`, `3Y`, `5Y`, `10Y`, `15Y`, `20Y`, `25Y`, `30Y`).
- 🍩 **SVG Donut Asset Breakdown**: Dynamic dual-arc visual breakdown showing Principal Invested vs. Compounded Wealth with compact currency notations (`₹ L / Cr`).
- 📈 **Yearly Growth Progression Ledger**: Milestone table displaying yearly growth, invested capital, returns, and total future value.
- 📤 **SIP Plan Sharing**: One-click sharing and export for investment plans.

### 3. 🎨 Premium Fintech UI & Responsive Layout
- 📱 **Universal Responsiveness**: Adaptive centered container (`maxWidth: 720px`) on desktop web displays with native full-window body scrolling (no nested inner scrollbars).
- 🌓 **Obsidian Dark & Clean Slate Light Themes**: Deep `#090D16` dark mode and `#F8FAFC` light mode with translucent borders and elevated cards.
- 🔒 **Data Validation & Protection**: Negative value checks, SL/Target bounds checking, and missing required field highlights.
- 🗂️ **State-Preserving Tab Bar**: Switch between Trading and Wealth calculators without losing any entered values.

---

## 📂 Project Structure

```
├── App.js                                 # Main shell, responsive container, top tab navigation
├── src/
│   ├── components/
│   │   ├── CalculatorScreen.js            # Trading workstation (10-field engine, badge, ladder)
│   │   ├── SipCalculatorScreen.js         # SIP & Lumpsum calculator, metrics, milestones table
│   │   ├── SipDonutChart.js               # SVG Donut investment vs. returns chart
│   │   └── styles.js                      # Design system tokens (dark/light themes, cards, grid)
│   └── utils/
│       └── sipCalculations.js             # Financial compounding algorithms & formatters
├── app.json                               # Expo app configuration
├── eas.json                               # EAS Build & Hosting configuration
└── package.json                           # Dependencies & scripts
```

---

## 🛠 Prerequisites

Make sure you have the following installed:

| Tool | Version | Install Link |
|------|---------|-------------|
| **Node.js** | 18+ | [https://nodejs.org](https://nodejs.org) |
| **npm** / **yarn** | latest | Bundled with Node |
| **Expo CLI** | latest | `npm install -g expo-cli` |
| **EAS CLI** | latest | `npm install -g eas-cli` |

---

## ▶️ Local Development Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Start dev server
```bash
npm start
```
From the Expo interactive CLI:
- Press `w` → Open in **Web browser**
- Press `a` → Open in **Android emulator**
- Press `i` → Open in **iOS simulator** (macOS only)
- Scan the **QR code** with the **Expo Go** app on your mobile device

---

## 🌐 Deploy — Web (Expo Hosting via EAS)

The project is configured for automated builds and deployment via **EAS Hosting**:

### One-Command Deployment:
```bash
npm run deploy
```
*(Runs `npx expo export --platform web && eas deploy --prod`)*

### Manual Step-by-Step:
1. **Export production web assets:**
   ```bash
   npm run build:web
   ```
2. **Deploy to production:**
   ```bash
   eas deploy --prod
   ```
3. **Deploy preview branch (optional):**
   ```bash
   npm run deploy:preview
   ```

---

## 🤖 Standalone Mobile Builds (Android & iOS)

### Android Builds:
```bash
# Standalone APK for direct download/testing
npm run build:apk

# Production AAB for Google Play Store
npm run build:aab

# Submit to Google Play Store
npm run submit:android
```

### iOS Builds:
```bash
# Production IPA for TestFlight / App Store
npm run build:ios
```

---

## 🧩 Form Field Reference (Trading Calculator)

| Field Key | Label | Description |
|-----------|-------|-------------|
| `entryPrice` | **Entry Price** | Base asset purchase/entry level |
| `slPrice` | **SL Price** | Absolute Stop Loss trigger price |
| `slPercent` | **SL %** | Percentage distance from Entry to Stop Loss |
| `riskAmount` | **Risk Amount** | Total capital risked on the trade (`₹`) |
| `positionAmount`| **Position Amount** | Total capital allocated for the position |
| `quantity` | **Quantity** | Number of shares / units (integer floored) |
| `targetPrice` | **Target Price** | Take-profit exit target price |
| `targetPercent`| **Target %** | Percentage gain from Entry to Target |
| `riskReward` | **Risk : Reward** | Normalized reward/risk ratio (e.g. `2` or `1:2.5`) |
| `profitAmount` | **Profit Amount** | Net expected monetary profit upon target hit |

---

## 📜 Available NPM Scripts

| Script | Command | Description |
|--------|---------|-------------|
| `npm start` | `expo start` | Starts Expo dev server |
| `npm run web` | `expo start --web` | Starts local web development server |
| `npm run build:web` | `npx expo export --platform web` | Bundles static web files into `dist/` |
| `npm run deploy` | `npx expo export --platform web && eas deploy --prod` | Full production build and EAS deployment |
| `npm run deploy:preview`| `npx expo export --platform web && eas deploy` | Staging preview deployment |
| `npm run build:apk` | `eas build --profile apk --platform android` | Standalone Android APK build |
| `npm run build:aab` | `eas build --profile production --platform android` | Google Play Store AAB build |
| `npm run build:ios` | `eas build --profile production --platform ios` | App Store iOS production build |

---

## 📄 License

This project is licensed under the MIT License — free for personal and commercial trading applications.
