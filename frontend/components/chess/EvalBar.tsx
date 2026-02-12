/**
 * EvalBar — Animated vertical evaluation bar
 *
 * Shows the balance of the position as a white/black fill bar.
 * Positive scores fill more white, negative fill more black.
 * Color-coded status indicator (green/yellow/red).
 *
 * Uses standard React Native Animated API for Expo Go compatibility.
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { EvalResult, getStatusColor } from '@/services/EvaluationController';

interface EvalBarProps {
    evaluation: EvalResult | null;
    height?: number;
    width?: number;
}

export default function EvalBar({ evaluation, height = 300, width = 28 }: EvalBarProps) {
    // Percentage of whiteFill (0 to 1). 0.5 = even position.
    const whiteFill = useRef(new Animated.Value(0.5)).current;

    useEffect(() => {
        if (!evaluation) {
            Animated.timing(whiteFill, {
                toValue: 0.5,
                duration: 300,
                useNativeDriver: false, // height percentage can't use native driver
            }).start();
            return;
        }

        // Clamp score to [-5, 5] pawns for display purposes
        const clampedScore = Math.max(-5, Math.min(5, evaluation.scorePawns));
        // Map [-5, 5] → [0, 1] where 0.5 is even
        const fill = 0.5 + (clampedScore / 10);
        const clampedFill = Math.max(0.05, Math.min(0.95, fill));

        Animated.timing(whiteFill, {
            toValue: clampedFill,
            duration: 500,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: false,
        }).start();
    }, [evaluation, whiteFill]);

    // Interpolate fill value to a percentage string for height
    const whiteHeight = whiteFill.interpolate({
        inputRange: [0, 1],
        outputRange: ['0%', '100%'],
    });

    const statusColor = evaluation ? getStatusColor(evaluation.status) : '#888';
    const scoreText = evaluation
        ? evaluation.scorePawns > 0
            ? `+${evaluation.scorePawns.toFixed(1)}`
            : evaluation.scorePawns.toFixed(1)
        : '0.0';

    return (
        <View style={[styles.container, { height, width }]}>
            {/* Score label at top */}
            <Text style={[styles.scoreText, { color: statusColor }]}>{scoreText}</Text>

            {/* Bar */}
            <View style={styles.bar}>
                {/* Black section (top) */}
                <View style={styles.blackSection} />

                {/* White section (bottom, grows upward) */}
                <Animated.View style={[styles.whiteSection, { height: whiteHeight }]} />
            </View>

            {/* Depth indicator */}
            <Text style={styles.depthText}>
                d{evaluation?.depth || 0}
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    scoreText: {
        fontSize: 11,
        fontWeight: '700',
        marginBottom: 4,
        fontFamily: 'monospace',
    },
    bar: {
        flex: 1,
        width: '100%',
        borderRadius: 4,
        overflow: 'hidden',
        backgroundColor: '#333', // Black section color
        borderWidth: 1,
        borderColor: '#555',
    },
    blackSection: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: '#333',
    },
    whiteSection: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#f0f0f0',
    },
    depthText: {
        fontSize: 9,
        color: '#888',
        marginTop: 2,
        fontFamily: 'monospace',
    },
});
