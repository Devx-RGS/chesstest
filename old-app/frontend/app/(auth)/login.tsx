import React, { useState, useRef, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Animated, Alert } from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { AnimatedButton } from "@/components/ui/AnimatedButton";
import { GlassCard } from "@/components/ui/GlassCard";
import { authService } from "@/services/authService";
import { useAuthStore } from "@/stores/authStore";
import { colors } from "@/constants/themes";
import { Mail, Lock, Eye, EyeOff, ArrowLeft } from "lucide-react-native";
import * as Haptics from "expo-haptics";

// Test admin credentials for local development
const TEST_ADMIN = {
    email: "admin@chess.com",
    password: "admin123",
};

export default function LoginScreen() {
    const router = useRouter();
    const login = useAuthStore((state) => state.login);

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
        }).start();
    }, []);

    const handleLogin = async () => {
        if (!email || !password) {
            setError("Please fill in all fields");
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            return;
        }

        setIsLoading(true);
        setError(null);

        // Check for test admin credentials (works offline)
        if (email === TEST_ADMIN.email && password === TEST_ADMIN.password) {
            const adminUser = {
                id: "admin-001",
                username: "Admin",
                email: TEST_ADMIN.email,
            };
            login(adminUser, "admin-token", true);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            router.replace("/admin/dashboard" as any);
            setIsLoading(false);
            return;
        }

        // Try backend login for other users
        try {
            const response = await authService.login(email, password);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

            // Redirect based on admin status
            if (response.isAdmin) {
                router.replace("/admin/dashboard" as any);
            } else {
                router.replace("/(tabs)");
            }
        } catch (err: any) {
            const errorMessage = err.response?.data?.error || "Login failed. Please try again.";
            setError(errorMessage);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <LinearGradient
            colors={[colors.background.primary, colors.background.secondary]}
            style={{ flex: 1 }}
        >
            <SafeAreaView style={{ flex: 1 }}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    style={{ flex: 1, padding: 24 }}
                >
                    {/* Back Button */}
                    <TouchableOpacity
                        onPress={() => router.back()}
                        style={{
                            width: 40,
                            height: 40,
                            borderRadius: 12,
                            backgroundColor: colors.glass.light,
                            alignItems: "center",
                            justifyContent: "center",
                            marginBottom: 32,
                        }}
                    >
                        <ArrowLeft size={24} color={colors.text.primary} />
                    </TouchableOpacity>

                    <Animated.View style={{ opacity: fadeAnim, flex: 1 }}>
                        {/* Header */}
                        <View style={{ marginBottom: 32 }}>
                            <Text style={{ color: colors.text.primary, fontSize: 32, fontWeight: "800" }}>
                                Welcome Back
                            </Text>
                            <Text style={{ color: colors.text.secondary, fontSize: 16, marginTop: 8 }}>
                                Sign in to continue your chess journey
                            </Text>
                        </View>

                        {/* Form */}
                        <GlassCard variant="light" style={{ marginBottom: 24 }}>
                            {/* Email Input */}
                            <View
                                style={{
                                    flexDirection: "row",
                                    alignItems: "center",
                                    borderBottomWidth: 1,
                                    borderBottomColor: colors.glass.medium,
                                    paddingBottom: 16,
                                    marginBottom: 16,
                                }}
                            >
                                <Mail size={20} color={colors.text.muted} />
                                <TextInput
                                    placeholder="Email"
                                    placeholderTextColor={colors.text.muted}
                                    value={email}
                                    onChangeText={(text) => {
                                        setEmail(text);
                                        setError(null);
                                    }}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    style={{
                                        flex: 1,
                                        marginLeft: 12,
                                        color: colors.text.primary,
                                        fontSize: 16,
                                    }}
                                />
                            </View>

                            {/* Password Input */}
                            <View
                                style={{
                                    flexDirection: "row",
                                    alignItems: "center",
                                }}
                            >
                                <Lock size={20} color={colors.text.muted} />
                                <TextInput
                                    placeholder="Password"
                                    placeholderTextColor={colors.text.muted}
                                    value={password}
                                    onChangeText={(text) => {
                                        setPassword(text);
                                        setError(null);
                                    }}
                                    secureTextEntry={!showPassword}
                                    style={{
                                        flex: 1,
                                        marginLeft: 12,
                                        color: colors.text.primary,
                                        fontSize: 16,
                                    }}
                                />
                                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                    {showPassword ? (
                                        <EyeOff size={20} color={colors.text.muted} />
                                    ) : (
                                        <Eye size={20} color={colors.text.muted} />
                                    )}
                                </TouchableOpacity>
                            </View>
                        </GlassCard>

                        {/* Error Message */}
                        {error && (
                            <Text style={{ color: colors.danger, marginBottom: 16, textAlign: "center" }}>
                                {error}
                            </Text>
                        )}

                        {/* Login Button */}
                        <AnimatedButton
                            title="Sign In"
                            size="lg"
                            onPress={handleLogin}
                            loading={isLoading}
                            disabled={!email || !password || isLoading}
                        />

                        {/* Register Link */}
                        <View
                            style={{
                                flexDirection: "row",
                                justifyContent: "center",
                                marginTop: 24,
                            }}
                        >
                            <Text style={{ color: colors.text.secondary }}>
                                Don't have an account?{" "}
                            </Text>
                            <TouchableOpacity onPress={() => router.push("/(auth)/signup")}>
                                <Text style={{ color: colors.accent.purple, fontWeight: "600" }}>
                                    Sign Up
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {/* Guest Mode */}
                        <TouchableOpacity
                            onPress={() => router.replace("/(tabs)")}
                            style={{ marginTop: 32, alignItems: "center" }}
                        >
                            <Text style={{ color: colors.text.muted, fontSize: 14 }}>
                                Continue as Guest
                            </Text>
                        </TouchableOpacity>
                    </Animated.View>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </LinearGradient>
    );
}
