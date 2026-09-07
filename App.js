import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, Platform } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import CalculatorScreen from "./src/components/CalculatorScreen";
import SipCalculatorScreen from "./src/components/SipCalculatorScreen";
import SwpCalculatorScreen from "./src/components/SwpCalculatorScreen";
import StockAverageScreen from "./src/components/StockAverageScreen";
import BrokerageCalculatorScreen from "./src/components/BrokerageCalculatorScreen";
import GoalCalculatorScreen from "./src/components/GoalCalculatorScreen";
import LoanCalculatorScreen from "./src/components/LoanCalculatorScreen";
import styles, { lightTheme, darkTheme } from "./src/components/styles";
import { ScrollView } from "react-native";

export default function App() {
  const [activeTab, setActiveTab] = useState("trading");
  const [theme, setTheme] = useState("dark"); // Default modern dark

  const activeTheme = theme === "light" ? lightTheme : darkTheme;

  // Ensure sleek, modern scrollbar matching the theme on web
  useEffect(() => {
    if (Platform.OS === "web" && typeof document !== "undefined") {
      const styleId = "trading-calc-scrollbar";
      let styleTag = document.getElementById(styleId);
      if (!styleTag) {
        styleTag = document.createElement("style");
        styleTag.id = styleId;
        document.head.appendChild(styleTag);
      }
      styleTag.innerHTML = `
        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        ::-webkit-scrollbar-track {
          background: ${theme === "dark" ? "#090D16" : "#F8FAFC"};
        }
        ::-webkit-scrollbar-thumb {
          background: ${theme === "dark" ? "#334155" : "#CBD5E1"};
          border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: ${theme === "dark" ? "#475569" : "#94A3B8"};
        }
      `;
    }
  }, [theme]);

  const appContent = (
    <View style={[{ flex: 1 }, activeTheme.container]}>
      <StatusBar style={theme === "dark" ? "light" : "dark"} />

        {/* ── Top Navigation Tabs (Centered with maxWidth: 720, full-width parent) ── */}
        <View style={{ width: "100%", paddingHorizontal: 16, paddingTop: 12 }}>
          <View style={{ width: "100%", maxWidth: 720, alignSelf: "center" }}>
            <View style={[styles.tabBar, activeTheme.tabBarBg, { borderColor: activeTheme.borderColor }]}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ flexDirection: "row", minWidth: "100%" }}
              >
                <TouchableOpacity
                  style={[
                    styles.tabButton,
                    activeTab === "trading" ? activeTheme.tabActive : activeTheme.tabInactive,
                    { paddingHorizontal: 10, minWidth: 70 },
                  ]}
                  onPress={() => setActiveTab("trading")}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.tabButtonText,
                      activeTab === "trading"
                        ? activeTheme.tabActiveText
                        : activeTheme.tabInactiveText,
                    ]}
                    numberOfLines={1}
                  >
                    📈 Trading
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.tabButton,
                    activeTab === "sip" ? activeTheme.tabActive : activeTheme.tabInactive,
                    { paddingHorizontal: 10, minWidth: 70 },
                  ]}
                  onPress={() => setActiveTab("sip")}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.tabButtonText,
                      activeTab === "sip"
                        ? activeTheme.tabActiveText
                        : activeTheme.tabInactiveText,
                    ]}
                    numberOfLines={1}
                  >
                    💰 SIP
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.tabButton,
                    activeTab === "swp" ? activeTheme.tabActive : activeTheme.tabInactive,
                    { paddingHorizontal: 10, minWidth: 70 },
                  ]}
                  onPress={() => setActiveTab("swp")}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.tabButtonText,
                      activeTab === "swp"
                        ? activeTheme.tabActiveText
                        : activeTheme.tabInactiveText,
                    ]}
                    numberOfLines={1}
                  >
                    🏖️ SWP
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.tabButton,
                    activeTab === "average" ? activeTheme.tabActive : activeTheme.tabInactive,
                    { paddingHorizontal: 10, minWidth: 70 },
                  ]}
                  onPress={() => setActiveTab("average")}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.tabButtonText,
                      activeTab === "average"
                        ? activeTheme.tabActiveText
                        : activeTheme.tabInactiveText,
                    ]}
                    numberOfLines={1}
                  >
                    🔄 Average
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.tabButton,
                    activeTab === "brokerage" ? activeTheme.tabActive : activeTheme.tabInactive,
                    { paddingHorizontal: 10, minWidth: 70 },
                  ]}
                  onPress={() => setActiveTab("brokerage")}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.tabButtonText,
                      activeTab === "brokerage"
                        ? activeTheme.tabActiveText
                        : activeTheme.tabInactiveText,
                    ]}
                    numberOfLines={1}
                  >
                    🏦 Brokerage
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.tabButton,
                    activeTab === "goal" ? activeTheme.tabActive : activeTheme.tabInactive,
                    { paddingHorizontal: 10, minWidth: 70 },
                  ]}
                  onPress={() => setActiveTab("goal")}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.tabButtonText,
                      activeTab === "goal"
                        ? activeTheme.tabActiveText
                        : activeTheme.tabInactiveText,
                    ]}
                    numberOfLines={1}
                  >
                    🎯 Goal
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.tabButton,
                    activeTab === "loan" ? activeTheme.tabActive : activeTheme.tabInactive,
                    { paddingHorizontal: 10, minWidth: 70 },
                  ]}
                  onPress={() => setActiveTab("loan")}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.tabButtonText,
                      activeTab === "loan"
                        ? activeTheme.tabActiveText
                        : activeTheme.tabInactiveText,
                    ]}
                    numberOfLines={1}
                  >
                    🏠 Loan
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </View>

        {/* ── Screens: FULL WIDTH (width: '100%') so ScrollView spans to browser window edges ── */}
        <View style={{ flex: 1, width: "100%", display: activeTab === "trading" ? "flex" : "none" }}>
          <CalculatorScreen theme={theme} setTheme={setTheme} />
        </View>
        <View style={{ flex: 1, width: "100%", display: activeTab === "sip" ? "flex" : "none" }}>
          <SipCalculatorScreen theme={theme} setTheme={setTheme} />
        </View>
        <View style={{ flex: 1, width: "100%", display: activeTab === "swp" ? "flex" : "none" }}>
          <SwpCalculatorScreen theme={theme} setTheme={setTheme} />
        </View>
        <View style={{ flex: 1, width: "100%", display: activeTab === "average" ? "flex" : "none" }}>
          <StockAverageScreen theme={theme} setTheme={setTheme} />
        </View>
        <View style={{ flex: 1, width: "100%", display: activeTab === "brokerage" ? "flex" : "none" }}>
          <BrokerageCalculatorScreen theme={theme} setTheme={setTheme} />
        </View>
        <View style={{ flex: 1, width: "100%", display: activeTab === "goal" ? "flex" : "none" }}>
          <GoalCalculatorScreen theme={theme} setTheme={setTheme} />
        </View>
        <View style={{ flex: 1, width: "100%", display: activeTab === "loan" ? "flex" : "none" }}>
          <LoanCalculatorScreen theme={theme} setTheme={setTheme} />
        </View>
    </View>
  );

  if (Platform.OS === "web") {
    return appContent;
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
        {appContent}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
