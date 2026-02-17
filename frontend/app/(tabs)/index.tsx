import React, { useRef, useEffect, useMemo } from "react";
import { View, Text, ScrollView, TouchableOpacity, Animated, Image, Dimensions, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GlassCard } from "@/components/ui/GlassCard";
import { AnimatedButton } from "@/components/ui/AnimatedButton";
import { useAuthStore } from "@/stores/authStore";
import { useReelStore } from "@/stores/reelStore";
import { useStreak, useRecordActivity } from "@/services/streakApi";
import { colors } from "@/constants/themes";
import {
    Flame,
    TrendingUp,
    Eye,
    Heart,
    Film,
    ChevronRight,
    Sparkles,
    Play,
    Crown,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function HomeScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { user, isAuthenticated } = useAuthStore();

    const reels = useReelStore((s) => s.reels);
    const likedReelsSet = useReelStore((s) => s.likedReels);

    const likedCount = useMemo(() => likedReelsSet.size, [likedReelsSet]);

    // Streak data from API
    const { data: streakData } = useStreak();
    const recordActivity = useRecordActivity();

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;
    const hasRecordedActivity = useRef(false);

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 600,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 600,
                useNativeDriver: true,
            }),
        ]).start();

        // Record user activity when they open the home screen (only once per session)
        if (isAuthenticated && !hasRecordedActivity.current) {
            hasRecordedActivity.current = true;
            recordActivity.mutate();
        }
    }, [isAuthenticated]);

    const handleWatchReels = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        router.push("/(tabs)/reels");
    };

    // Featured reels (first 3)
    const featuredReels = reels.slice(0, 3);

    // Trending reels (next 4)
    const trendingReels = reels.slice(3, 7);

    // Stats - use real streak from API
    const stats = {
        reelsLiked: likedCount,
        streak: streakData?.currentStreak || 0,
    };

    return (
        <LinearGradient
            colors={[colors.background.primary, colors.background.secondary]}
            style={styles.container}
        >
            <ScrollView
                contentContainerStyle={[
                    styles.scrollContent,
                    { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 90 }
                ]}
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <Animated.View style={[styles.header, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
                    <Text style={styles.greeting}>{getGreeting()}</Text>
                    <Text style={styles.username}>
                        {isAuthenticated ? user?.username : "Chess Lover"}
                    </Text>
                </Animated.View>

                {/* Hero CTA */}
                <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
                    <TouchableOpacity onPress={handleWatchReels} activeOpacity={0.9}>
                        <LinearGradient
                            colors={["#7B2FF7", "#4F46E5", "#2563EB"]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.heroCard}
                        >
                            <View style={styles.heroContent}>
                                <View style={styles.heroTextContainer}>
                                    <View style={styles.heroBadge}>
                                        <Crown size={12} color="#FCD34D" />
                                        <Text style={styles.heroBadgeText}>LEARN CHESS</Text>
                                    </View>
                                    <Text style={styles.heroTitle}>Master the Game</Text>
                                    <Text style={styles.heroSubtitle}>
                                        Quick tips & strategies from grandmasters
                                    </Text>
                                </View>
                                <View style={styles.heroPlayButton}>
                                    <Play size={28} color="#FFFFFF" fill="#FFFFFF" />
                                </View>
                            </View>

                            {/* Decorative circles */}
                            <View style={styles.heroDecor1} />
                            <View style={styles.heroDecor2} />
                        </LinearGradient>
                    </TouchableOpacity>
                </Animated.View>

                {/* Stats Row */}
                <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
                    <View style={styles.statsRow}>
                        {/* Liked Stat */}
                        <View style={styles.statCard}>
                            <LinearGradient
                                colors={["#FF6B6B", "#EE5A6F"]}
                                style={styles.statIconBg}
                            >
                                <Heart size={22} color="#FFFFFF" fill="#FFFFFF" />
                            </LinearGradient>
                            <Text style={styles.statValue}>{stats.reelsLiked}</Text>
                            <Text style={styles.statLabel}>Liked</Text>
                        </View>

                        {/* Divider */}
                        <View style={styles.statDivider} />

                        {/* Streak Stat */}
                        <View style={styles.statCard}>
                            <LinearGradient
                                colors={["#F59E0B", "#EF6C00"]}
                                style={styles.statIconBg}
                            >
                                <Flame size={22} color="#FFFFFF" fill="#FFFFFF" />
                            </LinearGradient>
                            <Text style={styles.statValue}>{stats.streak}</Text>
                            <Text style={styles.statLabel}>Day Streak</Text>
                        </View>
                    </View>
                </Animated.View>

                {/* Featured Reels */}
                {featuredReels.length > 0 && (
                    <Animated.View style={{ opacity: fadeAnim, marginTop: 28 }}>
                        <View style={styles.sectionHeader}>
                            <View style={styles.sectionTitleContainer}>
                                <Sparkles size={18} color={colors.accent.cyan} />
                                <Text style={styles.sectionTitle}>Featured</Text>
                            </View>
                            <TouchableOpacity
                                onPress={handleWatchReels}
                                style={styles.seeAllButton}
                            >
                                <Text style={styles.seeAllText}>See All</Text>
                                <ChevronRight size={16} color={colors.accent.cyan} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.featuredScroll}
                        >
                            {featuredReels.map((reel) => (
                                <TouchableOpacity
                                    key={reel._id}
                                    style={styles.featuredCard}
                                    onPress={handleWatchReels}
                                    activeOpacity={0.85}
                                >
                                    {reel.video?.thumbnail ? (
                                        <Image
                                            source={{ uri: reel.video.thumbnail }}
                                            style={styles.featuredImage}
                                        />
                                    ) : (
                                        <View style={[styles.featuredImage, { backgroundColor: colors.glass.medium, justifyContent: "center", alignItems: "center" }]}>
                                            <Film size={32} color={colors.text.muted} />
                                        </View>
                                    )}
                                    <LinearGradient
                                        colors={["transparent", "rgba(0,0,0,0.85)"]}
                                        style={styles.featuredOverlay}
                                    >
                                        <Text style={styles.featuredTitle} numberOfLines={2}>
                                            {reel.content.title}
                                        </Text>
                                        <View style={styles.featuredStats}>
                                            <Eye size={12} color="rgba(255,255,255,0.7)" />
                                            <Text style={styles.featuredStatText}>
                                                {reel.engagement?.views || 0} views
                                            </Text>
                                        </View>
                                    </LinearGradient>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </Animated.View>
                )}

                {/* Trending */}
                {trendingReels.length > 0 && (
                    <Animated.View style={{ opacity: fadeAnim, marginTop: 28 }}>
                        <View style={styles.sectionHeader}>
                            <View style={styles.sectionTitleContainer}>
                                <TrendingUp size={18} color={colors.success} />
                                <Text style={styles.sectionTitle}>Trending</Text>
                            </View>
                        </View>

                        {trendingReels.map((reel) => (
                            <TouchableOpacity
                                key={reel._id}
                                onPress={handleWatchReels}
                                activeOpacity={0.7}
                                style={styles.trendingCard}
                            >
                                {reel.video?.thumbnail ? (
                                    <Image
                                        source={{ uri: reel.video.thumbnail }}
                                        style={styles.trendingThumb}
                                    />
                                ) : (
                                    <View style={[styles.trendingThumb, { backgroundColor: colors.glass.medium, justifyContent: "center", alignItems: "center" }]}>
                                        <Film size={20} color={colors.text.muted} />
                                    </View>
                                )}
                                <View style={styles.trendingInfo}>
                                    <Text style={styles.trendingTitle} numberOfLines={1}>
                                        {reel.content.title}
                                    </Text>
                                    <Text style={styles.trendingDesc} numberOfLines={1}>
                                        {reel.content.description}
                                    </Text>
                                </View>
                                <ChevronRight size={20} color={colors.text.muted} />
                            </TouchableOpacity>
                        ))}
                    </Animated.View>
                )}

                {/* Empty State */}
                {reels.length === 0 && (
                    <Animated.View style={{ opacity: fadeAnim, marginTop: 40 }}>
                        <GlassCard style={styles.emptyState}>
                            <View style={styles.emptyIconBg}>
                                <Film size={36} color={colors.accent.cyan} />
                            </View>
                            <Text style={styles.emptyTitle}>No Reels Yet</Text>
                            <Text style={styles.emptySubtitle}>
                                Head to the Reels tab to discover chess content!
                            </Text>
                            <AnimatedButton
                                title="Explore Reels"
                                size="md"
                                onPress={handleWatchReels}
                            />
                        </GlassCard>
                    </Animated.View>
                )}
            </ScrollView>
        </LinearGradient>
    );
}

function getGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning,";
    if (hour < 18) return "Good afternoon,";
    return "Good evening,";
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 40,
    },
    header: {
        marginBottom: 24,
    },
    greeting: {
        color: colors.text.secondary,
        fontSize: 15,
        fontWeight: "500",
        letterSpacing: 0.3,
    },
    username: {
        color: colors.text.primary,
        fontSize: 30,
        fontWeight: "800",
        marginTop: 4,
        letterSpacing: -0.5,
    },

    // Hero Card
    heroCard: {
        borderRadius: 20,
        padding: 24,
        marginBottom: 20,
        overflow: "hidden",
        minHeight: 150,
        justifyContent: "center",
    },
    heroContent: {
        flexDirection: "row",
        alignItems: "center",
        zIndex: 2,
    },
    heroTextContainer: {
        flex: 1,
    },
    heroBadge: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "rgba(255,255,255,0.15)",
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        alignSelf: "flex-start",
        gap: 5,
        marginBottom: 10,
    },
    heroBadgeText: {
        color: "#FCD34D",
        fontSize: 10,
        fontWeight: "800",
        letterSpacing: 1.2,
    },
    heroTitle: {
        color: "#FFFFFF",
        fontSize: 24,
        fontWeight: "800",
        letterSpacing: -0.3,
    },
    heroSubtitle: {
        color: "rgba(255,255,255,0.75)",
        fontSize: 14,
        marginTop: 6,
        lineHeight: 20,
    },
    heroPlayButton: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: "rgba(255,255,255,0.2)",
        alignItems: "center",
        justifyContent: "center",
        marginLeft: 16,
        borderWidth: 2,
        borderColor: "rgba(255,255,255,0.3)",
    },
    heroDecor1: {
        position: "absolute",
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: "rgba(255,255,255,0.06)",
        top: -30,
        right: -20,
    },
    heroDecor2: {
        position: "absolute",
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: "rgba(255,255,255,0.04)",
        bottom: -20,
        left: 40,
    },

    // Stats Row
    statsRow: {
        flexDirection: "row",
        backgroundColor: "rgba(255,255,255,0.06)",
        borderRadius: 20,
        paddingVertical: 22,
        paddingHorizontal: 16,
        alignItems: "center",
    },
    statCard: {
        flex: 1,
        alignItems: "center",
    },
    statIconBg: {
        width: 48,
        height: 48,
        borderRadius: 16,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 10,
    },
    statValue: {
        color: colors.text.primary,
        fontSize: 24,
        fontWeight: "800",
        letterSpacing: -0.5,
    },
    statLabel: {
        color: colors.text.muted,
        fontSize: 12,
        fontWeight: "500",
        marginTop: 2,
        letterSpacing: 0.3,
    },
    statDivider: {
        width: 1,
        height: 50,
        backgroundColor: "rgba(255,255,255,0.1)",
    },

    // Section Headers
    sectionHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 14,
    },
    sectionTitleContainer: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    sectionTitle: {
        color: colors.text.primary,
        fontSize: 18,
        fontWeight: "700",
    },
    seeAllButton: {
        flexDirection: "row",
        alignItems: "center",
        gap: 2,
    },
    seeAllText: {
        color: colors.accent.cyan,
        fontSize: 14,
        fontWeight: "500",
    },

    // Featured
    featuredScroll: {
        gap: 14,
    },
    featuredCard: {
        width: SCREEN_WIDTH * 0.58,
        height: 210,
        borderRadius: 18,
        overflow: "hidden",
    },
    featuredImage: {
        width: "100%",
        height: "100%",
    },
    featuredOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: "flex-end",
        padding: 14,
    },
    featuredTitle: {
        color: "#FFFFFF",
        fontSize: 15,
        fontWeight: "700",
        marginBottom: 4,
    },
    featuredStats: {
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
    },
    featuredStatText: {
        color: "rgba(255,255,255,0.7)",
        fontSize: 12,
    },

    // Trending
    trendingCard: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "rgba(255,255,255,0.05)",
        borderRadius: 14,
        marginBottom: 10,
        padding: 12,
    },
    trendingThumb: {
        width: 54,
        height: 54,
        borderRadius: 12,
        marginRight: 14,
    },
    trendingInfo: {
        flex: 1,
    },
    trendingTitle: {
        color: colors.text.primary,
        fontSize: 15,
        fontWeight: "600",
    },
    trendingDesc: {
        color: colors.text.muted,
        fontSize: 12,
        marginTop: 3,
    },

    // Empty State
    emptyState: {
        alignItems: "center",
        padding: 40,
    },
    emptyIconBg: {
        width: 72,
        height: 72,
        borderRadius: 24,
        backgroundColor: colors.accent.cyan + "15",
        alignItems: "center",
        justifyContent: "center",
    },
    emptyTitle: {
        color: colors.text.primary,
        fontSize: 18,
        fontWeight: "700",
        marginTop: 16,
    },
    emptySubtitle: {
        color: colors.text.muted,
        fontSize: 14,
        textAlign: "center",
        marginTop: 8,
        marginBottom: 20,
        lineHeight: 20,
    },
});
