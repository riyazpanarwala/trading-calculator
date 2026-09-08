/**
 * Systematic Withdrawal Plan (SWP) financial calculation utilities
 * Enhanced with Redemption Tax deductions (LTCG/STCG), Inflation-adjusted real purchasing power,
 * and Sequence of Returns Risk (SORR) market crash simulation.
 */

/**
 * Format currency with Indian/Standard locale
 * @param {number} value
 * @param {string} [currencySymbol='₹']
 * @returns {string}
 */
export function formatCurrency(value, currencySymbol = "₹") {
    if (value == null || isNaN(value)) return `${currencySymbol} 0`;
    const rounded = Math.round(value);
    const formatted = rounded.toLocaleString("en-IN");
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
 * Get annual return rate for a specific year based on SORR scenario
 */
export function getYearlyRate(yr, baseRate = 10, scenario = "steady") {
    const r = parseFloat(baseRate) || 10;
    if (scenario === "early_crash") {
        if (yr === 1) return -15;
        if (yr === 2) return -10;
        if (yr === 3) return 5;
        return r + 4; // Recovery years
    }
    if (scenario === "early_bull") {
        if (yr === 1) return 22;
        if (yr === 2) return 18;
        return Math.max(0, r - 2);
    }
    return r;
}

/**
 * Calculate SWP simulation across total months with Tax, Inflation & SORR options
 */
export function calculateSwpResult({
    initialInvestment,
    monthlyWithdrawal,
    annualRate,
    years,
    stepUpPercent = 0,
    deductSwpTax = false,
    swpTaxRate = 12.5,
    swpTaxExemption = 125000,
    swpTaxType = "equity_ltcg", // "equity_ltcg" | "debt_slab"
    sorrScenario = "steady", // "steady" | "early_crash" | "early_bull"
}) {
    const C0 = parseFloat(initialInvestment);
    const W0 = parseFloat(monthlyWithdrawal);
    const r = parseFloat(annualRate);
    const y = Math.min(Math.max(1, Math.round(parseFloat(years) || 0)), 50);
    const stepUp = Math.max(0, parseFloat(stepUpPercent) || 0);

    const taxRate = Math.max(0, parseFloat(swpTaxRate) || 0);
    const ltcgExemption = Math.max(0, parseFloat(swpTaxExemption) || 0);

    if (isNaN(C0) || C0 <= 0 || isNaN(W0) || W0 <= 0 || isNaN(r) || r < 0 || y <= 0) {
        return {
            isValid: false,
            totalInvested: 0,
            totalWithdrawn: 0,
            totalNetWithdrawn: 0,
            totalTaxPaid: 0,
            finalBalance: 0,
            totalGains: 0,
            isDepleted: false,
            depletedAtMonths: null,
            depletedYears: null,
            depletedExtraMonths: null,
            isEvergreen: false,
            initialAnnualWithdrawalRate: 0,
            finalMonthlyWithdrawal: 0,
        };
    }

    const totalMonths = y * 12;

    let currentBalance = C0;
    let costBasis = C0;
    let totalGrossWithdrawn = 0;
    let totalNetWithdrawn = 0;
    let totalTaxPaid = 0;
    let totalInterestEarned = 0;
    let depletedAtMonths = null;
    let monthlyW = W0;
    let yearlyGainsInCurYr = 0;

    for (let m = 1; m <= totalMonths; m++) {
        const currentYear = Math.floor((m - 1) / 12) + 1;

        if (m > 1 && (m - 1) % 12 === 0) {
            // Reset yearly gain tracking for tax exemption
            yearlyGainsInCurYr = 0;
            if (stepUp > 0) {
                monthlyW = W0 * Math.pow(1 + stepUp / 100, currentYear - 1);
            }
        }

        if (currentBalance <= 0) {
            if (depletedAtMonths == null) {
                depletedAtMonths = m - 1;
            }
            continue;
        }

        const grossW = Math.min(currentBalance, monthlyW);

        // Tax calculation on redemption gains
        const gainInBalance = Math.max(0, currentBalance - costBasis);
        const gainRatio = currentBalance > 0 ? gainInBalance / currentBalance : 0;
        const taxableGainPortion = grossW * gainRatio;
        const principalPortion = grossW - taxableGainPortion;
        costBasis = Math.max(0, costBasis - principalPortion);

        let monthTax = 0;
        if (deductSwpTax && taxableGainPortion > 0) {
            if (swpTaxType === "equity_ltcg") {
                const availableExemption = Math.max(0, ltcgExemption - yearlyGainsInCurYr);
                const taxableAfterExemption = Math.max(0, taxableGainPortion - availableExemption);
                yearlyGainsInCurYr += taxableGainPortion;
                monthTax = taxableAfterExemption * (taxRate / 100);
            } else {
                monthTax = taxableGainPortion * (taxRate / 100);
            }
        }

        const netInHand = Math.max(0, grossW - monthTax);
        totalGrossWithdrawn += grossW;
        totalNetWithdrawn += netInHand;
        totalTaxPaid += monthTax;
        currentBalance -= grossW;

        if (currentBalance <= 0 && depletedAtMonths == null) {
            depletedAtMonths = m;
        }

        // Interest compounding for remaining balance
        const yrRate = getYearlyRate(currentYear, r, sorrScenario);
        const monthlyRate = yrRate / (12 * 100);

        if (currentBalance > 0 && yrRate !== 0) {
            const interestEarned = currentBalance * monthlyRate;
            totalInterestEarned += interestEarned;
            currentBalance += interestEarned;
        }
    }

    const isDepleted = depletedAtMonths != null;
    const finalBalance = Math.max(0, currentBalance);
    const totalGains = Math.max(0, totalGrossWithdrawn + finalBalance - C0);
    const isEvergreen = !isDepleted && finalBalance >= C0;
    const initialAnnualWithdrawalRate = C0 > 0 ? ((W0 * 12) / C0) * 100 : 0;

    let depletedYears = null;
    let depletedExtraMonths = null;
    if (isDepleted && depletedAtMonths != null) {
        depletedYears = Math.floor(depletedAtMonths / 12);
        depletedExtraMonths = depletedAtMonths % 12;
    }

    return {
        isValid: true,
        totalInvested: Math.round(C0),
        totalWithdrawn: Math.round(totalGrossWithdrawn),
        totalNetWithdrawn: Math.round(totalNetWithdrawn),
        totalTaxPaid: Math.round(totalTaxPaid),
        finalBalance: Math.round(finalBalance),
        totalGains: Math.round(totalGains),
        isDepleted,
        depletedAtMonths,
        depletedYears,
        depletedExtraMonths,
        isEvergreen,
        initialAnnualWithdrawalRate: Math.round(initialAnnualWithdrawalRate * 100) / 100,
        finalMonthlyWithdrawal: Math.round(monthlyW),
    };
}

/**
 * Generate year-by-year financial ledger for SWP
 */
export function calculateSwpYearlyBreakdown({
    initialInvestment,
    monthlyWithdrawal,
    annualRate,
    years,
    stepUpPercent = 0,
    deductSwpTax = false,
    swpTaxRate = 12.5,
    swpTaxExemption = 125000,
    swpTaxType = "equity_ltcg",
    sorrScenario = "steady",
}) {
    const C0 = parseFloat(initialInvestment);
    const W0 = parseFloat(monthlyWithdrawal);
    const r = parseFloat(annualRate);
    const totalYears = Math.min(Math.max(1, Math.round(parseFloat(years) || 0)), 50);
    const stepUp = Math.max(0, parseFloat(stepUpPercent) || 0);

    const taxRate = Math.max(0, parseFloat(swpTaxRate) || 0);
    const ltcgExemption = Math.max(0, parseFloat(swpTaxExemption) || 0);

    if (isNaN(C0) || C0 <= 0 || isNaN(W0) || W0 <= 0 || isNaN(r) || r < 0 || totalYears <= 0) {
        return [];
    }

    const milestones = [];
    let currentBalance = C0;
    let costBasis = C0;
    let cumulativeWithdrawn = 0;
    let cumulativeNetWithdrawn = 0;
    let cumulativeTaxPaid = 0;
    let monthlyW = W0;

    for (let yr = 1; yr <= totalYears; yr++) {
        if (stepUp > 0 && yr > 1) {
            monthlyW = W0 * Math.pow(1 + stepUp / 100, yr - 1);
        }

        const openingBalance = currentBalance;
        let yearGrossWithdrawn = 0;
        let yearNetWithdrawn = 0;
        let yearTaxPaid = 0;
        let yearInterest = 0;
        let yearlyGainsInCurYr = 0;

        const yrRate = getYearlyRate(yr, r, sorrScenario);
        const monthlyRate = yrRate / (12 * 100);

        for (let m = 1; m <= 12; m++) {
            if (currentBalance <= 0) break;

            const grossW = Math.min(currentBalance, monthlyW);
            const gainInBalance = Math.max(0, currentBalance - costBasis);
            const gainRatio = currentBalance > 0 ? gainInBalance / currentBalance : 0;
            const taxableGainPortion = grossW * gainRatio;
            const principalPortion = grossW - taxableGainPortion;
            costBasis = Math.max(0, costBasis - principalPortion);

            let monthTax = 0;
            if (deductSwpTax && taxableGainPortion > 0) {
                if (swpTaxType === "equity_ltcg") {
                    const availableExemption = Math.max(0, ltcgExemption - yearlyGainsInCurYr);
                    const taxableAfterExemption = Math.max(0, taxableGainPortion - availableExemption);
                    yearlyGainsInCurYr += taxableGainPortion;
                    monthTax = taxableAfterExemption * (taxRate / 100);
                } else {
                    monthTax = taxableGainPortion * (taxRate / 100);
                }
            }

            const netInHand = Math.max(0, grossW - monthTax);
            yearGrossWithdrawn += grossW;
            yearNetWithdrawn += netInHand;
            yearTaxPaid += monthTax;
            currentBalance -= grossW;

            if (currentBalance > 0 && yrRate !== 0) {
                const interest = currentBalance * monthlyRate;
                yearInterest += interest;
                currentBalance += interest;
            }
        }

        cumulativeWithdrawn += yearGrossWithdrawn;
        cumulativeNetWithdrawn += yearNetWithdrawn;
        cumulativeTaxPaid += yearTaxPaid;

        milestones.push({
            year: yr,
            monthlyWithdrawal: Math.round(monthlyW),
            openingBalance: Math.round(openingBalance),
            withdrawn: Math.round(yearGrossWithdrawn),
            netWithdrawn: Math.round(yearNetWithdrawn),
            taxPaid: Math.round(yearTaxPaid),
            returns: Math.round(yearInterest),
            closingBalance: Math.round(currentBalance),
            cumulativeWithdrawn: Math.round(cumulativeWithdrawn),
            cumulativeNetWithdrawn: Math.round(cumulativeNetWithdrawn),
            cumulativeTaxPaid: Math.round(cumulativeTaxPaid),
            yearReturnRate: yrRate,
            isDepleted: currentBalance <= 0,
        });

        if (currentBalance <= 0) {
            break;
        }
    }

    return milestones;
}

/**
 * Compare Steady, Early Crash (SORR Risk), and Early Bull SWP scenarios
 */
export function calculateSorrComparison(params) {
    const steady = calculateSwpResult({ ...params, sorrScenario: "steady" });
    const earlyCrash = calculateSwpResult({ ...params, sorrScenario: "early_crash" });
    const earlyBull = calculateSwpResult({ ...params, sorrScenario: "early_bull" });

    return { steady, earlyCrash, earlyBull };
}

/**
 * Calculate inflation-adjusted real purchasing power of remaining balance
 */
export function calculateInflationAdjustedValue(nominalValue, annualInflationRate, years) {
    const V = parseFloat(nominalValue);
    const inf = parseFloat(annualInflationRate);
    const y = parseFloat(years);

    if (isNaN(V) || V <= 0 || isNaN(y) || y <= 0) return Math.round(V || 0);
    if (isNaN(inf) || inf <= 0) return Math.round(V);

    const realValue = V / Math.pow(1 + inf / 100, y);
    return Math.round(realValue);
}

/**
 * Calculate required monthly withdrawal in future years to match today's purchasing power
 */
export function calculateRequiredFutureWithdrawal(initialMonthlyWithdrawal, annualInflationRate, years) {
    const W0 = parseFloat(initialMonthlyWithdrawal);
    const inf = parseFloat(annualInflationRate);
    const y = parseFloat(years);

    if (isNaN(W0) || W0 <= 0 || isNaN(y) || y <= 0 || isNaN(inf) || inf <= 0) return Math.round(W0 || 0);
    return Math.round(W0 * Math.pow(1 + inf / 100, y));
}
