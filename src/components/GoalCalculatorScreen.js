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
    const [targetAmount, setTargetAmount] = useState("3500000"); // 35 Lakhs
    const [years, setYears] = useState("12"); // 12 years
    const [annualRate, setAnnualRate] = useState("12"); // 12% p.a.
    const [currentSavings, setCurrentSavings] = useState("200000"); // 2 Lakhs already saved
    const [stepUpPercent, setStepUpPercent] = useState("10"); // 10% annual step-up
    const [isInflationAdjusted, setIsInflationAdjusted] = useState(true);
    const [inflationRate, setInflationRate] = useState("6"); // 6% India average inflation

    // Selected investment route for detailed milestone view: "regular" | "stepup"
    const [selectedRoute, setSelectedRoute] = useState("stepup");

    // Handle preset selection
    const handleSelectPreset = (preset) => {
        setActivePresetId(preset.id);
        setTargetAmount(String(preset.targetAmount));
        setYears(String(preset.years));
        setAnnualRate(String(preset.annualRate));
    };

    // Calculate plan
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
    }, [
        targetAmount,
        years,
        annualRate,
        currentSavings,
        stepUpPercent,
        isInflationAdjusted,
        inflationRate,
    ]);

    const handleReset = () => {
        const defaultPreset = GOAL_PRESETS[1]; // Child Education
        handleSelectPreset(defaultPreset);
        setCurrentSavings("0");
        setStepUpPercent("10");
        setIsInflationAdjusted(true);
        setInflationRate("6");
    };

    // ── Share / Export ──
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
                        const file = new File([blob], "goal-wealth-plan.png", { type: "image/png" });

                        const shareText = plan.isValid
                            ? `Goal Plan: Target ${formatCompactCurrency(plan.targetAmount)} in ${years}Y (${formatCompactCurrency(plan.futureGoalAmount)} with inflation). Required SIP: ${formatCurrency(plan.requiredRegularSip)}/mo (or ${formatCurrency(plan.requiredStepUpSip)}/mo with Step-Up).`
                            : "Goal-Based Wealth Planner Report";

                        if (navigator.canShare({ files: [file] })) {
                            await navigator.share({
                                title: "Goal-Based Wealth Plan",
                                text: shareText,
                                files: [file],
                            });
                            shared = true;
                        }
                    } catch (e) {
                        console.log("Web share aborted or unsupported:", e);
                    }
                }

                if (!shared) {
                    const link = document.createElement("a");
                    link.download = `goal-plan-${Date.now()}.png`;
                    link.href = dataUrl;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                }
            } else {
                const uri = await captureRef(captureViewRef, {
                    format: "png",
                    quality: 0.9,
                });
                const isAvailable = await Sharing.isAvailableAsync();
                if (isAvailable) {
                    await Sharing.shareAsync(uri);
                } else {
                    Alert.alert("Sharing Unavailable", "Sharing is not available on this device.");
                }
            }
        } catch (error) {
            console.error("Capture/Share error:", error);
            Alert.alert("Share Failed", error.message || "Failed to capture screenshot.");
        } finally {
            setSharing(false);
        }
    };

    return (
        <ScrollView
            style={[styles.container, activeTheme.container]}
            contentContainerStyle={styles.contentWrapper}
            keyboardShouldPersistTaps="handled"
        >
            <View ref={captureViewRef} collapsable={false} style={{ width: "100%" }}>
                {/* ── Header ── */}
                <View style={styles.header}>
                    <View style={{ flex: 1 }}>
                        <Text style={[styles.title, activeTheme.title]}>
                            Goal Wealth Planner
                        </Text>
                        <Text style={[styles.subtitle, activeTheme.subtext]}>
                            Reverse SIP & Lumpsum Goal Engineering
                        </Text>
                    </View>

                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                        <TouchableOpacity
                            style={[styles.themeBtn, activeTheme.toggle]}
                            onPress={handleShare}
                            disabled={sharing}
                            activeOpacity={0.7}
                            title="Export or Share Screenshot"
                        >
                            <Text style={styles.themeBtnText}>
                                {sharing ? "⏳" : "📸"}
                            </Text>
                        </TouchableOpacity>

                        {setTheme && (
                            <TouchableOpacity
                                style={[styles.themeBtn, activeTheme.toggle]}
                                onPress={() => setTheme(theme === "dark" ? "light" : "dark")}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.themeBtnText}>
                                    {theme === "dark" ? "☀️" : "🌙"}
                                </Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>

                {/* ── Goal Presets ── */}
                <View style={styles.goalPresetGrid}>
                    {GOAL_PRESETS.map((preset) => {
                        const isSelected = activePresetId === preset.id;
                        return (
                            <TouchableOpacity
                                key={preset.id}
                                style={[
                                    styles.goalPresetBtn,
                                    isSelected
                                        ? { backgroundColor: "#2563EB", borderColor: "#2563EB" }
                                        : { backgroundColor: theme === "dark" ? "#1E293B" : "#F8FAFC", borderColor: activeTheme.borderColor },
                                ]}
                                onPress={() => handleSelectPreset(preset)}
                                activeOpacity={0.8}
                            >
                                <Text
                                    style={[
                                        styles.goalPresetTitle,
                                        { color: isSelected ? "#FFFFFF" : activeTheme.title.color },
                                    ]}
                                >
                                    {preset.title}
                                </Text>
                                <Text
                                    style={[
                                        styles.goalPresetSubtitle,
                                        { color: isSelected ? "#E2E8F0" : activeTheme.subtext.color },
                                    ]}
                                >
                                    {preset.id === "custom"
                                        ? "Custom target"
                                        : `${formatCompactCurrency(preset.targetAmount)} in ${preset.years}Y`}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {/* ── Goal Parameters Card ── */}
                <View style={styles.cardWrapper}>
                    <View style={[styles.card, activeTheme.card, { padding: 14, borderRadius: 14 }]}>
                        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                            <Text style={[styles.label, activeTheme.label, { fontWeight: "700", marginBottom: 0 }]}>
                                TARGET PARAMETERS
                            </Text>
                            <TouchableOpacity onPress={handleReset} activeOpacity={0.7}>
                                <Text style={{ fontSize: 12, color: "#EF4444", fontWeight: "700" }}>
                                    Reset
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {/* Target Goal Amount Input */}
                        <View style={{ marginBottom: 12 }}>
                            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                                <Text style={[styles.label, activeTheme.label, { marginBottom: 0 }]}>
                                    Target Goal Corpus (in today's ₹)
                                </Text>
                                <Text style={{ fontSize: 12, fontWeight: "700", color: "#2563EB" }}>
                                    {formatCompactCurrency(parseFloat(targetAmount) || 0)}
                                </Text>
                            </View>
                            <TextInput
                                style={[styles.input, activeTheme.input]}
                                value={targetAmount}
                                onChangeText={(v) => {
                                    setTargetAmount(v);
                                    setActivePresetId("custom");
                                }}
                                keyboardType="number-pad"
                                placeholder="3500000"
                                placeholderTextColor={activeTheme.placeholder.color}
                            />
                            {/* Quick Amount Chips */}
                            <View style={{ flexDirection: "row", gap: 6, flexWrap: "wrap", marginTop: 6 }}>
                                {[
                                    { label: "₹10L", val: "1000000" },
                                    { label: "₹25L", val: "2500000" },
                                    { label: "₹50L", val: "5000000" },
                                    { label: "₹1Cr", val: "10000000" },
                                    { label: "₹2Cr", val: "20000000" },
                                ].map((chip) => (
                                    <TouchableOpacity
                                        key={chip.label}
                                        style={[
                                            styles.quickLotChip,
                                            targetAmount === chip.val
                                                ? { backgroundColor: "#2563EB", borderColor: "#2563EB" }
                                                : { backgroundColor: theme === "dark" ? "#1E293B" : "#F1F5F9", borderColor: activeTheme.borderColor },
                                        ]}
                                        onPress={() => {
                                            setTargetAmount(chip.val);
                                            setActivePresetId("custom");
                                        }}
                                        activeOpacity={0.8}
                                    >
                                        <Text
                                            style={[
                                                styles.quickLotChipText,
                                                { color: targetAmount === chip.val ? "#FFFFFF" : activeTheme.label.color },
                                            ]}
                                        >
                                            {chip.label}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        {/* Horizon & Return Rate Row */}
                        <View style={{ flexDirection: "row", gap: 12, marginBottom: 12 }}>
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.label, activeTheme.label]}>Horizon (Years)</Text>
                                <TextInput
                                    style={[styles.input, activeTheme.input]}
                                    value={years}
                                    onChangeText={(v) => {
                                        setYears(v);
                                        setActivePresetId("custom");
                                    }}
                                    keyboardType="number-pad"
                                    placeholder="12"
                                    placeholderTextColor={activeTheme.placeholder.color}
                                />
                                <View style={{ flexDirection: "row", gap: 4, flexWrap: "wrap", marginTop: 6 }}>
                                    {["3", "5", "7", "10", "15", "20"].map((y) => (
                                        <TouchableOpacity
                                            key={y}
                                            style={[
                                                styles.quickLotChip,
                                                years === y
                                                    ? { backgroundColor: "#2563EB", borderColor: "#2563EB" }
                                                    : { backgroundColor: theme === "dark" ? "#1E293B" : "#F1F5F9", borderColor: activeTheme.borderColor },
                                            ]}
                                            onPress={() => {
                                                setYears(y);
                                                setActivePresetId("custom");
                                            }}
                                            activeOpacity={0.8}
                                        >
                                            <Text
                                                style={[
                                                    styles.quickLotChipText,
                                                    { color: years === y ? "#FFFFFF" : activeTheme.label.color },
                                                ]}
                                            >
                                                {y}Y
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>

                            <View style={{ flex: 1 }}>
                                <Text style={[styles.label, activeTheme.label]}>Expected Return (% p.a.)</Text>
                                <TextInput
                                    style={[styles.input, activeTheme.input]}
                                    value={annualRate}
                                    onChangeText={(v) => {
                                        setAnnualRate(v);
                                        setActivePresetId("custom");
                                    }}
                                    keyboardType="decimal-pad"
                                    placeholder="12"
                                    placeholderTextColor={activeTheme.placeholder.color}
                                />
                                <View style={{ flexDirection: "row", gap: 4, flexWrap: "wrap", marginTop: 6 }}>
                                    {["8", "10", "12", "14", "15"].map((r) => (
                                        <TouchableOpacity
                                            key={r}
                                            style={[
                                                styles.quickLotChip,
                                                annualRate === r
                                                    ? { backgroundColor: "#2563EB", borderColor: "#2563EB" }
                                                    : { backgroundColor: theme === "dark" ? "#1E293B" : "#F1F5F9", borderColor: activeTheme.borderColor },
                                            ]}
                                            onPress={() => {
                                                setAnnualRate(r);
                                                setActivePresetId("custom");
                                            }}
                                            activeOpacity={0.8}
                                        >
                                            <Text
                                                style={[
                                                    styles.quickLotChipText,
                                                    { color: annualRate === r ? "#FFFFFF" : activeTheme.label.color },
                                                ]}
                                            >
                                                {r}%
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>
                        </View>

                        {/* Existing Savings & Step-Up Row */}
                        <View style={{ flexDirection: "row", gap: 12 }}>
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.label, activeTheme.label]}>Current Savings (₹)</Text>
                                <TextInput
                                    style={[styles.input, activeTheme.input]}
                                    value={currentSavings}
                                    onChangeText={setCurrentSavings}
                                    keyboardType="number-pad"
                                    placeholder="0"
                                    placeholderTextColor={activeTheme.placeholder.color}
                                />
                                <Text style={[styles.subtext, activeTheme.subtext, { fontSize: 10, marginTop: 4 }]}>
                                    Already saved for this goal
                                </Text>
                            </View>

                            <View style={{ flex: 1 }}>
                                <Text style={[styles.label, activeTheme.label]}>Annual Step-Up (% / Yr)</Text>
                                <TextInput
                                    style={[styles.input, activeTheme.input]}
                                    value={stepUpPercent}
                                    onChangeText={setStepUpPercent}
                                    keyboardType="number-pad"
                                    placeholder="10"
                                    placeholderTextColor={activeTheme.placeholder.color}
                                />
                                <Text style={[styles.subtext, activeTheme.subtext, { fontSize: 10, marginTop: 4 }]}>
                                    Annual increase in SIP
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* ── Inflation-Adjusted Future Goal Cost Card ── */}
                <View
                    style={[
                        styles.inflationCard,
                        {
                            backgroundColor: isInflationAdjusted
                                ? theme === "dark" ? "#2A1805" : "#FEF3C7"
                                : theme === "dark" ? "#0F172A" : "#FFFFFF",
                            borderColor: isInflationAdjusted
                                ? theme === "dark" ? "#78350F" : "#FDE68A"
                                : activeTheme.borderColor,
                        },
                    ]}
                >
                    <View style={styles.inflationHeaderRow}>
                        <View style={styles.inflationTitleCol}>
                            <Text
                                style={[
                                    styles.inflationTitle,
                                    { color: isInflationAdjusted ? (theme === "dark" ? "#FBBF24" : "#92400E") : activeTheme.title.color },
                                ]}
                            >
                                🎈 Inflation-Adjusted Future Target
                            </Text>
                            <Text
                                style={[
                                    styles.inflationSubtitle,
                                    { color: isInflationAdjusted ? (theme === "dark" ? "#FDE68A" : "#78350F") : activeTheme.subtext.color },
                                ]}
                            >
                                {isInflationAdjusted
                                    ? `Today's ${formatCompactCurrency(plan.targetAmount)} will actually cost ${formatCompactCurrency(plan.futureGoalAmount)} in ${years} years`
                                    : "Plan in nominal today's rupees without inflation"}
                            </Text>
                        </View>

                        <TouchableOpacity
                            style={[
                                styles.inflationToggleBtn,
                                {
                                    backgroundColor: isInflationAdjusted ? "#D97706" : activeTheme.toggle.backgroundColor,
                                    borderColor: isInflationAdjusted ? "#B45309" : activeTheme.borderColor,
                                },
                            ]}
                            onPress={() => setIsInflationAdjusted(!isInflationAdjusted)}
                            activeOpacity={0.8}
                        >
                            <Text
                                style={[
                                    styles.inflationToggleBtnText,
                                    { color: isInflationAdjusted ? "#FFFFFF" : activeTheme.subtext.color },
                                ]}
                            >
                                {isInflationAdjusted ? "✓ INFLATION ON" : "INFLATION OFF"}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {isInflationAdjusted && (
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: theme === "dark" ? "#451A03" : "#FDE68A" }}>
                            <Text style={{ fontSize: 12, fontWeight: "600", color: theme === "dark" ? "#FDE68A" : "#92400E" }}>
                                Annual Inflation Rate:
                            </Text>
                            <TextInput
                                style={[
                                    styles.input,
                                    activeTheme.input,
                                    { width: 60, height: 34, paddingVertical: 2, textAlign: "center" },
                                ]}
                                value={inflationRate}
                                onChangeText={setInflationRate}
                                keyboardType="decimal-pad"
                            />
                            <Text style={{ fontSize: 12, fontWeight: "700", color: theme === "dark" ? "#FDE68A" : "#92400E" }}>
                                % p.a.
                            </Text>
                        </View>
                    )}
                </View>

                {/* ── Solution Routes (Comparison Grid) ── */}
                <View style={{ marginBottom: 6 }}>
                    <Text style={[styles.label, activeTheme.subtext, { fontSize: 11, fontWeight: "700", letterSpacing: 0.5 }]}>
                        THREE WAYS TO ACHIEVE YOUR {formatCompactCurrency(plan.futureGoalAmount)} GOAL
                    </Text>
                </View>

                <View style={styles.goalStrategyRow}>
                    {/* Route 1: Step-Up SIP */}
                    <TouchableOpacity
                        style={[
                            styles.goalStrategyCard,
                            {
                                backgroundColor: activeTheme.card.backgroundColor,
                                borderColor: selectedRoute === "stepup" ? "#10B981" : activeTheme.borderColor,
                                borderWidth: selectedRoute === "stepup" ? 2 : 1,
                            },
                        ]}
                        onPress={() => setSelectedRoute("stepup")}
                        activeOpacity={0.8}
                    >
                        <View style={[styles.goalStrategyBadge, { backgroundColor: "#ECFDF5" }]}>
                            <Text style={[styles.goalStrategyBadgeText, { color: "#059669" }]}>
                                🌟 EASIEST TO START (+{stepUpPercent}%/yr)
                            </Text>
                        </View>
                        <Text style={[styles.subtext, activeTheme.subtext, { fontSize: 11 }]}>
                            Starting Monthly SIP
                        </Text>
                        <Text style={[styles.goalStrategyAmount, { color: "#10B981", marginVertical: 2 }]}>
                            {formatCurrency(plan.requiredStepUpSip)}
                            <Text style={{ fontSize: 13, fontWeight: "600", color: activeTheme.subtext.color }}> /mo</Text>
                        </Text>
                        <Text style={[styles.goalStrategySubtext, activeTheme.subtext]}>
                            Ends at {formatCurrency(plan.finalStepUpMonthlySip)}/mo in Yr {years}. Total Invested: {formatCompactCurrency(plan.totalStepUpInvested)}.
                        </Text>
                    </TouchableOpacity>

                    {/* Route 2: Regular SIP */}
                    <TouchableOpacity
                        style={[
                            styles.goalStrategyCard,
                            {
                                backgroundColor: activeTheme.card.backgroundColor,
                                borderColor: selectedRoute === "regular" ? "#2563EB" : activeTheme.borderColor,
                                borderWidth: selectedRoute === "regular" ? 2 : 1,
                            },
                        ]}
                        onPress={() => setSelectedRoute("regular")}
                        activeOpacity={0.8}
                    >
                        <View style={[styles.goalStrategyBadge, { backgroundColor: "#EFF6FF" }]}>
                            <Text style={[styles.goalStrategyBadgeText, { color: "#2563EB" }]}>
                                📅 FIXED MONTHLY SIP
                            </Text>
                        </View>
                        <Text style={[styles.subtext, activeTheme.subtext, { fontSize: 11 }]}>
                            Fixed Monthly SIP
                        </Text>
                        <Text style={[styles.goalStrategyAmount, { color: "#2563EB", marginVertical: 2 }]}>
                            {formatCurrency(plan.requiredRegularSip)}
                            <Text style={{ fontSize: 13, fontWeight: "600", color: activeTheme.subtext.color }}> /mo</Text>
                        </Text>
                        <Text style={[styles.goalStrategySubtext, activeTheme.subtext]}>
                            Same monthly amount for {years} years. Total Invested: {formatCompactCurrency(plan.totalRegularInvested)}.
                        </Text>
                    </TouchableOpacity>

                    {/* Route 3: One-Time Lumpsum */}
                    <View
                        style={[
                            styles.goalStrategyCard,
                            {
                                backgroundColor: activeTheme.card.backgroundColor,
                                borderColor: activeTheme.borderColor,
                            },
                        ]}
                    >
                        <View style={[styles.goalStrategyBadge, { backgroundColor: theme === "dark" ? "#1E293B" : "#F1F5F9" }]}>
                            <Text style={[styles.goalStrategyBadgeText, { color: activeTheme.label.color }]}>
                                💰 ONE-TIME LUMPSUM
                            </Text>
                        </View>
                        <Text style={[styles.subtext, activeTheme.subtext, { fontSize: 11 }]}>
                            Single Deposit Today
                        </Text>
                        <Text style={[styles.goalStrategyAmount, { color: activeTheme.title.color, marginVertical: 2 }]}>
                            {formatCompactCurrency(plan.requiredLumpsum)}
                        </Text>
                        <Text style={[styles.goalStrategySubtext, activeTheme.subtext]}>
                            Compound untouched at {annualRate}% p.a. for {years} years with ₹0 monthly commitment.
                        </Text>
                    </View>
                </View>

                {/* ── Wealth Breakdown Summary ── */}
                <View style={styles.cardWrapper}>
                    <View style={[styles.card, activeTheme.card, { padding: 16, borderRadius: 16 }]}>
                        <Text style={[styles.label, activeTheme.subtext, { fontSize: 11, fontWeight: "700", letterSpacing: 0.5 }]}>
                            PLAN WEALTH ACCUMULATION SUMMARY
                        </Text>

                        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", marginTop: 4, marginBottom: 12 }}>
                            <Text style={{ fontSize: 26, fontWeight: "800", color: activeTheme.title.color }}>
                                {formatCurrency(plan.futureGoalAmount)}
                            </Text>
                            <Text style={{ fontSize: 12, fontWeight: "700", color: "#10B981" }}>
                                🎯 100% Target Met
                            </Text>
                        </View>

                        {/* Visual Progress Ratio Bar */}
                        <View style={{ marginBottom: 12 }}>
                            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
                                <Text style={{ fontSize: 11, color: "#2563EB", fontWeight: "700" }}>
                                    Your Capital Outlay: {formatCompactCurrency(plan.totalRegularInvested)}
                                </Text>
                                <Text style={{ fontSize: 11, color: "#10B981", fontWeight: "700" }}>
                                    Wealth Growth (Returns): {formatCompactCurrency(plan.totalRegularGains)}
                                </Text>
                            </View>
                            <View style={[styles.goalProgressBarContainer, { backgroundColor: activeTheme.borderColor }]}>
                                <View
                                    style={[
                                        styles.goalProgressBarFill,
                                        {
                                            width: `${Math.min(100, Math.max(5, (plan.totalRegularInvested / (plan.futureGoalAmount || 1)) * 100))}%`,
                                            backgroundColor: "#2563EB",
                                        },
                                    ]}
                                />
                            </View>
                        </View>

                        {/* Existing Savings Callout */}
                        {parseFloat(currentSavings) > 0 && (
                            <View style={{ padding: 10, borderRadius: 10, backgroundColor: theme === "dark" ? "#0F172A" : "#F8FAFC", borderWidth: 1, borderColor: activeTheme.borderColor, marginTop: 4 }}>
                                <Text style={{ fontSize: 11, color: activeTheme.label.color }}>
                                    💼 <Text style={{ fontWeight: "700" }}>Existing Savings Advantage:</Text> Your initial {formatCompactCurrency(parseFloat(currentSavings))} will compound to {formatCompactCurrency(plan.existingFutureValue)} by year {years}, reducing your required SIP burden significantly!
                                </Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* ── Year-by-Year Milestone Trajectory Table ── */}
                <View style={[styles.taxTable, { backgroundColor: activeTheme.card.backgroundColor, borderColor: activeTheme.borderColor }]}>
                    <View
                        style={[
                            styles.taxTableHeader,
                            {
                                backgroundColor: activeTheme.tableHeaderBg,
                                borderBottomColor: activeTheme.borderColor,
                            },
                        ]}
                    >
                        <Text style={[styles.taxTableHeaderText, { color: activeTheme.subtext.color }]}>
                            Yearly Growth Milestone
                        </Text>
                        <Text style={[styles.taxTableHeaderText, { color: activeTheme.subtext.color }]}>
                            Corpus & % Goal
                        </Text>
                    </View>

                    {plan.milestones.map((m) => (
                        <View key={m.year} style={[styles.taxRow, { borderBottomColor: activeTheme.borderColor }]}>
                            <View style={styles.taxLabelCol}>
                                <Text style={[styles.taxName, { color: activeTheme.title.color }]}>
                                    Year {m.year} ({m.progressPercent}% achieved)
                                </Text>
                                <Text style={[styles.taxNote, activeTheme.subtext]}>
                                    Invested: {formatCompactCurrency(m.cumulativeInvested)} | Compounded: +{formatCompactCurrency(m.yearGain)}
                                </Text>
                            </View>
                            <View style={{ alignItems: "flex-end" }}>
                                <Text style={[styles.taxValue, { color: m.progressPercent >= 100 ? "#10B981" : activeTheme.title.color }]}>
                                    {formatCurrency(m.closingBalance)}
                                </Text>
                                <Text style={{ fontSize: 10, fontWeight: "700", color: "#10B981", marginTop: 2 }}>
                                    {m.progressPercent}% of goal
                                </Text>
                            </View>
                        </View>
                    ))}
                </View>

                {/* ── Educational Takeaway Banner ── */}
                <View style={{ paddingHorizontal: 4, paddingBottom: 24 }}>
                    <Text style={[styles.subtext, activeTheme.subtext, { fontSize: 11, lineHeight: 16 }]}>
                        💡 <Text style={{ fontWeight: "700" }}>The Step-Up SIP Advantage:</Text> Notice that with a 10% annual Step-Up SIP, your starting monthly commitment is <Text style={{ fontWeight: "700", color: "#10B981" }}>{formatCurrency(plan.requiredStepUpSip)}/mo</Text> instead of <Text style={{ fontWeight: "700" }}>{formatCurrency(plan.requiredRegularSip)}/mo</Text> — a 30%+ lower initial investment hurdle! As your income grows with yearly appraisals, your contributions comfortably step up to achieve 100% of your target on schedule.
                    </Text>
                </View>
            </View>
        </ScrollView>
    );
}
