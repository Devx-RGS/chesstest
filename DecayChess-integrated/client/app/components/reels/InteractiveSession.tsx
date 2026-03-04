/**
 * InteractiveSession — Full-screen modal overlay for chess challenges
 *
 * Premium UI with glassmorphism, animated game-over cards,
 * retry/go-back buttons, and polished move history.
 * Uses Ionicons instead of lucide-react-native.
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
import { Ionicons } from '@expo/vector-icons';
import { useGameStore, SessionStatus } from '../../lib/stores/gameStore';
import { useCoinStore } from '../../lib/stores/coinStore';
import { useSpendCoins } from '../../lib/services/coinApi';
import {
    getStatusColor,
    getStatusLabel,
    formatUCIMove,
} from '../../lib/services/EvaluationController';
import ChessBoard from './ChessBoard';
import EvalBar from './EvalBar';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface InteractiveSessionProps {
    visible: boolean;
    onSessionEnd: () => void;
    title?: string;
    description?: string;
    whitePlayer?: string;
    blackPlayer?: string;
    timeLimit?: number | null;
}

export default function InteractiveSession({
    visible,
    onSessionEnd,
    title,
    description,
    whitePlayer,
    blackPlayer,
    timeLimit,
}: InteractiveSessionProps) {
    const sessionStatus = useGameStore((s) => s.sessionStatus);
    const evaluation = useGameStore((s) => s.evaluation);
    const moveHistory = useGameStore((s) => s.moveHistory);
    const playerColor = useGameStore((s) => s.playerColor);
    const gameOverMessage = useGameStore((s) => s.gameOverMessage);
    const endSession = useGameStore((s) => s.endSession);
    const restartSession = useGameStore((s) => s.restartSession);
    const reset = useGameStore((s) => s.reset);

    const backdropOpacity = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
    const overlayOpacity = useRef(new Animated.Value(0)).current;
    const overlayScale = useRef(new Animated.Value(0.8)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const moveListRef = useRef<ScrollView>(null);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
    const [showHintConfirm, setShowHintConfirm] = useState(false);
    const [hintRevealed, setHintRevealed] = useState(false);
    const [hintError, setHintError] = useState<string | null>(null);

    const HINT_COST = 3;

    // Coin store + API
    const coinBalance = useCoinStore((s) => s.balance);
    const optimisticSpend = useCoinStore((s) => s.optimisticSpend);
    const rollbackSpend = useCoinStore((s) => s.rollbackSpend);
    const updateCoinBalance = useCoinStore((s) => s.updateBalance);
    const fetchCoinBalance = useCoinStore((s) => s.fetchBalance);
    const spendCoinsMutation = useSpendCoins();

    // Refresh coin balance when session opens
    useEffect(() => {
        if (visible) fetchCoinBalance();
    }, [visible]);

    const isTerminal = sessionStatus === 'checkmate' || sessionStatus === 'stalemate'
        || sessionStatus === 'draw' || sessionStatus === 'collapsed';

    // Initialize / reset timer when session starts or restarts
    useEffect(() => {
        if (visible && timeLimit && timeLimit > 0 && sessionStatus !== 'ended') {
            setTimeRemaining(timeLimit);
        }
    }, [visible, timeLimit, sessionStatus]);

    // Countdown tick
    useEffect(() => {
        if (timeRemaining === null || timeRemaining <= 0 || isTerminal || sessionStatus === 'ended') {
            if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
            return;
        }
        timerRef.current = setInterval(() => {
            setTimeRemaining((prev) => {
                if (prev === null || prev <= 1) {
                    if (timerRef.current) clearInterval(timerRef.current);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => { if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; } };
    }, [timeRemaining, isTerminal, sessionStatus]);

    // Auto-end session when timer hits 0
    useEffect(() => {
        if (timeRemaining === 0 && !isTerminal) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            endSession();
        }
    }, [timeRemaining, isTerminal, endSession]);

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



    useEffect(() => {
        if (isTerminal) {
            overlayOpacity.setValue(0);
            overlayScale.setValue(0.8);
            Animated.parallel([
                Animated.timing(overlayOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
                Animated.spring(overlayScale, { toValue: 1, useNativeDriver: true, tension: 60, friction: 8 }),
            ]).start();
        } else {
            overlayOpacity.setValue(0);
            overlayScale.setValue(0.8);
        }
    }, [isTerminal]);

    useEffect(() => {
        if (sessionStatus === 'warning') {
            const loop = Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, { toValue: 1.05, duration: 600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
                    Animated.timing(pulseAnim, { toValue: 1, duration: 600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
                ])
            );
            loop.start();
            return () => loop.stop();
        } else {
            pulseAnim.setValue(1);
        }
    }, [sessionStatus]);

    useEffect(() => {
        if (sessionStatus === 'ended') {
            const timer = setTimeout(() => {
                onSessionEnd();
                setTimeout(() => reset(), 500);
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [sessionStatus, onSessionEnd, reset]);

    useEffect(() => {
        if (sessionStatus === 'warning') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        else if (sessionStatus === 'collapsed') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        else if (sessionStatus === 'checkmate') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        else if (sessionStatus === 'stalemate' || sessionStatus === 'draw') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }, [sessionStatus]);

    useEffect(() => {
        if (moveHistory.length > 0) {
            setTimeout(() => moveListRef.current?.scrollToEnd({ animated: true }), 100);
            // Reset timer on each move
            if (timeLimit && timeLimit > 0 && !isTerminal) {
                setTimeRemaining(timeLimit);
            }
        }
    }, [moveHistory.length]);

    const handleClose = useCallback(() => endSession(), [endSession]);
    const handleRetry = useCallback(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setHintRevealed(false);
        setHintError(null);
        restartSession();
    }, [restartSession]);
    const handleGoBack = useCallback(() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); endSession(); }, [endSession]);

    // Hint purchase handler
    const handleHintPurchase = useCallback(async () => {
        setHintError(null);
        if (coinBalance < HINT_COST) {
            setHintError('Not enough coins');
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            return;
        }
        optimisticSpend(HINT_COST);
        setShowHintConfirm(false);
        try {
            const result = await spendCoinsMutation.mutateAsync({ amount: HINT_COST, reason: 'hint_used', metadata: { type: 'best_move' } });
            if (result.success) {
                updateCoinBalance(result.newBalance!);
                setHintRevealed(true);
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } else {
                rollbackSpend(HINT_COST);
                setHintError(result.error === 'insufficient_coins' ? 'Not enough coins' : 'Failed to purchase hint');
            }
        } catch (e) {
            rollbackSpend(HINT_COST);
            setHintError('Failed to purchase hint');
            console.warn('[InteractiveSession] Hint purchase failed:', e);
        }
    }, [coinBalance, optimisticSpend, rollbackSpend, updateCoinBalance, spendCoinsMutation]);

    const statusColor = evaluation ? getStatusColor(evaluation.status) : '#888';
    const statusLabel = evaluation ? getStatusLabel(evaluation.status) : '● Analyzing...';
    const bestMoveHint = evaluation?.bestMove ? formatUCIMove(evaluation.bestMove) : null;

    const getOverlayConfig = () => {
        if (sessionStatus === 'checkmate') {
            const playerWon = gameOverMessage?.includes('win');
            return {
                gradient: playerWon
                    ? ['rgba(46, 125, 50, 0.95)', 'rgba(27, 94, 32, 0.98)'] as const
                    : ['rgba(183, 28, 28, 0.95)', 'rgba(136, 14, 14, 0.98)'] as const,
                iconName: playerWon ? 'trophy' as const : 'skull' as const,
                iconColor: playerWon ? '#FFD700' : '#fff',
                title: playerWon ? 'Checkmate!' : 'Checkmate',
                subtitle: playerWon ? 'Brilliant play! You solved it.' : 'Better luck next time.',
                accentColor: playerWon ? '#FFD700' : '#FF8A80',
            };
        }
        if (sessionStatus === 'stalemate' || sessionStatus === 'draw') {
            return {
                gradient: ['rgba(66, 66, 66, 0.95)', 'rgba(33, 33, 33, 0.98)'] as const,
                iconName: 'hand-left' as const,
                iconColor: '#B0BEC5',
                title: sessionStatus === 'stalemate' ? 'Stalemate' : 'Draw',
                subtitle: sessionStatus === 'stalemate' ? 'The game ended in a draw.' : 'No winner this time.',
                accentColor: '#B0BEC5',
            };
        }
        if (sessionStatus === 'collapsed') {
            return {
                gradient: ['rgba(183, 28, 28, 0.95)', 'rgba(136, 14, 14, 0.98)'] as const,
                iconName: 'flash' as const,
                iconColor: '#FF8A80',
                title: 'Position Collapsed!',
                subtitle: 'Your evaluation dropped too far.',
                accentColor: '#FF8A80',
            };
        }
        return null;
    };

    const overlayConfig = isTerminal ? getOverlayConfig() : null;

    return (
        <Modal visible={visible && sessionStatus !== 'ended'} transparent animationType="none" statusBarTranslucent>
            <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]} />
            <Animated.View style={[styles.container, { transform: [{ translateY: slideAnim }] }]}>
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.headerLeft}>
                        <Text style={styles.title} numberOfLines={1}>{title || '♟ Chess Challenge'}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        {/* Hint Button */}
                        {!hintRevealed && !isTerminal && (
                            <TouchableOpacity
                                onPress={() => { setHintError(null); setShowHintConfirm(true); }}
                                style={styles.hintButton}
                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            >
                                <Ionicons name="bulb-outline" size={16} color="#FFC107" />
                                <Text style={styles.hintButtonText}>{HINT_COST}</Text>
                                <Ionicons name="cash-outline" size={12} color="#F5A623" />
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity onPress={handleClose} style={styles.closeButton} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                            <Ionicons name="close" size={18} color="#fff" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Status Badge */}
                <Animated.View style={[styles.statusBadge, { backgroundColor: statusColor + '15', borderColor: statusColor + '40', transform: [{ scale: pulseAnim }] }]}>
                    <View style={styles.statusLeft}>
                        <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                        <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
                    </View>
                    <View style={styles.playerBadge}>
                        <Text style={styles.playerBadgeText}>{playerColor === 'w' ? `♔ ${whitePlayer || 'White'}` : `♚ ${blackPlayer || 'Black'}`}</Text>
                    </View>
                </Animated.View>

                {/* Timer */}
                {timeRemaining !== null && timeLimit && timeLimit > 0 && (
                    <View style={styles.timerContainer}>
                        <View style={styles.timerRow}>
                            <Ionicons name="time-outline" size={16} color={timeRemaining <= 10 ? '#FF5252' : '#F5A623'} />
                            <Text style={[styles.timerText, timeRemaining <= 10 && styles.timerTextDanger]}>
                                {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
                            </Text>
                        </View>
                        <View style={styles.timerBarBg}>
                            <View style={[
                                styles.timerBarFill,
                                {
                                    width: `${Math.max(0, (timeRemaining / timeLimit) * 100)}%`,
                                    backgroundColor: timeRemaining <= 10 ? '#FF5252' : timeRemaining <= 30 ? '#FF9800' : '#4CAF50',
                                },
                            ]} />
                        </View>
                    </View>
                )}

                {/* Board Area */}
                <View style={styles.boardArea}>
                    <EvalBar evaluation={evaluation} height={SCREEN_WIDTH * 0.85} />
                    <View style={styles.boardWrapper}><ChessBoard /></View>
                </View>

                {/* Best Move Hint (revealed after coin purchase) */}
                {hintRevealed && bestMoveHint && (
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
                    <ScrollView ref={moveListRef} horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.moveList}>
                        {moveHistory.length === 0 ? (
                            <Text style={styles.noMoves}>Your move...</Text>
                        ) : (
                            moveHistory.map((move, idx) => (
                                <View key={idx} style={[styles.moveBadge, move.color === 'w' ? styles.whiteMoveChip : styles.blackMoveChip]}>
                                    <Text style={styles.moveNumber}>{Math.ceil((idx + 1) / 2)}{move.color === 'b' ? '...' : '.'}</Text>
                                    <Text style={[styles.moveText, { color: move.color === 'w' ? '#1a1a1a' : '#f5f5f5' }]}>{move.san}</Text>
                                </View>
                            ))
                        )}
                    </ScrollView>
                </View>

                {/* Game-Over Overlay */}
                {isTerminal && overlayConfig && (
                    <Animated.View style={[styles.overlayContainer, { opacity: overlayOpacity }]}>
                        <LinearGradient colors={[...overlayConfig.gradient]} style={styles.overlayGradient}>
                            <Animated.View style={[styles.overlayCard, { transform: [{ scale: overlayScale }] }]}>
                                <View style={[styles.overlayIconCircle, { borderColor: overlayConfig.accentColor + '40' }]}>
                                    <Ionicons name={overlayConfig.iconName} size={48} color={overlayConfig.iconColor} />
                                </View>
                                <Text style={[styles.overlayTitle, { color: overlayConfig.accentColor }]}>{overlayConfig.title}</Text>
                                <Text style={styles.overlaySubtitle}>{overlayConfig.subtitle}</Text>
                                {evaluation && (
                                    <View style={styles.scoreSummary}>
                                        <View style={styles.scoreItem}>
                                            <Text style={styles.scoreLabel}>Eval</Text>
                                            <Text style={[styles.scoreValue, { color: overlayConfig.accentColor }]}>{evaluation.scorePawns > 0 ? '+' : ''}{evaluation.scorePawns.toFixed(1)}</Text>
                                        </View>
                                        <View style={styles.scoreDivider} />
                                        <View style={styles.scoreItem}>
                                            <Text style={styles.scoreLabel}>Moves</Text>
                                            <Text style={[styles.scoreValue, { color: overlayConfig.accentColor }]}>{moveHistory.length}</Text>
                                        </View>
                                        <View style={styles.scoreDivider} />
                                        <View style={styles.scoreItem}>
                                            <Text style={styles.scoreLabel}>Depth</Text>
                                            <Text style={[styles.scoreValue, { color: overlayConfig.accentColor }]}>{evaluation.depth}</Text>
                                        </View>
                                    </View>
                                )}
                                <View style={styles.overlayActions}>
                                    <TouchableOpacity style={[styles.actionBtn, styles.retryBtn]} onPress={handleRetry} activeOpacity={0.8}>
                                        <Ionicons name="refresh" size={18} color="#fff" />
                                        <Text style={styles.retryBtnText}>Try Again</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={[styles.actionBtn, styles.backBtn]} onPress={handleGoBack} activeOpacity={0.8}>
                                        <Ionicons name="arrow-back" size={18} color="#ccc" />
                                        <Text style={styles.backBtnText}>Back to Reel</Text>
                                    </TouchableOpacity>
                                </View>
                            </Animated.View>
                        </LinearGradient>
                    </Animated.View>
                )}

                {/* Hint Confirmation Overlay */}
                {showHintConfirm && (
                    <View style={styles.hintConfirmOverlay}>
                        <View style={styles.hintConfirmCard}>
                            <Ionicons name="bulb" size={28} color="#FFC107" />
                            <Text style={styles.hintConfirmTitle}>Use Hint?</Text>
                            <Text style={styles.hintConfirmDesc}>
                                Spend {HINT_COST} coins to reveal the best move.
                                {"\n"}You have {coinBalance} coins.
                            </Text>
                            {hintError && (
                                <Text style={styles.hintErrorText}>{hintError}</Text>
                            )}
                            {coinBalance >= HINT_COST ? (
                                <TouchableOpacity style={styles.hintConfirmBtn} onPress={handleHintPurchase} activeOpacity={0.8}>
                                    <Ionicons name="flash" size={16} color="#000" />
                                    <Text style={styles.hintConfirmBtnText}>Spend {HINT_COST} Coins</Text>
                                </TouchableOpacity>
                            ) : (
                                <View style={styles.hintInsufficientRow}>
                                    <Ionicons name="alert-circle" size={14} color="#FF5252" />
                                    <Text style={styles.hintInsufficientText}>Not enough coins</Text>
                                </View>
                            )}
                            <TouchableOpacity style={styles.hintCancelBtn} onPress={() => setShowHintConfirm(false)}>
                                <Text style={styles.hintCancelText}>Cancel</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
            </Animated.View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0, 0, 0, 0.92)' },
    container: { flex: 1, paddingTop: 52, paddingHorizontal: 14, paddingBottom: 16 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    headerLeft: { flex: 1, marginRight: 12 },
    title: { fontSize: 18, fontWeight: '700', color: '#fff', letterSpacing: 0.3 },
    closeButton: { width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(255, 255, 255, 0.08)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.12)', alignItems: 'center', justifyContent: 'center' },
    statusBadge: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1, marginBottom: 10 },
    statusLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    statusDot: { width: 8, height: 8, borderRadius: 4 },
    statusText: { fontSize: 13, fontWeight: '700', letterSpacing: 0.2 },
    playerBadge: { backgroundColor: 'rgba(255, 255, 255, 0.08)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
    playerBadgeText: { fontSize: 12, color: '#ccc', fontWeight: '600' },
    boardArea: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
    boardWrapper: { flex: 1, alignItems: 'center' },
    hintContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255, 193, 7, 0.1)', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, marginTop: 10, borderWidth: 1, borderColor: 'rgba(255, 193, 7, 0.2)', gap: 6 },
    hintIcon: { fontSize: 16 },
    hintLabel: { fontSize: 12, color: '#FFC107', fontWeight: '500' },
    hintMove: { fontSize: 14, color: '#FFD54F', fontWeight: '800', fontFamily: 'monospace', letterSpacing: 0.5 },
    moveHistoryContainer: { marginTop: 10 },
    moveHistoryHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
    moveHistoryTitle: { fontSize: 12, fontWeight: '700', color: '#666', textTransform: 'uppercase', letterSpacing: 1 },
    moveCount: { fontSize: 11, fontWeight: '600', color: '#555', backgroundColor: 'rgba(255,255,255,0.06)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, overflow: 'hidden' },
    moveList: { flexDirection: 'row', gap: 5, paddingVertical: 2 },
    noMoves: { fontSize: 13, color: '#555', fontStyle: 'italic' },
    moveBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 5, borderRadius: 8, gap: 3 },
    whiteMoveChip: { backgroundColor: '#f0f0f0' },
    blackMoveChip: { backgroundColor: '#2a2a2a', borderWidth: 1, borderColor: '#444' },
    moveNumber: { fontSize: 10, color: '#888', fontFamily: 'monospace' },
    moveText: { fontSize: 13, fontWeight: '700', fontFamily: 'monospace' },
    overlayContainer: { ...StyleSheet.absoluteFillObject, zIndex: 100 },
    overlayGradient: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
    overlayCard: { alignItems: 'center', width: '100%', maxWidth: 320 },
    overlayIconCircle: { width: 88, height: 88, borderRadius: 44, backgroundColor: 'rgba(255, 255, 255, 0.08)', borderWidth: 2, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
    overlayTitle: { fontSize: 32, fontWeight: '900', letterSpacing: 0.5, marginBottom: 8, textAlign: 'center' },
    overlaySubtitle: { fontSize: 15, color: 'rgba(255, 255, 255, 0.7)', textAlign: 'center', lineHeight: 22, marginBottom: 24 },
    scoreSummary: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.3)', borderRadius: 12, paddingVertical: 12, paddingHorizontal: 20, marginBottom: 28, gap: 16 },
    scoreItem: { alignItems: 'center', flex: 1 },
    scoreLabel: { fontSize: 10, color: 'rgba(255, 255, 255, 0.5)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
    scoreValue: { fontSize: 20, fontWeight: '800', fontFamily: 'monospace' },
    scoreDivider: { width: 1, height: 28, backgroundColor: 'rgba(255, 255, 255, 0.15)' },
    overlayActions: { width: '100%', gap: 10 },
    actionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 14, gap: 8 },
    retryBtn: { backgroundColor: 'rgba(255, 255, 255, 0.15)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.25)' },
    retryBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
    backBtn: { backgroundColor: 'rgba(255, 255, 255, 0.06)' },
    backBtnText: { fontSize: 14, fontWeight: '600', color: '#999' },
    timerContainer: { marginBottom: 8, paddingHorizontal: 4 },
    timerRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
    timerText: { fontSize: 16, fontWeight: '800', color: '#F5A623', fontFamily: 'monospace', letterSpacing: 1 },
    timerTextDanger: { color: '#FF5252' },
    timerBarBg: { height: 4, backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: 2, overflow: 'hidden' },
    timerBarFill: { height: '100%', borderRadius: 2 },
    hintButton: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, backgroundColor: 'rgba(255, 193, 7, 0.15)', borderWidth: 1, borderColor: 'rgba(255, 193, 7, 0.3)' },
    hintButtonText: { fontSize: 12, fontWeight: '700', color: '#FFC107' },
    hintConfirmOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', zIndex: 200 },
    hintConfirmCard: { backgroundColor: 'rgba(20,20,30,0.96)', borderRadius: 18, paddingVertical: 22, paddingHorizontal: 22, alignItems: 'center', width: '75%', maxWidth: 280, borderWidth: 1, borderColor: 'rgba(255,193,7,0.25)' },
    hintConfirmTitle: { fontSize: 18, fontWeight: '800', color: '#fff', marginTop: 10, marginBottom: 4 },
    hintConfirmDesc: { fontSize: 13, color: '#aaa', textAlign: 'center', marginBottom: 16, lineHeight: 18 },
    hintErrorText: { fontSize: 12, color: '#FF5252', fontWeight: '600', marginBottom: 10 },
    hintConfirmBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FFC107', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 12, marginBottom: 8 },
    hintConfirmBtnText: { fontSize: 14, fontWeight: '800', color: '#000' },
    hintInsufficientRow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, marginBottom: 8 },
    hintInsufficientText: { fontSize: 13, fontWeight: '600', color: '#FF5252' },
    hintCancelBtn: { paddingVertical: 6 },
    hintCancelText: { fontSize: 13, fontWeight: '600', color: '#666' },
});
