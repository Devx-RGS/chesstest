import { Stack } from "expo-router";
import React, { useEffect } from "react";
import { ActivityIndicator, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRequireAuth } from "../_lib/hooks/useRequireAuth";
import { useCoinStore } from "../_lib/stores/coinStore";
import { StatusBar } from "expo-status-bar";

export default function MainLayout() {
  const authStatus = useRequireAuth();
  const fetchBalance = useCoinStore((s) => s.fetchBalance);

  // Fetch coin balance once when authenticated
  useEffect(() => {
    if (authStatus === "ready") {
      fetchBalance();
    }
  }, [authStatus]);

  if (authStatus === "checking") {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          backgroundColor: "#0D3B2E",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <StatusBar style="light" />
        <ActivityIndicator size="large" color="#F5A623" />
        <Text style={{ color: "#fff", marginTop: 16, fontSize: 16 }}>
          Checking login status...
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <Stack>
      <Stack.Screen name="choose" options={{ headerShown: false }} />
      <Stack.Screen name="matchmaking" options={{ headerShown: false }} />
      <Stack.Screen name="tournament" options={{ headerShown: false }} />
      <Stack.Screen name="leaderboard" options={{ headerShown: false }} />
      <Stack.Screen name="profile" options={{ headerShown: false }} />
      <Stack.Screen name="streak-master" options={{ headerShown: false }} />
      <Stack.Screen name="newsletter" options={{ headerShown: false }} />
      <Stack.Screen name="reels" options={{ headerShown: false }} />
    </Stack>
  );
}
