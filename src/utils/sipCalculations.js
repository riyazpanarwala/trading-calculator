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

/**
 * Calculate SIP with Stop & Hold (SIP for X years, then stop contributing and let the accumulated corpus grow until Y years)
 *
 * @param {Object} params
 * @param {number} params.investmentAmount - Monthly SIP amount
 * @param {number} params.annualRate - Expected annual return rate in %
 * @param {number} params.sipYears - Duration of monthly SIP contributions in years
 * @param {number} params.totalYears - Total investment horizon in years (must be >= sipYears)
 * @returns {Object} { totalInvested, estimatedReturns, maturityValue, sipMaturityValue, holdingGain, holdingYears }
 */
export function calculateSipAndHoldResult({ investmentAmount, annualRate, sipYears, totalYears }) {
    const P = parseFloat(investmentAmount);
    const r = parseFloat(annualRate);
    const sy = parseFloat(sipYears);
    let ty = parseFloat(totalYears);

    if (isNaN(P) || P <= 0 || isNaN(r) || r < 0 || isNaN(sy) || sy <= 0) {
        return {
            totalInvested: 0,
            estimatedReturns: 0,
            maturityValue: 0,
            sipMaturityValue: 0,
            holdingGain: 0,
            holdingYears: 0,
        };
    }

    // Total years cannot be less than SIP years
    if (isNaN(ty) || ty < sy) {
        ty = sy;
    }

    const nSip = Math.round(sy * 12);
    const totalInvested = P * nSip;
    const holdingYears = Math.max(0, ty - sy);
    const nHold = Math.round(holdingYears * 12);

    if (r === 0) {
        return {
            totalInvested: Math.round(totalInvested),
            estimatedReturns: 0,
            maturityValue: Math.round(totalInvested),
            sipMaturityValue: Math.round(totalInvested),
            holdingGain: 0,
            holdingYears,
        };
    }

    const i = r / (12 * 100);

    // Value at the end of SIP contribution period
    const sipMaturityValue = P * ((Math.pow(1 + i, nSip) - 1) / i) * (1 + i);

    // Value after holding period without further contributions
    const maturityValue = nHold > 0 ? sipMaturityValue * Math.pow(1 + i, nHold) : sipMaturityValue;
    const holdingGain = Math.max(0, maturityValue - sipMaturityValue);
    const estimatedReturns = Math.max(0, maturityValue - totalInvested);

    return {
        totalInvested: Math.round(totalInvested),
        estimatedReturns: Math.round(estimatedReturns),
        maturityValue: Math.round(maturityValue),
        sipMaturityValue: Math.round(sipMaturityValue),
        holdingGain: Math.round(holdingGain),
        holdingYears,
    };
}

/**
 * Generate yearly progression milestones for SIP & Hold
 *
 * @param {Object} params
 * @param {number} params.investmentAmount
 * @param {number} params.annualRate
 * @param {number} params.sipYears
 * @param {number} params.totalYears
 * @returns {Array<Object>} Array of { year, invested, returns, total, phase, phaseLabel }
 */
export function calculateSipAndHoldYearlyBreakdown({ investmentAmount, annualRate, sipYears, totalYears }) {
    const P = parseFloat(investmentAmount);
    const r = parseFloat(annualRate);
    const sy = Math.max(1, Math.round(parseFloat(sipYears) || 0));
    let ty = Math.min(Math.max(sy, Math.round(parseFloat(totalYears) || 0)), 50);

    if (isNaN(P) || P <= 0 || isNaN(r) || r < 0 || sy <= 0) {
        return [];
    }

    const milestones = [];
    const i = r === 0 ? 0 : r / (12 * 100);
    const nSipMonths = sy * 12;

    // Calculate value at the end of active SIP
    let sipEndValue = 0;
    if (r === 0) {
        sipEndValue = P * nSipMonths;
    } else {
        sipEndValue = P * ((Math.pow(1 + i, nSipMonths) - 1) / i) * (1 + i);
    }
    const totalSipInvested = P * nSipMonths;

    for (let yr = 1; yr <= ty; yr++) {
        if (yr <= sy) {
            // Active SIP contribution phase
            const res = calculateSipResult({
                investmentAmount: P,
                annualRate: r,
                years: yr,
                isLumpsum: false,
            });

            milestones.push({
                year: yr,
                invested: res.totalInvested,
                returns: res.estimatedReturns,
                total: res.maturityValue,
                phase: "sip",
                phaseLabel: "Active SIP",
            });
        } else {
            // Holding / compounding phase (SIP stopped, corpus growing)
            const extraMonths = (yr - sy) * 12;
            const currentTotal = r === 0 ? sipEndValue : sipEndValue * Math.pow(1 + i, extraMonths);
            const currentReturns = Math.max(0, currentTotal - totalSipInvested);

            milestones.push({
                year: yr,
                invested: Math.round(totalSipInvested),
                returns: Math.round(currentReturns),
                total: Math.round(currentTotal),
                phase: "holding",
                phaseLabel: "Growing",
            });
        }
    }

    return milestones;
}

