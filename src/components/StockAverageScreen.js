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
    "#3B82F6", // Blue
    "#10B981", // Green
    "#F59E0B", // Amber
    "#8B5CF6", // Purple
    "#EC4899", // Pink
    "#06B6D4", // Cyan
    "#F97316", // Orange
    "#14B8A6", // Teal
];

export default function StockAverageScreen({ theme = "dark", setTheme }) {
    const activeTheme = theme === "light" ? lightTheme : darkTheme;
    const captureViewRef = useRef(null);
    const [sharing, setSharing] = useState(false);

    // Mode: "average" (Multi-batch) | "target" (Target Average Down Planner)
    const [mode, setMode] = useState("average");

    // ── Mode 1: Multi-Batch State ──
    const [batches, setBatches] = useState([
        { id: "1", price: "150", quantity: "100" },
        { id: "2", price: "120", quantity: "50" },
    ]);
    const [cmp, setCmp] = useState("");

    // ── Mode 2: Target Average Down State ──
    const [currentShares, setCurrentShares] = useState("100");
    const [currentAvgPrice, setCurrentAvgPrice] = useState("150");
    const [newBuyPrice, setNewBuyPrice] = useState("100");
    const [targetAvgPrice, setTargetAvgPrice] = useState("120");

    // ── Calculations ──
    const averageResult = useMemo(() => {
        return calculateStockAverage(batches, cmp);
    }, [batches, cmp]);

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
            Alert.alert("Limit Reached", "You can add up to 8 purchase batches.");
            return;
        }
        setBatches((prev) => [
            ...prev,
            { id: String(Date.now()), price: "", quantity: "" },
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
                { id: "1", price: "", quantity: "" },
                { id: "2", price: "", quantity: "" },
            ]);
            setCmp("");
        } else {
            setCurrentShares("");
            setCurrentAvgPrice("");
            setNewBuyPrice("");
            setTargetAvgPrice("");
        }
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
                        const file = new File([blob], "stock-average.png", { type: "image/png" });

                        let shareText = "";
                        if (mode === "average" && averageResult.isValid) {
                            shareText = `Stock Average: ${averageResult.totalQuantity} shares @ Avg ${formatCurrency(averageResult.averagePrice)} (Total Invested: ${formatCurrency(averageResult.totalInvested)})`;
                        } else if (mode === "target" && targetResult.isValid) {
                            shareText = `Target Average Down: Buy ${targetResult.sharesToBuy} shares @ ${formatCurrency(newBuyPrice)} to reach ${formatCurrency(targetResult.achievedAverage)} average`;
                        } else {
                            shareText = "Stock Average Calculation";
                        }

                        if (navigator.canShare({ files: [file] })) {
                            await navigator.share({
                                title: "Stock Average Calculation",
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
                        dialogTitle: "Share Stock Average",
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

                {/* ── Main Setup Card ── */}
                <View style={[styles.cardWrapper, activeTheme.card]}>
                    {/* ── Header ── */}
                    <View style={styles.header}>
                        <Text style={[styles.title, activeTheme.title]}>
                            🔄 Stock Average Calc
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

                    {/* ── Mode Switcher ── */}
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
                            <Text
                                style={[
                                    styles.sipTypeText,
                                    mode === "average" ? activeTheme.tabActiveText : { color: activeTheme.title.color },
                                ]}
                            >
                                📊 Multi-Batch Average
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
                            <Text
                                style={[
                                    styles.sipTypeText,
                                    mode === "target" ? activeTheme.tabActiveText : { color: activeTheme.title.color },
                                ]}
                            >
                                🎯 Target Average Down
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* ── Mode 1: Multi-Batch Averaging Inputs ── */}
                    {mode === "average" && (
                        <View>
                            {batches.map((batch, idx) => {
                                const bCost = (parseFloat(batch.price) || 0) * (parseFloat(batch.quantity) || 0);
                                const lotColor = LOT_COLORS[idx % LOT_COLORS.length];

                                return (
                                    <View
                                        key={batch.id}
                                        style={[
                                            styles.batchCard,
                                            activeTheme.card,
                                            { borderColor: activeTheme.borderColor },
                                        ]}
                                    >
                                        <View style={styles.batchHeader}>
                                            <View style={styles.batchTitleRow}>
                                                <View style={[styles.batchBadge, { backgroundColor: lotColor + "22" }]}>
                                                    <Text style={[styles.batchBadgeText, { color: lotColor }]}>
                                                        Lot #{idx + 1}
                                                    </Text>
                                                </View>
                                                {bCost > 0 && (
                                                    <Text style={[styles.batchSubtotal, activeTheme.subtext]}>
                                                        Subtotal: {formatCurrency(bCost)}
                                                    </Text>
                                                )}
                                            </View>

                                            {batches.length > 1 && (
                                                <TouchableOpacity
                                                    style={styles.batchRemoveBtn}
                                                    onPress={() => handleRemoveBatch(batch.id)}
                                                    activeOpacity={0.7}
                                                >
                                                    <Text style={styles.batchRemoveBtnText}>✕ Remove</Text>
                                                </TouchableOpacity>
                                            )}
                                        </View>

                                        <View style={styles.grid}>
                                            <View style={styles.col}>
                                                <Text style={[styles.label, activeTheme.label]}>
                                                    Buy Price (₹)
                                                </Text>
                                                <TextInput
                                                    style={[styles.input, activeTheme.input, { borderColor: activeTheme.borderColor }]}
                                                    keyboardType="numeric"
                                                    value={batch.price}
                                                    placeholder="e.g. 150"
                                                    placeholderTextColor={activeTheme.placeholder.color}
                                                    onChangeText={(v) => handleBatchChange(batch.id, "price", v)}
                                                />
                                            </View>

                                            <View style={styles.col}>
                                                <Text style={[styles.label, activeTheme.label]}>
                                                    Quantity (Shares)
                                                </Text>
                                                <TextInput
                                                    style={[styles.input, activeTheme.input, { borderColor: activeTheme.borderColor }]}
                                                    keyboardType="numeric"
                                                    value={batch.quantity}
                                                    placeholder="e.g. 100"
                                                    placeholderTextColor={activeTheme.placeholder.color}
                                                    onChangeText={(v) => handleBatchChange(batch.id, "quantity", v)}
                                                />
                                            </View>
                                        </View>
                                    </View>
                                );
                            })}

                            {/* Add Batch Button */}
                            {batches.length < 8 && (
                                <TouchableOpacity
                                    style={[
                                        styles.addBatchBtn,
                                        { borderColor: activeTheme.investedColor },
                                    ]}
                                    onPress={handleAddBatch}
                                    activeOpacity={0.75}
                                >
                                    <Text style={[styles.addBatchBtnText, { color: activeTheme.investedColor }]}>
                                        ＋ Add Purchase Batch ({batches.length}/8)
                                    </Text>
                                </TouchableOpacity>
                            )}

                            {/* Optional CMP Input */}
                            <View style={[styles.fullCol, { marginTop: 4 }]}>
                                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                                    <Text style={[styles.label, activeTheme.label]}>
                                        Current Market Price - CMP (₹) <Text style={{ fontWeight: "400", fontSize: 11 }}>(Optional)</Text>
                                    </Text>
                                    {cmp !== "" && (
                                        <TouchableOpacity onPress={() => setCmp("")}>
                                            <Text style={{ fontSize: 11, color: activeTheme.subtext.color }}>Clear CMP</Text>
                                        </TouchableOpacity>
                                    )}
                                </View>
                                <TextInput
                                    style={[styles.input, activeTheme.input, { borderColor: activeTheme.borderColor }]}
                                    keyboardType="numeric"
                                    value={cmp}
                                    placeholder="Enter CMP to track Live P&L and Breakeven"
                                    placeholderTextColor={activeTheme.placeholder.color}
                                    onChangeText={setCmp}
                                />
                            </View>
                        </View>
                    )}

                    {/* ── Mode 2: Target Average Down Inputs ── */}
                    {mode === "target" && (
                        <View>
                            <View style={[styles.infoBanner, { backgroundColor: activeTheme.bannerBg, borderColor: activeTheme.bannerBorder, marginBottom: 16 }]}>
                                <Text style={{ fontSize: 16 }}>🎯</Text>
                                <Text style={[styles.infoBannerText, { color: activeTheme.bannerText }]}>
                                    Find out exactly how many shares you need to buy on a dip to pull your overall average price down to your target level.
                                </Text>
                            </View>

                            <View style={styles.grid}>
                                <View style={styles.col}>
                                    <Text style={[styles.label, activeTheme.label]}>
                                        Current Shares Held
                                    </Text>
                                    <TextInput
                                        style={[styles.input, activeTheme.input, { borderColor: activeTheme.borderColor }]}
                                        keyboardType="numeric"
                                        value={currentShares}
                                        placeholder="e.g. 100"
                                        placeholderTextColor={activeTheme.placeholder.color}
                                        onChangeText={setCurrentShares}
                                    />
                                </View>

                                <View style={styles.col}>
                                    <Text style={[styles.label, activeTheme.label]}>
                                        Current Average Price (₹)
                                    </Text>
                                    <TextInput
                                        style={[styles.input, activeTheme.input, { borderColor: activeTheme.borderColor }]}
                                        keyboardType="numeric"
                                        value={currentAvgPrice}
                                        placeholder="e.g. 150"
                                        placeholderTextColor={activeTheme.placeholder.color}
                                        onChangeText={setCurrentAvgPrice}
                                    />
                                </View>

                                <View style={styles.col}>
                                    <Text style={[styles.label, activeTheme.label]}>
                                        New Dip Buy Price (₹)
                                    </Text>
                                    <TextInput
                                        style={[styles.input, activeTheme.input, { borderColor: activeTheme.borderColor }]}
                                        keyboardType="numeric"
                                        value={newBuyPrice}
                                        placeholder="e.g. 100"
                                        placeholderTextColor={activeTheme.placeholder.color}
                                        onChangeText={setNewBuyPrice}
                                    />
                                </View>

                                <View style={styles.col}>
                                    <Text style={[styles.label, activeTheme.label]}>
                                        Desired Target Average (₹)
                                    </Text>
                                    <TextInput
                                        style={[styles.input, activeTheme.input, { borderColor: activeTheme.borderColor }]}
                                        keyboardType="numeric"
                                        value={targetAvgPrice}
                                        placeholder="e.g. 120"
                                        placeholderTextColor={activeTheme.placeholder.color}
                                        onChangeText={setTargetAvgPrice}
                                    />
                                </View>
                            </View>

                            {targetResult.error && (
                                <View style={[styles.infoBanner, { backgroundColor: "#FEF2F2", borderColor: "#FECACA", marginTop: 8 }]}>
                                    <Text style={{ fontSize: 16 }}>⚠️</Text>
                                    <Text style={[styles.infoBannerText, { color: "#991B1B" }]}>
                                        {targetResult.error}
                                    </Text>
                                </View>
                            )}
                        </View>
                    )}
                </View>

                {/* ── Mode 1 Results Card ── */}
                {mode === "average" && averageResult.isValid && (
                    <View style={[styles.metricCard, activeTheme.card, { borderColor: activeTheme.borderColor }]}>
                        <View style={styles.metricRow}>
                            <View>
                                <Text style={[styles.totalMetricLabel, activeTheme.title]}>
                                    New Average Price
                                </Text>
                                <Text style={[styles.inflationSubtitle, activeTheme.subtext]}>
                                    Weighted purchase price per share
                                </Text>
                            </View>
                            <Text style={[styles.totalMetricValue, { color: activeTheme.investedColor }]}>
                                {formatCurrency(averageResult.averagePrice)}
                            </Text>
                        </View>

                        <View style={[styles.metricDivider, { backgroundColor: activeTheme.borderColor, marginVertical: 8 }]} />

                        <View style={styles.metricRow}>
                            <Text style={[styles.metricLabel, activeTheme.subtext]}>
                                Total Quantity (Shares)
                            </Text>
                            <Text style={[styles.metricValue, activeTheme.title]}>
                                {averageResult.totalQuantity.toLocaleString("en-IN")}
                            </Text>
                        </View>

                        <View style={[styles.metricDivider, { backgroundColor: activeTheme.borderColor }]} />

                        <View style={styles.metricRow}>
                            <Text style={[styles.metricLabel, activeTheme.subtext]}>
                                Total Capital Invested
                            </Text>
                            <Text style={[styles.metricValue, activeTheme.title]}>
                                {formatCurrency(averageResult.totalInvested)}
                            </Text>
                        </View>

                        {/* CMP & Live P&L section */}
                        {averageResult.cmp != null && (
                            <>
                                <View style={[styles.metricDivider, { backgroundColor: activeTheme.borderColor, marginVertical: 8 }]} />

                                <View style={styles.metricRow}>
                                    <Text style={[styles.metricLabel, activeTheme.subtext]}>
                                        Current Portfolio Value (@{formatCurrency(averageResult.cmp)})
                                    </Text>
                                    <Text style={[styles.metricValue, activeTheme.title]}>
                                        {formatCurrency(averageResult.currentValue)}
                                    </Text>
                                </View>

                                <View style={[styles.metricDivider, { backgroundColor: activeTheme.borderColor }]} />

                                <View style={styles.metricRow}>
                                    <View>
                                        <Text style={[styles.metricLabel, activeTheme.subtext]}>
                                            Unrealized Net P&L
                                        </Text>
                                        <View
                                            style={[
                                                styles.erosionBadge,
                                                {
                                                    backgroundColor: averageResult.pnl >= 0 ? "#DCFCE7" : "#FEE2E2",
                                                },
                                            ]}
                                        >
                                            <Text
                                                style={[
                                                    styles.erosionBadgeText,
                                                    {
                                                        color: averageResult.pnl >= 0 ? "#15803D" : "#B91C1C",
                                                    },
                                                ]}
                                            >
                                                {averageResult.pnl >= 0 ? "▲ Profit" : "▼ Loss"}: {averageResult.pnlPercent >= 0 ? "+" : ""}{averageResult.pnlPercent.toFixed(2)}%
                                            </Text>
                                        </View>
                                    </View>
                                    <Text
                                        style={[
                                            styles.metricValue,
                                            {
                                                color: averageResult.pnl >= 0 ? activeTheme.returnsColor : "#EF4444",
                                                fontWeight: "800",
                                                fontSize: 18,
                                            },
                                        ]}
                                    >
                                        {averageResult.pnl >= 0 ? "+" : ""}{formatCurrency(averageResult.pnl)}
                                    </Text>
                                </View>

                                {averageResult.breakevenDistance > 0 && (
                                    <>
                                        <View style={[styles.metricDivider, { backgroundColor: activeTheme.borderColor }]} />
                                        <View style={styles.metricRow}>
                                            <Text style={[styles.metricLabel, activeTheme.subtext]}>
                                                Required to Breakeven
                                            </Text>
                                            <Text style={[styles.metricValue, { color: "#F59E0B", fontWeight: "700" }]}>
                                                +{formatCurrency(averageResult.breakevenDistance)} (+{averageResult.breakevenDistancePercent.toFixed(2)}%)
                                            </Text>
                                        </View>
                                    </>
                                )}
                            </>
                        )}
                    </View>
                )}

                {/* ── Mode 1: Visual Lot Distribution Bar ── */}
                {mode === "average" && averageResult.isValid && averageResult.validBatches.length > 1 && (
                    <View style={[styles.distBarContainer, activeTheme.card, { borderColor: activeTheme.borderColor }]}>
                        <Text style={[styles.tableTitle, activeTheme.title]}>
                            📊 Capital Allocation Breakdown
                        </Text>

                        {/* Multi-segment bar */}
                        <View style={[styles.distBar, { backgroundColor: theme === "light" ? "#E2E8F0" : "#1E293B" }]}>
                            {averageResult.validBatches.map((b, idx) => {
                                const lotColor = LOT_COLORS[idx % LOT_COLORS.length];
                                return (
                                    <View
                                        key={b.index}
                                        style={{
                                            flex: b.weightPercent,
                                            backgroundColor: lotColor,
                                        }}
                                    />
                                );
                            })}
                        </View>

                        {/* Legend */}
                        <View style={styles.distLegendRow}>
                            {averageResult.validBatches.map((b, idx) => {
                                const lotColor = LOT_COLORS[idx % LOT_COLORS.length];
                                return (
                                    <View key={b.index} style={styles.distLegendItem}>
                                        <View style={[styles.distDot, { backgroundColor: lotColor }]} />
                                        <Text style={[styles.distLegendText, activeTheme.subtext]}>
                                            Lot #{b.index}: {b.weightPercent.toFixed(1)}% ({formatCurrency(b.cost)})
                                        </Text>
                                    </View>
                                );
                            })}
                        </View>
                    </View>
                )}

                {/* ── Mode 2 Results Card ── */}
                {mode === "target" && targetResult.isValid && (
                    <View style={[styles.metricCard, activeTheme.card, { borderColor: activeTheme.borderColor }]}>
                        <View style={styles.metricRow}>
                            <View>
                                <Text style={[styles.totalMetricLabel, activeTheme.title]}>
                                    Shares to Buy on Dip
                                </Text>
                                <Text style={[styles.inflationSubtitle, activeTheme.subtext]}>
                                    Required @ {formatCurrency(newBuyPrice)} / share
                                </Text>
                            </View>
                            <Text style={[styles.totalMetricValue, { color: activeTheme.investedColor }]}>
                                {targetResult.sharesToBuy.toLocaleString("en-IN")}
                            </Text>
                        </View>

                        <View style={[styles.metricDivider, { backgroundColor: activeTheme.borderColor, marginVertical: 8 }]} />

                        <View style={styles.metricRow}>
                            <Text style={[styles.metricLabel, activeTheme.subtext]}>
                                Additional Capital Required
                            </Text>
                            <Text style={[styles.metricValue, { color: activeTheme.investedColor, fontWeight: "700" }]}>
                                {formatCurrency(targetResult.additionalCapital)}
                            </Text>
                        </View>

                        <View style={[styles.metricDivider, { backgroundColor: activeTheme.borderColor }]} />

                        <View style={styles.metricRow}>
                            <Text style={[styles.metricLabel, activeTheme.subtext]}>
                                New Total Position
                            </Text>
                            <Text style={[styles.metricValue, activeTheme.title]}>
                                {targetResult.newTotalShares.toLocaleString("en-IN")} Shares
                            </Text>
                        </View>

                        <View style={[styles.metricDivider, { backgroundColor: activeTheme.borderColor }]} />

                        <View style={styles.metricRow}>
                            <Text style={[styles.metricLabel, activeTheme.subtext]}>
                                New Total Capital Invested
                            </Text>
                            <Text style={[styles.metricValue, activeTheme.title]}>
                                {formatCurrency(targetResult.newTotalInvested)}
                            </Text>
                        </View>

                        <View style={[styles.metricDivider, { backgroundColor: activeTheme.borderColor }]} />

                        <View style={styles.metricRow}>
                            <Text style={[styles.metricLabel, activeTheme.subtext]}>
                                Resulting Average Price
                            </Text>
                            <Text style={[styles.metricValue, { color: activeTheme.returnsColor, fontWeight: "800" }]}>
                                {formatCurrency(targetResult.achievedAverage)}
                            </Text>
                        </View>
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
                        {sharing ? "⏳ Generating..." : "📤 Share / Export Setup"}
                    </Text>
                </TouchableOpacity>

            </View>
            <View style={{ height: 30 }} />
        </ScrollView>
    );
}
