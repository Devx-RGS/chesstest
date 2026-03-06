/**
 * CoinRewardPopup — A clean, minimalistic animated popup for coin rewards.
 * Slides in from the top and auto-dismisses after a short delay.
 */
import React, { useEffect, useRef } from "react";
import {
    Animated,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { COLORS, FONTS, GLASS } from "../../lib/styles/base";

interface CoinRewardPopupProps {
    visible: boolean;
    message?: string;
    amount?: number;
    onDismiss?: () => void;
    duration?: number;
}

export default function CoinRewardPopup({
    visible,
    message = "Daily login reward!",
    amount = 1,
    onDismiss,
    duration = 2500,
}: CoinRewardPopupProps) {
    const translateY = useRef(new Animated.Value(-120)).current;
    const opacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            // Slide in
            Animated.parallel([
                Animated.spring(translateY, {
                    toValue: 0,
                    tension: 60,
                    friction: 9,
                    useNativeDriver: true,
                }),
                Animated.timing(opacity, {
                    toValue: 1,
                    duration: 250,
                    useNativeDriver: true,
                }),
            ]).start();

            // Auto-dismiss
            const timer = setTimeout(() => {
                dismiss();
            }, duration);

            return () => clearTimeout(timer);
        }
    }, [visible]);

    const dismiss = () => {
        Animated.parallel([
            Animated.timing(translateY, {
                toValue: -120,
                duration: 300,
                useNativeDriver: true,
            }),
            Animated.timing(opacity, {
                toValue: 0,
                duration: 250,
                useNativeDriver: true,
            }),
        ]).start(() => {
            onDismiss?.();
        });
    };

    if (!visible) return null;

    return (
        <View style={styles.container} pointerEvents="none">
            <Animated.View
                style={[
                    styles.animatedWrap,
                    {
                        transform: [{ translateY }],
                        opacity,
                    },
                ]}
            >
                <View style={styles.card}>
                    {/* Coin icon */}
                    <View style={styles.iconWrap}>
                        <Text style={styles.coinEmoji}>🪙</Text>
                    </View>

                    {/* Text content */}
                    <View style={styles.textWrap}>
                        <Text style={styles.amountText}>+{amount} Coin</Text>
                        <Text style={styles.messageText}>{message}</Text>
                    </View>
                </View>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: "absolute",
        top: 60,
        left: 20,
        right: 20,
        zIndex: 9999,
        elevation: 9999,
        alignItems: "center",
    },
    animatedWrap: {
        width: "100%",
    },
    card: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: COLORS.surfaceLight,
        borderRadius: GLASS.borderRadius,
        borderWidth: 1,
        borderColor: "rgba(245, 166, 35, 0.2)",
        paddingHorizontal: 18,
        paddingVertical: 14,
        gap: 14,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 10,
    },
    iconWrap: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: "rgba(245, 166, 35, 0.12)",
        alignItems: "center",
        justifyContent: "center",
    },
    coinEmoji: {
        fontSize: 22,
    },
    textWrap: {
        flex: 1,
    },
    amountText: {
        fontFamily: FONTS.bold,
        fontSize: 18,
        color: COLORS.accent,
        letterSpacing: 0.3,
    },
    messageText: {
        fontFamily: FONTS.regular,
        fontSize: 13,
        color: COLORS.secondaryText,
        marginTop: 2,
    },
});
