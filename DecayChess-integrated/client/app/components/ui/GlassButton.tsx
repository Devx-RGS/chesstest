// Premium Glass Button — Rebuilt with icon support and improved animations
import React, { useRef } from 'react';
import {
    Animated,
    ActivityIndicator,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    type ViewStyle,
    type TextStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../../lib/styles/base';

interface GlassButtonProps {
    label: string;
    onPress: () => void;
    variant?: 'primary' | 'secondary' | 'ghost';
    disabled?: boolean;
    loading?: boolean;
    style?: ViewStyle;
    textStyle?: TextStyle;
    fullWidth?: boolean;
    icon?: string;
    iconSize?: number;
}

export default function GlassButton({
    label,
    onPress,
    variant = 'primary',
    disabled = false,
    loading = false,
    style,
    textStyle,
    fullWidth = false,
    icon,
    iconSize = 18,
}: GlassButtonProps) {
    const scaleAnim = useRef(new Animated.Value(1)).current;

    const handlePressIn = () => {
        Animated.spring(scaleAnim, {
            toValue: 0.96,
            useNativeDriver: true,
            speed: 50,
            bounciness: 4,
        }).start();
    };

    const handlePressOut = () => {
        Animated.spring(scaleAnim, {
            toValue: 1,
            useNativeDriver: true,
            speed: 50,
            bounciness: 4,
        }).start();
    };

    const isPrimary = variant === 'primary';
    const isSecondary = variant === 'secondary';

    const ButtonContent = () => (
        <View style={styles.contentRow}>
            {loading ? (
                <ActivityIndicator color={isPrimary ? COLORS.white : COLORS.accent} size="small" />
            ) : (
                <>
                    {icon && (
                        <Ionicons
                            name={icon as any}
                            size={iconSize}
                            color={isPrimary ? COLORS.white : isSecondary ? COLORS.accent : COLORS.secondaryText}
                            style={{ marginRight: 8 }}
                        />
                    )}
                    <Text style={[
                        styles.label,
                        isPrimary && styles.labelPrimary,
                        isSecondary && styles.labelSecondary,
                        !isPrimary && !isSecondary && styles.labelGhost,
                        textStyle,
                    ]}>
                        {label}
                    </Text>
                </>
            )}
        </View>
    );

    return (
        <Animated.View
            style={[
                { transform: [{ scale: scaleAnim }] },
                fullWidth && { width: '100%' },
                style,
            ]}
        >
            <TouchableOpacity
                activeOpacity={0.85}
                onPress={onPress}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                disabled={disabled || loading}
                style={{ opacity: disabled ? 0.5 : 1 }}
            >
                {isPrimary ? (
                    <LinearGradient
                        colors={[COLORS.gradientStart, COLORS.gradientEnd]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.button}
                    >
                        <ButtonContent />
                    </LinearGradient>
                ) : (
                    <View style={[
                        styles.button,
                        isSecondary ? styles.secondaryBg : styles.ghostBg,
                    ]}>
                        <ButtonContent />
                    </View>
                )}
            </TouchableOpacity>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    button: {
        height: 52,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 24,
        ...SHADOWS.glow,
    },
    secondaryBg: {
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        shadowColor: 'transparent',
    },
    ghostBg: {
        backgroundColor: 'transparent',
        shadowColor: 'transparent',
    },
    contentRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    label: {
        fontSize: 16,
        fontWeight: '700',
        letterSpacing: 0.3,
    },
    labelPrimary: {
        color: COLORS.white,
    },
    labelSecondary: {
        color: COLORS.accent,
    },
    labelGhost: {
        color: COLORS.secondaryText,
    },
});
