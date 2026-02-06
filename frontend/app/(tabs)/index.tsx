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
    const hasRecordedActivity = useRef(false);

    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
        }).start();

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
                    { paddingTop: insets.top + 10, paddingBottom: insets.bottom + 80 }
                ]}
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
                    <Text style={styles.greeting}>{getGreeting()}</Text>
                    <Text style={styles.username}>
                        {isAuthenticated ? user?.username : "Chess Lover"} 👋
                    </Text>
                </Animated.View>

                {/* Hero CTA */}
                <Animated.View style={{ opacity: fadeAnim }}>
                    <GlassCard
                        gradient
                        gradientColors={[colors.accent.purple + "40", colors.accent.cyan + "20"]}
                        style={styles.heroCard}
                    >
                        <View style={styles.heroContent}>
                            <View style={styles.heroTextContainer}>
                                <Text style={styles.heroTitle}>Learn Chess</Text>
                                <Text style={styles.heroSubtitle}>
                                    Watch quick tips & strategies from chess masters
                                </Text>
                            </View>
                            <View style={styles.heroIcon}>
                                <Sparkles size={32} color={colors.accent.cyan} />
                            </View>
                        </View>
                        <AnimatedButton
                            title="Watch Reels"
                            size="md"
                            icon={<Film size={18} color="#FFFFFF" />}
                            onPress={handleWatchReels}
                        />
                    </GlassCard>
                </Animated.View>

                {/* Stats Row */}
                <Animated.View style={{ opacity: fadeAnim }}>
                    <View style={styles.statsRow}>
                        <GlassCard variant="light" style={styles.statCard}>
                            <Heart size={18} color={colors.danger} />
                            <Text style={styles.statValue}>{stats.reelsLiked}</Text>
                            <Text style={styles.statLabel}>Liked</Text>
                        </GlassCard>
                        <GlassCard variant="light" style={styles.statCard}>
                            <Flame size={18} color={colors.warning} />
                            <Text style={styles.statValue}>{stats.streak}🔥</Text>
                            <Text style={styles.statLabel}>Streak</Text>
                        </GlassCard>
                    </View>
                </Animated.View>

                {/* Featured Reels */}
                {featuredReels.length > 0 && (
                    <Animated.View style={{ opacity: fadeAnim, marginTop: 24 }}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Featured</Text>
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
                                    activeOpacity={0.8}
                                >
                                    <Image
                                        source={{ uri: reel.video.thumbnail }}
                                        style={styles.featuredImage}
                                    />
                                    <LinearGradient
                                        colors={["transparent", "rgba(0,0,0,0.9)"]}
                                        style={styles.featuredOverlay}
                                    >
                                        <Text style={styles.featuredTitle} numberOfLines={2}>
                                            {reel.content.title}
                                        </Text>
                                        <View style={styles.featuredStats}>
                                            <Eye size={12} color={colors.text.secondary} />
                                            <Text style={styles.featuredStatText}>
                                                {reel.engagement?.views || 0}
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
                    <Animated.View style={{ opacity: fadeAnim, marginTop: 24 }}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>
                                <TrendingUp size={18} color={colors.success} /> Trending
                            </Text>
                        </View>

                        {trendingReels.map((reel) => (
                            <TouchableOpacity
                                key={reel._id}
                                onPress={handleWatchReels}
                                activeOpacity={0.7}
                            >
                                <GlassCard variant="light" style={styles.trendingCard}>
                                    <Image
                                        source={{ uri: reel.video.thumbnail }}
                                        style={styles.trendingThumb}
                                    />
                                    <View style={styles.trendingInfo}>
                                        <Text style={styles.trendingTitle} numberOfLines={1}>
                                            {reel.content.title}
                                        </Text>
                                        <Text style={styles.trendingDesc} numberOfLines={1}>
                                            {reel.content.description}
                                        </Text>
                                    </View>
                                    <ChevronRight size={20} color={colors.text.muted} />
                                </GlassCard>
                            </TouchableOpacity>
                        ))}
                    </Animated.View>
                )}

                {/* Empty State */}
                {reels.length === 0 && (
                    <Animated.View style={{ opacity: fadeAnim, marginTop: 40 }}>
                        <GlassCard style={styles.emptyState}>
                            <Film size={48} color={colors.text.muted} />
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
    safeArea: {
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
        fontSize: 16,
    },
    username: {
        color: colors.text.primary,
        fontSize: 28,
        fontWeight: "700",
        marginTop: 4,
    },
    heroCard: {
        padding: 20,
        marginBottom: 20,
    },
    heroContent: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 16,
    },
    heroTextContainer: {
        flex: 1,
    },
    heroTitle: {
        color: colors.text.primary,
        fontSize: 22,
        fontWeight: "700",
    },
    heroSubtitle: {
        color: colors.text.secondary,
        fontSize: 14,
        marginTop: 4,
    },
    heroIcon: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: colors.accent.cyan + "20",
        alignItems: "center",
        justifyContent: "center",
    },
    statsRow: {
        flexDirection: "row",
        gap: 10,
    },
    statCard: {
        flex: 1,
        alignItems: "center",
        paddingVertical: 16,
    },
    statValue: {
        color: colors.text.primary,
        fontSize: 20,
        fontWeight: "700",
        marginTop: 8,
    },
    statLabel: {
        color: colors.text.muted,
        fontSize: 11,
        marginTop: 4,
    },
    sectionHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 12,
    },
    sectionTitle: {
        color: colors.text.primary,
        fontSize: 18,
        fontWeight: "600",
    },
    seeAllButton: {
        flexDirection: "row",
        alignItems: "center",
    },
    seeAllText: {
        color: colors.accent.cyan,
        fontSize: 14,
        fontWeight: "500",
    },
    featuredScroll: {
        gap: 12,
    },
    featuredCard: {
        width: SCREEN_WIDTH * 0.55,
        height: 200,
        borderRadius: 16,
        overflow: "hidden",
    },
    featuredImage: {
        width: "100%",
        height: "100%",
    },
    featuredOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: "flex-end",
        padding: 12,
    },
    featuredTitle: {
        color: colors.text.primary,
        fontSize: 14,
        fontWeight: "600",
        marginBottom: 4,
    },
    featuredStats: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
    },
    featuredStatText: {
        color: colors.text.secondary,
        fontSize: 12,
    },
    trendingCard: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 10,
        padding: 12,
    },
    trendingThumb: {
        width: 50,
        height: 50,
        borderRadius: 8,
        marginRight: 12,
    },
    trendingInfo: {
        flex: 1,
    },
    trendingTitle: {
        color: colors.text.primary,
        fontSize: 14,
        fontWeight: "600",
    },
    trendingDesc: {
        color: colors.text.muted,
        fontSize: 12,
        marginTop: 2,
    },
    emptyState: {
        alignItems: "center",
        padding: 40,
    },
    emptyTitle: {
        color: colors.text.primary,
        fontSize: 18,
        fontWeight: "600",
        marginTop: 16,
    },
    emptySubtitle: {
        color: colors.text.muted,
        fontSize: 14,
        textAlign: "center",
        marginTop: 8,
        marginBottom: 20,
    },
});
