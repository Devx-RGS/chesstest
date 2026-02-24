import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { ActivityIndicator, Alert, Image, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { registerUser } from "../lib/APIservice/service";
import { useAuthStore } from "../lib/stores/authStore";

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Signup() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Clear error when user starts typing
  const handleInputChange = (setter: (val: string) => void) => (value: string) => {
    setErrorMessage(null);
    setter(value);
  };

  const validateInputs = (): string | null => {
    if (!name.trim()) {
      return 'Please enter your name';
    }
    if (name.trim().length < 2) {
      return 'Name must be at least 2 characters';
    }
    if (!email.trim()) {
      return 'Please enter your email';
    }
    if (!EMAIL_REGEX.test(email.trim())) {
      return 'Please enter a valid email address';
    }
    if (!password) {
      return 'Please enter a password';
    }
    if (password.length < 6) {
      return 'Password must be at least 6 characters';
    }
    if (!confirmPassword) {
      return 'Please confirm your password';
    }
    if (password !== confirmPassword) {
      return 'Passwords do not match';
    }
    return null;
  };

  const handleSignup = async () => {
    // Clear previous errors
    setErrorMessage(null);

    // Validate inputs
    const validationError = validateInputs();
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    setIsLoading(true);
    console.log('[Signup] 🚀 Attempting registration for:', email.trim());

    try {
      const result = await registerUser(name.trim(), email.trim().toLowerCase(), password);

      if (result.success) {
        console.log('[Signup] ✅ Registration successful');
        const data = result.data;
        await AsyncStorage.setItem('token', data.token);
        await AsyncStorage.setItem('user', JSON.stringify(data.user));
        // Sync to Zustand authStore
        useAuthStore.getState().login(
          {
            id: data.user._id || data.user.id || '',
            username: data.user.name || data.user.username || name,
            email: data.user.email,
          },
          data.token,
          false,
        );
        router.replace('/(main)/choose');
      } else {
        console.log('[Signup] ❌ Registration failed:', result.error);
        setErrorMessage(result.error || 'Registration failed. Please try again.');
      }
    } catch (err) {
      console.error('[Signup] 💥 Unexpected error:', err);
      setErrorMessage('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(auth)/login');
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0F0F23" }}>
      <View style={{ flex: 1, paddingHorizontal: 20 }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 16 }}>
          <TouchableOpacity
            // onPress={handleGoBack}
            style={{ paddingVertical: 6, paddingHorizontal: 4 }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={{ color: "#00D9FF", fontSize: 18 }}></Text>
          </TouchableOpacity>
          <Text style={{ color: "#fff", fontSize: 20, fontWeight: "bold" }}>Sign Up</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <Image
            source={{ uri: "https://www.chess.com/bundles/web/images/offline-play/standardboard.84a92436.png" }}
            style={{ width: 80, height: 80, marginBottom: 16, borderRadius: 12 }}
          />
          <Text style={{ color: "#fff", fontSize: 28, fontWeight: "bold", marginBottom: 8 }}>Create Account</Text>
          <Text style={{ color: "#A0A0B0", fontSize: 16, marginBottom: 24 }}>Join the game and challenge the world!</Text>

          {/* Error Message Display */}
          {errorMessage && (
            <View style={{ width: "100%", backgroundColor: "#dc262620", borderRadius: 10, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: "#dc2626" }}>
              <Text style={{ color: "#ef4444", fontSize: 14, textAlign: "center" }}>⚠️ {errorMessage}</Text>
            </View>
          )}

          <TextInput
            placeholder="Name"
            placeholderTextColor="#A0A0B0"
            value={name}
            onChangeText={handleInputChange(setName)}
            style={{ width: "100%", backgroundColor: "#2C2F33", color: "#fff", borderWidth: 0, marginBottom: 12, padding: 14, borderRadius: 10, fontSize: 16 }}
            editable={!isLoading}
          />
          <TextInput
            placeholder="Email"
            placeholderTextColor="#A0A0B0"
            value={email}
            onChangeText={handleInputChange(setEmail)}
            style={{ width: "100%", backgroundColor: "#2C2F33", color: "#fff", borderWidth: 0, marginBottom: 12, padding: 14, borderRadius: 10, fontSize: 16 }}
            autoCapitalize="none"
            keyboardType="email-address"
            editable={!isLoading}
          />
          <TextInput
            placeholder="Password"
            placeholderTextColor="#A0A0B0"
            value={password}
            onChangeText={handleInputChange(setPassword)}
            style={{ width: "100%", backgroundColor: "#2C2F33", color: "#fff", borderWidth: 0, marginBottom: 12, padding: 14, borderRadius: 10, fontSize: 16 }}
            secureTextEntry
            editable={!isLoading}
          />
          <TextInput
            placeholder="Confirm Password"
            placeholderTextColor="#A0A0B0"
            value={confirmPassword}
            onChangeText={handleInputChange(setConfirmPassword)}
            style={{ width: "100%", backgroundColor: "#2C2F33", color: "#fff", borderWidth: 0, marginBottom: 20, padding: 14, borderRadius: 10, fontSize: 16 }}
            secureTextEntry
            editable={!isLoading}
          />
          <TouchableOpacity
            onPress={handleSignup}
            style={{ backgroundColor: "#00D9FF", paddingVertical: 16, borderRadius: 30, width: "100%", alignItems: "center", marginBottom: 16, opacity: isLoading ? 0.6 : 1 }}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={{ color: "#fff", fontSize: 18, fontWeight: "bold" }}>Sign Up & Play</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push("/(auth)/login")} style={{ marginTop: 8 }}>
            <Text style={{ color: "#A0A0B0", fontSize: 16 }}>Already have an account? <Text style={{ color: "#00D9FF", fontWeight: "bold" }}>Login</Text></Text>
          </TouchableOpacity>
          <View style={{ marginTop: 32, alignItems: "center" }}>
            <Text style={{ color: "#fff", fontSize: 16, fontWeight: "bold" }}>🎉 Unlock achievements as you play!</Text>
            <Text style={{ color: "#A0A0B0", fontSize: 14, marginTop: 4 }}>Earn trophies, badges, and more.</Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
