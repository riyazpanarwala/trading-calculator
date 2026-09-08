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
    BROKER_PRESETS,
    SEGMENTS,
    calculateBrokerageAndTaxes,
    formatCurrency,
} from "../utils/brokerageCalculations";

export default function BrokerageCalculatorScreen({ theme = "dark", setTheme }) {
    const activeTheme = theme === "light" ? lightTheme : darkTheme;
    const captureViewRef = useRef(null);
    const [sharing, setSharing] = useState(false);

    // Segment & Broker selection
    const [segment, setSegment] = useState("options");
    const [brokerId, setBrokerId] = useState("shoonya");

    // Trade Inputs
    const [buyPrice, setBuyPrice] = useState("100");
    const [sellPrice, setSellPrice] = useState("120");
    const [quantity, setQuantity] = useState("75");
    const [customRate, setCustomRate] = useState("0.25");
    const [legCount, setLegCount] = useState("1"); // 1 leg (single) | 2 leg (spread/straddle) | 4 leg (iron condor)

    const handleSegmentChange = (segId) => {
        setSegment(segId);
        const segObj = SEGMENTS.find((s) => s.id === segId);
        if (segObj) {
            setQuantity(String(segObj.defaultQty));
        }
    };

    const result = useMemo(() => {
        return calculateBrokerageAndTaxes({
            segment,
            brokerId,
            buyPrice,
            sellPrice,
            quantity,
            customRate: brokerId === "religare" || brokerId === "custom" ? customRate : null,
            customType: "percentage",
            legCount,
        });
    }, [segment, brokerId, buyPrice, sellPrice, quantity, customRate, legCount]);

    const activeBroker = useMemo(() => {
        return BROKER_PRESETS.find((b) => b.id === brokerId) || BROKER_PRESETS[0];
    }, [brokerId]);

    const handleReset = () => {
        setBuyPrice("100");
        setSellPrice("120");
        setQuantity("75");
        setCustomRate("0.25");
        setLegCount("1");
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
                        const file = new File([blob], "brokerage-breakdown.png", { type: "image/png" });
                        const shareText = `${activeBroker.name} Tax Breakdown: Gross P&L ${formatCurrency(result.grossPnl)}, Total Charges: ${formatCurrency(result.totalCharges)}, Net P&L: ${formatCurrency(result.netPnl)}`;

                        if (navigator.canShare({ files: [file] })) {
                            await navigator.share({ title: "Brokerage & Statutory Tax Breakdown", text: shareText, files: [file] });
                            shared = true;
                        }
                    } catch (err) {}
                }

                if (!shared && typeof document !== "undefined") {
                    const link = document.createElement("a");
                    link.href = dataUrl;
                    link.download = `brokerage-tax-${Date.now()}.png`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                }
            } else {
                const uri = await captureRef(captureViewRef, { format: "png", quality: 0.95 });
                if (await Sharing.isAvailableAsync()) {
                    await Sharing.shareAsync(uri, { mimeType: "image/png", dialogTitle: "Share Brokerage Setup" });
                }
            }
        } catch (err) {
            Alert.alert("Share Failed", err.message || "Could not export brokerage setup.");
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
                            🏦 Brokerage & Tax Calculator
                        </Text>
                        <View style={styles.headerButtons}>
                            <TouchableOpacity style={[styles.themeToggle, activeTheme.toggle]} onPress={handleReset} activeOpacity={0.7}>
                                <Text style={[styles.themeToggleText, { color: activeTheme.title.color }]}>🗑 Reset</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Segment Selector */}
                    <Text style={[styles.label, activeTheme.label, { fontSize: 12, marginBottom: 6 }]}>Market Segment:</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 8 }}>
                        {SEGMENTS.map((s) => {
                            const isSelected = s.id === segment;
                            return (
                                <TouchableOpacity
                                    key={s.id}
                                    style={[
                                        styles.chip,
                                        isSelected ? activeTheme.tabActive : activeTheme.toggle,
                                        { borderColor: isSelected ? activeTheme.investedColor : activeTheme.borderColor, paddingHorizontal: 12, paddingVertical: 6 },
                                    ]}
                                    onPress={() => handleSegmentChange(s.id)}
                                >
                                    <Text style={[styles.chipText, isSelected ? activeTheme.tabActiveText : { color: activeTheme.title.color }]}>{s.label}</Text>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>

                    {/* Broker Selector */}
                    <Text style={[styles.label, activeTheme.label, { fontSize: 12, marginTop: 8, marginBottom: 6 }]}>Broker Preset:</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 8 }}>
                        {BROKER_PRESETS.map((b) => {
                            const isSelected = b.id === brokerId;
                            return (
                                <TouchableOpacity
                                    key={b.id}
                                    style={[
                                        styles.chip,
                                        isSelected ? activeTheme.tabActive : activeTheme.toggle,
                                        { borderColor: isSelected ? activeTheme.investedColor : activeTheme.borderColor, paddingHorizontal: 12, paddingVertical: 6 },
                                    ]}
                                    onPress={() => setBrokerId(b.id)}
                                >
                                    <Text style={[styles.chipText, isSelected ? activeTheme.tabActiveText : { color: activeTheme.title.color }]}>{b.name} ({b.badge})</Text>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>

                    {/* Multi-Leg Strategy Selector */}
                    <View style={{ marginTop: 8, marginBottom: 12 }}>
                        <Text style={[styles.label, activeTheme.label, { fontSize: 12, marginBottom: 4 }]}>Strategy Order Legs:</Text>
                        <View style={{ flexDirection: "row", gap: 8 }}>
                            {[
                                { label: "1 Leg (Single)", val: "1" },
                                { label: "2 Legs (Spread/Straddle)", val: "2" },
                                { label: "4 Legs (Iron Condor)", val: "4" },
                            ].map((l) => {
                                const isSelected = legCount === l.val;
                                return (
                                    <TouchableOpacity
                                        key={l.val}
                                        style={[
                                            styles.chip,
                                            isSelected ? activeTheme.tabActive : activeTheme.toggle,
                                            { flex: 1, alignItems: "center", justifyContent: "center", borderColor: isSelected ? activeTheme.investedColor : activeTheme.borderColor, paddingVertical: 6 },
                                        ]}
                                        onPress={() => setLegCount(l.val)}
                                    >
                                        <Text style={[styles.chipText, isSelected ? activeTheme.tabActiveText : { color: activeTheme.title.color }, { fontSize: 11 }]}>{l.label}</Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>

                    {/* Trade Parameters */}
                    <View style={styles.grid}>
                        <View style={styles.col}>
                            <Text style={[styles.label, activeTheme.label]}>Buy Price (₹)</Text>
                            <TextInput style={[styles.input, activeTheme.input, { borderColor: activeTheme.borderColor }]} keyboardType="numeric" value={buyPrice} onChangeText={setBuyPrice} />
                        </View>
                        <View style={styles.col}>
                            <Text style={[styles.label, activeTheme.label]}>Sell Price (₹)</Text>
                            <TextInput style={[styles.input, activeTheme.input, { borderColor: activeTheme.borderColor }]} keyboardType="numeric" value={sellPrice} onChangeText={setSellPrice} />
                        </View>
                        <View style={styles.fullCol}>
                            <Text style={[styles.label, activeTheme.label]}>Quantity / Lot Size</Text>
                            <TextInput style={[styles.input, activeTheme.input, { borderColor: activeTheme.borderColor }]} keyboardType="numeric" value={quantity} onChangeText={setQuantity} />
                        </View>
                    </View>
                </View>

                {/* Breakdown Card */}
                {result.isValid && (
                    <View style={[styles.metricCard, activeTheme.card, { borderColor: activeTheme.borderColor }]}>
                        <View style={styles.metricRow}>
                            <Text style={[styles.metricLabel, activeTheme.subtext]}>Gross P&L</Text>
                            <Text style={[styles.metricValue, { color: result.grossPnl >= 0 ? "#10B981" : "#EF4444" }]}>
                                {result.grossPnl >= 0 ? "+" : ""}{formatCurrency(result.grossPnl)}
                            </Text>
                        </View>
                        <View style={[styles.metricDivider, { backgroundColor: activeTheme.borderColor }]} />
                        <View style={styles.metricRow}>
                            <Text style={[styles.metricLabel, { color: "#EF4444" }]}>Total Statutory Charges & Taxes</Text>
                            <Text style={[styles.metricValue, { color: "#EF4444" }]}>-{formatCurrency(result.totalCharges)}</Text>
                        </View>
                        <View style={[styles.metricDivider, { backgroundColor: activeTheme.borderColor }]} />
                        <View style={styles.metricRow}>
                            <Text style={[styles.totalMetricLabel, activeTheme.title]}>Net P&L (In Hand)</Text>
                            <Text style={[styles.totalMetricValue, { color: result.netPnl >= 0 ? "#10B981" : "#EF4444" }]}>
                                {result.netPnl >= 0 ? "+" : ""}{formatCurrency(result.netPnl)} ({result.netPnlPercent >= 0 ? "+" : ""}{result.netPnlPercent}%)
                            </Text>
                        </View>
                        <View style={[styles.metricDivider, { backgroundColor: activeTheme.borderColor }]} />
                        <View style={styles.metricRow}>
                            <Text style={[styles.metricLabel, activeTheme.subtext]}>Breakeven Sell Price</Text>
                            <Text style={[styles.metricValue, { color: "#3B82F6", fontWeight: "800" }]}>{formatCurrency(result.breakevenPrice)}</Text>
                        </View>
                    </View>
                )}

                {/* Share Button */}
                <TouchableOpacity
                    style={[styles.themeToggle, activeTheme.toggle, { marginVertical: 12, paddingVertical: 13, borderRadius: 12, borderWidth: 1, borderColor: activeTheme.borderColor, alignItems: "center" }]}
                    onPress={handleShare}
                    disabled={sharing}
                >
                    <Text style={{ fontSize: 14, fontWeight: "700", color: activeTheme.title.color }}>{sharing ? "⏳ Generating..." : "📤 Share / Export Tax Breakdown"}</Text>
                </TouchableOpacity>

            </View>
            <View style={{ height: 30 }} />
        </ScrollView>
    );
}
