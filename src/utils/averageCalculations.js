/**
 * Stock Averaging and Target Average Down financial calculation utilities
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
    return `${currencySymbol} ${formatted}`;
}

/**
 * Calculate multi-batch stock purchase average and live P&L
 *
 * @param {Array<{ price: string|number, quantity: string|number }>} batches
 * @param {string|number} [currentMarketPrice]
 * @returns {Object}
 */
export function calculateStockAverage(batches = [], currentMarketPrice = null) {
    let totalQuantity = 0;
    let totalInvested = 0;
    const validBatches = [];

    batches.forEach((b, idx) => {
        const p = parseFloat(b.price);
        const q = parseFloat(b.quantity);

        if (!isNaN(p) && p > 0 && !isNaN(q) && q > 0) {
            const lotCost = p * q;
            totalQuantity += q;
            totalInvested += lotCost;

            validBatches.push({
                index: idx + 1,
                price: p,
                quantity: q,
                cost: lotCost,
            });
        }
    });

    if (totalQuantity <= 0 || totalInvested <= 0) {
        return {
            isValid: false,
            totalQuantity: 0,
            totalInvested: 0,
            averagePrice: 0,
            validBatches: [],
            cmp: null,
            currentValue: null,
            pnl: null,
            pnlPercent: null,
            breakevenDistance: null,
            breakevenDistancePercent: null,
        };
    }

    const averagePrice = totalInvested / totalQuantity;

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

    if (!isNaN(cmp) && cmp > 0) {
        const currentValue = totalQuantity * cmp;
        const pnl = currentValue - totalInvested;
        const pnlPercent = (pnl / totalInvested) * 100;
        const breakevenDistance = averagePrice - cmp;
        const breakevenDistancePercent = (breakevenDistance / cmp) * 100;

        cmpData = {
            cmp,
            currentValue: Math.round(currentValue * 100) / 100,
            pnl: Math.round(pnl * 100) / 100,
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
        validBatches: batchesWithWeights,
        ...cmpData,
    };
}

/**
 * Calculate Target Average Down requirements
 * Formula:
 *   Q2 = Q1 * (P1 - P_target) / (P_target - P2)
 *
 * @param {Object} params
 * @param {string|number} params.currentShares - Q1
 * @param {string|number} params.currentAvgPrice - P1
 * @param {string|number} params.newBuyPrice - P2 (must be < P_target < P1)
 * @param {string|number} params.targetAvgPrice - P_target
 * @returns {Object}
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

    // Validation for Averaging DOWN
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

    // Exact formula: Q2 = Q1 * (P1 - P_target) / (P_target - P2)
    const exactSharesToBuy = (q1 * (p1 - pTarget)) / (pTarget - p2);
    // Ceiling or rounded shares to ensure target average is reached
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
