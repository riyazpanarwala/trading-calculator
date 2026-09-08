/**
 * FIRE (Financial Independence, Retire Early) & XIRR / CAGR Calculation Engine
 */

/**
 * Format currency with Indian/Standard locale
 */
export function formatCurrency(value, currencySymbol = "₹") {
    if (value == null || isNaN(value)) return `${currencySymbol} 0`;
    const formatted = Math.abs(value) >= 10000
        ? Number(value.toFixed(0)).toLocaleString("en-IN")
        : Number(value.toFixed(2)).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return `${value < 0 ? "−" : ""}${currencySymbol} ${formatted}`;
}

/**
 * Format compact currency e.g. ₹50 L, ₹1.5 Cr
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
 * Calculate FIRE (Financial Independence, Retire Early) Metrics
 *
 * @param {Object} params
 * @param {number|string} params.currentAge - e.g. 30
 * @param {number|string} params.targetRetirementAge - e.g. 45
 * @param {number|string} params.currentMonthlyExpense - e.g. 50000
 * @param {number|string} [params.currentSavings=0] - e.g. 2000000
 * @param {number|string} [params.monthlySip=0] - e.g. 30000
 * @param {number|string} [params.expectedReturnRate=12] - e.g. 12% p.a.
 * @param {number|string} [params.inflationRate=6] - e.g. 6% p.a.
 * @param {number|string} [params.withdrawalMultiplier=25] - 25x (4% rule) or 30x (3.33% rule)
 * @param {number|string} [params.stepUpPercent=5] - Annual step-up in monthly SIP
 * @returns {Object} Complete FIRE plan & milestones
 */
export function calculateFirePlan({
    currentAge,
    targetRetirementAge,
    currentMonthlyExpense,
    currentSavings = 0,
    monthlySip = 0,
    expectedReturnRate = 12,
    inflationRate = 6,
    withdrawalMultiplier = 25,
    stepUpPercent = 5,
}) {
    const age = Math.max(18, Math.min(80, parseInt(currentAge, 10) || 30));
    let retAge = Math.max(age + 1, Math.min(85, parseInt(targetRetirementAge, 10) || 45));

    const expMonthly = Math.max(0, parseFloat(currentMonthlyExpense) || 0);
    const savings = Math.max(0, parseFloat(currentSavings) || 0);
    const sip = Math.max(0, parseFloat(monthlySip) || 0);
    const returnRate = Math.max(0, parseFloat(expectedReturnRate) || 0);
    const infRate = Math.max(0, parseFloat(inflationRate) || 0);
    const mult = Math.max(15, Math.min(40, parseFloat(withdrawalMultiplier) || 25));
    const stepUp = Math.max(0, parseFloat(stepUpPercent) || 0);

    if (expMonthly <= 0) {
        return {
            isValid: false,
            currentAge: age,
            targetRetirementAge: retAge,
            yearsToRetirement: retAge - age,
            targetFireCorpus: 0,
            leanFireCorpus: 0,
            fatFireCorpus: 0,
            coastFireNumber: 0,
            projectedCorpus: 0,
            fireAgeAchieved: null,
            milestones: [],
        };
    }

    const yearsToRetirement = retAge - age;

    // 1. Future Inflated Monthly & Annual Expenses at Retirement Age
    const futureMonthlyExpense = expMonthly * Math.pow(1 + infRate / 100, yearsToRetirement);
    const futureAnnualExpense = futureMonthlyExpense * 12;

    // 2. FIRE Target Numbers at Retirement Age
    const targetFireCorpus = futureAnnualExpense * mult; // Standard FIRE
    const leanFireCorpus = targetFireCorpus * 0.75;      // Lean FIRE (75% expenses)
    const fatFireCorpus = targetFireCorpus * 1.25;        // Fat FIRE (125% expenses)

    // 3. Coast FIRE Number Today
    // (Amount needed in portfolio today to compound untouched to FIRE corpus at retirement age)
    const coastFireNumber = returnRate > 0
        ? targetFireCorpus / Math.pow(1 + returnRate / 100, yearsToRetirement)
        : targetFireCorpus;

    const isCoastFireAchieved = savings >= coastFireNumber;

    // 4. Year-by-Year Simulation from Current Age to Age 80
    const milestones = [];
    let currentCorpus = savings;
    let totalInvested = savings;
    let monthlyContribution = sip;
    let fireAgeAchieved = null;
    let leanFireAgeAchieved = null;

    const maxSimYears = Math.min(50, 80 - age);
    const iMonthly = returnRate / 12 / 100;

    for (let y = 1; y <= maxSimYears; y++) {
        const curAge = age + y;
        const yearsFromStart = y;

        // Inflated annual expense at current simulated age
        const simMonthlyExp = expMonthly * Math.pow(1 + infRate / 100, yearsFromStart);
        const simTargetFire = simMonthlyExp * 12 * mult;
        const simLeanFire = simTargetFire * 0.75;

        // Step-up monthly SIP annually
        if (stepUp > 0 && y > 1) {
            monthlyContribution = sip * Math.pow(1 + stepUp / 100, y - 1);
        }

        let yrInvested = 0;
        for (let m = 1; m <= 12; m++) {
            currentCorpus += monthlyContribution;
            yrInvested += monthlyContribution;
            if (iMonthly > 0) {
                currentCorpus *= (1 + iMonthly);
            }
        }
        totalInvested += yrInvested;

        if (fireAgeAchieved == null && currentCorpus >= simTargetFire) {
            fireAgeAchieved = curAge;
        }
        if (leanFireAgeAchieved == null && currentCorpus >= simLeanFire) {
            leanFireAgeAchieved = curAge;
        }

        milestones.push({
            year: y,
            age: curAge,
            monthlySip: Math.round(monthlyContribution),
            totalInvested: Math.round(totalInvested),
            closingCorpus: Math.round(currentCorpus),
            targetFireCorpus: Math.round(simTargetFire),
            leanFireCorpus: Math.round(simLeanFire),
            isFireAchieved: currentCorpus >= simTargetFire,
        });
    }

    const projectedCorpus = milestones.find((m) => m.age === retAge)?.closingCorpus || Math.round(currentCorpus);
    const isFireAchievedAtTarget = projectedCorpus >= targetFireCorpus;

    return {
        isValid: true,
        currentAge: age,
        targetRetirementAge: retAge,
        yearsToRetirement,
        currentAnnualExpense: expMonthly * 12,
        futureMonthlyExpense: Math.round(futureMonthlyExpense),
        futureAnnualExpense: Math.round(futureAnnualExpense),
        targetFireCorpus: Math.round(targetFireCorpus),
        leanFireCorpus: Math.round(leanFireCorpus),
        fatFireCorpus: Math.round(fatFireCorpus),
        coastFireNumber: Math.round(coastFireNumber),
        isCoastFireAchieved,
        projectedCorpus: Math.round(projectedCorpus),
        isFireAchievedAtTarget,
        fireAgeAchieved,
        leanFireAgeAchieved,
        safeWithdrawalRatePct: Math.round((100 / mult) * 100) / 100,
        milestones,
    };
}

/**
 * Point-to-Point CAGR (Compound Annual Growth Rate) Calculator
 * Formula: CAGR = (Final / Initial)^(1 / Years) - 1
 */
export function calculateCagr(initialValue, finalValue, years) {
    const P0 = parseFloat(initialValue);
    const Pn = parseFloat(finalValue);
    const y = parseFloat(years);

    if (isNaN(P0) || P0 <= 0 || isNaN(Pn) || Pn <= 0 || isNaN(y) || y <= 0) {
        return null;
    }

    const cagr = (Math.pow(Pn / P0, 1 / y) - 1) * 100;
    const absoluteReturn = ((Pn - P0) / P0) * 100;
    const totalProfit = Pn - P0;

    return {
        initialValue: P0,
        finalValue: Pn,
        years: y,
        cagrPercent: Math.round(cagr * 100) / 100,
        absoluteReturnPercent: Math.round(absoluteReturn * 100) / 100,
        totalProfit: Math.round(totalProfit),
    };
}

/**
 * Multi-Date Irregular Cashflow XIRR Solver (Extended Internal Rate of Return)
 * Uses Newton-Raphson method to solve f(r) = sum( CF_k / (1 + r)^((d_k - d_0)/365) ) = 0
 *
 * @param {Array<{ date: string|Date, amount: number }>} cashflows
 * Amount convention: Negative for investments/outflows, Positive for final portfolio value/inflows.
 */
export function calculateXirr(cashflows = []) {
    const validFlows = cashflows
        .map((cf) => ({
            date: new Date(cf.date),
            amount: parseFloat(cf.amount),
        }))
        .filter((cf) => !isNaN(cf.date.getTime()) && !isNaN(cf.amount) && cf.amount !== 0);

    if (validFlows.length < 2) return null;

    // Check if cashflows contain both negative (investments) and positive (returns)
    const hasNegative = validFlows.some((f) => f.amount < 0);
    const hasPositive = validFlows.some((f) => f.amount > 0);

    if (!hasNegative || !hasPositive) return null;

    // Sort cashflows chronologically
    validFlows.sort((a, b) => a.date.getTime() - b.date.getTime());
    const d0 = validFlows[0].date.getTime();

    // Helper: calculate XIRR equation value and derivative
    const xirrFuncAndDeriv = (r) => {
        let f = 0;
        let df = 0;

        for (let i = 0; i < validFlows.length; i++) {
            const days = (validFlows[i].date.getTime() - d0) / (1000 * 3600 * 24);
            const yrs = days / 365.0;
            const factor = Math.pow(1 + r, yrs);

            if (factor === 0) continue;
            f += validFlows[i].amount / factor;
            df -= (yrs * validFlows[i].amount) / (factor * (1 + r));
        }

        return { f, df };
    };

    let r = 0.10; // Initial guess 10%
    const maxIter = 100;
    const tol = 1e-6;

    for (let iter = 0; iter < maxIter; iter++) {
        const { f, df } = xirrFuncAndDeriv(r);

        if (Math.abs(f) < tol) {
            return Math.round(r * 100 * 100) / 100; // Returns %
        }

        if (Math.abs(df) < 1e-10) break;

        const nextR = r - f / df;
        if (nextR <= -0.999) r = -0.5;
        else r = nextR;
    }

    return Math.round(r * 100 * 100) / 100;
}
