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
    LOAN_PRESETS,
    calculateLoanPlan,
    formatCurrency,
    formatCompactCurrency,
} from "../utils/loanCalculations";

export default function LoanCalculatorScreen({ theme = "dark", setTheme }) {
    const activeTheme = theme === "light" ? lightTheme : darkTheme;
    const captureViewRef = useRef(null);
    const [sharing, setSharing] = useState(false);

    // Active preset ID
    const [activePresetId, setActivePresetId] = useState("home");

    // Loan Parameters
    const [principal, setPrincipal] = useState("5000000"); // 50 Lakhs
    const [annualRate, setAnnualRate] = useState("8.5"); // 8.5%
    const [tenureYears, setTenureYears] = useState("20"); // 20 Years

    // Prepayment Strategies
    const [oneExtraEmiPerYear, setOneExtraEmiPerYear] = useState(true); // Default 1 extra EMI/yr
    const [extraMonthly, setExtraMonthly] = useState("0");
    const [annualStepUpPercent, setAnnualStepUpPercent] = useState("0");
    const [lumpSumAmount, setLumpSumAmount] = useState("0");
    const [lumpSumYear, setLumpSumYear] = useState("3");
    const [sipReturnRate, setSipReturnRate] = useState("12");

    // Handle Preset Selection
    const handleSelectPreset = (preset) => {
        setActivePresetId(preset.id);
        setPrincipal(String(preset.principal));
        setAnnualRate(String(preset.rate));
        setTenureYears(String(preset.years));
    };

    // Calculate Loan & Prepayment Plan
    const plan = useMemo(() => {
        return calculateLoanPlan({
            principal,
            annualRate,
            tenureYears,
            extraMonthly,
            oneExtraEmiPerYear,
            annualStepUpPercent,
            lumpSumAmount,
            lumpSumYear,
            sipReturnRate,
        });
    }, [
        principal,
        annualRate,
        tenureYears,
        extraMonthly,
        oneExtraEmiPerYear,
        annualStepUpPercent,
        lumpSumAmount,
        lumpSumYear,
        sipReturnRate,
    ]);

    const handleReset = () => {
        const homePreset = LOAN_PRESETS[0];
        handleSelectPreset(homePreset);
        setOneExtraEmiPerYear(false);
        setExtraMonthly("0");
        setAnnualStepUpPercent("0");
        setLumpSumAmount("0");
        setLumpSumYear("3");
        setSipReturnRate("12");
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
                        const file = new File([blob], "loan-strategy-plan.png", { type: "image/png" });

                        const shareText = plan.isValid
                            ? `Loan Analysis: Principal ${formatCompactCurrency(plan.principal)} @ ${annualRate}% for ${tenureYears}Y. EMI: ${formatCurrency(plan.originalEmi)}/mo. ${plan.hasPrepayment ? `Prepayment saves ${plan.yearsSaved} years & ${formatCompactCurrency(plan.interestSaved)} interest!` : ""}`
                            : "Loan & Debt Optimizer Report";

                        if (navigator.canShare({ files: [file] })) {
                            await navigator.share({
                                title: "Loan & Debt Optimization Plan",
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
                    link.download = `loan-plan-${Date.now()}.png`;
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
                            Loan & Debt Optimizer
                        </Text>
                        <Text style={[styles.subtitle, activeTheme.subtext]}>
                            Smart EMI, Prepayment & Prepay vs. SIP Strategy
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

                {/* ── Loan Presets ── */}
                <View style={styles.goalPresetGrid}>
                    {LOAN_PRESETS.map((preset) => {
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
                                        ? "Custom loan"
                                        : `${formatCompactCurrency(preset.principal)} @ ${preset.rate}%`}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {/* ── Loan Parameters Card ── */}
                <View style={styles.cardWrapper}>
                    <View style={[styles.card, activeTheme.card, { padding: 14, borderRadius: 14 }]}>
                        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                            <Text style={[styles.label, activeTheme.label, { fontWeight: "700", marginBottom: 0 }]}>
                                LOAN PARAMETERS
                            </Text>
                            <TouchableOpacity onPress={handleReset} activeOpacity={0.7}>
                                <Text style={{ fontSize: 12, color: "#EF4444", fontWeight: "700" }}>
                                    Reset
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {/* Principal Amount Input */}
                        <View style={{ marginBottom: 12 }}>
                            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                                <Text style={[styles.label, activeTheme.label, { marginBottom: 0 }]}>
                                    Loan Principal Amount (₹)
                                </Text>
                                <Text style={{ fontSize: 12, fontWeight: "700", color: "#2563EB" }}>
                                    {formatCompactCurrency(parseFloat(principal) || 0)}
                                </Text>
                            </View>
                            <TextInput
                                style={[styles.input, activeTheme.input]}
                                value={principal}
                                onChangeText={(v) => {
                                    setPrincipal(v);
                                    setActivePresetId("custom");
                                }}
                                keyboardType="number-pad"
                                placeholder="5000000"
                                placeholderTextColor={activeTheme.placeholder.color}
                            />
                            {/* Quick Amount Chips */}
                            <View style={{ flexDirection: "row", gap: 6, flexWrap: "wrap", marginTop: 6 }}>
                                {[
                                    { label: "₹10L", val: "1000000" },
                                    { label: "₹25L", val: "2500000" },
                                    { label: "₹50L", val: "5000000" },
                                    { label: "₹75L", val: "7500000" },
                                    { label: "₹1Cr", val: "10000000" },
                                ].map((chip) => (
                                    <TouchableOpacity
                                        key={chip.label}
                                        style={[
                                            styles.quickLotChip,
                                            principal === chip.val
                                                ? { backgroundColor: "#2563EB", borderColor: "#2563EB" }
                                                : { backgroundColor: theme === "dark" ? "#1E293B" : "#F1F5F9", borderColor: activeTheme.borderColor },
                                        ]}
                                        onPress={() => {
                                            setPrincipal(chip.val);
                                            setActivePresetId("custom");
                                        }}
                                        activeOpacity={0.8}
                                    >
                                        <Text
                                            style={[
                                                styles.quickLotChipText,
                                                { color: principal === chip.val ? "#FFFFFF" : activeTheme.label.color },
                                            ]}
                                        >
                                            {chip.label}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        {/* Rate & Tenure Row */}
                        <View style={{ flexDirection: "row", gap: 12 }}>
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.label, activeTheme.label]}>Interest Rate (% p.a.)</Text>
                                <TextInput
                                    style={[styles.input, activeTheme.input]}
                                    value={annualRate}
                                    onChangeText={(v) => {
                                        setAnnualRate(v);
                                        setActivePresetId("custom");
                                    }}
                                    keyboardType="decimal-pad"
                                    placeholder="8.5"
                                    placeholderTextColor={activeTheme.placeholder.color}
                                />
                                <View style={{ flexDirection: "row", gap: 4, flexWrap: "wrap", marginTop: 6 }}>
                                    {["8.5", "9.0", "9.5", "10.5", "12.0"].map((r) => (
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

                            <View style={{ flex: 1 }}>
                                <Text style={[styles.label, activeTheme.label]}>Tenure (Years)</Text>
                                <TextInput
                                    style={[styles.input, activeTheme.input]}
                                    value={tenureYears}
                                    onChangeText={(v) => {
                                        setTenureYears(v);
                                        setActivePresetId("custom");
                                    }}
                                    keyboardType="number-pad"
                                    placeholder="20"
                                    placeholderTextColor={activeTheme.placeholder.color}
                                />
                                <View style={{ flexDirection: "row", gap: 4, flexWrap: "wrap", marginTop: 6 }}>
                                    {["3", "5", "10", "15", "20", "25"].map((y) => (
                                        <TouchableOpacity
                                            key={y}
                                            style={[
                                                styles.quickLotChip,
                                                tenureYears === y
                                                    ? { backgroundColor: "#2563EB", borderColor: "#2563EB" }
                                                    : { backgroundColor: theme === "dark" ? "#1E293B" : "#F1F5F9", borderColor: activeTheme.borderColor },
                                            ]}
                                            onPress={() => {
                                                setTenureYears(y);
                                                setActivePresetId("custom");
                                            }}
                                            activeOpacity={0.8}
                                        >
                                            <Text
                                                style={[
                                                    styles.quickLotChipText,
                                                    { color: tenureYears === y ? "#FFFFFF" : activeTheme.label.color },
                                                ]}
                                            >
                                                {y}Y
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>
                        </View>
                    </View>
                </View>

                {/* ── Base EMI & Outflow Summary Card ── */}
                <View style={styles.cardWrapper}>
                    <View style={[styles.card, activeTheme.card, { padding: 18, borderRadius: 16 }]}>
                        <Text style={[styles.label, activeTheme.subtext, { fontSize: 11, fontWeight: "700", letterSpacing: 0.5 }]}>
                            STANDARD MONTHLY EMI
                        </Text>
                        <View style={{ flexDirection: "row", alignItems: "baseline", gap: 10, marginTop: 4, marginBottom: 12 }}>
                            <Text style={{ fontSize: 32, fontWeight: "800", color: "#2563EB" }}>
                                {formatCurrency(plan.originalEmi)}
                            </Text>
                            <Text style={{ fontSize: 14, fontWeight: "600", color: activeTheme.subtext.color }}>
                                / month ({plan.originalTenureMonths} installments)
                            </Text>
                        </View>

                        {/* Visual Ratio Bar: Principal vs Total Interest */}
                        <View style={{ marginBottom: 12 }}>
                            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
                                <Text style={{ fontSize: 11, color: "#2563EB", fontWeight: "700" }}>
                                    Principal: {formatCompactCurrency(plan.principal)} ({plan.originalTotalAmount > 0 ? ((plan.principal / plan.originalTotalAmount) * 100).toFixed(0) : 0}%)
                                </Text>
                                <Text style={{ fontSize: 11, color: "#EF4444", fontWeight: "700" }}>
                                    Total Interest: {formatCompactCurrency(plan.originalTotalInterest)} ({plan.originalTotalAmount > 0 ? ((plan.originalTotalInterest / plan.originalTotalAmount) * 100).toFixed(0) : 0}%)
                                </Text>
                            </View>
                            <View style={[styles.goalProgressBarContainer, { backgroundColor: "#EF4444" }]}>
                                <View
                                    style={[
                                        styles.goalProgressBarFill,
                                        {
                                            width: `${plan.originalTotalAmount > 0 ? Math.min(100, Math.max(5, (plan.principal / plan.originalTotalAmount) * 100)) : 50}%`,
                                            backgroundColor: "#2563EB",
                                        },
                                    ]}
                                />
                            </View>
                        </View>

                        <View style={{ flexDirection: "row", borderTopWidth: 1, borderTopColor: activeTheme.borderColor, paddingTop: 10, gap: 12 }}>
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.subtext, activeTheme.subtext, { fontSize: 11 }]}>Total Amount Payable</Text>
                                <Text style={{ fontSize: 16, fontWeight: "700", color: activeTheme.title.color, marginTop: 2 }}>
                                    {formatCurrency(plan.originalTotalAmount)}
                                </Text>
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.subtext, activeTheme.subtext, { fontSize: 11 }]}>Interest / Principal Ratio</Text>
                                <Text style={{ fontSize: 16, fontWeight: "700", color: plan.originalTotalInterest > plan.principal ? "#EF4444" : activeTheme.title.color, marginTop: 2 }}>
                                    {plan.principal > 0 ? (plan.originalTotalInterest / plan.principal).toFixed(2) : 0}x
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* ── Prepayment Strategies (The Early Debt-Free Simulator) ── */}
                <View style={styles.cardWrapper}>
                    <View style={[styles.card, activeTheme.card, { padding: 14, borderRadius: 14 }]}>
                        <Text style={[styles.label, activeTheme.label, { fontWeight: "700", marginBottom: 12 }]}>
                            ⚡ PREPAYMENT STRATEGIES (EARLY DEBT-FREE SIMULATOR)
                        </Text>

                        {/* Strategy 1: Pay 1 Extra EMI / Year */}
                        <TouchableOpacity
                            style={[
                                styles.prepayOptionCard,
                                {
                                    backgroundColor: oneExtraEmiPerYear ? (theme === "dark" ? "#062016" : "#ECFDF5") : (theme === "dark" ? "#1E293B" : "#F8FAFC"),
                                    borderColor: oneExtraEmiPerYear ? "#059669" : activeTheme.borderColor,
                                },
                            ]}
                            onPress={() => setOneExtraEmiPerYear(!oneExtraEmiPerYear)}
                            activeOpacity={0.8}
                        >
                            <View style={styles.prepayOptionHeader}>
                                <View style={{ flex: 1, paddingRight: 8 }}>
                                    <Text style={[styles.prepayOptionTitle, { color: oneExtraEmiPerYear ? "#059669" : activeTheme.title.color }]}>
                                        🌟 Pay 1 Extra EMI Every Year (13th Month Bonus)
                                    </Text>
                                    <Text style={[styles.prepayOptionSubtitle, activeTheme.subtext]}>
                                        Pay 1 additional EMI of {formatCurrency(plan.originalEmi)} every 12 months.
                                    </Text>
                                </View>
                                <View
                                    style={{
                                        paddingHorizontal: 10,
                                        paddingVertical: 5,
                                        borderRadius: 6,
                                        backgroundColor: oneExtraEmiPerYear ? "#059669" : activeTheme.toggle.backgroundColor,
                                    }}
                                >
                                    <Text style={{ fontSize: 11, fontWeight: "700", color: oneExtraEmiPerYear ? "#FFFFFF" : activeTheme.subtext.color }}>
                                        {oneExtraEmiPerYear ? "ACTIVE ✓" : "DISABLED"}
                                    </Text>
                                </View>
                            </View>
                        </TouchableOpacity>

                        {/* Strategy 2: Annual EMI Step-Up */}
                        <View style={[styles.prepayOptionCard, { backgroundColor: theme === "dark" ? "#1E293B" : "#F8FAFC", borderColor: activeTheme.borderColor }]}>
                            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                                <View>
                                    <Text style={[styles.prepayOptionTitle, { color: activeTheme.title.color }]}>
                                        📈 Annual EMI Step-Up (% / Year)
                                    </Text>
                                    <Text style={[styles.prepayOptionSubtitle, activeTheme.subtext]}>
                                        Increase monthly EMI each year as salary grows
                                    </Text>
                                </View>
                                <Text style={{ fontSize: 13, fontWeight: "700", color: "#2563EB" }}>
                                    +{annualStepUpPercent}% / yr
                                </Text>
                            </View>
                            <View style={{ flexDirection: "row", gap: 6, flexWrap: "wrap", marginTop: 4 }}>
                                {["0", "5", "10", "15"].map((pct) => (
                                    <TouchableOpacity
                                        key={pct}
                                        style={[
                                            styles.quickLotChip,
                                            annualStepUpPercent === pct
                                                ? { backgroundColor: "#2563EB", borderColor: "#2563EB" }
                                                : { backgroundColor: theme === "dark" ? "#0F172A" : "#FFFFFF", borderColor: activeTheme.borderColor },
                                        ]}
                                        onPress={() => setAnnualStepUpPercent(pct)}
                                        activeOpacity={0.8}
                                    >
                                        <Text
                                            style={[
                                                styles.quickLotChipText,
                                                { color: annualStepUpPercent === pct ? "#FFFFFF" : activeTheme.label.color },
                                            ]}
                                        >
                                            {pct === "0" ? "0% (None)" : `+${pct}% / yr`}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        {/* Strategy 3: Extra Monthly Prepayment */}
                        <View style={[styles.prepayOptionCard, { backgroundColor: theme === "dark" ? "#1E293B" : "#F8FAFC", borderColor: activeTheme.borderColor }]}>
                            <Text style={[styles.prepayOptionTitle, { color: activeTheme.title.color, marginBottom: 4 }]}>
                                💵 Extra Monthly Prepayment (₹ / Month)
                            </Text>
                            <TextInput
                                style={[styles.input, activeTheme.input, { height: 40 }]}
                                value={extraMonthly}
                                onChangeText={setExtraMonthly}
                                keyboardType="number-pad"
                                placeholder="e.g. 5000"
                                placeholderTextColor={activeTheme.placeholder.color}
                            />
                        </View>

                        {/* Strategy 4: One-Time Lump Sum Prepayment */}
                        <View style={[styles.prepayOptionCard, { backgroundColor: theme === "dark" ? "#1E293B" : "#F8FAFC", borderColor: activeTheme.borderColor, marginBottom: 0 }]}>
                            <View style={{ flexDirection: "row", gap: 10 }}>
                                <View style={{ flex: 1.5 }}>
                                    <Text style={[styles.prepayOptionTitle, { color: activeTheme.title.color, marginBottom: 4 }]}>
                                        💰 One-Time Lump Sum Prepayment (₹)
                                    </Text>
                                    <TextInput
                                        style={[styles.input, activeTheme.input, { height: 40 }]}
                                        value={lumpSumAmount}
                                        onChangeText={setLumpSumAmount}
                                        keyboardType="number-pad"
                                        placeholder="e.g. 300000"
                                        placeholderTextColor={activeTheme.placeholder.color}
                                    />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={[styles.prepayOptionTitle, { color: activeTheme.title.color, marginBottom: 4 }]}>
                                        In Year
                                    </Text>
                                    <TextInput
                                        style={[styles.input, activeTheme.input, { height: 40 }]}
                                        value={lumpSumYear}
                                        onChangeText={setLumpSumYear}
                                        keyboardType="number-pad"
                                        placeholder="3"
                                        placeholderTextColor={activeTheme.placeholder.color}
                                    />
                                </View>
                            </View>
                        </View>
                    </View>
                </View>

                {/* ── Early Debt-Free Banner (When Prepayment is Active) ── */}
                {plan.hasPrepayment && plan.interestSaved > 0 && (
                    <View
                        style={[
                            styles.debtFreeCard,
                            {
                                backgroundColor: theme === "dark" ? "#062016" : "#ECFDF5",
                                borderColor: "#059669",
                            },
                        ]}
                    >
                        <Text style={[styles.debtFreeTitle, { color: "#059669" }]}>
                            🎉 EARLY DEBT-FREE BREAKTHROUGH
                        </Text>
                        <View style={styles.debtFreeMetricRow}>
                            <View style={styles.debtFreeMetricCol}>
                                <Text style={{ fontSize: 11, color: theme === "dark" ? "#A7F3D0" : "#047857" }}>
                                    Years Slashed Off Loan
                                </Text>
                                <Text style={[styles.debtFreeValue, { color: "#059669" }]}>
                                    −{plan.yearsSaved} Years Early
                                </Text>
                                <Text style={{ fontSize: 11, color: activeTheme.subtext.color, marginTop: 2 }}>
                                    Closed in {plan.newTenureYears}Y instead of {tenureYears}Y
                                </Text>
                            </View>

                            <View style={styles.debtFreeMetricCol}>
                                <Text style={{ fontSize: 11, color: theme === "dark" ? "#A7F3D0" : "#047857" }}>
                                    Total Interest Saved
                                </Text>
                                <Text style={[styles.debtFreeValue, { color: "#059669" }]}>
                                    {formatCurrency(plan.interestSaved)}
                                </Text>
                                <Text style={{ fontSize: 11, color: activeTheme.subtext.color, marginTop: 2 }}>
                                    Direct cash kept in your pocket!
                                </Text>
                            </View>
                        </View>
                    </View>
                )}

                {/* ── Prepay vs. SIP Opportunity Cost Analysis ── */}
                {plan.hasPrepayment && (
                    <View
                        style={[
                            styles.sipArbitrageCard,
                            {
                                backgroundColor: activeTheme.card.backgroundColor,
                                borderColor: activeTheme.borderColor,
                            },
                        ]}
                    >
                        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                            <Text style={{ fontSize: 12, fontWeight: "700", color: activeTheme.title.color }}>
                                ⚖️ PREPAY LOAN VS. INVEST IN SIP ARBITRAGE
                            </Text>
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                                <Text style={{ fontSize: 11, color: activeTheme.subtext.color }}>SIP Return:</Text>
                                <TextInput
                                    style={[
                                        styles.input,
                                        activeTheme.input,
                                        { width: 44, height: 26, paddingVertical: 0, textAlign: "center", fontSize: 11 },
                                    ]}
                                    value={sipReturnRate}
                                    onChangeText={setSipReturnRate}
                                    keyboardType="decimal-pad"
                                />
                                <Text style={{ fontSize: 11, color: activeTheme.subtext.color }}>%</Text>
                            </View>
                        </View>

                        <Text style={[styles.subtext, activeTheme.subtext, { fontSize: 11, marginBottom: 12 }]}>
                            If instead of prepaying your {annualRate}% loan, you invested the same {formatCompactCurrency(plan.totalPrepaymentsPaid)} into an Equity Mutual Fund / SIP @ {sipReturnRate}% p.a. over {tenureYears} years:
                        </Text>

                        <View style={{ flexDirection: "row", gap: 12, marginBottom: 10 }}>
                            <View style={{ flex: 1, padding: 10, borderRadius: 10, backgroundColor: theme === "dark" ? "#1E293B" : "#F8FAFC", borderWidth: 1, borderColor: activeTheme.borderColor }}>
                                <Text style={{ fontSize: 11, color: activeTheme.subtext.color }}>Route A: Prepay Loan</Text>
                                <Text style={{ fontSize: 15, fontWeight: "700", color: "#059669", marginTop: 2 }}>
                                    {formatCurrency(plan.interestSaved)}
                                </Text>
                                <Text style={{ fontSize: 10, color: activeTheme.subtext.color, marginTop: 2 }}>
                                    Guaranteed Interest Saved
                                </Text>
                            </View>

                            <View style={{ flex: 1, padding: 10, borderRadius: 10, backgroundColor: theme === "dark" ? "#1E293B" : "#F8FAFC", borderWidth: 1, borderColor: activeTheme.borderColor }}>
                                <Text style={{ fontSize: 11, color: activeTheme.subtext.color }}>Route B: Equity SIP</Text>
                                <Text style={{ fontSize: 15, fontWeight: "700", color: "#2563EB", marginTop: 2 }}>
                                    {formatCurrency(plan.prepayVsSip.sipFutureValue)}
                                </Text>
                                <Text style={{ fontSize: 10, color: activeTheme.subtext.color, marginTop: 2 }}>
                                    Projected Corpus at {sipReturnRate}%
                                </Text>
                            </View>
                        </View>

                        <View
                            style={{
                                padding: 10,
                                borderRadius: 10,
                                backgroundColor: plan.prepayVsSip.sipBeatsLoan
                                    ? (theme === "dark" ? "#081E34" : "#EFF6FF")
                                    : (theme === "dark" ? "#062016" : "#ECFDF5"),
                                borderWidth: 1,
                                borderColor: plan.prepayVsSip.sipBeatsLoan ? "#3B82F6" : "#059669",
                            }}
                        >
                            <Text style={{ fontSize: 12, fontWeight: "700", color: plan.prepayVsSip.sipBeatsLoan ? "#2563EB" : "#059669" }}>
                                {plan.prepayVsSip.sipBeatsLoan
                                    ? `🚀 SIP Arbitrage Advantage: +${formatCurrency(plan.prepayVsSip.netWealthDifference)} Higher Wealth!`
                                    : `🛡️ Prepayment Advantage: Saving loan interest beats SIP after risk adjustment.`}
                            </Text>
                            <Text style={{ fontSize: 10, color: activeTheme.subtext.color, marginTop: 2 }}>
                                {plan.prepayVsSip.sipBeatsLoan
                                    ? `Because equity compounding (${sipReturnRate}%) outpaces home loan interest (${annualRate}%), investing surplus cash creates significantly greater long-term net worth.`
                                    : `Guaranteed debt freedom provides psychological peace of mind with 0 market risk.`}
                            </Text>
                        </View>
                    </View>
                )}

                {/* ── Year-by-Year Amortization Schedule ── */}
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
                            Amortization Breakdown
                        </Text>
                        <Text style={[styles.taxTableHeaderText, { color: activeTheme.subtext.color }]}>
                            Closing Balance
                        </Text>
                    </View>

                    {plan.yearlyAmortization.map((row) => (
                        <View key={row.year} style={[styles.taxRow, { borderBottomColor: activeTheme.borderColor }]}>
                            <View style={styles.taxLabelCol}>
                                <Text style={[styles.taxName, { color: activeTheme.title.color }]}>
                                    Year {row.year} ({row.percentCleared}% Repaid)
                                </Text>
                                <Text style={[styles.taxNote, activeTheme.subtext]}>
                                    Principal: {formatCompactCurrency(row.principalPaid)} | Interest: {formatCompactCurrency(row.interestPaid)}
                                </Text>
                            </View>
                            <View style={{ alignItems: "flex-end" }}>
                                <Text style={[styles.taxValue, { color: row.closingBalance === 0 ? "#10B981" : activeTheme.title.color }]}>
                                    {row.closingBalance === 0 ? "PAID OFF 🎉" : formatCurrency(row.closingBalance)}
                                </Text>
                                <Text style={{ fontSize: 10, fontWeight: "700", color: row.closingBalance === 0 ? "#10B981" : activeTheme.subtext.color, marginTop: 2 }}>
                                    {row.percentCleared}% closed
                                </Text>
                            </View>
                        </View>
                    ))}
                </View>

                {/* ── Educational Footer ── */}
                <View style={{ paddingHorizontal: 4, paddingBottom: 24 }}>
                    <Text style={[styles.subtext, activeTheme.subtext, { fontSize: 11, lineHeight: 16 }]}>
                        💡 <Text style={{ fontWeight: "700" }}>The 1-Extra-EMI Hack:</Text> Paying just 1 additional EMI each year (or setting up an annual 5% EMI step-up) works directly against your principal balance during the earliest years when interest compounding is highest. This single habit can knock 3 to 8 years off a standard 20-year Indian home loan and save you enough money in interest to buy an entire second property!
                    </Text>
                </View>
            </View>
        </ScrollView>
    );
}
