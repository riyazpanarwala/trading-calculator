import { StyleSheet, Platform } from "react-native";

export const lightTheme = {
    container:      { backgroundColor: "#F8FAFC" },
    title:          { color: "#0F172A" },
    label:          { color: "#334155" },
    placeholder:    { color: "#94A3B8" },
    input:          { color: "#0F172A", backgroundColor: "#FFFFFF", borderColor: "#E2E8F0" },
    missingBox:     { backgroundColor: "#FEF2F2", borderColor: "#FECACA" },
    toggle:         { backgroundColor: "#F1F5F9", borderColor: "#E2E8F0" },
    card:           { backgroundColor: "#FFFFFF", borderColor: "#E2E8F0" },
    tabBarBg:       { backgroundColor: "#F1F5F9", borderColor: "#E2E8F0" },
    tabActive:      { backgroundColor: "#2563EB" },
    tabActiveText:  { color: "#FFFFFF" },
    tabInactive:    { backgroundColor: "transparent" },
    tabInactiveText:{ color: "#64748B" },
    borderColor:    "#E2E8F0",
    tableHeaderBg:  "#F8FAFC",
    investedColor:  "#2563EB",
    returnsColor:   "#10B981",
    totalColor:     "#0F172A",
    subtext:        { color: "#64748B" },
};

export const darkTheme = {
    container:      { backgroundColor: "#090D16" },
    title:          { color: "#F8FAFC" },
    label:          { color: "#CBD5E1" },
    placeholder:    { color: "#64748B" },
    input:          { color: "#F8FAFC", backgroundColor: "#020617", borderColor: "#1E293B" },
    missingBox:     { backgroundColor: "#1C1117", borderColor: "#451A22" },
    toggle:         { backgroundColor: "#1E293B", borderColor: "#334155" },
    card:           { backgroundColor: "#0F172A", borderColor: "#1E293B" },
    tabBarBg:       { backgroundColor: "#0F172A", borderColor: "#1E293B" },
    tabActive:      { backgroundColor: "#2563EB" },
    tabActiveText:  { color: "#FFFFFF" },
    tabInactive:    { backgroundColor: "transparent" },
    tabInactiveText:{ color: "#94A3B8" },
    borderColor:    "#1E293B",
    tableHeaderBg:  "#1E293B",
    investedColor:  "#3B82F6",
    returnsColor:   "#10B981",
    totalColor:     "#F8FAFC",
    subtext:        { color: "#94A3B8" },
};

export default StyleSheet.create({
    container: {
        flex: 1,
    },

    contentWrapper: {
        width: "100%",
        maxWidth: 720,
        alignSelf: "center",
        paddingHorizontal: 16,
        paddingBottom: 40,
    },

    cardWrapper: {
        borderRadius: 16,
        borderWidth: 1,
        padding: 18,
        marginBottom: 16,
        ...Platform.select({
            web: {
                boxShadow: "0 4px 20px -2px rgba(0,0,0,0.06)",
            },
            default: {
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.08,
                shadowRadius: 8,
                elevation: 3,
            },
        }),
    },

    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 18,
        paddingBottom: 14,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: "rgba(148, 163, 184, 0.2)",
        flexWrap: "wrap",
        rowGap: 8,
        columnGap: 8,
    },

    title: {
        fontSize: 18,
        fontWeight: "800",
        letterSpacing: -0.3,
        flexShrink: 1,
        flexGrow: 1,
        minWidth: 160,
    },

    headerButtons: {
        flexDirection: "row",
        gap: 8,
        flexShrink: 0,
    },

    themeToggle: {
        paddingVertical: 7,
        paddingHorizontal: 12,
        borderRadius: 10,
        borderWidth: 1,
        alignItems: "center",
        justifyContent: "center",
    },

    themeToggleText: {
        fontSize: 12,
        fontWeight: "600",
    },

    grid: {
        width: "100%",
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "space-between",
    },

    col: {
        width: "48%",
        marginBottom: 14,
    },

    row: { marginBottom: 14 },

    label: {
        fontSize: 12,
        fontWeight: "600",
        letterSpacing: 0.1,
        marginBottom: 6,
    },

    input: {
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 10,
        borderWidth: 1,
        fontSize: 15,
        fontWeight: "600",
    },

    error: {
        color: "#EF4444",
        marginTop: 4,
        fontSize: 11,
        fontWeight: "500",
    },

    missing: {
        borderColor: "#F59E0B",
        borderWidth: 1.5,
    },

    missingBox: {
        padding: 14,
        borderRadius: 12,
        borderWidth: 1,
        marginTop: 14,
        marginBottom: 14,
    },

    missingTitle: {
        fontWeight: "700",
        fontSize: 13,
        marginBottom: 6,
    },

    missingItem: {
        fontSize: 12,
        marginVertical: 2,
        fontWeight: "500",
    },

    summary: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingTop: 14,
        marginTop: 6,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: "rgba(148, 163, 184, 0.2)",
    },

    summaryLabel: {
        fontSize: 13,
        fontWeight: "600",
        opacity: 0.8,
    },

    summaryValue: {
        fontSize: 13,
        fontWeight: "700",
    },

    /* ── Tab Switcher ── */
    tabBar: {
        flexDirection: "row",
        borderRadius: 14,
        borderWidth: 1,
        padding: 4,
        marginBottom: 16,
    },

    tabButton: {
        flex: 1,
        paddingVertical: 10,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 10,
    },

    tabButtonText: {
        fontSize: 13,
        fontWeight: "700",
        letterSpacing: -0.2,
    },

    /* ── SIP Cards & Layout ── */
    fullCol: {
        width: "100%",
        marginBottom: 14,
    },

    sipTypeToggleRow: {
        flexDirection: "row",
        gap: 8,
        marginBottom: 16,
    },

    sipTypeButton: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 10,
        borderWidth: 1,
        alignItems: "center",
        justifyContent: "center",
    },

    sipTypeText: {
        fontSize: 13,
        fontWeight: "700",
    },

    chipRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 6,
        marginTop: 8,
    },

    chip: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 10,
        borderWidth: 1,
    },

    chipText: {
        fontSize: 12,
        fontWeight: "700",
    },

    metricCard: {
        borderRadius: 14,
        borderWidth: 1,
        padding: 16,
        marginBottom: 16,
    },

    metricRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 8,
    },

    metricDivider: {
        height: StyleSheet.hairlineWidth,
        marginVertical: 4,
    },

    metricLabel: {
        fontSize: 13,
        fontWeight: "600",
    },

    metricValue: {
        fontSize: 16,
        fontWeight: "700",
    },

    totalMetricLabel: {
        fontSize: 15,
        fontWeight: "800",
        letterSpacing: -0.2,
    },

    totalMetricValue: {
        fontSize: 21,
        fontWeight: "800",
        letterSpacing: -0.3,
    },

    /* ── Milestone Table ── */
    tableCard: {
        borderRadius: 14,
        borderWidth: 1,
        padding: 14,
        marginBottom: 16,
    },

    tableTitle: {
        fontSize: 14,
        fontWeight: "700",
        marginBottom: 10,
        letterSpacing: -0.2,
    },

    tableHeader: {
        flexDirection: "row",
        paddingVertical: 8,
        paddingHorizontal: 8,
        borderRadius: 8,
    },

    tableHeaderCell: {
        flex: 1,
        fontSize: 11,
        fontWeight: "700",
        textAlign: "right",
        textTransform: "uppercase",
        letterSpacing: 0.4,
    },

    tableRow: {
        flexDirection: "row",
        paddingVertical: 9,
        paddingHorizontal: 8,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },

    tableCell: {
        flex: 1,
        fontSize: 12,
        fontWeight: "600",
        textAlign: "right",
    },
});
