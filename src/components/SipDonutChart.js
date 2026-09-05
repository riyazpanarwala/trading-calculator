import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Svg, { Circle, G, Text as SvgText } from "react-native-svg";
import { formatCurrency, formatCompactCurrency } from "../utils/sipCalculations";
import { lightTheme, darkTheme } from "./styles";

/**
 * Visual Donut Chart for SIP Investment vs Returns Breakdown
 */
export default function SipDonutChart({ totalInvested, estimatedReturns, maturityValue, theme }) {
    const activeTheme = theme === "light" ? lightTheme : darkTheme;

    const total = maturityValue > 0 ? maturityValue : (totalInvested + estimatedReturns);
    const hasData = total > 0;

    const investedPct = hasData ? (totalInvested / total) * 100 : 50;
    const returnsPct = hasData ? (estimatedReturns / total) * 100 : 50;

    // SVG Geometry
    const size = 160;
    const strokeWidth = 18;
    const radius = (size - strokeWidth) / 2; // (160 - 18) / 2 = 71
    const center = size / 2;
    const circumference = 2 * Math.PI * radius;

    const investedLength = hasData ? (investedPct / 100) * circumference : 0;
    const returnsLength = hasData ? (returnsPct / 100) * circumference : 0;

    const investedColor = activeTheme.investedColor || "#007AFF";
    const returnsColor = activeTheme.returnsColor || "#34C759";
    const baseCircleColor = theme === "light" ? "#E5E5EA" : "#2C2C2E";

    return (
        <View style={[chartStyles.card, activeTheme.card]}>
            <Text style={[chartStyles.title, activeTheme.label]}>
                📊 Investment Breakdown
            </Text>

            <View style={chartStyles.contentRow}>
                {/* ── Donut Graphic ── */}
                <View style={chartStyles.chartContainer}>
                    <Svg width={size} height={size}>
                        <G rotation="-90" origin={`${center}, ${center}`}>
                            {/* Base Background Track */}
                            <Circle
                                cx={center}
                                cy={center}
                                r={radius}
                                stroke={baseCircleColor}
                                strokeWidth={strokeWidth}
                                fill="none"
                            />

                            {hasData && (
                                <>
                                    {/* Invested Segment */}
                                    <Circle
                                        cx={center}
                                        cy={center}
                                        r={radius}
                                        stroke={investedColor}
                                        strokeWidth={strokeWidth}
                                        strokeDasharray={`${investedLength} ${circumference}`}
                                        strokeDashoffset={0}
                                        strokeLinecap="round"
                                        fill="none"
                                    />
                                    {/* Returns Segment */}
                                    <Circle
                                        cx={center}
                                        cy={center}
                                        r={radius}
                                        stroke={returnsColor}
                                        strokeWidth={strokeWidth}
                                        strokeDasharray={`${returnsLength} ${circumference}`}
                                        strokeDashoffset={-investedLength}
                                        strokeLinecap="round"
                                        fill="none"
                                    />
                                </>
                            )}
                        </G>

                        {/* Center Value */}
                        <SvgText
                            x={center}
                            y={center - 4}
                            textAnchor="middle"
                            fontSize={15}
                            fontWeight="800"
                            fill={activeTheme.totalColor || activeTheme.label.color}
                        >
                            {hasData ? formatCompactCurrency(total) : "₹0"}
                        </SvgText>
                        <SvgText
                            x={center}
                            y={center + 14}
                            textAnchor="middle"
                            fontSize={10}
                            fontWeight="600"
                            fill={activeTheme.subtext.color}
                        >
                            Total Value
                        </SvgText>
                    </Svg>
                </View>

                {/* ── Legend & Breakdown ── */}
                <View style={chartStyles.legendContainer}>
                    <View style={chartStyles.legendItem}>
                        <View style={[chartStyles.indicator, { backgroundColor: investedColor }]} />
                        <View style={chartStyles.legendTextCol}>
                            <Text style={[chartStyles.legendLabel, activeTheme.subtext]}>
                                Invested ({hasData ? investedPct.toFixed(1) : 0}%)
                            </Text>
                            <Text style={[chartStyles.legendValue, { color: investedColor }]}>
                                {formatCurrency(totalInvested)}
                            </Text>
                        </View>
                    </View>

                    <View style={chartStyles.legendItem}>
                        <View style={[chartStyles.indicator, { backgroundColor: returnsColor }]} />
                        <View style={chartStyles.legendTextCol}>
                            <Text style={[chartStyles.legendLabel, activeTheme.subtext]}>
                                Est. Returns ({hasData ? returnsPct.toFixed(1) : 0}%)
                            </Text>
                            <Text style={[chartStyles.legendValue, { color: returnsColor }]}>
                                {formatCurrency(estimatedReturns)}
                            </Text>
                        </View>
                    </View>
                </View>
            </View>
        </View>
    );
}

const chartStyles = StyleSheet.create({
    card: {
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
    },
    title: {
        fontSize: 15,
        fontWeight: "700",
        marginBottom: 14,
    },
    contentRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-around",
        flexWrap: "wrap",
        gap: 16,
    },
    chartContainer: {
        alignItems: "center",
        justifyContent: "center",
    },
    legendContainer: {
        flex: 1,
        minWidth: 140,
        gap: 12,
        justifyContent: "center",
    },
    legendItem: {
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 10,
    },
    indicator: {
        width: 12,
        height: 12,
        borderRadius: 6,
        marginTop: 4,
    },
    legendTextCol: {
        flex: 1,
    },
    legendLabel: {
        fontSize: 12,
        fontWeight: "500",
        marginBottom: 2,
    },
    legendValue: {
        fontSize: 15,
        fontWeight: "700",
    },
});
