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
    GOAL_PRESETS,
    calculateGoalPlan,
    calculateMultiGoalPortfolio,
    formatCurrency,
    formatCompactCurrency,
} from "../utils/goalCalculations";

export default function GoalCalculatorScreen({ theme = "dark", setTheme }) {
    const activeTheme = theme === "light" ? lightTheme : darkTheme;
    const captureViewRef = useRef(null);
    const [sharing, setSharing] = useState(false);

    // Active preset ID
    const [activePresetId, setActivePresetId] = useState("education");

    // Input States
    const [targetAmount, setTargetAmount] = useState("3500000");
    const [years, setYears] = useState("12");
    const [annualRate, setAnnualRate] = useState("12");
    const [currentSavings, setCurrentSavings] = useState("200000");
    const [stepUpPercent, setStepUpPercent] = useState("10");
    const [isInflationAdjusted, setIsInflationAdjusted] = useState(true);
    const [inflationRate, setInflationRate] = useState("6");

    const [selectedRoute, setSelectedRoute] = useState("stepup");

    const handleSelectPreset = (preset) => {
        setActivePresetId(preset.id);
        setTargetAmount(String(preset.targetAmount));
        setYears(String(preset.years));
        setAnnualRate(String(preset.annualRate));
    };

    const plan = useMemo(() => {
        return calculateGoalPlan({
            targetAmount,
            years,
            annualRate,
            currentSavings,
            stepUpPercent,
            isInflationAdjusted,
            inflationRate,
        });
    }, [targetAmount, years, annualRate, currentSavings, stepUpPercent, isInflationAdjusted, inflationRate]);

    const multiGoalSummary = useMemo(() => {
        return calculateMultiGoalPortfolio(GOAL_PRESETS.slice(0, 4));
    }, []);

    const handleReset = () => {
        const defaultPreset = GOAL_PRESETS.find((g) => g.id === "education") || GOAL_PRESETS[0];
        handleSelectPreset(defaultPreset);
        setCurrentSavings("200000");
        setStepUpPercent("10");
        setIsInflationAdjusted(true);
        setInflationRate("6");
    };

    const handleShare = async () => {
        try {
            setSharing(true);
            if (Platform.OS === "web") {
                const domNode = captureViewRef.current;
                if (!domNode) throw new Error("Could not find view element on web.");
                const html2canvas = require("html2canvas");
                const canvas = await html2canvas(domNode, { useCORS: true, logging: false, scale: 2 });
                const dataUrl = canvas.toDataURL("image/png");
                if (!dataUrl) throw new Error("Could not capture view screenshot on web.");

                let shared = false;
                if (typeof navigator !== "undefined" && navigator.share && navigator.canShare) {
                    try {
                        const response = await fetch(dataUrl);
                        const blob = await response.blob();
                        const file = new File([blob], "goal-plan.png", { type: "image/png" });
                        const shareText = `Goal Plan: Required Monthly SIP: ${formatCurrency(plan.requiredRegularSip)} to reach ${formatCurrency(plan.futureGoalAmount)} in ${years} yrs`;

                        if (navigator.canShare({ files: [file] })) {
                            await navigator.share({ title: "Goal-Based Wealth Plan", text: shareText, files: [file] });
                            shared = true;
                        }
                    } catch (err) {}
                }

                if (!shared && typeof document !== "undefined") {
                    const link = document.createElement("a");
                    link.href = dataUrl;
                    link.download = `goal-plan-${Date.now()}.png`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                }
            } else {
                const uri = await captureRef(captureViewRef, { format: "png", quality: 0.95 });
                if (await Sharing.isAvailableAsync()) {
                    await Sharing.shareAsync(uri, { mimeType: "image/png", dialogTitle: "Share Goal Plan" });
                }
            }
        } catch (err) {
            Alert.alert("Share Failed", err.message || "Could not export goal plan.");
        } finally {
            setSharing(false);
        }
    };

    return (
        <ScrollView style={[styles.container, activeTheme.container]} contentContainerStyle={styles.contentWrapper}>
            <View ref={captureViewRef} collapsable={false}>

                {/* Header Card */}
                <View style={[styles.cardWrapper, activeTheme.card]}>
                    <View style={styles.header}>
                        <Text style={[styles.title, activeTheme.title]}>
                            🎯 Goal-Based Wealth Planner
                        </Text>
                        <View style={styles.headerButtons}>
                            <TouchableOpacity style={[styles.themeToggle, activeTheme.toggle]} onPress={handleReset} activeOpacity={0.7}>
                                <Text style={[styles.themeToggleText, { color: activeTheme.title.color }]}>🗑 Reset</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Presets Bar */}
                    <Text style={[styles.label, activeTheme.label, { fontSize: 12, marginBottom: 6 }]}>Quick Goal Presets:</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 8 }}>
                        {GOAL_PRESETS.map((p) => {
                            const isSelected = p.id === activePresetId;
                            return (
                                <TouchableOpacity
                                    key={p.id}
                                    style={[
                                        styles.chip,
                                        isSelected ? activeTheme.tabActive : activeTheme.toggle,
                                        { borderColor: isSelected ? activeTheme.investedColor : activeTheme.borderColor, paddingHorizontal: 12, paddingVertical: 6 },
                                    ]}
                                    onPress={() => handleSelectPreset(p)}
                                >
                                    <Text style={[styles.chipText, isSelected ? activeTheme.tabActiveText : { color: activeTheme.title.color }]}>{p.title}</Text>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>

                    {/* Inputs */}
                    <View style={styles.grid}>
                        <View style={styles.col}>
                            <Text style={[styles.label, activeTheme.label]}>Target Goal Amount Today (₹)</Text>
                            <TextInput style={[styles.input, activeTheme.input, { borderColor: activeTheme.borderColor }]} keyboardType="numeric" value={targetAmount} onChangeText={setTargetAmount} />
                        </View>
                        <View style={styles.col}>
                            <Text style={[styles.label, activeTheme.label]}>Time Horizon (Years)</Text>
                            <TextInput style={[styles.input, activeTheme.input, { borderColor: activeTheme.borderColor }]} keyboardType="numeric" value={years} onChangeText={setYears} />
                        </View>
                        <View style={styles.col}>
                            <Text style={[styles.label, activeTheme.label]}>Expected Return (% p.a.)</Text>
                            <TextInput style={[styles.input, activeTheme.input, { borderColor: activeTheme.borderColor }]} keyboardType="numeric" value={annualRate} onChangeText={setAnnualRate} />
                        </View>
                        <View style={styles.col}>
                            <Text style={[styles.label, activeTheme.label]}>Existing Savings (₹)</Text>
                            <TextInput style={[styles.input, activeTheme.input, { borderColor: activeTheme.borderColor }]} keyboardType="numeric" value={currentSavings} onChangeText={setCurrentSavings} />
                        </View>
                    </View>
                </View>

                {/* Asset Allocation Strategy Recommendation Card */}
                {plan.isValid && (
                    <View style={[styles.cardWrapper, activeTheme.card, { borderColor: plan.assetAllocation.color }]}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 6 }}>
                            <Text style={{ fontSize: 16 }}>🛡️</Text>
                            <Text style={[styles.title, { color: plan.assetAllocation.color, fontSize: 15 }]}>
                                Asset Allocation Strategy ({plan.assetAllocation.riskLevel})
                            </Text>
                        </View>
                        <Text style={[styles.subtext, activeTheme.subtext, { fontSize: 12, marginBottom: 10 }]}>
                            {plan.assetAllocation.desc}
                        </Text>
                        <View style={{ flexDirection: "row", gap: 8 }}>
                            <View style={{ flex: plan.assetAllocation.equityPct, backgroundColor: "#10B981", height: 8, borderRadius: 4 }} />
                            <View style={{ flex: plan.assetAllocation.debtPct, backgroundColor: "#3B82F6", height: 8, borderRadius: 4 }} />
                        </View>
                        <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 6 }}>
                            <Text style={{ fontSize: 11, fontWeight: "700", color: "#10B981" }}>📈 Equity: {plan.assetAllocation.equityPct}%</Text>
                            <Text style={{ fontSize: 11, fontWeight: "700", color: "#3B82F6" }}>🏦 Debt/FD: {plan.assetAllocation.debtPct}%</Text>
                        </View>
                    </View>
                )}

                {/* Primary Plan Result Card */}
                {plan.isValid && (
                    <View style={[styles.metricCard, activeTheme.card, { borderColor: activeTheme.borderColor }]}>
                        <View style={styles.metricRow}>
                            <Text style={[styles.metricLabel, activeTheme.subtext]}>Future Inflated Goal Cost ({years} Yrs)</Text>
                            <Text style={[styles.metricValue, { color: activeTheme.investedColor }]}>{formatCurrency(plan.futureGoalAmount)}</Text>
                        </View>
                        <View style={[styles.metricDivider, { backgroundColor: activeTheme.borderColor }]} />
                        <View style={styles.metricRow}>
                            <Text style={[styles.totalMetricLabel, { color: "#10B981" }]}>Required Fixed Monthly SIP</Text>
                            <Text style={[styles.totalMetricValue, { color: "#10B981" }]}>{formatCurrency(plan.requiredRegularSip)}/mo</Text>
                        </View>
                        <View style={[styles.metricDivider, { backgroundColor: activeTheme.borderColor }]} />
                        <View style={styles.metricRow}>
                            <Text style={[styles.totalMetricLabel, { color: "#3B82F6" }]}>Or Required One-Time Lumpsum</Text>
                            <Text style={[styles.totalMetricValue, { color: "#3B82F6" }]}>{formatCurrency(plan.requiredLumpsum)}</Text>
                        </View>
                    </View>
                )}

                {/* Multi-Goal Consolidated Portfolio Aggregator */}
                <View style={[styles.cardWrapper, activeTheme.card, { marginTop: 14 }]}>
                    <Text style={[styles.title, activeTheme.title, { fontSize: 15, marginBottom: 8 }]}>
                        🌐 Multi-Goal Portfolio Aggregator Summary
                    </Text>
                    <Text style={[styles.subtext, activeTheme.subtext, { fontSize: 12, marginBottom: 12 }]}>
                        Consolidated investment required across your top life goals (Education, Home, Car, Retirement).
                    </Text>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
                        <Text style={[styles.label, activeTheme.subtext]}>Total Combined Goal Targets:</Text>
                        <Text style={{ fontWeight: "700", color: activeTheme.title.color }}>{formatCompactCurrency(multiGoalSummary.totalFutureGoalAmount)}</Text>
                    </View>
                    <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                        <Text style={[styles.label, { color: "#10B981" }]}>Total Consolidated Monthly SIP Required:</Text>
                        <Text style={{ fontWeight: "800", color: "#10B981" }}>{formatCurrency(multiGoalSummary.totalRequiredMonthlySip)}/mo</Text>
                    </View>
                </View>

                {/* Share Button */}
                <TouchableOpacity
                    style={[styles.themeToggle, activeTheme.toggle, { marginVertical: 12, paddingVertical: 13, borderRadius: 12, borderWidth: 1, borderColor: activeTheme.borderColor, alignItems: "center" }]}
                    onPress={handleShare}
                    disabled={sharing}
                >
                    <Text style={{ fontSize: 14, fontWeight: "700", color: activeTheme.title.color }}>{sharing ? "⏳ Generating..." : "📤 Share / Export Goal Plan"}</Text>
                </TouchableOpacity>

            </View>
            <View style={{ height: 30 }} />
        </ScrollView>
    );
}
