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

### 2. 💰 Wealth Compounding & SIP Calculator
- 📅 **Three Flexible Investment Modes**:
  - **Regular Monthly SIP**: Standard recurring monthly investments over the selected time horizon.
  - **🌱 SIP & Grow (Stop SIP & Hold)**: Invest monthly for a set period (e.g., 5 years), then stop contributing while your accumulated corpus remains invested and compounds untouched until your target horizon (e.g., 20 years).
  - **One-Time Lumpsum**: Single upfront capital allocation compounded over the selected horizon.
- 📈 **Annual Step-Up SIP (+% / Year)**: Model salary growth by stepping up monthly contributions by +5%, +10%, +15%, or custom % every year with quick chips.
- 🎈 **Inflation-Adjusted Real Wealth Toggle**: Instant purchasing power calculation discounted against inflation (customizable % p.a., with India average 6% default) revealing real purchasing power alongside nominal wealth.
- ⏳ **Dual Horizon Duration Controls**: Dedicated controls in *SIP & Grow* mode for **SIP Payment Period** and **Total Investment Horizon** with one-tap quick chips (`1Y` to `30Y`).
- 💡 **Dynamic Strategy Callout**: Automatically summarizes initial capital invested, step-up contribution growth, corpus value at the moment SIP stops, post-SIP compounded gains, and final wealth.
- 🏷️ **Phase-Aware Growth Progression Ledger**: Milestone table with **`Active SIP`** and **`Growing`** phase badges, annual monthly contribution levels, and Real Value vs. Nominal Value side-by-side.
- 🍩 **SVG Donut Asset Breakdown**: Dynamic dual-arc visual breakdown showing Principal Invested vs. Compounded Wealth with compact currency notations (`₹ L / Cr`).
- 📤 **SIP Plan Sharing & Export**: One-click sharing and screenshot export across Web, Android, and iOS.

### 3. 🔄 Stock Average Calculator
- 📊 **Multi-Batch Purchase Averaging**:
  - Dynamically add up to 8 purchase lots (Price & Quantity per lot) with instant subtotal and weight calculation.
  - Computes **New Weighted Average Price**, **Total Shares**, and **Total Capital Invested**.
  - **Live P&L & Breakeven Tracking**: Enter optional Current Market Price (CMP) to track portfolio market value, net profit/loss (₹ and %), and distance needed to reach breakeven.
  - **Visual Lot Allocation Bar**: Multi-colored proportional bar illustrating capital distribution across purchase batches.
- 🎯 **Target Average Down Planner (What-If Reverse Planner)**:
  - Enter Current Shares, Current Average Price, New Dip Buy Price, and Desired Target Average.
  - Instantly computes **Exact Additional Shares to Buy** and **Additional Capital Required** to achieve the desired average.
- 📤 **Average Setup Sharing & Export**: Instant screenshot export and sharing for WhatsApp, Twitter, and trade journals.

### 4. 🏖️ Systematic Withdrawal Plan (SWP) Calculator
- 💰 **Retirement Cashflow Modeling**:
  - Model monthly pension/income withdrawals from an accumulated mutual fund/portfolio corpus.
  - Interactive presets for Initial Corpus (`₹10L` to `₹1Cr`), Monthly Withdrawal (`₹20K` to `₹1L`), Return Rates, and Horizons (`5Y` to `30Y`).
- 📈 **Annual Step-Up Withdrawal (+% / year)**: Increase withdrawals annually to hedge against inflation and rising retirement living expenses.
- 🛡️ **Safe Withdrawal Rate & Longevity Analysis**:
  - Identifies **Evergreen Portfolios** where compounding gains outpace withdrawals (corpus grows forever!).
  - Detects exact **Corpus Depletion Horizon** (Years & Months) for aggressive withdrawal plans.
  - Safe withdrawal rate benchmark badge (`≤6% Very Safe`, `6-9% Moderate`, `>9% High Risk`).
- 📊 **Annual Cashflow & Balance Ledger**: Year-by-year milestone tracking of Opening Balance, Withdrawn, Compounded Returns, and Closing Balance.
- 📤 **SWP Plan Sharing & Export**: Export high-resolution summary cards for retirement planning.

### 5. 🏦 Brokerage, Statutory Taxes & Net P&L Calculator
- 🏢 **Multi-Broker Architecture with Dedicated Zero-Brokerage Support**:
  - **Shoonya (Finvasia)**: True ₹0 brokerage on F&O options, futures, and delivery.
  - **FlatTrade**: True ₹0 brokerage across all segments.
  - **Religare Broking**: Tailored for stock buying/delivery with configurable rate input (default `0.25%`).
  - **Upstox**: Flat ₹20 / 0.05% intraday & F&O, 2.5% delivery.
  - **Zerodha**, **Groww**, **Angel One**: Standard discount broker structures (₹0 delivery / flat ₹20 F&O).
  - **Custom Broker**: Fully custom user-defined percentage or flat fee per leg.
- 🎯 **Four Comprehensive Market Segments**:
  - `🎯 Options (F&O)`: STT (0.1% on sell premium), NSE transaction charges (0.03503% on premium), Stamp duty (0.003% on buy), GST (18%).
  - `📦 Stock Delivery`: Dual STT (0.1% buy + 0.1% sell), DP charges (₹15.93 flat CDSL/NSDL on sell), Stamp duty (0.015% on buy).
  - `⚡ Intraday`: STT (0.025% on sell), NSE transaction (0.00297%), Stamp duty (0.003% on buy).
  - `📈 Futures (F&O)`: STT (0.02% on sell), NSE transaction (0.00173%), Stamp duty (0.002% on buy).
- 🏷️ **Zero-Brokerage Savings Badge**: Displays exact savings in cash + GST (₹47.20/trade) achieved using Shoonya or FlatTrade compared to standard ₹20 discount brokers.
- 🎯 **Breakeven Indicator**: Computes exact minimum price move points and target sell price needed just to break even after statutory taxes.
- 📑 **Itemized Statutory Tax Ledger**: Clear line-item ledger showing Brokerage, STT/CTT, Exchange Txn, GST, SEBI Turnover (₹10/Cr), Stamp Duty, and DP charges.
- ⚡ **Quick Lot Presets**: One-tap lot sizing for Nifty (25, 75), BankNifty (15, 30), Sensex (10), and equity share lots (50, 100, 500, 1000).

### 6. 🎯 Goal-Based Wealth Planner (Reverse SIP & Lumpsum)
- 🔄 **Reverse Financial Engineering**: Solves *"How much do I need to invest each month to accumulate ₹X in Y years at Z% return?"*
- 🎯 **Life-Stage Goal Presets**:
  - 🚗 `New Car` (₹15L in 4Y @ 10%)
  - 🎓 `Child Higher Education` (₹35L in 12Y @ 12%)
  - 🏡 `Home Downpayment` (₹60L in 7Y @ 12%)
  - 🏖️ `FIRE Retirement` (₹3 Cr in 18Y @ 13%)
  - 💍 `Wedding / Milestone` (₹25L in 5Y @ 11%)
  - 🎯 `Custom Goal Target`
- ⚖️ **Three Route Solution Comparison**:
  - **Fixed Regular SIP**: Constant monthly installment for full horizon.
  - **Step-Up Monthly SIP**: Lower starting investment today (+5%, +10%, +15% annual step-up with salary raises).
  - **One-Time Lumpsum**: Single upfront capital allocation compounding untouched to the target.
- 🎈 **Inflation-Adjusted Future Goal Cost**: Accurately computes future inflated target corpus (e.g. ₹50 Lakhs today will cost ₹89.54 Lakhs in 10 years at 6% inflation).
- 💼 **Existing Savings Compounding Offset**: Factors in current savings already accumulated, compounding them forward to reduce new monthly SIP burden.
- 📊 **Year-by-Year Milestone Trajectory**: Table with annual deposit, cumulative outlay, compounding gains, and % Goal Achieved.
- 📤 **Goal Plan Sharing & Export**: High-resolution PNG and Web Share export.

### 7. 🎨 Premium Fintech UI & Responsive Layout
- 📱 **Universal Responsiveness**: Adaptive centered container (`maxWidth: 720px`) on desktop web displays with native full-window body scrolling (no nested inner scrollbars).
- 🌓 **Obsidian Dark & Clean Slate Light Themes**: Deep `#090D16` dark mode and `#F8FAFC` light mode with translucent borders and elevated cards.
- 🔒 **Data Validation & Protection**: Negative value checks, SL/Target bounds checking, and missing required field highlights.
- 🗂️ **State-Preserving 6-Tab Bar**: Switch between Trading, SIP, SWP, Stock Average, Brokerage, and Goal Planner without losing entered state.

---

## 📂 Project Structure

```
├── App.js                                 # Main shell, responsive container, top 6-tab navigation
├── src/
│   ├── components/
│   │   ├── CalculatorScreen.js            # Trading workstation (10-field engine, badge, ladder)
│   │   ├── SipCalculatorScreen.js         # Wealth workstation (Regular SIP, Step-Up, SIP & Grow, Lumpsum)
│   │   ├── SwpCalculatorScreen.js         # Retirement & systematic withdrawal workstation
│   │   ├── StockAverageScreen.js          # Stock Averaging & Target Average Down planner
│   │   ├── BrokerageCalculatorScreen.js   # Brokerage, Statutory Taxes & Net P&L workstation
│   │   ├── GoalCalculatorScreen.js        # Goal-Based Wealth Planner (Reverse SIP / Lumpsum)
│   │   ├── SipDonutChart.js               # SVG Donut investment vs. returns chart
│   │   └── styles.js                      # Design system tokens (dark/light themes, cards, grid)
│   └── utils/
│       ├── averageCalculations.js         # Weighted average & target average down algorithms
│       ├── brokerageCalculations.js       # Brokerage, STT, GST, SEBI, Exchange tax engine
│       ├── goalCalculations.js            # Reverse SIP, Step-Up, Lumpsum & Goal engineering
│       ├── sipCalculations.js             # Financial compounding, step-up & inflation algorithms
│       └── swpCalculations.js             # Systematic withdrawal & corpus longevity algorithms
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

## 🚀 Automated CI/CD (GitHub Actions)

This repository includes automated workflows for **Continuous Deployment of the Web App** and **Automated APK Releases on GitHub**.

### Required Secret Setup (One-time)
To allow GitHub Actions to build and deploy via EAS, add your Expo token to your GitHub repository:
1. Generate an Access Token at [expo.dev/settings/access-tokens](https://expo.dev/settings/access-tokens).
2. In your GitHub repo, go to **Settings** > **Secrets and variables** > **Actions**.
3. Click **New repository secret**, name it `EXPO_TOKEN`, and paste the token value.

### 🌐 1. Automated Web Deployment (`deploy-web.yml`)
- **Trigger**: Every time code is pushed to the `main` branch (or manually triggered in GitHub Actions tab).
- **What it does**: Automatically runs `npx expo export --platform web` and deploys the latest version to EAS Hosting (`https://riyaz-trading-calc.expo.app/`).

### 📱 2. Automated APK Release (`release-apk.yml`)
- **Trigger**: Pushing a version tag or manually triggering via the GitHub Actions UI.
- **Trigger via Git Tag**:
  ```bash
  git tag v1.0.2
  git push origin v1.0.2
  ```
- **Trigger via GitHub Web UI**:
  Go to **Actions** > **Release Android APK** > **Run workflow** (optionally input version tag).
- **What it does**: Builds the standalone Android APK using EAS (`--profile apk`), creates a new **GitHub Release**, and attaches `Universal-Trading-Calculator.apk` directly to the release for instant download.

---

## 🌐 Deploy — Web (Expo Hosting via EAS)

### Automated:
Push to `main` branch — GitHub Actions deploys automatically!

### Manual via Local Terminal:
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
