import React, { useState, useMemo, useRef } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    Share,
    Platform,
    Alert,
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

// Fields that must never be negative
const NON_NEGATIVE_FIELDS = [
    "entryPrice", "slPrice", "targetPrice", "positionAmount",
    "quantity", "riskAmount", "profitAmount", "targetPercent",
    "slPercent", "riskReward",
];

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

    const cappedRR = Math.min(rrNum, 5);
    const total = 1 + cappedRR;
    const riskPct = (1 / total) * 100;
    const rewardPct = (cappedRR / total) * 100;

    const riskAmt  = parseFloat(riskAmount);
    const profitAmt = parseFloat(profitAmount);

    return (
        <View style={[rrBarStyles.container, activeTheme.card]}>
            <Text style={[rrBarStyles.heading, activeTheme.label]}>Risk / Reward</Text>

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
                <Line x1={lineX} y1={topPad} x2={lineX} y2={H - bottomPad}
                    stroke={axisColor} strokeWidth={1.5} />

                <Rect
                    x={lineX - 6}
                    y={yTarget}
                    width={12}
                    height={yEntry - yTarget}
                    fill={targetColor}
                    opacity={0.18}
                />

                <Rect
                    x={lineX - 6}
                    y={yEntry}
                    width={12}
                    height={ySL - yEntry}
                    fill={slColor}
                    opacity={0.18}
                />

                <Line x1={lineX - 8} y1={yTarget} x2={lineX + 8} y2={yTarget}
                    stroke={targetColor} strokeWidth={2.5} strokeLinecap="round" />
                <Circle cx={lineX} cy={yTarget} r={5} fill={targetColor} />
                <SvgText x={labelX} y={yTarget - 7} fontSize={10} fill={sublabelColor} fontWeight="500">
                    TARGET
                </SvgText>
                <SvgText x={labelX} y={yTarget + 5} fontSize={13} fill={targetColor} fontWeight="700">
                    {priceFmt(target)}
                </SvgText>

                <Line x1={lineX - 8} y1={yEntry} x2={lineX + 8} y2={yEntry}
                    stroke={entryColor} strokeWidth={2.5} strokeLinecap="round" />
                <Circle cx={lineX} cy={yEntry} r={5} fill={entryColor} />
                <SvgText x={labelX} y={yEntry - 7} fontSize={10} fill={sublabelColor} fontWeight="500">
                    ENTRY
                </SvgText>
                <SvgText x={labelX} y={yEntry + 5} fontSize={13} fill={entryColor} fontWeight="700">
                    {priceFmt(entry)}
                </SvgText>

                <Line x1={lineX - 8} y1={ySL} x2={lineX + 8} y2={ySL}
                    stroke={slColor} strokeWidth={2.5} strokeLinecap="round" />
                <Circle cx={lineX} cy={ySL} r={5} fill={slColor} />
                <SvgText x={labelX} y={ySL - 7} fontSize={10} fill={sublabelColor} fontWeight="500">
                    STOP LOSS
                </SvgText>
                <SvgText x={labelX} y={ySL + 5} fontSize={13} fill={slColor} fontWeight="700">
                    {priceFmt(sl)}
                </SvgText>

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

            if (Platform.OS === "web") {
                const domNode = captureViewRef.current;
                if (!domNode) {
                    throw new Error("Could not find view element on web.");
                }

                const html2canvas = require("html2canvas");
                const canvas = await html2canvas(domNode, {
                    useCORS: true,
                    logging: false,
                    scale: 2,
                });
                const dataUrl = canvas.toDataURL("image/png");

                if (!dataUrl) {
                    throw new Error("Could not capture view screenshot on web.");
                }

                let shared = false;

                if (typeof navigator !== "undefined" && navigator.share && navigator.canShare) {
                    try {
                        const response = await fetch(dataUrl);
                        const blob = await response.blob();
                        const file = new File([blob], "trade-setup.png", { type: "image/png" });

                        if (navigator.canShare({ files: [file] })) {
                            await navigator.share({
                                title: "Trade Setup",
                                text: "Check out my trade setup calculation",
                                files: [file],
                            });
                            shared = true;
                        }
                    } catch (shareErr) {
                        if (shareErr.name !== "AbortError") {
                            console.warn("Web Share API error:", shareErr);
                        } else {
                            shared = true; // User cancelled share sheet
                        }
                    }
                }

                if (!shared && typeof document !== "undefined") {
                    const link = document.createElement("a");
                    link.href = dataUrl;
                    link.download = `trade-setup-${Date.now()}.png`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                }
                return;
            }

            const uri = await captureRef(captureViewRef, {
                format: "png",
                quality: 0.95,
                result: "tmpfile",
            });

            if (!uri) {
                throw new Error("Could not generate screenshot file.");
            }

            const isSharingAvailable = await Sharing.isAvailableAsync();
            if (isSharingAvailable) {
                await Sharing.shareAsync(uri, {
                    mimeType: "image/png",
                    dialogTitle: "Share Trade Setup",
                    UTI: "public.png",
                });
            } else {
                await Share.share({
                    title: "Trade Setup",
                    url: uri,
                });
            }
        } catch (e) {
            console.error("Share failed:", e);
            const msg = e && e.message ? e.message : "Failed to capture or share screenshot.";
            if (Platform.OS === "web") {
                alert("Share notice: " + msg);
            } else {
                Alert.alert("Share Screenshot", msg);
            }
        } finally {
            setSharing(false);
        }
    };

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
                {sharing ? "⏳ Capturing…" : "📤 Share Screenshot"}
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
    const [missing, setMissing] = useState([]);
    const [calculated, setCalculated] = useState(false);
    const [globalMessage, setGlobalMessage] = useState(null); // { type: 'error'|'info', text: '...' }
    const captureViewRef = useRef(null);

    const activeTheme = theme === "light" ? lightTheme : darkTheme;

    function handleReset() {
        setVals(Object.keys(FIELD_LABELS).reduce((acc, k) => ({ ...acc, [k]: "" }), {}));
        setErrors({});
        setMissing([]);
        setCalculated(false);
        setGlobalMessage(null);
    }


    const toNum = (s) => {
        if (s === null || s === undefined || s === "") return null;
        const n = Number(String(s).replace(/,/g, ""));
        return Number.isFinite(n) ? n : NaN; // NaN signals "user typed something, but it's invalid"
    };

    // Accepts plain numbers ("2", "2.5") or ratio format ("1:2", "1 : 2.5")
    // Returns the normalized R:R as reward/risk, or NaN if invalid.
    const parseRiskReward = (raw) => {
        if (raw === null || raw === undefined || raw === "") return null;

        const trimmed = String(raw).trim();

        if (trimmed.includes(":")) {
            const parts = trimmed.split(":").map((p) => p.trim());
            if (parts.length !== 2) return NaN;

            const risk = Number(parts[0]);
            const reward = Number(parts[1]);

            if (!Number.isFinite(risk) || !Number.isFinite(reward)) return NaN;
            if (risk <= 0 || reward <= 0) return NaN;

            return reward / risk;
        }

        const n = Number(trimmed.replace(/,/g, ""));
        return Number.isFinite(n) ? n : NaN;
    };

    // Only update the raw text — no derivation, no validation, while typing.
    function setInput(field, rawValue) {
        setVals((p) => ({ ...p, [field]: rawValue }));
        // Clear stale state once user starts editing again
        if (calculated) {
            setCalculated(false);
            setGlobalMessage(null);
        }
        if (errors[field]) {
            setErrors((p) => ({ ...p, [field]: null }));
        }
    }

    // ─── Calculate button handler ───────────────────────────────────────────
    function handleCalculate() {
        const fieldErrors = {};
        const numericVals = {};

        // STEP 1: Parse every field, catch non-numeric / malformed input
        for (const k of Object.keys(FIELD_LABELS)) {
            const raw = vals[k];
            if (raw === "" || raw === null || raw === undefined) {
                numericVals[k] = null;
                continue;
            }

            if (k === "riskReward") {
                const n = parseRiskReward(raw);
                if (Number.isNaN(n)) {
                    fieldErrors[k] = "Invalid format. Use e.g. 2 or 1:2";
                    numericVals[k] = null;
                } else {
                    numericVals[k] = n;
                }
                continue;
            }

            const n = toNum(raw);
            if (Number.isNaN(n)) {
                fieldErrors[k] = "Invalid number";
                numericVals[k] = null;
            } else {
                numericVals[k] = n;
            }
        }

        // STEP 2: Negative value checks
        for (const k of NON_NEGATIVE_FIELDS) {
            const n = numericVals[k];
            if (n != null && n < 0 && !fieldErrors[k]) {
                fieldErrors[k] = "Value cannot be negative";
                numericVals[k] = null;
            }
        }

        // STEP 3: SL % range check (0-100)
        if (numericVals.slPercent != null && !fieldErrors.slPercent) {
            if (numericVals.slPercent > 100) {
                fieldErrors.slPercent = "SL % cannot exceed 100";
                numericVals.slPercent = null;
            }
        }

        // STEP 4: If any field-level errors exist, stop here
        if (Object.keys(fieldErrors).length > 0) {
            setErrors(fieldErrors);
            setMissing([]);
            setCalculated(false);
            setGlobalMessage({
                type: "error",
                text: "Please fix the highlighted field(s) before calculating.",
            });
            return;
        }

        // STEP 5: Count how many fields the user actually provided
        const filledCount = Object.keys(FIELD_LABELS).filter(
            (k) => numericVals[k] != null
        ).length;

        if (filledCount === 0) {
            setErrors({});
            setMissing([]);
            setCalculated(false);
            setGlobalMessage({
                type: "error",
                text: "Please enter at least Entry Price plus one more value.",
            });
            return;
        }

        if (numericVals.entryPrice == null) {
            setErrors({ entryPrice: "Entry Price is required" });
            setMissing([]);
            setCalculated(false);
            setGlobalMessage({
                type: "error",
                text: "Entry Price is required to calculate anything else.",
            });
            return;
        }

        if (numericVals.entryPrice <= EPS) {
            setErrors({ entryPrice: "Entry Price must be greater than 0" });
            setMissing([]);
            setCalculated(false);
            setGlobalMessage({
                type: "error",
                text: "Entry Price must be greater than 0.",
            });
            return;
        }

        if (filledCount < 2) {
            setErrors({});
            setMissing([]);
            setCalculated(false);
            setGlobalMessage({
                type: "error",
                text: "Please enter at least one more field besides Entry Price.",
            });
            return;
        }

        // STEP 6: Logical / cross-field validations BEFORE deriving
        const logicErrors = {};

        // SL Price must be below Entry Price
        if (numericVals.slPrice != null && numericVals.slPrice >= numericVals.entryPrice) {
            logicErrors.slPrice = "SL Price must be below Entry Price";
        }

        // Target Price must be above Entry Price
        if (numericVals.targetPrice != null && numericVals.targetPrice <= numericVals.entryPrice) {
            logicErrors.targetPrice = "Target Price must be above Entry Price";
        }

        // R:R must be > 0 if user-entered directly
        if (numericVals.riskReward != null && numericVals.riskReward <= 0) {
            logicErrors.riskReward = "Risk:Reward must be greater than 0";
        }

        // Risk Amount cannot exceed Position Amount (if both given)
        if (
            numericVals.riskAmount != null &&
            numericVals.positionAmount != null &&
            numericVals.riskAmount > numericVals.positionAmount
        ) {
            logicErrors.riskAmount = "Risk Amount cannot exceed Position Amount";
        }

        // Quantity must be > 0 if entered directly
        if (numericVals.quantity != null && numericVals.quantity <= 0) {
            logicErrors.quantity = "Quantity must be greater than 0";
        }

        if (Object.keys(logicErrors).length > 0) {
            setErrors(logicErrors);
            setMissing([]);
            setCalculated(false);
            setGlobalMessage({
                type: "error",
                text: "Some values don't make sense together. Please check the highlighted field(s).",
            });
            return;
        }

        // STEP 7: Run the derivation
        // Determine "editedField" preference order for conflict resolution:
        // SL Price wins over SL %, Target Price wins over Target %,
        // Quantity wins over Position Amount, when both are provided.
        let preferredField = null;
        if (numericVals.slPrice != null && numericVals.slPercent != null) {
            preferredField = "slPrice"; // SL Price takes priority; recompute slPercent
        }
        if (numericVals.targetPrice != null && numericVals.targetPercent != null) {
            preferredField = preferredField ?? "targetPrice";
        }
        if (numericVals.quantity != null && numericVals.positionAmount != null) {
            preferredField = preferredField ?? "quantity";
        }

        const derived = deriveIterative(numericVals, preferredField);

        // STEP 8: Sanity-check derived results (catch impossible/garbage outputs)
        const resultErrors = {};
        if (derived.quantity != null && derived.quantity <= 0) {
            resultErrors.quantity = "Calculated Quantity is 0 — check your inputs";
        }
        if (derived.riskReward != null && derived.riskReward <= 0) {
            resultErrors.riskReward = "Calculated Risk:Reward is invalid — check SL/Target vs Entry";
        }
        if (derived.slPrice != null && derived.slPrice <= 0) {
            resultErrors.slPrice = "Calculated SL Price is invalid (≤ 0)";
        }

        if (Object.keys(resultErrors).length > 0) {
            setErrors(resultErrors);
            setMissing([]);
            setCalculated(false);
            setGlobalMessage({
                type: "error",
                text: "The provided values produce an impossible result. Please review your inputs.",
            });
            return;
        }

        // STEP 9: Format results
        const formatted = {};
        for (const k of Object.keys(FIELD_LABELS)) {
            const v = derived[k];
            if (v == null) {
                formatted[k] = "";
            } else if (k === "quantity") {
                formatted[k] = String(Math.floor(v));
            } else if (Math.abs(v - Math.round(v)) < 1e-6) {
                formatted[k] = String(Math.round(v));
            } else {
                formatted[k] = String(Number(v.toFixed(6)));
            }
        }

        setVals(formatted);
        setErrors({});

        // STEP 10: Check for still-missing fields (only meaningful with enough inputs)
        const missingFields = Object.keys(FIELD_LABELS).filter((k) => formatted[k] === "");
        setMissing(missingFields);
        setCalculated(true);

        if (missingFields.length > 0) {
            setGlobalMessage({
                type: "info",
                text: "Calculated successfully, but some fields couldn't be derived from the given inputs.",
            });
        } else {
            setGlobalMessage({ type: "info", text: "✅ All fields calculated successfully." });
        }
    }

    function deriveIterative(initial, editedField) {
        const v = { ...initial };
        let changed = true;
        let iter = 0;

        while (changed && iter++ < 40) {
            changed = false;

            // SL % from SL Price
            if (
                editedField !== "slPercent" &&
                v.entryPrice != null && v.slPrice != null && v.entryPrice > EPS
            ) {
                const slPercent = ((v.entryPrice - v.slPrice) / v.entryPrice) * 100;
                if (Math.abs(slPercent - (v.slPercent ?? 0)) > EPS) { v.slPercent = slPercent; changed = true; }
            }

            // SL Price from SL %
            if (editedField !== "slPrice" && v.entryPrice != null && v.slPercent != null) {
                const slPrice = v.entryPrice * (1 - v.slPercent / 100);
                if (Math.abs(slPrice - (v.slPrice ?? 0)) > EPS) { v.slPrice = slPrice; changed = true; }
            }

            // Derive SL Price from entryPrice + riskAmount + quantity (floored integer)
            if (
                editedField !== "slPrice" && editedField !== "slPercent" &&
                v.slPrice == null && v.slPercent == null &&
                v.entryPrice != null && v.riskAmount != null
            ) {
                const qty = v.quantity != null ? Math.floor(v.quantity) : null;
                if (qty != null && qty > EPS) {
                    const slPrice = v.entryPrice - (v.riskAmount / qty);
                    if (slPrice > 0 && Math.abs(slPrice - (v.slPrice ?? 0)) > EPS) {
                        v.slPrice = slPrice;
                        changed = true;
                    }
                }
            }

            // Target % from Target Price
            if (
                editedField !== "targetPercent" &&
                v.entryPrice != null && v.targetPrice != null && v.entryPrice > EPS
            ) {
                const targetPercent = ((v.targetPrice - v.entryPrice) / v.entryPrice) * 100;
                if (Math.abs(targetPercent - (v.targetPercent ?? 0)) > EPS) { v.targetPercent = targetPercent; changed = true; }
            }

            // Target Price from Target %
            if (editedField !== "targetPrice" && v.entryPrice != null && v.targetPercent != null) {
                const targetPrice = v.entryPrice * (1 + v.targetPercent / 100);
                if (Math.abs(targetPrice - (v.targetPrice ?? 0)) > EPS) { v.targetPrice = targetPrice; changed = true; }
            }

            // Quantity (always floor to integer)
            if (editedField !== "quantity") {
                let derivedQty = null;
                if (
                    editedField === "positionAmount" &&
                    v.positionAmount != null && v.entryPrice != null && Math.abs(v.entryPrice) > EPS
                ) {
                    derivedQty = Math.floor(v.positionAmount / v.entryPrice);
                } else if (
                    editedField !== "positionAmount" &&
                    v.riskAmount != null && v.slPrice != null && v.entryPrice != null
                ) {
                    const denom = Math.abs(v.entryPrice - v.slPrice);
                    if (denom > EPS) derivedQty = Math.floor(v.riskAmount / denom);
                } else if (
                    editedField !== "positionAmount" &&
                    v.positionAmount != null && v.entryPrice != null && Math.abs(v.entryPrice) > EPS
                ) {
                    derivedQty = Math.floor(v.positionAmount / v.entryPrice);
                }
                if (derivedQty != null && derivedQty !== (v.quantity ?? -1)) {
                    v.quantity = derivedQty; changed = true;
                }
            }
            // Always ensure quantity stored as integer (floor) even if set by other paths
            if (v.quantity != null && v.quantity !== Math.floor(v.quantity)) {
                v.quantity = Math.floor(v.quantity); changed = true;
            }

            // Position Amount from Quantity (use floored quantity)
            if (editedField !== "positionAmount" && v.quantity != null && v.entryPrice != null) {
                const qty = Math.floor(v.quantity);
                const pos = qty * v.entryPrice;
                if (Math.abs(pos - (v.positionAmount ?? 0)) > EPS) { v.positionAmount = pos; changed = true; }
            }

            // Risk Amount from Quantity (use floored quantity)
            if (
                editedField !== "riskAmount" &&
                v.quantity != null && v.entryPrice != null && v.slPrice != null
            ) {
                const qty = Math.floor(v.quantity);
                const ra = Math.abs(v.entryPrice - v.slPrice) * qty;
                if (Math.abs(ra - (v.riskAmount ?? 0)) > EPS) { v.riskAmount = ra; changed = true; }
            }

            // Risk : Reward → derive R:R from prices
            if (v.entryPrice != null && v.slPrice != null && v.targetPrice != null) {
                const denom = Math.abs(v.entryPrice - v.slPrice);
                if (denom > EPS) {
                    const rr = (v.targetPrice - v.entryPrice) / denom;
                    if (Math.abs(rr - (v.riskReward ?? 0)) > EPS) { v.riskReward = rr; changed = true; }
                }
            }

            // Target Price from R:R + Entry + SL (reverse R:R derivation)
            if (
                editedField !== "targetPrice" && editedField !== "targetPercent" &&
                v.targetPrice == null && v.targetPercent == null &&
                v.riskReward != null && v.entryPrice != null && v.slPrice != null
            ) {
                const slDiff = Math.abs(v.entryPrice - v.slPrice);
                if (slDiff > EPS) {
                    const targetPrice = v.entryPrice + v.riskReward * slDiff;
                    if (targetPrice > v.entryPrice && Math.abs(targetPrice - (v.targetPrice ?? 0)) > EPS) {
                        v.targetPrice = targetPrice;
                        changed = true;
                    }
                }
            }

            // Profit Amount from Quantity (use floored quantity)
            if (
                editedField !== "profitAmount" &&
                v.quantity != null && v.entryPrice != null && v.targetPrice != null
            ) {
                const qty = Math.floor(v.quantity);
                const p = (v.targetPrice - v.entryPrice) * qty;
                if (Math.abs(p - (v.profitAmount ?? 0)) > EPS) { v.profitAmount = p; changed = true; }
            }
        }

        return v;
    }

    const userFilledCount = useMemo(
        () => Object.keys(vals).filter((k) => vals[k] !== "").length,
        [vals]
    );

    const hasVisuals =
        calculated &&
        (vals.riskReward !== "" ||
            (vals.entryPrice !== "" && vals.slPrice !== "" && vals.targetPrice !== ""));

    return (
        <ScrollView style={[styles.container, activeTheme.container]}>
            <View ref={captureViewRef} collapsable={false} style={activeTheme.container}>

                {/* ── Header ── */}
                <View style={styles.header}>
                    <Text style={[styles.title, activeTheme.title]}>
                        Universal Trading Calc
                    </Text>
                    <View style={styles.headerButtons}>
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
                                    (errors[key] || missing.includes(key)) ? styles.missing : null,
                                ]}
                                keyboardType={key === "riskReward" ? "default" : "numeric"}
                                value={vals[key]}
                                placeholder={key === "riskReward" ? "e.g. 2 or 1:2" : FIELD_LABELS[key]}
                                placeholderTextColor={activeTheme.placeholder.color}
                                onChangeText={(t) => setInput(key, t)}
                            />
                            {errors[key] && (
                                <Text style={styles.error}>{errors[key]}</Text>
                            )}
                        </View>
                    ))}
                </View>

                {/* ── Calculate Button ── */}
                <TouchableOpacity
                    style={[actionStyles.calculateButton, activeTheme.toggle]}
                    onPress={handleCalculate}
                    activeOpacity={0.75}
                >
                    <Text style={[actionStyles.calculateButtonText, activeTheme.label]}>
                        🧮 Calculate
                    </Text>
                </TouchableOpacity>

                {/* ── Global message (success / error / info) ── */}
                {globalMessage && (
                    <View
                        style={[
                            styles.missingBox,
                            globalMessage.type === "error"
                                ? { backgroundColor: "#ffecec" }
                                : activeTheme.missingBox,
                        ]}
                    >
                        <Text
                            style={[
                                styles.missingItem,
                                { color: globalMessage.type === "error" ? "#CC0000" : activeTheme.label.color },
                            ]}
                        >
                            {globalMessage.text}
                        </Text>
                    </View>
                )}

                {/* ── Visual Analysis Section ── */}
                {hasVisuals && (
                    <View style={visualStyles.section}>
                        <Text style={[visualStyles.sectionTitle, activeTheme.label]}>
                            📊 Analysis
                        </Text>

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

                        <PriceLadder
                            entryPrice={vals.entryPrice}
                            slPrice={vals.slPrice}
                            targetPrice={vals.targetPrice}
                            theme={theme}
                        />
                    </View>
                )}

                {/* ── Missing fields warning (after calculation) ── */}
                {calculated && missing.length > 0 && (
                    <View style={[styles.missingBox, activeTheme.missingBox]}>
                        <Text style={[styles.missingTitle, activeTheme.label]}>
                            Could Not Calculate:
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


                <View style={{ height: 16 }} />
            </View>

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
    calculateButton: {
        marginTop: 4,
        padding: 14,
        borderRadius: 10,
        alignItems: "center",
    },
    calculateButtonText: {
        fontSize: 16,
        fontWeight: "700",
    },

});
