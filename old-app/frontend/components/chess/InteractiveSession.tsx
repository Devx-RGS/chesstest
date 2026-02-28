/**
 * InteractiveSession — Full-screen modal overlay for chess challenges
 *
 * Premium UI with glassmorphism, animated game-over cards,
 * retry/go-back buttons, and polished move history.
 */

import React, { useEffect, useCallback, useRef, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    ScrollView,
    Dimensions,
    Animated,
    Easing,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { X, RotateCcw, ArrowLeft, Trophy, Skull, Handshake, AlertTriangle, Zap } from 'lucide-react-native';
import { useGameStore, SessionStatus } from '@/stores/gameStore';
import {
    getStatusColor,
    getStatusLabel,
    formatUCIMove,
} from '@/services/EvaluationController';
import ChessBoard from './ChessBoard';
import EvalBar from './EvalBar';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ============== TYPES ==============

interface InteractiveSessionProps {
    visible: boolean;
    onSessionEnd: () => void;
    title?: string;
    description?: string;
}

// ============== COMPONENT ==============

export default function InteractiveSession({
    visible,
    onSessionEnd,
    title,
    description,
}: InteractiveSessionProps) {
    // Store state
    const sessionStatus = useGameStore((s) => s.sessionStatus);
    const evaluation = useGameStore((s) => s.evaluation);
    const moveHistory = useGameStore((s) => s.moveHistory);
    const playerColor = useGameStore((s) => s.playerColor);
    const gameOverMessage = useGameStore((s) => s.gameOverMessage);
    const endSession = useGameStore((s) => s.endSession);
    const restartSession = useGameStore((s) => s.restartSession);
    const reset = useGameStore((s) => s.reset);

    // Animations
    const backdropOpacity = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
    const overlayOpacity = useRef(new Animated.Value(0)).current;
    const overlayScale = useRef(new Animated.Value(0.8)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const moveListRef = useRef<ScrollView>(null);

    // Slide in/out
    useEffect(() => {
        Animated.timing(backdropOpacity, {
            toValue: visible ? 1 : 0,
            duration: 300,
            useNativeDriver: true,
        }).start();
        Animated.spring(slideAnim, {
            toValue: visible ? 0 : SCREEN_HEIGHT,
            useNativeDriver: true,
            tension: 65,
            friction: 11,
        }).start();
    }, [visible]);

    // Game-over / collapsed overlay animation
    const isTerminal = sessionStatus === 'checkmate' || sessionStatus === 'stalemate'
        || sessionStatus === 'draw' || sessionStatus === 'collapsed';

    useEffect(() => {
        if (isTerminal) {
            overlayOpacity.setValue(0);
            overlayScale.setValue(0.8);
            Animated.parallel([
                Animated.timing(overlayOpacity, {
                    toValue: 1,
                    duration: 400,
                    useNativeDriver: true,
                }),
                Animated.spring(overlayScale, {
                    toValue: 1,
                    useNativeDriver: true,
                    tension: 60,
                    friction: 8,
                }),
            ]).start();
        } else {
            overlayOpacity.setValue(0);
            overlayScale.setValue(0.8);
        }
    }, [isTerminal]);

    // Pulse animation for warning status badge
    useEffect(() => {
        if (sessionStatus === 'warning') {
            const loop = Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, {
                        toValue: 1.05,
                        duration: 600,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                    Animated.timing(pulseAnim, {
                        toValue: 1,
                        duration: 600,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                ])
            );
            loop.start();
            return () => loop.stop();
        } else {
            pulseAnim.setValue(1);
        }
    }, [sessionStatus]);

    // Watch for session end → notify parent
    useEffect(() => {
        if (sessionStatus === 'ended') {
            const timer = setTimeout(() => {
                onSessionEnd();
                setTimeout(() => reset(), 500);
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [sessionStatus, onSessionEnd, reset]);

    // Haptic feedback
    useEffect(() => {
        if (sessionStatus === 'warning') {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        } else if (sessionStatus === 'collapsed') {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        } else if (sessionStatus === 'checkmate') {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } else if (sessionStatus === 'stalemate' || sessionStatus === 'draw') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }
    }, [sessionStatus]);

    // Auto-scroll move list
    useEffect(() => {
        if (moveHistory.length > 0) {
            setTimeout(() => moveListRef.current?.scrollToEnd({ animated: true }), 100);
        }
    }, [moveHistory.length]);

    const handleClose = useCallback(() => {
        endSession();
    }, [endSession]);

    const handleRetry = useCallback(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        restartSession();
    }, [restartSession]);

    const handleGoBack = useCallback(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        endSession();
    }, [endSession]);

    // Status badge config
    const statusColor = evaluation ? getStatusColor(evaluation.status) : '#888';
    const statusLabel = evaluation ? getStatusLabel(evaluation.status) : '● Analyzing...';

    // Best move hint
    const bestMoveHint = evaluation?.bestMove
        ? formatUCIMove(evaluation.bestMove)
        : null;

    // Game-over overlay config
    const getOverlayConfig = () => {
        if (sessionStatus === 'checkmate') {
            const playerWon = gameOverMessage?.includes('win');
            return {
                gradient: playerWon
                    ? ['rgba(46, 125, 50, 0.95)', 'rgba(27, 94, 32, 0.98)'] as const
                    : ['rgba(183, 28, 28, 0.95)', 'rgba(136, 14, 14, 0.98)'] as const,
                icon: playerWon ? <Trophy size={48} color="#FFD700" /> : <Skull size={48} color="#fff" />,
                title: playerWon ? 'Checkmate!' : 'Checkmate',
                subtitle: playerWon ? 'Brilliant play! You solved it.' : 'Better luck next time.',
                accentColor: playerWon ? '#FFD700' : '#FF8A80',
            };
        }
        if (sessionStatus === 'stalemate') {
            return {
                gradient: ['rgba(66, 66, 66, 0.95)', 'rgba(33, 33, 33, 0.98)'] as const,
                icon: <Handshake size={48} color="#B0BEC5" />,
                title: 'Stalemate',
                subtitle: 'The game ended in a draw.',
                accentColor: '#B0BEC5',
            };
        }
        if (sessionStatus === 'draw') {
            return {
                gradient: ['rgba(66, 66, 66, 0.95)', 'rgba(33, 33, 33, 0.98)'] as const,
                icon: <Handshake size={48} color="#B0BEC5" />,
                title: 'Draw',
                subtitle: 'No winner this time.',
                accentColor: '#B0BEC5',
            };
        }
        if (sessionStatus === 'collapsed') {
            return {
                gradient: ['rgba(183, 28, 28, 0.95)', 'rgba(136, 14, 14, 0.98)'] as const,
                icon: <Zap size={48} color="#FF8A80" />,
                title: 'Position Collapsed!',
                subtitle: 'Your evaluation dropped too far.',
                accentColor: '#FF8A80',
            };
        }
        return null;
    };

    const overlayConfig = isTerminal ? getOverlayConfig() : null;

    return (
        <Modal
            visible={visible && sessionStatus !== 'ended'}
            transparent
            animationType="none"
            statusBarTranslucent
        >
            {/* Backdrop */}
            <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]} />

            {/* Main Content */}
            <Animated.View style={[styles.container, { transform: [{ translateY: slideAnim }] }]}>
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.headerLeft}>
                        <Text style={styles.title} numberOfLines={1}>
                            {title || '♟ Chess Challenge'}
                        </Text>
                    </View>
                    <TouchableOpacity
                        onPress={handleClose}
                        style={styles.closeButton}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <X size={18} color="#fff" />
                    </TouchableOpacity>
                </View>

                {/* Status Badge */}
                <Animated.View style={[
                    styles.statusBadge,
                    {
                        backgroundColor: statusColor + '15',
                        borderColor: statusColor + '40',
                        transform: [{ scale: pulseAnim }],
                    }
                ]}>
                    <View style={styles.statusLeft}>
                        <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                        <Text style={[styles.statusText, { color: statusColor }]}>
                            {statusLabel}
                        </Text>
                    </View>
                    <View style={styles.playerBadge}>
                        <Text style={styles.playerBadgeText}>
                            {playerColor === 'w' ? '♔ White' : '♚ Black'}
                        </Text>
                    </View>
                </Animated.View>

                {/* Board Area */}
                <View style={styles.boardArea}>
                    <EvalBar evaluation={evaluation} height={SCREEN_WIDTH * 0.85} />
                    <View style={styles.boardWrapper}>
                        <ChessBoard />
                    </View>
                </View>

                {/* Best Move Hint */}
                {bestMoveHint && (
                    <View style={styles.hintContainer}>
                        <Text style={styles.hintIcon}>💡</Text>
                        <Text style={styles.hintLabel}>Best move:</Text>
                        <Text style={styles.hintMove}>{bestMoveHint}</Text>
                    </View>
                )}

                {/* Move History */}
                <View style={styles.moveHistoryContainer}>
                    <View style={styles.moveHistoryHeader}>
                        <Text style={styles.moveHistoryTitle}>Moves</Text>
                        <Text style={styles.moveCount}>{moveHistory.length}</Text>
                    </View>
                    <ScrollView
                        ref={moveListRef}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.moveList}
                    >
                        {moveHistory.length === 0 ? (
                            <Text style={styles.noMoves}>Your move...</Text>
                        ) : (
                            moveHistory.map((move, idx) => (
                                <View
                                    key={idx}
                                    style={[
                                        styles.moveBadge,
                                        move.color === 'w'
                                            ? styles.whiteMoveChip
                                            : styles.blackMoveChip,
                                    ]}
                                >
                                    <Text style={styles.moveNumber}>
                                        {Math.ceil((idx + 1) / 2)}{move.color === 'b' ? '...' : '.'}
                                    </Text>
                                    <Text style={[
                                        styles.moveText,
                                        { color: move.color === 'w' ? '#1a1a1a' : '#f5f5f5' },
                                    ]}>
                                        {move.san}
                                    </Text>
                                </View>
                            ))
                        )}
                    </ScrollView>
                </View>

                {/* ======= GAME-OVER / COLLAPSED OVERLAY ======= */}
                {isTerminal && overlayConfig && (
                    <Animated.View style={[
                        styles.overlayContainer,
                        {
                            opacity: overlayOpacity,
                        }
                    ]}>
                        <LinearGradient
                            colors={[...overlayConfig.gradient]}
                            style={styles.overlayGradient}
                        >
                            <Animated.View style={[
                                styles.overlayCard,
                                { transform: [{ scale: overlayScale }] }
                            ]}>
                                {/* Icon */}
                                <View style={[styles.overlayIconCircle, { borderColor: overlayConfig.accentColor + '40' }]}>
                                    {overlayConfig.icon}
                                </View>

                                {/* Title */}
                                <Text style={[styles.overlayTitle, { color: overlayConfig.accentColor }]}>
                                    {overlayConfig.title}
                                </Text>

                                {/* Subtitle */}
                                <Text style={styles.overlaySubtitle}>
                                    {overlayConfig.subtitle}
                                </Text>

                                {/* Score summary */}
                                {evaluation && (
                                    <View style={styles.scoreSummary}>
                                        <View style={styles.scoreItem}>
                                            <Text style={styles.scoreLabel}>Eval</Text>
                                            <Text style={[styles.scoreValue, { color: overlayConfig.accentColor }]}>
                                                {evaluation.scorePawns > 0 ? '+' : ''}{evaluation.scorePawns.toFixed(1)}
                                            </Text>
                                        </View>
                                        <View style={styles.scoreDivider} />
                                        <View style={styles.scoreItem}>
                                            <Text style={styles.scoreLabel}>Moves</Text>
                                            <Text style={[styles.scoreValue, { color: overlayConfig.accentColor }]}>
                                                {moveHistory.length}
                                            </Text>
                                        </View>
                                        <View style={styles.scoreDivider} />
                                        <View style={styles.scoreItem}>
                                            <Text style={styles.scoreLabel}>Depth</Text>
                                            <Text style={[styles.scoreValue, { color: overlayConfig.accentColor }]}>
                                                {evaluation.depth}
                                            </Text>
                                        </View>
                                    </View>
                                )}

                                {/* Action Buttons */}
                                <View style={styles.overlayActions}>
                                    <TouchableOpacity
                                        style={[styles.actionBtn, styles.retryBtn]}
                                        onPress={handleRetry}
                                        activeOpacity={0.8}
                                    >
                                        <RotateCcw size={18} color="#fff" />
                                        <Text style={styles.retryBtnText}>Try Again</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.actionBtn, styles.backBtn]}
                                        onPress={handleGoBack}
                                        activeOpacity={0.8}
                                    >
                                        <ArrowLeft size={18} color="#ccc" />
                                        <Text style={styles.backBtnText}>Back to Reel</Text>
                                    </TouchableOpacity>
                                </View>
                            </Animated.View>
                        </LinearGradient>
                    </Animated.View>
                )}
            </Animated.View>
        </Modal>
    );
}

// ============== STYLES ==============

const styles = StyleSheet.create({
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.92)',
    },
    container: {
        flex: 1,
        paddingTop: 52,
        paddingHorizontal: 14,
        paddingBottom: 16,
    },

    // ---- Header ----
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    headerLeft: {
        flex: 1,
        marginRight: 12,
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        color: '#fff',
        letterSpacing: 0.3,
    },
    closeButton: {
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.12)',
        alignItems: 'center',
        justifyContent: 'center',
    },

    // ---- Status Badge ----
    statusBadge: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 10,
        borderWidth: 1,
        marginBottom: 10,
    },
    statusLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    statusText: {
        fontSize: 13,
        fontWeight: '700',
        letterSpacing: 0.2,
    },
    playerBadge: {
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6,
    },
    playerBadgeText: {
        fontSize: 12,
        color: '#ccc',
        fontWeight: '600',
    },

    // ---- Board Area ----
    boardArea: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
    },
    boardWrapper: {
        flex: 1,
        alignItems: 'center',
    },

    // ---- Best Move Hint ----
    hintContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 193, 7, 0.1)',
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 8,
        marginTop: 10,
        borderWidth: 1,
        borderColor: 'rgba(255, 193, 7, 0.2)',
        gap: 6,
    },
    hintIcon: {
        fontSize: 16,
    },
    hintLabel: {
        fontSize: 12,
        color: '#FFC107',
        fontWeight: '500',
    },
    hintMove: {
        fontSize: 14,
        color: '#FFD54F',
        fontWeight: '800',
        fontFamily: 'monospace',
        letterSpacing: 0.5,
    },

    // ---- Move History ----
    moveHistoryContainer: {
        marginTop: 10,
    },
    moveHistoryHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 6,
    },
    moveHistoryTitle: {
        fontSize: 12,
        fontWeight: '700',
        color: '#666',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    moveCount: {
        fontSize: 11,
        fontWeight: '600',
        color: '#555',
        backgroundColor: 'rgba(255,255,255,0.06)',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
        overflow: 'hidden',
    },
    moveList: {
        flexDirection: 'row',
        gap: 5,
        paddingVertical: 2,
    },
    noMoves: {
        fontSize: 13,
        color: '#555',
        fontStyle: 'italic',
    },
    moveBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 5,
        borderRadius: 8,
        gap: 3,
    },
    whiteMoveChip: {
        backgroundColor: '#f0f0f0',
    },
    blackMoveChip: {
        backgroundColor: '#2a2a2a',
        borderWidth: 1,
        borderColor: '#444',
    },
    moveNumber: {
        fontSize: 10,
        color: '#888',
        fontFamily: 'monospace',
    },
    moveText: {
        fontSize: 13,
        fontWeight: '700',
        fontFamily: 'monospace',
    },

    // ---- Game-Over / Collapsed Overlay ----
    overlayContainer: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 100,
    },
    overlayGradient: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 32,
    },
    overlayCard: {
        alignItems: 'center',
        width: '100%',
        maxWidth: 320,
    },
    overlayIconCircle: {
        width: 88,
        height: 88,
        borderRadius: 44,
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        borderWidth: 2,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    overlayTitle: {
        fontSize: 32,
        fontWeight: '900',
        letterSpacing: 0.5,
        marginBottom: 8,
        textAlign: 'center',
    },
    overlaySubtitle: {
        fontSize: 15,
        color: 'rgba(255, 255, 255, 0.7)',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 24,
    },

    // Score summary row
    scoreSummary: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        borderRadius: 12,
        paddingVertical: 12,
        paddingHorizontal: 20,
        marginBottom: 28,
        gap: 16,
    },
    scoreItem: {
        alignItems: 'center',
        flex: 1,
    },
    scoreLabel: {
        fontSize: 10,
        color: 'rgba(255, 255, 255, 0.5)',
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 4,
    },
    scoreValue: {
        fontSize: 20,
        fontWeight: '800',
        fontFamily: 'monospace',
    },
    scoreDivider: {
        width: 1,
        height: 28,
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
    },

    // Action buttons
    overlayActions: {
        width: '100%',
        gap: 10,
    },
    actionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 14,
        gap: 8,
    },
    retryBtn: {
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.25)',
    },
    retryBtnText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#fff',
    },
    backBtn: {
        backgroundColor: 'rgba(255, 255, 255, 0.06)',
    },
    backBtnText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#999',
    },
});
