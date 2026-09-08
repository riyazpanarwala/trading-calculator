/**
 * Comprehensive Loan, Prepayment, Rate Hike & Balance Transfer Financial Engine
 */

export const LOAN_PRESETS = [
    {
        id: "home",
        title: "🏠 Home Loan",
        principal: 5000000,
        rate: 8.5,
        years: 20,
        desc: "₹50L @ 8.5% for 20 Years",
    },
    {
        id: "car",
        title: "🚗 Car Loan",
        principal: 1200000,
        rate: 9.0,
        years: 5,
        desc: "₹12L @ 9.0% for 5 Years",
    },
    {
        id: "personal",
        title: "💼 Personal Loan",
        principal: 500000,
        rate: 12.5,
        years: 3,
        desc: "₹5L @ 12.5% for 3 Years",
    },
    {
        id: "education",
        title: "🎓 Education Loan",
        principal: 2000000,
        rate: 10.0,
        years: 8,
        desc: "₹20L @ 10.0% for 8 Years",
    },
    {
        id: "custom",
        title: "🎯 Custom Loan",
        principal: 2500000,
        rate: 9.5,
        years: 15,
        desc: "Your custom loan parameters",
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
 * Standard reducing balance Monthly EMI
 */
export function calculateEmi(P, annualRate, tenureYears) {
    if (P <= 0 || tenureYears <= 0) return 0;
    const r = annualRate / 12 / 100;
    const n = tenureYears * 12;
    if (r === 0) return Math.ceil(P / n);
    const emi = (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    return Math.round(emi);
}

/**
 * Floating Interest Rate Revision Simulator (RBI Rate Hike/Cut)
 */
export function calculateRateRevision(outstandingPrincipal, currentRate, newRate, remainingTenureYears, currentEmi) {
    const P = parseFloat(outstandingPrincipal) || 0;
    const oldR = parseFloat(currentRate) || 0;
    const newR = parseFloat(newRate) || 0;
    const years = parseFloat(remainingTenureYears) || 1;
    const emi = parseFloat(currentEmi) || calculateEmi(P, oldR, years);

    if (P <= 0 || years <= 0) {
        return { newEmiSameTenure: 0, newTenureSameEmiMonths: 0, extraInterest: 0 };
    }

    // Option A: Keep Tenure Same -> New Increased EMI
    const newEmiSameTenure = calculateEmi(P, newR, years);
    const emiDifference = newEmiSameTenure - emi;

    // Option B: Keep EMI Same -> Extended Tenure
    const rMonthly = newR / 12 / 100;
    let newTenureSameEmiMonths = years * 12;

    if (rMonthly > 0 && emi > P * rMonthly) {
        // n = -log(1 - (P*r)/EMI) / log(1 + r)
        const numerator = -Math.log(1 - (P * rMonthly) / emi);
        const denominator = Math.log(1 + rMonthly);
        newTenureSameEmiMonths = Math.ceil(numerator / denominator);
    }

    const totalInterestOld = (emi * years * 12) - P;
    const totalInterestNewSameTenure = (newEmiSameTenure * years * 12) - P;
    const extraInterest = Math.max(0, totalInterestNewSameTenure - totalInterestOld);

    return {
        oldEmi: Math.round(emi),
        newEmiSameTenure: Math.round(newEmiSameTenure),
        emiDifference: Math.round(emiDifference),
        newTenureSameEmiMonths,
        newTenureSameEmiYears: Math.round((newTenureSameEmiMonths / 12) * 10) / 10,
        extraMonths: Math.max(0, newTenureSameEmiMonths - (years * 12)),
        extraInterest: Math.round(extraInterest),
    };
}

/**
 * Loan Balance Transfer (Loan Switch) Calculator
 */
export function calculateBalanceTransfer(outstandingBalance, currentRate, newRate, remainingYears, transferFees = 10000) {
    const P = parseFloat(outstandingBalance) || 0;
    const rOld = parseFloat(currentRate) || 0;
    const rNew = parseFloat(newRate) || 0;
    const y = parseFloat(remainingYears) || 1;
    const fee = parseFloat(transferFees) || 0;

    if (P <= 0 || y <= 0) {
        return { netSavings: 0, oldTotalInterest: 0, newTotalInterest: 0 };
    }

    const oldEmi = calculateEmi(P, rOld, y);
    const oldTotalInterest = Math.max(0, (oldEmi * y * 12) - P);

    const newEmi = calculateEmi(P, rNew, y);
    const newTotalInterest = Math.max(0, (newEmi * y * 12) - P);

    const grossInterestSavings = Math.max(0, oldTotalInterest - newTotalInterest);
    const netSavings = Math.max(0, grossInterestSavings - fee);

    return {
        outstandingBalance: Math.round(P),
        oldEmi: Math.round(oldEmi),
        newEmi: Math.round(newEmi),
        monthlySavings: Math.round(oldEmi - newEmi),
        oldTotalInterest: Math.round(oldTotalInterest),
        newTotalInterest: Math.round(newTotalInterest),
        grossInterestSavings: Math.round(grossInterestSavings),
        transferFees: Math.round(fee),
        netSavings: Math.round(netSavings),
    };
}

/**
 * Moratorium / Grace Period Interest Simulator
 */
export function calculateMoratoriumLoan(principal, annualRate, moratoriumMonths, tenureYears) {
    const P = parseFloat(principal) || 0;
    const rate = parseFloat(annualRate) || 0;
    const mMonths = Math.max(0, parseInt(moratoriumMonths, 10) || 0);
    const years = Math.max(1, parseFloat(tenureYears) || 1);

    if (P <= 0 || years <= 0) {
        return { accruedInterest: 0, totalPrincipalPostMoratorium: 0, postMoratoriumEmi: 0 };
    }

    const rMonthly = rate / 12 / 100;
    // Compounded accrued interest during moratorium
    const totalPrincipalPostMoratorium = P * Math.pow(1 + rMonthly, mMonths);
    const accruedInterest = Math.max(0, totalPrincipalPostMoratorium - P);
    const postMoratoriumEmi = calculateEmi(totalPrincipalPostMoratorium, rate, years);

    return {
        initialPrincipal: Math.round(P),
        accruedInterest: Math.round(accruedInterest),
        totalPrincipalPostMoratorium: Math.round(totalPrincipalPostMoratorium),
        postMoratoriumEmi: Math.round(postMoratoriumEmi),
    };
}

/**
 * Comprehensive Loan and Prepayment Analysis
 */
export function calculateLoanPlan({
    principal,
    annualRate,
    tenureYears,
    extraMonthly = 0,
    oneExtraEmiPerYear = false,
    annualStepUpPercent = 0,
    lumpSumAmount = 0,
    lumpSumYear = 2,
    sipReturnRate = 12,
}) {
    const P = Math.max(0, parseFloat(principal) || 0);
    const rate = Math.max(0, parseFloat(annualRate) || 0);
    const years = Math.max(1, Math.min(35, parseInt(tenureYears, 10) || 1));
    const extraMonth = Math.max(0, parseFloat(extraMonthly) || 0);
    const stepUp = Math.max(0, Math.min(30, parseFloat(annualStepUpPercent) || 0));
    const lumpSum = Math.max(0, parseFloat(lumpSumAmount) || 0);
    const lumpYr = Math.max(1, parseInt(lumpSumYear, 10) || 1);
    const sipRate = Math.max(0, parseFloat(sipReturnRate) || 12);

    if (P <= 0 || years <= 0) {
        return {
            isValid: false,
            principal: 0,
            originalEmi: 0,
            originalTotalInterest: 0,
            originalTotalAmount: 0,
            originalTenureMonths: 0,
            hasPrepayment: false,
            newTenureMonths: 0,
            newTenureYears: 0,
            monthsSaved: 0,
            yearsSaved: 0,
            newTotalInterest: 0,
            interestSaved: 0,
            totalPrepaymentsPaid: 0,
            prepayVsSip: {
                sipFutureValue: 0,
                netWealthDifference: 0,
                sipBeatsLoan: true,
            },
            yearlyAmortization: [],
        };
    }

    const originalTenureMonths = years * 12;
    const rMonthly = rate / 12 / 100;
    const baseEmi = calculateEmi(P, rate, years);
    const originalTotalAmount = baseEmi * originalTenureMonths;
    const originalTotalInterest = Math.max(0, originalTotalAmount - P);

    const hasPrepayment = extraMonth > 0 || oneExtraEmiPerYear || stepUp > 0 || lumpSum > 0;

    let balance = P;
    let newTotalInterest = 0;
    let totalPrepaymentsPaid = 0;
    let currentMonth = 0;

    const sipMonthlyRate = sipRate / 12 / 100;
    let sipFutureValue = 0;

    const yearlyAmortization = [];
    let yearPrincipalPaid = 0;
    let yearInterestPaid = 0;
    let yearStartBalance = P;

    while (balance > 0.01 && currentMonth < originalTenureMonths) {
        currentMonth++;
        const currentYear = Math.ceil(currentMonth / 12);

        const monthlyInterest = balance * rMonthly;
        newTotalInterest += monthlyInterest;
        yearInterestPaid += monthlyInterest;

        let scheduledEmi = baseEmi;
        if (stepUp > 0) {
            const yearIndex = Math.floor((currentMonth - 1) / 12);
            scheduledEmi = Math.round(baseEmi * Math.pow(1 + stepUp / 100, yearIndex));
        }

        let prepaymentThisMonth = extraMonth;
        if (oneExtraEmiPerYear && currentMonth % 12 === 0) {
            prepaymentThisMonth += baseEmi;
        }
        if (lumpSum > 0 && currentMonth === (lumpYr * 12)) {
            prepaymentThisMonth += lumpSum;
        }

        const totalScheduledPayment = scheduledEmi + prepaymentThisMonth;
        const totalPayoffRequired = balance + monthlyInterest;

        let actualPayment = 0;
        let actualPrincipalPaid = 0;

        if (totalScheduledPayment >= totalPayoffRequired) {
            actualPayment = totalPayoffRequired;
            actualPrincipalPaid = balance;
            balance = 0;
        } else {
            actualPayment = totalScheduledPayment;
            actualPrincipalPaid = actualPayment - monthlyInterest;
            balance -= actualPrincipalPaid;
        }

        yearPrincipalPaid += actualPrincipalPaid;
        totalPrepaymentsPaid += prepaymentThisMonth;

        if (hasPrepayment && prepaymentThisMonth > 0) {
            const monthsToCompound = originalTenureMonths - currentMonth;
            if (sipMonthlyRate > 0) {
                sipFutureValue += prepaymentThisMonth * Math.pow(1 + sipMonthlyRate, monthsToCompound);
            } else {
                sipFutureValue += prepaymentThisMonth;
            }
        }

        if (currentMonth % 12 === 0 || balance <= 0.01) {
            yearlyAmortization.push({
                year: currentYear,
                startBalance: Math.round(yearStartBalance),
                principalPaid: Math.round(yearPrincipalPaid),
                interestPaid: Math.round(yearInterestPaid),
                totalPaid: Math.round(yearPrincipalPaid + yearInterestPaid),
                endBalance: Math.round(balance),
            });

            yearPrincipalPaid = 0;
            yearInterestPaid = 0;
            yearStartBalance = balance;
        }
    }

    const newTenureMonths = currentMonth;
    const monthsSaved = Math.max(0, originalTenureMonths - newTenureMonths);
    const yearsSaved = Math.round((monthsSaved / 12) * 10) / 10;
    const interestSaved = Math.max(0, originalTotalInterest - newTotalInterest);

    const netWealthDifference = Math.round(sipFutureValue - interestSaved);
    const sipBeatsLoan = netWealthDifference > 0;

    return {
        isValid: true,
        principal: Math.round(P),
        originalEmi: Math.round(baseEmi),
        originalTotalInterest: Math.round(originalTotalInterest),
        originalTotalAmount: Math.round(originalTotalAmount),
        originalTenureMonths,
        hasPrepayment,
        newTenureMonths,
        newTenureYears: Math.round((newTenureMonths / 12) * 10) / 10,
        monthsSaved,
        yearsSaved,
        newTotalInterest: Math.round(newTotalInterest),
        interestSaved: Math.round(interestSaved),
        totalPrepaymentsPaid: Math.round(totalPrepaymentsPaid),
        prepayVsSip: {
            sipFutureValue: Math.round(sipFutureValue),
            netWealthDifference,
            sipBeatsLoan,
        },
        yearlyAmortization,
    };
}
