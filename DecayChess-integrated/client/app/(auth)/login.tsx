// Glassmorphism Login — Updated 2026-02-27
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Image, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from 'expo-linear-gradient';
import { loginUser } from "../lib/APIservice/service";
import { useAuthStore } from "../lib/stores/authStore";
import Skeleton from "../components/ui/Skeleton";
import GlassCard from "../components/ui/GlassCard";
import GlassButton from "../components/ui/GlassButton";
import { COLORS, GLASS, SHADOWS, FONTS } from "../lib/styles/base";
import { Ionicons } from "@expo/vector-icons";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const router = useRouter();

  const handleInputChange = (setter: (val: string) => void) => (value: string) => {
    setErrorMessage(null);
    setter(value);
  };

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [token, user] = await Promise.all([
          AsyncStorage.getItem('token'),
          AsyncStorage.getItem('user'),
        ]);
        if (mounted && token && user) {
          router.replace('/(main)/choose');
        }
      } catch (err) {
        console.error('[Login] ⚠️ Error checking auth state:', err);
      }
    })();
    return () => { mounted = false; };
  }, [router]);

  const validateInputs = (): string | null => {
    if (!email.trim()) return 'Please enter your email';
    if (!EMAIL_REGEX.test(email.trim())) return 'Please enter a valid email address';
    if (!password) return 'Please enter your password';
    return null;
  };

  const handleLogin = async () => {
    if (isLoading) return;
    setErrorMessage(null);
    const validationError = validateInputs();
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    setIsLoading(true);
    let shouldResetLoading = true;

    try {
      const result = await loginUser(email.trim().toLowerCase(), password);
      if (result.success) {
        const data = result.data;
        await AsyncStorage.setItem('token', data.token);
        await AsyncStorage.setItem('user', JSON.stringify(data.user));
        useAuthStore.getState().login(
          {
            id: data.user._id || data.user.id || '',
            username: data.user.name || data.user.username || data.user.email,
            email: data.user.email,
          },
          data.token,
          data.user.isAdmin || data.isAdmin || false,
        );
        shouldResetLoading = false;
        router.replace('/(main)/choose');
      } else {
        setErrorMessage(result.error || 'Login failed. Please try again.');
      }
    } catch (err) {
      setErrorMessage('An unexpected error occurred. Please try again.');
    } finally {
      if (shouldResetLoading) setIsLoading(false);
    }
  };

  const handleGoBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(auth)/signup');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient
        colors={['#080B14', '#0E1228', '#0C0F20', '#080B14']}
        locations={[0, 0.3, 0.7, 1]}
        style={StyleSheet.absoluteFillObject}
      />
      {/* Ambient orbs */}
      <View style={styles.orbTopRight} />
      <View style={styles.orbBottomLeft} />

      <View style={styles.mainContainer}>
        {/* Top bar */}
        <View style={styles.topBar}>
          <TouchableOpacity
            onPress={handleGoBack}
            style={styles.backButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
          <Text style={styles.topTitle}>Login</Text>
          <View style={{ width: 32 }} />
        </View>

        {/* Content */}
        <View style={styles.centerContent}>
          <Image
            source={{ uri: "https://www.chess.com/bundles/web/images/offline-play/standardboard.84a92436.png" }}
            style={styles.logo}
          />
          <Text style={styles.heading}>Welcome Back</Text>
          <Text style={styles.subtitle}>Log in to continue your chess journey</Text>

          {/* Glass Card Form */}
          <GlassCard style={styles.formCard}>
            {errorMessage && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>⚠️ {errorMessage}</Text>
              </View>
            )}

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
              style={[styles.input, { marginBottom: 20 }]}
              secureTextEntry
              editable={!isLoading}
            />

            <GlassButton
              label="Login & Play"
              onPress={handleLogin}
              loading={isLoading}
              disabled={isLoading}
              fullWidth
            />
          </GlassCard>

          <TouchableOpacity onPress={() => router.push("/(auth)/signup")} style={{ marginTop: 20 }}>
            <Text style={styles.linkText}>
              Don't have an account? <Text style={styles.linkAccent}>Sign up</Text>
            </Text>
          </TouchableOpacity>

          <View style={styles.footerBadge}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
              <Ionicons name="trophy" size={18} color={COLORS.accent} style={{ marginRight: 8 }} />
              <Text style={styles.footerBadgeTitle}>Compete, win, and climb!</Text>
            </View>
            <Text style={styles.footerBadgeSub}>Track your stats and earn rewards.</Text>
          </View>
        </View>
      </View>

      {/* Loading overlay */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingCard}>
            <Skeleton width={64} height={64} borderRadius={16} style={styles.loadingLineCentered} />
            <Skeleton width="65%" height={24} style={styles.loadingLine} />
            <Skeleton width="80%" height={16} style={styles.loadingLine} />
            <Skeleton width="100%" height={48} style={styles.loadingLine} />
            <Skeleton width="100%" height={48} style={styles.loadingLine} />
            <Skeleton width="70%" height={48} style={{ marginBottom: 0, borderRadius: 12 }} />
          </View>
        </View>
      )}
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
  backButton: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: COLORS.glassBg,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backArrow: {
    color: COLORS.accent,
    fontSize: 16,
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
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  loadingCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: GLASS.borderRadius,
    padding: 24,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  loadingLine: {
    marginBottom: 16,
    borderRadius: 12,
  },
  loadingLineCentered: {
    alignSelf: 'center',
    marginBottom: 24,
  },
});
