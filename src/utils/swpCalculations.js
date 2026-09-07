/**
 * Systematic Withdrawal Plan (SWP) financial calculation utilities
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
 * Calculate SWP simulation across total months
 *
 * @param {Object} params
 * @param {number} params.initialInvestment - Total initial corpus (₹)
 * @param {number} params.monthlyWithdrawal - Monthly withdrawal amount (₹)
 * @param {number} params.annualRate - Expected annual return rate (%)
 * @param {number} params.years - Investment horizon (years)
 * @param {number} [params.stepUpPercent=0] - Annual increase in monthly withdrawal (%)
 * @returns {Object}
 */
export function calculateSwpResult({
    initialInvestment,
    monthlyWithdrawal,
    annualRate,
    years,
    stepUpPercent = 0,
}) {
    const C0 = parseFloat(initialInvestment);
    const W0 = parseFloat(monthlyWithdrawal);
    const r = parseFloat(annualRate);
    const y = Math.min(Math.max(1, Math.round(parseFloat(years) || 0)), 50);
    const stepUp = Math.max(0, parseFloat(stepUpPercent) || 0);

    if (isNaN(C0) || C0 <= 0 || isNaN(W0) || W0 <= 0 || isNaN(r) || r < 0 || y <= 0) {
        return {
            isValid: false,
            totalInvested: 0,
            totalWithdrawn: 0,
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
    const i = r === 0 ? 0 : r / (12 * 100);

    let currentBalance = C0;
    let totalWithdrawn = 0;
    let totalInterestEarned = 0;
    let depletedAtMonths = null;
    let monthlyW = W0;

    for (let m = 1; m <= totalMonths; m++) {
        // Step-up monthly withdrawal at the start of each new year
        const currentYear = Math.floor((m - 1) / 12) + 1;
        if (stepUp > 0 && m > 1 && (m - 1) % 12 === 0) {
            monthlyW = W0 * Math.pow(1 + stepUp / 100, currentYear - 1);
        }

        if (currentBalance <= 0) {
            if (depletedAtMonths == null) {
                depletedAtMonths = m - 1;
            }
            continue;
        }

        let actualWithdrawal = monthlyW;
        if (currentBalance < monthlyW) {
            actualWithdrawal = currentBalance;
            currentBalance = 0;
            totalWithdrawn += actualWithdrawal;
            if (depletedAtMonths == null) {
                depletedAtMonths = m;
            }
        } else {
            currentBalance -= actualWithdrawal;
            totalWithdrawn += actualWithdrawal;

            // Remaining balance earns interest for the month
            if (r > 0) {
                const interestEarned = currentBalance * i;
                totalInterestEarned += interestEarned;
                currentBalance += interestEarned;
            }
        }
    }

    const isDepleted = depletedAtMonths != null;
    const finalBalance = Math.max(0, currentBalance);
    const totalGains = Math.max(0, totalWithdrawn + finalBalance - C0);
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
        totalWithdrawn: Math.round(totalWithdrawn),
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
 *
 * @param {Object} params
 * @param {number} params.initialInvestment
 * @param {number} params.monthlyWithdrawal
 * @param {number} params.annualRate
 * @param {number} params.years
 * @param {number} [params.stepUpPercent=0]
 * @returns {Array<Object>}
 */
export function calculateSwpYearlyBreakdown({
    initialInvestment,
    monthlyWithdrawal,
    annualRate,
    years,
    stepUpPercent = 0,
}) {
    const C0 = parseFloat(initialInvestment);
    const W0 = parseFloat(monthlyWithdrawal);
    const r = parseFloat(annualRate);
    const totalYears = Math.min(Math.max(1, Math.round(parseFloat(years) || 0)), 50);
    const stepUp = Math.max(0, parseFloat(stepUpPercent) || 0);

    if (isNaN(C0) || C0 <= 0 || isNaN(W0) || W0 <= 0 || isNaN(r) || r < 0 || totalYears <= 0) {
        return [];
    }

    const milestones = [];
    const i = r === 0 ? 0 : r / (12 * 100);

    let currentBalance = C0;
    let cumulativeWithdrawn = 0;
    let monthlyW = W0;

    for (let yr = 1; yr <= totalYears; yr++) {
        if (stepUp > 0 && yr > 1) {
            monthlyW = W0 * Math.pow(1 + stepUp / 100, yr - 1);
        }

        const openingBalance = currentBalance;
        let yearWithdrawn = 0;
        let yearInterest = 0;

        for (let m = 1; m <= 12; m++) {
            if (currentBalance <= 0) break;

            if (currentBalance < monthlyW) {
                yearWithdrawn += currentBalance;
                currentBalance = 0;
                break;
            } else {
                currentBalance -= monthlyW;
                yearWithdrawn += monthlyW;

                if (r > 0) {
                    const interest = currentBalance * i;
                    yearInterest += interest;
                    currentBalance += interest;
                }
            }
        }

        cumulativeWithdrawn += yearWithdrawn;

        milestones.push({
            year: yr,
            monthlyWithdrawal: Math.round(monthlyW),
            openingBalance: Math.round(openingBalance),
            withdrawn: Math.round(yearWithdrawn),
            returns: Math.round(yearInterest),
            closingBalance: Math.round(currentBalance),
            cumulativeWithdrawn: Math.round(cumulativeWithdrawn),
            isDepleted: currentBalance <= 0,
        });

        if (currentBalance <= 0) {
            break;
        }
    }

    return milestones;
}
