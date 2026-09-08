/**
 * Indian Stock, Derivatives, Currency & Commodity Brokerage & Statutory Tax Engine
 * Supports: Shoonya (Finvasia), FlatTrade, Religare Broking, Upstox, Zerodha, Groww, Angel One, Custom.
 */

export const BROKER_PRESETS = [
    { id: "shoonya", name: "Shoonya", badge: "₹0 Brokerage", tag: "F&O Active" },
    { id: "flattrade", name: "FlatTrade", badge: "₹0 Brokerage", tag: "F&O Active" },
    { id: "religare", name: "Religare", badge: "Stocks Buy", tag: "Delivery" },
    { id: "upstox", name: "Upstox", badge: "Flat ₹20 / 0.05%", tag: "Discount" },
    { id: "zerodha", name: "Zerodha", badge: "₹0 Delivery / ₹20", tag: "Discount" },
    { id: "groww", name: "Groww", badge: "Flat ₹20 / 0.05%", tag: "Discount" },
    { id: "angelone", name: "Angel One", badge: "₹0 Delivery / ₹20", tag: "Discount" },
    { id: "custom", name: "Custom", badge: "User Defined", tag: "Custom" },
];

export const SEGMENTS = [
    { id: "options", label: "🎯 Options (F&O)", defaultQty: 75 },
    { id: "equity_delivery", label: "📦 Stock Delivery", defaultQty: 100 },
    { id: "equity_intraday", label: "⚡ Intraday", defaultQty: 100 },
    { id: "futures", label: "📈 Futures (F&O)", defaultQty: 75 },
    { id: "cds_options", label: "💱 Currency Options (CDS)", defaultQty: 1000 },
    { id: "cds_futures", label: "💱 Currency Futures (CDS)", defaultQty: 1000 },
    { id: "mcx_commodity", label: "🛢️ Commodity (MCX)", defaultQty: 100 },
];

/**
 * Format currency with Indian/Standard locale
 */
export function formatCurrency(value, currencySymbol = "₹") {
    if (value == null || isNaN(value)) return `${currencySymbol} 0`;
    const absVal = Math.abs(value);
    const prefix = value < 0 ? "−" : "";
    const formatted = absVal >= 10000
        ? Number(absVal.toFixed(2)).toLocaleString("en-IN", { maximumFractionDigits: 2 })
        : Number(absVal.toFixed(2)).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return `${prefix}${currencySymbol} ${formatted}`;
}

/**
 * Calculate brokerage fee for a single order leg (buy or sell)
 */
export function calculateLegBrokerage({
    brokerId,
    segment,
    turnover,
    customRate = null,
    customType = "percentage",
}) {
    if (turnover <= 0) return 0;

    if (brokerId === "shoonya" || brokerId === "flattrade") {
        return 0;
    }

    if (brokerId === "religare") {
        if (customRate != null && !isNaN(parseFloat(customRate))) {
            const rate = parseFloat(customRate);
            if (customType === "flat") return rate;
            return (turnover * rate) / 100;
        }
        if (segment === "equity_delivery") return (turnover * 0.25) / 100;
        if (segment === "equity_intraday") return (turnover * 0.03) / 100;
        if (segment === "options" || segment === "cds_options") return 20;
        return (turnover * 0.03) / 100;
    }

    if (brokerId === "upstox") {
        if (segment === "options" || segment === "cds_options") return 20;
        if (segment === "equity_delivery") return Math.min(20, (turnover * 2.5) / 100);
        return Math.min(20, (turnover * 0.05) / 100);
    }

    if (brokerId === "zerodha") {
        if (segment === "equity_delivery") return 0;
        if (segment === "options" || segment === "cds_options") return 20;
        return Math.min(20, (turnover * 0.03) / 100);
    }

    if (brokerId === "groww") {
        if (segment === "options" || segment === "cds_options") return 20;
        return Math.min(20, (turnover * 0.05) / 100);
    }

    if (brokerId === "angelone") {
        if (segment === "equity_delivery") return 0;
        if (segment === "options" || segment === "cds_options") return 20;
        return Math.min(20, (turnover * 0.03) / 100);
    }

    if (brokerId === "custom") {
        const rate = parseFloat(customRate);
        if (isNaN(rate) || rate <= 0) return 0;
        if (customType === "flat") return rate;
        return (turnover * rate) / 100;
    }

    return 20;
}

/**
 * Calculate comprehensive Trade Breakdown
 */
export function calculateBrokerageAndTaxes({
    segment = "options",
    brokerId = "shoonya",
    buyPrice,
    sellPrice,
    quantity,
    customRate = null,
    customType = "percentage",
    legCount = 1,
}) {
    const buyP = parseFloat(buyPrice);
    const sellP = parseFloat(sellPrice);
    const qty = parseFloat(quantity);
    const legs = Math.max(1, parseInt(legCount, 10) || 1);

    if (isNaN(buyP) || buyP <= 0 || isNaN(sellP) || sellP <= 0 || isNaN(qty) || qty <= 0) {
        return {
            isValid: false,
            buyTurnover: 0,
            sellTurnover: 0,
            totalTurnover: 0,
            grossPnl: 0,
            brokerageBuy: 0,
            brokerageSell: 0,
            totalBrokerage: 0,
            stt: 0,
            exchangeTxn: 0,
            gst: 0,
            sebiCharges: 0,
            stampDuty: 0,
            dpCharges: 0,
            totalCharges: 0,
            netPnl: 0,
            netPnlPercent: 0,
            breakevenPoints: 0,
            breakevenPrice: 0,
            zeroBrokerageSavings: 0,
        };
    }

    const buyTurnover = buyP * qty * legs;
    const sellTurnover = sellP * qty * legs;
    const totalTurnover = buyTurnover + sellTurnover;
    const grossPnl = (sellP - buyP) * qty * legs;

    // 1. Brokerage
    const brokerageBuy = calculateLegBrokerage({ brokerId, segment, turnover: buyTurnover / legs, customRate, customType }) * legs;
    const brokerageSell = calculateLegBrokerage({ brokerId, segment, turnover: sellTurnover / legs, customRate, customType }) * legs;
    const totalBrokerage = brokerageBuy + brokerageSell;

    // 2. STT / CTT
    let stt = 0;
    if (segment === "options") {
        stt = (sellTurnover * 0.1) / 100;
    } else if (segment === "equity_delivery") {
        stt = (buyTurnover * 0.1) / 100 + (sellTurnover * 0.1) / 100;
    } else if (segment === "equity_intraday") {
        stt = (sellTurnover * 0.025) / 100;
    } else if (segment === "futures") {
        stt = (sellTurnover * 0.02) / 100;
    } else if (segment === "mcx_commodity") {
        // CTT: 0.01% on sell
        stt = (sellTurnover * 0.01) / 100;
    } else if (segment === "cds_options" || segment === "cds_futures") {
        stt = 0; // Currency derivatives have 0 STT
    }

    // 3. Exchange Transaction Charges
    let exchangeRate = 0.00297;
    if (segment === "options") exchangeRate = 0.03503;
    else if (segment === "futures") exchangeRate = 0.00173;
    else if (segment === "cds_options") exchangeRate = 0.035;
    else if (segment === "cds_futures") exchangeRate = 0.0009;
    else if (segment === "mcx_commodity") exchangeRate = 0.0026;

    const exchangeTxn = (totalTurnover * exchangeRate) / 100;

    // 4. SEBI Turnover Charges: ₹10 / Crore
    const sebiCharges = (totalTurnover * 0.0001) / 100;

    // 5. GST: 18% on (Brokerage + Exchange Txn + SEBI)
    const gst = (totalBrokerage + exchangeTxn + sebiCharges) * 0.18;

    // 6. Stamp Duty (Buy side only)
    let stampRate = 0.003;
    if (segment === "equity_delivery") stampRate = 0.015;
    else if (segment === "futures") stampRate = 0.002;
    else if (segment === "cds_options" || segment === "cds_futures") stampRate = 0.0001;
    else if (segment === "mcx_commodity") stampRate = 0.002;

    const stampDuty = (buyTurnover * stampRate) / 100;

    // 7. DP Charges
    const dpCharges = segment === "equity_delivery" ? 15.93 : 0;

    // Totals
    const totalCharges = totalBrokerage + stt + exchangeTxn + sebiCharges + gst + stampDuty + dpCharges;
    const netPnl = grossPnl - totalCharges;
    const netPnlPercent = buyTurnover > 0 ? (netPnl / buyTurnover) * 100 : 0;

    const breakevenPoints = (qty * legs) > 0 ? totalCharges / (qty * legs) : 0;
    const breakevenPrice = buyP + breakevenPoints;

    // Zero brokerage savings comparison
    let zeroBrokerageSavings = 0;
    if (brokerId === "shoonya" || brokerId === "flattrade") {
        const standardBrokerage = 20 * 2 * legs; // ₹20 buy + ₹20 sell per leg
        const standardGst = standardBrokerage * 0.18;
        zeroBrokerageSavings = standardBrokerage + standardGst;
    }

    return {
        isValid: true,
        buyTurnover: Math.round(buyTurnover * 100) / 100,
        sellTurnover: Math.round(sellTurnover * 100) / 100,
        totalTurnover: Math.round(totalTurnover * 100) / 100,
        grossPnl: Math.round(grossPnl * 100) / 100,
        brokerageBuy: Math.round(brokerageBuy * 100) / 100,
        brokerageSell: Math.round(brokerageSell * 100) / 100,
        totalBrokerage: Math.round(totalBrokerage * 100) / 100,
        stt: Math.round(stt * 100) / 100,
        exchangeTxn: Math.round(exchangeTxn * 100) / 100,
        gst: Math.round(gst * 100) / 100,
        sebiCharges: Math.round(sebiCharges * 100) / 100,
        stampDuty: Math.round(stampDuty * 100) / 100,
        dpCharges: Math.round(dpCharges * 100) / 100,
        totalCharges: Math.round(totalCharges * 100) / 100,
        netPnl: Math.round(netPnl * 100) / 100,
        netPnlPercent: Math.round(netPnlPercent * 100) / 100,
        breakevenPoints: Math.round(breakevenPoints * 100) / 100,
        breakevenPrice: Math.round(breakevenPrice * 100) / 100,
        zeroBrokerageSavings: Math.round(zeroBrokerageSavings * 100) / 100,
        legCount: legs,
    };
}
