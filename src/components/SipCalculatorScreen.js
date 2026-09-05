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
    formatCurrency,
} from "../utils/sipCalculations";
import SipDonutChart from "./SipDonutChart";

const QUICK_YEARS = [1, 3, 5, 10, 15, 20, 25, 30];

export default function SipCalculatorScreen({ theme = "dark", setTheme }) {
    const activeTheme = theme === "light" ? lightTheme : darkTheme;
    const captureViewRef = useRef(null);

    // Form states
    const [isLumpsum, setIsLumpsum] = useState(false);
    const [investmentAmount, setInvestmentAmount] = useState("10000");
    const [annualRate, setAnnualRate] = useState("12");
    const [years, setYears] = useState("10");
    const [sharing, setSharing] = useState(false);

    // Calculations
    const result = useMemo(() => {
        return calculateSipResult({
            investmentAmount,
            annualRate,
            years,
            isLumpsum,
        });
    }, [investmentAmount, annualRate, years, isLumpsum]);

    const milestones = useMemo(() => {
        return calculateYearlyBreakdown({
            investmentAmount,
            annualRate,
            years,
            isLumpsum,
        });
    }, [investmentAmount, annualRate, years, isLumpsum]);

    const handleReset = () => {
        setInvestmentAmount("10000");
        setAnnualRate("12");
        setYears("10");
        setIsLumpsum(false);
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

                        if (navigator.canShare({ files: [file] })) {
                            await navigator.share({
                                title: "SIP Investment Plan",
                                text: `SIP Plan: Invested ${formatCurrency(result.totalInvested)}, Maturity: ${formatCurrency(result.maturityValue)}`,
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
        <ScrollView style={[styles.container, activeTheme.container]}>
            <View ref={captureViewRef} collapsable={false} style={activeTheme.container}>

                {/* ── Header ── */}
                <View style={styles.header}>
                    <Text style={[styles.title, activeTheme.title]}>
                        💰 SIP Calculator
                    </Text>
                    <View style={styles.headerButtons}>
                        <TouchableOpacity
                            style={[styles.themeToggle, activeTheme.toggle]}
                            onPress={handleReset}
                        >
                            <Text style={{ color: activeTheme.title.color }}>🗑 Reset</Text>
                        </TouchableOpacity>
                        {setTheme && (
                            <TouchableOpacity
                                style={[styles.themeToggle, activeTheme.toggle]}
                                onPress={() => setTheme((t) => (t === "light" ? "dark" : "light"))}
                            >
                                <Text style={{ color: activeTheme.title.color }}>
                                    {theme === "light" ? "🌙 Dark" : "☀️ Light"}
                                </Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>

                {/* ── Mode Switcher (Monthly SIP vs Lumpsum) ── */}
                <View style={styles.sipTypeToggleRow}>
                    <TouchableOpacity
                        style={[
                            styles.sipTypeButton,
                            !isLumpsum ? activeTheme.tabActive : activeTheme.toggle,
                        ]}
                        onPress={() => setIsLumpsum(false)}
                        activeOpacity={0.8}
                    >
                        <Text
                            style={[
                                styles.sipTypeText,
                                !isLumpsum ? activeTheme.tabActiveText : { color: activeTheme.title.color },
                            ]}
                        >
                            📅 Monthly SIP
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[
                            styles.sipTypeButton,
                            isLumpsum ? activeTheme.tabActive : activeTheme.toggle,
                        ]}
                        onPress={() => setIsLumpsum(true)}
                        activeOpacity={0.8}
                    >
                        <Text
                            style={[
                                styles.sipTypeText,
                                isLumpsum ? activeTheme.tabActiveText : { color: activeTheme.title.color },
                            ]}
                        >
                            💵 One-Time Lumpsum
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
                            style={[styles.input, activeTheme.input]}
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
                            style={[styles.input, activeTheme.input]}
                            keyboardType="numeric"
                            value={annualRate}
                            placeholder="e.g. 12"
                            placeholderTextColor={activeTheme.placeholder.color}
                            onChangeText={setAnnualRate}
                        />
                    </View>

                    <View style={styles.fullCol}>
                        <Text style={[styles.label, activeTheme.label]}>
                            Time Period (Years)
                        </Text>
                        <TextInput
                            style={[styles.input, activeTheme.input]}
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
                                        ]}
                                        onPress={() => setYears(String(yr))}
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
                </View>

                {/* ── Results Summary Card ── */}
                <View style={[styles.metricCard, activeTheme.card]}>
                    <View style={styles.metricRow}>
                        <Text style={[styles.metricLabel, activeTheme.subtext]}>
                            Total Invested
                        </Text>
                        <Text style={[styles.metricValue, { color: activeTheme.investedColor }]}>
                            {formatCurrency(result.totalInvested)}
                        </Text>
                    </View>

                    <View style={[styles.metricDivider, { backgroundColor: activeTheme.borderColor }]} />

                    <View style={styles.metricRow}>
                        <Text style={[styles.metricLabel, activeTheme.subtext]}>
                            Estimated Returns
                        </Text>
                        <Text style={[styles.metricValue, { color: activeTheme.returnsColor }]}>
                            +{formatCurrency(result.estimatedReturns)}
                        </Text>
                    </View>

                    <View style={[styles.metricDivider, { backgroundColor: activeTheme.borderColor }]} />

                    <View style={styles.metricRow}>
                        <Text style={[styles.totalMetricLabel, activeTheme.label]}>
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
                    <View style={[styles.tableCard, activeTheme.card]}>
                        <Text style={[styles.tableTitle, activeTheme.label]}>
                            📈 Growth Progression
                        </Text>

                        <View style={[styles.tableHeader, { backgroundColor: activeTheme.tableHeaderBg }]}>
                            <Text style={[styles.tableHeaderCell, { textAlign: "left", flex: 0.7 }, activeTheme.label]}>
                                Year
                            </Text>
                            <Text style={[styles.tableHeaderCell, activeTheme.label]}>
                                Invested
                            </Text>
                            <Text style={[styles.tableHeaderCell, activeTheme.label]}>
                                Returns
                            </Text>
                            <Text style={[styles.tableHeaderCell, activeTheme.label]}>
                                Total
                            </Text>
                        </View>

                        {milestones.map((m) => (
                            <View
                                key={m.year}
                                style={[styles.tableRow, { borderBottomColor: activeTheme.borderColor }]}
                            >
                                <Text style={[styles.tableCell, { textAlign: "left", flex: 0.7 }, activeTheme.label]}>
                                    Yr {m.year}
                                </Text>
                                <Text style={[styles.tableCell, activeTheme.subtext]}>
                                    {formatCurrency(m.invested)}
                                </Text>
                                <Text style={[styles.tableCell, { color: activeTheme.returnsColor }]}>
                                    {formatCurrency(m.returns)}
                                </Text>
                                <Text style={[styles.tableCell, { fontWeight: "700" }, activeTheme.label]}>
                                    {formatCurrency(m.total)}
                                </Text>
                            </View>
                        ))}
                    </View>
                )}

                <View style={{ height: 16 }} />
            </View>

            {/* ── Share / Export Button ── */}
            <TouchableOpacity
                style={[
                    styles.themeToggle,
                    activeTheme.toggle,
                    { marginVertical: 12, paddingVertical: 14, borderRadius: 10, alignItems: "center" },
                ]}
                onPress={handleShare}
                disabled={sharing}
                activeOpacity={0.75}
            >
                <Text style={{ fontSize: 15, fontWeight: "700", color: activeTheme.title.color }}>
                    {sharing ? "⏳ Generating..." : "📤 Share / Export SIP Plan"}
                </Text>
            </TouchableOpacity>

            <View style={{ height: 40 }} />
        </ScrollView>
    );
}
