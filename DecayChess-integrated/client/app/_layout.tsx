import { Stack } from "expo-router";
import React, { useEffect } from "react";
import * as SplashScreen from "expo-splash-screen";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/services/apiClient";
import "./styles/globals.css";
import AnimatedSplash from "./components/ui/AnimatedSplash";
import EngineService from "./lib/services/EngineService";
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold
} from '@expo-google-fonts/inter';

// Keep the native splash visible while we set up and until our
// in-app animated splash overlay takes over.
void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [showAnimatedSplash, setShowAnimatedSplash] = React.useState(true);

  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
  });

  useEffect(() => {
    // Hide the native splash shortly after mount and fonts loaded
    if (fontsLoaded) {
      const t = setTimeout(() => {
        SplashScreen.hideAsync().catch(() => { });
      }, 50);
      return () => clearTimeout(t);
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <StatusBar style="light" backgroundColor="#080B14" translucent={false} />
        <Stack>
          <Stack.Screen name="Home" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(main)" options={{ headerShown: false }} />
          <Stack.Screen name="(game)" options={{ headerShown: false }} />
          <Stack.Screen name="(offline)" options={{ headerShown: false }} />
          <Stack.Screen name="admin" options={{ headerShown: false }} />
        </Stack>
        <EngineService />
        {showAnimatedSplash && (
          <AnimatedSplash
            onFinish={() => setShowAnimatedSplash(false)}
            logoSource={require("../assets/logo2.png")}
          />
        )}
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}
