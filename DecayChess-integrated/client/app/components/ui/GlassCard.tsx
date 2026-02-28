// Premium Glass Card — Rebuilt with layered glassmorphism
import React from 'react';
import { Platform, StyleSheet, View, type ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { COLORS, GLASS, SHADOWS } from '../../lib/styles/base';

interface GlassCardProps {
    children: React.ReactNode;
    style?: ViewStyle | ViewStyle[];
    intensity?: number;
    borderGlow?: boolean;
    noPadding?: boolean;
    elevated?: boolean;
}

export default function GlassCard({
    children,
    style,
    intensity = GLASS.blur,
    borderGlow = false,
    noPadding = false,
    elevated = false,
}: GlassCardProps) {
    const outerStyle = [
        styles.outer,
        borderGlow && styles.borderGlow,
        elevated && styles.elevated,
        ...(Array.isArray(style) ? style : style ? [style] : []),
    ];

    const paddingStyle = noPadding ? undefined : styles.withPadding;

    // Android fallback (no blur)
    if (Platform.OS === 'android') {
        return (
            <View style={[outerStyle, styles.androidFill]}>
                <View style={[styles.innerHighlight, paddingStyle]}>
                    {children}
                </View>
            </View>
        );
    }

    return (
        <View style={outerStyle}>
            <BlurView
                intensity={intensity}
                tint={GLASS.tint}
                style={styles.blur}
            >
                <View style={[styles.overlay, paddingStyle]}>
                    <View style={styles.innerHighlight}>
                        {children}
                    </View>
                </View>
            </BlurView>
        </View>
    );
}

const styles = StyleSheet.create({
    outer: {
        borderRadius: 18,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.07)',
        overflow: 'hidden',
    },
    blur: {
        borderRadius: 18,
        overflow: 'hidden',
    },
    overlay: {
        backgroundColor: 'rgba(255,255,255,0.03)',
    },
    innerHighlight: {
        // Subtle top inner highlight for depth
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: 'rgba(255,255,255,0.06)',
    },
    withPadding: {
        padding: 16,
    },
    borderGlow: {
        borderColor: COLORS.accentDim,
        ...SHADOWS.glow,
    },
    elevated: {
        ...SHADOWS.medium,
    },
    androidFill: {
        backgroundColor: 'rgba(23, 29, 51, 0.92)',
    },
});
