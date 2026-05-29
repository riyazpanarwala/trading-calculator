import React, { useState, useMemo, useRef } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    Share,
    Platform,
    Clipboard,
} from "react-native";
import { captureRef } from "react-native-view-shot";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import Svg, { Line, Circle, Rect, Text as SvgText, Defs, LinearGradient, Stop } from "react-native-svg";
import styles, { lightTheme, darkTheme } from "./styles";

const FIELD_LABELS = {
    entryPrice: "Entry Price",
    slPrice: "SL Price",
    slPercent: "SL %",
    riskAmount: "Risk Amount",
    positionAmount: "Position Amount",
    quantity: "Quantity",
    targetPercent: "Target %",
    targetPrice: "Target Price",
    riskReward: "Risk : Reward",
    profitAmount: "Profit Amount",
};

const EPS = 1e-9;

// ─── Trade Quality Badge ────────────────────────────────────────────────────

function getTradeQuality(rr) {
    if (rr == null || rr <= 0) return null;
    if (rr < 1)   return { label: "Poor",       emoji: "⚠️",  bg: "#FF3B30", text: "#fff" };
    if (rr < 1.5) return { label: "Acceptable", emoji: "🔶",  bg: "#FF9500", text: "#fff" };
    if (rr < 2.5) return { label: "Good",       emoji: "✅",  bg: "#34C759", text: "#fff" };
    return            { label: "Excellent",      emoji: "🚀",  bg: "#007AFF", text: "#fff" };
}

function TradeQualityBadge({ riskReward, theme }) {
    const activeTheme = theme === "light" ? lightTheme : darkTheme;
    const rrNum = parseFloat(riskReward);
    const quality = getTradeQuality(isNaN(rrNum) ? null : rrNum);
    if (!quality) return null;

    return (
        <View style={[badgeStyles.container, activeTheme.card]}>
            <Text style={[badgeStyles.heading, activeTheme.label]}>Trade Quality</Text>
            <View style={[badgeStyles.badge, { backgroundColor: quality.bg }]}>
                <Text style={badgeStyles.badgeEmoji}>{quality.emoji}</Text>
                <Text style={[badgeStyles.badgeLabel, { color: quality.text }]}>
                    {quality.label}
                </Text>
            </View>
            <Text style={[badgeStyles.rrText, activeTheme.label]}>
                R:R = 1 : {rrNum.toFixed(2)}
            </Text>
        </View>
    );
}

// ─── R:R Visual Bar ─────────────────────────────────────────────────────────

function RRBar({ riskReward, riskAmount, profitAmount, theme }) {
    const activeTheme = theme === "light" ? lightTheme : darkTheme;
    const rrNum = parseFloat(riskReward);
    if (isNaN(rrNum) || rrNum <= 0) return null;

    // Cap the visual ratio so the bar stays legible even at R:R 10+
    const cappedRR = Math.min(rrNum, 5);
    const total = 1 + cappedRR;
    const riskPct = (1 / total) * 100;
    const rewardPct = (cappedRR / total) * 100;

    const riskAmt  = parseFloat(riskAmount);
    const profitAmt = parseFloat(profitAmount);

    return (
        <View style={[rrBarStyles.container, activeTheme.card]}>
            <Text style={[rrBarStyles.heading, activeTheme.label]}>Risk / Reward</Text>

            {/* Bar */}
            <View style={rrBarStyles.barRow}>
                <View style={[rrBarStyles.riskSegment, { flex: riskPct }]}>
                    <Text style={rrBarStyles.segLabel}>Risk</Text>
                    <Text style={rrBarStyles.segValue}>1</Text>
                </View>
                <View style={[rrBarStyles.rewardSegment, { flex: rewardPct }]}>
                    <Text style={rrBarStyles.segLabel}>Reward</Text>
                    <Text style={rrBarStyles.segValue}>{cappedRR.toFixed(2)}{rrNum > 5 ? "+" : ""}</Text>
                </View>
            </View>

            {/* Amounts */}
            {!isNaN(riskAmt) && !isNaN(profitAmt) && (
                <View style={rrBarStyles.amountsRow}>
                    <Text style={rrBarStyles.riskAmtText}>
                        −{riskAmt.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                    </Text>
                    <Text style={rrBarStyles.profitAmtText}>
                        +{profitAmt.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                    </Text>
                </View>
            )}
        </View>
    );
}

// ─── Price Ladder Chart ──────────────────────────────────────────────────────

function PriceLadder({ entryPrice, slPrice, targetPrice, theme }) {
    const activeTheme = theme === "light" ? lightTheme : darkTheme;

    const entry  = parseFloat(entryPrice);
    const sl     = parseFloat(slPrice);
    const target = parseFloat(targetPrice);

    if (isNaN(entry) || isNaN(sl) || isNaN(target)) return null;
    if (sl >= entry || target <= entry) return null;

    const W = 280;
    const H = 220;
    const leftPad = 14;
    const rightPad = 14;
    const topPad = 20;
    const bottomPad = 20;
    const lineX = leftPad + 40;
    const labelX = lineX + 14;

    const chartH = H - topPad - bottomPad;

    // Map price → Y (higher price = lower Y)
    const minP = sl    * 0.999;
    const maxP = target * 1.001;
    const range = maxP - minP;
    const toY = (p) => topPad + chartH - ((p - minP) / range) * chartH;

    const yEntry  = toY(entry);
    const ySL     = toY(sl);
    const yTarget = toY(target);

    const isDark = theme === "dark";
    const axisColor    = isDark ? "#555"    : "#CCC";
    const entryColor   = "#007AFF";
    const slColor      = "#FF3B30";
    const targetColor  = "#34C759";
    const labelColor   = isDark ? "#FFF"    : "#1C1C1E";
    const sublabelColor = isDark ? "#AAA"   : "#888";

    const priceFmt = (p) =>
        p >= 10000
            ? p.toLocaleString("en-IN", { maximumFractionDigits: 0 })
            : p.toLocaleString("en-IN", { maximumFractionDigits: 2 });

    return (
        <View style={[ladderStyles.container, activeTheme.card]}>
            <Text style={[ladderStyles.heading, activeTheme.label]}>Price Ladder</Text>

            <Svg width={W} height={H}>
                {/* Vertical axis spine */}
                <Line x1={lineX} y1={topPad} x2={lineX} y2={H - bottomPad}
                    stroke={axisColor} strokeWidth={1.5} />

                {/* ── Target zone (entry → target) ── */}
                <Rect
                    x={lineX - 6}
                    y={yTarget}
                    width={12}
                    height={yEntry - yTarget}
                    fill={targetColor}
                    opacity={0.18}
                />

                {/* ── Risk zone (sl → entry) ── */}
                <Rect
                    x={lineX - 6}
                    y={yEntry}
                    width={12}
                    height={ySL - yEntry}
                    fill={slColor}
                    opacity={0.18}
                />

                {/* ── Target tick ── */}
                <Line x1={lineX - 8} y1={yTarget} x2={lineX + 8} y2={yTarget}
                    stroke={targetColor} strokeWidth={2.5} strokeLinecap="round" />
                <Circle cx={lineX} cy={yTarget} r={5} fill={targetColor} />
                <SvgText x={labelX} y={yTarget - 7} fontSize={10} fill={sublabelColor} fontWeight="500">
                    TARGET
                </SvgText>
                <SvgText x={labelX} y={yTarget + 5} fontSize={13} fill={targetColor} fontWeight="700">
                    {priceFmt(target)}
                </SvgText>

                {/* ── Entry tick ── */}
                <Line x1={lineX - 8} y1={yEntry} x2={lineX + 8} y2={yEntry}
                    stroke={entryColor} strokeWidth={2.5} strokeLinecap="round" />
                <Circle cx={lineX} cy={yEntry} r={5} fill={entryColor} />
                <SvgText x={labelX} y={yEntry - 7} fontSize={10} fill={sublabelColor} fontWeight="500">
                    ENTRY
                </SvgText>
                <SvgText x={labelX} y={yEntry + 5} fontSize={13} fill={entryColor} fontWeight="700">
                    {priceFmt(entry)}
                </SvgText>

                {/* ── SL tick ── */}
                <Line x1={lineX - 8} y1={ySL} x2={lineX + 8} y2={ySL}
                    stroke={slColor} strokeWidth={2.5} strokeLinecap="round" />
                <Circle cx={lineX} cy={ySL} r={5} fill={slColor} />
                <SvgText x={labelX} y={ySL - 7} fontSize={10} fill={sublabelColor} fontWeight="500">
                    STOP LOSS
                </SvgText>
                <SvgText x={labelX} y={ySL + 5} fontSize={13} fill={slColor} fontWeight="700">
                    {priceFmt(sl)}
                </SvgText>

                {/* ── % labels on the right ── */}
                {/* Risk % */}
                <SvgText
                    x={lineX - 22}
                    y={(yEntry + ySL) / 2 + 4}
                    fontSize={10}
                    fill={slColor}
                    fontWeight="600"
                    textAnchor="middle"
                >
                    {(((entry - sl) / entry) * 100).toFixed(1)}%
                </SvgText>

                {/* Reward % */}
                <SvgText
                    x={lineX - 22}
                    y={(yEntry + yTarget) / 2 + 4}
                    fontSize={10}
                    fill={targetColor}
                    fontWeight="600"
                    textAnchor="middle"
                >
                    {(((target - entry) / entry) * 100).toFixed(1)}%
                </SvgText>
            </Svg>
        </View>
    );
}

// ─── Share Button ────────────────────────────────────────────────────────────

function ShareButton({ captureViewRef, vals, theme }) {
    const activeTheme = theme === "light" ? lightTheme : darkTheme;
    const [sharing, setSharing] = useState(false);

    const handleShare = async () => {
        try {
            setSharing(true);
            const uri = await captureRef(captureViewRef, {
                format: "png",
                quality: 1,
                result: "tmpfile",
            });

            if (Platform.OS === "android") {
                await Sharing.shareAsync(uri, {
                    mimeType: "image/png",
                    dialogTitle: "Share Trade Setup",
                });
            } else {
                await Share.share({ url: uri });
            }
        } catch (e) {
            console.warn("Share failed:", e);
        } finally {
            setSharing(false);
        }
    };

    // Only show if we have meaningful data to share
    const hasData =
        vals.entryPrice !== "" &&
        (vals.slPrice !== "" || vals.targetPrice !== "");

    if (!hasData) return null;

    return (
        <TouchableOpacity
            style={[shareStyles.button, activeTheme.toggle]}
            onPress={handleShare}
            disabled={sharing}
        >
            <Text style={[shareStyles.buttonText, activeTheme.label]}>
                {sharing ? "⏳ Capturing…" : "📤 Share Setup"}
            </Text>
        </TouchableOpacity>
    );
}

// ─── Main Calculator ─────────────────────────────────────────────────────────

export default function CalculatorScreen() {
    const [theme, setTheme] = useState("light");
    const [vals, setVals] = useState(
        Object.keys(FIELD_LABELS).reduce((acc, k) => ({ ...acc, [k]: "" }), {})
    );
    const [errors, setErrors] = useState({});
    const captureViewRef = useRef(null);
    const [copyFeedback, setCopyFeedback] = useState(false);

    const activeTheme = theme === "light" ? lightTheme : darkTheme;

    // ── Reset all fields ──────────────────────────────────────────────────────
    function handleReset() {
        setVals(Object.keys(FIELD_LABELS).reduce((acc, k) => ({ ...acc, [k]: "" }), {}));
        setErrors({});
    }

    // ── Copy all filled results to clipboard ──────────────────────────────────
    function handleCopy() {
        const lines = Object.keys(FIELD_LABELS)
            .filter((k) => vals[k] !== "")
            .map((k) => `${FIELD_LABELS[k]}: ${vals[k]}`);
        if (lines.length === 0) return;
        Clipboard.setString(lines.join("\n"));
        setCopyFeedback(true);
        setTimeout(() => setCopyFeedback(false), 2000);
    }

    const toNum = (s) => {
        if (s === null || s === undefined || s === "") return null;
        const n = Number(String(s).replace(/,/g, ""));
        return Number.isFinite(n) ? n : null;
    };

    function setInput(field, rawValue) {
        if (rawValue.includes("-")) rawValue = rawValue.replace(/-/g, "");

        const numVal = toNum(rawValue);

        if (
            numVal != null &&
            [
                "entryPrice", "slPrice", "targetPrice", "positionAmount",
                "quantity", "riskAmount", "profitAmount", "targetPercent",
            ].includes(field) &&
            numVal < 0
        ) {
            setVals((p) => ({ ...p, [field]: "" }));
            setErrors((p) => ({ ...p, [field]: null }));
            return;
        }

        if (field === "slPercent" && numVal != null) {
            if (numVal < 0 || numVal > 100) {
                setErrors((p) => ({
                    ...p,
                    [field]: "Percentage must be between 0 and 100",
                }));
                return;
            }
        }

        setErrors((p) => ({ ...p, [field]: null }));

        const numericVals = {};
        for (const k of Object.keys(FIELD_LABELS)) {
            numericVals[k] = k === field ? numVal : toNum(vals[k]);
        }

        const derived = deriveIterative(numericVals, field);

        const formatted = {};
        for (const k of Object.keys(derived)) {
            const v = derived[k];
            if (v == null) {
                formatted[k] = "";
            } else if (Math.abs(v - Math.round(v)) < 1e-6) {
                formatted[k] = String(Math.round(v));
            } else {
                formatted[k] = String(Number(v.toFixed(6)));
            }
        }
        formatted[field] = rawValue;

        setVals(formatted);
    }

    function deriveIterative(initial, editedField) {
        const v = { ...initial };
        let changed = true;
        let iter = 0;

        while (changed && iter++ < 40) {
            changed = false;

            if (
                editedField !== "slPercent" &&
                v.entryPrice != null && v.slPrice != null && v.entryPrice > EPS
            ) {
                const slPercent = ((v.entryPrice - v.slPrice) / v.entryPrice) * 100;
                if (Math.abs(slPercent - (v.slPercent ?? 0)) > EPS) { v.slPercent = slPercent; changed = true; }
            }

            if (editedField !== "slPrice" && v.entryPrice != null && v.slPercent != null) {
                const slPrice = v.entryPrice * (1 - v.slPercent / 100);
                if (Math.abs(slPrice - (v.slPrice ?? 0)) > EPS) { v.slPrice = slPrice; changed = true; }
            }

            if (
                editedField !== "targetPercent" &&
                v.entryPrice != null && v.targetPrice != null && v.entryPrice > EPS
            ) {
                const targetPercent = ((v.targetPrice - v.entryPrice) / v.entryPrice) * 100;
                if (Math.abs(targetPercent - (v.targetPercent ?? 0)) > EPS) { v.targetPercent = targetPercent; changed = true; }
            }

            if (editedField !== "targetPrice" && v.entryPrice != null && v.targetPercent != null) {
                const targetPrice = v.entryPrice * (1 + v.targetPercent / 100);
                if (Math.abs(targetPrice - (v.targetPrice ?? 0)) > EPS) { v.targetPrice = targetPrice; changed = true; }
            }

            if (editedField !== "quantity") {
                let derivedQty = null;
                if (
                    editedField === "positionAmount" &&
                    v.positionAmount != null && v.entryPrice != null && Math.abs(v.entryPrice) > EPS
                ) {
                    derivedQty = v.positionAmount / v.entryPrice;
                } else if (
                    editedField !== "positionAmount" &&
                    v.riskAmount != null && v.slPrice != null && v.entryPrice != null
                ) {
                    const denom = Math.abs(v.entryPrice - v.slPrice);
                    if (denom > EPS) derivedQty = v.riskAmount / denom;
                } else if (
                    editedField !== "positionAmount" &&
                    v.positionAmount != null && v.entryPrice != null && Math.abs(v.entryPrice) > EPS
                ) {
                    derivedQty = v.positionAmount / v.entryPrice;
                }
                if (derivedQty != null && Math.abs(derivedQty - (v.quantity ?? 0)) > EPS) {
                    v.quantity = derivedQty; changed = true;
                }
            }

            if (editedField !== "positionAmount" && v.quantity != null && v.entryPrice != null) {
                const pos = v.quantity * v.entryPrice;
                if (Math.abs(pos - (v.positionAmount ?? 0)) > EPS) { v.positionAmount = pos; changed = true; }
            }

            if (
                editedField !== "riskAmount" &&
                v.quantity != null && v.entryPrice != null && v.slPrice != null
            ) {
                const ra = Math.abs(v.entryPrice - v.slPrice) * v.quantity;
                if (Math.abs(ra - (v.riskAmount ?? 0)) > EPS) { v.riskAmount = ra; changed = true; }
            }

            if (v.entryPrice != null && v.slPrice != null && v.targetPrice != null) {
                const denom = Math.abs(v.entryPrice - v.slPrice);
                if (denom > EPS) {
                    const rr = (v.targetPrice - v.entryPrice) / denom;
                    if (Math.abs(rr - (v.riskReward ?? 0)) > EPS) { v.riskReward = rr; changed = true; }
                }
            }

            if (
                editedField !== "profitAmount" &&
                v.quantity != null && v.entryPrice != null && v.targetPrice != null
            ) {
                const p = (v.targetPrice - v.entryPrice) * v.quantity;
                if (Math.abs(p - (v.profitAmount ?? 0)) > EPS) { v.profitAmount = p; changed = true; }
            }
        }

        return v;
    }

    const userFilledCount = useMemo(
        () => Object.keys(vals).filter((k) => vals[k] !== "").length,
        [vals]
    );

    const missing = useMemo(() => {
        if (userFilledCount <= 3) return [];
        return Object.keys(FIELD_LABELS).filter((k) => vals[k] === "");
    }, [vals, userFilledCount]);

    // Check if visual section has enough data to render
    const hasVisuals =
        vals.riskReward !== "" ||
        (vals.entryPrice !== "" && vals.slPrice !== "" && vals.targetPrice !== "");

    return (
        <ScrollView style={[styles.container, activeTheme.container]}>
            {/* ── Capture wrapper starts here ── */}
            <View ref={captureViewRef} style={activeTheme.container}>

                <View style={styles.header}>
                    <Text style={[styles.title, activeTheme.title]}>
                        Universal Trading Calc
                    </Text>
                    <View style={{ flexDirection: "row", gap: 8 }}>
                        <TouchableOpacity
                            style={[styles.themeToggle, activeTheme.toggle]}
                            onPress={handleReset}
                        >
                            <Text style={{ color: activeTheme.title.color }}>🗑 Reset</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.themeToggle, activeTheme.toggle]}
                            onPress={() => setTheme((t) => (t === "light" ? "dark" : "light"))}
                        >
                            <Text style={{ color: activeTheme.title.color }}>
                                {theme === "light" ? "🌙 Dark" : "☀️ Light"}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* ── Input Grid ── */}
                <View style={styles.grid}>
                    {Object.keys(FIELD_LABELS).map((key) => (
                        <View key={key} style={styles.col}>
                            <Text style={[styles.label, activeTheme.label]}>
                                {FIELD_LABELS[key]}
                            </Text>
                            <TextInput
                                style={[
                                    styles.input,
                                    activeTheme.input,
                                    missing.includes(key) ? styles.missing : null,
                                ]}
                                keyboardType="numeric"
                                value={vals[key]}
                                placeholder={FIELD_LABELS[key]}
                                placeholderTextColor={activeTheme.placeholder.color}
                                onChangeText={(t) => setInput(key, t)}
                            />
                            {errors[key] && (
                                <Text style={styles.error}>{errors[key]}</Text>
                            )}
                        </View>
                    ))}
                </View>

                {/* ── Visual Analysis Section ── */}
                {hasVisuals && (
                    <View style={visualStyles.section}>
                        <Text style={[visualStyles.sectionTitle, activeTheme.label]}>
                            📊 Analysis
                        </Text>

                        {/* Row 1: Badge + R:R Bar */}
                        <View style={visualStyles.row}>
                            <TradeQualityBadge
                                riskReward={vals.riskReward}
                                theme={theme}
                            />
                            <RRBar
                                riskReward={vals.riskReward}
                                riskAmount={vals.riskAmount}
                                profitAmount={vals.profitAmount}
                                theme={theme}
                            />
                        </View>

                        {/* Row 2: Price Ladder (full width) */}
                        <PriceLadder
                            entryPrice={vals.entryPrice}
                            slPrice={vals.slPrice}
                            targetPrice={vals.targetPrice}
                            theme={theme}
                        />
                    </View>
                )}

                {/* ── Missing fields warning ── */}
                {userFilledCount >= 3 && missing.length > 0 && (
                    <View style={[styles.missingBox, activeTheme.missingBox]}>
                        <Text style={[styles.missingTitle, activeTheme.label]}>
                            Missing Required Fields:
                        </Text>
                        {missing.map((m) => (
                            <Text key={m} style={[styles.missingItem, activeTheme.label]}>
                                • {FIELD_LABELS[m]}
                            </Text>
                        ))}
                    </View>
                )}

                <View style={styles.summary}>
                    <Text style={[styles.summaryLabel, activeTheme.label]}>Provided</Text>
                    <Text style={[styles.summaryValue, activeTheme.label]}>
                        {userFilledCount} / {Object.keys(FIELD_LABELS).length}
                    </Text>
                </View>

                {/* ── Copy Results button ── */}
                {userFilledCount > 0 && (
                    <TouchableOpacity
                        style={[
                            actionStyles.copyButton,
                            copyFeedback ? actionStyles.copyButtonDone : activeTheme.toggle,
                        ]}
                        onPress={handleCopy}
                        activeOpacity={0.75}
                    >
                        <Text style={[actionStyles.copyButtonText, activeTheme.label]}>
                            {copyFeedback ? "✅ Copied!" : "📋 Copy Results"}
                        </Text>
                    </TouchableOpacity>
                )}

                <View style={{ height: 16 }} />
            </View>
            {/* ── End capture wrapper ── */}

            {/* Share button sits outside the capture so it doesn't appear in the image */}
            <ShareButton
                captureViewRef={captureViewRef}
                vals={vals}
                theme={theme}
            />

            <View style={{ height: 50 }} />
        </ScrollView>
    );
}

// ─── Local StyleSheets ────────────────────────────────────────────────────────

import { StyleSheet } from "react-native";

const badgeStyles = StyleSheet.create({
    container: {
        flex: 1,
        borderRadius: 12,
        padding: 14,
        alignItems: "center",
        justifyContent: "center",
        minHeight: 110,
    },
    heading: {
        fontSize: 12,
        fontWeight: "600",
        marginBottom: 8,
        textTransform: "uppercase",
        letterSpacing: 0.5,
        opacity: 0.6,
    },
    badge: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        marginBottom: 8,
    },
    badgeEmoji: { fontSize: 16 },
    badgeLabel: { fontSize: 15, fontWeight: "700" },
    rrText: { fontSize: 13, opacity: 0.7 },
});

const rrBarStyles = StyleSheet.create({
    container: {
        flex: 2,
        borderRadius: 12,
        padding: 14,
        minHeight: 110,
        justifyContent: "center",
    },
    heading: {
        fontSize: 12,
        fontWeight: "600",
        marginBottom: 10,
        textTransform: "uppercase",
        letterSpacing: 0.5,
        opacity: 0.6,
    },
    barRow: {
        flexDirection: "row",
        height: 36,
        borderRadius: 8,
        overflow: "hidden",
    },
    riskSegment: {
        backgroundColor: "#FF3B30",
        alignItems: "center",
        justifyContent: "center",
        minWidth: 32,
    },
    rewardSegment: {
        backgroundColor: "#34C759",
        alignItems: "center",
        justifyContent: "center",
        minWidth: 32,
    },
    segLabel: { fontSize: 9, color: "#fff", fontWeight: "600", opacity: 0.85 },
    segValue: { fontSize: 12, color: "#fff", fontWeight: "700" },
    amountsRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 6,
    },
    riskAmtText: { fontSize: 12, color: "#FF3B30", fontWeight: "600" },
    profitAmtText: { fontSize: 12, color: "#34C759", fontWeight: "600" },
});

const ladderStyles = StyleSheet.create({
    container: {
        borderRadius: 12,
        padding: 14,
        marginTop: 12,
        alignItems: "center",
    },
    heading: {
        fontSize: 12,
        fontWeight: "600",
        marginBottom: 6,
        textTransform: "uppercase",
        letterSpacing: 0.5,
        opacity: 0.6,
        alignSelf: "flex-start",
    },
});

const visualStyles = StyleSheet.create({
    section: {
        marginTop: 24,
        paddingHorizontal: 2,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "700",
        marginBottom: 12,
    },
    row: {
        flexDirection: "row",
        gap: 10,
    },
});

const shareStyles = StyleSheet.create({
    button: {
        margin: 16,
        marginTop: 4,
        padding: 14,
        borderRadius: 10,
        alignItems: "center",
    },
    buttonText: {
        fontSize: 15,
        fontWeight: "600",
    },
});

const actionStyles = StyleSheet.create({
    copyButton: {
        marginTop: 14,
        padding: 14,
        borderRadius: 10,
        alignItems: "center",
    },
    copyButtonDone: {
        backgroundColor: "#34C759",
    },
    copyButtonText: {
        fontSize: 15,
        fontWeight: "600",
    },
});
