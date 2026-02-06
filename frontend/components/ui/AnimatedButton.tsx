import React, { useRef, useEffect } from "react";
import {
    TouchableOpacity,
    Text,
    ViewStyle,
    TextStyle,
    Animated,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useHaptics } from "@/hooks/useHaptics";
import { colors } from "@/constants/themes";

interface AnimatedButtonProps {
    title: string;
    onPress: () => void;
    variant?: "primary" | "secondary" | "outline";
    size?: "sm" | "md" | "lg";
    disabled?: boolean;
    loading?: boolean;
    icon?: React.ReactNode;
    style?: ViewStyle;
}

export function AnimatedButton({
    title,
    onPress,
    variant = "primary",
    size = "md",
    disabled = false,
    loading = false,
    icon,
    style,
}: AnimatedButtonProps) {
    const { triggerHaptic } = useHaptics();
    const scaleAnim = useRef(new Animated.Value(1)).current;

    const handlePressIn = () => {
        Animated.spring(scaleAnim, {
            toValue: 0.95,
            friction: 8,
            useNativeDriver: true,
        }).start();
    };

    const handlePressOut = () => {
        Animated.spring(scaleAnim, {
            toValue: 1,
            friction: 8,
            useNativeDriver: true,
        }).start();
    };

    const handlePress = () => {
        if (!disabled && !loading) {
            triggerHaptic("medium");
            onPress();
        }
    };

    const sizeStyles: Record<string, { paddingVertical: number; paddingHorizontal: number; fontSize: number }> = {
        sm: { paddingVertical: 8, paddingHorizontal: 16, fontSize: 14 },
        md: { paddingVertical: 12, paddingHorizontal: 24, fontSize: 16 },
        lg: { paddingVertical: 16, paddingHorizontal: 32, fontSize: 18 },
    };

    const currentSize = sizeStyles[size];

    const getButtonContent = () => (
        <>
            {icon && <>{icon}</>}
            <Text
                style={{
                    color: variant === "outline" ? colors.accent.purple : colors.text.primary,
                    fontSize: currentSize.fontSize,
                    fontWeight: "700",
                    marginLeft: icon ? 8 : 0,
                }}
            >
                {loading ? "Loading..." : title}
            </Text>
        </>
    );

    if (variant === "primary") {
        return (
            <Animated.View style={[{ transform: [{ scale: scaleAnim }] }, style]}>
                <TouchableOpacity
                    onPress={handlePress}
                    onPressIn={handlePressIn}
                    onPressOut={handlePressOut}
                    disabled={disabled || loading}
                    activeOpacity={0.9}
                >
                    <LinearGradient
                        colors={
                            disabled
                                ? [colors.glass.medium, colors.glass.medium]
                                : [colors.accent.purple, colors.accent.cyan] as [string, string]
                        }
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={{
                            paddingVertical: currentSize.paddingVertical,
                            paddingHorizontal: currentSize.paddingHorizontal,
                            borderRadius: 12,
                            flexDirection: "row",
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                    >
                        {getButtonContent()}
                    </LinearGradient>
                </TouchableOpacity>
            </Animated.View>
        );
    }

    return (
        <Animated.View style={[{ transform: [{ scale: scaleAnim }] }, style]}>
            <TouchableOpacity
                onPress={handlePress}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                disabled={disabled || loading}
                activeOpacity={0.9}
                style={{
                    paddingVertical: currentSize.paddingVertical,
                    paddingHorizontal: currentSize.paddingHorizontal,
                    borderRadius: 12,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor:
                        variant === "secondary" ? colors.glass.light : "transparent",
                    borderWidth: variant === "outline" ? 2 : 0,
                    borderColor: colors.accent.purple,
                }}
            >
                {getButtonContent()}
            </TouchableOpacity>
        </Animated.View>
    );
}
