import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { ActivityIndicator, Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from 'expo-linear-gradient';
import { registerUser } from "../lib/APIservice/service";
import { useAuthStore } from "../lib/stores/authStore";
import GlassCard from "../components/ui/GlassCard";
import GlassButton from "../components/ui/GlassButton";
import { COLORS, GLASS, FONTS } from "../lib/styles/base";
import { Ionicons } from "@expo/vector-icons";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Signup() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleInputChange = (setter: (val: string) => void) => (value: string) => {
    setErrorMessage(null);
    setter(value);
  };

  const validateInputs = (): string | null => {
    if (!name.trim()) return 'Please enter your name';
    if (name.trim().length < 2) return 'Name must be at least 2 characters';
    if (!email.trim()) return 'Please enter your email';
    if (!EMAIL_REGEX.test(email.trim())) return 'Please enter a valid email address';
    if (!password) return 'Please enter a password';
    if (password.length < 6) return 'Password must be at least 6 characters';
    if (!confirmPassword) return 'Please confirm your password';
    if (password !== confirmPassword) return 'Passwords do not match';
    return null;
  };

  const handleSignup = async () => {
    setErrorMessage(null);
    const validationError = validateInputs();
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    setIsLoading(true);

    try {
      const result = await registerUser(name.trim(), email.trim().toLowerCase(), password);
      if (result.success) {
        const data = result.data;
        await AsyncStorage.setItem('token', data.token);
        await AsyncStorage.setItem('user', JSON.stringify(data.user));
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
        setErrorMessage(result.error || 'Registration failed. Please try again.');
      }
    } catch (err) {
      setErrorMessage('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient
        colors={['#080B14', '#0E1228', '#0C0F20', '#080B14']}
        locations={[0, 0.3, 0.7, 1]}
        style={StyleSheet.absoluteFillObject}
      />
      <View style={styles.orbTopRight} />
      <View style={styles.orbBottomLeft} />

      <View style={styles.mainContainer}>
        {/* Top bar */}
        <View style={styles.topBar}>
          <View style={{ width: 32 }} />
          <Text style={styles.topTitle}>Sign Up</Text>
          <View style={{ width: 32 }} />
        </View>

        {/* Content */}
        <View style={styles.centerContent}>
          <Image
            source={{ uri: "https://www.chess.com/bundles/web/images/offline-play/standardboard.84a92436.png" }}
            style={styles.logo}
          />
          <Text style={styles.heading}>Create Account</Text>
          <Text style={styles.subtitle}>Join the game and challenge the world!</Text>

          <GlassCard style={styles.formCard}>
            {errorMessage && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>⚠️ {errorMessage}</Text>
              </View>
            )}

            <TextInput
              placeholder="Name"
              placeholderTextColor={COLORS.mutedText}
              value={name}
              onChangeText={handleInputChange(setName)}
              style={styles.input}
              editable={!isLoading}
            />
            <TextInput
              placeholder="Email"
              placeholderTextColor={COLORS.mutedText}
              value={email}
              onChangeText={handleInputChange(setEmail)}
              style={styles.input}
              autoCapitalize="none"
              keyboardType="email-address"
              editable={!isLoading}
            />
            <TextInput
              placeholder="Password"
              placeholderTextColor={COLORS.mutedText}
              value={password}
              onChangeText={handleInputChange(setPassword)}
              style={styles.input}
              secureTextEntry
              editable={!isLoading}
            />
            <TextInput
              placeholder="Confirm Password"
              placeholderTextColor={COLORS.mutedText}
              value={confirmPassword}
              onChangeText={handleInputChange(setConfirmPassword)}
              style={[styles.input, { marginBottom: 20 }]}
              secureTextEntry
              editable={!isLoading}
            />

            <GlassButton
              label="Sign Up & Play"
              onPress={handleSignup}
              loading={isLoading}
              disabled={isLoading}
              fullWidth
            />
          </GlassCard>

          <TouchableOpacity onPress={() => router.push("/(auth)/login")} style={{ marginTop: 20 }}>
            <Text style={styles.linkText}>
              Already have an account? <Text style={styles.linkAccent}>Login</Text>
            </Text>
          </TouchableOpacity>

          <View style={styles.footerBadge}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
              <Ionicons name="star" size={18} color={COLORS.accent} style={{ marginRight: 8 }} />
              <Text style={styles.footerBadgeTitle}>Unlock achievements as you play!</Text>
            </View>
            <Text style={styles.footerBadgeSub}>Earn trophies, badges, and more.</Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  orbTopRight: {
    position: 'absolute',
    top: -80,
    right: -80,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(245, 166, 35, 0.05)',
  },
  orbBottomLeft: {
    position: 'absolute',
    bottom: -60,
    left: -60,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(108, 60, 224, 0.04)',
  },
  mainContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
  },
  topTitle: {
    fontFamily: FONTS.semibold,
    color: COLORS.white,
    fontSize: 18,
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 72,
    height: 72,
    marginBottom: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  heading: {
    fontFamily: FONTS.bold,
    color: COLORS.white,
    fontSize: 30,
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontFamily: FONTS.regular,
    color: COLORS.secondaryText,
    fontSize: 16,
    marginBottom: 32,
  },
  formCard: {
    width: '100%',
  },
  errorBox: {
    backgroundColor: 'rgba(255, 92, 92, 0.12)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 92, 92, 0.3)',
  },
  errorText: {
    fontFamily: FONTS.medium,
    color: '#FF6B6B',
    fontSize: 13,
    textAlign: 'center',
  },
  input: {
    fontFamily: FONTS.regular,
    width: '100%',
    backgroundColor: COLORS.glassBgLight,
    color: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    marginBottom: 12,
    padding: 14,
    borderRadius: 12,
    fontSize: 15,
  },
  linkText: {
    fontFamily: FONTS.regular,
    color: COLORS.secondaryText,
    fontSize: 15,
  },
  linkAccent: {
    fontFamily: FONTS.bold,
    color: COLORS.accent,
  },
  footerBadge: {
    marginTop: 36,
    alignItems: 'center',
  },
  footerBadgeTitle: {
    fontFamily: FONTS.semibold,
    color: COLORS.white,
    fontSize: 15,
  },
  footerBadgeSub: {
    fontFamily: FONTS.regular,
    color: COLORS.secondaryText,
    fontSize: 13,
    marginTop: 4,
  },
});
