import React, { useRef, useEffect, useState, useCallback, useMemo } from "react";
import {
    View,
    Text,
    StyleSheet,
    Dimensions,
    TouchableOpacity,
    ActivityIndicator,
    Animated,
    PanResponder,
} from "react-native";
import { Video, ResizeMode, AVPlaybackStatus, Audio } from "expo-av";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { FONTS } from "../../lib/styles/base";
import { Reel } from "../../lib/types/reel";
import { ReelActions } from "./ReelActions";
import { useFocusEffect } from "expo-router";
import InteractiveSession from "./InteractiveSession";
import { useGameStore } from "../../lib/stores/gameStore";
import { useCoinStore } from "../../lib/stores/coinStore";
import { useCheckInteractiveAccess, useSpendCoins } from "../../lib/services/coinApi";

// Difficulty colors
const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
        case "beginner": return "#22c55e";
        case "intermediate": return "#f59e0b";
        case "advanced": return "#ef4444";
        default: return "#6b7280";
    }
};

const difficultyLabels: Record<string, string> = {
    beginner: "EASY",
    intermediate: "MEDIUM",
    advanced: "HARD",
};

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const VIEW_TRIGGER_DELAY = 2000;

interface ReelCardProps {
    reel: Reel;
    isVisible: boolean;
    isLiked: boolean;
    isSaved: boolean;
    onLike: () => void;
    onSave: () => void;
    onComment: () => void;
    onShare: () => void;
    onView?: () => void;
    onImmersiveChange?: (isImmersive: boolean) => void;
}

export function ReelCard({
    reel,
    isVisible,
    isLiked,
    isSaved,
    onLike,
    onSave,
    onComment,
    onShare,
    onView,
    onImmersiveChange,
}: ReelCardProps) {
    const bottomPadding = 140;

    const videoRef = useRef<Video>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [showControls, setShowControls] = useState(false);
    const [hasRecordedView, setHasRecordedView] = useState(false);
    const [hasVideoError, setHasVideoError] = useState(false);
    const [isImmersive, setIsImmersive] = useState(false);
    const [showInteractiveSession, setShowInteractiveSession] = useState(false);
    const [showSwipeHint, setShowSwipeHint] = useState(false);
    const [showCoinGate, setShowCoinGate] = useState(false);
    const [showPlayerSelect, setShowPlayerSelect] = useState(false);
    const [coinGateInfo, setCoinGateInfo] = useState<{ cost: number; balance: number } | null>(null);
    const viewTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const immersiveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const uiOpacity = useRef(new Animated.Value(1)).current;
    const swipeHintOpacity = useRef(new Animated.Value(0)).current;
    const swipeHintPulse = useRef(new Animated.Value(1)).current;
    const swipeHintTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Check if this reel has an interactive chess challenge
    const hasInteractiveChallenge = Boolean(reel.interactive?.chessFen);

    // Game store for interactive session
    const startSession = useGameStore((s) => s.startSession);

    // Check if video URL is valid
    const hasValidUrl = Boolean(reel.video?.url?.trim());

    // Coin system
    const coinBalance = useCoinStore((s) => s.balance);
    const optimisticSpend = useCoinStore((s) => s.optimisticSpend);
    const rollbackSpend = useCoinStore((s) => s.rollbackSpend);
    const updateBalance = useCoinStore((s) => s.updateBalance);
    const setInteractivePlays = useCoinStore((s) => s.setInteractivePlays);
    const checkAccess = useCheckInteractiveAccess();
    const spendCoins = useSpendCoins();

    // Reset states when reel changes
    useEffect(() => {
        setIsLoading(true);
        setHasVideoError(false);
        setHasRecordedView(false);
        setIsPlaying(false);
        setIsImmersive(false);
        setShowInteractiveSession(false);
        setShowSwipeHint(false);
        setShowCoinGate(false);
        setShowPlayerSelect(false);
        setCoinGateInfo(null);
        uiOpacity.setValue(1);
        swipeHintOpacity.setValue(0);
    }, [reel._id]);

    // Swipe hint: show after 2s of viewing, pulse animation
    useEffect(() => {
        if (isVisible && hasInteractiveChallenge && !showInteractiveSession) {
            swipeHintTimerRef.current = setTimeout(() => {
                setShowSwipeHint(true);
                Animated.timing(swipeHintOpacity, { toValue: 1, duration: 500, useNativeDriver: true }).start();
                // Start pulsing loop
                const pulse = Animated.loop(
                    Animated.sequence([
                        Animated.timing(swipeHintPulse, { toValue: 1.1, duration: 800, useNativeDriver: true }),
                        Animated.timing(swipeHintPulse, { toValue: 1, duration: 800, useNativeDriver: true }),
                    ])
                );
                pulse.start();
            }, 2000);
        } else {
            if (swipeHintTimerRef.current) clearTimeout(swipeHintTimerRef.current);
            setShowSwipeHint(false);
            swipeHintOpacity.setValue(0);
            swipeHintPulse.setValue(1);
        }
        return () => { if (swipeHintTimerRef.current) clearTimeout(swipeHintTimerRef.current); };
    }, [isVisible, hasInteractiveChallenge, showInteractiveSession]);

    // Helper to actually start the interactive session with a chosen color
    const launchInteractiveSession = useCallback(async (color: 'w' | 'b') => {
        try { await videoRef.current?.pauseAsync(); } catch (e) { /* ignore */ }
        setIsPlaying(false);
        setShowPlayerSelect(false);
        startSession(reel.interactive!.chessFen!, color);
        setShowInteractiveSession(true);
    }, [reel.interactive, startSession]);

    // Show player selection, or skip if color is forced
    const promptPlayerSelection = useCallback(() => {
        if (reel.interactive?.playerColor) {
            // Forced color — skip selection
            launchInteractiveSession(reel.interactive.playerColor);
        } else {
            setShowPlayerSelect(true);
        }
    }, [reel.interactive, launchInteractiveSession]);

    // Swipe handler: detect horizontal swipe to open interactive session
    const panResponder = useMemo(() => PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onMoveShouldSetPanResponder: (_, gestureState) => {
            // Only capture horizontal gestures (not vertical scrolling)
            return hasInteractiveChallenge && Math.abs(gestureState.dx) > 20 && Math.abs(gestureState.dy) < 30;
        },
        onPanResponderRelease: async (_, gestureState) => {
            // Swipe left or right with sufficient distance
            if (hasInteractiveChallenge && (gestureState.dx < -80 || gestureState.dx > 80)) {
                // Check interactive access (free plays vs coin required)
                try {
                    const result = await checkAccess.mutateAsync();
                    setInteractivePlays(result.playsUsed, result.totalFree);
                    if (result.free) {
                        // Free play available — show player selection
                        promptPlayerSelection();
                    } else {
                        // Needs coins — show coin gate overlay
                        setCoinGateInfo({ cost: result.cost || 3, balance: result.balance || coinBalance });
                        setShowCoinGate(true);
                    }
                } catch (e) {
                    // If API fails (e.g. offline), allow free play as fallback
                    console.warn('[ReelCard] Interactive access check failed, allowing free:', e);
                    promptPlayerSelection();
                }
            }
        },
    }), [hasInteractiveChallenge, reel.interactive, startSession, checkAccess, coinBalance, promptPlayerSelection]);

    // Handle coin gate: user confirms spending coins
    const handleCoinGateConfirm = useCallback(async () => {
        if (!coinGateInfo) return;
        const { cost } = coinGateInfo;
        optimisticSpend(cost);
        setShowCoinGate(false);
        try {
            const result = await spendCoins.mutateAsync({ amount: cost, reason: 'interactive_unlock', metadata: { reelId: reel._id } });
            if (result.success) {
                updateBalance(result.newBalance!);
                promptPlayerSelection();
            } else {
                rollbackSpend(cost);
                setCoinGateInfo({ cost, balance: result.balance || 0 });
                setShowCoinGate(true);
            }
        } catch (e) {
            rollbackSpend(cost);
            console.warn('[ReelCard] Coin spend failed:', e);
        }
    }, [coinGateInfo, optimisticSpend, rollbackSpend, updateBalance, spendCoins, reel._id, promptPlayerSelection]);

    // Immersive mode timer
    useEffect(() => {
        if (isPlaying && isVisible && !hasVideoError) {
            if (immersiveTimerRef.current) clearTimeout(immersiveTimerRef.current);
            immersiveTimerRef.current = setTimeout(() => {
                setIsImmersive(true);
                onImmersiveChange?.(true);
                Animated.timing(uiOpacity, { toValue: 0, duration: 300, useNativeDriver: true }).start();
            }, 3000);
        } else {
            if (immersiveTimerRef.current) clearTimeout(immersiveTimerRef.current);
            if (!isPlaying) {
                setIsImmersive(false);
                onImmersiveChange?.(false);
                uiOpacity.setValue(1);
            }
        }
        return () => { if (immersiveTimerRef.current) clearTimeout(immersiveTimerRef.current); };
    }, [isPlaying, isVisible, hasVideoError, onImmersiveChange]);

    // 2-second view trigger
    useEffect(() => {
        if (isVisible && !hasRecordedView && onView) {
            viewTimerRef.current = setTimeout(() => { onView(); setHasRecordedView(true); }, VIEW_TRIGGER_DELAY);
        } else {
            if (viewTimerRef.current) { clearTimeout(viewTimerRef.current); viewTimerRef.current = null; }
        }
        return () => { if (viewTimerRef.current) clearTimeout(viewTimerRef.current); };
    }, [isVisible, hasRecordedView, onView]);

    // Play/pause based on visibility
    useEffect(() => {
        const handleVisibility = async () => {
            if (!hasValidUrl || hasVideoError) return;
            try {
                if (isVisible) {
                    try {
                        await Audio.setAudioModeAsync({ playsInSilentModeIOS: true, staysActiveInBackground: false, shouldDuckAndroid: true });
                    } catch (e) { console.warn("Audio mode config failed:", e); }
                    await videoRef.current?.playAsync();
                    setIsPlaying(true);
                } else {
                    await videoRef.current?.pauseAsync();
                    setIsPlaying(false);
                }
            } catch (error: any) {
                if (error?.message?.includes("AudioFocus")) {
                    try {
                        await videoRef.current?.setIsMutedAsync(true);
                        setIsMuted(true);
                        await videoRef.current?.playAsync();
                        setIsPlaying(true);
                    } catch (e) { console.warn("Failed to play muted:", e); }
                } else {
                    console.warn("Video playback error:", error);
                }
            }
        };
        handleVisibility();
    }, [isVisible, hasValidUrl, hasVideoError]);

    // Stop video on tab unfocus
    useFocusEffect(
        useCallback(() => {
            const resumeVideo = async () => {
                if (isVisible && hasValidUrl && !hasVideoError) {
                    try { await videoRef.current?.playAsync(); setIsPlaying(true); } catch (e) { /* audio focus re-acquire expected on Android */ }
                }
            };
            resumeVideo();
            return () => {
                const stopVideo = async () => {
                    try { await videoRef.current?.pauseAsync(); await videoRef.current?.stopAsync(); setIsPlaying(false); } catch (e) { /* ignore */ }
                };
                stopVideo();
            };
        }, [isVisible, hasValidUrl, hasVideoError])
    );

    const handlePlaybackStatusUpdate = (status: AVPlaybackStatus) => {
        if (status.isLoaded) {
            setIsLoading(false);
            setIsPlaying(status.isPlaying);
            if (status.didJustFinish) videoRef.current?.replayAsync();
        }
    };

    const togglePlayPause = async () => {
        if (isPlaying) await videoRef.current?.pauseAsync();
        else await videoRef.current?.playAsync();
        setIsPlaying(!isPlaying);
    };

    const toggleMute = async () => {
        await videoRef.current?.setIsMutedAsync(!isMuted);
        setIsMuted(!isMuted);
    };


    const handleSessionEnd = useCallback(async () => {
        setShowInteractiveSession(false);
        try { await videoRef.current?.playAsync(); setIsPlaying(true); } catch (e) { console.warn('Failed to resume video after challenge:', e); }
    }, []);

    const handleVideoPress = () => {
        if (isImmersive) {
            setIsImmersive(false);
            Animated.timing(uiOpacity, { toValue: 1, duration: 200, useNativeDriver: true }).start();
            if (immersiveTimerRef.current) clearTimeout(immersiveTimerRef.current);
            immersiveTimerRef.current = setTimeout(() => {
                setIsImmersive(true);
                Animated.timing(uiOpacity, { toValue: 0, duration: 300, useNativeDriver: true }).start();
            }, 5000);
        } else {
            setShowControls(true);
            setTimeout(() => setShowControls(false), 3000);
        }
    };

    return (
        <View style={styles.container} {...panResponder.panHandlers}>
            {/* Video Player */}
            <TouchableOpacity activeOpacity={1} onPress={handleVideoPress} style={StyleSheet.absoluteFill}>
                {hasValidUrl && !hasVideoError ? (
                    <Video
                        key={reel._id}
                        ref={videoRef}
                        source={{ uri: reel.video.url }}
                        posterSource={reel.video.thumbnail?.trim() ? { uri: reel.video.thumbnail } : undefined}
                        usePoster={!!reel.video.thumbnail?.trim()}
                        posterStyle={styles.poster}
                        style={styles.video}
                        resizeMode={ResizeMode.COVER}
                        isLooping
                        isMuted={isMuted}
                        shouldPlay={isVisible}
                        onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
                        onError={() => { setHasVideoError(true); setIsLoading(false); }}
                    />
                ) : (
                    <View style={[styles.video, styles.errorContainer]}>
                        <Text style={styles.errorText}>{hasVideoError ? "Video failed to load" : "Video unavailable"}</Text>
                    </View>
                )}
            </TouchableOpacity>

            {/* Loading */}
            {isLoading && (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#F5A623" />
                </View>
            )}

            {/* Play/Pause */}
            {showControls && (
                <TouchableOpacity style={styles.playButton} onPress={togglePlayPause}>
                    <View style={styles.playIconContainer}>
                        <Ionicons name={isPlaying ? "pause" : "play"} size={48} color="#FFFFFF" />
                    </View>
                </TouchableOpacity>
            )}

            {/* Mute Button */}
            <Animated.View style={{ opacity: uiOpacity, position: 'absolute', top: 120, right: 16 }}>
                <TouchableOpacity style={styles.muteButtonInner} onPress={toggleMute}>
                    <Ionicons name={isMuted ? "volume-mute" : "volume-high"} size={20} color="#FFFFFF" />
                </TouchableOpacity>
            </Animated.View>

            {/* Top Gradient */}
            <Animated.View style={{ opacity: uiOpacity, position: 'absolute', top: 0, left: 0, right: 0 }} pointerEvents="none">
                <LinearGradient colors={["rgba(0,0,0,0.6)", "transparent"]} style={styles.topGradientInner} />
            </Animated.View>

            {/* Bottom Gradient & Content */}
            <Animated.View style={{ opacity: uiOpacity, position: 'absolute', bottom: 0, left: 0, right: 0 }} pointerEvents="box-none">
                <LinearGradient
                    colors={["transparent", "rgba(0,0,0,0.4)", "rgba(0,0,0,0.9)"]}
                    style={[styles.bottomGradientInner, { paddingBottom: bottomPadding }]}
                    pointerEvents="box-none"
                >
                    <View style={styles.contentContainer}>
                        {/* Difficulty Badge */}
                        <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(reel.content.difficulty) + "CC" }]}>
                            <Text style={styles.difficultyText}>{difficultyLabels[reel.content.difficulty] || reel.content.difficulty.toUpperCase()}</Text>
                        </View>
                        <Text style={styles.title} numberOfLines={2}>{reel.content.title}</Text>
                        {reel.content.description ? <Text style={styles.description} numberOfLines={3}>{reel.content.description}</Text> : null}
                        {reel.content.tags && reel.content.tags.length > 0 && (
                            <View style={styles.tagsContainer}>
                                {reel.content.tags.map((tag, i) => <Text key={i} style={styles.hashtag}>#{tag}</Text>)}
                            </View>
                        )}
                        {(reel.content.whitePlayer || reel.content.blackPlayer) && (
                            <View style={styles.playerMatchup}>
                                <View style={styles.playerInfo}>
                                    <View style={[styles.playerDot, { backgroundColor: '#fff' }]} />
                                    <Text style={styles.playerName} numberOfLines={1}>{reel.content.whitePlayer || "White"}</Text>
                                </View>
                                <Text style={styles.vsText}>vs</Text>
                                <View style={styles.playerInfo}>
                                    <View style={[styles.playerDot, { backgroundColor: '#000', borderWidth: 1, borderColor: 'rgba(255,255,255,0.5)' }]} />
                                    <Text style={styles.playerName} numberOfLines={1}>{reel.content.blackPlayer || "Black"}</Text>
                                </View>
                            </View>
                        )}
                    </View>
                </LinearGradient>
            </Animated.View>

            {/* Actions */}
            <Animated.View style={{ opacity: uiOpacity, position: 'absolute', right: 16, bottom: bottomPadding + 80 }}>
                <ReelActions
                    likes={reel.engagement?.likes || 0}
                    comments={reel.engagement?.comments || 0}
                    isLiked={isLiked}
                    isSaved={isSaved}
                    onLike={onLike}
                    onComment={onComment}
                    onShare={onShare}
                    onSave={onSave}
                />
            </Animated.View>

            {/* Swipe Hint for Interactive Challenge */}
            {showSwipeHint && hasInteractiveChallenge && (
                <Animated.View style={[styles.swipeHint, { opacity: swipeHintOpacity, transform: [{ scale: swipeHintPulse }] }]}>
                    <View style={styles.swipeHintInner}>
                        <Ionicons name="game-controller" size={18} color="#F5A623" />
                        <Text style={styles.swipeHintText}>Swipe to play</Text>
                        <Ionicons name="chevron-forward" size={14} color="#F5A623" />
                    </View>
                </Animated.View>
            )}

            {/* Coin Gate Overlay */}
            {showCoinGate && coinGateInfo && (
                <View style={styles.coinGateOverlay}>
                    <View style={styles.coinGateCard}>
                        <Ionicons name="cash-outline" size={32} color="#F5A623" />
                        <Text style={styles.coinGateTitle}>Free plays used up!</Text>
                        <Text style={styles.coinGateDesc}>
                            Costs {coinGateInfo.cost} coins to play. You have {coinGateInfo.balance} coins.
                        </Text>
                        {coinGateInfo.balance >= coinGateInfo.cost ? (
                            <TouchableOpacity style={styles.coinGateConfirm} onPress={handleCoinGateConfirm} activeOpacity={0.8}>
                                <Ionicons name="flash" size={18} color="#fff" />
                                <Text style={styles.coinGateConfirmText}>Spend {coinGateInfo.cost} Coins</Text>
                            </TouchableOpacity>
                        ) : (
                            <View style={styles.coinGateInsufficient}>
                                <Ionicons name="alert-circle" size={16} color="#FF5252" />
                                <Text style={styles.coinGateInsufficientText}>Not enough coins</Text>
                            </View>
                        )}
                        <TouchableOpacity style={styles.coinGateCancel} onPress={() => setShowCoinGate(false)}>
                            <Text style={styles.coinGateCancelText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            {/* Player Selection Overlay */}
            {showPlayerSelect && (
                <View style={styles.coinGateOverlay}>
                    <View style={styles.playerSelectCard}>
                        <Ionicons name="game-controller" size={28} color="#F5A623" />
                        <Text style={styles.playerSelectTitle}>Choose Your Side</Text>
                        <View style={styles.playerSelectRow}>
                            <TouchableOpacity
                                style={styles.playerSelectOption}
                                onPress={() => launchInteractiveSession('w')}
                                activeOpacity={0.8}
                            >
                                <View style={[styles.playerSelectPiece, { backgroundColor: '#fff' }]}>
                                    <Text style={{ fontSize: 22 }}>♔</Text>
                                </View>
                                <Text style={styles.playerSelectName} numberOfLines={1}>
                                    {reel.content.whitePlayer || 'White'}
                                </Text>
                                <Text style={styles.playerSelectSide}>White</Text>
                            </TouchableOpacity>

                            <Text style={styles.playerSelectVs}>VS</Text>

                            <TouchableOpacity
                                style={styles.playerSelectOption}
                                onPress={() => launchInteractiveSession('b')}
                                activeOpacity={0.8}
                            >
                                <View style={[styles.playerSelectPiece, { backgroundColor: '#222', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' }]}>
                                    <Text style={{ fontSize: 22 }}>♚</Text>
                                </View>
                                <Text style={styles.playerSelectName} numberOfLines={1}>
                                    {reel.content.blackPlayer || 'Black'}
                                </Text>
                                <Text style={styles.playerSelectSide}>Black</Text>
                            </TouchableOpacity>
                        </View>
                        <TouchableOpacity style={styles.coinGateCancel} onPress={() => setShowPlayerSelect(false)}>
                            <Text style={styles.coinGateCancelText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            {/* Interactive Session Modal */}
            <InteractiveSession
                visible={showInteractiveSession}
                onSessionEnd={handleSessionEnd}
                title={reel.content.title}
                description={reel.content.description}
                whitePlayer={reel.content.whitePlayer}
                blackPlayer={reel.content.blackPlayer}
                timeLimit={reel.interactive?.timeLimit ?? null}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { width: SCREEN_WIDTH, height: SCREEN_HEIGHT, backgroundColor: "#080B14" },
    video: { ...StyleSheet.absoluteFillObject, width: "100%", height: "100%" },
    poster: { width: "100%", height: "100%", resizeMode: "cover" },
    loadingContainer: { ...StyleSheet.absoluteFillObject, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.3)" },
    playButton: { position: "absolute", top: "50%", left: "50%", transform: [{ translateX: -40 }, { translateY: -40 }] },
    playIconContainer: { width: 80, height: 80, borderRadius: 40, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center", paddingLeft: 4 },
    muteButtonInner: { width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center" as const, alignItems: "center" as const },
    topGradientInner: { height: 120 },
    bottomGradientInner: { paddingTop: 100, paddingHorizontal: 16, justifyContent: "flex-end" as const },
    contentContainer: { width: "85%" },
    difficultyBadge: { alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginBottom: 8 },
    difficultyText: { fontFamily: FONTS.extrabold, color: "#FFFFFF", fontSize: 11, letterSpacing: 0.5 },
    title: { fontFamily: FONTS.bold, color: "#FFFFFF", fontSize: 18, marginBottom: 6, textShadowColor: "rgba(0,0,0,0.5)", textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 },
    description: { fontFamily: FONTS.regular, color: "#FFFFFF", fontSize: 14, lineHeight: 20, marginBottom: 8, opacity: 0.9 },
    tagsContainer: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 12 },
    hashtag: { fontFamily: FONTS.semibold, color: "#F5A623", fontSize: 14 },
    playerMatchup: { flexDirection: "row", alignItems: "center", marginTop: 4, paddingTop: 8, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.2)" },
    playerInfo: { flexDirection: "row", alignItems: "center", gap: 6 },
    playerDot: { width: 12, height: 12, borderRadius: 6 },
    playerName: { fontFamily: FONTS.semibold, color: "#FFFFFF", fontSize: 14, maxWidth: 100 },
    vsText: { fontFamily: FONTS.bold, color: "#A0A0B0", fontSize: 12, marginHorizontal: 8, fontStyle: "italic" },
    errorContainer: { justifyContent: "center", alignItems: "center", backgroundColor: "#111629" },
    errorText: { fontFamily: FONTS.regular, color: "#6B7280", fontSize: 14, textAlign: "center" },
    swipeHint: { position: "absolute", right: 12, top: "45%", zIndex: 50 },
    swipeHintInner: { flexDirection: "column", alignItems: "center", gap: 4, backgroundColor: "rgba(0,0,0,0.65)", paddingHorizontal: 10, paddingVertical: 12, borderRadius: 14, borderWidth: 1, borderColor: "rgba(245,166,35,0.3)" },
    swipeHintText: { fontFamily: FONTS.semibold, fontSize: 10, color: "#F5A623", textAlign: "center" },
    coinGateOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.75)", justifyContent: "center", alignItems: "center", zIndex: 100 },
    coinGateCard: { backgroundColor: "rgba(20,20,30,0.96)", borderRadius: 20, paddingVertical: 24, paddingHorizontal: 24, alignItems: "center", width: "78%", maxWidth: 300, borderWidth: 1, borderColor: "rgba(245,166,35,0.25)" },
    coinGateTitle: { fontFamily: FONTS.bold, fontSize: 18, color: "#fff", marginTop: 12, marginBottom: 6 },
    coinGateDesc: { fontFamily: FONTS.regular, fontSize: 13, color: "#aaa", textAlign: "center", marginBottom: 18, lineHeight: 18 },
    coinGateConfirm: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#F5A623", paddingVertical: 12, paddingHorizontal: 24, borderRadius: 14, marginBottom: 10 },
    coinGateConfirmText: { fontFamily: FONTS.extrabold, fontSize: 15, color: "#000" },
    coinGateInsufficient: { flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 10, marginBottom: 10 },
    coinGateInsufficientText: { fontFamily: FONTS.semibold, fontSize: 13, color: "#FF5252" },
    coinGateCancel: { paddingVertical: 8 },
    coinGateCancelText: { fontFamily: FONTS.semibold, fontSize: 14, color: "#666" },
    playerSelectCard: { backgroundColor: "rgba(20,20,30,0.96)", borderRadius: 22, paddingVertical: 26, paddingHorizontal: 20, alignItems: "center", width: "85%", maxWidth: 340, borderWidth: 1, borderColor: "rgba(245,166,35,0.2)" },
    playerSelectTitle: { fontFamily: FONTS.bold, fontSize: 20, color: "#fff", marginTop: 10, marginBottom: 20 },
    playerSelectRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 16, width: "100%", marginBottom: 16 },
    playerSelectOption: { flex: 1, alignItems: "center", paddingVertical: 18, paddingHorizontal: 8, borderRadius: 16, backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)" },
    playerSelectPiece: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center", marginBottom: 10 },
    playerSelectName: { fontFamily: FONTS.bold, fontSize: 13, color: "#fff", textAlign: "center", maxWidth: 100, marginBottom: 4 },
    playerSelectSide: { fontFamily: FONTS.semibold, fontSize: 11, color: "#888", letterSpacing: 1 },
    playerSelectVs: { fontFamily: FONTS.extrabold, fontSize: 14, color: "#555", letterSpacing: 1 },
});
