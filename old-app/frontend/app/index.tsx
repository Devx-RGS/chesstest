import React, { useEffect, useRef } from "react";
import { View, Text, Dimensions, Animated } from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useAuthStore } from "@/stores/authStore";
import { AnimatedButton } from "@/components/ui/AnimatedButton";
import { colors } from "@/constants/themes";
import { Crown, Swords, Zap } from "lucide-react-native";

const { width } = Dimensions.get("window");

export default function SplashScreen() {
    const router = useRouter();
    const { isAuthenticated } = useAuthStore();

    const logoScale = useRef(new Animated.Value(0)).current;
    const logoRotate = useRef(new Animated.Value(0)).current;
    const textOpacity = useRef(new Animated.Value(0)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Animate logo
        Animated.sequence([
            Animated.spring(logoScale, {
                toValue: 1.2,
                friction: 4,
                useNativeDriver: true,
            }),
            Animated.timing(logoScale, {
                toValue: 1,
                duration: 200,
                useNativeDriver: true,
            }),
        ]).start();

        Animated.timing(logoRotate, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
        }).start();

        // Animate text
        Animated.timing(textOpacity, {
            toValue: 1,
            duration: 500,
            delay: 500,
            useNativeDriver: true,
        }).start();

        // Fade in content
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
        }).start();
    }, []);

    const rotateInterpolate = logoRotate.interpolate({
        inputRange: [0, 1],
        outputRange: ["0deg", "360deg"],
    });

    const handleGetStarted = () => {
        if (isAuthenticated) {
            router.replace("/(tabs)");
        } else {
            router.push("/(auth)/login");
        }
    };

    const features = [
        { icon: Crown, text: "Play ranked games" },
        { icon: Swords, text: "Challenge friends" },
        { icon: Zap, text: "Real-time matches" },
    ];

    return (
        <LinearGradient
            colors={[colors.background.primary, colors.background.secondary]}
            style={{ flex: 1 }}
        >
            <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24 }}>
                {/* Logo */}
                <Animated.View
                    style={{
                        transform: [
                            { scale: logoScale },
                            { rotate: rotateInterpolate },
                        ],
                        marginBottom: 32,
                    }}
                >
                    <LinearGradient
                        colors={[colors.accent.purple, colors.accent.cyan] as [string, string]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={{
                            width: 100,
                            height: 100,
                            borderRadius: 24,
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                    >
                        <Text style={{ fontSize: 56 }}>♛</Text>
                    </LinearGradient>
                </Animated.View>

                {/* Title */}
                <Animated.Text
                    style={{
                        opacity: textOpacity,
                        color: colors.text.primary,
                        fontSize: 36,
                        fontWeight: "800",
                        marginBottom: 8,
                    }}
                >
                    Chess Master
                </Animated.Text>

                <Animated.Text
                    style={{
                        opacity: textOpacity,
                        color: colors.text.secondary,
                        fontSize: 16,
                        textAlign: "center",
                        marginBottom: 48,
                    }}
                >
                    Master the game of kings
                </Animated.Text>

                {/* Features */}
                <Animated.View style={{ opacity: fadeAnim, marginBottom: 48 }}>
                    {features.map((feature, index) => (
                        <View
                            key={index}
                            style={{
                                flexDirection: "row",
                                alignItems: "center",
                                marginBottom: 16,
                            }}
                        >
                            <View
                                style={{
                                    width: 40,
                                    height: 40,
                                    borderRadius: 12,
                                    backgroundColor: `${colors.accent.purple}30`,
                                    alignItems: "center",
                                    justifyContent: "center",
                                    marginRight: 12,
                                }}
                            >
                                <feature.icon size={20} color={colors.accent.purple} />
                            </View>
                            <Text style={{ color: colors.text.primary, fontSize: 16 }}>
                                {feature.text}
                            </Text>
                        </View>
                    ))}
                </Animated.View>

                {/* Buttons */}
                <Animated.View style={{ opacity: fadeAnim, width: "100%" }}>
                    <AnimatedButton
                        title="Get Started"
                        size="lg"
                        onPress={handleGetStarted}
                    />

                    <AnimatedButton
                        title="Continue as Guest"
                        variant="outline"
                        size="lg"
                        onPress={() => router.push("/(tabs)")}
                        style={{ marginTop: 12 }}
                    />
                </Animated.View>
            </View>
        </LinearGradient>
    );
}
