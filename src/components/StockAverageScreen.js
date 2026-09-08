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
    calculateStockAverage,
    calculateTargetAverage,
    formatCurrency,
} from "../utils/averageCalculations";

const LOT_COLORS = [
    "#3B82F6", "#10B981", "#F59E0B", "#8B5CF6",
    "#EC4899", "#06B6D4", "#F97316", "#14B8A6",
];

export default function StockAverageScreen({ theme = "dark", setTheme }) {
    const activeTheme = theme === "light" ? lightTheme : darkTheme;
    const captureViewRef = useRef(null);
    const [sharing, setSharing] = useState(false);

    // Mode: "average" (Multi-batch) | "target" (Target Average Down Planner)
    const [mode, setMode] = useState("average");

    // ── Mode 1: Multi-Batch State ──
    const [batches, setBatches] = useState([
        { id: "1", price: "150", quantity: "100", type: "BUY" },
        { id: "2", price: "120", quantity: "50", type: "BUY" },
    ]);
    const [cmp, setCmp] = useState("");
    const [totalDividends, setTotalDividends] = useState("0");

    // ── Mode 2: Target Average Down State ──
    const [currentShares, setCurrentShares] = useState("100");
    const [currentAvgPrice, setCurrentAvgPrice] = useState("150");
    const [newBuyPrice, setNewBuyPrice] = useState("100");
    const [targetAvgPrice, setTargetAvgPrice] = useState("120");

    // ── Calculations ──
    const averageResult = useMemo(() => {
        return calculateStockAverage(batches, cmp, totalDividends);
    }, [batches, cmp, totalDividends]);

    const targetResult = useMemo(() => {
        return calculateTargetAverage({
            currentShares,
            currentAvgPrice,
            newBuyPrice,
            targetAvgPrice,
        });
    }, [currentShares, currentAvgPrice, newBuyPrice, targetAvgPrice]);

    // ── Batch Handlers ──
    const handleAddBatch = () => {
        if (batches.length >= 8) {
            Alert.alert("Limit Reached", "You can add up to 8 purchase/sell batches.");
            return;
        }
        setBatches((prev) => [
            ...prev,
            { id: String(Date.now()), price: "", quantity: "", type: "BUY" },
        ]);
    };

    const handleRemoveBatch = (id) => {
        if (batches.length <= 1) return;
        setBatches((prev) => prev.filter((b) => b.id !== id));
    };

    const handleBatchChange = (id, field, value) => {
        setBatches((prev) =>
            prev.map((b) => (b.id === id ? { ...b, [field]: value } : b))
        );
    };

    const handleReset = () => {
        if (mode === "average") {
            setBatches([
                { id: "1", price: "", quantity: "", type: "BUY" },
                { id: "2", price: "", quantity: "", type: "BUY" },
            ]);
            setCmp("");
            setTotalDividends("0");
        } else {
            setCurrentShares("");
            setCurrentAvgPrice("");
            setNewBuyPrice("");
            setTargetAvgPrice("");
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
                        const file = new File([blob], "stock-average.png", { type: "image/png" });

                        const shareText = mode === "average"
                            ? `Stock Average: ${averageResult.totalQuantity} shares @ ${formatCurrency(averageResult.averagePrice)} avg (Total: ${formatCurrency(averageResult.totalInvested)})`
                            : `Target Average Down Plan: Buy ${targetResult.sharesToBuy} shares @ ${formatCurrency(newBuyPrice)} to reach ${formatCurrency(targetAvgPrice)} target avg`;

                        if (navigator.canShare({ files: [file] })) {
                            await navigator.share({
                                title: "Stock Average Calculator",
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
                    link.download = `stock-average-${Date.now()}.png`;
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
                        dialogTitle: "Share Stock Average Setup",
                    });
                } else {
                    Alert.alert("Saved", "Screenshot captured successfully.");
                }
            }
        } catch (err) {
            console.error("Share error:", err);
            Alert.alert("Share Failed", err.message || "Could not export stock average setup.");
        } finally {
            setSharing(false);
        }
    };

    return (
        <ScrollView style={[styles.container, activeTheme.container]} contentContainerStyle={styles.contentWrapper}>
            <View ref={captureViewRef} collapsable={false}>

                {/* ── Header Card ── */}
                <View style={[styles.cardWrapper, activeTheme.card]}>
                    <View style={styles.header}>
                        <Text style={[styles.title, activeTheme.title]}>
                            🔄 Stock Average Calculator
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

                    {/* Mode Selector */}
                    <View style={styles.sipTypeToggleRow}>
                        <TouchableOpacity
                            style={[
                                styles.sipTypeButton,
                                mode === "average" ? activeTheme.tabActive : activeTheme.toggle,
                                { borderColor: mode === "average" ? activeTheme.investedColor : activeTheme.borderColor },
                            ]}
                            onPress={() => setMode("average")}
                            activeOpacity={0.8}
                        >
                            <Text style={[styles.sipTypeText, mode === "average" ? activeTheme.tabActiveText : { color: activeTheme.title.color }]}>
                                📊 Multi-Batch Averaging
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[
                                styles.sipTypeButton,
                                mode === "target" ? activeTheme.tabActive : activeTheme.toggle,
                                { borderColor: mode === "target" ? activeTheme.investedColor : activeTheme.borderColor },
                            ]}
                            onPress={() => setMode("target")}
                            activeOpacity={0.8}
                        >
                            <Text style={[styles.sipTypeText, mode === "target" ? activeTheme.tabActiveText : { color: activeTheme.title.color }]}>
                                🎯 Target Average Down
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* ── Mode 1: Multi-Batch Averaging Inputs ── */}
                    {mode === "average" && (
                        <View style={{ marginTop: 14 }}>
                            {batches.map((batch, index) => {
                                const color = LOT_COLORS[index % LOT_COLORS.length];
                                const isSell = batch.type === "SELL";
                                return (
                                    <View
                                        key={batch.id}
                                        style={{
                                            flexDirection: "row",
                                            alignItems: "center",
                                            gap: 8,
                                            marginBottom: 10,
                                            backgroundColor: activeTheme.toggle.backgroundColor,
                                            padding: 10,
                                            borderRadius: 12,
                                            borderWidth: 1,
                                            borderColor: activeTheme.borderColor,
                                        }}
                                    >
                                        <TouchableOpacity
                                            style={{
                                                backgroundColor: isSell ? "#EF4444" : color,
                                                paddingHorizontal: 8,
                                                paddingVertical: 4,
                                                borderRadius: 6,
                                            }}
                                            onPress={() => handleBatchChange(batch.id, "type", isSell ? "BUY" : "SELL")}
                                        >
                                            <Text style={{ color: "#fff", fontWeight: "800", fontSize: 11 }}>
                                                {isSell ? "SELL" : `BUY ${index + 1}`}
                                            </Text>
                                        </TouchableOpacity>

                                        <View style={{ flex: 1 }}>
                                            <Text style={[styles.label, activeTheme.label, { fontSize: 11, marginBottom: 2 }]}>
                                                Price (₹)
                                            </Text>
                                            <TextInput
                                                style={[styles.input, activeTheme.input, { borderColor: activeTheme.borderColor, paddingVertical: 4, height: 36, fontSize: 13 }]}
                                                keyboardType="numeric"
                                                value={batch.price}
                                                placeholder="e.g. 150"
                                                placeholderTextColor={activeTheme.placeholder.color}
                                                onChangeText={(val) => handleBatchChange(batch.id, "price", val)}
                                            />
                                        </View>

                                        <View style={{ flex: 1 }}>
                                            <Text style={[styles.label, activeTheme.label, { fontSize: 11, marginBottom: 2 }]}>
                                                Shares Qty
                                            </Text>
                                            <TextInput
                                                style={[styles.input, activeTheme.input, { borderColor: activeTheme.borderColor, paddingVertical: 4, height: 36, fontSize: 13 }]}
                                                keyboardType="numeric"
                                                value={batch.quantity}
                                                placeholder="e.g. 100"
                                                placeholderTextColor={activeTheme.placeholder.color}
                                                onChangeText={(val) => handleBatchChange(batch.id, "quantity", val)}
                                            />
                                        </View>

                                        {batches.length > 1 && (
                                            <TouchableOpacity
                                                style={{ paddingHorizontal: 6, paddingVertical: 4 }}
                                                onPress={() => handleRemoveBatch(batch.id)}
                                            >
                                                <Text style={{ fontSize: 16, color: "#EF4444" }}>✕</Text>
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                );
                            })}

                            <View style={{ flexDirection: "row", gap: 10, marginTop: 4 }}>
                                <TouchableOpacity
                                    style={[styles.chip, activeTheme.toggle, { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 8 }]}
                                    onPress={handleAddBatch}
                                >
                                    <Text style={{ fontWeight: "700", color: activeTheme.title.color, fontSize: 13 }}>
                                        + Add Purchase / Sell Lot
                                    </Text>
                                </TouchableOpacity>
                            </View>

                            {/* Optional CMP & Dividends Offset */}
                            <View style={{ flexDirection: "row", gap: 12, marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: activeTheme.borderColor }}>
                                <View style={{ flex: 1 }}>
                                    <Text style={[styles.label, activeTheme.label, { fontSize: 12 }]}>
                                        Current Market Price (CMP ₹)
                                    </Text>
                                    <TextInput
                                        style={[styles.input, activeTheme.input, { borderColor: activeTheme.borderColor, paddingVertical: 6, fontSize: 13 }]}
                                        keyboardType="numeric"
                                        value={cmp}
                                        placeholder="Optional CMP"
                                        placeholderTextColor={activeTheme.placeholder.color}
                                        onChangeText={setCmp}
                                    />
                                </View>

                                <View style={{ flex: 1 }}>
                                    <Text style={[styles.label, activeTheme.label, { fontSize: 12 }]}>
                                        Total Dividends Received (₹)
                                    </Text>
                                    <TextInput
                                        style={[styles.input, activeTheme.input, { borderColor: activeTheme.borderColor, paddingVertical: 6, fontSize: 13 }]}
                                        keyboardType="numeric"
                                        value={totalDividends}
                                        placeholder="Optional Divs"
                                        placeholderTextColor={activeTheme.placeholder.color}
                                        onChangeText={setTotalDividends}
                                    />
                                </View>
                            </View>
                        </View>
                    )}

                    {/* ── Mode 2: Target Average Down Planner ── */}
                    {mode === "target" && (
                        <View style={{ marginTop: 14 }}>
                            <View style={styles.grid}>
                                <View style={styles.col}>
                                    <Text style={[styles.label, activeTheme.label]}>Current Total Shares</Text>
                                    <TextInput
                                        style={[styles.input, activeTheme.input, { borderColor: activeTheme.borderColor }]}
                                        keyboardType="numeric"
                                        value={currentShares}
                                        placeholder="e.g. 100"
                                        onChangeText={setCurrentShares}
                                    />
                                </View>
                                <View style={styles.col}>
                                    <Text style={[styles.label, activeTheme.label]}>Current Avg Price (₹)</Text>
                                    <TextInput
                                        style={[styles.input, activeTheme.input, { borderColor: activeTheme.borderColor }]}
                                        keyboardType="numeric"
                                        value={currentAvgPrice}
                                        placeholder="e.g. 150"
                                        onChangeText={setCurrentAvgPrice}
                                    />
                                </View>
                                <View style={styles.col}>
                                    <Text style={[styles.label, activeTheme.label]}>New Buy Dip Price (₹)</Text>
                                    <TextInput
                                        style={[styles.input, activeTheme.input, { borderColor: activeTheme.borderColor }]}
                                        keyboardType="numeric"
                                        value={newBuyPrice}
                                        placeholder="e.g. 100"
                                        onChangeText={setNewBuyPrice}
                                    />
                                </View>
                                <View style={styles.col}>
                                    <Text style={[styles.label, activeTheme.label]}>Target Desired Avg (₹)</Text>
                                    <TextInput
                                        style={[styles.input, activeTheme.input, { borderColor: activeTheme.borderColor }]}
                                        keyboardType="numeric"
                                        value={targetAvgPrice}
                                        placeholder="e.g. 120"
                                        onChangeText={setTargetAvgPrice}
                                    />
                                </View>
                            </View>
                        </View>
                    )}
                </View>

                {/* ── Results Summary Cards ── */}
                {mode === "average" && averageResult.isValid && (
                    <View style={[styles.metricCard, activeTheme.card, { borderColor: activeTheme.borderColor }]}>
                        <View style={styles.metricRow}>
                            <Text style={[styles.metricLabel, activeTheme.subtext]}>Total Holding Shares</Text>
                            <Text style={[styles.metricValue, { color: activeTheme.investedColor }]}>
                                {averageResult.totalQuantity} Shares
                            </Text>
                        </View>

                        <View style={[styles.metricDivider, { backgroundColor: activeTheme.borderColor }]} />

                        <View style={styles.metricRow}>
                            <Text style={[styles.metricLabel, activeTheme.subtext]}>Net Capital Invested</Text>
                            <Text style={[styles.metricValue, { color: activeTheme.investedColor }]}>
                                {formatCurrency(averageResult.totalInvested)}
                            </Text>
                        </View>

                        <View style={[styles.metricDivider, { backgroundColor: activeTheme.borderColor }]} />

                        <View style={styles.metricRow}>
                            <Text style={[styles.totalMetricLabel, activeTheme.title]}>Weighted Average Cost</Text>
                            <Text style={[styles.totalMetricValue, { color: "#10B981" }]}>
                                {formatCurrency(averageResult.averagePrice)}
                            </Text>
                        </View>

                        {/* Realized P&L from Partial Exits */}
                        {averageResult.realizedPnl !== 0 && (
                            <>
                                <View style={[styles.metricDivider, { backgroundColor: activeTheme.borderColor }]} />
                                <View style={styles.metricRow}>
                                    <Text style={[styles.metricLabel, { color: averageResult.realizedPnl >= 0 ? "#10B981" : "#EF4444" }]}>
                                        Realized Profit / Loss
                                    </Text>
                                    <Text style={[styles.metricValue, { color: averageResult.realizedPnl >= 0 ? "#10B981" : "#EF4444", fontWeight: "800" }]}>
                                        {averageResult.realizedPnl >= 0 ? "+" : ""}{formatCurrency(averageResult.realizedPnl)}
                                    </Text>
                                </View>
                            </>
                        )}

                        {/* Dividends Breakeven Offset */}
                        {averageResult.totalDividends > 0 && (
                            <>
                                <View style={[styles.metricDivider, { backgroundColor: activeTheme.borderColor }]} />
                                <View style={styles.metricRow}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={[styles.totalMetricLabel, { color: "#3B82F6" }]}>
                                            Effective Breakeven Price
                                        </Text>
                                        <Text style={[styles.inflationSubtitle, activeTheme.subtext]}>
                                            (After ₹{averageResult.totalDividends} Dividends Received)
                                        </Text>
                                    </View>
                                    <Text style={[styles.totalMetricValue, { color: "#3B82F6" }]}>
                                        {formatCurrency(averageResult.effectiveBreakevenPrice)}
                                    </Text>
                                </View>
                            </>
                        )}

                        {/* Live CMP P&L */}
                        {averageResult.cmp != null && (
                            <>
                                <View style={[styles.metricDivider, { backgroundColor: activeTheme.borderColor, marginVertical: 8 }]} />
                                <View style={styles.metricRow}>
                                    <Text style={[styles.metricLabel, activeTheme.subtext]}>Portfolio Market Value (@ CMP)</Text>
                                    <Text style={[styles.metricValue, activeTheme.title]}>
                                        {formatCurrency(averageResult.currentValue)}
                                    </Text>
                                </View>
                                <View style={[styles.metricDivider, { backgroundColor: activeTheme.borderColor }]} />
                                <View style={styles.metricRow}>
                                    <Text style={[styles.totalMetricLabel, { color: averageResult.pnl >= 0 ? "#10B981" : "#EF4444" }]}>
                                        Unrealized P&L
                                    </Text>
                                    <Text style={[styles.totalMetricValue, { color: averageResult.pnl >= 0 ? "#10B981" : "#EF4444" }]}>
                                        {averageResult.pnl >= 0 ? "+" : ""}{formatCurrency(averageResult.pnl)} ({averageResult.pnlPercent >= 0 ? "+" : ""}{averageResult.pnlPercent}%)
                                    </Text>
                                </View>
                            </>
                        )}
                    </View>
                )}

                {/* Target Result */}
                {mode === "target" && targetResult.isValid && (
                    <View style={[styles.metricCard, activeTheme.card, { borderColor: activeTheme.borderColor }]}>
                        <View style={styles.metricRow}>
                            <Text style={[styles.totalMetricLabel, { color: "#10B981" }]}>Additional Shares to Buy</Text>
                            <Text style={[styles.totalMetricValue, { color: "#10B981" }]}>
                                +{targetResult.sharesToBuy} Shares
                            </Text>
                        </View>
                        <View style={[styles.metricDivider, { backgroundColor: activeTheme.borderColor }]} />
                        <View style={styles.metricRow}>
                            <Text style={[styles.metricLabel, activeTheme.subtext]}>Additional Capital Needed</Text>
                            <Text style={[styles.metricValue, { color: activeTheme.investedColor }]}>
                                {formatCurrency(targetResult.additionalCapital)}
                            </Text>
                        </View>
                        <View style={[styles.metricDivider, { backgroundColor: activeTheme.borderColor }]} />
                        <View style={styles.metricRow}>
                            <Text style={[styles.metricLabel, activeTheme.subtext]}>Achieved Target Average</Text>
                            <Text style={[styles.metricValue, { color: "#3B82F6", fontWeight: "800" }]}>
                                {formatCurrency(targetResult.achievedAverage)}
                            </Text>
                        </View>
                    </View>
                )}

                {/* ── Share Button ── */}
                <TouchableOpacity
                    style={[
                        styles.themeToggle,
                        activeTheme.toggle,
                        { marginVertical: 12, paddingVertical: 13, borderRadius: 12, borderWidth: 1, borderColor: activeTheme.borderColor, alignItems: "center" },
                    ]}
                    onPress={handleShare}
                    disabled={sharing}
                    activeOpacity={0.75}
                >
                    <Text style={{ fontSize: 14, fontWeight: "700", color: activeTheme.title.color }}>
                        {sharing ? "⏳ Generating..." : "📤 Share / Export Setup"}
                    </Text>
                </TouchableOpacity>

            </View>
            <View style={{ height: 30 }} />
        </ScrollView>
    );
}
