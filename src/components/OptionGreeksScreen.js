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
    calculateBlackScholes,
    calculateImpliedVolatility,
    calculateGreeksScenario,
    formatCurrency,
} from "../utils/greeksCalculations";

const QUICK_GREEKS_PRESETS = [
    { id: "nifty", label: "🎯 Nifty 24500", spot: "24500", strike: "24500", days: "5", iv: "15" },
    { id: "banknifty", label: "🏦 BankNifty 52000", spot: "52000", strike: "52000", days: "5", iv: "18" },
    { id: "sensex", label: "📈 Sensex 80000", spot: "80000", strike: "80000", days: "5", iv: "14" },
    { id: "stock", label: "💼 Stock ATM", spot: "2500", strike: "2500", days: "20", iv: "24" },
];

export default function OptionGreeksScreen({ theme = "dark", setTheme }) {
    const activeTheme = theme === "light" ? lightTheme : darkTheme;
    const captureViewRef = useRef(null);
    const [sharing, setSharing] = useState(false);

    // Inputs
    const [spotPrice, setSpotPrice] = useState("24500");
    const [strikePrice, setStrikePrice] = useState("24500");
    const [timeToExpiryDays, setTimeToExpiryDays] = useState("5");
    const [volatilityPercent, setVolatilityPercent] = useState("15");
    const [riskFreeRatePercent, setRiskFreeRatePercent] = useState("6.5");

    // IV Solver Tool state
    const [marketOptionPrice, setMarketOptionPrice] = useState("140");
    const [marketOptionType, setMarketOptionType] = useState("call");

    // What-If Scenario Simulator state
    const [simSpotMove, setSimSpotMove] = useState("100");
    const [simDaysPassed, setSimDaysPassed] = useState("2");
    const [simIvChange, setSimIvChange] = useState("0");
    const [showScenario, setShowScenario] = useState(true);

    const baseParams = useMemo(() => ({
        spotPrice,
        strikePrice,
        timeToExpiryDays,
        volatilityPercent,
        riskFreeRatePercent,
    }), [spotPrice, strikePrice, timeToExpiryDays, volatilityPercent, riskFreeRatePercent]);

    const bs = useMemo(() => {
        return calculateBlackScholes(baseParams);
    }, [baseParams]);

    const solvedIv = useMemo(() => {
        return calculateImpliedVolatility({
            marketPrice: marketOptionPrice,
            optionType: marketOptionType,
            spotPrice,
            strikePrice,
            timeToExpiryDays,
            riskFreeRatePercent,
        });
    }, [marketOptionPrice, marketOptionType, spotPrice, strikePrice, timeToExpiryDays, riskFreeRatePercent]);

    const scenario = useMemo(() => {
        return calculateGreeksScenario({
            baseParams,
            spotMovePoints: simSpotMove,
            daysElapsed: simDaysPassed,
            ivChangePercent: simIvChange,
        });
    }, [baseParams, simSpotMove, simDaysPassed, simIvChange]);

    const handleSelectPreset = (preset) => {
        setSpotPrice(preset.spot);
        setStrikePrice(preset.strike);
        setTimeToExpiryDays(preset.days);
        setVolatilityPercent(preset.iv);
    };

    const handleReset = () => {
        setSpotPrice("24500");
        setStrikePrice("24500");
        setTimeToExpiryDays("5");
        setVolatilityPercent("15");
        setRiskFreeRatePercent("6.5");
        setMarketOptionPrice("140");
        setSimSpotMove("100");
        setSimDaysPassed("2");
        setSimIvChange("0");
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
                        const file = new File([blob], "option-greeks.png", { type: "image/png" });
                        const shareText = `Black-Scholes Option Greeks: Spot ${spotPrice}, Strike ${strikePrice}. Call: ${formatCurrency(bs.callPrice)} (Delta: ${bs.callDelta}), Put: ${formatCurrency(bs.putPrice)} (Delta: ${bs.putDelta})`;

                        if (navigator.canShare({ files: [file] })) {
                            await navigator.share({ title: "Option Pricing & Greeks", text: shareText, files: [file] });
                            shared = true;
                        }
                    } catch (err) {}
                }

                if (!shared && typeof document !== "undefined") {
                    const link = document.createElement("a");
                    link.href = dataUrl;
                    link.download = `option-greeks-${Date.now()}.png`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                }
            } else {
                const uri = await captureRef(captureViewRef, { format: "png", quality: 0.95 });
                if (await Sharing.isAvailableAsync()) {
                    await Sharing.shareAsync(uri, { mimeType: "image/png", dialogTitle: "Share Option Greeks Setup" });
                }
            }
        } catch (err) {
            Alert.alert("Share Failed", err.message || "Could not export option greeks setup.");
        } finally {
            setSharing(false);
        }
    };

    return (
        <ScrollView style={[styles.container, activeTheme.container]} contentContainerStyle={styles.contentWrapper}>
            <View ref={captureViewRef} collapsable={false}>

                {/* Main Input Card */}
                <View style={[styles.cardWrapper, activeTheme.card]}>
                    <View style={styles.header}>
                        <Text style={[styles.title, activeTheme.title]}>
                            ⚡ Options Black-Scholes & Greeks Calculator
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

                    {/* Quick Presets */}
                    <Text style={[styles.label, activeTheme.label, { fontSize: 12, marginBottom: 6 }]}>Quick Market Presets:</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 8 }}>
                        {QUICK_GREEKS_PRESETS.map((p) => (
                            <TouchableOpacity
                                key={p.id}
                                style={[styles.chip, activeTheme.toggle, { paddingHorizontal: 12, paddingVertical: 6, borderColor: activeTheme.borderColor }]}
                                onPress={() => handleSelectPreset(p)}
                            >
                                <Text style={[styles.chipText, { color: activeTheme.title.color }]}>{p.label}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    {/* Input Grid */}
                    <View style={styles.grid}>
                        <View style={styles.col}>
                            <Text style={[styles.label, activeTheme.label]}>Underlying Spot Price (₹)</Text>
                            <TextInput style={[styles.input, activeTheme.input, { borderColor: activeTheme.borderColor }]} keyboardType="numeric" value={spotPrice} onChangeText={setSpotPrice} />
                        </View>

                        <View style={styles.col}>
                            <Text style={[styles.label, activeTheme.label]}>Option Strike Price (₹)</Text>
                            <TextInput style={[styles.input, activeTheme.input, { borderColor: activeTheme.borderColor }]} keyboardType="numeric" value={strikePrice} onChangeText={setStrikePrice} />
                        </View>

                        <View style={styles.col}>
                            <Text style={[styles.label, activeTheme.label]}>Days to Expiry (D)</Text>
                            <TextInput style={[styles.input, activeTheme.input, { borderColor: activeTheme.borderColor }]} keyboardType="numeric" value={timeToExpiryDays} onChangeText={setTimeToExpiryDays} />
                        </View>

                        <View style={styles.col}>
                            <Text style={[styles.label, activeTheme.label]}>Implied Volatility (IV %)</Text>
                            <TextInput style={[styles.input, activeTheme.input, { borderColor: activeTheme.borderColor }]} keyboardType="numeric" value={volatilityPercent} onChangeText={setVolatilityPercent} />
                        </View>

                        <View style={styles.fullCol}>
                            <Text style={[styles.label, activeTheme.label]}>Risk-Free Rate (% p.a.)</Text>
                            <TextInput style={[styles.input, activeTheme.input, { borderColor: activeTheme.borderColor }]} keyboardType="numeric" value={riskFreeRatePercent} onChangeText={setRiskFreeRatePercent} />
                        </View>
                    </View>
                </View>

                {/* Black-Scholes Fair Value Cards */}
                {bs.isValid && (
                    <View style={{ flexDirection: "row", gap: 10, marginBottom: 16 }}>
                        {/* Call Option Card */}
                        <View style={[{ flex: 1, padding: 14, borderRadius: 14, borderWidth: 2, borderColor: "#10B981" }, activeTheme.card]}>
                            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                                <Text style={{ fontSize: 15, fontWeight: "800", color: "#10B981" }}>📞 CALL Option</Text>
                                <View style={[styles.phaseBadge, { backgroundColor: "#064E3B" }]}>
                                    <Text style={{ fontSize: 10, fontWeight: "700", color: "#34D399" }}>{bs.moneyness}</Text>
                                </View>
                            </View>
                            <Text style={{ fontSize: 11, color: activeTheme.subtext.color }}>Theoretical Price</Text>
                            <Text style={{ fontSize: 20, fontWeight: "900", color: "#10B981", marginVertical: 2 }}>
                                {formatCurrency(bs.callPrice)}
                            </Text>
                            <Text style={{ fontSize: 10, color: activeTheme.subtext.color }}>
                                Intrinsic: {formatCurrency(bs.intrinsicCall)} | Time: {formatCurrency(bs.timeValueCall)}
                            </Text>
                        </View>

                        {/* Put Option Card */}
                        <View style={[{ flex: 1, padding: 14, borderRadius: 14, borderWidth: 2, borderColor: "#EF4444" }, activeTheme.card]}>
                            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                                <Text style={{ fontSize: 15, fontWeight: "800", color: "#EF4444" }}>📉 PUT Option</Text>
                                <View style={[styles.phaseBadge, { backgroundColor: "#451A22" }]}>
                                    <Text style={{ fontSize: 10, fontWeight: "700", color: "#F87171" }}>{bs.moneyness}</Text>
                                </View>
                            </View>
                            <Text style={{ fontSize: 11, color: activeTheme.subtext.color }}>Theoretical Price</Text>
                            <Text style={{ fontSize: 20, fontWeight: "900", color: "#EF4444", marginVertical: 2 }}>
                                {formatCurrency(bs.putPrice)}
                            </Text>
                            <Text style={{ fontSize: 10, color: activeTheme.subtext.color }}>
                                Intrinsic: {formatCurrency(bs.intrinsicPut)} | Time: {formatCurrency(bs.timeValuePut)}
                            </Text>
                        </View>
                    </View>
                )}

                {/* ── 5 Option Greeks Dashboard Card ── */}
                {bs.isValid && (
                    <View style={[styles.cardWrapper, activeTheme.card, { marginBottom: 16 }]}>
                        <Text style={[styles.title, activeTheme.title, { fontSize: 16, marginBottom: 14 }]}>
                            🏛️ Option Greeks Dashboard
                        </Text>

                        <View style={{ gap: 10 }}>
                            {/* Delta */}
                            <View style={[{ padding: 12, borderRadius: 12, borderWidth: 1, borderColor: "#3B82F6" }, activeTheme.toggle]}>
                                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                                    <View>
                                        <Text style={{ fontSize: 14, fontWeight: "800", color: "#3B82F6" }}>🟢 Delta ($\Delta$)</Text>
                                        <Text style={{ fontSize: 11, color: activeTheme.subtext.color }}>Sensitivity per +1 point spot move</Text>
                                    </View>
                                    <View style={{ alignItems: "flex-end" }}>
                                        <Text style={{ fontSize: 13, fontWeight: "800", color: "#10B981" }}>Call: +{bs.callDelta}</Text>
                                        <Text style={{ fontSize: 13, fontWeight: "800", color: "#EF4444" }}>Put: {bs.putDelta}</Text>
                                    </View>
                                </View>
                            </View>

                            {/* Gamma */}
                            <View style={[{ padding: 12, borderRadius: 12, borderWidth: 1, borderColor: "#F59E0B" }, activeTheme.toggle]}>
                                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                                    <View>
                                        <Text style={{ fontSize: 14, fontWeight: "800", color: "#F59E0B" }}>⚡ Gamma ($\Gamma$)</Text>
                                        <Text style={{ fontSize: 11, color: activeTheme.subtext.color }}>Delta acceleration per +1 point spot move</Text>
                                    </View>
                                    <Text style={{ fontSize: 15, fontWeight: "800", color: "#F59E0B" }}>{bs.gamma}</Text>
                                </View>
                            </View>

                            {/* Theta */}
                            <View style={[{ padding: 12, borderRadius: 12, borderWidth: 1, borderColor: "#EF4444" }, activeTheme.toggle]}>
                                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                                    <View>
                                        <Text style={{ fontSize: 14, fontWeight: "800", color: "#EF4444" }}>⏰ Theta ($\Theta$)</Text>
                                        <Text style={{ fontSize: 11, color: activeTheme.subtext.color }}>Daily time decay loss (calendar day)</Text>
                                    </View>
                                    <View style={{ alignItems: "flex-end" }}>
                                        <Text style={{ fontSize: 13, fontWeight: "800", color: "#EF4444" }}>Call: -{formatCurrency(Math.abs(bs.callThetaDaily))}/day</Text>
                                        <Text style={{ fontSize: 13, fontWeight: "800", color: "#EF4444" }}>Put: -{formatCurrency(Math.abs(bs.putThetaDaily))}/day</Text>
                                    </View>
                                </View>
                            </View>

                            {/* Vega */}
                            <View style={[{ padding: 12, borderRadius: 12, borderWidth: 1, borderColor: "#8B5CF6" }, activeTheme.toggle]}>
                                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                                    <View>
                                        <Text style={{ fontSize: 14, fontWeight: "800", color: "#8B5CF6" }}>🌊 Vega ($\nu$)</Text>
                                        <Text style={{ fontSize: 11, color: activeTheme.subtext.color }}>Price change per +1% IV move</Text>
                                    </View>
                                    <Text style={{ fontSize: 15, fontWeight: "800", color: "#8B5CF6" }}>+{formatCurrency(bs.vega)} / 1% IV</Text>
                                </View>
                            </View>
                        </View>
                    </View>
                )}

                {/* ── Implied Volatility (IV) Reverse Solver ── */}
                <View style={[styles.cardWrapper, activeTheme.card, { marginBottom: 16 }]}>
                    <Text style={[styles.title, activeTheme.title, { fontSize: 15, marginBottom: 6 }]}>
                        🔍 Implied Volatility (IV) Reverse Solver
                    </Text>
                    <Text style={[styles.subtext, activeTheme.subtext, { fontSize: 12, marginBottom: 12 }]}>
                        Enter the current market traded option price to solve for exact implied volatility (IV %).
                    </Text>

                    <View style={{ flexDirection: "row", gap: 10, alignItems: "center" }}>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.label, activeTheme.label, { fontSize: 11 }]}>Market Option Price (₹)</Text>
                            <TextInput style={[styles.input, activeTheme.input, { borderColor: activeTheme.borderColor, paddingVertical: 4, height: 36, fontSize: 13 }]} keyboardType="numeric" value={marketOptionPrice} onChangeText={setMarketOptionPrice} />
                        </View>

                        <View style={{ flex: 1 }}>
                            <Text style={[styles.label, activeTheme.label, { fontSize: 11 }]}>Option Type</Text>
                            <View style={{ flexDirection: "row", gap: 4 }}>
                                <TouchableOpacity style={[styles.chip, marketOptionType === "call" ? activeTheme.tabActive : activeTheme.toggle, { flex: 1, alignItems: "center" }]} onPress={() => setMarketOptionType("call")}>
                                    <Text style={[styles.chipText, marketOptionType === "call" ? activeTheme.tabActiveText : { color: activeTheme.title.color }]}>Call</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={[styles.chip, marketOptionType === "put" ? activeTheme.tabActive : activeTheme.toggle, { flex: 1, alignItems: "center" }]} onPress={() => setMarketOptionType("put")}>
                                    <Text style={[styles.chipText, marketOptionType === "put" ? activeTheme.tabActiveText : { color: activeTheme.title.color }]}>Put</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>

                    {solvedIv != null && (
                        <View style={{ marginTop: 12, padding: 10, borderRadius: 10, backgroundColor: activeTheme.toggle.backgroundColor, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                            <Text style={[styles.label, activeTheme.label]}>Implied Volatility (IV):</Text>
                            <Text style={{ fontSize: 16, fontWeight: "900", color: "#10B981" }}>{solvedIv}%</Text>
                        </View>
                    )}
                </View>

                {/* ── What-If Scenario Projection Simulator ── */}
                {scenario && (
                    <View style={[styles.cardWrapper, activeTheme.card, { marginBottom: 16 }]}>
                        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                                <Text style={{ fontSize: 16 }}>🔮</Text>
                                <Text style={[styles.title, activeTheme.title, { fontSize: 15 }]}>
                                    What-If Scenario Simulator
                                </Text>
                            </View>
                            <TouchableOpacity onPress={() => setShowScenario((prev) => !prev)} style={[styles.chip, activeTheme.toggle, { paddingHorizontal: 10, paddingVertical: 4 }]}>
                                <Text style={{ fontSize: 12, fontWeight: "600", color: activeTheme.title.color }}>{showScenario ? "Hide ▲" : "Show ▼"}</Text>
                            </TouchableOpacity>
                        </View>

                        {showScenario && (
                            <View>
                                <Text style={[styles.subtext, activeTheme.subtext, { fontSize: 12, marginBottom: 12 }]}>
                                    Simulate projected option prices after spot move, days elapsed, and IV changes.
                                </Text>

                                <View style={{ flexDirection: "row", gap: 8, marginBottom: 12 }}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={[styles.label, activeTheme.label, { fontSize: 11 }]}>Spot Move (Pts)</Text>
                                        <TextInput style={[styles.input, activeTheme.input, { borderColor: activeTheme.borderColor, paddingVertical: 4, height: 36, fontSize: 13 }]} keyboardType="numeric" value={simSpotMove} onChangeText={setSimSpotMove} />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={[styles.label, activeTheme.label, { fontSize: 11 }]}>Days Elapsed</Text>
                                        <TextInput style={[styles.input, activeTheme.input, { borderColor: activeTheme.borderColor, paddingVertical: 4, height: 36, fontSize: 13 }]} keyboardType="numeric" value={simDaysPassed} onChangeText={setSimDaysPassed} />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={[styles.label, activeTheme.label, { fontSize: 11 }]}>IV Change (%)</Text>
                                        <TextInput style={[styles.input, activeTheme.input, { borderColor: activeTheme.borderColor, paddingVertical: 4, height: 36, fontSize: 13 }]} keyboardType="numeric" value={simIvChange} onChangeText={setSimIvChange} />
                                    </View>
                                </View>

                                <View style={{ flexDirection: "row", gap: 10 }}>
                                    <View style={[{ flex: 1, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: "#10B981" }, activeTheme.card]}>
                                        <Text style={{ fontSize: 11, color: activeTheme.subtext.color }}>Projected Call Price</Text>
                                        <Text style={{ fontSize: 16, fontWeight: "900", color: "#10B981", marginVertical: 2 }}>{formatCurrency(scenario.projBS.callPrice)}</Text>
                                        <Text style={{ fontSize: 11, fontWeight: "700", color: scenario.callPnl >= 0 ? "#10B981" : "#EF4444" }}>
                                            P&L: {scenario.callPnl >= 0 ? "+" : ""}{formatCurrency(scenario.callPnl)} ({scenario.callPnlPercent >= 0 ? "+" : ""}{scenario.callPnlPercent}%)
                                        </Text>
                                    </View>

                                    <View style={[{ flex: 1, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: "#EF4444" }, activeTheme.card]}>
                                        <Text style={{ fontSize: 11, color: activeTheme.subtext.color }}>Projected Put Price</Text>
                                        <Text style={{ fontSize: 16, fontWeight: "900", color: "#EF4444", marginVertical: 2 }}>{formatCurrency(scenario.projBS.putPrice)}</Text>
                                        <Text style={{ fontSize: 11, fontWeight: "700", color: scenario.putPnl >= 0 ? "#10B981" : "#EF4444" }}>
                                            P&L: {scenario.putPnl >= 0 ? "+" : ""}{formatCurrency(scenario.putPnl)} ({scenario.putPnlPercent >= 0 ? "+" : ""}{scenario.putPnlPercent}%)
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        )}
                    </View>
                )}

                {/* Share Button */}
                <TouchableOpacity
                    style={[styles.themeToggle, activeTheme.toggle, { marginVertical: 12, paddingVertical: 13, borderRadius: 12, borderWidth: 1, borderColor: activeTheme.borderColor, alignItems: "center" }]}
                    onPress={handleShare}
                    disabled={sharing}
                >
                    <Text style={{ fontSize: 14, fontWeight: "700", color: activeTheme.title.color }}>{sharing ? "⏳ Generating..." : "📤 Share / Export Option Greeks Setup"}</Text>
                </TouchableOpacity>

            </View>
            <View style={{ height: 30 }} />
        </ScrollView>
    );
}
