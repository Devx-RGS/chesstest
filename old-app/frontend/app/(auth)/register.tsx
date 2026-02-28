import React, { useState, useRef, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Animated, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { AnimatedButton } from "@/components/ui/AnimatedButton";
import { GlassCard } from "@/components/ui/GlassCard";
import { useAuthStore } from "@/stores/authStore";
import { colors } from "@/constants/themes";
import { User, Mail, Lock, Eye, EyeOff, ArrowLeft } from "lucide-react-native";

export default function RegisterScreen() {
    const router = useRouter();
    const { register, isLoading, error } = useAuthStore();

    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
        }).start();
    }, []);

    const handleRegister = async () => {
        if (!username || !email || !password) return;
        if (password !== confirmPassword) return;
        const success = await register(username, email, password);
        if (success) {
            router.replace("/(tabs)");
        }
    };

    const isValid = username && email && password && password === confirmPassword;

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
                        contentContainerStyle={{ padding: 24 }}
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

                        <Animated.View style={{ opacity: fadeAnim }}>
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
                                        onChangeText={setUsername}
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
                                        onChangeText={setEmail}
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
                                        onChangeText={setPassword}
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
                                        onChangeText={setConfirmPassword}
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

                            {/* Password Match Warning */}
                            {confirmPassword && password !== confirmPassword && (
                                <Text style={{ color: colors.danger, marginBottom: 16, textAlign: "center" }}>
                                    Passwords do not match
                                </Text>
                            )}

                            {/* Error Message */}
                            {error && (
                                <Text style={{ color: colors.danger, marginBottom: 16, textAlign: "center" }}>
                                    {error}
                                </Text>
                            )}

                            {/* Register Button */}
                            <AnimatedButton
                                title="Create Account"
                                size="lg"
                                onPress={handleRegister}
                                loading={isLoading}
                                disabled={!isValid}
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
