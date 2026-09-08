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

---

### 2. ⚡ Options Black-Scholes & Greeks Calculator
- 🏛️ **Black-Scholes Mathematical Pricing Engine**:
  - High-precision theoretical European Call & Put option price derivation.
  - Breakdown of Intrinsic Value vs. Time Value and Moneyness (`ATM`, `ITM`, `OTM`).
- 🟢 **The 5 Option Greeks Dashboard**:
  - 🟢 **Delta ($\Delta$)**: Directional sensitivity per +1 point spot move (Call Delta $0 \dots +1.0$, Put Delta $-1.0 \dots 0$).
  - ⚡ **Gamma ($\Gamma$)**: Speed / acceleration of Delta per +1 point spot move.
  - ⏰ **Theta ($\Theta$)**: Daily time decay loss ($\text{₹}/\text{day}$ calendar day loss).
  - 🌊 **Vega ($\nu$)**: Sensitivity to +1% change in Implied Volatility (India VIX).
  - 🏛️ **Rho ($\rho$)**: Sensitivity to +1% change in risk-free interest rates.
- 🔍 **Implied Volatility (IV) Reverse Newton-Raphson Solver**:
  - Enter current market traded option price to solve for exact Implied Volatility ($IV\%$) implied by the market.
- 🔮 **What-If Scenario Projection Simulator**:
  - Simulate projected Call & Put prices and net P&L ($\text{₹}$ and $\%$) after spot move, days elapsed, and IV changes.
- ⚡ **Quick Index & Stock Presets**: One-tap presets for Nifty 24,500, BankNifty 52,000, Sensex 80,000, and stock options.

---

### 3. 💰 Wealth Compounding & SIP Calculator
- 📅 **Three Flexible Investment Modes**:
  - **Regular Monthly SIP**: Standard recurring monthly investments over the selected time horizon.
  - **🌱 SIP & Grow (Stop SIP & Hold)**: Invest monthly for a set period (e.g., 5 years), then stop contributing while your accumulated corpus remains invested and compounds untouched until your target horizon (e.g., 20 years).
  - **One-Time Lumpsum**: Single upfront capital allocation compounded over the selected horizon.
- 📈 **Flexible Step-Up Frequencies & Percentages**:
  - Step up monthly contributions by +5%, +10%, +15%, or custom % with one-tap chips.
  - **3 Frequency Options**: Step-up `📅 Annual`, `🌓 Half-Yearly`, or `🌙 Monthly`.
- ⚖️ **Equity LTCG Tax Deduction Toggle**:
  - Model Indian Equity LTCG Tax (12.5% tax on gains above ₹1.25 Lakh exemption limit under Budget 2024+ rules).
  - Computes **LTCG Tax Payable** and **Net Post-Tax Wealth**.
- 📊 **Multi-Scenario Market Return Comparison**:
  - Side-by-side comparative cards for 🐻 **Bear Case (8%)**, 🎯 **Base Case (12%)**, and 🚀 **Bull Case (15%)** market conditions.
- 🎈 **Inflation-Adjusted Real Wealth Toggle**: Instant purchasing power calculation discounted against inflation (customizable % p.a., with India average 6% default) revealing real purchasing power alongside nominal wealth.
- ⏳ **Dual Horizon Duration Controls**: Dedicated controls in *SIP & Grow* mode for **SIP Payment Period** and **Total Investment Horizon** with one-tap quick chips (`1Y` to `30Y`).
- 🏷️ **Phase-Aware Growth Progression Ledger**: Milestone table with **`Active SIP`** and **`Growing`** phase badges, annual monthly contribution levels, and Real Value vs. Nominal Value side-by-side.
- 🍩 **SVG Donut Asset Breakdown**: Dynamic dual-arc visual breakdown showing Principal Invested vs. Compounded Wealth with compact currency notations (`₹ L / Cr`).
- 📤 **SIP Plan Sharing & Export**: One-click sharing and screenshot export across Web, Android, and iOS.

---

### 4. 🔄 Stock Average Calculator
- 📊 **Multi-Batch Purchase & Partial Exit Averaging**:
  - Dynamically add up to 8 purchase lots or sell transactions (Price, Quantity, Buy/Sell type).
  - Computes **New Weighted Average Price**, **Total Shares**, and **Total Capital Invested**.
  - **Realized P&L Tracking**: Calculates realized profit/loss on partial sell exits while maintaining accurate remaining cost basis.
  - **Live P&L & Breakeven Tracking**: Enter optional Current Market Price (CMP) to track portfolio market value, net profit/loss (₹ and %), and distance needed to reach breakeven.
- 💰 **Dividend Yield Offset**: Enter total dividend income received to compute **Effective Breakeven Price per Share**.
- 🎯 **Target Average Down Planner (What-If Reverse Planner)**:
  - Enter Current Shares, Current Average Price, New Dip Buy Price, and Desired Target Average.
  - Instantly computes **Exact Additional Shares to Buy** and **Additional Capital Required** to achieve the desired average.
- 📤 **Average Setup Sharing & Export**: Instant screenshot export and sharing for WhatsApp, Twitter, and trade journals.

---

### 5. 🏖️ Systematic Withdrawal Plan (SWP) Retirement Calculator
- 💰 **Retirement Cashflow Modeling**:
  - Model monthly pension/income withdrawals from an accumulated mutual fund/portfolio corpus.
  - Interactive presets for Initial Corpus (`₹10L` to `₹1Cr`), Monthly Withdrawal (`₹20K` to `₹1L`), Return Rates, and Horizons (`5Y` to `30Y`).
- ⚖️ **SWP Redemption Tax Deductions**:
  - Model taxes on the capital gains portion of redemptions under **Equity LTCG (12.5% > ₹1.25L exemption)** or **Debt / Slab Rate (20%–30%)**.
  - Displays **Total Tax Paid** and **Net In-Hand Pension Received**.
- 🎈 **Inflation-Adjusted Real Corpus & Income Requirement**:
  - Calculates **Today's Real Purchasing Power of Remaining Corpus**.
  - Derives future monthly income required in Year $N$ to match today's living standards.
- 📉 **Sequence of Returns Risk (SORR) Market Simulator**:
  - Simulates the impact of early market crashes early in retirement.
  - Compares 🎯 **Steady Returns**, 📉 **Early Bear Crash (-15%, -10%)**, and 🚀 **Early Bull Market (+22%, +18%)** side-by-side.
- 🛡️ **Safe Withdrawal Rate & Longevity Analysis**:
  - Identifies **Evergreen Portfolios** where compounding gains outpace withdrawals (corpus grows forever!).
  - Detects exact **Corpus Depletion Horizon** (Years & Months) for aggressive withdrawal plans.
  - Safe withdrawal rate benchmark badge (`≤6% Very Safe`, `6-9% Moderate`, `>9% High Risk`).
- 📊 **Annual Cashflow & Balance Ledger**: Year-by-year milestone tracking of Opening Balance, Withdrawn, Tax, Compounded Returns, and Closing Balance.
- 📤 **SWP Plan Sharing & Export**: Export high-resolution summary cards for retirement planning.

---

### 6. 🏦 Brokerage, Statutory Taxes & Net P&L Calculator
- 🏢 **Multi-Broker Architecture with Dedicated Zero-Brokerage Support**:
  - **Shoonya (Finvasia)**: True ₹0 brokerage on F&O options, futures, and delivery.
  - **FlatTrade**: True ₹0 brokerage across all segments.
  - **Religare Broking**: Tailored for stock buying/delivery with configurable rate input (default `0.25%`).
  - **Upstox**: Flat ₹20 / 0.05% intraday & F&O, 2.5% delivery.
  - **Zerodha**, **Groww**, **Angel One**: Standard discount broker structures (₹0 delivery / flat ₹20 F&O).
  - **Custom Broker**: Fully custom user-defined percentage or flat fee per leg.
- 🎯 **Comprehensive Market Segments**:
  - `🎯 Options (F&O)`: STT (0.1% on sell premium), NSE transaction charges (0.03503% on premium), Stamp duty (0.003% on buy), GST (18%).
  - `📦 Stock Delivery`: Dual STT (0.1% buy + 0.1% sell), DP charges (₹15.93 flat CDSL/NSDL on sell), Stamp duty (0.015% on buy).
  - `⚡ Intraday`: STT (0.025% on sell), NSE transaction (0.00297%), Stamp duty (0.003% on buy).
  - `📈 Futures (F&O)`: STT (0.02% on sell), NSE transaction (0.00173%), Stamp duty (0.002% on buy).
  - `💱 Currency Options & Futures (CDS)`: USDINR currency derivatives (STT 0%, NSE Txn 0.035%/0.0009%).
  - `🛢️ Commodity (MCX)`: Gold & Crude Oil derivatives (CTT 0.01% on sell, MCX Txn 0.0026%).
- 🎯 **Multi-Leg Options Strategy Calculator**:
  - Select order leg count (`1 Leg Single`, `2 Legs Spread/Straddle`, `4 Legs Iron Condor`) to calculate total multi-leg charges.
- 🏷️ **Zero-Brokerage Savings Badge**: Displays exact savings in cash + GST achieved using Shoonya or FlatTrade compared to standard ₹20 discount brokers.
- 🎯 **Breakeven Indicator**: Computes exact minimum price move points and target sell price needed just to break even after statutory taxes.

---

### 7. 🎯 Goal-Based Wealth Planner (Reverse SIP & Lumpsum)
- 🔄 **Reverse Financial Engineering**: Solves *"How much do I need to invest each month to accumulate ₹X in Y years at Z% return?"*
- 🛡️ **Duration-Based Asset Allocation Strategy**:
  - Recommends risk-adjusted asset splits based on goal horizon:
    - `<3 Years`: 80% Debt / FD + 20% Equity (Capital Preservation)
    - `3–7 Years`: 50% Equity + 50% Debt (Balanced Growth)
    - `>7 Years`: 80% Equity + 20% Debt (Aggressive Compounding)
- 🌐 **Multi-Goal Portfolio Aggregator**:
  - Consolidated portfolio summary calculating combined goal targets and total required monthly SIPs across multiple life goals (Education, Home, Car, Retirement).
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
- 🎈 **Inflation-Adjusted Future Goal Cost**: Accurately computes future inflated target corpus.
- 💼 **Existing Savings Compounding Offset**: Factors in current savings already accumulated, compounding them forward to reduce new monthly SIP burden.

---

### 8. 🏠 Loan, Prepayment & EMI vs. SIP Calculator
- 📊 **Smart EMI & Amortization Engine**:
  - Instant derivation of Monthly EMI, Total Principal, and Total Interest Payable.
  - Principal vs. Interest visual distribution ratio bar.
  - Curated Presets: 🏠 Home Loan (₹50L @ 8.5%, 20Y), 🚗 Car Loan (₹12L @ 9%, 5Y), 💼 Personal Loan (₹5L @ 12.5%, 3Y), 🎓 Education Loan (₹20L @ 10%, 8Y), and Custom.
- 📈 **Floating Interest Rate Hike / Cut Simulator**:
  - Models mid-tenure RBI interest rate changes:
    - **Option A (Keep Tenure Same)**: Displays new increased monthly EMI (+₹/mo).
    - **Option B (Keep EMI Same)**: Displays new extended tenure in years & months.
- 🏦 **Loan Balance Transfer (Bank Switch) Calculator**:
  - Compares switching loan from Bank A to Bank B, factoring in transfer processing fees and displaying **Net Lifetime Interest Savings**.
- ⚡ **Early Debt-Free Prepayment Simulator**:
  - **1 Extra EMI per Year (13th Month Hack)**: Pay 1 extra EMI every 12 months to knock 3–5 years off a 20-year home loan and save ₹10L+ in interest!
  - **Annual EMI Step-Up (+5%, +10%, +15% / yr)**: Scale monthly payments as income rises to finish a 20-year loan in just ~11 years.
  - **Extra Monthly Prepayment**: Add small fixed amounts to monthly installments.
  - **One-Time Lump Sum Prepayment**: Inject bonus or trading profit payouts at any milestone year.
  - **Early Debt-Free Banner**: Real-time display of **Years Slashed Off Loan** and **Total Interest Saved in Cash**.
- ⚖️ **Prepay Loan vs. Invest in SIP Arbitrage**:
  - Evaluates whether to prepay the low-rate loan (guaranteed 8.5% interest saved) OR invest surplus funds into an Equity Mutual Fund / SIP (compounding at 12%–14%).
- 📅 **Year-by-Year Amortization Schedule**: Table tracking Year, Opening Principal, Principal Repaid, Interest Paid, Closing Balance, and % Loan Cleared.

---

### 9. 🏖️ Wealth, FIRE & Returns Calculator
- 🔥 **FIRE Retirement Target Corpus & Multi-Tier Benchmarks**:
  - Computes future inflation-adjusted annual expenses at target retirement age.
  - Calculates target FIRE corpus using standard safe withdrawal rate multipliers:
    - ⚡ **Lean FIRE (25x / 4% SWR)**: Essential lifestyle coverage.
    - 🎯 **Standard FIRE (25x / 4% SWR)**: Full baseline living expense coverage.
    - 💎 **Fat FIRE (30x / 3.33% SWR)**: Luxurious, cushion-heavy retirement.
    - 🏝️ **Coast FIRE**: Required current corpus to compound untouched to full target by retirement age without adding another rupee!
- 📈 **Age-Timeline Milestone Ledger**:
  - Year-by-year milestone table tracking Age, Total Corpus, Annual Contributions, Compound Returns, and Real Inflation-Adjusted Wealth.
- 📊 **CAGR (Compound Annual Growth Rate) Calculator**:
  - Calculates annualized growth rate: $\text{CAGR} = \left(\frac{\text{Final}}{\text{Initial}}\right)^{\frac{1}{\text{Years}}} - 1$.
  - Computes Absolute Return %, Total Wealth Multiplier ($X$), and Net Profit.
- 🔮 **Multi-Date Portfolio XIRR Newton-Raphson Engine**:
  - Precision Extended Internal Rate of Return solver for irregular multi-date investments and redemptions.
  - Dynamically add/remove cashflow rows with positive (inflows/final valuation) and negative (outflows/investments) amounts.
- 📤 **FIRE Plan Sharing & Export**: High-resolution screenshot export for wealth planning journal logs.

---

### 10. 🎨 Premium Fintech UI & Responsive Layout
- 📱 **Universal Responsiveness**: Adaptive centered container (`maxWidth: 720px`) on desktop web displays with native full-window body scrolling (no nested inner scrollbars).
- 🌓 **Obsidian Dark & Clean Slate Light Themes**: Deep `#090D16` dark mode and `#F8FAFC` light mode with translucent borders and elevated cards.
- 🔒 **Data Validation & Protection**: Negative value checks, SL/Target bounds checking, and missing required field highlights.
- 🗂️ **State-Preserving 9-Tab Bar**: Smooth horizontal scrolling bar switching between Trading, Greeks, SIP, SWP, Stock Average, Brokerage, Goal Planner, Loan, and FIRE Calculator without losing entered state.

---

## 📂 Project Structure

```
├── App.js                                 # Main shell, responsive container, top 9-tab navigation
├── src/
│   ├── components/
│   │   ├── CalculatorScreen.js            # Trading workstation (10-field engine, badge, ladder)
│   │   ├── OptionGreeksScreen.js          # Options Black-Scholes & 5 Greeks workstation
│   │   ├── SipCalculatorScreen.js         # Wealth workstation (LTCG Tax, Step-Up Frequency, Multi-Scenario)
│   │   ├── SwpCalculatorScreen.js         # Retirement workstation (Redemption Tax, Inflation, SORR Simulator)
│   │   ├── StockAverageScreen.js          # Stock Averaging (Buy/Sell batches, Realized P&L, Dividends offset)
│   │   ├── BrokerageCalculatorScreen.js   # Brokerage, Statutory Taxes (F&O, Delivery, CDS, MCX, Multi-Leg)
│   │   ├── GoalCalculatorScreen.js        # Goal Planner (Asset Allocation Strategy & Multi-Goal Aggregator)
│   │   ├── LoanCalculatorScreen.js        # Loan workstation (Rate Hike Simulator, Balance Transfer, Prepayment)
│   │   ├── FireCalculatorScreen.js        # FIRE & Returns workstation (Lean/Fat/Coast FIRE, CAGR, XIRR solver)
│   │   ├── SipDonutChart.js               # SVG Donut investment vs. returns chart
│   │   └── styles.js                      # Design system tokens (dark/light themes, cards, grid)
│   └── utils/
│       ├── averageCalculations.js         # Weighted average, buy/sell realized P&L & dividend offset
│       ├── brokerageCalculations.js       # Brokerage, STT, CTT, GST, SEBI, CDS & MCX tax engine
│       ├── fireCalculations.js            # FIRE target corpus, Coast FIRE, CAGR & Newton-Raphson XIRR solver
│       ├── goalCalculations.js            # Reverse SIP, Step-Up, Asset Allocation & Multi-Goal aggregator
│       ├── greeksCalculations.js          # Black-Scholes option fair value, 5 Greeks, IV solver & What-If scenario
│       ├── loanCalculations.js            # EMI amortization, rate revision, balance transfer & SIP arbitrage
│       ├── sipCalculations.js             # Financial compounding, LTCG tax, step-up & multi-scenarios
│       └── swpCalculations.js             # SWP redemption tax, SORR crash simulator & inflation algorithms
├── app.json                               # Expo app configuration
├── eas.json                               # EAS Build & Hosting configuration
├── package.json                           # Dependencies & scripts
└── README.md                              # Complete feature & documentation guide
```

---

## 🛠 Prerequisites

Make sure you have the following installed:
- [Node.js](https://nodejs.org/) (v16 or higher recommended)
- npm or yarn
- [Expo CLI](https://docs.expo.dev/get-started/installation/) (`npm install -g expo-cli`)

---

## 💻 Local Development Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/riyazpanarwala/trading-calculator.git
   cd trading-calculator
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the Expo development server:**
   ```bash
   npx expo start
   ```

4. **Run on target platform:**
   - **Web:** Press `w` in terminal or run `npx expo start --web`
   - **iOS Simulator:** Press `i` (macOS only)
   - **Android Emulator:** Press `a`
   - **Mobile Device:** Scan the QR code using Expo Go app (Android) or Camera app (iOS)

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
