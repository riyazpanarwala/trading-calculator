import React, { useState, useMemo, useRef } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    Platform,
    Alert,
} from "react-native";
import { captureRef } from "react-native-view-shot";
import * as Sharing from "expo-sharing";
import styles, { lightTheme, darkTheme } from "./styles";
import {
    calculateSwpResult,
    calculateSwpYearlyBreakdown,
    calculateSorrComparison,
    calculateInflationAdjustedValue,
    calculateRequiredFutureWithdrawal,
    formatCurrency,
    formatCompactCurrency,
} from "../utils/swpCalculations";

const PRESET_CORPUS = [
    { label: "₹10L", val: "1000000" },
    { label: "₹25L", val: "2500000" },
    { label: "₹50L", val: "5000000" },
    { label: "₹1Cr", val: "10000000" },
];

const PRESET_WITHDRAWALS = [
    { label: "₹20K", val: "20000" },
    { label: "₹35K", val: "35000" },
    { label: "₹50K", val: "50000" },
    { label: "₹75K", val: "75000" },
    { label: "₹1L", val: "100000" },
];

const QUICK_RATES = [8, 10, 12, 14];
const QUICK_YEARS = [5, 10, 15, 20, 25, 30];
const QUICK_STEP_UP = [0, 3, 5, 7, 10];
const QUICK_INFLATION = [4, 6, 7, 8];

export default function SwpCalculatorScreen({ theme = "dark", setTheme }) {
    const activeTheme = theme === "light" ? lightTheme : darkTheme;
    const captureViewRef = useRef(null);
    const [sharing, setSharing] = useState(false);

    // Inputs
    const [initialInvestment, setInitialInvestment] = useState("5000000");
    const [monthlyWithdrawal, setMonthlyWithdrawal] = useState("35000");
    const [annualRate, setAnnualRate] = useState("10");
    const [years, setYears] = useState("15");
    const [stepUpPercent, setStepUpPercent] = useState("0");

    // Feature 1: SWP Tax Deduction
    const [deductSwpTax, setDeductSwpTax] = useState(false);
    const [swpTaxType, setSwpTaxType] = useState("equity_ltcg"); // "equity_ltcg" | "debt_slab"
    const [swpTaxRate, setSwpTaxRate] = useState("12.5");
    const [swpTaxExemption, setSwpTaxExemption] = useState("125000");

    // Feature 2: Inflation Adjustment
    const [adjustInflation, setAdjustInflation] = useState(false);
    const [inflationRate, setInflationRate] = useState("6");

    // Feature 3: Sequence of Returns Risk (SORR)
    const [sorrScenario, setSorrScenario] = useState("steady"); // "steady" | "early_crash" | "early_bull"
    const [showSorrComparison, setShowSorrComparison] = useState(true);

    const stepUpNum = Math.max(0, parseFloat(stepUpPercent) || 0);
    const inflationNum = Math.max(0, parseFloat(inflationRate) || 0);
    const horizonYears = Math.max(1, parseFloat(years) || 1);

    // Calculations
    const result = useMemo(() => {
        return calculateSwpResult({
            initialInvestment,
            monthlyWithdrawal,
            annualRate,
            years,
            stepUpPercent: stepUpNum,
            deductSwpTax,
            swpTaxRate,
            swpTaxExemption,
            swpTaxType,
            sorrScenario,
        });
    }, [initialInvestment, monthlyWithdrawal, annualRate, years, stepUpNum, deductSwpTax, swpTaxRate, swpTaxExemption, swpTaxType, sorrScenario]);

    const sorrComp = useMemo(() => {
        return calculateSorrComparison({
            initialInvestment,
            monthlyWithdrawal,
            annualRate,
            years,
            stepUpPercent: stepUpNum,
            deductSwpTax,
            swpTaxRate,
            swpTaxExemption,
            swpTaxType,
        });
    }, [initialInvestment, monthlyWithdrawal, annualRate, years, stepUpNum, deductSwpTax, swpTaxRate, swpTaxExemption, swpTaxType]);

    const realFinalBalance = useMemo(() => {
        if (!adjustInflation) return result.finalBalance;
        return calculateInflationAdjustedValue(result.finalBalance, inflationNum, horizonYears);
    }, [adjustInflation, result.finalBalance, inflationNum, horizonYears]);

    const requiredFutureMonthlyW = useMemo(() => {
        if (!adjustInflation) return result.finalMonthlyWithdrawal;
        return calculateRequiredFutureWithdrawal(result.finalMonthlyWithdrawal, inflationNum, horizonYears);
    }, [adjustInflation, result.finalMonthlyWithdrawal, inflationNum, horizonYears]);

    const purchasingPowerLossPct = useMemo(() => {
        if (!adjustInflation || result.finalBalance <= 0) return 0;
        return Math.max(0, ((result.finalBalance - realFinalBalance) / result.finalBalance) * 100);
    }, [adjustInflation, result.finalBalance, realFinalBalance]);

    const milestones = useMemo(() => {
        const list = calculateSwpYearlyBreakdown({
            initialInvestment,
            monthlyWithdrawal,
            annualRate,
            years,
            stepUpPercent: stepUpNum,
            deductSwpTax,
            swpTaxRate,
            swpTaxExemption,
            swpTaxType,
            sorrScenario,
        });

        if (adjustInflation) {
            return list.map((m) => ({
                ...m,
                realClosingBalance: calculateInflationAdjustedValue(m.closingBalance, inflationNum, m.year),
            }));
        }
        return list;
    }, [initialInvestment, monthlyWithdrawal, annualRate, years, stepUpNum, deductSwpTax, swpTaxRate, swpTaxExemption, swpTaxType, sorrScenario, adjustInflation, inflationNum]);

    const handleReset = () => {
        setInitialInvestment("5000000");
        setMonthlyWithdrawal("35000");
        setAnnualRate("10");
        setYears("15");
        setStepUpPercent("0");
        setDeductSwpTax(false);
        setSwpTaxType("equity_ltcg");
        setSwpTaxRate("12.5");
        setSwpTaxExemption("125000");
        setAdjustInflation(false);
        setInflationRate("6");
        setSorrScenario("steady");
    };

    const handleShare = async () => {
        try {
            setSharing(true);

            if (Platform.OS === "web") {
                const domNode = captureViewRef.current;
                if (!domNode) throw new Error("Could not find view element on web.");

                const html2canvas = require("html2canvas");
                const canvas = await html2canvas(domNode, {
                    useCORS: true,
                    logging: false,
                    scale: 2,
                });
                const dataUrl = canvas.toDataURL("image/png");

                if (!dataUrl) throw new Error("Could not capture view screenshot on web.");

                let shared = false;
                if (typeof navigator !== "undefined" && navigator.share && navigator.canShare) {
                    try {
                        const response = await fetch(dataUrl);
                        const blob = await response.blob();
                        const file = new File([blob], "swp-plan.png", { type: "image/png" });

                        const taxText = deductSwpTax ? `, Net Cashflow: ${formatCurrency(result.totalNetWithdrawn)} (Tax: ${formatCurrency(result.totalTaxPaid)})` : "";
                        const inflationText = adjustInflation ? `, Real Balance (@${inflationNum}% inf): ${formatCurrency(realFinalBalance)}` : "";

                        const shareText = `SWP Retirement Plan: Initial Corpus ${formatCurrency(result.totalInvested)}, Withdrawn: ${formatCurrency(result.totalWithdrawn)}${taxText}, Remaining Balance: ${formatCurrency(result.finalBalance)} over ${years} yrs${inflationText}`;

                        if (navigator.canShare({ files: [file] })) {
                            await navigator.share({
                                title: "Systematic Withdrawal Plan (SWP)",
                                text: shareText,
                                files: [file],
                            });
                            shared = true;
                        }
                    } catch (shareErr) {
                        if (shareErr.name !== "AbortError") {
                            console.warn("Web Share API error:", shareErr);
                        } else {
                            shared = true;
                        }
                    }
                }

                if (!shared && typeof document !== "undefined") {
                    const link = document.createElement("a");
                    link.href = dataUrl;
                    link.download = `swp-plan-${Date.now()}.png`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                }
            } else {
                const uri = await captureRef(captureViewRef, {
                    format: "png",
                    quality: 0.95,
                });

                if (await Sharing.isAvailableAsync()) {
                    await Sharing.shareAsync(uri, {
                        mimeType: "image/png",
                        dialogTitle: "Share SWP Plan",
                    });
                } else {
                    Alert.alert("Saved", "Screenshot captured successfully.");
                }
            }
        } catch (err) {
            console.error("Share error:", err);
            Alert.alert("Share Failed", err.message || "Could not export SWP plan.");
        } finally {
            setSharing(false);
        }
    };

    return (
        <ScrollView style={[styles.container, activeTheme.container]} contentContainerStyle={styles.contentWrapper}>
            <View ref={captureViewRef} collapsable={false}>

                {/* ── Main Input Card ── */}
                <View style={[styles.cardWrapper, activeTheme.card]}>
                    {/* ── Header ── */}
                    <View style={styles.header}>
                        <Text style={[styles.title, activeTheme.title]}>
                            🏖️ SWP Retirement Calculator
                        </Text>
                        <View style={styles.headerButtons}>
                            <TouchableOpacity
                                style={[styles.themeToggle, activeTheme.toggle]}
                                onPress={handleReset}
                                activeOpacity={0.7}
                            >
                                <Text style={[styles.themeToggleText, { color: activeTheme.title.color }]}>🗑 Reset</Text>
                            </TouchableOpacity>
                            {setTheme && (
                                <TouchableOpacity
                                    style={[styles.themeToggle, activeTheme.toggle]}
                                    onPress={() => setTheme((t) => (t === "light" ? "dark" : "light"))}
                                    activeOpacity={0.7}
                                >
                                    <Text style={[styles.themeToggleText, { color: activeTheme.title.color }]}>
                                        {theme === "light" ? "🌙 Dark" : "☀️ Light"}
                                    </Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>

                    {/* ── Input Grid ── */}
                    <View style={styles.grid}>
                        {/* Initial Investment Corpus */}
                        <View style={styles.fullCol}>
                            <Text style={[styles.label, activeTheme.label]}>
                                Initial Investment Corpus (₹)
                            </Text>
                            <TextInput
                                style={[styles.input, activeTheme.input, { borderColor: activeTheme.borderColor }]}
                                keyboardType="numeric"
                                value={initialInvestment}
                                placeholder="e.g. 5000000"
                                placeholderTextColor={activeTheme.placeholder.color}
                                onChangeText={setInitialInvestment}
                            />
                            <View style={styles.chipRow}>
                                {PRESET_CORPUS.map((c) => {
                                    const isSelected = c.val === String(initialInvestment).trim();
                                    return (
                                        <TouchableOpacity
                                            key={c.val}
                                            style={[
                                                styles.chip,
                                                isSelected ? activeTheme.tabActive : activeTheme.toggle,
                                                { borderColor: isSelected ? activeTheme.investedColor : activeTheme.borderColor },
                                            ]}
                                            onPress={() => setInitialInvestment(c.val)}
                                            activeOpacity={0.7}
                                        >
                                            <Text
                                                style={[
                                                    styles.chipText,
                                                    isSelected ? activeTheme.tabActiveText : { color: activeTheme.title.color },
                                                ]}
                                            >
                                                {c.label}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        </View>

                        {/* Monthly Withdrawal */}
                        <View style={styles.col}>
                            <Text style={[styles.label, activeTheme.label]}>
                                Monthly Withdrawal (₹)
                            </Text>
                            <TextInput
                                style={[styles.input, activeTheme.input, { borderColor: activeTheme.borderColor }]}
                                keyboardType="numeric"
                                value={monthlyWithdrawal}
                                placeholder="e.g. 35000"
                                placeholderTextColor={activeTheme.placeholder.color}
                                onChangeText={setMonthlyWithdrawal}
                            />
                            <View style={styles.chipRow}>
                                {PRESET_WITHDRAWALS.slice(0, 3).map((w) => {
                                    const isSelected = w.val === String(monthlyWithdrawal).trim();
                                    return (
                                        <TouchableOpacity
                                            key={w.val}
                                            style={[
                                                styles.chip,
                                                isSelected ? activeTheme.tabActive : activeTheme.toggle,
                                                { borderColor: isSelected ? activeTheme.investedColor : activeTheme.borderColor },
                                            ]}
                                            onPress={() => setMonthlyWithdrawal(w.val)}
                                            activeOpacity={0.7}
                                        >
                                            <Text
                                                style={[
                                                    styles.chipText,
                                                    isSelected ? activeTheme.tabActiveText : { color: activeTheme.title.color },
                                                ]}
                                            >
                                                {w.label}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        </View>

                        {/* Expected Return Rate */}
                        <View style={styles.col}>
                            <Text style={[styles.label, activeTheme.label]}>
                                Expected Return Rate (% p.a.)
                            </Text>
                            <TextInput
                                style={[styles.input, activeTheme.input, { borderColor: activeTheme.borderColor }]}
                                keyboardType="numeric"
                                value={annualRate}
                                placeholder="e.g. 10"
                                placeholderTextColor={activeTheme.placeholder.color}
                                onChangeText={setAnnualRate}
                            />
                            <View style={styles.chipRow}>
                                {QUICK_RATES.map((rt) => {
                                    const isSelected = String(rt) === String(annualRate).trim();
                                    return (
                                        <TouchableOpacity
                                            key={rt}
                                            style={[
                                                styles.chip,
                                                isSelected ? activeTheme.tabActive : activeTheme.toggle,
                                                { borderColor: isSelected ? activeTheme.investedColor : activeTheme.borderColor },
                                            ]}
                                            onPress={() => setAnnualRate(String(rt))}
                                            activeOpacity={0.7}
                                        >
                                            <Text
                                                style={[
                                                    styles.chipText,
                                                    isSelected ? activeTheme.tabActiveText : { color: activeTheme.title.color },
                                                ]}
                                            >
                                                {rt}%
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        </View>

                        {/* Investment Duration */}
                        <View style={styles.col}>
                            <Text style={[styles.label, activeTheme.label]}>
                                Time Horizon (Years)
                            </Text>
                            <TextInput
                                style={[styles.input, activeTheme.input, { borderColor: activeTheme.borderColor }]}
                                keyboardType="numeric"
                                value={years}
                                placeholder="e.g. 15"
                                placeholderTextColor={activeTheme.placeholder.color}
                                onChangeText={setYears}
                            />
                            <View style={styles.chipRow}>
                                {QUICK_YEARS.slice(0, 4).map((yr) => {
                                    const isSelected = String(yr) === String(years).trim();
                                    return (
                                        <TouchableOpacity
                                            key={yr}
                                            style={[
                                                styles.chip,
                                                isSelected ? activeTheme.tabActive : activeTheme.toggle,
                                                { borderColor: isSelected ? activeTheme.investedColor : activeTheme.borderColor },
                                            ]}
                                            onPress={() => setYears(String(yr))}
                                            activeOpacity={0.7}
                                        >
                                            <Text
                                                style={[
                                                    styles.chipText,
                                                    isSelected ? activeTheme.tabActiveText : { color: activeTheme.title.color },
                                                ]}
                                            >
                                                {yr}Y
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        </View>

                        {/* Annual Step-Up Withdrawal */}
                        <View style={styles.col}>
                            <Text style={[styles.label, activeTheme.label]}>
                                Step-Up Withdrawal (% / Year)
                            </Text>
                            <TextInput
                                style={[styles.input, activeTheme.input, { borderColor: activeTheme.borderColor }]}
                                keyboardType="numeric"
                                value={stepUpPercent}
                                placeholder="e.g. 5"
                                placeholderTextColor={activeTheme.placeholder.color}
                                onChangeText={setStepUpPercent}
                            />
                            <View style={styles.chipRow}>
                                {QUICK_STEP_UP.slice(0, 4).map((su) => {
                                    const isSelected = String(su) === String(stepUpPercent).trim();
                                    return (
                                        <TouchableOpacity
                                            key={su}
                                            style={[
                                                styles.chip,
                                                isSelected ? activeTheme.tabActive : activeTheme.toggle,
                                                { borderColor: isSelected ? activeTheme.investedColor : activeTheme.borderColor },
                                            ]}
                                            onPress={() => setStepUpPercent(String(su))}
                                            activeOpacity={0.7}
                                        >
                                            <Text
                                                style={[
                                                    styles.chipText,
                                                    isSelected ? activeTheme.tabActiveText : { color: activeTheme.title.color },
                                                ]}
                                            >
                                                {su === 0 ? "0%" : `+${su}%`}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        </View>
                    </View>

                    {/* Withdrawal Rate Health Badge */}
                    <View style={{ marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: activeTheme.borderColor }}>
                        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                            <Text style={[styles.label, activeTheme.label, { fontSize: 13 }]}>
                                Initial Withdrawal Rate: <Text style={{ fontWeight: "800", color: activeTheme.title.color }}>{result.initialAnnualWithdrawalRate}% p.a.</Text>
                            </Text>
                            <View
                                style={[
                                    styles.phaseBadge,
                                    {
                                        backgroundColor:
                                            result.initialAnnualWithdrawalRate <= 6
                                                ? "#064E3B"
                                                : result.initialAnnualWithdrawalRate <= 9
                                                ? "#451A03"
                                                : "#451A22",
                                    },
                                ]}
                            >
                                <Text
                                    style={[
                                        styles.phaseBadgeText,
                                        {
                                            color:
                                                result.initialAnnualWithdrawalRate <= 6
                                                    ? "#34D399"
                                                    : result.initialAnnualWithdrawalRate <= 9
                                                    ? "#FBBF24"
                                                    : "#F87171",
                                        },
                                    ]}
                                >
                                    {result.initialAnnualWithdrawalRate <= 6
                                        ? "🛡️ Very Safe (≤6%)"
                                        : result.initialAnnualWithdrawalRate <= 9
                                        ? "⚠️ Moderate (6–9%)"
                                        : "🔥 High Depletion Risk (>9%)"}
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* ── Feature 1: SWP Redemption Tax Toggle Card ── */}
                <View
                    style={[
                        styles.inflationCard,
                        activeTheme.card,
                        {
                            borderColor: deductSwpTax ? "#10B981" : activeTheme.borderColor,
                            marginBottom: 12,
                        },
                    ]}
                >
                    <View style={styles.inflationHeaderRow}>
                        <View style={styles.inflationTitleCol}>
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                                <Text style={{ fontSize: 15 }}>⚖️</Text>
                                <Text style={[styles.inflationTitle, activeTheme.title]}>
                                    SWP Redemption Tax Deduction
                                </Text>
                            </View>
                            <Text style={[styles.inflationSubtitle, activeTheme.subtext]}>
                                {deductSwpTax
                                    ? `Taxing redeemed gains at ${swpTaxRate}% (${swpTaxType === "equity_ltcg" ? "Equity LTCG" : "Debt / Slab Rate"})`
                                    : "Deduct tax on the capital gains component of each monthly withdrawal"}
                            </Text>
                        </View>

                        <TouchableOpacity
                            style={[
                                styles.inflationToggleBtn,
                                deductSwpTax ? activeTheme.tabActive : activeTheme.toggle,
                                {
                                    borderColor: deductSwpTax ? activeTheme.investedColor : activeTheme.borderColor,
                                },
                            ]}
                            onPress={() => setDeductSwpTax((prev) => !prev)}
                            activeOpacity={0.8}
                        >
                            <Text
                                style={[
                                    styles.inflationToggleBtnText,
                                    deductSwpTax ? activeTheme.tabActiveText : { color: activeTheme.title.color },
                                ]}
                            >
                                {deductSwpTax ? "✓ Active" : "Enable"}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {deductSwpTax && (
                        <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: activeTheme.borderColor }}>
                            {/* Asset Type Switcher */}
                            <Text style={[styles.label, activeTheme.label, { fontSize: 12, marginBottom: 4 }]}>
                                Asset Class / Tax Category:
                            </Text>
                            <View style={{ flexDirection: "row", gap: 8, marginBottom: 12 }}>
                                <TouchableOpacity
                                    style={[
                                        styles.chip,
                                        swpTaxType === "equity_ltcg" ? activeTheme.tabActive : activeTheme.toggle,
                                        { flex: 1, alignItems: "center", justifyContent: "center", borderColor: swpTaxType === "equity_ltcg" ? activeTheme.investedColor : activeTheme.borderColor, paddingVertical: 6 },
                                    ]}
                                    onPress={() => {
                                        setSwpTaxType("equity_ltcg");
                                        setSwpTaxRate("12.5");
                                    }}
                                    activeOpacity={0.7}
                                >
                                    <Text style={[styles.chipText, swpTaxType === "equity_ltcg" ? activeTheme.tabActiveText : { color: activeTheme.title.color }, { fontSize: 12 }]}>
                                        📈 Equity LTCG (12.5%)
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[
                                        styles.chip,
                                        swpTaxType === "debt_slab" ? activeTheme.tabActive : activeTheme.toggle,
                                        { flex: 1, alignItems: "center", justifyContent: "center", borderColor: swpTaxType === "debt_slab" ? activeTheme.investedColor : activeTheme.borderColor, paddingVertical: 6 },
                                    ]}
                                    onPress={() => {
                                        setSwpTaxType("debt_slab");
                                        setSwpTaxRate("20");
                                    }}
                                    activeOpacity={0.7}
                                >
                                    <Text style={[styles.chipText, swpTaxType === "debt_slab" ? activeTheme.tabActiveText : { color: activeTheme.title.color }, { fontSize: 12 }]}>
                                        🏦 Debt / Slab Rate
                                    </Text>
                                </TouchableOpacity>
                            </View>

                            <View style={{ flexDirection: "row", gap: 12 }}>
                                <View style={{ flex: 1 }}>
                                    <Text style={[styles.label, activeTheme.label, { fontSize: 12 }]}>
                                        Tax Rate (%)
                                    </Text>
                                    <TextInput
                                        style={[styles.input, activeTheme.input, { borderColor: activeTheme.borderColor, paddingVertical: 6, fontSize: 13 }]}
                                        keyboardType="numeric"
                                        value={swpTaxRate}
                                        placeholder="12.5"
                                        placeholderTextColor={activeTheme.placeholder.color}
                                        onChangeText={setSwpTaxRate}
                                    />
                                </View>
                                {swpTaxType === "equity_ltcg" && (
                                    <View style={{ flex: 1 }}>
                                        <Text style={[styles.label, activeTheme.label, { fontSize: 12 }]}>
                                            Annual Exemption (₹)
                                        </Text>
                                        <TextInput
                                            style={[styles.input, activeTheme.input, { borderColor: activeTheme.borderColor, paddingVertical: 6, fontSize: 13 }]}
                                            keyboardType="numeric"
                                            value={swpTaxExemption}
                                            placeholder="125000"
                                            placeholderTextColor={activeTheme.placeholder.color}
                                            onChangeText={setSwpTaxExemption}
                                        />
                                    </View>
                                )}
                            </View>
                        </View>
                    )}
                </View>

                {/* ── Feature 2: Inflation Adjustment Toggle Card ── */}
                <View
                    style={[
                        styles.inflationCard,
                        activeTheme.card,
                        {
                            borderColor: adjustInflation
                                ? activeTheme.inflationColor || "#F59E0B"
                                : activeTheme.borderColor,
                            marginBottom: 12,
                        },
                    ]}
                >
                    <View style={styles.inflationHeaderRow}>
                        <View style={styles.inflationTitleCol}>
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                                <Text style={{ fontSize: 15 }}>🎈</Text>
                                <Text style={[styles.inflationTitle, activeTheme.title]}>
                                    Adjust for Inflation (Purchasing Power)
                                </Text>
                            </View>
                            <Text style={[styles.inflationSubtitle, activeTheme.subtext]}>
                                {adjustInflation
                                    ? `Discounting corpus & income at ${inflationRate}% p.a. inflation`
                                    : "Calculate real value of future corpus & pension requirement"}
                            </Text>
                        </View>

                        <TouchableOpacity
                            style={[
                                styles.inflationToggleBtn,
                                adjustInflation ? activeTheme.tabActive : activeTheme.toggle,
                                {
                                    borderColor: adjustInflation
                                        ? activeTheme.investedColor
                                        : activeTheme.borderColor,
                                },
                            ]}
                            onPress={() => setAdjustInflation((prev) => !prev)}
                            activeOpacity={0.8}
                        >
                            <Text
                                style={[
                                    styles.inflationToggleBtnText,
                                    adjustInflation
                                        ? activeTheme.tabActiveText
                                        : { color: activeTheme.title.color },
                                ]}
                            >
                                {adjustInflation ? "✓ Active" : "Enable"}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {adjustInflation && (
                        <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: activeTheme.borderColor }}>
                            <Text style={[styles.label, activeTheme.label]}>
                                Expected Inflation Rate (% p.a.)
                            </Text>
                            <TextInput
                                style={[styles.input, activeTheme.input, { borderColor: activeTheme.borderColor }]}
                                keyboardType="numeric"
                                value={inflationRate}
                                placeholder="e.g. 6"
                                placeholderTextColor={activeTheme.placeholder.color}
                                onChangeText={setInflationRate}
                            />
                            <View style={styles.chipRow}>
                                {QUICK_INFLATION.map((inf) => {
                                    const isSelected = String(inf) === String(inflationRate).trim();
                                    return (
                                        <TouchableOpacity
                                            key={inf}
                                            style={[
                                                styles.chip,
                                                isSelected ? activeTheme.tabActive : activeTheme.toggle,
                                                { borderColor: isSelected ? activeTheme.investedColor : activeTheme.borderColor },
                                            ]}
                                            onPress={() => setInflationRate(String(inf))}
                                            activeOpacity={0.7}
                                        >
                                            <Text
                                                style={[
                                                    styles.chipText,
                                                    isSelected ? activeTheme.tabActiveText : { color: activeTheme.title.color },
                                                ]}
                                            >
                                                {inf}% {inf === 6 ? "(India Avg)" : ""}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        </View>
                    )}
                </View>

                {/* ── Feature 3: Sequence of Returns Risk (SORR) Market Simulator Card ── */}
                <View style={[styles.cardWrapper, activeTheme.card, { marginBottom: 16 }]}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                            <Text style={{ fontSize: 16 }}>📉</Text>
                            <Text style={[styles.title, activeTheme.title, { fontSize: 16 }]}>
                                Sequence of Returns Risk (SORR) Simulator
                            </Text>
                        </View>
                        <TouchableOpacity
                            onPress={() => setShowSorrComparison((prev) => !prev)}
                            style={[styles.chip, activeTheme.toggle, { paddingHorizontal: 10, paddingVertical: 4 }]}
                        >
                            <Text style={{ fontSize: 12, fontWeight: "600", color: activeTheme.title.color }}>
                                {showSorrComparison ? "Hide ▲" : "Show ▼"}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    <Text style={[styles.subtext, activeTheme.subtext, { fontSize: 12, marginBottom: 12 }]}>
                        Market crashes early in retirement drastically accelerate portfolio depletion compared to steady growth.
                    </Text>

                    <View style={{ flexDirection: "row", gap: 8, marginBottom: 12 }}>
                        {[
                            { label: "🎯 Steady (Flat)", key: "steady" },
                            { label: "📉 Early Crash (-15%)", key: "early_crash" },
                            { label: "🚀 Early Bull (+22%)", key: "early_bull" },
                        ].map((s) => {
                            const isSelected = sorrScenario === s.key;
                            return (
                                <TouchableOpacity
                                    key={s.key}
                                    style={[
                                        styles.chip,
                                        isSelected ? activeTheme.tabActive : activeTheme.toggle,
                                        { flex: 1, alignItems: "center", justifyContent: "center", borderColor: isSelected ? activeTheme.investedColor : activeTheme.borderColor, paddingVertical: 6 },
                                    ]}
                                    onPress={() => setSorrScenario(s.key)}
                                    activeOpacity={0.7}
                                >
                                    <Text style={[styles.chipText, isSelected ? activeTheme.tabActiveText : { color: activeTheme.title.color }, { fontSize: 11 }]}>
                                        {s.label}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    {showSorrComparison && (
                        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, justifyContent: "space-between", marginTop: 6 }}>
                            {/* Steady */}
                            <View style={[{ width: "31%", minWidth: 140, padding: 12, borderRadius: 12, borderWidth: sorrScenario === "steady" ? 2 : 1, borderColor: "#3B82F6" }, activeTheme.card]}>
                                <Text style={{ fontSize: 13, fontWeight: "800", color: "#3B82F6", marginBottom: 4 }}>🎯 Steady</Text>
                                <Text style={{ fontSize: 10, color: activeTheme.subtext.color }}>Total Withdrawn</Text>
                                <Text style={{ fontSize: 12, fontWeight: "600", color: "#10B981", marginBottom: 4 }}>
                                    {formatCompactCurrency(sorrComp.steady.totalWithdrawn)}
                                </Text>
                                <Text style={{ fontSize: 10, color: activeTheme.subtext.color }}>Final Balance</Text>
                                <Text style={{ fontSize: 13, fontWeight: "800", color: sorrComp.steady.isDepleted ? "#EF4444" : "#3B82F6" }}>
                                    {sorrComp.steady.isDepleted ? "Depleted" : formatCompactCurrency(sorrComp.steady.finalBalance)}
                                </Text>
                            </View>

                            {/* Early Crash */}
                            <View style={[{ width: "31%", minWidth: 140, padding: 12, borderRadius: 12, borderWidth: sorrScenario === "early_crash" ? 2 : 1, borderColor: "#EF4444" }, activeTheme.card]}>
                                <Text style={{ fontSize: 13, fontWeight: "800", color: "#EF4444", marginBottom: 4 }}>📉 Early Crash</Text>
                                <Text style={{ fontSize: 10, color: activeTheme.subtext.color }}>Total Withdrawn</Text>
                                <Text style={{ fontSize: 12, fontWeight: "600", color: "#10B981", marginBottom: 4 }}>
                                    {formatCompactCurrency(sorrComp.earlyCrash.totalWithdrawn)}
                                </Text>
                                <Text style={{ fontSize: 10, color: activeTheme.subtext.color }}>Final Balance</Text>
                                <Text style={{ fontSize: 13, fontWeight: "800", color: sorrComp.earlyCrash.isDepleted ? "#EF4444" : "#F59E0B" }}>
                                    {sorrComp.earlyCrash.isDepleted ? `Depleted (Yr ${sorrComp.earlyCrash.depletedYears})` : formatCompactCurrency(sorrComp.earlyCrash.finalBalance)}
                                </Text>
                            </View>

                            {/* Early Bull */}
                            <View style={[{ width: "31%", minWidth: 140, padding: 12, borderRadius: 12, borderWidth: sorrScenario === "early_bull" ? 2 : 1, borderColor: "#10B981" }, activeTheme.card]}>
                                <Text style={{ fontSize: 13, fontWeight: "800", color: "#10B981", marginBottom: 4 }}>🚀 Early Bull</Text>
                                <Text style={{ fontSize: 10, color: activeTheme.subtext.color }}>Total Withdrawn</Text>
                                <Text style={{ fontSize: 12, fontWeight: "600", color: "#10B981", marginBottom: 4 }}>
                                    {formatCompactCurrency(sorrComp.earlyBull.totalWithdrawn)}
                                </Text>
                                <Text style={{ fontSize: 10, color: activeTheme.subtext.color }}>Final Balance</Text>
                                <Text style={{ fontSize: 13, fontWeight: "800", color: "#10B981" }}>
                                    {formatCompactCurrency(sorrComp.earlyBull.finalBalance)}
                                </Text>
                            </View>
                        </View>
                    )}
                </View>

                {/* ── Results Summary Card ── */}
                <View style={[styles.metricCard, activeTheme.card, { borderColor: activeTheme.borderColor }]}>
                    <View style={styles.metricRow}>
                        <Text style={[styles.metricLabel, activeTheme.subtext]}>
                            Initial Investment Corpus
                        </Text>
                        <Text style={[styles.metricValue, { color: activeTheme.investedColor }]}>
                            {formatCurrency(result.totalInvested)}
                        </Text>
                    </View>

                    <View style={[styles.metricDivider, { backgroundColor: activeTheme.borderColor }]} />

                    <View style={styles.metricRow}>
                        <Text style={[styles.metricLabel, activeTheme.subtext]}>
                            Total Gross Withdrawn ({years} Yrs)
                        </Text>
                        <Text style={[styles.metricValue, { color: activeTheme.returnsColor }]}>
                            {formatCurrency(result.totalWithdrawn)}
                        </Text>
                    </View>

                    {/* Tax Breakdown Row */}
                    {deductSwpTax && (
                        <>
                            <View style={[styles.metricDivider, { backgroundColor: activeTheme.borderColor }]} />
                            <View style={styles.metricRow}>
                                <Text style={[styles.metricLabel, { color: "#EF4444" }]}>
                                    Total Redemption Tax Paid
                                </Text>
                                <Text style={[styles.metricValue, { color: "#EF4444" }]}>
                                    -{formatCurrency(result.totalTaxPaid)}
                                </Text>
                            </View>

                            <View style={[styles.metricDivider, { backgroundColor: activeTheme.borderColor }]} />
                            <View style={styles.metricRow}>
                                <Text style={[styles.metricLabel, { color: "#10B981", fontWeight: "700" }]}>
                                    Net In-Hand Pension Received
                                </Text>
                                <Text style={[styles.metricValue, { color: "#10B981", fontWeight: "800" }]}>
                                    {formatCurrency(result.totalNetWithdrawn)}
                                </Text>
                            </View>
                        </>
                    )}

                    <View style={[styles.metricDivider, { backgroundColor: activeTheme.borderColor }]} />

                    {/* Final Balance / Depletion Banner */}
                    <View style={styles.metricRow}>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.totalMetricLabel, activeTheme.title]}>
                                Remaining Corpus Balance
                            </Text>
                            {result.isEvergreen && (
                                <Text style={{ fontSize: 11, fontWeight: "700", color: "#10B981", marginTop: 2 }}>
                                    🌱 Evergreen Portfolio (Corpus Grows Forever!)
                                </Text>
                            )}
                            {result.isDepleted && (
                                <Text style={{ fontSize: 11, fontWeight: "700", color: "#EF4444", marginTop: 2 }}>
                                    ⚠️ Depleted in {result.depletedYears} Yrs {result.depletedExtraMonths > 0 ? `${result.depletedExtraMonths} Mos` : ""}
                                </Text>
                            )}
                        </View>
                        <Text
                            style={[
                                styles.totalMetricValue,
                                {
                                    color: result.isDepleted
                                        ? "#EF4444"
                                        : result.isEvergreen
                                        ? "#10B981"
                                        : activeTheme.title.color,
                                },
                            ]}
                        >
                            {formatCurrency(result.finalBalance)}
                        </Text>
                    </View>

                    {/* Real Purchasing Power of Remaining Corpus */}
                    {adjustInflation && (
                        <>
                            <View style={[styles.metricDivider, { backgroundColor: activeTheme.borderColor, marginVertical: 8 }]} />
                            <View style={styles.metricRow}>
                                <View style={{ flex: 1, paddingRight: 8 }}>
                                    <Text style={[styles.totalMetricLabel, { color: activeTheme.inflationColor || "#F59E0B" }]}>
                                        Today's Real Purchasing Power
                                    </Text>
                                    <View
                                        style={[
                                            styles.erosionBadge,
                                            { backgroundColor: activeTheme.inflationBg || "#FEF3C7" },
                                        ]}
                                    >
                                        <Text
                                            style={[
                                                styles.erosionBadgeText,
                                                { color: activeTheme.inflationText || "#92400E" },
                                            ]}
                                        >
                                            -{purchasingPowerLossPct.toFixed(1)}% erosion (@{inflationRate}% inf)
                                        </Text>
                                    </View>
                                </View>
                                <Text
                                    style={[
                                        styles.totalMetricValue,
                                        { color: activeTheme.inflationColor || "#F59E0B" },
                                    ]}
                                >
                                    {formatCurrency(realFinalBalance)}
                                </Text>
                            </View>

                            {/* Required Future Monthly Income */}
                            <View style={[styles.metricDivider, { backgroundColor: activeTheme.borderColor, marginVertical: 8 }]} />
                            <View style={styles.metricRow}>
                                <View style={{ flex: 1 }}>
                                    <Text style={[styles.metricLabel, activeTheme.subtext]}>
                                        Required Monthly Income in Yr {years} to match purchasing power
                                    </Text>
                                </View>
                                <Text style={[styles.metricValue, { color: activeTheme.title.color, fontWeight: "700" }]}>
                                    {formatCurrency(requiredFutureMonthlyW)}/mo
                                </Text>
                            </View>
                        </>
                    )}
                </View>

                {/* ── Yearly Milestones Table ── */}
                {milestones.length > 0 && (
                    <View style={[styles.tableCard, activeTheme.card, { borderColor: activeTheme.borderColor, marginTop: 16 }]}>
                        <Text style={[styles.tableTitle, activeTheme.title]}>
                            📊 Annual Cashflow & Balance Ledger
                        </Text>

                        <View style={[styles.tableHeader, { backgroundColor: activeTheme.tableHeaderBg }]}>
                            <Text style={[styles.tableHeaderCell, { textAlign: "left", flex: 0.6 }, activeTheme.subtext]}>
                                Year
                            </Text>
                            <Text style={[styles.tableHeaderCell, activeTheme.subtext]}>
                                Withdrawn
                            </Text>
                            {deductSwpTax && (
                                <Text style={[styles.tableHeaderCell, { color: "#EF4444" }]}>
                                    Tax
                                </Text>
                            )}
                            <Text style={[styles.tableHeaderCell, activeTheme.subtext]}>
                                Returns
                            </Text>
                            <Text
                                style={[
                                    styles.tableHeaderCell,
                                    adjustInflation
                                        ? { color: activeTheme.inflationColor || "#F59E0B" }
                                        : activeTheme.title,
                                ]}
                            >
                                {adjustInflation ? "Real Balance" : "Closing"}
                            </Text>
                        </View>

                        {milestones.map((m) => (
                            <View
                                key={m.year}
                                style={[
                                    styles.tableRow,
                                    { borderBottomColor: activeTheme.borderColor },
                                    m.isDepleted ? { backgroundColor: "rgba(239, 68, 68, 0.08)" } : null,
                                ]}
                            >
                                <View style={{ flex: 0.6, justifyContent: "center" }}>
                                    <Text style={[styles.tableCell, { textAlign: "left" }, activeTheme.title]}>
                                        Yr {m.year}
                                    </Text>
                                    <Text style={{ fontSize: 10, color: activeTheme.subtext.color }}>
                                        {formatCurrency(m.monthlyWithdrawal)}/m
                                    </Text>
                                </View>

                                <Text style={[styles.tableCell, { color: activeTheme.returnsColor, fontWeight: "600" }]}>
                                    {formatCurrency(m.withdrawn)}
                                </Text>

                                {deductSwpTax && (
                                    <Text style={[styles.tableCell, { color: "#EF4444" }]}>
                                        {formatCurrency(m.taxPaid)}
                                    </Text>
                                )}

                                <Text style={[styles.tableCell, activeTheme.subtext]}>
                                    +{formatCurrency(m.returns)}
                                </Text>

                                <Text
                                    style={[
                                        styles.tableCell,
                                        { fontWeight: "700" },
                                        m.isDepleted
                                            ? { color: "#EF4444" }
                                            : adjustInflation
                                            ? { color: activeTheme.inflationColor || "#F59E0B" }
                                            : activeTheme.title,
                                    ]}
                                >
                                    {m.isDepleted
                                        ? "Depleted"
                                        : formatCurrency(adjustInflation ? m.realClosingBalance : m.closingBalance)}
                                </Text>
                            </View>
                        ))}
                    </View>
                )}

                {/* ── Share / Export Button ── */}
                <TouchableOpacity
                    style={[
                        styles.themeToggle,
                        activeTheme.toggle,
                        { marginVertical: 8, paddingVertical: 13, borderRadius: 12, borderWidth: 1, borderColor: activeTheme.borderColor, alignItems: "center" },
                    ]}
                    onPress={handleShare}
                    disabled={sharing}
                    activeOpacity={0.75}
                >
                    <Text style={{ fontSize: 14, fontWeight: "700", color: activeTheme.title.color }}>
                        {sharing ? "⏳ Generating..." : "📤 Share / Export SWP Plan"}
                    </Text>
                </TouchableOpacity>

            </View>
            <View style={{ height: 30 }} />
        </ScrollView>
    );
}
