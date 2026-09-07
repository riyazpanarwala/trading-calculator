/**
 * Indian Stock Market Brokerage, Statutory Taxes & Net P&L Calculation Utilities
 * Supports: Shoonya (Finvasia), FlatTrade, Religare Broking, Upstox, Zerodha, Groww, Angel One, and Custom.
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
];

/**
 * Format currency with Indian/Standard locale
 * @param {number} value
 * @param {string} [currencySymbol='₹']
 * @returns {string}
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
 *
 * @param {Object} params
 * @param {string} params.brokerId
 * @param {string} params.segment
 * @param {number} params.turnover - Price * Qty for this leg
 * @param {number} [params.customRate] - % or flat ₹ for custom / Religare
 * @param {string} [params.customType='percentage'] - 'percentage' | 'flat'
 * @returns {number}
 */
export function calculateLegBrokerage({
    brokerId,
    segment,
    turnover,
    customRate = null,
    customType = "percentage",
}) {
    if (turnover <= 0) return 0;

    // Zero Brokerage brokers
    if (brokerId === "shoonya" || brokerId === "flattrade") {
        return 0;
    }

    // Religare Broking (customizable full service)
    if (brokerId === "religare") {
        if (customRate != null && !isNaN(parseFloat(customRate))) {
            const rate = parseFloat(customRate);
            if (customType === "flat") {
                return rate;
            }
            return (turnover * rate) / 100;
        }
        // Default Religare tier
        if (segment === "equity_delivery") {
            return (turnover * 0.25) / 100; // 0.25%
        }
        if (segment === "equity_intraday") {
            return (turnover * 0.03) / 100; // 0.03%
        }
        if (segment === "options") {
            return 20; // Flat ₹20
        }
        if (segment === "futures") {
            return (turnover * 0.03) / 100;
        }
        return (turnover * 0.25) / 100;
    }

    // Upstox
    if (brokerId === "upstox") {
        if (segment === "options") return 20;
        if (segment === "equity_delivery") {
            return Math.min(20, (turnover * 2.5) / 100);
        }
        // Intraday & Futures: 0.05% or ₹20 (lower)
        return Math.min(20, (turnover * 0.05) / 100);
    }

    // Zerodha
    if (brokerId === "zerodha") {
        if (segment === "equity_delivery") return 0;
        if (segment === "options") return 20;
        // Intraday & Futures: 0.03% or ₹20 (lower)
        return Math.min(20, (turnover * 0.03) / 100);
    }

    // Groww
    if (brokerId === "groww") {
        if (segment === "options") return 20;
        // Delivery, Intraday, Futures: 0.05% or ₹20 (lower)
        return Math.min(20, (turnover * 0.05) / 100);
    }

    // Angel One
    if (brokerId === "angelone") {
        if (segment === "equity_delivery") return 0;
        if (segment === "options") return 20;
        // Intraday & Futures: 0.03% or ₹20 (lower)
        return Math.min(20, (turnover * 0.03) / 100);
    }

    // Custom
    if (brokerId === "custom") {
        const rate = parseFloat(customRate);
        if (isNaN(rate) || rate <= 0) return 0;
        if (customType === "flat") {
            return rate;
        }
        return (turnover * rate) / 100;
    }

    return 20;
}

/**
 * Calculate comprehensive Trade Breakdown: Brokerage, STT, Exchange Txn, GST, SEBI, Stamp Duty, DP & Net P&L
 *
 * @param {Object} params
 * @param {string} params.segment - 'options' | 'equity_delivery' | 'equity_intraday' | 'futures'
 * @param {string} params.brokerId - 'shoonya' | 'flattrade' | 'religare' | 'upstox' | 'zerodha' | 'groww' | 'angelone' | 'custom'
 * @param {number|string} params.buyPrice - Entry purchase price per unit
 * @param {number|string} params.sellPrice - Exit sell price per unit
 * @param {number|string} params.quantity - Number of shares or option contracts
 * @param {number|string} [params.customRate] - Optional custom/Religare rate
 * @param {string} [params.customType='percentage'] - 'percentage' | 'flat'
 * @returns {Object}
 */
export function calculateBrokerageAndTaxes({
    segment = "options",
    brokerId = "shoonya",
    buyPrice,
    sellPrice,
    quantity,
    customRate = null,
    customType = "percentage",
}) {
    const buyP = parseFloat(buyPrice);
    const sellP = parseFloat(sellPrice);
    const qty = parseFloat(quantity);

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

    const buyTurnover = buyP * qty;
    const sellTurnover = sellP * qty;
    const totalTurnover = buyTurnover + sellTurnover;
    const grossPnl = (sellP - buyP) * qty;

    // 1. Brokerage
    const brokerageBuy = calculateLegBrokerage({
        brokerId,
        segment,
        turnover: buyTurnover,
        customRate,
        customType,
    });
    const brokerageSell = calculateLegBrokerage({
        brokerId,
        segment,
        turnover: sellTurnover,
        customRate,
        customType,
    });
    const totalBrokerage = brokerageBuy + brokerageSell;

    // 2. STT / CTT
    let stt = 0;
    if (segment === "options") {
        // Options: 0.1% on Sell premium turnover
        stt = (sellTurnover * 0.1) / 100;
    } else if (segment === "equity_delivery") {
        // Equity Delivery: 0.1% on Buy + 0.1% on Sell
        stt = (buyTurnover * 0.1) / 100 + (sellTurnover * 0.1) / 100;
    } else if (segment === "equity_intraday") {
        // Equity Intraday: 0.025% on Sell side only
        stt = (sellTurnover * 0.025) / 100;
    } else if (segment === "futures") {
        // Futures: 0.02% on Sell side
        stt = (sellTurnover * 0.02) / 100;
    }

    // 3. Exchange Transaction Charges (NSE Benchmark)
    let exchangeRate = 0.00297; // Default Equity (0.00297%)
    if (segment === "options") {
        exchangeRate = 0.03503; // Options: 0.03503% on premium turnover
    } else if (segment === "futures") {
        exchangeRate = 0.00173; // Futures: 0.00173% on turnover
    }
    const exchangeTxn = (totalTurnover * exchangeRate) / 100;

    // 4. SEBI Turnover Charges: ₹10 / Crore (0.0001% of turnover)
    const sebiCharges = (totalTurnover * 0.0001) / 100;

    // 5. GST: 18% on (Brokerage + Exchange Txn + SEBI Charges)
    const gst = (totalBrokerage + exchangeTxn + sebiCharges) * 0.18;

    // 6. Stamp Duty (Buy side only)
    let stampRate = 0.003; // Intraday/Options: 0.003% (₹300 / Cr)
    if (segment === "equity_delivery") {
        stampRate = 0.015; // Delivery: 0.015% (₹1500 / Cr)
    } else if (segment === "futures") {
        stampRate = 0.002; // Futures: 0.002% (₹200 / Cr)
    }
    const stampDuty = (buyTurnover * stampRate) / 100;

    // 7. DP Charges: Flat ₹15.93 for Equity Delivery sales
    const dpCharges = segment === "equity_delivery" ? 15.93 : 0;

    // Total statutory + broker charges
    const totalCharges = totalBrokerage + stt + exchangeTxn + gst + sebiCharges + stampDuty + dpCharges;

    // Net P&L & Breakeven
    const netPnl = grossPnl - totalCharges;
    const netPnlPercent = buyTurnover > 0 ? (netPnl / buyTurnover) * 100 : 0;
    const breakevenPoints = qty > 0 ? totalCharges / qty : 0;
    const breakevenPrice = buyP + breakevenPoints;

    // Zero-Brokerage Savings (Shoonya / FlatTrade vs. standard ₹20 flat broker = ₹40 + 18% GST = ₹47.20)
    let zeroBrokerageSavings = 0;
    if (brokerId === "shoonya" || brokerId === "flattrade") {
        const standardBrokerage = 40; // ₹20 Buy + ₹20 Sell
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
    };
}
