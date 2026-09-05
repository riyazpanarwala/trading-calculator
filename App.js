import React, { useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import CalculatorScreen from "./src/components/CalculatorScreen";
import SipCalculatorScreen from "./src/components/SipCalculatorScreen";
import styles, { lightTheme, darkTheme } from "./src/components/styles";

export default function App() {
  const [activeTab, setActiveTab] = useState("trading");
  const [theme, setTheme] = useState("dark"); // Default modern dark

  const activeTheme = theme === "light" ? lightTheme : darkTheme;

  return (
    <SafeAreaProvider edges={["top", "bottom"]}>
      <SafeAreaView style={[{ flex: 1 }, activeTheme.container]}>
        <StatusBar style={theme === "dark" ? "light" : "dark"} />

        {/* ── Centered Container for Responsive Desktop / Mobile Layout ── */}
        <View style={{ flex: 1, width: "100%", maxWidth: 720, alignSelf: "center" }}>
          
          {/* ── Top Navigation Tabs ── */}
          <View style={{ paddingHorizontal: 16, paddingTop: 12 }}>
            <View style={[styles.tabBar, activeTheme.tabBarBg, { borderColor: activeTheme.borderColor }]}>
              <TouchableOpacity
                style={[
                  styles.tabButton,
                  activeTab === "trading" ? activeTheme.tabActive : activeTheme.tabInactive,
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
                >
                  📈 Trading Calc
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.tabButton,
                  activeTab === "sip" ? activeTheme.tabActive : activeTheme.tabInactive,
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
                >
                  💰 SIP Calc
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* ── Screens (state preserved when switching tabs) ── */}
          <View style={{ flex: 1, display: activeTab === "trading" ? "flex" : "none" }}>
            <CalculatorScreen theme={theme} setTheme={setTheme} />
          </View>
          <View style={{ flex: 1, display: activeTab === "sip" ? "flex" : "none" }}>
            <SipCalculatorScreen theme={theme} setTheme={setTheme} />
          </View>
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
