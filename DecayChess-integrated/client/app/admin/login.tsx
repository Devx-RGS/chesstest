import React, { useState } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "../lib/stores/authStore";

export default function AdminLoginScreen() {
    const [email, setEmail] = useState("admin@decaychess.com");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    const loginUser = useAuthStore((s) => s.loginUser);
    const isLoading = useAuthStore((s) => s.isLoading);
    const error = useAuthStore((s) => s.error);
    const isAdmin = useAuthStore((s) => s.isAdmin);

    const handleLogin = async () => {
        const success = await loginUser(email.trim().toLowerCase(), password);
        if (success) {
            // Check if the logged-in user is admin
            const currentIsAdmin = useAuthStore.getState().isAdmin;
            if (currentIsAdmin) {
                router.replace("/admin/dashboard");
            } else {
                useAuthStore.getState().setError("Access denied. Admin privileges required.");
                useAuthStore.getState().logout();
            }
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
            <View style={styles.card}>
                {/* Logo */}
                <View style={styles.logoWrap}>
                    <View style={styles.logoBg}>
                        <Ionicons name="shield-checkmark" size={40} color="#F5A623" />
                    </View>
                    <Text style={styles.logoTitle}>Admin Panel</Text>
                    <Text style={styles.logoSubtitle}>DecayChess Management</Text>
                </View>

                {/* Error */}
                {error ? (
                    <View style={styles.errorBox}>
                        <Ionicons name="alert-circle" size={18} color="#EF4444" />
                        <Text style={styles.errorText}>{error}</Text>
                    </View>
                ) : null}

                {/* Email */}
                <View style={styles.field}>
                    <Text style={styles.label}>Email</Text>
                    <View style={styles.inputWrap}>
                        <Ionicons name="mail-outline" size={20} color="#6B7280" />
                        <TextInput
                            style={styles.input}
                            value={email}
                            onChangeText={setEmail}
                            placeholder="admin@decaychess.com"
                            placeholderTextColor="#6B7280"
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />
                    </View>
                </View>

                {/* Password */}
                <View style={styles.field}>
                    <Text style={styles.label}>Password</Text>
                    <View style={styles.inputWrap}>
                        <Ionicons name="lock-closed-outline" size={20} color="#6B7280" />
                        <TextInput
                            style={styles.input}
                            value={password}
                            onChangeText={setPassword}
                            placeholder="Enter password"
                            placeholderTextColor="#6B7280"
                            secureTextEntry={!showPassword}
                        />
                        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                            <Ionicons
                                name={showPassword ? "eye-off-outline" : "eye-outline"}
                                size={20}
                                color="#6B7280"
                            />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Submit */}
                <TouchableOpacity
                    style={[styles.btn, isLoading && styles.btnDisabled]}
                    onPress={handleLogin}
                    disabled={isLoading || !email || !password}
                >
                    {isLoading ? (
                        <ActivityIndicator color="#080B14" />
                    ) : (
                        <Text style={styles.btnText}>Sign In</Text>
                    )}
                </TouchableOpacity>

                {/* Back */}
                <TouchableOpacity
                    style={styles.backBtn}
                    onPress={() => router.back()}
                >
                    <Ionicons name="arrow-back" size={18} color="#A0A0B0" />
                    <Text style={styles.backText}>Back to app</Text>
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#080B14",
        justifyContent: "center",
        padding: 24,
    },
    card: {
        backgroundColor: "rgba(26, 26, 46, 0.9)",
        borderRadius: 20,
        padding: 28,
        borderWidth: 1,
        borderColor: "rgba(245, 166, 35, 0.15)",
    },
    logoWrap: {
        alignItems: "center",
        marginBottom: 28,
    },
    logoBg: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: "rgba(245, 166, 35, 0.1)",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 12,
    },
    logoTitle: {
        fontSize: 24,
        fontWeight: "800",
        color: "#FFFFFF",
    },
    logoSubtitle: {
        fontSize: 13,
        color: "#A0A0B0",
        marginTop: 4,
    },
    errorBox: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        backgroundColor: "rgba(239, 68, 68, 0.12)",
        padding: 12,
        borderRadius: 10,
        marginBottom: 16,
    },
    errorText: {
        color: "#EF4444",
        fontSize: 13,
        flex: 1,
    },
    field: {
        marginBottom: 16,
    },
    label: {
        color: "#A0A0B0",
        fontSize: 13,
        marginBottom: 6,
        fontWeight: "500",
    },
    inputWrap: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "rgba(255,255,255,0.05)",
        borderRadius: 12,
        paddingHorizontal: 14,
        height: 48,
        gap: 10,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.08)",
    },
    input: {
        flex: 1,
        color: "#FFFFFF",
        fontSize: 15,
    },
    btn: {
        height: 50,
        borderRadius: 14,
        backgroundColor: "#F5A623",
        justifyContent: "center",
        alignItems: "center",
        marginTop: 8,
    },
    btnDisabled: {
        opacity: 0.6,
    },
    btnText: {
        fontSize: 16,
        fontWeight: "700",
        color: "#080B14",
    },
    backBtn: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        gap: 6,
        marginTop: 20,
    },
    backText: {
        color: "#A0A0B0",
        fontSize: 14,
    },
});
