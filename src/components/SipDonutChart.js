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
    const strokeWidth = 16;
    const radius = (size - strokeWidth) / 2; // (160 - 16) / 2 = 72
    const center = size / 2;
    const circumference = 2 * Math.PI * radius;

    const investedLength = hasData ? (investedPct / 100) * circumference : 0;
    const returnsLength = hasData ? (returnsPct / 100) * circumference : 0;

    const investedColor = activeTheme.investedColor || "#2563EB";
    const returnsColor = activeTheme.returnsColor || "#10B981";
    const baseCircleColor = theme === "light" ? "#E2E8F0" : "#1E293B";

    return (
        <View style={[chartStyles.card, activeTheme.card, { borderColor: activeTheme.borderColor }]}>
            <Text style={[chartStyles.title, activeTheme.title]}>
                📊 Investment Breakdown
            </Text>

            <View style={chartStyles.contentRow}>
                {/* ── Donut Graphic ── */}
                <View style={chartStyles.chartContainer}>
                    <Svg width={size} height={size}>
                        <G transform={`rotate(-90 ${center} ${center})`}>
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
                            y={center - 3}
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
        borderRadius: 14,
        borderWidth: 1,
        padding: 16,
        marginBottom: 16,
    },
    title: {
        fontSize: 14,
        fontWeight: "700",
        marginBottom: 14,
        letterSpacing: -0.2,
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
        width: 10,
        height: 10,
        borderRadius: 5,
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
