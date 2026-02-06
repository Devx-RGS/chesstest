import React from "react";
import { View, ViewProps, StyleProp, ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

interface GlassCardProps extends ViewProps {
    children: React.ReactNode;
    variant?: "light" | "medium" | "dark";
    gradient?: boolean;
    gradientColors?: string[];
    borderRadius?: number;
    padding?: number;
    style?: StyleProp<ViewStyle>;
}

export function GlassCard({
    children,
    variant = "light",
    gradient = false,
    gradientColors,
    borderRadius = 16,
    padding = 16,
    style,
    ...props
}: GlassCardProps) {
    const getBackgroundColor = () => {
        switch (variant) {
            case "light":
                return "rgba(255, 255, 255, 0.05)";
            case "medium":
                return "rgba(255, 255, 255, 0.1)";
            case "dark":
                return "rgba(0, 0, 0, 0.3)";
            default:
                return "rgba(255, 255, 255, 0.05)";
        }
    };

    const containerStyle: ViewStyle = {
        borderRadius,
        padding,
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.1)",
        overflow: "hidden",
    };

    if (gradient) {
        const colors = (gradientColors || [
            "rgba(123, 47, 247, 0.2)",
            "rgba(0, 217, 255, 0.1)",
        ]) as [string, string, ...string[]];

        return (
            <LinearGradient
                colors={colors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[containerStyle, style as ViewStyle]}
            >
                {children}
            </LinearGradient>
        );
    }

    return (
        <View
            style={[
                containerStyle,
                { backgroundColor: getBackgroundColor() },
                style,
            ]}
            {...props}
        >
            {children}
        </View>
    );
}
