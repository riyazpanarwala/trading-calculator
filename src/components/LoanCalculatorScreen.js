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
    calculateRateRevision,
    calculateBalanceTransfer,
    calculateMoratoriumLoan,
    formatCurrency,
    formatCompactCurrency,
} from "../utils/loanCalculations";

export default function LoanCalculatorScreen({ theme = "dark", setTheme }) {
    const activeTheme = theme === "light" ? lightTheme : darkTheme;
    const captureViewRef = useRef(null);
    const [sharing, setSharing] = useState(false);

    const [activePresetId, setActivePresetId] = useState("home");
    const [principal, setPrincipal] = useState("5000000");
    const [annualRate, setAnnualRate] = useState("8.5");
    const [tenureYears, setTenureYears] = useState("20");

    // Prepayment Strategies
    const [oneExtraEmiPerYear, setOneExtraEmiPerYear] = useState(true);
    const [extraMonthly, setExtraMonthly] = useState("0");
    const [annualStepUpPercent, setAnnualStepUpPercent] = useState("0");
    const [lumpSumAmount, setLumpSumAmount] = useState("0");
    const [lumpSumYear, setLumpSumYear] = useState("3");
    const [sipReturnRate, setSipReturnRate] = useState("12");

    // Feature 1: Rate Hike Simulator
    const [newRate, setNewRate] = useState("9.5");
    const [showRateHike, setShowRateHike] = useState(false);

    // Feature 2: Loan Balance Transfer
    const [switchBankRate, setSwitchBankRate] = useState("7.8");
    const [transferFees, setTransferFees] = useState("10000");
    const [showBalanceTransfer, setShowBalanceTransfer] = useState(false);

    const handleSelectPreset = (preset) => {
        setActivePresetId(preset.id);
        setPrincipal(String(preset.principal));
        setAnnualRate(String(preset.rate));
        setTenureYears(String(preset.years));
    };

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
    }, [principal, annualRate, tenureYears, extraMonthly, oneExtraEmiPerYear, annualStepUpPercent, lumpSumAmount, lumpSumYear, sipReturnRate]);

    const rateRevisionResult = useMemo(() => {
        return calculateRateRevision(principal, annualRate, newRate, tenureYears, plan.originalEmi);
    }, [principal, annualRate, newRate, tenureYears, plan.originalEmi]);

    const transferResult = useMemo(() => {
        return calculateBalanceTransfer(principal, annualRate, switchBankRate, tenureYears, transferFees);
    }, [principal, annualRate, switchBankRate, tenureYears, transferFees]);

    const handleReset = () => {
        const defaultPreset = LOAN_PRESETS.find((p) => p.id === "home") || LOAN_PRESETS[0];
        handleSelectPreset(defaultPreset);
        setOneExtraEmiPerYear(true);
        setExtraMonthly("0");
        setAnnualStepUpPercent("0");
        setLumpSumAmount("0");
        setLumpSumYear("3");
        setSipReturnRate("12");
        setNewRate("9.5");
        setSwitchBankRate("7.8");
        setTransferFees("10000");
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
                        const file = new File([blob], "loan-plan.png", { type: "image/png" });
                        const shareText = `Loan Plan: EMI ${formatCurrency(plan.originalEmi)}/mo for ${tenureYears} yrs. Interest Saved with Prepayment: ${formatCurrency(plan.interestSaved)}`;

                        if (navigator.canShare({ files: [file] })) {
                            await navigator.share({ title: "Smart Loan & Prepayment Plan", text: shareText, files: [file] });
                            shared = true;
                        }
                    } catch (err) {}
                }

                if (!shared && typeof document !== "undefined") {
                    const link = document.createElement("a");
                    link.href = dataUrl;
                    link.download = `loan-plan-${Date.now()}.png`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                }
            } else {
                const uri = await captureRef(captureViewRef, { format: "png", quality: 0.95 });
                if (await Sharing.isAvailableAsync()) {
                    await Sharing.shareAsync(uri, { mimeType: "image/png", dialogTitle: "Share Loan Plan" });
                }
            }
        } catch (err) {
            Alert.alert("Share Failed", err.message || "Could not export loan plan.");
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
                            🏠 Loan, Prepayment & EMI vs SIP
                        </Text>
                        <View style={styles.headerButtons}>
                            <TouchableOpacity style={[styles.themeToggle, activeTheme.toggle]} onPress={handleReset} activeOpacity={0.7}>
                                <Text style={[styles.themeToggleText, { color: activeTheme.title.color }]}>🗑 Reset</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Presets Bar */}
                    <Text style={[styles.label, activeTheme.label, { fontSize: 12, marginBottom: 6 }]}>Loan Presets:</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 8 }}>
                        {LOAN_PRESETS.map((p) => {
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
                            <Text style={[styles.label, activeTheme.label]}>Loan Amount (₹)</Text>
                            <TextInput style={[styles.input, activeTheme.input, { borderColor: activeTheme.borderColor }]} keyboardType="numeric" value={principal} onChangeText={setPrincipal} />
                        </View>
                        <View style={styles.col}>
                            <Text style={[styles.label, activeTheme.label]}>Interest Rate (% p.a.)</Text>
                            <TextInput style={[styles.input, activeTheme.input, { borderColor: activeTheme.borderColor }]} keyboardType="numeric" value={annualRate} onChangeText={setAnnualRate} />
                        </View>
                        <View style={styles.fullCol}>
                            <Text style={[styles.label, activeTheme.label]}>Tenure (Years)</Text>
                            <TextInput style={[styles.input, activeTheme.input, { borderColor: activeTheme.borderColor }]} keyboardType="numeric" value={tenureYears} onChangeText={setTenureYears} />
                        </View>
                    </View>
                </View>

                {/* Primary Result Summary */}
                {plan.isValid && (
                    <View style={[styles.metricCard, activeTheme.card, { borderColor: activeTheme.borderColor }]}>
                        <View style={styles.metricRow}>
                            <Text style={[styles.metricLabel, activeTheme.subtext]}>Monthly EMI</Text>
                            <Text style={[styles.metricValue, { color: activeTheme.investedColor }]}>{formatCurrency(plan.originalEmi)}/mo</Text>
                        </View>
                        <View style={[styles.metricDivider, { backgroundColor: activeTheme.borderColor }]} />
                        <View style={styles.metricRow}>
                            <Text style={[styles.metricLabel, activeTheme.subtext]}>Total Interest Payable</Text>
                            <Text style={[styles.metricValue, { color: "#EF4444" }]}>{formatCurrency(plan.originalTotalInterest)}</Text>
                        </View>
                        {plan.hasPrepayment && (
                            <>
                                <View style={[styles.metricDivider, { backgroundColor: activeTheme.borderColor }]} />
                                <View style={styles.metricRow}>
                                    <Text style={[styles.totalMetricLabel, { color: "#10B981" }]}>Interest Saved by Prepayments</Text>
                                    <Text style={[styles.totalMetricValue, { color: "#10B981" }]}>+{formatCurrency(plan.interestSaved)}</Text>
                                </View>
                                <View style={[styles.metricDivider, { backgroundColor: activeTheme.borderColor }]} />
                                <View style={styles.metricRow}>
                                    <Text style={[styles.metricLabel, activeTheme.subtext]}>New Reduced Tenure</Text>
                                    <Text style={[styles.metricValue, { color: "#3B82F6", fontWeight: "800" }]}>{plan.newTenureYears} Years (Saved {plan.yearsSaved} Yrs!)</Text>
                                </View>
                            </>
                        )}
                    </View>
                )}

                {/* Feature 1: Floating Rate Hike Simulator */}
                <View style={[styles.cardWrapper, activeTheme.card, { marginTop: 14 }]}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                            <Text style={{ fontSize: 16 }}>📈</Text>
                            <Text style={[styles.title, activeTheme.title, { fontSize: 15 }]}>
                                Floating Interest Rate Hike / Cut Simulator
                            </Text>
                        </View>
                        <TouchableOpacity onPress={() => setShowRateHike((prev) => !prev)} style={[styles.chip, activeTheme.toggle, { paddingHorizontal: 10, paddingVertical: 4 }]}>
                            <Text style={{ fontSize: 12, fontWeight: "600", color: activeTheme.title.color }}>{showRateHike ? "Hide ▲" : "Show ▼"}</Text>
                        </TouchableOpacity>
                    </View>

                    {showRateHike && (
                        <View>
                            <Text style={[styles.label, activeTheme.label, { fontSize: 12 }]}>New Interest Rate (% p.a.):</Text>
                            <TextInput style={[styles.input, activeTheme.input, { borderColor: activeTheme.borderColor, paddingVertical: 4, height: 36, fontSize: 13, marginBottom: 10 }]} keyboardType="numeric" value={newRate} onChangeText={setNewRate} />

                            <View style={{ flexDirection: "row", gap: 10 }}>
                                <View style={[{ flex: 1, padding: 10, borderRadius: 10, borderWidth: 1, borderColor: activeTheme.borderColor }, activeTheme.card]}>
                                    <Text style={{ fontSize: 11, color: activeTheme.subtext.color }}>Option A: Keep Tenure Same</Text>
                                    <Text style={{ fontSize: 13, fontWeight: "800", color: "#EF4444", marginTop: 2 }}>{formatCurrency(rateRevisionResult.newEmiSameTenure)}/mo</Text>
                                    <Text style={{ fontSize: 10, color: activeTheme.subtext.color }}> (+{formatCurrency(rateRevisionResult.emiDifference)}/mo)</Text>
                                </View>
                                <View style={[{ flex: 1, padding: 10, borderRadius: 10, borderWidth: 1, borderColor: activeTheme.borderColor }, activeTheme.card]}>
                                    <Text style={{ fontSize: 11, color: activeTheme.subtext.color }}>Option B: Keep EMI Same</Text>
                                    <Text style={{ fontSize: 13, fontWeight: "800", color: "#F59E0B", marginTop: 2 }}>{rateRevisionResult.newTenureSameEmiYears} Years</Text>
                                    <Text style={{ fontSize: 10, color: activeTheme.subtext.color }}> (+{rateRevisionResult.extraMonths} months)</Text>
                                </View>
                            </View>
                        </View>
                    )}
                </View>

                {/* Feature 2: Loan Balance Transfer Switch Calculator */}
                <View style={[styles.cardWrapper, activeTheme.card, { marginTop: 14 }]}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                            <Text style={{ fontSize: 16 }}>🏦</Text>
                            <Text style={[styles.title, activeTheme.title, { fontSize: 15 }]}>
                                Loan Balance Transfer (Bank Switch) Calculator
                            </Text>
                        </View>
                        <TouchableOpacity onPress={() => setShowBalanceTransfer((prev) => !prev)} style={[styles.chip, activeTheme.toggle, { paddingHorizontal: 10, paddingVertical: 4 }]}>
                            <Text style={{ fontSize: 12, fontWeight: "600", color: activeTheme.title.color }}>{showBalanceTransfer ? "Hide ▲" : "Show ▼"}</Text>
                        </TouchableOpacity>
                    </View>

                    {showBalanceTransfer && (
                        <View>
                            <View style={{ flexDirection: "row", gap: 10, marginBottom: 10 }}>
                                <View style={{ flex: 1 }}>
                                    <Text style={[styles.label, activeTheme.label, { fontSize: 11 }]}>New Bank Rate %</Text>
                                    <TextInput style={[styles.input, activeTheme.input, { borderColor: activeTheme.borderColor, paddingVertical: 4, height: 36, fontSize: 13 }]} keyboardType="numeric" value={switchBankRate} onChangeText={setSwitchBankRate} />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={[styles.label, activeTheme.label, { fontSize: 11 }]}>Transfer Fee (₹)</Text>
                                    <TextInput style={[styles.input, activeTheme.input, { borderColor: activeTheme.borderColor, paddingVertical: 4, height: 36, fontSize: 13 }]} keyboardType="numeric" value={transferFees} onChangeText={setTransferFees} />
                                </View>
                            </View>

                            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                                <Text style={[styles.label, { color: "#10B981" }]}>Net Lifetime Interest Savings:</Text>
                                <Text style={{ fontSize: 15, fontWeight: "800", color: "#10B981" }}>+{formatCurrency(transferResult.netSavings)}</Text>
                            </View>
                        </View>
                    )}
                </View>

                {/* Share Button */}
                <TouchableOpacity
                    style={[styles.themeToggle, activeTheme.toggle, { marginVertical: 12, paddingVertical: 13, borderRadius: 12, borderWidth: 1, borderColor: activeTheme.borderColor, alignItems: "center" }]}
                    onPress={handleShare}
                    disabled={sharing}
                >
                    <Text style={{ fontSize: 14, fontWeight: "700", color: activeTheme.title.color }}>{sharing ? "⏳ Generating..." : "📤 Share / Export Loan Plan"}</Text>
                </TouchableOpacity>

            </View>
            <View style={{ height: 30 }} />
        </ScrollView>
    );
}
