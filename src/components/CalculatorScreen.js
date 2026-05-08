import React, { useState, useMemo } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
} from "react-native";
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

export default function CalculatorScreen() {
    const [theme, setTheme] = useState("light");
    const [vals, setVals] = useState(
        Object.keys(FIELD_LABELS).reduce((acc, k) => ({ ...acc, [k]: "" }), {})
    );
    const [errors, setErrors] = useState({});

    const activeTheme = theme === "light" ? lightTheme : darkTheme;

    const toNum = (s) => {
        if (s === null || s === undefined || s === "") return null;
        const n = Number(String(s).replace(/,/g, ""));
        return Number.isFinite(n) ? n : null;
    };

    function setInput(field, rawValue) {
        // Block negative sign entirely
        if (rawValue.includes("-")) {
            rawValue = rawValue.replace(/-/g, "");
        }

        const numVal = toNum(rawValue);

        // Negative validation
        if (
            numVal != null &&
            [
                "entryPrice",
                "slPrice",
                "targetPrice",
                "positionAmount",
                "quantity",
                "riskAmount",
                "profitAmount",
                "targetPercent",
            ].includes(field) &&
            numVal < 0
        ) {
            setVals((p) => ({ ...p, [field]: "" }));
            setErrors((p) => ({ ...p, [field]: null }));
            return;
        }

        // SL % validation
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

        // Build a fully numeric snapshot of current values, then apply the new edit
        const numericVals = {};
        for (const k of Object.keys(FIELD_LABELS)) {
            numericVals[k] = k === field ? numVal : toNum(vals[k]);
        }

        const derived = deriveIterative(numericVals, field);

        // Format derived values back to strings
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

        // Preserve the raw string the user is currently typing so the cursor
        // doesn't jump (e.g. "100." mid-entry stays as "100." not "100")
        formatted[field] = rawValue;

        setVals(formatted);
    }

    function deriveIterative(initial, editedField) {
        const v = { ...initial };
        let changed = true;
        let iter = 0;

        while (changed && iter++ < 40) {
            changed = false;

            // ── SL Price ↔ SL % ────────────────────────────────────────────────

            // Derive SL% from SL Price (only when user didn't type SL%)
            if (
                editedField !== "slPercent" &&
                v.entryPrice != null &&
                v.slPrice != null &&
                v.entryPrice > EPS
            ) {
                const slPercent = ((v.entryPrice - v.slPrice) / v.entryPrice) * 100;
                if (Math.abs(slPercent - (v.slPercent ?? 0)) > EPS) {
                    v.slPercent = slPercent;
                    changed = true;
                }
            }

            // Derive SL Price from SL% (only when user didn't type SL Price)
            if (
                editedField !== "slPrice" &&
                v.entryPrice != null &&
                v.slPercent != null
            ) {
                const slPrice = v.entryPrice * (1 - v.slPercent / 100);
                if (Math.abs(slPrice - (v.slPrice ?? 0)) > EPS) {
                    v.slPrice = slPrice;
                    changed = true;
                }
            }

            // ── Target Price ↔ Target % ─────────────────────────────────────────

            // Derive Target% from Target Price
            if (
                editedField !== "targetPercent" &&
                v.entryPrice != null &&
                v.targetPrice != null &&
                v.entryPrice > EPS
            ) {
                const targetPercent =
                    ((v.targetPrice - v.entryPrice) / v.entryPrice) * 100;
                if (Math.abs(targetPercent - (v.targetPercent ?? 0)) > EPS) {
                    v.targetPercent = targetPercent;
                    changed = true;
                }
            }

            // Derive Target Price from Target%
            if (
                editedField !== "targetPrice" &&
                v.entryPrice != null &&
                v.targetPercent != null
            ) {
                const targetPrice = v.entryPrice * (1 + v.targetPercent / 100);
                if (Math.abs(targetPrice - (v.targetPrice ?? 0)) > EPS) {
                    v.targetPrice = targetPrice;
                    changed = true;
                }
            }

            // ── Quantity ↔ Position Amount ↔ Risk Amount ────────────────────────

            // FIX: Each derivation path for Quantity must guard the editedField
            // so we don't circularly overwrite the field the user is typing in.

            if (editedField !== "quantity") {
                let derivedQty = null;

                if (
                    editedField === "positionAmount" &&
                    v.positionAmount != null &&
                    v.entryPrice != null &&
                    Math.abs(v.entryPrice) > EPS
                ) {
                    // User typed Position Amount → derive Quantity
                    derivedQty = v.positionAmount / v.entryPrice;
                } else if (
                    editedField !== "positionAmount" &&
                    v.riskAmount != null &&
                    v.slPrice != null &&
                    v.entryPrice != null
                ) {
                    // User typed Risk Amount (or other) → derive Quantity from Risk
                    const denom = Math.abs(v.entryPrice - v.slPrice);
                    if (denom > EPS) {
                        derivedQty = v.riskAmount / denom;
                    }
                } else if (
                    editedField !== "positionAmount" &&
                    v.positionAmount != null &&
                    v.entryPrice != null &&
                    Math.abs(v.entryPrice) > EPS
                ) {
                    // Position Amount already known from a prior iteration → keep qty in sync
                    derivedQty = v.positionAmount / v.entryPrice;
                }

                if (derivedQty != null && Math.abs(derivedQty - (v.quantity ?? 0)) > EPS) {
                    v.quantity = derivedQty;
                    changed = true;
                }
            }

            // FIX: Guard positionAmount so we never overwrite what the user typed
            if (
                editedField !== "positionAmount" &&
                v.quantity != null &&
                v.entryPrice != null
            ) {
                const pos = v.quantity * v.entryPrice;
                if (Math.abs(pos - (v.positionAmount ?? 0)) > EPS) {
                    v.positionAmount = pos;
                    changed = true;
                }
            }

            // Derive Risk Amount from Quantity × (Entry − SL)
            if (
                editedField !== "riskAmount" &&
                v.quantity != null &&
                v.entryPrice != null &&
                v.slPrice != null
            ) {
                const ra = Math.abs(v.entryPrice - v.slPrice) * v.quantity;
                if (Math.abs(ra - (v.riskAmount ?? 0)) > EPS) {
                    v.riskAmount = ra;
                    changed = true;
                }
            }

            // ── Risk : Reward ───────────────────────────────────────────────────
            if (
                v.entryPrice != null &&
                v.slPrice != null &&
                v.targetPrice != null
            ) {
                const denom = Math.abs(v.entryPrice - v.slPrice);
                if (denom > EPS) {
                    const rr = (v.targetPrice - v.entryPrice) / denom;
                    if (Math.abs(rr - (v.riskReward ?? 0)) > EPS) {
                        v.riskReward = rr;
                        changed = true;
                    }
                }
            }

            // ── Profit Amount ───────────────────────────────────────────────────
            if (
                editedField !== "profitAmount" &&
                v.quantity != null &&
                v.entryPrice != null &&
                v.targetPrice != null
            ) {
                const p = (v.targetPrice - v.entryPrice) * v.quantity;
                if (Math.abs(p - (v.profitAmount ?? 0)) > EPS) {
                    v.profitAmount = p;
                    changed = true;
                }
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

    return (
        <ScrollView style={[styles.container, activeTheme.container]}>
            <View style={styles.header}>
                <Text style={[styles.title, activeTheme.title]}>
                    Universal Trading Calc
                </Text>

                <TouchableOpacity
                    style={[styles.themeToggle, activeTheme.toggle]}
                    onPress={() => setTheme((t) => (t === "light" ? "dark" : "light"))}
                >
                    <Text style={{ color: activeTheme.title.color }}>
                        {theme === "light" ? "🌙 Dark" : "☀️ Light"}
                    </Text>
                </TouchableOpacity>
            </View>

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

            <View style={{ height: 50 }} />
        </ScrollView>
    );
}
