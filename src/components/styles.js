import { StyleSheet } from "react-native";

export const lightTheme = {
    container:  { backgroundColor: "#FFFFFF" },
    title:      { color: "#000" },
    label:      { color: "#000" },
    placeholder:{ color: "#999" },
    input:      { color: "#000", backgroundColor: "#F3F3F3" },
    missingBox: { backgroundColor: "#ffecec" },
    toggle:     { backgroundColor: "#e0e0e0" },
    card:       { backgroundColor: "#F3F3F3" },
};

export const darkTheme = {
    container:  { backgroundColor: "#000000" },
    title:      { color: "#FFF" },
    label:      { color: "#FFF" },
    placeholder:{ color: "#AAA" },
    input:      { color: "#FFF", backgroundColor: "#222" },
    missingBox: { backgroundColor: "#331111" },
    toggle:     { backgroundColor: "#333" },
    card:       { backgroundColor: "#1C1C1E" },
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
});
