import React, { useState, useRef, useEffect } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    Animated,
} from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { AnimatedButton } from "@/components/ui/AnimatedButton";
import { GlassCard } from "@/components/ui/GlassCard";
import { authService } from "@/services/authService";
import { useAuthStore } from "@/stores/authStore";
import { colors } from "@/constants/themes";
import { Mail, Lock, Eye, EyeOff, Shield, ArrowLeft } from "lucide-react-native";
import * as Haptics from "expo-haptics";

export default function AdminLoginScreen() {
    const router = useRouter();
    const login = useAuthStore((state) => state.login);

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 600,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 600,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    const handleAdminLogin = async () => {
        if (!email || !password) {
            setError("Please fill in all fields");
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            return;
        }

        setIsLoading(true);
        setError(null);

        // Try backend login
        try {
            const response = await authService.login(email, password);

            // Validate admin access
            if (!response.isAdmin) {
                setError("Access denied. Admin privileges required.");
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                // Logout the non-admin user
                authService.logout();
                return;
            }

            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            router.replace("/admin/dashboard" as any);
        } catch (err: any) {
            const errorMessage =
                err.response?.data?.error || "Login failed. Please try again.";
            setError(errorMessage);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <LinearGradient
            colors={[colors.background.primary, "#0a0a1a", colors.background.secondary]}
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

                    <Animated.View
                        style={{
                            opacity: fadeAnim,
                            transform: [{ translateY: slideAnim }],
                            flex: 1,
                        }}
                    >
                        {/* Admin Badge */}
                        <View
                            style={{
                                alignItems: "center",
                                marginBottom: 32,
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
                                    marginBottom: 16,
                                }}
                            >
                                <Shield size={40} color={colors.danger} />
                            </View>
                            <Text
                                style={{
                                    color: colors.text.primary,
                                    fontSize: 28,
                                    fontWeight: "900",
                                    letterSpacing: 2,
                                }}
                            >
                                ADMIN ACCESS
                            </Text>
                            <Text
                                style={{
                                    color: colors.text.secondary,
                                    fontSize: 14,
                                    marginTop: 8,
                                }}
                            >
                                Restricted area • Authorized personnel only
                            </Text>
                        </View>

                        {/* Form */}
                        <GlassCard variant="dark" style={{ marginBottom: 24 }}>
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
                                    placeholder="Admin Email"
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
                                <TouchableOpacity
                                    onPress={() => setShowPassword(!showPassword)}
                                >
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
                            <View
                                style={{
                                    backgroundColor: "rgba(239, 68, 68, 0.15)",
                                    borderRadius: 12,
                                    padding: 12,
                                    marginBottom: 16,
                                    borderWidth: 1,
                                    borderColor: "rgba(239, 68, 68, 0.3)",
                                }}
                            >
                                <Text
                                    style={{
                                        color: colors.danger,
                                        textAlign: "center",
                                        fontWeight: "600",
                                    }}
                                >
                                    {error}
                                </Text>
                            </View>
                        )}

                        {/* Login Button */}
                        <AnimatedButton
                            title="Authenticate"
                            size="lg"
                            onPress={handleAdminLogin}
                            loading={isLoading}
                            disabled={!email || !password || isLoading}
                            icon={<Shield size={20} color={colors.text.primary} />}
                        />

                        {/* Back to User Login */}
                        <TouchableOpacity
                            onPress={() => router.push("/(auth)/login")}
                            style={{ marginTop: 32, alignItems: "center" }}
                        >
                            <Text style={{ color: colors.text.muted, fontSize: 14 }}>
                                Not an admin? Go to user login
                            </Text>
                        </TouchableOpacity>
                    </Animated.View>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </LinearGradient>
    );
}
