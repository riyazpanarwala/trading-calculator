import { StyleSheet } from "react-native";

export const lightTheme = {
    container: { backgroundColor: "#FFFFFF" },
    title: { color: "#000" },
    label: { color: "#000" },
    placeholder: { color: "#999" },
    input: { color: "#000", backgroundColor: "#F3F3F3" },
    missingBox: { backgroundColor: "#ffecec" },
    toggle: { backgroundColor: "#e0e0e0" },
};

export const darkTheme = {
    container: { backgroundColor: "#000000" },
    title: { color: "#FFF" },
    label: { color: "#FFF" },
    placeholder: { color: "#AAA" },
    input: { color: "#FFF", backgroundColor: "#222" },
    missingBox: { backgroundColor: "#331111" },
    toggle: { backgroundColor: "#333" },
};

export default StyleSheet.create({
    container: { flex: 1, padding: 20 },

    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 20,
    },

    title: {
        fontSize: 22,
        fontWeight: "700",
    },

    themeToggle: {
        padding: 10,
        borderRadius: 8,
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
