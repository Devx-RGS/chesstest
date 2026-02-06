import React, { useEffect, useRef } from "react";
import { Stack, usePathname, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View, Platform } from "react-native";
import { QueryClientProvider } from "@tanstack/react-query";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Audio } from "expo-av";
import { queryClient } from "@/services/api";
import { colors } from "@/constants/themes";
import { useAuthStore } from "@/stores/authStore";

// Configure audio mode for video playback
async function configureAudio() {
    try {
        await Audio.setAudioModeAsync({
            allowsRecordingIOS: false,
            staysActiveInBackground: false,
            playsInSilentModeIOS: true,
            shouldDuckAndroid: true,
            playThroughEarpieceAndroid: false,
        });
    } catch (error) {
        console.warn("Failed to configure audio mode:", error);
    }
}

// Route guard component to protect admin routes
function RouteGuard({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const isAdmin = useAuthStore((state) => state.isAdmin);
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    const hasRedirected = useRef(false);

    useEffect(() => {
        // Check if user is trying to access admin routes
        if (pathname.startsWith("/(admin)") || pathname.startsWith("/admin")) {
            if (!isAuthenticated || !isAdmin) {
                // Only redirect once to prevent loops
                if (!hasRedirected.current) {
                    hasRedirected.current = true;
                    router.replace("/(auth)/login");
                }
            }
        }
    }, [pathname, isAdmin, isAuthenticated]);

    return <>{children}</>;
}

export default function RootLayout() {
    // Configure audio on app startup
    useEffect(() => {
        configureAudio();
    }, []);

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <QueryClientProvider client={queryClient}>
                <View style={{ flex: 1, backgroundColor: colors.background.primary }}>
                    {/* Translucent status bar for edge-to-edge design */}
                    <StatusBar
                        style="light"
                        translucent={true}
                        backgroundColor="transparent"
                    />
                    <RouteGuard>
                        <Stack
                            screenOptions={{
                                headerShown: false,
                                contentStyle: {
                                    backgroundColor: colors.background.primary,
                                },
                                animation: "slide_from_right",
                                // Android: enable edge-to-edge
                                navigationBarColor: colors.background.primary,
                                statusBarStyle: "light",
                                statusBarTranslucent: true,
                            }}
                        >
                            <Stack.Screen name="index" />
                            <Stack.Screen name="(auth)" />
                            <Stack.Screen name="(tabs)" />
                            <Stack.Screen name="admin" />
                        </Stack>
                    </RouteGuard>
                </View>
            </QueryClientProvider>
        </GestureHandlerRootView>
    );
}

