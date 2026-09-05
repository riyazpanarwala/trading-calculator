import { StyleSheet } from "react-native";

export const lightTheme = {
    container:      { backgroundColor: "#FFFFFF" },
    title:          { color: "#000000" },
    label:          { color: "#000000" },
    placeholder:    { color: "#8E8E93" },
    input:          { color: "#000000", backgroundColor: "#F2F2F7" },
    missingBox:     { backgroundColor: "#ffecec" },
    toggle:         { backgroundColor: "#E5E5EA" },
    card:           { backgroundColor: "#F8F9FA" },
    tabBarBg:       { backgroundColor: "#EFEFF4" },
    tabActive:      { backgroundColor: "#007AFF" },
    tabActiveText:  { color: "#FFFFFF" },
    tabInactive:    { backgroundColor: "transparent" },
    tabInactiveText:{ color: "#636366" },
    borderColor:    "#E5E5EA",
    tableHeaderBg:  "#EFEFF4",
    investedColor:  "#007AFF",
    returnsColor:   "#34C759",
    totalColor:     "#1C1C1E",
    subtext:        { color: "#8E8E93" },
};

export const darkTheme = {
    container:      { backgroundColor: "#000000" },
    title:          { color: "#FFFFFF" },
    label:          { color: "#FFFFFF" },
    placeholder:    { color: "#8E8E93" },
    input:          { color: "#FFFFFF", backgroundColor: "#1C1C1E" },
    missingBox:     { backgroundColor: "#331111" },
    toggle:         { backgroundColor: "#2C2C2E" },
    card:           { backgroundColor: "#1C1C1E" },
    tabBarBg:       { backgroundColor: "#1C1C1E" },
    tabActive:      { backgroundColor: "#0A84FF" },
    tabActiveText:  { color: "#FFFFFF" },
    tabInactive:    { backgroundColor: "transparent" },
    tabInactiveText:{ color: "#8E8E93" },
    borderColor:    "#2C2C2E",
    tableHeaderBg:  "#2C2C2E",
    investedColor:  "#0A84FF",
    returnsColor:   "#30D158",
    totalColor:     "#FFFFFF",
    subtext:        { color: "#8E8E93" },
};

export default StyleSheet.create({
    container: { flex: 1, padding: 16 },

    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 20,
        flexWrap: "wrap",
        rowGap: 8,
        columnGap: 8,
    },

    title: {
        fontSize: 18,
        fontWeight: "700",
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
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
        alignItems: "center",
        justifyContent: "center",
    },

    grid: {
        width: "100%",
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "space-between",
    },

    col: {
        width: "48%",
        marginBottom: 16,
    },

    row: { marginBottom: 16 },

    label: { fontSize: 16, marginBottom: 5 },

    input: {
        padding: 12,
        borderRadius: 8,
        fontSize: 16,
    },

    error: {
        color: "red",
        marginTop: 4,
        fontSize: 12,
    },

    missing: {
        borderWidth: 1,
        borderColor: "orange",
    },

    missingBox: {
        padding: 15,
        borderRadius: 10,
        marginTop: 20,
    },

    missingTitle: {
        fontWeight: "600",
        marginBottom: 10,
    },

    missingItem: {
        fontSize: 14,
        marginVertical: 2,
    },

    summary: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 30,
    },

    summaryLabel: { fontSize: 18, fontWeight: "600" },

    summaryValue: { fontSize: 18, fontWeight: "600" },

    /* ── Tab Switcher ── */
    tabBar: {
        flexDirection: "row",
        borderRadius: 12,
        padding: 4,
        marginBottom: 20,
    },

    tabButton: {
        flex: 1,
        paddingVertical: 10,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 9,
    },

    tabButtonText: {
        fontSize: 14,
        fontWeight: "700",
    },

    /* ── SIP Cards & Layout ── */
    fullCol: {
        width: "100%",
        marginBottom: 16,
    },

    sipTypeToggleRow: {
        flexDirection: "row",
        gap: 8,
        marginBottom: 16,
    },

    sipTypeButton: {
        flex: 1,
        paddingVertical: 8,
        borderRadius: 8,
        alignItems: "center",
        justifyContent: "center",
    },

    sipTypeText: {
        fontSize: 13,
        fontWeight: "600",
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
        borderRadius: 14,
    },

    chipText: {
        fontSize: 12,
        fontWeight: "600",
    },

    metricCard: {
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
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
        fontSize: 14,
        fontWeight: "500",
    },

    metricValue: {
        fontSize: 16,
        fontWeight: "700",
    },

    totalMetricLabel: {
        fontSize: 16,
        fontWeight: "700",
    },

    totalMetricValue: {
        fontSize: 20,
        fontWeight: "800",
    },

    /* ── Milestone Table ── */
    tableCard: {
        borderRadius: 12,
        padding: 14,
        marginTop: 16,
        marginBottom: 16,
    },

    tableTitle: {
        fontSize: 15,
        fontWeight: "700",
        marginBottom: 10,
    },

    tableHeader: {
        flexDirection: "row",
        paddingVertical: 8,
        paddingHorizontal: 6,
        borderRadius: 6,
    },

    tableHeaderCell: {
        flex: 1,
        fontSize: 12,
        fontWeight: "700",
        textAlign: "right",
    },

    tableRow: {
        flexDirection: "row",
        paddingVertical: 8,
        paddingHorizontal: 6,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },

    tableCell: {
        flex: 1,
        fontSize: 12,
        fontWeight: "500",
        textAlign: "right",
    },
});

