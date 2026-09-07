/**
 * Goal-Based Wealth Planner (Reverse SIP / Reverse Lumpsum) Calculations
 *
 * Solves: "I need ₹X in Y years at Z% return. How much do I need to invest monthly or as lumpsum?"
 */

export const GOAL_PRESETS = [
    {
        id: "car",
        title: "🚗 New Car",
        targetAmount: 1500000,
        years: 4,
        annualRate: 10,
        desc: "Upgrade or buy vehicle in 4 years",
    },
    {
        id: "education",
        title: "🎓 Child Education",
        targetAmount: 3500000,
        years: 12,
        annualRate: 12,
        desc: "College / university funding in 12 years",
    },
    {
        id: "home",
        title: "🏡 Home Downpayment",
        targetAmount: 6000000,
        years: 7,
        annualRate: 12,
        desc: "House purchase downpayment in 7 years",
    },
    {
        id: "fire",
        title: "🏖️ FIRE Retirement",
        targetAmount: 30000000,
        years: 18,
        annualRate: 13,
        desc: "Financial independence / early retirement",
    },
    {
        id: "wedding",
        title: "💍 Wedding / Milestone",
        targetAmount: 2500000,
        years: 5,
        annualRate: 11,
        desc: "Family milestone celebration in 5 years",
    },
    {
        id: "custom",
        title: "🎯 Custom Target",
        targetAmount: 5000000,
        years: 10,
        annualRate: 12,
        desc: "Your personal financial target",
    },
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
        ? Number(absVal.toFixed(0)).toLocaleString("en-IN")
        : Number(absVal.toFixed(2)).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return `${prefix}${currencySymbol} ${formatted}`;
}

/**
 * Format compact numbers in Indian system (e.g. ₹50 L, ₹1.5 Cr)
 * @param {number} value
 * @param {string} [currencySymbol='₹']
 * @returns {string}
 */
export function formatCompactCurrency(value, currencySymbol = "₹") {
    if (value == null || isNaN(value)) return `${currencySymbol} 0`;
    const absVal = Math.abs(value);
    const prefix = value < 0 ? "−" : "";

    if (absVal >= 10000000) {
        return `${prefix}${currencySymbol} ${(absVal / 10000000).toFixed(2)} Cr`;
    }
    if (absVal >= 100000) {
        return `${prefix}${currencySymbol} ${(absVal / 100000).toFixed(2)} L`;
    }
    if (absVal >= 1000) {
        return `${prefix}${currencySymbol} ${(absVal / 1000).toFixed(1)} K`;
    }
    return `${prefix}${currencySymbol} ${absVal.toFixed(0)}`;
}

/**
 * Calculate comprehensive Goal-Based Wealth Plan
 *
 * @param {Object} params
 * @param {number|string} params.targetAmount - Desired goal corpus in today's money
 * @param {number|string} params.years - Horizon in years
 * @param {number|string} params.annualRate - Expected return (% p.a.)
 * @param {number|string} [params.currentSavings=0] - Existing savings already saved for this goal
 * @param {number|string} [params.stepUpPercent=0] - Optional annual step-up % for SIP
 * @param {boolean} [params.isInflationAdjusted=false] - Whether to account for inflation
 * @param {number|string} [params.inflationRate=6] - Inflation rate (% p.a.)
 * @returns {Object} Comprehensive plan breakdown
 */
export function calculateGoalPlan({
    targetAmount,
    years,
    annualRate,
    currentSavings = 0,
    stepUpPercent = 0,
    isInflationAdjusted = false,
    inflationRate = 6,
}) {
    const target = parseFloat(targetAmount);
    const nYears = Math.max(1, Math.min(40, parseInt(years, 10) || 1));
    const rAnnual = Math.max(0, parseFloat(annualRate) || 0);
    const existing = Math.max(0, parseFloat(currentSavings) || 0);
    const stepUp = Math.max(0, Math.min(50, parseFloat(stepUpPercent) || 0));
    const infRate = Math.max(0, Math.min(25, parseFloat(inflationRate) || 0));

    if (isNaN(target) || target <= 0) {
        return {
            isValid: false,
            targetAmount: 0,
            futureGoalAmount: 0,
            inflationImpact: 0,
            existingFutureValue: 0,
            netTargetNeeded: 0,
            requiredRegularSip: 0,
            totalRegularInvested: 0,
            totalRegularGains: 0,
            requiredStepUpSip: 0,
            finalStepUpMonthlySip: 0,
            totalStepUpInvested: 0,
            totalStepUpGains: 0,
            requiredLumpsum: 0,
            totalLumpsumGains: 0,
            milestones: [],
        };
    }

    // 1. Inflation adjustment for future goal cost
    // FV_goal = Target * (1 + inf)^years
    let futureGoalAmount = target;
    if (isInflationAdjusted && infRate > 0) {
        futureGoalAmount = target * Math.pow(1 + infRate / 100, nYears);
    }
    const inflationImpact = Math.max(0, futureGoalAmount - target);

    // 2. Existing savings future compounded value
    // FV_existing = existing * (1 + r)^years
    const existingFutureValue = existing * Math.pow(1 + rAnnual / 100, nYears);

    // 3. Net corpus needed from new monthly investments
    const netTargetNeeded = Math.max(0, futureGoalAmount - existingFutureValue);

    const totalMonths = nYears * 12;
    const rMonthly = rAnnual / 12 / 100; // Monthly rate

    // 4. Reverse Regular Monthly SIP (Annuity Due: payments at start of month)
    // FV = M * [((1 + i)^N - 1) / i] * (1 + i)
    // M = FV / (AnnuityFactor)
    let requiredRegularSip = 0;
    if (netTargetNeeded > 0) {
        if (rMonthly > 0) {
            const annuityFactor = ((Math.pow(1 + rMonthly, totalMonths) - 1) / rMonthly) * (1 + rMonthly);
            requiredRegularSip = Math.ceil(netTargetNeeded / annuityFactor);
        } else {
            requiredRegularSip = Math.ceil(netTargetNeeded / totalMonths);
        }
    }

    const totalRegularInvested = existing + (requiredRegularSip * totalMonths);
    const totalRegularGains = Math.max(0, futureGoalAmount - totalRegularInvested);

    // 5. Reverse Step-Up Monthly SIP (+s% per year)
    // Let starting monthly SIP be M1.
    // In year k, monthly SIP is M1 * (1 + s)^(k-1).
    // Future Value = M1 * sum_{m=1}^{totalMonths} (1 + s)^(floor((m-1)/12)) * (1 + rMonthly)^(totalMonths - m + 1)
    let requiredStepUpSip = requiredRegularSip;
    let finalStepUpMonthlySip = requiredRegularSip;
    let totalStepUpInvested = totalRegularInvested;

    if (netTargetNeeded > 0 && stepUp > 0) {
        let stepUpFactor = 0;
        const sRate = stepUp / 100;

        for (let m = 1; m <= totalMonths; m++) {
            const yearIndex = Math.floor((m - 1) / 12);
            const stepMultiplier = Math.pow(1 + sRate, yearIndex);
            const monthsToCompound = totalMonths - m + 1;
            const compoundMultiplier = rMonthly > 0 ? Math.pow(1 + rMonthly, monthsToCompound) : 1;
            stepUpFactor += stepMultiplier * compoundMultiplier;
        }

        if (stepUpFactor > 0) {
            requiredStepUpSip = Math.ceil(netTargetNeeded / stepUpFactor);
        }
        finalStepUpMonthlySip = Math.round(requiredStepUpSip * Math.pow(1 + sRate, nYears - 1));

        let cumulativeStepUpMonthly = 0;
        for (let y = 0; y < nYears; y++) {
            cumulativeStepUpMonthly += requiredStepUpSip * Math.pow(1 + sRate, y) * 12;
        }
        totalStepUpInvested = existing + Math.round(cumulativeStepUpMonthly);
    }
    const totalStepUpGains = Math.max(0, futureGoalAmount - totalStepUpInvested);

    // 6. Reverse One-Time Lumpsum
    // L = netTargetNeeded / (1 + rAnnual/100)^years
    const requiredLumpsum = rAnnual > 0
        ? Math.ceil(netTargetNeeded / Math.pow(1 + rAnnual / 100, nYears))
        : Math.ceil(netTargetNeeded);
    const totalLumpsumGains = Math.max(0, futureGoalAmount - (existing + requiredLumpsum));

    // 7. Year-by-Year Milestone Trajectory (Simulation of Regular SIP + Existing Savings)
    const milestones = [];
    let runningBalance = existing;
    let cumulativeInvested = existing;

    for (let y = 1; y <= nYears; y++) {
        let yearDeposits = 0;
        const startBalance = runningBalance;

        for (let m = 1; m <= 12; m++) {
            runningBalance += requiredRegularSip;
            yearDeposits += requiredRegularSip;
            if (rMonthly > 0) {
                runningBalance *= (1 + rMonthly);
            }
        }

        cumulativeInvested += yearDeposits;
        const yearGain = runningBalance - (startBalance + yearDeposits);
        const progressPercent = futureGoalAmount > 0
            ? Math.min(100, (runningBalance / futureGoalAmount) * 100)
            : 100;

        milestones.push({
            year: y,
            monthlyDeposit: requiredRegularSip,
            yearlyDeposited: Math.round(yearDeposits),
            cumulativeInvested: Math.round(cumulativeInvested),
            yearGain: Math.round(yearGain),
            closingBalance: Math.round(runningBalance),
            progressPercent: Math.round(progressPercent * 10) / 10,
        });
    }

    return {
        isValid: true,
        targetAmount: Math.round(target),
        futureGoalAmount: Math.round(futureGoalAmount),
        inflationImpact: Math.round(inflationImpact),
        existingFutureValue: Math.round(existingFutureValue),
        netTargetNeeded: Math.round(netTargetNeeded),
        requiredRegularSip,
        totalRegularInvested: Math.round(totalRegularInvested),
        totalRegularGains: Math.round(totalRegularGains),
        requiredStepUpSip,
        finalStepUpMonthlySip,
        totalStepUpInvested: Math.round(totalStepUpInvested),
        totalStepUpGains: Math.round(totalStepUpGains),
        requiredLumpsum,
        totalLumpsumGains: Math.round(totalLumpsumGains),
        milestones,
    };
}
