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
    calculateSipResult,
    calculateYearlyBreakdown,
    calculateSipAndHoldResult,
    calculateSipAndHoldYearlyBreakdown,
    calculateSipMultiScenarios,
    calculateInflationAdjustedValue,
    formatCurrency,
    formatCompactCurrency,
} from "../utils/sipCalculations";
import SipDonutChart from "./SipDonutChart";

const QUICK_YEARS = [1, 3, 5, 10, 15, 20, 25, 30];
const QUICK_SIP_YEARS = [1, 3, 5, 7, 10, 15];
const QUICK_TOTAL_YEARS = [5, 10, 15, 20, 25, 30];
const QUICK_STEP_UP = [0, 5, 10, 15, 20];
const QUICK_INFLATION = [4, 6, 7, 8];

export default function SipCalculatorScreen({ theme = "dark", setTheme }) {
    const activeTheme = theme === "light" ? lightTheme : darkTheme;
    const captureViewRef = useRef(null);

    // Mode: "regular" (Monthly SIP) | "sip_hold" (SIP & Grow) | "lumpsum" (One-time)
    const [calcMode, setCalcMode] = useState("regular");
    const [investmentAmount, setInvestmentAmount] = useState("10000");
    const [annualRate, setAnnualRate] = useState("12");
    const [years, setYears] = useState("10");
    const [sipYears, setSipYears] = useState("5");
    const [totalYears, setTotalYears] = useState("20");
    const [stepUpPercent, setStepUpPercent] = useState("0");
    const [stepUpFrequency, setStepUpFrequency] = useState("annual"); // "annual" | "half_yearly" | "monthly"
    
    // Feature 1: LTCG Tax Deduction
    const [deductLtcgTax, setDeductLtcgTax] = useState(false);
    const [ltcgTaxRate, setLtcgTaxRate] = useState("12.5");
    const [ltcgExemption, setLtcgExemption] = useState("125000");

    // Inflation adjustment
    const [adjustInflation, setAdjustInflation] = useState(false);
    const [inflationRate, setInflationRate] = useState("6");

    // Feature 3: Multi-scenario comparisons
    const [bearRate, setBearRate] = useState("8");
    const [bullRate, setBullRate] = useState("15");
    const [showScenarios, setShowScenarios] = useState(true);

    const [sharing, setSharing] = useState(false);

    const isLumpsum = calcMode === "lumpsum";
    const isSipHold = calcMode === "sip_hold";
    const stepUpNum = isLumpsum ? 0 : Math.max(0, parseFloat(stepUpPercent) || 0);
    const inflationNum = Math.max(0, parseFloat(inflationRate) || 0);
    const effectiveHorizonYears = isSipHold ? (parseFloat(totalYears) || 0) : (parseFloat(years) || 0);

    // Calculations
    const result = useMemo(() => {
        const params = {
            investmentAmount,
            annualRate,
            years,
            sipYears,
            totalYears,
            stepUpPercent: stepUpNum,
            stepUpFrequency,
            isLumpsum,
            deductLtcgTax,
            ltcgTaxRate,
            ltcgExemption,
        };

        if (isSipHold) {
            return calculateSipAndHoldResult(params);
        }
        return calculateSipResult(params);
    }, [calcMode, investmentAmount, annualRate, years, sipYears, totalYears, isSipHold, isLumpsum, stepUpNum, stepUpFrequency, deductLtcgTax, ltcgTaxRate, ltcgExemption]);

    const realMaturityValue = useMemo(() => {
        const nominalVal = deductLtcgTax ? result.netMaturityValue : result.maturityValue;
        if (!adjustInflation) return nominalVal;
        return calculateInflationAdjustedValue(nominalVal, inflationNum, effectiveHorizonYears);
    }, [adjustInflation, result.maturityValue, result.netMaturityValue, deductLtcgTax, inflationNum, effectiveHorizonYears]);

    const purchasingPowerLossPct = useMemo(() => {
        const targetNominal = deductLtcgTax ? result.netMaturityValue : result.maturityValue;
        if (!adjustInflation || targetNominal <= 0) return 0;
        return Math.max(0, ((targetNominal - realMaturityValue) / targetNominal) * 100);
    }, [adjustInflation, result.maturityValue, result.netMaturityValue, deductLtcgTax, realMaturityValue]);

    const multiScenarios = useMemo(() => {
        return calculateSipMultiScenarios(
            {
                investmentAmount,
                annualRate,
                years,
                sipYears,
                totalYears,
                stepUpPercent: stepUpNum,
                stepUpFrequency,
                isLumpsum,
                calcMode,
                deductLtcgTax,
                ltcgTaxRate,
                ltcgExemption,
            },
            bearRate,
            annualRate,
            bullRate
        );
    }, [calcMode, investmentAmount, annualRate, years, sipYears, totalYears, isSipHold, isLumpsum, stepUpNum, stepUpFrequency, deductLtcgTax, ltcgTaxRate, ltcgExemption, bearRate, bullRate]);

    const milestones = useMemo(() => {
        let list = [];
        const params = {
            investmentAmount,
            annualRate,
            years,
            sipYears,
            totalYears,
            stepUpPercent: stepUpNum,
            stepUpFrequency,
            isLumpsum,
            deductLtcgTax,
            ltcgTaxRate,
            ltcgExemption,
        };

        if (isSipHold) {
            list = calculateSipAndHoldYearlyBreakdown(params);
        } else {
            list = calculateYearlyBreakdown(params);
        }

        if (adjustInflation) {
            return list.map((m) => {
                const baseVal = deductLtcgTax ? m.netTotal : m.total;
                return {
                    ...m,
                    realTotal: calculateInflationAdjustedValue(baseVal, inflationNum, m.year),
                };
            });
        }
        return list;
    }, [calcMode, investmentAmount, annualRate, years, sipYears, totalYears, isSipHold, isLumpsum, stepUpNum, stepUpFrequency, deductLtcgTax, ltcgTaxRate, ltcgExemption, adjustInflation, inflationNum]);

    const handleReset = () => {
        setInvestmentAmount("10000");
        setAnnualRate("12");
        setYears("10");
        setSipYears("5");
        setTotalYears("20");
        setStepUpPercent("0");
        setStepUpFrequency("annual");
        setDeductLtcgTax(false);
        setLtcgTaxRate("12.5");
        setLtcgExemption("125000");
        setAdjustInflation(false);
        setInflationRate("6");
        setBearRate("8");
        setBullRate("15");
    };

    const selectSipYears = (yr) => {
        setSipYears(String(yr));
        if (parseFloat(totalYears) < yr) {
            setTotalYears(String(yr));
        }
    };

    const selectTotalYears = (yr) => {
        setTotalYears(String(yr));
        if (parseFloat(sipYears) > yr) {
            setSipYears(String(yr));
        }
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
                        const file = new File([blob], "sip-plan.png", { type: "image/png" });

                        const stepUpText = (!isLumpsum && stepUpNum > 0) ? ` with ${stepUpNum}% ${stepUpFrequency} Step-Up` : "";
                        const taxText = deductLtcgTax ? `, Net Post-Tax: ${formatCurrency(result.netMaturityValue)}` : "";
                        const inflationText = adjustInflation ? `, Purchasing Power (@${inflationNum}% inf): ${formatCurrency(realMaturityValue)}` : "";

                        const shareText = isSipHold
                            ? `SIP & Grow Plan: Invested ${formatCurrency(result.totalInvested)} for ${sipYears} yrs${stepUpText}, Final Value at ${totalYears} yrs: ${formatCurrency(result.maturityValue)}${taxText}${inflationText}`
                            : `SIP Plan: Invested ${formatCurrency(result.totalInvested)}${stepUpText}, Maturity: ${formatCurrency(result.maturityValue)}${taxText}${inflationText}`;

                        if (navigator.canShare({ files: [file] })) {
                            await navigator.share({
                                title: "SIP Investment Plan",
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
                    link.download = `sip-plan-${Date.now()}.png`;
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
                        dialogTitle: "Share SIP Plan",
                    });
                } else {
                    Alert.alert("Saved", "Screenshot captured successfully.");
                }
            }
        } catch (err) {
            console.error("Share error:", err);
            Alert.alert("Share Failed", err.message || "Could not export SIP plan.");
        } finally {
            setSharing(false);
        }
    };

    return (
        <ScrollView style={[styles.container, activeTheme.container]} contentContainerStyle={styles.contentWrapper}>
            <View ref={captureViewRef} collapsable={false}>

                {/* ── Main Input & Setup Card ── */}
                <View style={[styles.cardWrapper, activeTheme.card]}>
                    {/* ── Header ── */}
                    <View style={styles.header}>
                        <Text style={[styles.title, activeTheme.title]}>
                            💰 SIP Calculator
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

                    {/* ── Mode Switcher (Monthly SIP vs SIP & Grow vs Lumpsum) ── */}
                    <View style={styles.sipTypeToggleRow}>
                        <TouchableOpacity
                            style={[
                                styles.sipTypeButton,
                                calcMode === "regular" ? activeTheme.tabActive : activeTheme.toggle,
                                { borderColor: calcMode === "regular" ? activeTheme.investedColor : activeTheme.borderColor },
                            ]}
                            onPress={() => setCalcMode("regular")}
                            activeOpacity={0.8}
                        >
                            <Text
                                style={[
                                    styles.sipTypeText,
                                    calcMode === "regular" ? activeTheme.tabActiveText : { color: activeTheme.title.color },
                                ]}
                            >
                                📅 Regular SIP
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[
                                styles.sipTypeButton,
                                calcMode === "sip_hold" ? activeTheme.tabActive : activeTheme.toggle,
                                { borderColor: calcMode === "sip_hold" ? activeTheme.investedColor : activeTheme.borderColor },
                            ]}
                            onPress={() => setCalcMode("sip_hold")}
                            activeOpacity={0.8}
                        >
                            <Text
                                style={[
                                    styles.sipTypeText,
                                    calcMode === "sip_hold" ? activeTheme.tabActiveText : { color: activeTheme.title.color },
                                ]}
                            >
                                🌱 SIP & Grow
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[
                                styles.sipTypeButton,
                                calcMode === "lumpsum" ? activeTheme.tabActive : activeTheme.toggle,
                                { borderColor: calcMode === "lumpsum" ? activeTheme.investedColor : activeTheme.borderColor },
                            ]}
                            onPress={() => setCalcMode("lumpsum")}
                            activeOpacity={0.8}
                        >
                            <Text
                                style={[
                                    styles.sipTypeText,
                                    calcMode === "lumpsum" ? activeTheme.tabActiveText : { color: activeTheme.title.color },
                                ]}
                            >
                                💵 Lumpsum
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* ── Input Grid ── */}
                    <View style={styles.grid}>
                        <View style={styles.col}>
                            <Text style={[styles.label, activeTheme.label]}>
                                {isLumpsum ? "Lumpsum Amount (₹)" : "Monthly Investment (₹)"}
                            </Text>
                            <TextInput
                                style={[styles.input, activeTheme.input, { borderColor: activeTheme.borderColor }]}
                                keyboardType="numeric"
                                value={investmentAmount}
                                placeholder="e.g. 10000"
                                placeholderTextColor={activeTheme.placeholder.color}
                                onChangeText={setInvestmentAmount}
                            />
                        </View>

                        <View style={styles.col}>
                            <Text style={[styles.label, activeTheme.label]}>
                                Expected Return (p.a. %)
                            </Text>
                            <TextInput
                                style={[styles.input, activeTheme.input, { borderColor: activeTheme.borderColor }]}
                                keyboardType="numeric"
                                value={annualRate}
                                placeholder="e.g. 12"
                                placeholderTextColor={activeTheme.placeholder.color}
                                onChangeText={setAnnualRate}
                            />
                        </View>

                        {!isSipHold ? (
                            /* Regular SIP or Lumpsum Duration */
                            <View style={styles.fullCol}>
                                <Text style={[styles.label, activeTheme.label]}>
                                    Time Period (Years)
                                </Text>
                                <TextInput
                                    style={[styles.input, activeTheme.input, { borderColor: activeTheme.borderColor }]}
                                    keyboardType="numeric"
                                    value={years}
                                    placeholder="e.g. 10"
                                    placeholderTextColor={activeTheme.placeholder.color}
                                    onChangeText={setYears}
                                />

                                {/* Quick Years Selection Chips */}
                                <View style={styles.chipRow}>
                                    {QUICK_YEARS.map((yr) => {
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
                        ) : (
                            /* SIP & Grow dual durations: SIP payment period & Total horizon */
                            <>
                                <View style={styles.col}>
                                    <Text style={[styles.label, activeTheme.label]}>
                                        SIP Period (Pay Years)
                                    </Text>
                                    <TextInput
                                        style={[styles.input, activeTheme.input, { borderColor: activeTheme.borderColor }]}
                                        keyboardType="numeric"
                                        value={sipYears}
                                        placeholder="e.g. 5"
                                        placeholderTextColor={activeTheme.placeholder.color}
                                        onChangeText={(val) => {
                                            setSipYears(val);
                                            const num = parseFloat(val);
                                            if (!isNaN(num) && parseFloat(totalYears) < num) {
                                                setTotalYears(String(num));
                                            }
                                        }}
                                    />
                                    <View style={styles.chipRow}>
                                        {QUICK_SIP_YEARS.map((yr) => {
                                            const isSelected = String(yr) === String(sipYears).trim();
                                            return (
                                                <TouchableOpacity
                                                    key={yr}
                                                    style={[
                                                        styles.chip,
                                                        isSelected ? activeTheme.tabActive : activeTheme.toggle,
                                                        { borderColor: isSelected ? activeTheme.investedColor : activeTheme.borderColor },
                                                    ]}
                                                    onPress={() => selectSipYears(yr)}
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

                                <View style={styles.col}>
                                    <Text style={[styles.label, activeTheme.label]}>
                                        Total Horizon (Years)
                                    </Text>
                                    <TextInput
                                        style={[styles.input, activeTheme.input, { borderColor: activeTheme.borderColor }]}
                                        keyboardType="numeric"
                                        value={totalYears}
                                        placeholder="e.g. 20"
                                        placeholderTextColor={activeTheme.placeholder.color}
                                        onChangeText={(val) => setTotalYears(val)}
                                    />
                                    <View style={styles.chipRow}>
                                        {QUICK_TOTAL_YEARS.map((yr) => {
                                            const isSelected = String(yr) === String(totalYears).trim();
                                            return (
                                                <TouchableOpacity
                                                    key={yr}
                                                    style={[
                                                        styles.chip,
                                                        isSelected ? activeTheme.tabActive : activeTheme.toggle,
                                                        { borderColor: isSelected ? activeTheme.investedColor : activeTheme.borderColor },
                                                    ]}
                                                    onPress={() => selectTotalYears(yr)}
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
                            </>
                        )}

                        {/* ── Feature 2: Flexible Step-Up SIP (% & Frequency) ── */}
                        {!isLumpsum && (
                            <View style={[styles.fullCol, { marginTop: 4 }]}>
                                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                                    <Text style={[styles.label, activeTheme.label]}>
                                        Step-Up SIP (% Increase)
                                    </Text>
                                    {stepUpNum > 0 && (
                                        <Text style={{ fontSize: 11, fontWeight: "700", color: activeTheme.investedColor }}>
                                            +{stepUpNum}% / {stepUpFrequency === "annual" ? "year" : stepUpFrequency === "half_yearly" ? "6 months" : "month"}
                                        </Text>
                                    )}
                                </View>
                                <TextInput
                                    style={[styles.input, activeTheme.input, { borderColor: activeTheme.borderColor }]}
                                    keyboardType="numeric"
                                    value={stepUpPercent}
                                    placeholder="e.g. 10 (0 for regular SIP)"
                                    placeholderTextColor={activeTheme.placeholder.color}
                                    onChangeText={setStepUpPercent}
                                />
                                <View style={styles.chipRow}>
                                    {QUICK_STEP_UP.map((pct) => {
                                        const isSelected = String(pct) === String(stepUpPercent).trim();
                                        return (
                                            <TouchableOpacity
                                                key={pct}
                                                style={[
                                                    styles.chip,
                                                    isSelected ? activeTheme.tabActive : activeTheme.toggle,
                                                    { borderColor: isSelected ? activeTheme.investedColor : activeTheme.borderColor },
                                                ]}
                                                onPress={() => setStepUpPercent(String(pct))}
                                                activeOpacity={0.7}
                                            >
                                                <Text
                                                    style={[
                                                        styles.chipText,
                                                        isSelected ? activeTheme.tabActiveText : { color: activeTheme.title.color },
                                                    ]}
                                                >
                                                    {pct === 0 ? "None (0%)" : `+${pct}%`}
                                                </Text>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>

                                {/* Step-Up Frequency Selector */}
                                {stepUpNum > 0 && (
                                    <View style={{ marginTop: 10 }}>
                                        <Text style={[styles.label, activeTheme.label, { fontSize: 12, marginBottom: 4 }]}>
                                            Step-Up Frequency:
                                        </Text>
                                        <View style={{ flexDirection: "row", gap: 8 }}>
                                            {[
                                                { label: "📅 Annual", key: "annual" },
                                                { label: "🌓 Half-Yearly", key: "half_yearly" },
                                                { label: "🌙 Monthly", key: "monthly" },
                                            ].map((item) => {
                                                const isSelected = stepUpFrequency === item.key;
                                                return (
                                                    <TouchableOpacity
                                                        key={item.key}
                                                        style={[
                                                            styles.chip,
                                                            isSelected ? activeTheme.tabActive : activeTheme.toggle,
                                                            { flex: 1, alignItems: "center", justifyContent: "center", borderColor: isSelected ? activeTheme.investedColor : activeTheme.borderColor, paddingVertical: 6 },
                                                        ]}
                                                        onPress={() => setStepUpFrequency(item.key)}
                                                        activeOpacity={0.7}
                                                    >
                                                        <Text
                                                            style={[
                                                                styles.chipText,
                                                                isSelected ? activeTheme.tabActiveText : { color: activeTheme.title.color },
                                                                { fontSize: 12 },
                                                            ]}
                                                        >
                                                            {item.label}
                                                        </Text>
                                                    </TouchableOpacity>
                                                );
                                            })}
                                        </View>
                                    </View>
                                )}
                            </View>
                        )}
                    </View>

                    {/* Explanatory Info Banner for Regular SIP with Step-Up */}
                    {!isSipHold && !isLumpsum && stepUpNum > 0 && (
                        <View style={[styles.infoBanner, { backgroundColor: activeTheme.bannerBg, borderColor: activeTheme.bannerBorder, marginTop: 12 }]}>
                            <Text style={{ fontSize: 16 }}>📈</Text>
                            <Text style={[styles.infoBannerText, { color: activeTheme.bannerText }]}>
                                With a {stepUpNum}% {stepUpFrequency === "annual" ? "yearly" : stepUpFrequency === "half_yearly" ? "half-yearly" : "monthly"} step-up, your monthly contribution grows from {formatCurrency(investmentAmount)} in Year 1 to {formatCurrency(result.finalMonthlyInvestment)} in Year {years}. You invest a total of {formatCurrency(result.totalInvested)}.
                            </Text>
                        </View>
                    )}

                    {/* Explanatory Info Banner for SIP & Grow */}
                    {isSipHold && (
                        <View style={[styles.infoBanner, { backgroundColor: activeTheme.bannerBg, borderColor: activeTheme.bannerBorder, marginTop: 12 }]}>
                            <Text style={{ fontSize: 16 }}>💡</Text>
                            <Text style={[styles.infoBannerText, { color: activeTheme.bannerText }]}>
                                {stepUpNum > 0
                                    ? `You invest monthly with a ${stepUpNum}% ${stepUpFrequency} step-up (reaching ${formatCurrency(result.finalMonthlyInvestment)}/mo in Yr ${sipYears}) totaling ${formatCurrency(result.totalInvested)}. Then stop contributing and let your ${formatCurrency(result.sipMaturityValue)} corpus compound untouched for another ${result.holdingYears} yrs to reach ${formatCurrency(result.maturityValue)}!`
                                    : `You invest monthly for ${sipYears || 0} yrs (${formatCurrency(result.totalInvested)} total). Then stop contributing and let your ${formatCurrency(result.sipMaturityValue)} corpus compound untouched for another ${result.holdingYears} yrs to reach ${formatCurrency(result.maturityValue)}!`}
                            </Text>
                        </View>
                    )}
                </View>

                {/* ── Feature 1: Equity LTCG Tax Deduction Toggle Card ── */}
                <View
                    style={[
                        styles.inflationCard,
                        activeTheme.card,
                        {
                            borderColor: deductLtcgTax ? "#10B981" : activeTheme.borderColor,
                            marginBottom: 12,
                        },
                    ]}
                >
                    <View style={styles.inflationHeaderRow}>
                        <View style={styles.inflationTitleCol}>
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                                <Text style={{ fontSize: 15 }}>⚖️</Text>
                                <Text style={[styles.inflationTitle, activeTheme.title]}>
                                    Equity LTCG Tax Deduction
                                </Text>
                            </View>
                            <Text style={[styles.inflationSubtitle, activeTheme.subtext]}>
                                {deductLtcgTax
                                    ? `Deducting ${ltcgTaxRate}% tax on gains > ₹${(parseFloat(ltcgExemption)/100000).toFixed(2)}L`
                                    : "Deduct 12.5% Equity LTCG Tax (India Budget 2024+)"}
                            </Text>
                        </View>

                        <TouchableOpacity
                            style={[
                                styles.inflationToggleBtn,
                                deductLtcgTax ? activeTheme.tabActive : activeTheme.toggle,
                                {
                                    borderColor: deductLtcgTax ? activeTheme.investedColor : activeTheme.borderColor,
                                },
                            ]}
                            onPress={() => setDeductLtcgTax((prev) => !prev)}
                            activeOpacity={0.8}
                        >
                            <Text
                                style={[
                                    styles.inflationToggleBtnText,
                                    deductLtcgTax ? activeTheme.tabActiveText : { color: activeTheme.title.color },
                                ]}
                            >
                                {deductLtcgTax ? "✓ Active" : "Enable"}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {deductLtcgTax && (
                        <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: activeTheme.borderColor }}>
                            <View style={{ flexDirection: "row", gap: 12 }}>
                                <View style={{ flex: 1 }}>
                                    <Text style={[styles.label, activeTheme.label, { fontSize: 12 }]}>
                                        LTCG Tax Rate (%)
                                    </Text>
                                    <TextInput
                                        style={[styles.input, activeTheme.input, { borderColor: activeTheme.borderColor, paddingVertical: 6, fontSize: 13 }]}
                                        keyboardType="numeric"
                                        value={ltcgTaxRate}
                                        placeholder="12.5"
                                        placeholderTextColor={activeTheme.placeholder.color}
                                        onChangeText={setLtcgTaxRate}
                                    />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={[styles.label, activeTheme.label, { fontSize: 12 }]}>
                                        Exemption Threshold (₹)
                                    </Text>
                                    <TextInput
                                        style={[styles.input, activeTheme.input, { borderColor: activeTheme.borderColor, paddingVertical: 6, fontSize: 13 }]}
                                        keyboardType="numeric"
                                        value={ltcgExemption}
                                        placeholder="125000"
                                        placeholderTextColor={activeTheme.placeholder.color}
                                        onChangeText={setLtcgExemption}
                                    />
                                </View>
                            </View>
                        </View>
                    )}
                </View>

                {/* ── Inflation Adjustment Toggle & Rate Card ── */}
                <View
                    style={[
                        styles.inflationCard,
                        activeTheme.card,
                        {
                            borderColor: adjustInflation
                                ? activeTheme.inflationColor || "#F59E0B"
                                : activeTheme.borderColor,
                        },
                    ]}
                >
                    <View style={styles.inflationHeaderRow}>
                        <View style={styles.inflationTitleCol}>
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                                <Text style={{ fontSize: 15 }}>🎈</Text>
                                <Text style={[styles.inflationTitle, activeTheme.title]}>
                                    Adjust for Inflation
                                </Text>
                            </View>
                            <Text style={[styles.inflationSubtitle, activeTheme.subtext]}>
                                {adjustInflation
                                    ? `Discounting returns at ${inflationRate}% p.a. inflation`
                                    : "Show purchasing power in today's money"}
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
                                Expected Annual Inflation Rate (%)
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

                {/* ── Results Summary Card ── */}
                <View style={[styles.metricCard, activeTheme.card, { borderColor: activeTheme.borderColor }]}>
                    <View style={styles.metricRow}>
                        <Text style={[styles.metricLabel, activeTheme.subtext]}>
                            {isSipHold ? `Total Invested (${sipYears || 0} Yrs)` : "Total Invested"}
                        </Text>
                        <Text style={[styles.metricValue, { color: activeTheme.investedColor }]}>
                            {formatCurrency(result.totalInvested)}
                        </Text>
                    </View>

                    {isSipHold && result.holdingYears > 0 && (
                        <>
                            <View style={[styles.metricDivider, { backgroundColor: activeTheme.borderColor }]} />
                            <View style={styles.metricRow}>
                                <Text style={[styles.metricLabel, activeTheme.subtext]}>
                                    Corpus When SIP Stops (Yr {sipYears})
                                </Text>
                                <Text style={[styles.metricValue, { color: activeTheme.investedColor }]}>
                                    {formatCurrency(result.sipMaturityValue)}
                                </Text>
                            </View>

                            <View style={[styles.metricDivider, { backgroundColor: activeTheme.borderColor }]} />
                            <View style={styles.metricRow}>
                                <Text style={[styles.metricLabel, activeTheme.subtext]}>
                                    Post-SIP Compounding (+{result.holdingYears} Yrs)
                                </Text>
                                <Text style={[styles.metricValue, { color: activeTheme.returnsColor }]}>
                                    +{formatCurrency(result.holdingGain)}
                                </Text>
                            </View>
                        </>
                    )}

                    <View style={[styles.metricDivider, { backgroundColor: activeTheme.borderColor }]} />

                    <View style={styles.metricRow}>
                        <Text style={[styles.metricLabel, activeTheme.subtext]}>
                            Estimated Total Returns
                        </Text>
                        <Text style={[styles.metricValue, { color: activeTheme.returnsColor }]}>
                            +{formatCurrency(result.estimatedReturns)}
                        </Text>
                    </View>

                    <View style={[styles.metricDivider, { backgroundColor: activeTheme.borderColor }]} />

                    <View style={styles.metricRow}>
                        <View>
                            <Text style={[styles.totalMetricLabel, activeTheme.title]}>
                                Gross Maturity Value
                            </Text>
                            {adjustInflation && (
                                <Text style={[styles.inflationSubtitle, activeTheme.subtext]}>
                                    (Nominal Future Value)
                                </Text>
                            )}
                        </View>
                        <Text style={[styles.totalMetricValue, { color: activeTheme.returnsColor }]}>
                            {formatCurrency(result.maturityValue)}
                        </Text>
                    </View>

                    {/* LTCG Tax Breakdown Row */}
                    {deductLtcgTax && (
                        <>
                            <View style={[styles.metricDivider, { backgroundColor: activeTheme.borderColor }]} />
                            <View style={styles.metricRow}>
                                <View style={{ flex: 1 }}>
                                    <Text style={[styles.metricLabel, { color: "#EF4444", fontWeight: "600" }]}>
                                        LTCG Tax Payable ({ltcgTaxRate}% over ₹{(parseFloat(ltcgExemption)/100000).toFixed(2)}L)
                                    </Text>
                                </View>
                                <Text style={[styles.metricValue, { color: "#EF4444", fontWeight: "700" }]}>
                                    -{formatCurrency(result.ltcgTaxAmount)}
                                </Text>
                            </View>

                            <View style={[styles.metricDivider, { backgroundColor: activeTheme.borderColor }]} />
                            <View style={styles.metricRow}>
                                <View style={{ flex: 1 }}>
                                    <Text style={[styles.totalMetricLabel, { color: "#10B981" }]}>
                                        Net Post-Tax Wealth
                                    </Text>
                                    <Text style={[styles.inflationSubtitle, activeTheme.subtext]}>
                                        (After Equity LTCG Tax)
                                    </Text>
                                </View>
                                <Text style={[styles.totalMetricValue, { color: "#10B981" }]}>
                                    {formatCurrency(result.netMaturityValue)}
                                </Text>
                            </View>
                        </>
                    )}

                    {/* Inflation Adjusted Real Purchasing Power */}
                    {adjustInflation && (
                        <>
                            <View style={[styles.metricDivider, { backgroundColor: activeTheme.borderColor, marginVertical: 8 }]} />
                            <View style={styles.metricRow}>
                                <View style={{ flex: 1, paddingRight: 8 }}>
                                    <Text style={[styles.totalMetricLabel, { color: activeTheme.inflationColor || "#F59E0B" }]}>
                                        Today's Purchasing Power
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
                                    {formatCurrency(realMaturityValue)}
                                </Text>
                            </View>
                        </>
                    )}
                </View>

                {/* ── Donut Chart Breakdown ── */}
                <SipDonutChart
                    totalInvested={result.totalInvested}
                    estimatedReturns={result.estimatedReturns}
                    maturityValue={deductLtcgTax ? result.netMaturityValue : result.maturityValue}
                    theme={theme}
                />

                {/* ── Feature 3: Multi-Scenario Market Comparison Card ── */}
                <View style={[styles.cardWrapper, activeTheme.card, { marginTop: 16 }]}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                            <Text style={{ fontSize: 16 }}>📊</Text>
                            <Text style={[styles.title, activeTheme.title, { fontSize: 16 }]}>
                                Multi-Scenario Market Comparison
                            </Text>
                        </View>
                        <TouchableOpacity
                            onPress={() => setShowScenarios((prev) => !prev)}
                            style={[styles.chip, activeTheme.toggle, { paddingHorizontal: 10, paddingVertical: 4 }]}
                        >
                            <Text style={{ fontSize: 12, fontWeight: "600", color: activeTheme.title.color }}>
                                {showScenarios ? "Hide ▲" : "Show ▼"}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {showScenarios && (
                        <View>
                            <Text style={[styles.subtext, activeTheme.subtext, { fontSize: 12, marginBottom: 14 }]}>
                                Compare returns under Bearish market slowdown, Base expected rate, and Bullish expansion.
                            </Text>

                            {/* Scenario Rate Chips / Customizers */}
                            <View style={{ flexDirection: "row", gap: 8, marginBottom: 16 }}>
                                <View style={{ flex: 1 }}>
                                    <Text style={[styles.label, activeTheme.label, { fontSize: 11 }]}>🐻 Bear Rate %</Text>
                                    <TextInput
                                        style={[styles.input, activeTheme.input, { borderColor: activeTheme.borderColor, paddingVertical: 4, height: 36, fontSize: 13 }]}
                                        keyboardType="numeric"
                                        value={bearRate}
                                        onChangeText={setBearRate}
                                    />
                                </View>

                                <View style={{ flex: 1 }}>
                                    <Text style={[styles.label, activeTheme.label, { fontSize: 11 }]}>🎯 Base Rate %</Text>
                                    <View style={[styles.input, activeTheme.input, { borderColor: activeTheme.borderColor, paddingVertical: 4, height: 36, justifyContent: "center", backgroundColor: activeTheme.toggle.backgroundColor }]}>
                                        <Text style={{ fontSize: 13, fontWeight: "700", color: activeTheme.title.color }}>{annualRate}%</Text>
                                    </View>
                                </View>

                                <View style={{ flex: 1 }}>
                                    <Text style={[styles.label, activeTheme.label, { fontSize: 11 }]}>🚀 Bull Rate %</Text>
                                    <TextInput
                                        style={[styles.input, activeTheme.input, { borderColor: activeTheme.borderColor, paddingVertical: 4, height: 36, fontSize: 13 }]}
                                        keyboardType="numeric"
                                        value={bullRate}
                                        onChangeText={setBullRate}
                                    />
                                </View>
                            </View>

                            {/* 3 Scenario Cards */}
                            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, justifyContent: "space-between" }}>
                                {/* Bear Case */}
                                <View style={[{ width: "31%", minWidth: 140, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: "#F59E0B" }, activeTheme.card]}>
                                    <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 6 }}>
                                        <Text style={{ fontSize: 14 }}>🐻</Text>
                                        <Text style={{ fontSize: 13, fontWeight: "800", color: "#F59E0B" }}>Bear ({bearRate}%)</Text>
                                    </View>
                                    <Text style={{ fontSize: 10, color: activeTheme.subtext.color }}>Invested</Text>
                                    <Text style={{ fontSize: 12, fontWeight: "600", color: activeTheme.title.color, marginBottom: 4 }}>
                                        {formatCompactCurrency(multiScenarios.bear.totalInvested)}
                                    </Text>
                                    <Text style={{ fontSize: 10, color: activeTheme.subtext.color }}>Estimated Returns</Text>
                                    <Text style={{ fontSize: 12, fontWeight: "600", color: "#10B981", marginBottom: 4 }}>
                                        +{formatCompactCurrency(multiScenarios.bear.estimatedReturns)}
                                    </Text>
                                    <View style={{ height: 1, backgroundColor: activeTheme.borderColor, marginVertical: 4 }} />
                                    <Text style={{ fontSize: 10, color: activeTheme.subtext.color }}>Final Corpus</Text>
                                    <Text style={{ fontSize: 14, fontWeight: "800", color: "#F59E0B" }}>
                                        {formatCompactCurrency(deductLtcgTax ? multiScenarios.bear.netMaturityValue : multiScenarios.bear.maturityValue)}
                                    </Text>
                                </View>

                                {/* Base Case */}
                                <View style={[{ width: "31%", minWidth: 140, padding: 12, borderRadius: 12, borderWidth: 2, borderColor: "#3B82F6" }, activeTheme.card]}>
                                    <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 6 }}>
                                        <Text style={{ fontSize: 14 }}>🎯</Text>
                                        <Text style={{ fontSize: 13, fontWeight: "800", color: "#3B82F6" }}>Base ({annualRate}%)</Text>
                                    </View>
                                    <Text style={{ fontSize: 10, color: activeTheme.subtext.color }}>Invested</Text>
                                    <Text style={{ fontSize: 12, fontWeight: "600", color: activeTheme.title.color, marginBottom: 4 }}>
                                        {formatCompactCurrency(multiScenarios.base.totalInvested)}
                                    </Text>
                                    <Text style={{ fontSize: 10, color: activeTheme.subtext.color }}>Estimated Returns</Text>
                                    <Text style={{ fontSize: 12, fontWeight: "600", color: "#10B981", marginBottom: 4 }}>
                                        +{formatCompactCurrency(multiScenarios.base.estimatedReturns)}
                                    </Text>
                                    <View style={{ height: 1, backgroundColor: activeTheme.borderColor, marginVertical: 4 }} />
                                    <Text style={{ fontSize: 10, color: activeTheme.subtext.color }}>Final Corpus</Text>
                                    <Text style={{ fontSize: 14, fontWeight: "800", color: "#3B82F6" }}>
                                        {formatCompactCurrency(deductLtcgTax ? multiScenarios.base.netMaturityValue : multiScenarios.base.maturityValue)}
                                    </Text>
                                </View>

                                {/* Bull Case */}
                                <View style={[{ width: "31%", minWidth: 140, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: "#10B981" }, activeTheme.card]}>
                                    <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 6 }}>
                                        <Text style={{ fontSize: 14 }}>🚀</Text>
                                        <Text style={{ fontSize: 13, fontWeight: "800", color: "#10B981" }}>Bull ({bullRate}%)</Text>
                                    </View>
                                    <Text style={{ fontSize: 10, color: activeTheme.subtext.color }}>Invested</Text>
                                    <Text style={{ fontSize: 12, fontWeight: "600", color: activeTheme.title.color, marginBottom: 4 }}>
                                        {formatCompactCurrency(multiScenarios.bull.totalInvested)}
                                    </Text>
                                    <Text style={{ fontSize: 10, color: activeTheme.subtext.color }}>Estimated Returns</Text>
                                    <Text style={{ fontSize: 12, fontWeight: "600", color: "#10B981", marginBottom: 4 }}>
                                        +{formatCompactCurrency(multiScenarios.bull.estimatedReturns)}
                                    </Text>
                                    <View style={{ height: 1, backgroundColor: activeTheme.borderColor, marginVertical: 4 }} />
                                    <Text style={{ fontSize: 10, color: activeTheme.subtext.color }}>Final Corpus</Text>
                                    <Text style={{ fontSize: 14, fontWeight: "800", color: "#10B981" }}>
                                        {formatCompactCurrency(deductLtcgTax ? multiScenarios.bull.netMaturityValue : multiScenarios.bull.maturityValue)}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    )}
                </View>

                {/* ── Yearly Milestones Table ── */}
                {milestones.length > 0 && (
                    <View style={[styles.tableCard, activeTheme.card, { borderColor: activeTheme.borderColor, marginTop: 16 }]}>
                        <Text style={[styles.tableTitle, activeTheme.title]}>
                            📈 Growth Progression {isSipHold && `(${sipYears}Y SIP + ${result.holdingYears}Y Compounding)`}
                        </Text>

                        <View style={[styles.tableHeader, { backgroundColor: activeTheme.tableHeaderBg }]}>
                            <Text style={[styles.tableHeaderCell, { textAlign: "left", flex: isSipHold ? 0.9 : 0.75 }, activeTheme.subtext]}>
                                Year
                            </Text>
                            <Text style={[styles.tableHeaderCell, activeTheme.subtext]}>
                                Invested
                            </Text>
                            {!adjustInflation ? (
                                <Text style={[styles.tableHeaderCell, activeTheme.subtext]}>
                                    Returns
                                </Text>
                            ) : (
                                <Text style={[styles.tableHeaderCell, activeTheme.subtext]}>
                                    Nominal
                                </Text>
                            )}
                            <Text
                                style={[
                                    styles.tableHeaderCell,
                                    adjustInflation
                                        ? { color: activeTheme.inflationColor || "#F59E0B" }
                                        : activeTheme.title,
                                ]}
                            >
                                {adjustInflation ? "Real Value" : (deductLtcgTax ? "Post-Tax" : "Total")}
                            </Text>
                        </View>

                        {milestones.map((m) => (
                            <View
                                key={m.year}
                                style={[styles.tableRow, { borderBottomColor: activeTheme.borderColor }]}
                            >
                                <View style={{ flex: isSipHold ? 0.9 : 0.75, justifyContent: "center" }}>
                                    <Text style={[styles.tableCell, { textAlign: "left" }, activeTheme.title]}>
                                        Yr {m.year}
                                    </Text>
                                    {stepUpNum > 0 && m.monthlyInvestment > 0 && !isLumpsum && (
                                        <Text style={{ fontSize: 10, color: activeTheme.investedColor, fontWeight: "600", marginTop: 1 }}>
                                            {formatCurrency(m.monthlyInvestment)}/m
                                        </Text>
                                    )}
                                    {isSipHold && m.phase && (
                                        <View
                                            style={[
                                                styles.phaseBadge,
                                                { backgroundColor: m.phase === "sip" ? activeTheme.badgeSipBg : activeTheme.badgeHoldBg },
                                            ]}
                                        >
                                            <Text
                                                style={[
                                                    styles.phaseBadgeText,
                                                    { color: m.phase === "sip" ? activeTheme.badgeSipText : activeTheme.badgeHoldText },
                                                ]}
                                            >
                                                {m.phaseLabel}
                                            </Text>
                                        </View>
                                    )}
                                </View>
                                <Text style={[styles.tableCell, activeTheme.subtext]}>
                                    {formatCurrency(m.invested)}
                                </Text>
                                {!adjustInflation ? (
                                    <Text style={[styles.tableCell, { color: activeTheme.returnsColor }]}>
                                        {formatCurrency(m.returns)}
                                    </Text>
                                ) : (
                                    <Text style={[styles.tableCell, activeTheme.subtext]}>
                                        {formatCurrency(deductLtcgTax ? m.netTotal : m.total)}
                                    </Text>
                                )}
                                <Text
                                    style={[
                                        styles.tableCell,
                                        { fontWeight: "700" },
                                        adjustInflation
                                            ? { color: activeTheme.inflationColor || "#F59E0B" }
                                            : activeTheme.title,
                                    ]}
                                >
                                    {formatCurrency(adjustInflation ? m.realTotal : (deductLtcgTax ? m.netTotal : m.total))}
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
                        {sharing ? "⏳ Generating..." : "📤 Share / Export SIP Plan"}
                    </Text>
                </TouchableOpacity>

            </View>
            <View style={{ height: 30 }} />
        </ScrollView>
    );
}
