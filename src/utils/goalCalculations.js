/**
 * Goal-Based Wealth Planner (Reverse SIP / Reverse Lumpsum) Calculations
 * Enhanced with Multi-Goal Portfolio Aggregator & Asset Allocation Strategy (Equity vs Debt)
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
 * Format compact numbers in Indian system
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
 * Asset Allocation Strategy based on Goal Horizon
 */
export function calculateAssetAllocation(years) {
    const y = Math.max(1, parseFloat(years) || 1);
    if (y < 3) {
        return {
            equityPct: 20,
            debtPct: 80,
            riskLevel: "Low Risk / Capital Preservation",
            desc: "Focus on Debt funds & FDs to protect principal for short-term goal.",
            color: "#3B82F6",
        };
    }
    if (y <= 7) {
        return {
            equityPct: 50,
            debtPct: 50,
            riskLevel: "Moderate Risk / Balanced",
            desc: "Balanced 50:50 allocation between Largecap Equity & Debt instruments.",
            color: "#F59E0B",
        };
    }
    return {
        equityPct: 80,
        debtPct: 20,
        riskLevel: "High Growth / Aggressive Compounding",
        desc: "Aggressive Equity allocation to maximize compounding over long horizon.",
        color: "#10B981",
    };
}

/**
 * Calculate comprehensive Goal-Based Wealth Plan
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
            assetAllocation: calculateAssetAllocation(nYears),
            milestones: [],
        };
    }

    let futureGoalAmount = target;
    if (isInflationAdjusted && infRate > 0) {
        futureGoalAmount = target * Math.pow(1 + infRate / 100, nYears);
    }
    const inflationImpact = Math.max(0, futureGoalAmount - target);

    const existingFutureValue = existing * Math.pow(1 + rAnnual / 100, nYears);
    const netTargetNeeded = Math.max(0, futureGoalAmount - existingFutureValue);

    const totalMonths = nYears * 12;
    const rMonthly = rAnnual / 12 / 100;

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

    const requiredLumpsum = rAnnual > 0
        ? Math.ceil(netTargetNeeded / Math.pow(1 + rAnnual / 100, nYears))
        : Math.ceil(netTargetNeeded);
    const totalLumpsumGains = Math.max(0, futureGoalAmount - (existing + requiredLumpsum));

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
        requiredRegularSip: Math.round(requiredRegularSip),
        totalRegularInvested: Math.round(totalRegularInvested),
        totalRegularGains: Math.round(totalRegularGains),
        requiredStepUpSip: Math.round(requiredStepUpSip),
        finalStepUpMonthlySip: Math.round(finalStepUpMonthlySip),
        totalStepUpInvested: Math.round(totalStepUpInvested),
        totalStepUpGains: Math.round(totalStepUpGains),
        requiredLumpsum: Math.round(requiredLumpsum),
        totalLumpsumGains: Math.round(totalLumpsumGains),
        assetAllocation: calculateAssetAllocation(nYears),
        milestones,
    };
}

/**
 * Aggregate multiple goals into a single consolidated portfolio requirement
 */
export function calculateMultiGoalPortfolio(goalsList = []) {
    let totalTargetAmount = 0;
    let totalFutureGoalAmount = 0;
    let totalRequiredMonthlySip = 0;
    let totalRequiredLumpsum = 0;
    const itemizedGoals = [];

    goalsList.forEach((g) => {
        const plan = calculateGoalPlan(g);
        if (plan.isValid) {
            totalTargetAmount += plan.targetAmount;
            totalFutureGoalAmount += plan.futureGoalAmount;
            totalRequiredMonthlySip += plan.requiredRegularSip;
            totalRequiredLumpsum += plan.requiredLumpsum;
            itemizedGoals.push({ ...g, plan });
        }
    });

    return {
        totalTargetAmount: Math.round(totalTargetAmount),
        totalFutureGoalAmount: Math.round(totalFutureGoalAmount),
        totalRequiredMonthlySip: Math.round(totalRequiredMonthlySip),
        totalRequiredLumpsum: Math.round(totalRequiredLumpsum),
        itemizedGoals,
    };
}
