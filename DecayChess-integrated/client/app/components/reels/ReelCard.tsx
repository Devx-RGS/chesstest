import React, { useRef, useEffect, useState, useCallback } from "react";
import {
    View,
    Text,
    StyleSheet,
    Dimensions,
    TouchableOpacity,
    ActivityIndicator,
    Animated,
} from "react-native";
import { Video, ResizeMode, AVPlaybackStatus, Audio } from "expo-av";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { Reel } from "../../lib/types/reel";
import { ReelActions } from "./ReelActions";
import { useFocusEffect } from "expo-router";
import InteractiveSession from "./InteractiveSession";
import { useGameStore } from "../../lib/stores/gameStore";

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
    const [showChallengeCTA, setShowChallengeCTA] = useState(false);
    const [showInteractiveSession, setShowInteractiveSession] = useState(false);
    const [hasChallengeTriggered, setHasChallengeTriggered] = useState(false);
    const viewTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const immersiveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const uiOpacity = useRef(new Animated.Value(1)).current;

    // Check if this reel has an interactive chess challenge
    const hasInteractiveChallenge = Boolean(reel.interactive?.chessFen);
    const triggerTimestampMs = (reel.interactive?.triggerTimestamp || 0) * 1000;

    // Game store for interactive session
    const startSession = useGameStore((s) => s.startSession);

    // Check if video URL is valid
    const hasValidUrl = Boolean(reel.video?.url?.trim());

    // Reset states when reel changes
    useEffect(() => {
        setIsLoading(true);
        setHasVideoError(false);
        setHasRecordedView(false);
        setIsPlaying(false);
        setIsImmersive(false);
        setShowChallengeCTA(false);
        setShowInteractiveSession(false);
        setHasChallengeTriggered(false);
        uiOpacity.setValue(1);
    }, [reel._id]);

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
                    try { await videoRef.current?.playAsync(); setIsPlaying(true); } catch (e) { console.warn("Video resume error:", e); }
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
            // Interactive challenge trigger
            if (hasInteractiveChallenge && !hasChallengeTriggered && !showInteractiveSession && status.positionMillis >= triggerTimestampMs && triggerTimestampMs > 0) {
                setHasChallengeTriggered(true);
                videoRef.current?.pauseAsync();
                setIsPlaying(false);
                setShowChallengeCTA(true);
            }
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

    const handleStartChallenge = useCallback((chosenColor: 'w' | 'b') => {
        if (!reel.interactive?.chessFen) return;
        setShowChallengeCTA(false);
        startSession(reel.interactive.chessFen, chosenColor);
        setShowInteractiveSession(true);
    }, [reel.interactive, startSession]);

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
        <View style={styles.container}>
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
                    <ActivityIndicator size="large" color="#00D9FF" />
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

            {/* Interactive Chess Challenge CTA */}
            {showChallengeCTA && hasInteractiveChallenge && (
                <View style={styles.challengeOverlay}>
                    <View style={styles.challengeCard}>
                        <Text style={styles.challengeTitle}>♟ Interactive Challenge!</Text>
                        <Text style={styles.challengeDesc}>
                            {reel.interactive?.challengePrompt || reel.content.description || 'Can you find the best move?'}
                        </Text>
                        {reel.interactive?.playerColor ? (
                            <>
                                <View style={styles.forcedColorBadge}>
                                    <Text style={styles.forcedColorEmoji}>{reel.interactive.playerColor === 'w' ? '♔' : '♚'}</Text>
                                    <Text style={styles.forcedColorText}>Play as {reel.interactive.playerColor === 'w' ? 'White' : 'Black'}</Text>
                                </View>
                                <TouchableOpacity
                                    style={[styles.colorChoiceBtn, { backgroundColor: '#4CAF50', width: '100%', marginBottom: 12 }]}
                                    onPress={() => handleStartChallenge(reel.interactive!.playerColor!)}
                                    activeOpacity={0.8}
                                >
                                    <Text style={styles.colorBtnEmoji}>⚡</Text>
                                    <Text style={[styles.whiteBtnText, { color: '#fff' }]}>Accept Challenge</Text>
                                </TouchableOpacity>
                            </>
                        ) : (
                            <>
                                <Text style={styles.challengeChooseText}>Choose your side:</Text>
                                <View style={styles.colorChoiceRow}>
                                    <TouchableOpacity style={[styles.colorChoiceBtn, styles.whiteBtn]} onPress={() => handleStartChallenge('w')} activeOpacity={0.8}>
                                        <Text style={styles.colorBtnEmoji}>♔</Text>
                                        <Text style={styles.whiteBtnText}>White</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={[styles.colorChoiceBtn, styles.blackBtn]} onPress={() => handleStartChallenge('b')} activeOpacity={0.8}>
                                        <Text style={styles.colorBtnEmoji}>♚</Text>
                                        <Text style={styles.blackBtnText}>Black</Text>
                                    </TouchableOpacity>
                                </View>
                            </>
                        )}
                        <TouchableOpacity style={styles.challengeSkip} onPress={async () => { setShowChallengeCTA(false); await videoRef.current?.playAsync(); setIsPlaying(true); }}>
                            <Text style={styles.challengeSkipText}>Skip →</Text>
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
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { width: SCREEN_WIDTH, height: SCREEN_HEIGHT, backgroundColor: "#0F0F23" },
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
    difficultyText: { color: "#FFFFFF", fontSize: 11, fontWeight: "800", letterSpacing: 0.5 },
    title: { color: "#FFFFFF", fontSize: 18, fontWeight: "700", marginBottom: 6, textShadowColor: "rgba(0,0,0,0.5)", textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 },
    description: { color: "#FFFFFF", fontSize: 14, lineHeight: 20, marginBottom: 8, opacity: 0.9 },
    tagsContainer: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 12 },
    hashtag: { color: "#00D9FF", fontSize: 14, fontWeight: "600" },
    playerMatchup: { flexDirection: "row", alignItems: "center", marginTop: 4, paddingTop: 8, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.2)" },
    playerInfo: { flexDirection: "row", alignItems: "center", gap: 6 },
    playerDot: { width: 12, height: 12, borderRadius: 6 },
    playerName: { color: "#FFFFFF", fontSize: 14, fontWeight: "600", maxWidth: 100 },
    vsText: { color: "#A0A0B0", fontSize: 12, fontWeight: "700", marginHorizontal: 8, fontStyle: "italic" },
    errorContainer: { justifyContent: "center", alignItems: "center", backgroundColor: "#1A1A2E" },
    errorText: { color: "#6B7280", fontSize: 14, textAlign: "center" },
    challengeOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "center", alignItems: "center", zIndex: 100 },
    challengeCard: { backgroundColor: "rgba(30,30,30,0.95)", borderRadius: 20, paddingVertical: 28, paddingHorizontal: 24, alignItems: "center", width: "80%", maxWidth: 320, borderWidth: 1, borderColor: "rgba(255,255,255,0.15)" },
    challengeTitle: { fontSize: 22, fontWeight: "800", color: "#fff", marginBottom: 8 },
    challengeDesc: { fontSize: 14, color: "#aaa", textAlign: "center", marginBottom: 20, lineHeight: 20 },
    challengeSkip: { paddingVertical: 8 },
    challengeSkipText: { fontSize: 14, color: "#888", fontWeight: "600" },
    challengeChooseText: { fontSize: 13, color: "#ccc", fontWeight: "600", marginBottom: 12, textTransform: "uppercase", letterSpacing: 1 },
    colorChoiceRow: { flexDirection: "row", gap: 12, marginBottom: 12, width: "100%" },
    colorChoiceBtn: { flex: 1, paddingVertical: 14, borderRadius: 14, alignItems: "center", justifyContent: "center" },
    whiteBtn: { backgroundColor: "#f0f0f0" },
    blackBtn: { backgroundColor: "#333", borderWidth: 1, borderColor: "#555" },
    colorBtnEmoji: { fontSize: 28, marginBottom: 4 },
    whiteBtnText: { fontSize: 15, fontWeight: "800", color: "#222" },
    blackBtnText: { fontSize: 15, fontWeight: "800", color: "#f0f0f0" },
    forcedColorBadge: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "rgba(255,255,255,0.1)", paddingVertical: 10, paddingHorizontal: 16, borderRadius: 12, marginBottom: 16, width: "100%", justifyContent: "center" },
    forcedColorEmoji: { fontSize: 28 },
    forcedColorText: { fontSize: 16, fontWeight: "700", color: "#fff" },
});
