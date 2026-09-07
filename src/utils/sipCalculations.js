/**
 * SIP & Lumpsum financial calculation utilities
 */

/**
 * Calculate Monthly SIP Future Value with optional annual Step-Up %
 *
 * Standard Formula (when stepUp = 0):
 *   M = P * (( (1 + i)^n - 1 ) / i) * (1 + i)
 * where:
 *   P = Initial monthly investment
 *   i = Periodic monthly rate (annualRate / 12 / 100)
 *   n = Total number of months (years * 12)
 *
 * When stepUp > 0:
 *   In Year k (1 <= k <= years), monthly investment is P_k = P * (1 + stepUp/100)^(k - 1).
 *   Corpus compounds month-by-month / year-by-year with annuity due.
 *
 * @param {Object} params
 * @param {number} params.investmentAmount - Monthly investment (or lumpsum)
 * @param {number} params.annualRate - Expected annual return rate in %
 * @param {number} params.years - Investment duration in years
 * @param {number} [params.stepUpPercent=0] - Annual step-up percentage (e.g. 10 for 10% per year)
 * @param {boolean} [params.isLumpsum=false] - If true, calculates one-time lumpsum instead of monthly SIP
 * @returns {Object} { totalInvested, estimatedReturns, maturityValue, finalMonthlyInvestment }
 */
export function calculateSipResult({
    investmentAmount,
    annualRate,
    years,
    stepUpPercent = 0,
    isLumpsum = false,
}) {
    const P = parseFloat(investmentAmount);
    const r = parseFloat(annualRate);
    const y = parseFloat(years);
    const stepUp = Math.max(0, parseFloat(stepUpPercent) || 0);

    if (isNaN(P) || P <= 0 || isNaN(r) || r < 0 || isNaN(y) || y <= 0) {
        return {
            totalInvested: 0,
            estimatedReturns: 0,
            maturityValue: 0,
            finalMonthlyInvestment: 0,
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
            finalMonthlyInvestment: P,
        };
    }

    const totalYears = Math.min(Math.max(1, Math.round(y)), 50);
    const i = r === 0 ? 0 : r / (12 * 100);

    // If no step-up, use the standard closed-form formula
    if (stepUp === 0) {
        const n = totalYears * 12;
        const totalInvested = P * n;

        if (r === 0) {
            return {
                totalInvested: Math.round(totalInvested),
                estimatedReturns: 0,
                maturityValue: Math.round(totalInvested),
                finalMonthlyInvestment: Math.round(P),
            };
        }

        const maturityValue = P * ((Math.pow(1 + i, n) - 1) / i) * (1 + i);
        const estimatedReturns = Math.max(0, maturityValue - totalInvested);

        return {
            totalInvested: Math.round(totalInvested),
            estimatedReturns: Math.round(estimatedReturns),
            maturityValue: Math.round(maturityValue),
            finalMonthlyInvestment: Math.round(P),
        };
    }

    // Step-up annual compounding progression
    let currentCorpus = 0;
    let totalInvested = 0;
    let monthlyP = P;

    const yearlyCompMultiplier = Math.pow(1 + i, 12);
    const monthlyAnnuityFactor = r === 0 ? 12 : (((Math.pow(1 + i, 12) - 1) / i) * (1 + i));

    for (let yr = 1; yr <= totalYears; yr++) {
        totalInvested += monthlyP * 12;

        if (r === 0) {
            currentCorpus += monthlyP * 12;
        } else {
            currentCorpus = currentCorpus * yearlyCompMultiplier + monthlyP * monthlyAnnuityFactor;
        }

        if (yr < totalYears) {
            monthlyP = monthlyP * (1 + stepUp / 100);
        }
    }

    const estimatedReturns = Math.max(0, currentCorpus - totalInvested);

    return {
        totalInvested: Math.round(totalInvested),
        estimatedReturns: Math.round(estimatedReturns),
        maturityValue: Math.round(currentCorpus),
        finalMonthlyInvestment: Math.round(monthlyP),
    };
}

/**
 * Generate yearly progression milestones for charts or tables with optional Step-Up
 *
 * @param {Object} params
 * @param {number} params.investmentAmount
 * @param {number} params.annualRate
 * @param {number} params.years
 * @param {number} [params.stepUpPercent=0]
 * @param {boolean} [params.isLumpsum=false]
 * @returns {Array<Object>} Array of { year, monthlyInvestment, invested, returns, total }
 */
export function calculateYearlyBreakdown({
    investmentAmount,
    annualRate,
    years,
    stepUpPercent = 0,
    isLumpsum = false,
}) {
    const P = parseFloat(investmentAmount);
    const r = parseFloat(annualRate);
    const totalYears = Math.min(Math.max(1, Math.round(parseFloat(years) || 0)), 50);
    const stepUp = Math.max(0, parseFloat(stepUpPercent) || 0);

    if (isNaN(P) || P <= 0 || isNaN(r) || r < 0 || totalYears <= 0) {
        return [];
    }

    if (isLumpsum) {
        const milestones = [];
        for (let yr = 1; yr <= totalYears; yr++) {
            const res = calculateSipResult({
                investmentAmount: P,
                annualRate: r,
                years: yr,
                stepUpPercent: 0,
                isLumpsum: true,
            });
            milestones.push({
                year: yr,
                monthlyInvestment: P,
                invested: res.totalInvested,
                returns: res.estimatedReturns,
                total: res.maturityValue,
            });
        }
        return milestones;
    }

    const milestones = [];
    const i = r === 0 ? 0 : r / (12 * 100);
    const yearlyCompMultiplier = Math.pow(1 + i, 12);
    const monthlyAnnuityFactor = r === 0 ? 12 : (((Math.pow(1 + i, 12) - 1) / i) * (1 + i));

    let currentCorpus = 0;
    let totalInvested = 0;
    let monthlyP = P;

    for (let yr = 1; yr <= totalYears; yr++) {
        totalInvested += monthlyP * 12;

        if (r === 0) {
            currentCorpus += monthlyP * 12;
        } else {
            currentCorpus = currentCorpus * yearlyCompMultiplier + monthlyP * monthlyAnnuityFactor;
        }

        milestones.push({
            year: yr,
            monthlyInvestment: Math.round(monthlyP),
            invested: Math.round(totalInvested),
            returns: Math.round(Math.max(0, currentCorpus - totalInvested)),
            total: Math.round(currentCorpus),
        });

        if (stepUp > 0) {
            monthlyP = monthlyP * (1 + stepUp / 100);
        }
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
 * with optional Step-Up during the contribution phase.
 *
 * @param {Object} params
 * @param {number} params.investmentAmount - Monthly SIP amount
 * @param {number} params.annualRate - Expected annual return rate in %
 * @param {number} params.sipYears - Duration of monthly SIP contributions in years
 * @param {number} params.totalYears - Total investment horizon in years (must be >= sipYears)
 * @param {number} [params.stepUpPercent=0] - Annual step-up percentage during contribution phase
 * @returns {Object} { totalInvested, estimatedReturns, maturityValue, sipMaturityValue, holdingGain, holdingYears, finalMonthlyInvestment }
 */
export function calculateSipAndHoldResult({
    investmentAmount,
    annualRate,
    sipYears,
    totalYears,
    stepUpPercent = 0,
}) {
    const P = parseFloat(investmentAmount);
    const r = parseFloat(annualRate);
    const sy = parseFloat(sipYears);
    let ty = parseFloat(totalYears);
    const stepUp = Math.max(0, parseFloat(stepUpPercent) || 0);

    if (isNaN(P) || P <= 0 || isNaN(r) || r < 0 || isNaN(sy) || sy <= 0) {
        return {
            totalInvested: 0,
            estimatedReturns: 0,
            maturityValue: 0,
            sipMaturityValue: 0,
            holdingGain: 0,
            holdingYears: 0,
            finalMonthlyInvestment: 0,
        };
    }

    if (isNaN(ty) || ty < sy) {
        ty = sy;
    }

    const holdingYears = Math.max(0, ty - sy);
    const nHold = Math.round(holdingYears * 12);
    const i = r === 0 ? 0 : r / (12 * 100);

    // Calculate active SIP phase result
    const sipRes = calculateSipResult({
        investmentAmount: P,
        annualRate: r,
        years: sy,
        stepUpPercent: stepUp,
        isLumpsum: false,
    });

    const totalInvested = sipRes.totalInvested;
    const sipMaturityValue = sipRes.maturityValue;

    if (r === 0 || holdingYears === 0) {
        return {
            totalInvested: Math.round(totalInvested),
            estimatedReturns: Math.round(sipRes.estimatedReturns),
            maturityValue: Math.round(sipMaturityValue),
            sipMaturityValue: Math.round(sipMaturityValue),
            holdingGain: 0,
            holdingYears,
            finalMonthlyInvestment: sipRes.finalMonthlyInvestment,
        };
    }

    // Value after holding period without further contributions
    const maturityValue = sipMaturityValue * Math.pow(1 + i, nHold);
    const holdingGain = Math.max(0, maturityValue - sipMaturityValue);
    const estimatedReturns = Math.max(0, maturityValue - totalInvested);

    return {
        totalInvested: Math.round(totalInvested),
        estimatedReturns: Math.round(estimatedReturns),
        maturityValue: Math.round(maturityValue),
        sipMaturityValue: Math.round(sipMaturityValue),
        holdingGain: Math.round(holdingGain),
        holdingYears,
        finalMonthlyInvestment: sipRes.finalMonthlyInvestment,
    };
}

/**
 * Generate yearly progression milestones for SIP & Hold with optional Step-Up
 *
 * @param {Object} params
 * @param {number} params.investmentAmount
 * @param {number} params.annualRate
 * @param {number} params.sipYears
 * @param {number} params.totalYears
 * @param {number} [params.stepUpPercent=0]
 * @returns {Array<Object>} Array of { year, monthlyInvestment, invested, returns, total, phase, phaseLabel }
 */
export function calculateSipAndHoldYearlyBreakdown({
    investmentAmount,
    annualRate,
    sipYears,
    totalYears,
    stepUpPercent = 0,
}) {
    const P = parseFloat(investmentAmount);
    const r = parseFloat(annualRate);
    const sy = Math.max(1, Math.round(parseFloat(sipYears) || 0));
    let ty = Math.min(Math.max(sy, Math.round(parseFloat(totalYears) || 0)), 50);
    const stepUp = Math.max(0, parseFloat(stepUpPercent) || 0);

    if (isNaN(P) || P <= 0 || isNaN(r) || r < 0 || sy <= 0) {
        return [];
    }

    const milestones = [];
    const i = r === 0 ? 0 : r / (12 * 100);
    const yearlyCompMultiplier = Math.pow(1 + i, 12);
    const monthlyAnnuityFactor = r === 0 ? 12 : (((Math.pow(1 + i, 12) - 1) / i) * (1 + i));

    let currentCorpus = 0;
    let totalInvested = 0;
    let monthlyP = P;

    for (let yr = 1; yr <= ty; yr++) {
        if (yr <= sy) {
            // Active SIP phase with potential step-up
            totalInvested += monthlyP * 12;

            if (r === 0) {
                currentCorpus += monthlyP * 12;
            } else {
                currentCorpus = currentCorpus * yearlyCompMultiplier + monthlyP * monthlyAnnuityFactor;
            }

            milestones.push({
                year: yr,
                monthlyInvestment: Math.round(monthlyP),
                invested: Math.round(totalInvested),
                returns: Math.round(Math.max(0, currentCorpus - totalInvested)),
                total: Math.round(currentCorpus),
                phase: "sip",
                phaseLabel: "Active SIP",
            });

            if (stepUp > 0 && yr < sy) {
                monthlyP = monthlyP * (1 + stepUp / 100);
            }
        } else {
            // Holding / compounding phase (SIP stopped, corpus growing)
            if (r !== 0) {
                currentCorpus = currentCorpus * yearlyCompMultiplier;
            }

            milestones.push({
                year: yr,
                monthlyInvestment: 0,
                invested: Math.round(totalInvested),
                returns: Math.round(Math.max(0, currentCorpus - totalInvested)),
                total: Math.round(currentCorpus),
                phase: "holding",
                phaseLabel: "Growing",
            });
        }
    }

    return milestones;
}

/**
 * Calculate inflation-adjusted real purchasing power
 * Formula: Real Value = Nominal Value / (1 + inflationRate / 100)^years
 *
 * @param {number} nominalValue
 * @param {number} annualInflationRate - e.g. 6 for 6% p.a.
 * @param {number} years
 * @returns {number}
 */
export function calculateInflationAdjustedValue(nominalValue, annualInflationRate, years) {
    const V = parseFloat(nominalValue);
    const inf = parseFloat(annualInflationRate);
    const y = parseFloat(years);

    if (isNaN(V) || V <= 0 || isNaN(y) || y <= 0) {
        return Math.round(V || 0);
    }
    if (isNaN(inf) || inf <= 0) {
        return Math.round(V);
    }

    const realValue = V / Math.pow(1 + inf / 100, y);
    return Math.round(realValue);
}

