import React, { useState, useRef, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Animated, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { AnimatedButton } from "@/components/ui/AnimatedButton";
import { GlassCard } from "@/components/ui/GlassCard";
import { authService } from "@/services/authService";
import { colors } from "@/constants/themes";
import { Mail, Lock, Eye, EyeOff, ArrowLeft, User } from "lucide-react-native";
import * as Haptics from "expo-haptics";

export default function SignupScreen() {
    const router = useRouter();

    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
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

    const validateForm = (): boolean => {
        if (!username || !email || !password || !confirmPassword) {
            setError("Please fill in all fields");
            return false;
        }
        if (username.length < 3) {
            setError("Username must be at least 3 characters");
            return false;
        }
        if (!email.includes("@")) {
            setError("Please enter a valid email");
            return false;
        }
        if (password.length < 6) {
            setError("Password must be at least 6 characters");
            return false;
        }
        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return false;
        }
        return true;
    };

    const handleSignup = async () => {
        if (!validateForm()) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            await authService.register(username, email, password);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            router.replace("/(tabs)");
        } catch (err: any) {
            const errorMessage = err.response?.data?.error || "Registration failed. Please try again.";
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
                    style={{ flex: 1 }}
                >
                    <ScrollView
                        contentContainerStyle={{ padding: 24, flexGrow: 1 }}
                        showsVerticalScrollIndicator={false}
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
                                    Create Account
                                </Text>
                                <Text style={{ color: colors.text.secondary, fontSize: 16, marginTop: 8 }}>
                                    Join the chess community today
                                </Text>
                            </View>

                            {/* Form */}
                            <GlassCard variant="light" style={{ marginBottom: 24 }}>
                                {/* Username Input */}
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
                                    <User size={20} color={colors.text.muted} />
                                    <TextInput
                                        placeholder="Username"
                                        placeholderTextColor={colors.text.muted}
                                        value={username}
                                        onChangeText={(text) => {
                                            setUsername(text);
                                            setError(null);
                                        }}
                                        autoCapitalize="none"
                                        style={{
                                            flex: 1,
                                            marginLeft: 12,
                                            color: colors.text.primary,
                                            fontSize: 16,
                                        }}
                                    />
                                </View>

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
                                        borderBottomWidth: 1,
                                        borderBottomColor: colors.glass.medium,
                                        paddingBottom: 16,
                                        marginBottom: 16,
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

                                {/* Confirm Password Input */}
                                <View
                                    style={{
                                        flexDirection: "row",
                                        alignItems: "center",
                                    }}
                                >
                                    <Lock size={20} color={colors.text.muted} />
                                    <TextInput
                                        placeholder="Confirm Password"
                                        placeholderTextColor={colors.text.muted}
                                        value={confirmPassword}
                                        onChangeText={(text) => {
                                            setConfirmPassword(text);
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
                                </View>
                            </GlassCard>

                            {/* Error Message */}
                            {error && (
                                <Text style={{ color: colors.danger, marginBottom: 16, textAlign: "center" }}>
                                    {error}
                                </Text>
                            )}

                            {/* Signup Button */}
                            <AnimatedButton
                                title="Create Account"
                                size="lg"
                                onPress={handleSignup}
                                loading={isLoading}
                                disabled={!username || !email || !password || !confirmPassword || isLoading}
                            />

                            {/* Login Link */}
                            <View
                                style={{
                                    flexDirection: "row",
                                    justifyContent: "center",
                                    marginTop: 24,
                                }}
                            >
                                <Text style={{ color: colors.text.secondary }}>
                                    Already have an account?{" "}
                                </Text>
                                <TouchableOpacity onPress={() => router.push("/(auth)/login")}>
                                    <Text style={{ color: colors.accent.purple, fontWeight: "600" }}>
                                        Sign In
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </Animated.View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </LinearGradient>
    );
}
