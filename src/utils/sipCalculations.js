/**
 * SIP & Lumpsum financial calculation utilities
 * Updated with LTCG Tax Deductions, Flexible Step-Up Frequencies, and Multi-Scenario Modeling
 */

function shouldStepUp(monthIndex, frequency) {
    if (monthIndex <= 1) return false;
    if (frequency === "monthly") return true;
    if (frequency === "half_yearly") return (monthIndex - 1) % 6 === 0;
    // default "annual"
    return (monthIndex - 1) % 12 === 0;
}

/**
 * Calculate LTCG tax based on estimated returns and exemption limit
 * Equity Mutual Funds in India: 12.5% LTCG tax on gains above ₹1,25,000 threshold (Budget 2024+)
 */
export function calculateLtcgTax(estimatedReturns, deductLtcgTax = false, ltcgTaxRate = 12.5, ltcgExemption = 125000) {
    if (!deductLtcgTax) return 0;
    const gains = Math.max(0, parseFloat(estimatedReturns) || 0);
    const exemption = Math.max(0, parseFloat(ltcgExemption) || 0);
    const rate = Math.max(0, parseFloat(ltcgTaxRate) || 0);
    const taxableGains = Math.max(0, gains - exemption);
    return Math.round(taxableGains * (rate / 100));
}

/**
 * Calculate Monthly SIP Future Value with optional Step-Up % and frequency
 *
 * @param {Object} params
 * @param {number} params.investmentAmount - Monthly investment (or lumpsum)
 * @param {number} params.annualRate - Expected annual return rate in %
 * @param {number} params.years - Investment duration in years
 * @param {number} [params.stepUpPercent=0] - Step-up percentage
 * @param {string} [params.stepUpFrequency="annual"] - Step-up frequency ("annual" | "half_yearly" | "monthly")
 * @param {boolean} [params.isLumpsum=false] - If true, calculates one-time lumpsum instead of monthly SIP
 * @param {boolean} [params.deductLtcgTax=false] - If true, computes equity LTCG tax deduction
 * @param {number} [params.ltcgTaxRate=12.5] - LTCG tax rate in %
 * @param {number} [params.ltcgExemption=125000] - LTCG tax exemption threshold in ₹
 * @returns {Object} { totalInvested, estimatedReturns, maturityValue, finalMonthlyInvestment, ltcgTaxAmount, netMaturityValue, netEstimatedReturns }
 */
export function calculateSipResult({
    investmentAmount,
    annualRate,
    years,
    stepUpPercent = 0,
    stepUpFrequency = "annual",
    isLumpsum = false,
    deductLtcgTax = false,
    ltcgTaxRate = 12.5,
    ltcgExemption = 125000,
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
            ltcgTaxAmount: 0,
            netMaturityValue: 0,
            netEstimatedReturns: 0,
        };
    }

    if (isLumpsum) {
        const totalInvested = P;
        // Lumpsum compound interest: A = P * (1 + r/100)^y
        const maturityValue = P * Math.pow(1 + r / 100, y);
        const estimatedReturns = Math.max(0, maturityValue - totalInvested);
        const ltcgTaxAmount = calculateLtcgTax(estimatedReturns, deductLtcgTax, ltcgTaxRate, ltcgExemption);
        const netMaturityValue = Math.max(totalInvested, maturityValue - ltcgTaxAmount);
        const netEstimatedReturns = Math.max(0, netMaturityValue - totalInvested);

        return {
            totalInvested: Math.round(totalInvested),
            estimatedReturns: Math.round(estimatedReturns),
            maturityValue: Math.round(maturityValue),
            finalMonthlyInvestment: P,
            ltcgTaxAmount: Math.round(ltcgTaxAmount),
            netMaturityValue: Math.round(netMaturityValue),
            netEstimatedReturns: Math.round(netEstimatedReturns),
        };
    }

    const totalYears = Math.min(Math.max(1, Math.round(y)), 50);
    const totalMonths = totalYears * 12;
    const i = r === 0 ? 0 : r / (12 * 100);

    let currentCorpus = 0;
    let totalInvested = 0;
    let monthlyP = P;

    for (let m = 1; m <= totalMonths; m++) {
        if (stepUp > 0 && shouldStepUp(m, stepUpFrequency)) {
            monthlyP = monthlyP * (1 + stepUp / 100);
        }

        totalInvested += monthlyP;
        if (r === 0) {
            currentCorpus += monthlyP;
        } else {
            // Annuity due (investment made at start of month)
            currentCorpus = (currentCorpus + monthlyP) * (1 + i);
        }
    }

    const estimatedReturns = Math.max(0, currentCorpus - totalInvested);
    const ltcgTaxAmount = calculateLtcgTax(estimatedReturns, deductLtcgTax, ltcgTaxRate, ltcgExemption);
    const netMaturityValue = Math.max(totalInvested, currentCorpus - ltcgTaxAmount);
    const netEstimatedReturns = Math.max(0, netMaturityValue - totalInvested);

    return {
        totalInvested: Math.round(totalInvested),
        estimatedReturns: Math.round(estimatedReturns),
        maturityValue: Math.round(currentCorpus),
        finalMonthlyInvestment: Math.round(monthlyP),
        ltcgTaxAmount: Math.round(ltcgTaxAmount),
        netMaturityValue: Math.round(netMaturityValue),
        netEstimatedReturns: Math.round(netEstimatedReturns),
    };
}

/**
 * Generate yearly progression milestones for charts or tables with optional Step-Up
 */
export function calculateYearlyBreakdown({
    investmentAmount,
    annualRate,
    years,
    stepUpPercent = 0,
    stepUpFrequency = "annual",
    isLumpsum = false,
    deductLtcgTax = false,
    ltcgTaxRate = 12.5,
    ltcgExemption = 125000,
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
                deductLtcgTax,
                ltcgTaxRate,
                ltcgExemption,
            });
            milestones.push({
                year: yr,
                monthlyInvestment: P,
                invested: res.totalInvested,
                returns: res.estimatedReturns,
                total: res.maturityValue,
                ltcgTax: res.ltcgTaxAmount,
                netTotal: res.netMaturityValue,
            });
        }
        return milestones;
    }

    const milestones = [];
    const totalMonths = totalYears * 12;
    const i = r === 0 ? 0 : r / (12 * 100);

    let currentCorpus = 0;
    let totalInvested = 0;
    let monthlyP = P;

    for (let m = 1; m <= totalMonths; m++) {
        if (stepUp > 0 && shouldStepUp(m, stepUpFrequency)) {
            monthlyP = monthlyP * (1 + stepUp / 100);
        }

        totalInvested += monthlyP;
        if (r === 0) {
            currentCorpus += monthlyP;
        } else {
            currentCorpus = (currentCorpus + monthlyP) * (1 + i);
        }

        if (m % 12 === 0) {
            const yr = m / 12;
            const grossReturns = Math.max(0, currentCorpus - totalInvested);
            const ltcgTax = calculateLtcgTax(grossReturns, deductLtcgTax, ltcgTaxRate, ltcgExemption);
            const netTotal = Math.max(totalInvested, currentCorpus - ltcgTax);

            milestones.push({
                year: yr,
                monthlyInvestment: Math.round(monthlyP),
                invested: Math.round(totalInvested),
                returns: Math.round(grossReturns),
                total: Math.round(currentCorpus),
                ltcgTax: Math.round(ltcgTax),
                netTotal: Math.round(netTotal),
            });
        }
    }

    return milestones;
}

/**
 * Calculate SIP with Stop & Hold (SIP for X years, then stop contributing and let the accumulated corpus grow until Y years)
 */
export function calculateSipAndHoldResult({
    investmentAmount,
    annualRate,
    sipYears,
    totalYears,
    stepUpPercent = 0,
    stepUpFrequency = "annual",
    deductLtcgTax = false,
    ltcgTaxRate = 12.5,
    ltcgExemption = 125000,
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
            ltcgTaxAmount: 0,
            netMaturityValue: 0,
            netEstimatedReturns: 0,
        };
    }

    if (isNaN(ty) || ty < sy) {
        ty = sy;
    }

    const holdingYears = Math.max(0, ty - sy);
    const sipMonths = Math.round(sy * 12);
    const totalMonths = Math.round(ty * 12);
    const i = r === 0 ? 0 : r / (12 * 100);

    let currentCorpus = 0;
    let totalInvested = 0;
    let monthlyP = P;
    let sipMaturityValue = 0;

    for (let m = 1; m <= totalMonths; m++) {
        if (m <= sipMonths) {
            // Active SIP phase
            if (stepUp > 0 && shouldStepUp(m, stepUpFrequency)) {
                monthlyP = monthlyP * (1 + stepUp / 100);
            }
            totalInvested += monthlyP;
            if (r === 0) {
                currentCorpus += monthlyP;
            } else {
                currentCorpus = (currentCorpus + monthlyP) * (1 + i);
            }
            if (m === sipMonths) {
                sipMaturityValue = currentCorpus;
            }
        } else {
            // Holding / compounding phase without new deposits
            if (r !== 0) {
                currentCorpus = currentCorpus * (1 + i);
            }
        }
    }

    const holdingGain = Math.max(0, currentCorpus - sipMaturityValue);
    const estimatedReturns = Math.max(0, currentCorpus - totalInvested);
    const ltcgTaxAmount = calculateLtcgTax(estimatedReturns, deductLtcgTax, ltcgTaxRate, ltcgExemption);
    const netMaturityValue = Math.max(totalInvested, currentCorpus - ltcgTaxAmount);
    const netEstimatedReturns = Math.max(0, netMaturityValue - totalInvested);

    return {
        totalInvested: Math.round(totalInvested),
        estimatedReturns: Math.round(estimatedReturns),
        maturityValue: Math.round(currentCorpus),
        sipMaturityValue: Math.round(sipMaturityValue),
        holdingGain: Math.round(holdingGain),
        holdingYears,
        finalMonthlyInvestment: Math.round(monthlyP),
        ltcgTaxAmount: Math.round(ltcgTaxAmount),
        netMaturityValue: Math.round(netMaturityValue),
        netEstimatedReturns: Math.round(netEstimatedReturns),
    };
}

/**
 * Generate yearly progression milestones for SIP & Hold with optional Step-Up
 */
export function calculateSipAndHoldYearlyBreakdown({
    investmentAmount,
    annualRate,
    sipYears,
    totalYears,
    stepUpPercent = 0,
    stepUpFrequency = "annual",
    deductLtcgTax = false,
    ltcgTaxRate = 12.5,
    ltcgExemption = 125000,
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
    const sipMonths = sy * 12;
    const totalMonths = ty * 12;
    const i = r === 0 ? 0 : r / (12 * 100);

    let currentCorpus = 0;
    let totalInvested = 0;
    let monthlyP = P;

    for (let m = 1; m <= totalMonths; m++) {
        if (m <= sipMonths) {
            if (stepUp > 0 && shouldStepUp(m, stepUpFrequency)) {
                monthlyP = monthlyP * (1 + stepUp / 100);
            }
            totalInvested += monthlyP;
            if (r === 0) {
                currentCorpus += monthlyP;
            } else {
                currentCorpus = (currentCorpus + monthlyP) * (1 + i);
            }
        } else {
            if (r !== 0) {
                currentCorpus = currentCorpus * (1 + i);
            }
        }

        if (m % 12 === 0) {
            const yr = m / 12;
            const isSipPhase = m <= sipMonths;
            const grossReturns = Math.max(0, currentCorpus - totalInvested);
            const ltcgTax = calculateLtcgTax(grossReturns, deductLtcgTax, ltcgTaxRate, ltcgExemption);
            const netTotal = Math.max(totalInvested, currentCorpus - ltcgTax);

            milestones.push({
                year: yr,
                monthlyInvestment: isSipPhase ? Math.round(monthlyP) : 0,
                invested: Math.round(totalInvested),
                returns: Math.round(grossReturns),
                total: Math.round(currentCorpus),
                ltcgTax: Math.round(ltcgTax),
                netTotal: Math.round(netTotal),
                phase: isSipPhase ? "sip" : "holding",
                phaseLabel: isSipPhase ? "Active SIP" : "Growing",
            });
        }
    }

    return milestones;
}

/**
 * Calculate SIP results for Bear, Base, and Bull market return scenarios
 */
export function calculateSipMultiScenarios(params, bearRate = 8, baseRate = 12, bullRate = 15) {
    const userRate = parseFloat(params.annualRate) || 12;
    const bRate = parseFloat(bearRate) || 8;
    const uRate = parseFloat(bullRate) || 15;

    const isSipHold = params.calcMode === "sip_hold";
    const calcFn = isSipHold ? calculateSipAndHoldResult : calculateSipResult;

    const bear = calcFn({ ...params, annualRate: bRate });
    const base = calcFn({ ...params, annualRate: userRate });
    const bull = calcFn({ ...params, annualRate: uRate });

    return {
        bear: { ...bear, rate: bRate },
        base: { ...base, rate: userRate },
        bull: { ...bull, rate: uRate },
    };
}

/**
 * Calculate inflation-adjusted real purchasing power
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

/**
 * Format currency with Indian/Standard locale
 */
export function formatCurrency(value, currencySymbol = "₹") {
    if (value == null || isNaN(value)) return `${currencySymbol} 0`;
    const formatted = Math.round(value).toLocaleString("en-IN");
    return `${currencySymbol} ${formatted}`;
}

/**
 * Format compact representation e.g. 23.4 L or 1.2 Cr
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
