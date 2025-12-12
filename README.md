# 📈 Universal Trading Calculator (Expo / React Native)

A powerful and flexible **trading calculator** built using **React
Native + Expo**.\
This calculator automatically derives values such as **SL %, Target %,
Quantity, Position Size, Risk Amount, Risk--Reward, Profit**, and more
--- all interconnected and updated in real time.

The logic is fully iterative and ensures bi-directional syncing between
all related fields.

------------------------------------------------------------------------

## 🚀 Features

-   🔄 **Real-time auto-calculation** based on any field input
-   🔗 **Full bi-directional dependency logic**
    -   SL Price ↔ SL %
    -   Target Price ↔ Target %
    -   Quantity ↔ Position Amount
    -   Risk Amount auto-calculated
    -   Risk--Reward auto-computed
-   🚫 **Negative value protection**
-   🎯 **Accurate financial calculations** with iterative stabilization
-   🌓 **Built-in Light & Dark Theme**
-   📱 **Responsive grid layout**
-   ⚠️ Highlights **missing required fields** dynamically
-   ❗ Automatic validation for:
    -   SL% between 0--100
    -   No negative inputs
    -   Numeric-only fields

------------------------------------------------------------------------

## 📂 Project Structure (Relevant Files)

    /CalculatorScreen.js   # Main calculator logic + UI
    /styles.js             # Light & dark theme + layout styles
    /App.js                # Expo entry point

------------------------------------------------------------------------

## 🛠 Tech Stack

-   **Expo**
-   **React Native**
-   **JavaScript**
-   **React Hooks (useState, useMemo)**

------------------------------------------------------------------------

## 📜 Core Logic Highlights

### 🔢 Input Validation

-   Negative signs (`-`) are fully blocked at the input level.
-   SL% is validated to ensure it's within **0--100**.
-   Non-numeric entries gracefully ignored.

### 🔁 Iterative Auto-Derivation Engine

The function:

    deriveIterative()

Runs up to **40 iterations**, updating fields until all dependent values
stabilize.

This ensures:

-   SL \<→ SL%
-   Target \<→ %
-   Quantity \<→ Position Amount \<→ Risk Amount
-   Risk--Reward ratio
-   Profit amount

All update instantly and correctly.

------------------------------------------------------------------------

## 📱 UI Highlights

-   Clean **scrollable layout**
-   **2-column grid**
-   Highlight boxes for missing values
-   Theme toggle button: `☀️ Light / 🌙 Dark`
-   Color-coded inputs for invalid or missing fields

------------------------------------------------------------------------

## ▶️ Getting Started

### 1️⃣ Install dependencies

``` bash
npm install
```

### 2️⃣ Start Expo

``` bash
npx expo start
```

### 3️⃣ Run on device

-   Scan the QR code using **Expo Go**
-   Or press **a** for Android emulator\
-   Or press **i** for iOS simulator (macOS)

------------------------------------------------------------------------

## 🧪 Usage Instructions

1.  Enter any values among:

    -   Entry Price
    -   SL Price / SL %
    -   Target Price / %
    -   Quantity / Position Amount
    -   Risk Amount

2.  The rest of the fields will **auto-fill** instantly.

3.  If too few fields are filled, the app shows:

    -   Missing required fields (highlighted)
    -   Subtle colored reminder box

4.  Switch themes with the toggle on top.

------------------------------------------------------------------------

## 🧩 Available Form Fields

  Field Key        Label
  ---------------- -----------------
  entryPrice       Entry Price
  slPrice          SL Price
  slPercent        SL %
  riskAmount       Risk Amount
  positionAmount   Position Amount
  quantity         Quantity
  targetPercent    Target %
  targetPrice      Target Price
  riskReward       Risk : Reward
  profitAmount     Profit Amount

------------------------------------------------------------------------

## 🔧 Customization

You can easily modify:

-   Field labels
-   Grid layout (in `styles.js`)
-   Themes (light/dark)
-   Calculation logic

------------------------------------------------------------------------

## 📜 License

This project is free to use, modify, or integrate into your personal or
commercial trading applications.

------------------------------------------------------------------------
