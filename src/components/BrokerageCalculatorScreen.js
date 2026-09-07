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
    const [brokerId, setBrokerId] = useState("shoonya"); // Default to Shoonya (user's preferred F&O broker)

    // Trade Inputs
    const [buyPrice, setBuyPrice] = useState("100");
    const [sellPrice, setSellPrice] = useState("120");
    const [quantity, setQuantity] = useState("75"); // 1 lot of Nifty
    const [customRate, setCustomRate] = useState("0.25"); // Default for Religare / Custom %

    // Quick lot presets based on segment
    const lotPresets = useMemo(() => {
        if (segment === "options" || segment === "futures") {
            return [
                { label: "Nifty 25", qty: "25" },
                { label: "Nifty 75", qty: "75" },
                { label: "BankNifty 15", qty: "15" },
                { label: "BankNifty 30", qty: "30" },
                { label: "Sensex 10", qty: "10" },
            ];
        }
        return [
            { label: "25", qty: "25" },
            { label: "50", qty: "50" },
            { label: "100", qty: "100" },
            { label: "500", qty: "500" },
            { label: "1000", qty: "1000" },
        ];
    }, [segment]);

    // Segment change handler - auto sets reasonable default quantity
    const handleSegmentChange = (segId) => {
        setSegment(segId);
        const segObj = SEGMENTS.find((s) => s.id === segId);
        if (segObj) {
            setQuantity(String(segObj.defaultQty));
        }
    };

    // Calculation result
    const result = useMemo(() => {
        return calculateBrokerageAndTaxes({
            segment,
            brokerId,
            buyPrice,
            sellPrice,
            quantity,
            customRate: brokerId === "religare" || brokerId === "custom" ? customRate : null,
            customType: "percentage",
        });
    }, [segment, brokerId, buyPrice, sellPrice, quantity, customRate]);

    const activeBroker = useMemo(() => {
        return BROKER_PRESETS.find((b) => b.id === brokerId) || BROKER_PRESETS[0];
    }, [brokerId]);

    const handleReset = () => {
        setBuyPrice("");
        setSellPrice("");
        setQuantity(segment === "options" || segment === "futures" ? "75" : "100");
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
                        const file = new File([blob], "brokerage-report.png", { type: "image/png" });

                        const shareText = result.isValid
                            ? `${activeBroker.name} ${segment.toUpperCase()} Trade: Gross P&L ${formatCurrency(result.grossPnl)} | Charges: ${formatCurrency(result.totalCharges)} | Net P&L: ${formatCurrency(result.netPnl)}`
                            : "Brokerage & Statutory Taxes Report";

                        if (navigator.canShare({ files: [file] })) {
                            await navigator.share({
                                title: "Brokerage & Net P&L Breakdown",
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
                    link.download = `brokerage-${brokerId}-${Date.now()}.png`;
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

    const isProfit = result.isValid && result.netPnl >= 0;
    const isZeroBroker = brokerId === "shoonya" || brokerId === "flattrade";

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
                            Brokerage & Tax Calc
                        </Text>
                        <Text style={[styles.subtitle, activeTheme.subtext]}>
                            Shoonya, FlatTrade, Religare & NSE Statutory Taxes
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

                {/* ── Segment Selector ── */}
                <View style={styles.segmentRow}>
                    {SEGMENTS.map((s) => {
                        const isSelected = segment === s.id;
                        return (
                            <TouchableOpacity
                                key={s.id}
                                style={[
                                    styles.segmentBtn,
                                    isSelected ? activeTheme.tabActive : activeTheme.toggle,
                                    { borderColor: isSelected ? "#2563EB" : activeTheme.borderColor },
                                ]}
                                onPress={() => handleSegmentChange(s.id)}
                                activeOpacity={0.8}
                            >
                                <Text
                                    style={[
                                        styles.segmentBtnText,
                                        { color: isSelected ? "#FFFFFF" : activeTheme.label.color },
                                    ]}
                                >
                                    {s.label}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {/* ── Broker Selection Chips ── */}
                <View style={styles.cardWrapper}>
                    <View style={[styles.card, activeTheme.card, { padding: 14, borderRadius: 14 }]}>
                        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                            <Text style={[styles.label, activeTheme.label, { fontWeight: "700", marginBottom: 0 }]}>
                                SELECT BROKER
                            </Text>
                            {isZeroBroker && (
                                <View style={[styles.badgeHold, activeTheme.badgeHoldBg]}>
                                    <Text style={[styles.badgeHoldText, activeTheme.badgeHoldText]}>
                                        ✨ True Zero Brokerage
                                    </Text>
                                </View>
                            )}
                        </View>

                        <View style={styles.brokerGrid}>
                            {BROKER_PRESETS.map((b) => {
                                const isSelected = brokerId === b.id;
                                const isZero = b.id === "shoonya" || b.id === "flattrade";
                                return (
                                    <TouchableOpacity
                                        key={b.id}
                                        style={[
                                            styles.brokerCard,
                                            isSelected
                                                ? { backgroundColor: "#2563EB", borderColor: "#2563EB" }
                                                : { backgroundColor: theme === "dark" ? "#1E293B" : "#F8FAFC", borderColor: activeTheme.borderColor },
                                        ]}
                                        onPress={() => setBrokerId(b.id)}
                                        activeOpacity={0.8}
                                    >
                                        <Text
                                            style={[
                                                styles.brokerNameText,
                                                { color: isSelected ? "#FFFFFF" : activeTheme.title.color },
                                            ]}
                                        >
                                            {b.name}
                                        </Text>
                                        <Text
                                            style={[
                                                styles.brokerBadgeText,
                                                {
                                                    color: isSelected
                                                        ? "#E2E8F0"
                                                        : isZero
                                                        ? "#10B981"
                                                        : activeTheme.subtext.color,
                                                },
                                            ]}
                                        >
                                            {b.badge}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>

                        {/* Religare or Custom rate field */}
                        {(brokerId === "religare" || brokerId === "custom") && (
                            <View style={{ marginTop: 6, paddingTop: 10, borderTopWidth: 1, borderTopColor: activeTheme.borderColor }}>
                                <Text style={[styles.label, activeTheme.label, { fontSize: 12, marginBottom: 4 }]}>
                                    {brokerId === "religare" ? "Religare Delivery Brokerage Rate (%)" : "Custom Brokerage Rate (%)"}
                                </Text>
                                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                                    <TextInput
                                        style={[
                                            styles.input,
                                            activeTheme.input,
                                            { flex: 1, height: 42, paddingHorizontal: 12 },
                                        ]}
                                        value={customRate}
                                        onChangeText={setCustomRate}
                                        keyboardType="decimal-pad"
                                        placeholder="e.g. 0.25"
                                        placeholderTextColor={activeTheme.placeholder.color}
                                    />
                                    <Text style={[styles.label, activeTheme.label, { fontWeight: "700" }]}>%</Text>
                                </View>
                                <Text style={[styles.subtext, activeTheme.subtext, { fontSize: 11, marginTop: 4 }]}>
                                    {brokerId === "religare"
                                        ? "Religare standard delivery is 0.25% (or your branch negotiated rate)."
                                        : "Applied as % of order turnover per leg."}
                                </Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* ── Trade Inputs Card ── */}
                <View style={styles.cardWrapper}>
                    <View style={[styles.card, activeTheme.card, { padding: 14, borderRadius: 14 }]}>
                        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                            <Text style={[styles.label, activeTheme.label, { fontWeight: "700", marginBottom: 0 }]}>
                                TRADE PARAMETERS
                            </Text>
                            <TouchableOpacity onPress={handleReset} activeOpacity={0.7}>
                                <Text style={{ fontSize: 12, color: "#EF4444", fontWeight: "700" }}>
                                    Reset Inputs
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {/* Buy & Sell Price Row */}
                        <View style={{ flexDirection: "row", gap: 12, marginBottom: 12 }}>
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.label, activeTheme.label]}>Buy Price (₹)</Text>
                                <TextInput
                                    style={[styles.input, activeTheme.input]}
                                    value={buyPrice}
                                    onChangeText={setBuyPrice}
                                    keyboardType="decimal-pad"
                                    placeholder="100.00"
                                    placeholderTextColor={activeTheme.placeholder.color}
                                />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.label, activeTheme.label]}>Sell Price (₹)</Text>
                                <TextInput
                                    style={[styles.input, activeTheme.input]}
                                    value={sellPrice}
                                    onChangeText={setSellPrice}
                                    keyboardType="decimal-pad"
                                    placeholder="120.00"
                                    placeholderTextColor={activeTheme.placeholder.color}
                                />
                            </View>
                        </View>

                        {/* Quantity Row */}
                        <View style={{ marginBottom: 4 }}>
                            <Text style={[styles.label, activeTheme.label]}>
                                Quantity ({segment === "options" || segment === "futures" ? "Contracts" : "Shares"})
                            </Text>
                            <TextInput
                                style={[styles.input, activeTheme.input]}
                                value={quantity}
                                onChangeText={setQuantity}
                                keyboardType="number-pad"
                                placeholder="75"
                                placeholderTextColor={activeTheme.placeholder.color}
                            />

                            {/* Quick Lot / Size Chips */}
                            <View style={styles.quickLotRow}>
                                <Text style={[styles.quickLotLabel, activeTheme.subtext]}>Quick Lots:</Text>
                                {lotPresets.map((preset) => (
                                    <TouchableOpacity
                                        key={preset.label}
                                        style={[
                                            styles.quickLotChip,
                                            quantity === preset.qty
                                                ? { backgroundColor: "#2563EB", borderColor: "#2563EB" }
                                                : { backgroundColor: theme === "dark" ? "#1E293B" : "#F1F5F9", borderColor: activeTheme.borderColor },
                                        ]}
                                        onPress={() => setQuantity(preset.qty)}
                                        activeOpacity={0.8}
                                    >
                                        <Text
                                            style={[
                                                styles.quickLotChipText,
                                                { color: quantity === preset.qty ? "#FFFFFF" : activeTheme.label.color },
                                            ]}
                                        >
                                            {preset.label}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    </View>
                </View>

                {/* ── Zero Brokerage Savings Banner ── */}
                {isZeroBroker && result.isValid && (
                    <View
                        style={[
                            styles.zeroBadgeBanner,
                            {
                                backgroundColor: theme === "dark" ? "#062016" : "#ECFDF5",
                                borderColor: "#059669",
                            },
                        ]}
                    >
                        <Text style={{ fontSize: 20 }}>🎉</Text>
                        <View style={{ flex: 1 }}>
                            <Text
                                style={{
                                    fontSize: 13,
                                    fontWeight: "700",
                                    color: theme === "dark" ? "#6EE7B7" : "#065F46",
                                }}
                            >
                                Zero Brokerage Advantage with {activeBroker.name}!
                            </Text>
                            <Text
                                style={{
                                    fontSize: 11,
                                    color: theme === "dark" ? "#A7F3D0" : "#047857",
                                    marginTop: 2,
                                }}
                            >
                                You saved {formatCurrency(result.zeroBrokerageSavings)} (₹40 brokerage + 18% GST) compared to Zerodha / Upstox / Groww on this trade.
                            </Text>
                        </View>
                    </View>
                )}

                {/* ── Net Realized Results Card ── */}
                <View style={styles.cardWrapper}>
                    <View style={[styles.card, activeTheme.card, { padding: 18, borderRadius: 16 }]}>
                        <Text style={[styles.label, activeTheme.subtext, { fontSize: 11, fontWeight: "700", letterSpacing: 0.5 }]}>
                            NET REALIZED P&L (IN-HAND)
                        </Text>
                        <View style={{ flexDirection: "row", alignItems: "baseline", gap: 10, marginTop: 4, marginBottom: 14 }}>
                            <Text
                                style={{
                                    fontSize: 32,
                                    fontWeight: "800",
                                    color: !result.isValid
                                        ? activeTheme.title.color
                                        : isProfit
                                        ? "#10B981"
                                        : "#EF4444",
                                }}
                            >
                                {result.isValid ? formatCurrency(result.netPnl) : "₹ 0"}
                            </Text>
                            {result.isValid && (
                                <Text
                                    style={{
                                        fontSize: 14,
                                        fontWeight: "700",
                                        color: isProfit ? "#10B981" : "#EF4444",
                                    }}
                                >
                                    ({result.netPnlPercent >= 0 ? "+" : ""}{result.netPnlPercent.toFixed(2)}%)
                                </Text>
                            )}
                        </View>

                        {/* Metrics Grid */}
                        <View
                            style={{
                                flexDirection: "row",
                                borderTopWidth: 1,
                                borderTopColor: activeTheme.borderColor,
                                paddingTop: 12,
                                gap: 12,
                            }}
                        >
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.subtext, activeTheme.subtext, { fontSize: 11 }]}>
                                    Gross P&L
                                </Text>
                                <Text
                                    style={{
                                        fontSize: 15,
                                        fontWeight: "700",
                                        color: result.grossPnl >= 0 ? "#10B981" : "#EF4444",
                                        marginTop: 2,
                                    }}
                                >
                                    {result.isValid ? formatCurrency(result.grossPnl) : "₹ 0"}
                                </Text>
                            </View>

                            <View style={{ flex: 1 }}>
                                <Text style={[styles.subtext, activeTheme.subtext, { fontSize: 11 }]}>
                                    Total Charges
                                </Text>
                                <Text
                                    style={{
                                        fontSize: 15,
                                        fontWeight: "700",
                                        color: "#EF4444",
                                        marginTop: 2,
                                    }}
                                >
                                    {result.isValid ? `− ${formatCurrency(result.totalCharges)}` : "₹ 0"}
                                </Text>
                            </View>

                            <View style={{ flex: 1 }}>
                                <Text style={[styles.subtext, activeTheme.subtext, { fontSize: 11 }]}>
                                    Total Turnover
                                </Text>
                                <Text
                                    style={{
                                        fontSize: 15,
                                        fontWeight: "700",
                                        color: activeTheme.title.color,
                                        marginTop: 2,
                                    }}
                                >
                                    {result.isValid ? formatCurrency(result.totalTurnover) : "₹ 0"}
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* ── Breakeven Indicator Box ── */}
                {result.isValid && (
                    <View
                        style={[
                            styles.breakevenCard,
                            {
                                backgroundColor: theme === "dark" ? "#0B1528" : "#EFF6FF",
                                borderColor: "#3B82F6",
                            },
                        ]}
                    >
                        <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: 11, fontWeight: "700", color: "#3B82F6", letterSpacing: 0.5 }}>
                                BREAKEVEN POINT
                            </Text>
                            <Text style={{ fontSize: 13, color: activeTheme.title.color, marginTop: 3 }}>
                                Sell at or above <Text style={{ fontWeight: "800" }}>{formatCurrency(result.breakevenPrice)}</Text> to cover all statutory charges.
                            </Text>
                        </View>
                        <View style={{ alignItems: "flex-end" }}>
                            <Text style={{ fontSize: 11, color: activeTheme.subtext.color }}>
                                Min Move Needed
                            </Text>
                            <Text style={{ fontSize: 16, fontWeight: "800", color: "#2563EB" }}>
                                +{result.breakevenPoints.toFixed(2)} pts
                            </Text>
                        </View>
                    </View>
                )}

                {/* ── Itemized Statutory Tax Ledger ── */}
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
                            Statutory Charge Breakdown
                        </Text>
                        <Text style={[styles.taxTableHeaderText, { color: activeTheme.subtext.color }]}>
                            Amount (₹)
                        </Text>
                    </View>

                    {/* Brokerage */}
                    <View style={[styles.taxRow, { borderBottomColor: activeTheme.borderColor }]}>
                        <View style={styles.taxLabelCol}>
                            <Text style={[styles.taxName, { color: activeTheme.title.color }]}>
                                Brokerage ({activeBroker.name})
                            </Text>
                            <Text style={[styles.taxNote, activeTheme.subtext]}>
                                Buy: {formatCurrency(result.brokerageBuy)} | Sell: {formatCurrency(result.brokerageSell)}
                            </Text>
                        </View>
                        <Text style={[styles.taxValue, { color: isZeroBroker ? "#10B981" : activeTheme.title.color }]}>
                            {isZeroBroker ? "₹ 0.00" : formatCurrency(result.totalBrokerage)}
                        </Text>
                    </View>

                    {/* STT / CTT */}
                    <View style={[styles.taxRow, { borderBottomColor: activeTheme.borderColor }]}>
                        <View style={styles.taxLabelCol}>
                            <Text style={[styles.taxName, { color: activeTheme.title.color }]}>
                                STT / CTT
                            </Text>
                            <Text style={[styles.taxNote, activeTheme.subtext]}>
                                {segment === "options"
                                    ? "0.1% on Sell Premium Turnover"
                                    : segment === "equity_delivery"
                                    ? "0.1% on Buy + 0.1% on Sell"
                                    : segment === "equity_intraday"
                                    ? "0.025% on Sell side"
                                    : "0.02% on Sell side"}
                            </Text>
                        </View>
                        <Text style={[styles.taxValue, { color: activeTheme.title.color }]}>
                            {formatCurrency(result.stt)}
                        </Text>
                    </View>

                    {/* Exchange Transaction Charges */}
                    <View style={[styles.taxRow, { borderBottomColor: activeTheme.borderColor }]}>
                        <View style={styles.taxLabelCol}>
                            <Text style={[styles.taxName, { color: activeTheme.title.color }]}>
                                Exchange Txn Charges
                            </Text>
                            <Text style={[styles.taxNote, activeTheme.subtext]}>
                                NSE standard ({segment === "options" ? "0.03503% on premium" : "0.00297%"})
                            </Text>
                        </View>
                        <Text style={[styles.taxValue, { color: activeTheme.title.color }]}>
                            {formatCurrency(result.exchangeTxn)}
                        </Text>
                    </View>

                    {/* GST */}
                    <View style={[styles.taxRow, { borderBottomColor: activeTheme.borderColor }]}>
                        <View style={styles.taxLabelCol}>
                            <Text style={[styles.taxName, { color: activeTheme.title.color }]}>
                                GST (18%)
                            </Text>
                            <Text style={[styles.taxNote, activeTheme.subtext]}>
                                18% on (Brokerage + Exchange + SEBI)
                            </Text>
                        </View>
                        <Text style={[styles.taxValue, { color: activeTheme.title.color }]}>
                            {formatCurrency(result.gst)}
                        </Text>
                    </View>

                    {/* SEBI Charges */}
                    <View style={[styles.taxRow, { borderBottomColor: activeTheme.borderColor }]}>
                        <View style={styles.taxLabelCol}>
                            <Text style={[styles.taxName, { color: activeTheme.title.color }]}>
                                SEBI Turnover Charges
                            </Text>
                            <Text style={[styles.taxNote, activeTheme.subtext]}>
                                ₹10 / Crore (0.0001% of turnover)
                            </Text>
                        </View>
                        <Text style={[styles.taxValue, { color: activeTheme.title.color }]}>
                            {formatCurrency(result.sebiCharges)}
                        </Text>
                    </View>

                    {/* Stamp Duty */}
                    <View style={[styles.taxRow, { borderBottomColor: activeTheme.borderColor }]}>
                        <View style={styles.taxLabelCol}>
                            <Text style={[styles.taxName, { color: activeTheme.title.color }]}>
                                Stamp Duty
                            </Text>
                            <Text style={[styles.taxNote, activeTheme.subtext]}>
                                Buy side only ({segment === "equity_delivery" ? "0.015%" : "0.003%"})
                            </Text>
                        </View>
                        <Text style={[styles.taxValue, { color: activeTheme.title.color }]}>
                            {formatCurrency(result.stampDuty)}
                        </Text>
                    </View>

                    {/* DP Charges (Delivery only) */}
                    {segment === "equity_delivery" && (
                        <View style={[styles.taxRow, { borderBottomColor: activeTheme.borderColor }]}>
                            <View style={styles.taxLabelCol}>
                                <Text style={[styles.taxName, { color: activeTheme.title.color }]}>
                                    DP Charges (Sell Side)
                                </Text>
                                <Text style={[styles.taxNote, activeTheme.subtext]}>
                                    CDSL / NSDL Depository Flat Fee
                                </Text>
                            </View>
                            <Text style={[styles.taxValue, { color: activeTheme.title.color }]}>
                                {formatCurrency(result.dpCharges)}
                            </Text>
                        </View>
                    )}

                    {/* Total Charges Row */}
                    <View style={[styles.taxTotalRow, { backgroundColor: activeTheme.tableHeaderBg }]}>
                        <Text style={[styles.taxTotalLabel, { color: activeTheme.title.color }]}>
                            Total Statutory & Broker Charges
                        </Text>
                        <Text style={[styles.taxTotalValue, { color: "#EF4444" }]}>
                            {formatCurrency(result.totalCharges)}
                        </Text>
                    </View>
                </View>

                {/* ── Informational Footer ── */}
                <View style={{ paddingHorizontal: 4, paddingBottom: 24 }}>
                    <Text style={[styles.subtext, activeTheme.subtext, { fontSize: 11, lineHeight: 16 }]}>
                        💡 <Text style={{ fontWeight: "700" }}>Did you know?</Text> While discount brokers charge ₹20 per executed order (₹40 round-trip + 18% GST = ₹47.20), zero-brokerage brokers like <Text style={{ fontWeight: "700" }}>Shoonya (Finvasia)</Text> and <Text style={{ fontWeight: "700" }}>FlatTrade</Text> waive 100% of brokerage fees on Options, Futures, and Equity. For high-volume options scalpers, this can save ₹10,000 to ₹50,000+ per month in direct friction costs.
                    </Text>
                </View>
            </View>
        </ScrollView>
    );
}
