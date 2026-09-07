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
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import styles, { lightTheme, darkTheme } from "./styles";
import {
    calculateSipResult,
    calculateYearlyBreakdown,
    calculateSipAndHoldResult,
    calculateSipAndHoldYearlyBreakdown,
    formatCurrency,
} from "../utils/sipCalculations";
import SipDonutChart from "./SipDonutChart";

const QUICK_YEARS = [1, 3, 5, 10, 15, 20, 25, 30];
const QUICK_SIP_YEARS = [1, 3, 5, 7, 10, 15];
const QUICK_TOTAL_YEARS = [5, 10, 15, 20, 25, 30];

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
    const [sharing, setSharing] = useState(false);

    const isLumpsum = calcMode === "lumpsum";
    const isSipHold = calcMode === "sip_hold";

    // Calculations
    const result = useMemo(() => {
        if (isSipHold) {
            return calculateSipAndHoldResult({
                investmentAmount,
                annualRate,
                sipYears,
                totalYears,
            });
        }
        return calculateSipResult({
            investmentAmount,
            annualRate,
            years,
            isLumpsum,
        });
    }, [calcMode, investmentAmount, annualRate, years, sipYears, totalYears, isSipHold, isLumpsum]);

    const milestones = useMemo(() => {
        if (isSipHold) {
            return calculateSipAndHoldYearlyBreakdown({
                investmentAmount,
                annualRate,
                sipYears,
                totalYears,
            });
        }
        return calculateYearlyBreakdown({
            investmentAmount,
            annualRate,
            years,
            isLumpsum,
        });
    }, [calcMode, investmentAmount, annualRate, years, sipYears, totalYears, isSipHold, isLumpsum]);

    const handleReset = () => {
        setInvestmentAmount("10000");
        setAnnualRate("12");
        setYears("10");
        setSipYears("5");
        setTotalYears("20");
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

                        const shareText = isSipHold
                            ? `SIP & Grow Plan: Invested ${formatCurrency(result.totalInvested)} for ${sipYears} yrs, Final Value at ${totalYears} yrs: ${formatCurrency(result.maturityValue)}`
                            : `SIP Plan: Invested ${formatCurrency(result.totalInvested)}, Maturity: ${formatCurrency(result.maturityValue)}`;

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
                    </View>

                    {/* Explanatory Info Banner for SIP & Grow */}
                    {isSipHold && (
                        <View style={[styles.infoBanner, { backgroundColor: activeTheme.bannerBg, borderColor: activeTheme.bannerBorder }]}>
                            <Text style={{ fontSize: 16 }}>💡</Text>
                            <Text style={[styles.infoBannerText, { color: activeTheme.bannerText }]}>
                                You invest monthly for {sipYears || 0} yrs ({formatCurrency(result.totalInvested)} total). Then stop contributing and let your {formatCurrency(result.sipMaturityValue)} corpus compound untouched for another {result.holdingYears} yrs to reach {formatCurrency(result.maturityValue)}!
                            </Text>
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
                        <Text style={[styles.totalMetricLabel, activeTheme.title]}>
                            Total Maturity Value
                        </Text>
                        <Text style={[styles.totalMetricValue, { color: activeTheme.returnsColor }]}>
                            {formatCurrency(result.maturityValue)}
                        </Text>
                    </View>
                </View>

                {/* ── Donut Chart Breakdown ── */}
                <SipDonutChart
                    totalInvested={result.totalInvested}
                    estimatedReturns={result.estimatedReturns}
                    maturityValue={result.maturityValue}
                    theme={theme}
                />

                {/* ── Yearly Milestones Table ── */}
                {milestones.length > 0 && (
                    <View style={[styles.tableCard, activeTheme.card, { borderColor: activeTheme.borderColor }]}>
                        <Text style={[styles.tableTitle, activeTheme.title]}>
                            📈 Growth Progression {isSipHold && `(${sipYears}Y SIP + ${result.holdingYears}Y Compounding)`}
                        </Text>

                        <View style={[styles.tableHeader, { backgroundColor: activeTheme.tableHeaderBg }]}>
                            <Text style={[styles.tableHeaderCell, { textAlign: "left", flex: isSipHold ? 0.9 : 0.7 }, activeTheme.subtext]}>
                                Year
                            </Text>
                            <Text style={[styles.tableHeaderCell, activeTheme.subtext]}>
                                Invested
                            </Text>
                            <Text style={[styles.tableHeaderCell, activeTheme.subtext]}>
                                Returns
                            </Text>
                            <Text style={[styles.tableHeaderCell, activeTheme.title]}>
                                Total
                            </Text>
                        </View>

                        {milestones.map((m) => (
                            <View
                                key={m.year}
                                style={[styles.tableRow, { borderBottomColor: activeTheme.borderColor }]}
                            >
                                <View style={{ flex: isSipHold ? 0.9 : 0.7, justifyContent: "center" }}>
                                    <Text style={[styles.tableCell, { textAlign: "left" }, activeTheme.title]}>
                                        Yr {m.year}
                                    </Text>
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
                                <Text style={[styles.tableCell, { color: activeTheme.returnsColor }]}>
                                    {formatCurrency(m.returns)}
                                </Text>
                                <Text style={[styles.tableCell, { fontWeight: "700" }, activeTheme.title]}>
                                    {formatCurrency(m.total)}
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
