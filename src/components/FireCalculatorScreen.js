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
    calculateFirePlan,
    calculateCagr,
    calculateXirr,
    formatCurrency,
    formatCompactCurrency,
} from "../utils/fireCalculations";

export default function FireCalculatorScreen({ theme = "dark", setTheme }) {
    const activeTheme = theme === "light" ? lightTheme : darkTheme;
    const captureViewRef = useRef(null);
    const [sharing, setSharing] = useState(false);

    // Main Workstation Mode: "fire" | "cagr" | "xirr"
    const [mode, setMode] = useState("fire");

    // ── Mode 1: FIRE Planner Inputs ──
    const [currentAge, setCurrentAge] = useState("30");
    const [targetRetirementAge, setTargetRetirementAge] = useState("45");
    const [currentMonthlyExpense, setCurrentMonthlyExpense] = useState("50000");
    const [currentSavings, setCurrentSavings] = useState("2000000");
    const [monthlySip, setMonthlySip] = useState("30000");
    const [expectedReturnRate, setExpectedReturnRate] = useState("12");
    const [inflationRate, setInflationRate] = useState("6");
    const [withdrawalMultiplier, setWithdrawalMultiplier] = useState("25"); // 25x (4% SWR)
    const [stepUpPercent, setStepUpPercent] = useState("5");

    // ── Mode 2: CAGR Inputs ──
    const [cagrInitial, setCagrInitial] = useState("100000");
    const [cagrFinal, setCagrFinal] = useState("350000");
    const [cagrYears, setCagrYears] = useState("5");

    // ── Mode 3: XIRR Cashflows State ──
    const [xirrCashflows, setXirrCashflows] = useState([
        { id: "1", date: "2022-01-01", amount: "-100000" },
        { id: "2", date: "2023-01-01", amount: "-120000" },
        { id: "3", date: "2024-01-01", amount: "-150000" },
        { id: "4", date: "2025-01-01", amount: "520000" },
    ]);

    // ── Calculations ──
    const firePlan = useMemo(() => {
        return calculateFirePlan({
            currentAge,
            targetRetirementAge,
            currentMonthlyExpense,
            currentSavings,
            monthlySip,
            expectedReturnRate,
            inflationRate,
            withdrawalMultiplier,
            stepUpPercent,
        });
    }, [currentAge, targetRetirementAge, currentMonthlyExpense, currentSavings, monthlySip, expectedReturnRate, inflationRate, withdrawalMultiplier, stepUpPercent]);

    const cagrResult = useMemo(() => {
        return calculateCagr(cagrInitial, cagrFinal, cagrYears);
    }, [cagrInitial, cagrFinal, cagrYears]);

    const xirrResult = useMemo(() => {
        return calculateXirr(xirrCashflows);
    }, [xirrCashflows]);

    // XIRR cashflow row handlers
    const handleAddXirrRow = () => {
        const lastDate = xirrCashflows.length > 0 ? xirrCashflows[xirrCashflows.length - 1].date : "2024-01-01";
        setXirrCashflows((prev) => [
            ...prev,
            { id: String(Date.now()), date: lastDate, amount: "" },
        ]);
    };

    const handleRemoveXirrRow = (id) => {
        if (xirrCashflows.length <= 2) return;
        setXirrCashflows((prev) => prev.filter((row) => row.id !== id));
    };

    const handleXirrRowChange = (id, field, value) => {
        setXirrCashflows((prev) =>
            prev.map((r) => (r.id === id ? { ...r, [field]: value } : r))
        );
    };

    const handleReset = () => {
        if (mode === "fire") {
            setCurrentAge("30");
            setTargetRetirementAge("45");
            setCurrentMonthlyExpense("50000");
            setCurrentSavings("2000000");
            setMonthlySip("30000");
            setExpectedReturnRate("12");
            setInflationRate("6");
            setWithdrawalMultiplier("25");
            setStepUpPercent("5");
        } else if (mode === "cagr") {
            setCagrInitial("100000");
            setCagrFinal("350000");
            setCagrYears("5");
        } else {
            setXirrCashflows([
                { id: "1", date: "2022-01-01", amount: "-100000" },
                { id: "2", date: "2023-01-01", amount: "-120000" },
                { id: "3", date: "2024-01-01", amount: "-150000" },
                { id: "4", date: "2025-01-01", amount: "520000" },
            ]);
        }
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
                        const file = new File([blob], "fire-plan.png", { type: "image/png" });
                        const shareText = mode === "fire"
                            ? `FIRE Plan: Target Corpus ${formatCurrency(firePlan.targetFireCorpus)} at Age ${firePlan.targetRetirementAge}. Projected: ${formatCurrency(firePlan.projectedCorpus)}`
                            : mode === "cagr"
                            ? `CAGR Return: ${cagrResult?.cagrPercent}% p.a. over ${cagrYears} yrs`
                            : `Portfolio XIRR: ${xirrResult}%`;

                        if (navigator.canShare({ files: [file] })) {
                            await navigator.share({ title: "FIRE & Returns Calculator", text: shareText, files: [file] });
                            shared = true;
                        }
                    } catch (err) {}
                }

                if (!shared && typeof document !== "undefined") {
                    const link = document.createElement("a");
                    link.href = dataUrl;
                    link.download = `fire-plan-${Date.now()}.png`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                }
            } else {
                const uri = await captureRef(captureViewRef, { format: "png", quality: 0.95 });
                if (await Sharing.isAvailableAsync()) {
                    await Sharing.shareAsync(uri, { mimeType: "image/png", dialogTitle: "Share FIRE Setup" });
                }
            }
        } catch (err) {
            Alert.alert("Share Failed", err.message || "Could not export FIRE plan.");
        } finally {
            setSharing(false);
        }
    };

    return (
        <ScrollView style={[styles.container, activeTheme.container]} contentContainerStyle={styles.contentWrapper}>
            <View ref={captureViewRef} collapsable={false}>

                {/* Main Header Card */}
                <View style={[styles.cardWrapper, activeTheme.card]}>
                    <View style={styles.header}>
                        <Text style={[styles.title, activeTheme.title]}>
                            🏖️ Wealth, FIRE & Returns Calculator
                        </Text>
                        <View style={styles.headerButtons}>
                            <TouchableOpacity style={[styles.themeToggle, activeTheme.toggle]} onPress={handleReset} activeOpacity={0.7}>
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

                    {/* Workstation Mode Switcher */}
                    <View style={styles.sipTypeToggleRow}>
                        <TouchableOpacity
                            style={[
                                styles.sipTypeButton,
                                mode === "fire" ? activeTheme.tabActive : activeTheme.toggle,
                                { borderColor: mode === "fire" ? activeTheme.investedColor : activeTheme.borderColor },
                            ]}
                            onPress={() => setMode("fire")}
                            activeOpacity={0.8}
                        >
                            <Text style={[styles.sipTypeText, mode === "fire" ? activeTheme.tabActiveText : { color: activeTheme.title.color }]}>
                                🔥 FIRE Planner
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[
                                styles.sipTypeButton,
                                mode === "cagr" ? activeTheme.tabActive : activeTheme.toggle,
                                { borderColor: mode === "cagr" ? activeTheme.investedColor : activeTheme.borderColor },
                            ]}
                            onPress={() => setMode("cagr")}
                            activeOpacity={0.8}
                        >
                            <Text style={[styles.sipTypeText, mode === "cagr" ? activeTheme.tabActiveText : { color: activeTheme.title.color }]}>
                                📈 CAGR Calculator
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[
                                styles.sipTypeButton,
                                mode === "xirr" ? activeTheme.tabActive : activeTheme.toggle,
                                { borderColor: mode === "xirr" ? activeTheme.investedColor : activeTheme.borderColor },
                            ]}
                            onPress={() => setMode("xirr")}
                            activeOpacity={0.8}
                        >
                            <Text style={[styles.sipTypeText, mode === "xirr" ? activeTheme.tabActiveText : { color: activeTheme.title.color }]}>
                                📊 Portfolio XIRR
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* ── Mode 1: FIRE Planner Inputs ── */}
                    {mode === "fire" && (
                        <View style={{ marginTop: 14 }}>
                            <View style={styles.grid}>
                                <View style={styles.col}>
                                    <Text style={[styles.label, activeTheme.label]}>Current Age</Text>
                                    <TextInput style={[styles.input, activeTheme.input, { borderColor: activeTheme.borderColor }]} keyboardType="numeric" value={currentAge} onChangeText={setCurrentAge} />
                                </View>

                                <View style={styles.col}>
                                    <Text style={[styles.label, activeTheme.label]}>Target FIRE Age</Text>
                                    <TextInput style={[styles.input, activeTheme.input, { borderColor: activeTheme.borderColor }]} keyboardType="numeric" value={targetRetirementAge} onChangeText={setTargetRetirementAge} />
                                </View>

                                <View style={styles.col}>
                                    <Text style={[styles.label, activeTheme.label]}>Monthly Expense (₹)</Text>
                                    <TextInput style={[styles.input, activeTheme.input, { borderColor: activeTheme.borderColor }]} keyboardType="numeric" value={currentMonthlyExpense} onChangeText={setCurrentMonthlyExpense} />
                                </View>

                                <View style={styles.col}>
                                    <Text style={[styles.label, activeTheme.label]}>Current Net Worth (₹)</Text>
                                    <TextInput style={[styles.input, activeTheme.input, { borderColor: activeTheme.borderColor }]} keyboardType="numeric" value={currentSavings} onChangeText={setCurrentSavings} />
                                </View>

                                <View style={styles.col}>
                                    <Text style={[styles.label, activeTheme.label]}>Monthly SIP (₹)</Text>
                                    <TextInput style={[styles.input, activeTheme.input, { borderColor: activeTheme.borderColor }]} keyboardType="numeric" value={monthlySip} onChangeText={setMonthlySip} />
                                </View>

                                <View style={styles.col}>
                                    <Text style={[styles.label, activeTheme.label]}>Expected Return (% p.a.)</Text>
                                    <TextInput style={[styles.input, activeTheme.input, { borderColor: activeTheme.borderColor }]} keyboardType="numeric" value={expectedReturnRate} onChangeText={setExpectedReturnRate} />
                                </View>

                                <View style={styles.col}>
                                    <Text style={[styles.label, activeTheme.label]}>Inflation Rate (% p.a.)</Text>
                                    <TextInput style={[styles.input, activeTheme.input, { borderColor: activeTheme.borderColor }]} keyboardType="numeric" value={inflationRate} onChangeText={setInflationRate} />
                                </View>

                                <View style={styles.col}>
                                    <Text style={[styles.label, activeTheme.label]}>SWR Rule (25x = 4%)</Text>
                                    <TextInput style={[styles.input, activeTheme.input, { borderColor: activeTheme.borderColor }]} keyboardType="numeric" value={withdrawalMultiplier} onChangeText={setWithdrawalMultiplier} />
                                </View>
                            </View>
                        </View>
                    )}

                    {/* ── Mode 2: CAGR Inputs ── */}
                    {mode === "cagr" && (
                        <View style={{ marginTop: 14 }}>
                            <View style={styles.grid}>
                                <View style={styles.col}>
                                    <Text style={[styles.label, activeTheme.label]}>Initial Investment (₹)</Text>
                                    <TextInput style={[styles.input, activeTheme.input, { borderColor: activeTheme.borderColor }]} keyboardType="numeric" value={cagrInitial} onChangeText={setCagrInitial} />
                                </View>
                                <View style={styles.col}>
                                    <Text style={[styles.label, activeTheme.label]}>Final Value (₹)</Text>
                                    <TextInput style={[styles.input, activeTheme.input, { borderColor: activeTheme.borderColor }]} keyboardType="numeric" value={cagrFinal} onChangeText={setCagrFinal} />
                                </View>
                                <View style={styles.fullCol}>
                                    <Text style={[styles.label, activeTheme.label]}>Time Horizon (Years)</Text>
                                    <TextInput style={[styles.input, activeTheme.input, { borderColor: activeTheme.borderColor }]} keyboardType="numeric" value={cagrYears} onChangeText={setCagrYears} />
                                </View>
                            </View>
                        </View>
                    )}

                    {/* ── Mode 3: XIRR Cashflows Table ── */}
                    {mode === "xirr" && (
                        <View style={{ marginTop: 14 }}>
                            <Text style={[styles.subtext, activeTheme.subtext, { fontSize: 12, marginBottom: 10 }]}>
                                Enter investment dates & amounts (Negative for deposits/outflows, Positive for current final value).
                            </Text>

                            {xirrCashflows.map((row, index) => (
                                <View key={row.id} style={{ flexDirection: "row", gap: 8, marginBottom: 8, alignItems: "center" }}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={[styles.label, activeTheme.label, { fontSize: 10 }]}>Date (YYYY-MM-DD)</Text>
                                        <TextInput style={[styles.input, activeTheme.input, { borderColor: activeTheme.borderColor, paddingVertical: 4, height: 36, fontSize: 12 }]} value={row.date} placeholder="YYYY-MM-DD" onChangeText={(v) => handleXirrRowChange(row.id, "date", v)} />
                                    </View>

                                    <View style={{ flex: 1 }}>
                                        <Text style={[styles.label, activeTheme.label, { fontSize: 10 }]}>Amount (₹)</Text>
                                        <TextInput style={[styles.input, activeTheme.input, { borderColor: activeTheme.borderColor, paddingVertical: 4, height: 36, fontSize: 12 }]} keyboardType="numeric" value={row.amount} placeholder="e.g. -50000 or 150000" onChangeText={(v) => handleXirrRowChange(row.id, "amount", v)} />
                                    </View>

                                    {xirrCashflows.length > 2 && (
                                        <TouchableOpacity onPress={() => handleRemoveXirrRow(row.id)} style={{ paddingHorizontal: 4, paddingTop: 14 }}>
                                            <Text style={{ fontSize: 16, color: "#EF4444" }}>✕</Text>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            ))}

                            <TouchableOpacity onPress={handleAddXirrRow} style={[styles.chip, activeTheme.toggle, { paddingVertical: 8, alignItems: "center", marginTop: 4 }]}>
                                <Text style={{ fontSize: 12, fontWeight: "700", color: activeTheme.title.color }}>+ Add Cashflow Transaction</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>

                {/* ── Mode 1: FIRE Results Dashboard ── */}
                {mode === "fire" && firePlan.isValid && (
                    <>
                        <View style={[styles.metricCard, activeTheme.card, { borderColor: activeTheme.borderColor }]}>
                            {/* FIRE Status Banner */}
                            <View style={{ padding: 12, borderRadius: 12, backgroundColor: firePlan.isFireAchievedAtTarget ? "#064E3B" : "#451A03", marginBottom: 12 }}>
                                <Text style={{ fontSize: 14, fontWeight: "900", color: firePlan.isFireAchievedAtTarget ? "#34D399" : "#FBBF24" }}>
                                    {firePlan.isFireAchievedAtTarget
                                        ? `🎉 FIRE Goal Achieved at Target Age ${firePlan.targetRetirementAge}!`
                                        : `⚠️ Deficit at Target Age ${firePlan.targetRetirementAge} (Reached at Age ${firePlan.fireAgeAchieved || "80+"})`}
                                </Text>
                            </View>

                            <View style={styles.metricRow}>
                                <Text style={[styles.totalMetricLabel, { color: "#10B981" }]}>Target FIRE Corpus (Age {firePlan.targetRetirementAge})</Text>
                                <Text style={[styles.totalMetricValue, { color: "#10B981" }]}>{formatCurrency(firePlan.targetFireCorpus)}</Text>
                            </View>

                            <View style={[styles.metricDivider, { backgroundColor: activeTheme.borderColor }]} />

                            <View style={styles.metricRow}>
                                <Text style={[styles.metricLabel, activeTheme.subtext]}>Projected Corpus at Age {firePlan.targetRetirementAge}</Text>
                                <Text style={[styles.metricValue, { color: activeTheme.investedColor }]}>{formatCurrency(firePlan.projectedCorpus)}</Text>
                            </View>

                            <View style={[styles.metricDivider, { backgroundColor: activeTheme.borderColor }]} />

                            <View style={styles.metricRow}>
                                <Text style={[styles.metricLabel, activeTheme.subtext]}>Future Inflated Monthly Expense</Text>
                                <Text style={[styles.metricValue, activeTheme.title]}>{formatCurrency(firePlan.futureMonthlyExpense)}/mo</Text>
                            </View>

                            {/* Lean & Fat FIRE Breakdown */}
                            <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}>
                                <View style={[{ flex: 1, padding: 10, borderRadius: 10, borderWidth: 1, borderColor: "#3B82F6" }, activeTheme.toggle]}>
                                    <Text style={{ fontSize: 10, color: activeTheme.subtext.color }}>🌱 Lean FIRE (75% Exp)</Text>
                                    <Text style={{ fontSize: 13, fontWeight: "800", color: "#3B82F6", marginTop: 2 }}>{formatCompactCurrency(firePlan.leanFireCorpus)}</Text>
                                    {firePlan.leanFireAgeAchieved && <Text style={{ fontSize: 10, color: activeTheme.subtext.color }}>Age {firePlan.leanFireAgeAchieved}</Text>}
                                </View>

                                <View style={[{ flex: 1, padding: 10, borderRadius: 10, borderWidth: 1, borderColor: "#8B5CF6" }, activeTheme.toggle]}>
                                    <Text style={{ fontSize: 10, color: activeTheme.subtext.color }}>🚀 Fat FIRE (125% Exp)</Text>
                                    <Text style={{ fontSize: 13, fontWeight: "800", color: "#8B5CF6", marginTop: 2 }}>{formatCompactCurrency(firePlan.fatFireCorpus)}</Text>
                                </View>
                            </View>

                            {/* Coast FIRE Banner */}
                            <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: activeTheme.borderColor, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                                <View style={{ flex: 1 }}>
                                    <Text style={[styles.label, activeTheme.title, { fontSize: 12 }]}>🏖️ Coast FIRE Number Today:</Text>
                                    <Text style={[styles.subtext, activeTheme.subtext, { fontSize: 10 }]}>Amount needed today to compound untouched to FIRE corpus</Text>
                                </View>
                                <Text style={{ fontSize: 14, fontWeight: "800", color: firePlan.isCoastFireAchieved ? "#10B981" : "#F59E0B" }}>
                                    {formatCurrency(firePlan.coastFireNumber)} {firePlan.isCoastFireAchieved ? "✓ Passed" : ""}
                                </Text>
                            </View>
                        </View>

                        {/* FIRE Milestone Progression Ledger Table */}
                        {firePlan.milestones.length > 0 && (
                            <View style={[styles.tableCard, activeTheme.card, { borderColor: activeTheme.borderColor, marginTop: 14 }]}>
                                <Text style={[styles.tableTitle, activeTheme.title]}>📊 FIRE Net Worth Progression Timeline</Text>
                                <View style={[styles.tableHeader, { backgroundColor: activeTheme.tableHeaderBg }]}>
                                    <Text style={[styles.tableHeaderCell, { textAlign: "left", flex: 0.6 }, activeTheme.subtext]}>Age</Text>
                                    <Text style={[styles.tableHeaderCell, activeTheme.subtext]}>Invested</Text>
                                    <Text style={[styles.tableHeaderCell, activeTheme.subtext]}>Net Worth</Text>
                                    <Text style={[styles.tableHeaderCell, activeTheme.title]}>FIRE Target</Text>
                                </View>

                                {firePlan.milestones.slice(0, 20).map((m) => (
                                    <View key={m.age} style={[styles.tableRow, { borderBottomColor: activeTheme.borderColor }, m.isFireAchieved ? { backgroundColor: "rgba(16, 185, 129, 0.08)" } : null]}>
                                        <View style={{ flex: 0.6, justifyContent: "center" }}>
                                            <Text style={[styles.tableCell, { textAlign: "left" }, activeTheme.title]}>Age {m.age}</Text>
                                        </View>
                                        <Text style={[styles.tableCell, activeTheme.subtext]}>{formatCompactCurrency(m.totalInvested)}</Text>
                                        <Text style={[styles.tableCell, { fontWeight: "700", color: m.isFireAchieved ? "#10B981" : activeTheme.title.color }]}>{formatCompactCurrency(m.closingCorpus)}</Text>
                                        <Text style={[styles.tableCell, activeTheme.subtext]}>{formatCompactCurrency(m.targetFireCorpus)}</Text>
                                    </View>
                                ))}
                            </View>
                        )}
                    </>
                )}

                {/* ── Mode 2: CAGR Results Card ── */}
                {mode === "cagr" && cagrResult && (
                    <View style={[styles.metricCard, activeTheme.card, { borderColor: activeTheme.borderColor }]}>
                        <View style={styles.metricRow}>
                            <Text style={[styles.totalMetricLabel, { color: "#10B981" }]}>CAGR (Annualized Return)</Text>
                            <Text style={[styles.totalMetricValue, { color: "#10B981" }]}>{cagrResult.cagrPercent}% p.a.</Text>
                        </View>
                        <View style={[styles.metricDivider, { backgroundColor: activeTheme.borderColor }]} />
                        <View style={styles.metricRow}>
                            <Text style={[styles.metricLabel, activeTheme.subtext]}>Absolute Gain (%)</Text>
                            <Text style={[styles.metricValue, { color: "#3B82F6" }]}>+{cagrResult.absoluteReturnPercent}%</Text>
                        </View>
                        <View style={[styles.metricDivider, { backgroundColor: activeTheme.borderColor }]} />
                        <View style={styles.metricRow}>
                            <Text style={[styles.metricLabel, activeTheme.subtext]}>Total Profit Generated</Text>
                            <Text style={[styles.metricValue, { color: "#10B981" }]}>+{formatCurrency(cagrResult.totalProfit)}</Text>
                        </View>
                    </View>
                )}

                {/* ── Mode 3: XIRR Results Card ── */}
                {mode === "xirr" && (
                    <View style={[styles.metricCard, activeTheme.card, { borderColor: activeTheme.borderColor }]}>
                        <View style={styles.metricRow}>
                            <Text style={[styles.totalMetricLabel, { color: "#10B981" }]}>Portfolio XIRR (Annualized)</Text>
                            <Text style={[styles.totalMetricValue, { color: xirrResult != null ? "#10B981" : "#EF4444" }]}>
                                {xirrResult != null ? `${xirrResult}%` : "Invalid Cashflows"}
                            </Text>
                        </View>
                    </View>
                )}

                {/* Share Button */}
                <TouchableOpacity
                    style={[styles.themeToggle, activeTheme.toggle, { marginVertical: 12, paddingVertical: 13, borderRadius: 12, borderWidth: 1, borderColor: activeTheme.borderColor, alignItems: "center" }]}
                    onPress={handleShare}
                    disabled={sharing}
                >
                    <Text style={{ fontSize: 14, fontWeight: "700", color: activeTheme.title.color }}>{sharing ? "⏳ Generating..." : "📤 Share / Export Setup"}</Text>
                </TouchableOpacity>

            </View>
            <View style={{ height: 30 }} />
        </ScrollView>
    );
}
