/**
 * Black-Scholes Model & Option Greeks Calculation Engine
 * Calculates European Call/Put theoretical fair prices, Delta, Gamma, Theta, Vega, Rho,
 * Implied Volatility (IV Newton-Raphson solver), and What-If Scenario Projections.
 */

/**
 * Standard Normal Cumulative Distribution Function N(x) approximation
 * (Abramowitz & Stegun polynomial approximation, precision < 1e-7)
 */
export function normalCdf(x) {
    const a1 = 0.254829592;
    const a2 = -0.284496736;
    const a3 = 1.421413741;
    const a4 = -1.453152027;
    const a5 = 1.061405429;
    const p = 0.3275911;

    const sign = x < 0 ? -1 : 1;
    const absX = Math.abs(x) / Math.sqrt(2);

    const t = 1.0 / (1.0 + p * absX);
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-absX * absX);

    return 0.5 * (1.0 + sign * y);
}

/**
 * Standard Normal Probability Density Function N'(x)
 */
export function normalPdf(x) {
    return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
}

/**
 * Calculate Black-Scholes Option Prices and Greeks
 *
 * @param {Object} params
 * @param {number|string} params.spotPrice - Current Spot Price (S)
 * @param {number|string} params.strikePrice - Strike Price (K)
 * @param {number|string} params.timeToExpiryDays - Days to Expiry (D)
 * @param {number|string} params.volatilityPercent - Implied Volatility (%)
 * @param {number|string} [params.riskFreeRatePercent=6.5] - Risk-free interest rate (% p.a.)
 * @param {number|string} [params.dividendYieldPercent=0] - Annual dividend yield / cost of carry (%)
 * @returns {Object}
 */
export function calculateBlackScholes({
    spotPrice,
    strikePrice,
    timeToExpiryDays,
    volatilityPercent,
    riskFreeRatePercent = 6.5,
    dividendYieldPercent = 0,
}) {
    const S = parseFloat(spotPrice);
    const K = parseFloat(strikePrice);
    const days = parseFloat(timeToExpiryDays);
    const vol = parseFloat(volatilityPercent);
    const rRate = parseFloat(riskFreeRatePercent);
    const qRate = parseFloat(dividendYieldPercent);

    if (
        isNaN(S) || S <= 0 ||
        isNaN(K) || K <= 0 ||
        isNaN(days) || days < 0 ||
        isNaN(vol) || vol <= 0
    ) {
        return {
            isValid: false,
            callPrice: 0,
            putPrice: 0,
            callDelta: 0,
            putDelta: 0,
            gamma: 0,
            callThetaDaily: 0,
            putThetaDaily: 0,
            vega: 0,
            callRho: 0,
            putRho: 0,
            intrinsicCall: 0,
            intrinsicPut: 0,
            timeValueCall: 0,
            timeValuePut: 0,
            moneyness: "ATM",
        };
    }

    const t = Math.max(0.00001, days / 365); // Time in years
    const sigma = Math.max(0.0001, vol / 100); // Volatility fraction
    const r = isNaN(rRate) ? 0.065 : rRate / 100;
    const q = isNaN(qRate) ? 0 : qRate / 100;

    const sqrtT = Math.sqrt(t);
    const d1 = (Math.log(S / K) + (r - q + 0.5 * sigma * sigma) * t) / (sigma * sqrtT);
    const d2 = d1 - sigma * sqrtT;

    const N_d1 = normalCdf(d1);
    const N_d2 = normalCdf(d2);
    const N_minus_d1 = normalCdf(-d1);
    const N_minus_d2 = normalCdf(-d2);
    const pdf_d1 = normalPdf(d1);

    const eqt = Math.exp(-q * t);
    const ert = Math.exp(-r * t);

    // Theoretical Prices
    const callPrice = S * eqt * N_d1 - K * ert * N_d2;
    const putPrice = K * ert * N_minus_d2 - S * eqt * N_minus_d1;

    // Intrinsic & Time Values
    const intrinsicCall = Math.max(0, S - K);
    const intrinsicPut = Math.max(0, K - S);
    const timeValueCall = Math.max(0, callPrice - intrinsicCall);
    const timeValuePut = Math.max(0, putPrice - intrinsicPut);

    // Moneyness determination
    const pctDiff = ((S - K) / K) * 100;
    let moneyness = "ATM";
    if (pctDiff > 0.5) moneyness = "ITM Call / OTM Put";
    else if (pctDiff < -0.5) moneyness = "OTM Call / ITM Put";

    // 1. Delta (Sensitivity to 1 point spot move)
    const callDelta = eqt * N_d1;
    const putDelta = callDelta - eqt;

    // 2. Gamma (Rate of change of Delta per 1 point spot move)
    const gamma = (eqt * pdf_d1) / (S * sigma * sqrtT);

    // 3. Theta (Time decay per calendar day ₹/day)
    const callThetaAnnual = -((S * eqt * pdf_d1 * sigma) / (2 * sqrtT)) - r * K * ert * N_d2 + q * S * eqt * N_d1;
    const putThetaAnnual = -((S * eqt * pdf_d1 * sigma) / (2 * sqrtT)) + r * K * ert * N_minus_d2 - q * S * eqt * N_minus_d1;

    const callThetaDaily = callThetaAnnual / 365;
    const putThetaDaily = putThetaAnnual / 365;

    // 4. Vega (Sensitivity to 1% change in Implied Volatility)
    const vega = (S * eqt * pdf_d1 * sqrtT) / 100;

    // 5. Rho (Sensitivity to 1% change in Interest Rate)
    const callRho = (K * t * ert * N_d2) / 100;
    const putRho = (-K * t * ert * N_minus_d2) / 100;

    return {
        isValid: true,
        spotPrice: S,
        strikePrice: K,
        daysToExpiry: days,
        volatilityPercent: vol,
        riskFreeRatePercent: rRate,
        callPrice: Math.round(callPrice * 100) / 100,
        putPrice: Math.round(putPrice * 100) / 100,
        intrinsicCall: Math.round(intrinsicCall * 100) / 100,
        intrinsicPut: Math.round(intrinsicPut * 100) / 100,
        timeValueCall: Math.round(timeValueCall * 100) / 100,
        timeValuePut: Math.round(timeValuePut * 100) / 100,
        moneyness,
        callDelta: Math.round(callDelta * 10000) / 10000,
        putDelta: Math.round(putDelta * 10000) / 10000,
        gamma: Math.round(gamma * 10000) / 10000,
        callThetaDaily: Math.round(callThetaDaily * 100) / 100,
        putThetaDaily: Math.round(putThetaDaily * 100) / 100,
        vega: Math.round(vega * 100) / 100,
        callRho: Math.round(callRho * 100) / 100,
        putRho: Math.round(putRho * 100) / 100,
    };
}

/**
 * Newton-Raphson Implied Volatility (IV) Solver
 * Computes Implied Volatility (%) from market option price
 */
export function calculateImpliedVolatility({
    marketPrice,
    optionType = "call",
    spotPrice,
    strikePrice,
    timeToExpiryDays,
    riskFreeRatePercent = 6.5,
    dividendYieldPercent = 0,
}) {
    const P_target = parseFloat(marketPrice);
    if (isNaN(P_target) || P_target <= 0) return null;

    let sigma = 0.25; // 25% initial guess
    const maxIter = 100;
    const tol = 1e-5;

    for (let iter = 0; iter < maxIter; iter++) {
        const bs = calculateBlackScholes({
            spotPrice,
            strikePrice,
            timeToExpiryDays,
            volatilityPercent: sigma * 100,
            riskFreeRatePercent,
            dividendYieldPercent,
        });

        if (!bs.isValid) break;

        const priceDiff = (optionType === "call" ? bs.callPrice : bs.putPrice) - P_target;
        if (Math.abs(priceDiff) < tol) {
            return Math.round(sigma * 100 * 100) / 100;
        }

        const vega100 = bs.vega * 100;
        if (Math.abs(vega100) < 1e-8) break;

        sigma = sigma - priceDiff / vega100;
        if (sigma <= 0.001) sigma = 0.001;
        if (sigma > 5.0) sigma = 5.0;
    }

    return Math.round(sigma * 100 * 100) / 100;
}

/**
 * What-If Scenario Projection Simulator
 * Simulates projected option price and P&L after spot move, days elapsed, and IV changes.
 */
export function calculateGreeksScenario({
    baseParams,
    spotMovePoints = 0,
    daysElapsed = 0,
    ivChangePercent = 0,
}) {
    const baseBS = calculateBlackScholes(baseParams);
    if (!baseBS.isValid) return null;

    const S_new = Math.max(1, baseBS.spotPrice + (parseFloat(spotMovePoints) || 0));
    const D_new = Math.max(0, baseBS.daysToExpiry - (parseFloat(daysElapsed) || 0));
    const IV_new = Math.max(0.1, baseBS.volatilityPercent + (parseFloat(ivChangePercent) || 0));

    const projBS = calculateBlackScholes({
        ...baseParams,
        spotPrice: S_new,
        timeToExpiryDays: D_new,
        volatilityPercent: IV_new,
    });

    if (!projBS.isValid) return null;

    const callPnl = projBS.callPrice - baseBS.callPrice;
    const putPnl = projBS.putPrice - baseBS.putPrice;

    return {
        baseBS,
        projBS,
        callPnl: Math.round(callPnl * 100) / 100,
        callPnlPercent: baseBS.callPrice > 0 ? Math.round((callPnl / baseBS.callPrice) * 100 * 100) / 100 : 0,
        putPnl: Math.round(putPnl * 100) / 100,
        putPnlPercent: baseBS.putPrice > 0 ? Math.round((putPnl / baseBS.putPrice) * 100 * 100) / 100 : 0,
    };
}

/**
 * Format currency helper
 */
export function formatCurrency(value, currencySymbol = "₹") {
    if (value == null || isNaN(value)) return `${currencySymbol} 0`;
    const formatted = Math.abs(value) >= 10000
        ? Number(value.toFixed(2)).toLocaleString("en-IN", { maximumFractionDigits: 2 })
        : Number(value.toFixed(2)).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return `${value < 0 ? "−" : ""}${currencySymbol} ${formatted}`;
}
