/**
 * Loan, Prepayment & EMI vs. SIP Financial Calculation Engine
 *
 * Implements:
 * 1. Standard Reducing Balance EMI & Amortization
 * 2. Prepayment Strategies (Extra monthly, 1 Extra EMI/yr, Step-Up EMI, Lump Sum)
 * 3. Prepay Loan vs. Invest in SIP Opportunity Cost Analysis
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
 * Standard reducing balance Monthly EMI
 * EMI = [P * r * (1 + r)^n] / [(1 + r)^n - 1]
 *
 * @param {number} P - Principal
 * @param {number} annualRate - Annual interest rate in %
 * @param {number} tenureYears - Tenure in years
 * @returns {number} Monthly EMI amount
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
 * Comprehensive Loan and Prepayment Analysis
 *
 * @param {Object} params
 * @param {number|string} params.principal - Loan amount
 * @param {number|string} params.annualRate - Annual interest rate in %
 * @param {number|string} params.tenureYears - Loan tenure in years
 * @param {number|string} [params.extraMonthly=0] - Additional monthly prepayment
 * @param {boolean} [params.oneExtraEmiPerYear=false] - Pay 1 extra EMI every year (13th EMI)
 * @param {number|string} [params.annualStepUpPercent=0] - Step up EMI each year by X%
 * @param {number|string} [params.lumpSumAmount=0] - One-time lump sum prepayment
 * @param {number|string} [params.lumpSumYear=2] - Year to inject the lump sum prepayment
 * @param {number|string} [params.sipReturnRate=12] - Expected SIP annual return %
 * @returns {Object} Complete loan and prepayment metrics
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

    // ── Simulate month-by-month prepayment amortization ──
    let balance = P;
    let newTotalInterest = 0;
    let totalPrepaymentsPaid = 0;
    let currentMonth = 0;

    // For SIP opportunity cost calculation:
    // We will compound the exact extra prepayment cashflows invested at sipRate
    const sipMonthlyRate = sipRate / 12 / 100;
    let sipFutureValue = 0;

    // For yearly amortization ledger
    const yearlyAmortization = [];
    let yearPrincipalPaid = 0;
    let yearInterestPaid = 0;
    let yearStartBalance = P;

    while (balance > 0.01 && currentMonth < originalTenureMonths) {
        currentMonth++;
        const currentYear = Math.ceil(currentMonth / 12);

        // Interest for this month
        const monthlyInterest = balance * rMonthly;
        newTotalInterest += monthlyInterest;
        yearInterestPaid += monthlyInterest;

        // Current scheduled base EMI (with Step-Up if enabled)
        let scheduledEmi = baseEmi;
        if (stepUp > 0) {
            const yearIndex = Math.floor((currentMonth - 1) / 12);
            scheduledEmi = Math.round(baseEmi * Math.pow(1 + stepUp / 100, yearIndex));
        }

        // Additional prepayments for this month
        let prepaymentThisMonth = extraMonth;

        // 1 extra EMI per year (applied on 12th month of every year)
        if (oneExtraEmiPerYear && currentMonth % 12 === 0) {
            prepaymentThisMonth += baseEmi;
        }

        // Lump sum prepayment
        if (lumpSum > 0 && currentMonth === (lumpYr * 12)) {
            prepaymentThisMonth += lumpSum;
        }

        const totalScheduledPayment = scheduledEmi + prepaymentThisMonth;

        // Total amount required to close loan
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

        // Track prepayment portion for SIP comparison
        const extraPaymentPortion = Math.max(0, actualPayment - (baseEmi + monthlyInterest * 0));
        totalPrepaymentsPaid += prepaymentThisMonth;

        // Compound this month's prepayment into SIP over the full original tenure
        if (hasPrepayment && prepaymentThisMonth > 0) {
            const monthsToCompound = originalTenureMonths - currentMonth;
            const compounded = prepaymentThisMonth * Math.pow(1 + sipMonthlyRate, monthsToCompound);
            sipFutureValue += compounded;
        }

        // If end of year or loan closed, record yearly milestone
        if (currentMonth % 12 === 0 || balance <= 0.01) {
            const percentCleared = P > 0 ? Math.min(100, ((P - balance) / P) * 100) : 100;
            yearlyAmortization.push({
                year: currentYear,
                openingBalance: Math.round(yearStartBalance),
                principalPaid: Math.round(yearPrincipalPaid),
                interestPaid: Math.round(yearInterestPaid),
                closingBalance: Math.max(0, Math.round(balance)),
                percentCleared: Math.round(percentCleared * 10) / 10,
            });

            // Reset for next year
            yearStartBalance = balance;
            yearPrincipalPaid = 0;
            yearInterestPaid = 0;
        }

        if (balance <= 0.01) break;
    }

    const newTenureMonths = currentMonth;
    const newTenureYears = Math.round((newTenureMonths / 12) * 10) / 10;
    const monthsSaved = Math.max(0, originalTenureMonths - newTenureMonths);
    const yearsSaved = Math.round((monthsSaved / 12) * 10) / 10;
    const interestSaved = Math.max(0, Math.round(originalTotalInterest - newTotalInterest));

    // ── Prepay vs. SIP Comparison ──
    const netWealthDifference = Math.round(sipFutureValue - interestSaved);
    const sipBeatsLoan = netWealthDifference > 0;

    return {
        isValid: true,
        principal: Math.round(P),
        originalEmi: baseEmi,
        originalTotalInterest: Math.round(originalTotalInterest),
        originalTotalAmount: Math.round(originalTotalAmount),
        originalTenureMonths,
        hasPrepayment,
        newTenureMonths,
        newTenureYears,
        monthsSaved,
        yearsSaved,
        newTotalInterest: Math.round(newTotalInterest),
        interestSaved,
        totalPrepaymentsPaid: Math.round(totalPrepaymentsPaid),
        prepayVsSip: {
            sipFutureValue: Math.round(sipFutureValue),
            netWealthDifference: Math.abs(netWealthDifference),
            sipBeatsLoan,
        },
        yearlyAmortization,
    };
}
