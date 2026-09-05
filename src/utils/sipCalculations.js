/**
 * SIP & Lumpsum financial calculation utilities
 */

/**
 * Calculate Monthly SIP Future Value
 * Formula: M = P * (( (1 + i)^n - 1 ) / i) * (1 + i)
 * where:
 *   P = Monthly investment
 *   i = Periodic monthly rate (annualRate / 12 / 100)
 *   n = Total number of months (years * 12)
 *
 * @param {Object} params
 * @param {number} params.investmentAmount - Monthly investment (or lumpsum)
 * @param {number} params.annualRate - Expected annual return rate in %
 * @param {number} params.years - Investment duration in years
 * @param {boolean} [params.isLumpsum=false] - If true, calculates one-time lumpsum instead of monthly SIP
 * @returns {Object} { totalInvested, estimatedReturns, maturityValue }
 */
export function calculateSipResult({ investmentAmount, annualRate, years, isLumpsum = false }) {
    const P = parseFloat(investmentAmount);
    const r = parseFloat(annualRate);
    const y = parseFloat(years);

    if (isNaN(P) || P <= 0 || isNaN(r) || r < 0 || isNaN(y) || y <= 0) {
        return {
            totalInvested: 0,
            estimatedReturns: 0,
            maturityValue: 0,
        };
    }

    if (isLumpsum) {
        const totalInvested = P;
        // Lumpsum compound interest: A = P * (1 + r/100)^y
        const maturityValue = P * Math.pow(1 + r / 100, y);
        const estimatedReturns = Math.max(0, maturityValue - totalInvested);
        return {
            totalInvested: Math.round(totalInvested),
            estimatedReturns: Math.round(estimatedReturns),
            maturityValue: Math.round(maturityValue),
        };
    }

    const n = Math.round(y * 12);
    const totalInvested = P * n;

    if (r === 0) {
        return {
            totalInvested: Math.round(totalInvested),
            estimatedReturns: 0,
            maturityValue: Math.round(totalInvested),
        };
    }

    const i = r / (12 * 100);
    const maturityValue = P * ((Math.pow(1 + i, n) - 1) / i) * (1 + i);
    const estimatedReturns = Math.max(0, maturityValue - totalInvested);

    return {
        totalInvested: Math.round(totalInvested),
        estimatedReturns: Math.round(estimatedReturns),
        maturityValue: Math.round(maturityValue),
    };
}

/**
 * Generate yearly progression milestones for charts or tables
 *
 * @param {Object} params
 * @param {number} params.investmentAmount
 * @param {number} params.annualRate
 * @param {number} params.years
 * @param {boolean} [params.isLumpsum=false]
 * @returns {Array<Object>} Array of { year, invested, returns, total }
 */
export function calculateYearlyBreakdown({ investmentAmount, annualRate, years, isLumpsum = false }) {
    const P = parseFloat(investmentAmount);
    const r = parseFloat(annualRate);
    const totalYears = Math.min(Math.max(1, Math.round(parseFloat(years) || 0)), 50);

    if (isNaN(P) || P <= 0 || isNaN(r) || r < 0 || totalYears <= 0) {
        return [];
    }

    const milestones = [];

    for (let yr = 1; yr <= totalYears; yr++) {
        const res = calculateSipResult({
            investmentAmount: P,
            annualRate: r,
            years: yr,
            isLumpsum,
        });

        milestones.push({
            year: yr,
            invested: res.totalInvested,
            returns: res.estimatedReturns,
            total: res.maturityValue,
        });
    }

    return milestones;
}

/**
 * Format currency with Indian/Standard locale
 * @param {number} value
 * @param {string} [currencySymbol='₹']
 * @returns {string}
 */
export function formatCurrency(value, currencySymbol = "₹") {
    if (value == null || isNaN(value)) return `${currencySymbol} 0`;
    const formatted = Math.round(value).toLocaleString("en-IN");
    return `${currencySymbol} ${formatted}`;
}

/**
 * Format compact representation e.g. 23.4 L or 1.2 Cr
 * @param {number} value
 * @returns {string}
 */
export function formatCompactCurrency(value) {
    if (value == null || isNaN(value)) return "₹0";
    if (value >= 10000000) {
        return `₹${(value / 10000000).toFixed(2)} Cr`;
    }
    if (value >= 100000) {
        return `₹${(value / 100000).toFixed(2)} L`;
    }
    if (value >= 1000) {
        return `₹${(value / 1000).toFixed(1)} K`;
    }
    return `₹${Math.round(value)}`;
}
