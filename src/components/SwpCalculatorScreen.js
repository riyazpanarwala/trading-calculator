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

export default function SwpCalculatorScreen({ theme = "dark", setTheme }) {
    const activeTheme = theme === "light" ? lightTheme : darkTheme;
    const captureViewRef = useRef(null);
    const [sharing, setSharing] = useState(false);

    const [initialInvestment, setInitialInvestment] = useState("5000000");
    const [monthlyWithdrawal, setMonthlyWithdrawal] = useState("35000");
    const [annualRate, setAnnualRate] = useState("10");
    const [years, setYears] = useState("15");
    const [stepUpPercent, setStepUpPercent] = useState("0");

    const stepUpNum = Math.max(0, parseFloat(stepUpPercent) || 0);

    const result = useMemo(() => {
        return calculateSwpResult({
            initialInvestment,
            monthlyWithdrawal,
            annualRate,
            years,
            stepUpPercent: stepUpNum,
        });
    }, [initialInvestment, monthlyWithdrawal, annualRate, years, stepUpNum]);

    const milestones = useMemo(() => {
        return calculateSwpYearlyBreakdown({
            initialInvestment,
            monthlyWithdrawal,
            annualRate,
            years,
            stepUpPercent: stepUpNum,
        });
    }, [initialInvestment, monthlyWithdrawal, annualRate, years, stepUpNum]);

    const handleReset = () => {
        setInitialInvestment("5000000");
        setMonthlyWithdrawal("35000");
        setAnnualRate("10");
        setYears("15");
        setStepUpPercent("0");
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

                        const shareText = `SWP Plan: Initial Corpus ${formatCurrency(result.totalInvested)}, Withdrawn: ${formatCurrency(result.totalWithdrawn)}, Remaining: ${formatCurrency(result.finalBalance)} over ${years} yrs`;

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
                            🏖️ SWP Calculator
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

                    {/* ── Inputs ── */}
                    <View style={styles.grid}>
                        {/* Total Investment / Corpus */}
                        <View style={styles.fullCol}>
                            <Text style={[styles.label, activeTheme.label]}>
                                Total Investment Amount (Corpus ₹)
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
                                {PRESET_CORPUS.map((item) => {
                                    const isSelected = item.val === String(initialInvestment).trim();
                                    return (
                                        <TouchableOpacity
                                            key={item.label}
                                            style={[
                                                styles.chip,
                                                isSelected ? activeTheme.tabActive : activeTheme.toggle,
                                                { borderColor: isSelected ? activeTheme.investedColor : activeTheme.borderColor },
                                            ]}
                                            onPress={() => setInitialInvestment(item.val)}
                                            activeOpacity={0.7}
                                        >
                                            <Text
                                                style={[
                                                    styles.chipText,
                                                    isSelected ? activeTheme.tabActiveText : { color: activeTheme.title.color },
                                                ]}
                                            >
                                                {item.label}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        </View>

                        {/* Monthly Withdrawal */}
                        <View style={styles.fullCol}>
                            <Text style={[styles.label, activeTheme.label]}>
                                Monthly Withdrawal Amount (₹)
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
                                {PRESET_WITHDRAWALS.map((item) => {
                                    const isSelected = item.val === String(monthlyWithdrawal).trim();
                                    return (
                                        <TouchableOpacity
                                            key={item.label}
                                            style={[
                                                styles.chip,
                                                isSelected ? activeTheme.tabActive : activeTheme.toggle,
                                                { borderColor: isSelected ? activeTheme.investedColor : activeTheme.borderColor },
                                            ]}
                                            onPress={() => setMonthlyWithdrawal(item.val)}
                                            activeOpacity={0.7}
                                        >
                                            <Text
                                                style={[
                                                    styles.chipText,
                                                    isSelected ? activeTheme.tabActiveText : { color: activeTheme.title.color },
                                                ]}
                                            >
                                                {item.label}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        </View>

                        {/* Expected Annual Return Rate */}
                        <View style={styles.col}>
                            <Text style={[styles.label, activeTheme.label]}>
                                Expected Return (p.a. %)
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
                                {QUICK_RATES.map((r) => {
                                    const isSelected = String(r) === String(annualRate).trim();
                                    return (
                                        <TouchableOpacity
                                            key={r}
                                            style={[
                                                styles.chip,
                                                isSelected ? activeTheme.tabActive : activeTheme.toggle,
                                                { borderColor: isSelected ? activeTheme.investedColor : activeTheme.borderColor },
                                            ]}
                                            onPress={() => setAnnualRate(String(r))}
                                            activeOpacity={0.7}
                                        >
                                            <Text
                                                style={[
                                                    styles.chipText,
                                                    isSelected ? activeTheme.tabActiveText : { color: activeTheme.title.color },
                                                ]}
                                            >
                                                {r}%
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        </View>

                        {/* Time Period (Years) */}
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
                                {QUICK_YEARS.map((y) => {
                                    const isSelected = String(y) === String(years).trim();
                                    return (
                                        <TouchableOpacity
                                            key={y}
                                            style={[
                                                styles.chip,
                                                isSelected ? activeTheme.tabActive : activeTheme.toggle,
                                                { borderColor: isSelected ? activeTheme.investedColor : activeTheme.borderColor },
                                            ]}
                                            onPress={() => setYears(String(y))}
                                            activeOpacity={0.7}
                                        >
                                            <Text
                                                style={[
                                                    styles.chipText,
                                                    isSelected ? activeTheme.tabActiveText : { color: activeTheme.title.color },
                                                ]}
                                            >
                                                {y}Y
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        </View>

                        {/* Optional Annual Step-Up Withdrawal */}
                        <View style={[styles.fullCol, { marginTop: 4 }]}>
                            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                                <Text style={[styles.label, activeTheme.label]}>
                                    Annual Step-Up Withdrawal (% / yr) <Text style={{ fontWeight: "400", fontSize: 11 }}>(Inflation hedge)</Text>
                                </Text>
                                {stepUpNum > 0 && (
                                    <Text style={{ fontSize: 11, fontWeight: "700", color: activeTheme.investedColor }}>
                                        +{stepUpNum}% / yr
                                    </Text>
                                )}
                            </View>
                            <TextInput
                                style={[styles.input, activeTheme.input, { borderColor: activeTheme.borderColor }]}
                                keyboardType="numeric"
                                value={stepUpPercent}
                                placeholder="e.g. 5 (0 for fixed monthly withdrawal)"
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
                                                {pct === 0 ? "Fixed (0%)" : `+${pct}%`}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        </View>
                    </View>

                    {/* ── Strategy Callout Banner ── */}
                    {result.isValid && (
                        <View
                            style={[
                                styles.infoBanner,
                                {
                                    backgroundColor: result.isDepleted
                                        ? "#FEF2F2"
                                        : activeTheme.bannerBg,
                                    borderColor: result.isDepleted
                                        ? "#FECACA"
                                        : activeTheme.bannerBorder,
                                    marginTop: 12,
                                },
                            ]}
                        >
                            <Text style={{ fontSize: 16 }}>
                                {result.isEvergreen ? "🚀" : result.isDepleted ? "⚠️" : "💡"}
                            </Text>
                            <Text
                                style={[
                                    styles.infoBannerText,
                                    {
                                        color: result.isDepleted
                                            ? "#991B1B"
                                            : activeTheme.bannerText,
                                    },
                                ]}
                            >
                                {result.isEvergreen
                                    ? `Evergreen Corpus! Your ${annualRate}% expected return exceeds your ${result.initialAnnualWithdrawalRate}% annual withdrawal rate. You withdraw ${formatCurrency(result.totalWithdrawn)} over ${years} yrs and your corpus still grows from ${formatCurrency(result.totalInvested)} to ${formatCurrency(result.finalBalance)}!`
                                    : result.isDepleted
                                    ? `Depletion Notice: At this withdrawal rate (${result.initialAnnualWithdrawalRate}%/yr), your corpus will be exhausted after ${result.depletedYears} Years and ${result.depletedExtraMonths} Months.`
                                    : `Sustainable Plan: You will withdraw a total of ${formatCurrency(result.totalWithdrawn)} over ${years} years, leaving ${formatCurrency(result.finalBalance)} in remaining wealth.`}
                            </Text>
                        </View>
                    )}
                </View>

                {/* ── Results Summary Card ── */}
                {result.isValid && (
                    <View style={[styles.metricCard, activeTheme.card, { borderColor: activeTheme.borderColor }]}>
                        {/* Total Withdrawn */}
                        <View style={styles.metricRow}>
                            <View>
                                <Text style={[styles.totalMetricLabel, activeTheme.title]}>
                                    Total Amount Withdrawn
                                </Text>
                                <Text style={[styles.inflationSubtitle, activeTheme.subtext]}>
                                    Across {years} years ({formatCurrency(monthlyWithdrawal)}/mo{stepUpNum > 0 ? ` +${stepUpNum}%/yr` : ""})
                                </Text>
                            </View>
                            <Text style={[styles.totalMetricValue, { color: activeTheme.returnsColor }]}>
                                {formatCurrency(result.totalWithdrawn)}
                            </Text>
                        </View>

                        <View style={[styles.metricDivider, { backgroundColor: activeTheme.borderColor, marginVertical: 8 }]} />

                        {/* Final Balance / Depletion */}
                        <View style={styles.metricRow}>
                            <View>
                                <Text style={[styles.metricLabel, activeTheme.subtext]}>
                                    Final Remaining Corpus
                                </Text>
                                {result.isEvergreen && (
                                    <Text style={[styles.inflationSubtitle, { color: activeTheme.returnsColor, fontWeight: "600" }]}>
                                        Corpus grown by +{formatCurrency(result.finalBalance - result.totalInvested)}
                                    </Text>
                                )}
                            </View>
                            <Text
                                style={[
                                    styles.metricValue,
                                    {
                                        color: result.isDepleted
                                            ? "#EF4444"
                                            : activeTheme.investedColor,
                                        fontWeight: "800",
                                    },
                                ]}
                            >
                                {result.isDepleted ? "Depleted (₹0)" : formatCurrency(result.finalBalance)}
                            </Text>
                        </View>

                        <View style={[styles.metricDivider, { backgroundColor: activeTheme.borderColor }]} />

                        {/* Initial Investment */}
                        <View style={styles.metricRow}>
                            <Text style={[styles.metricLabel, activeTheme.subtext]}>
                                Initial Capital Invested
                            </Text>
                            <Text style={[styles.metricValue, activeTheme.title]}>
                                {formatCurrency(result.totalInvested)}
                            </Text>
                        </View>

                        <View style={[styles.metricDivider, { backgroundColor: activeTheme.borderColor }]} />

                        {/* Total Gains Earned */}
                        <View style={styles.metricRow}>
                            <Text style={[styles.metricLabel, activeTheme.subtext]}>
                                Total Interest / Returns Earned
                            </Text>
                            <Text style={[styles.metricValue, { color: activeTheme.returnsColor }]}>
                                +{formatCurrency(result.totalGains)}
                            </Text>
                        </View>

                        <View style={[styles.metricDivider, { backgroundColor: activeTheme.borderColor }]} />

                        {/* Safe Withdrawal Rate Assessment */}
                        <View style={styles.metricRow}>
                            <View>
                                <Text style={[styles.metricLabel, activeTheme.subtext]}>
                                    Annual Withdrawal Rate
                                </Text>
                                <Text style={[styles.inflationSubtitle, activeTheme.subtext]}>
                                    Annual cashflow as % of initial corpus
                                </Text>
                            </View>
                            <View style={{ alignItems: "flex-end" }}>
                                <Text style={[styles.metricValue, activeTheme.title]}>
                                    {result.initialAnnualWithdrawalRate}% / yr
                                </Text>
                                <View
                                    style={[
                                        styles.erosionBadge,
                                        {
                                            backgroundColor:
                                                result.initialAnnualWithdrawalRate <= 6
                                                    ? "#DCFCE7"
                                                    : result.initialAnnualWithdrawalRate <= 9
                                                    ? "#FEF3C7"
                                                    : "#FEE2E2",
                                        },
                                    ]}
                                >
                                    <Text
                                        style={[
                                            styles.erosionBadgeText,
                                            {
                                                color:
                                                    result.initialAnnualWithdrawalRate <= 6
                                                        ? "#15803D"
                                                        : result.initialAnnualWithdrawalRate <= 9
                                                        ? "#B45309"
                                                        : "#B91C1C",
                                            },
                                        ]}
                                    >
                                        {result.initialAnnualWithdrawalRate <= 6
                                            ? "Very Safe (≤6%)"
                                            : result.initialAnnualWithdrawalRate <= 9
                                            ? "Moderate (6-9%)"
                                            : "High Depletion Risk (>9%)"}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    </View>
                )}

                {/* ── Yearly Financial Ledger ── */}
                {milestones.length > 0 && (
                    <View style={[styles.tableCard, activeTheme.card, { borderColor: activeTheme.borderColor }]}>
                        <Text style={[styles.tableTitle, activeTheme.title]}>
                            📈 Annual SWP Cashflow & Balance Ledger
                        </Text>

                        <View style={[styles.tableHeader, { backgroundColor: activeTheme.tableHeaderBg }]}>
                            <Text style={[styles.tableHeaderCell, { textAlign: "left", flex: 0.7 }, activeTheme.subtext]}>
                                Year
                            </Text>
                            <Text style={[styles.tableHeaderCell, activeTheme.subtext]}>
                                Withdrawn
                            </Text>
                            <Text style={[styles.tableHeaderCell, activeTheme.subtext]}>
                                Returns
                            </Text>
                            <Text style={[styles.tableHeaderCell, activeTheme.title]}>
                                Closing ₹
                            </Text>
                        </View>

                        {milestones.map((m) => (
                            <View
                                key={m.year}
                                style={[styles.tableRow, { borderBottomColor: activeTheme.borderColor }]}
                            >
                                <View style={{ flex: 0.7, justifyContent: "center" }}>
                                    <Text style={[styles.tableCell, { textAlign: "left" }, activeTheme.title]}>
                                        Yr {m.year}
                                    </Text>
                                    {stepUpNum > 0 && (
                                        <Text style={{ fontSize: 10, color: activeTheme.subtext.color }}>
                                            {formatCompactCurrency(m.monthlyWithdrawal)}/m
                                        </Text>
                                    )}
                                    {m.isDepleted && (
                                        <View style={[styles.phaseBadge, { backgroundColor: "#FEE2E2" }]}>
                                            <Text style={[styles.phaseBadgeText, { color: "#EF4444" }]}>Depleted</Text>
                                        </View>
                                    )}
                                </View>
                                <Text style={[styles.tableCell, { color: activeTheme.returnsColor }]}>
                                    {formatCurrency(m.withdrawn)}
                                </Text>
                                <Text style={[styles.tableCell, activeTheme.subtext]}>
                                    +{formatCurrency(m.returns)}
                                </Text>
                                <Text
                                    style={[
                                        styles.tableCell,
                                        {
                                            fontWeight: "700",
                                            color: m.isDepleted ? "#EF4444" : activeTheme.title.color,
                                        },
                                    ]}
                                >
                                    {formatCurrency(m.closingBalance)}
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
