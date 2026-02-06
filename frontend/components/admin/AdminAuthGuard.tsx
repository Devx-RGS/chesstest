import React, { useEffect, useState, useRef } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { useRouter, usePathname } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Shield } from "lucide-react-native";
import { useAuthStore } from "@/stores/authStore";
import { colors } from "@/constants/themes";

interface AdminAuthGuardProps {
    children: React.ReactNode;
}

/**
 * AdminAuthGuard - A wrapper component that protects admin-only screens.
 * Checks if the user is authenticated AND has admin privileges.
 * Redirects to admin login if not authorized.
 */
export function AdminAuthGuard({ children }: AdminAuthGuardProps) {
    const router = useRouter();
    const pathname = usePathname();

    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    const isAdmin = useAuthStore((state) => state.isAdmin);
    const isLoading = useAuthStore((state) => state.isLoading);

    const [isChecking, setIsChecking] = useState(true);
    const hasRedirected = useRef(false);

    useEffect(() => {
        // Small delay to allow hydration of persisted state
        const timer = setTimeout(() => {
            setIsChecking(false);
        }, 100);

        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        if (isChecking || isLoading) return;

        // Skip redirect if already on login page
        if (pathname === "/admin/login") return;

        // Only redirect once to prevent loops
        if (hasRedirected.current) return;

        // Redirect if not authenticated or not admin
        if (!isAuthenticated || !isAdmin) {
            hasRedirected.current = true;
            router.replace("/admin/login" as any);
        }
    }, [isAuthenticated, isAdmin, isChecking, isLoading, pathname]);

    // Show loading screen while checking auth
    if (isChecking || isLoading) {
        return (
            <LinearGradient
                colors={[colors.background.primary, colors.background.secondary]}
                style={{
                    flex: 1,
                    justifyContent: "center",
                    alignItems: "center",
                }}
            >
                <View
                    style={{
                        width: 80,
                        height: 80,
                        borderRadius: 40,
                        backgroundColor: "rgba(239, 68, 68, 0.15)",
                        borderWidth: 2,
                        borderColor: "rgba(239, 68, 68, 0.3)",
                        alignItems: "center",
                        justifyContent: "center",
                        marginBottom: 24,
                    }}
                >
                    <Shield size={40} color={colors.danger} />
                </View>
                <ActivityIndicator size="large" color={colors.accent.cyan} />
                <Text
                    style={{
                        color: colors.text.secondary,
                        marginTop: 16,
                        fontSize: 14,
                        letterSpacing: 1,
                    }}
                >
                    VERIFYING ACCESS...
                </Text>
            </LinearGradient>
        );
    }

    // If on login page, render children directly
    if (pathname === "/admin/login") {
        return <>{children}</>;
    }

    // If authenticated and admin, render children
    if (isAuthenticated && isAdmin) {
        return <>{children}</>;
    }

    // Fallback loading while redirect happens
    return (
        <LinearGradient
            colors={[colors.background.primary, colors.background.secondary]}
            style={{
                flex: 1,
                justifyContent: "center",
                alignItems: "center",
            }}
        >
            <ActivityIndicator size="large" color={colors.accent.cyan} />
        </LinearGradient>
    );
}
