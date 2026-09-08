/**
 * Stock Averaging, Partial Exit P&L and Target Average Down Financial Utilities
 */

/**
 * Format currency with Indian/Standard locale
 * @param {number} value
 * @param {string} [currencySymbol='₹']
 * @returns {string}
 */
export function formatCurrency(value, currencySymbol = "₹") {
    if (value == null || isNaN(value)) return `${currencySymbol} 0`;
    const formatted = Math.abs(value) >= 10000
        ? Number(value.toFixed(2)).toLocaleString("en-IN", { maximumFractionDigits: 2 })
        : Number(value.toFixed(2)).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return `${value < 0 ? "−" : ""}${currencySymbol} ${formatted}`;
}

/**
 * Calculate multi-batch stock purchase/sell averaging, realized P&L, and dividend breakeven offset
 *
 * @param {Array<{ price: string|number, quantity: string|number, type?: 'BUY'|'SELL', date?: string }>} batches
 * @param {string|number} [currentMarketPrice]
 * @param {string|number} [totalDividends=0]
 * @returns {Object}
 */
export function calculateStockAverage(batches = [], currentMarketPrice = null, totalDividends = 0) {
    let totalQuantity = 0;
    let totalInvested = 0;
    let realizedPnl = 0;
    const validBatches = [];

    const divs = Math.max(0, parseFloat(totalDividends) || 0);

    batches.forEach((b, idx) => {
        const p = parseFloat(b.price);
        const q = parseFloat(b.quantity);
        const type = (b.type || "BUY").toUpperCase();

        if (!isNaN(p) && p > 0 && !isNaN(q) && q > 0) {
            const lotCost = p * q;

            if (type === "BUY") {
                totalQuantity += q;
                totalInvested += lotCost;
            } else if (type === "SELL") {
                const currentAvgCost = totalQuantity > 0 ? totalInvested / totalQuantity : p;
                const lotRealized = (p - currentAvgCost) * q;
                realizedPnl += lotRealized;

                const soldCost = currentAvgCost * q;
                totalQuantity = Math.max(0, totalQuantity - q);
                totalInvested = Math.max(0, totalInvested - soldCost);
            }

            validBatches.push({
                index: idx + 1,
                price: p,
                quantity: q,
                type,
                date: b.date || "",
                cost: lotCost,
            });
        }
    });

    if (totalQuantity <= 0 && validBatches.length === 0) {
        return {
            isValid: false,
            totalQuantity: 0,
            totalInvested: 0,
            averagePrice: 0,
            realizedPnl: 0,
            effectiveBreakevenPrice: 0,
            validBatches: [],
            cmp: null,
            currentValue: null,
            pnl: null,
            pnlPercent: null,
            breakevenDistance: null,
            breakevenDistancePercent: null,
        };
    }

    const averagePrice = totalQuantity > 0 ? totalInvested / totalQuantity : 0;
    const netCostAfterDividends = Math.max(0, totalInvested - divs);
    const effectiveBreakevenPrice = totalQuantity > 0 ? netCostAfterDividends / totalQuantity : 0;

    // Attach weighting to each valid batch
    const batchesWithWeights = validBatches.map((b) => ({
        ...b,
        weightPercent: totalInvested > 0 ? (b.cost / totalInvested) * 100 : 0,
    }));

    // Check optional Current Market Price (CMP)
    const cmp = parseFloat(currentMarketPrice);
    let cmpData = {
        cmp: null,
        currentValue: null,
        pnl: null,
        pnlPercent: null,
        breakevenDistance: null,
        breakevenDistancePercent: null,
    };

    if (!isNaN(cmp) && cmp > 0 && totalQuantity > 0) {
        const currentValue = totalQuantity * cmp;
        const unrealizedPnl = currentValue - totalInvested;
        const pnlPercent = totalInvested > 0 ? (unrealizedPnl / totalInvested) * 100 : 0;
        const breakevenDistance = averagePrice - cmp;
        const breakevenDistancePercent = (breakevenDistance / cmp) * 100;

        cmpData = {
            cmp,
            currentValue: Math.round(currentValue * 100) / 100,
            pnl: Math.round(unrealizedPnl * 100) / 100,
            pnlPercent: Math.round(pnlPercent * 100) / 100,
            breakevenDistance: Math.round(breakevenDistance * 100) / 100,
            breakevenDistancePercent: Math.round(breakevenDistancePercent * 100) / 100,
        };
    }

    return {
        isValid: true,
        totalQuantity,
        totalInvested: Math.round(totalInvested * 100) / 100,
        averagePrice: Math.round(averagePrice * 100) / 100,
        realizedPnl: Math.round(realizedPnl * 100) / 100,
        totalDividends: Math.round(divs * 100) / 100,
        effectiveBreakevenPrice: Math.round(effectiveBreakevenPrice * 100) / 100,
        validBatches: batchesWithWeights,
        ...cmpData,
    };
}

/**
 * Calculate Target Average Down requirements
 */
export function calculateTargetAverage({
    currentShares,
    currentAvgPrice,
    newBuyPrice,
    targetAvgPrice,
}) {
    const q1 = parseFloat(currentShares);
    const p1 = parseFloat(currentAvgPrice);
    const p2 = parseFloat(newBuyPrice);
    const pTarget = parseFloat(targetAvgPrice);

    if (
        isNaN(q1) || q1 <= 0 ||
        isNaN(p1) || p1 <= 0 ||
        isNaN(p2) || p2 <= 0 ||
        isNaN(pTarget) || pTarget <= 0
    ) {
        return {
            isValid: false,
            error: null,
            sharesToBuy: 0,
            additionalCapital: 0,
            newTotalShares: 0,
            newTotalInvested: 0,
        };
    }

    if (p2 >= p1) {
        return {
            isValid: false,
            error: "New buy price must be lower than current average to average down.",
            sharesToBuy: 0,
            additionalCapital: 0,
            newTotalShares: 0,
            newTotalInvested: 0,
        };
    }

    if (pTarget <= p2) {
        return {
            isValid: false,
            error: `Target average must be higher than new buy price (${formatCurrency(p2)}).`,
            sharesToBuy: 0,
            additionalCapital: 0,
            newTotalShares: 0,
            newTotalInvested: 0,
        };
    }

    if (pTarget >= p1) {
        return {
            isValid: false,
            error: `Target average must be lower than your current average (${formatCurrency(p1)}).`,
            sharesToBuy: 0,
            additionalCapital: 0,
            newTotalShares: 0,
            newTotalInvested: 0,
        };
    }

    const exactSharesToBuy = (q1 * (p1 - pTarget)) / (pTarget - p2);
    const sharesToBuy = Math.ceil(exactSharesToBuy);
    const additionalCapital = sharesToBuy * p2;

    const currentInvested = q1 * p1;
    const newTotalShares = q1 + sharesToBuy;
    const newTotalInvested = currentInvested + additionalCapital;
    const achievedAverage = newTotalInvested / newTotalShares;

    return {
        isValid: true,
        error: null,
        exactSharesToBuy: Math.round(exactSharesToBuy * 100) / 100,
        sharesToBuy,
        additionalCapital: Math.round(additionalCapital * 100) / 100,
        currentInvested: Math.round(currentInvested * 100) / 100,
        newTotalShares,
        newTotalInvested: Math.round(newTotalInvested * 100) / 100,
        achievedAverage: Math.round(achievedAverage * 100) / 100,
    };
}
