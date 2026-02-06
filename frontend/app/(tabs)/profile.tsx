import React, { useRef, useEffect, useState, useMemo } from "react";
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    Animated,
    Alert,
    StyleSheet,
    Image,
    Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GlassCard } from "@/components/ui/GlassCard";
import { AnimatedButton } from "@/components/ui/AnimatedButton";
import { SettingsSidebar } from "@/components/ui/SettingsSidebar";
import { useAuthStore } from "@/stores/authStore";
import { useThemeStore } from "@/stores/themeStore";
import { useReelStore } from "@/stores/reelStore";
import { useStreak } from "@/services/streakApi";
import { colors } from "@/constants/themes";
import { authService } from "@/services/authService";
import {
    Settings,
    Video,
    Flame,
    TrendingUp,
    Heart,
    Eye,
    Plus,
    User,
    Shield,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function ProfileScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { user, isAuthenticated, isAdmin } = useAuthStore();
    const { hapticEnabled } = useThemeStore();

    // Use stable selectors
    const savedReelsSet = useReelStore((s) => s.savedReels);
    const likedReelsSet = useReelStore((s) => s.likedReels);
    const reels = useReelStore((s) => s.reels);

    const savedReelIds = useMemo(() => Array.from(savedReelsSet), [savedReelsSet]);
    const likedCount = useMemo(() => likedReelsSet.size, [likedReelsSet]);

    const [activeTab, setActiveTab] = useState<"saved" | "liked">("saved");
    const [showSettings, setShowSettings] = useState(false);

    // Streak data from API
    const { data: streakData } = useStreak();

    const [stats, setStats] = useState({
        reelsLiked: 0,
        reelsSaved: 0,
    });

    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
        }).start();

        // Update stats from store
        setStats({
            reelsLiked: likedCount,
            reelsSaved: savedReelIds.length,
        });
    }, [likedCount, savedReelIds.length]);

    const handleOpenSettings = () => {
        if (hapticEnabled) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        setShowSettings(true);
    };

    const handleLogout = async () => {
        Alert.alert(
            "Log Out",
            "This will clear all your local data. Continue?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Log Out",
                    style: "destructive",
                    onPress: async () => {
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                        await authService.logout();
                        router.replace("/(auth)/login");
                    },
                },
            ]
        );
    };

    const savedReels = reels.filter((r) => savedReelIds.includes(r._id));
    const likedReels = reels.filter((r) => likedReelsSet.has(r._id));

    const username = isAuthenticated ? user?.username : "Guest";
    const title = "CHESS ENTHUSIAST";

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
                <Animated.View style={{ opacity: fadeAnim }}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.headerTitle}>Profile</Text>
                        <View style={styles.headerActions}>
                            {/* Only show upload button for admin users */}
                            {isAdmin && (
                                <TouchableOpacity
                                    onPress={() => router.push("/admin/upload" as any)}
                                    style={styles.settingsButton}
                                >
                                    <Video size={22} color={colors.text.primary} />
                                </TouchableOpacity>
                            )}
                            <TouchableOpacity
                                onPress={handleOpenSettings}
                                style={styles.settingsButton}
                            >
                                <Settings size={22} color={colors.text.primary} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Avatar & User Info */}
                    <View style={styles.profileSection}>
                        <View style={styles.avatarContainer}>
                            <LinearGradient
                                colors={[colors.accent.cyan, colors.success]}
                                style={styles.avatarRing}
                            >
                                <View style={styles.avatarInner}>
                                    {user?.profile?.avatarUrl ? (
                                        <Image
                                            source={{ uri: user.profile.avatarUrl }}
                                            style={styles.avatar}
                                        />
                                    ) : (
                                        <View style={styles.avatarPlaceholder}>
                                            <User size={40} color={colors.text.primary} />
                                        </View>
                                    )}
                                </View>
                            </LinearGradient>
                        </View>

                        <Text style={styles.username}>{username}</Text>
                        <Text style={styles.userTitle}>{title}</Text>

                        {/* Streak Badge */}
                        <View style={styles.streakBadge}>
                            <Flame size={14} color={colors.warning} />
                            <Text style={styles.streakText}>{streakData?.currentStreak || 0}-Day Streak</Text>
                        </View>

                        {/* Admin Dashboard Button - Only visible for admins */}
                        {isAdmin && (
                            <TouchableOpacity
                                onPress={() => {
                                    if (hapticEnabled) {
                                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                    }
                                    router.push("/admin/dashboard" as any);
                                }}
                                style={styles.adminButton}
                            >
                                <Shield size={16} color={colors.text.primary} />
                                <Text style={styles.adminButtonText}>Admin Dashboard</Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* Stats Row */}
                    <GlassCard style={styles.statsCard}>
                        <View style={styles.statsRow}>
                            <View style={styles.statItem}>
                                <View style={styles.statIconRow}>
                                    <Heart size={14} color={colors.danger} />
                                </View>
                                <Text style={styles.statValue}>{stats.reelsLiked}</Text>
                                <Text style={styles.statLabel}>LIKED</Text>
                            </View>

                            <View style={styles.statDivider} />

                            <View style={styles.statItem}>
                                <View style={styles.statIconRow}>
                                    <TrendingUp size={14} color={colors.success} />
                                </View>
                                <Text style={styles.statValue}>{stats.reelsSaved}</Text>
                                <Text style={styles.statLabel}>SAVED</Text>
                            </View>
                        </View>
                    </GlassCard>

                    {/* Tabs */}
                    <View style={styles.tabsContainer}>
                        <TouchableOpacity
                            style={[styles.tab, activeTab === "saved" && styles.tabActive]}
                            onPress={() => {
                                setActiveTab("saved");
                                Haptics.selectionAsync();
                            }}
                        >
                            <Text style={[styles.tabText, activeTab === "saved" && styles.tabTextActive]}>
                                Saved Reels
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.tab, activeTab === "liked" && styles.tabActive]}
                            onPress={() => {
                                setActiveTab("liked");
                                Haptics.selectionAsync();
                            }}
                        >
                            <Text style={[styles.tabText, activeTab === "liked" && styles.tabTextActive]}>
                                Liked
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* Reels Grid */}
                    <View style={styles.reelsGrid}>
                        {(activeTab === "saved" ? savedReels : likedReels).slice(0, 4).map((reel, index) => (
                            <TouchableOpacity
                                key={reel._id}
                                style={styles.reelCard}
                                onPress={() => {
                                    if (hapticEnabled) {
                                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                    }
                                    router.push("/(tabs)/reels");
                                }}
                            >
                                {reel.video?.thumbnail ? (
                                    <Image
                                        source={{ uri: reel.video.thumbnail }}
                                        style={styles.reelImage}
                                    />
                                ) : (
                                    <View style={[styles.reelImage, { backgroundColor: colors.glass.medium, justifyContent: "center", alignItems: "center" }]}>
                                        <Video size={32} color={colors.text.muted} />
                                    </View>
                                )}
                                <LinearGradient
                                    colors={["transparent", "rgba(0,0,0,0.8)"]}
                                    style={styles.reelOverlay}
                                >
                                    <Text style={styles.reelTitle} numberOfLines={2}>
                                        {reel.content.title}
                                    </Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        ))}

                        {/* Discover More Card */}
                        <TouchableOpacity
                            style={styles.discoverCard}
                            onPress={() => router.push("/(tabs)/reels")}
                        >
                            <View style={styles.discoverIcon}>
                                <Plus size={24} color={colors.text.primary} />
                            </View>
                            <Text style={styles.discoverText}>Discover More</Text>
                        </TouchableOpacity>
                    </View>

                    {!isAuthenticated && (
                        <View style={styles.authSection}>
                            <AnimatedButton
                                title="Sign In"
                                size="lg"
                                onPress={() => router.push("/(auth)/login")}
                            />
                        </View>
                    )}
                </Animated.View>
            </ScrollView>

            {/* Settings Sidebar */}
            <SettingsSidebar
                isOpen={showSettings}
                onClose={() => setShowSettings(false)}
            />
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    safeArea: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 16,
    },
    headerTitle: {
        color: colors.text.primary,
        fontSize: 20,
        fontWeight: "600",
    },
    settingsButton: {
        padding: 8,
    },
    headerActions: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    profileSection: {
        alignItems: "center",
        marginBottom: 24,
    },
    avatarContainer: {
        position: "relative",
        marginBottom: 12,
    },
    avatarRing: {
        width: 90,
        height: 90,
        borderRadius: 45,
        padding: 3,
    },
    avatarInner: {
        flex: 1,
        borderRadius: 42,
        overflow: "hidden",
        backgroundColor: colors.background.secondary,
    },
    avatar: {
        width: "100%",
        height: "100%",
    },
    avatarPlaceholder: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: colors.glass.medium,
    },
    username: {
        color: colors.text.primary,
        fontSize: 24,
        fontWeight: "700",
        marginBottom: 4,
    },
    userTitle: {
        color: colors.accent.cyan,
        fontSize: 12,
        fontWeight: "600",
        letterSpacing: 1,
        marginBottom: 12,
    },
    streakBadge: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: colors.warning + "20",
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.warning + "40",
        gap: 6,
    },
    streakText: {
        color: colors.warning,
        fontSize: 12,
        fontWeight: "600",
    },
    statsCard: {
        marginBottom: 24,
        padding: 20,
    },
    statsRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    statItem: {
        flex: 1,
        alignItems: "center",
    },
    statIconRow: {
        marginBottom: 4,
    },
    statValue: {
        color: colors.text.primary,
        fontSize: 24,
        fontWeight: "700",
    },
    statLabel: {
        color: colors.text.muted,
        fontSize: 10,
        fontWeight: "600",
        letterSpacing: 0.5,
        marginTop: 4,
    },
    statDivider: {
        width: 1,
        height: 40,
        backgroundColor: colors.glass.medium,
    },
    tabsContainer: {
        flexDirection: "row",
        marginBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: colors.glass.medium,
    },
    tab: {
        flex: 1,
        paddingVertical: 12,
        alignItems: "center",
    },
    tabActive: {
        borderBottomWidth: 2,
        borderBottomColor: colors.text.primary,
    },
    tabText: {
        color: colors.text.muted,
        fontSize: 14,
        fontWeight: "600",
    },
    tabTextActive: {
        color: colors.text.primary,
    },
    reelsGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 12,
    },
    reelCard: {
        width: (SCREEN_WIDTH - 52) / 2,
        height: 160,
        borderRadius: 12,
        overflow: "hidden",
        backgroundColor: colors.glass.light,
    },
    reelImage: {
        width: "100%",
        height: "100%",
    },
    reelOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: "flex-end",
        padding: 10,
    },
    reelTitle: {
        color: colors.text.primary,
        fontSize: 12,
        fontWeight: "600",
        lineHeight: 16,
    },
    discoverCard: {
        width: (SCREEN_WIDTH - 52) / 2,
        height: 160,
        borderRadius: 12,
        backgroundColor: colors.glass.light,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: colors.glass.medium,
        borderStyle: "dashed",
    },
    discoverIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: colors.glass.medium,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 8,
    },
    discoverText: {
        color: colors.text.secondary,
        fontSize: 12,
        fontWeight: "500",
    },
    authSection: {
        marginTop: 24,
    },
    adminButton: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: colors.danger + "20",
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: colors.danger + "40",
        gap: 8,
        marginTop: 12,
    },
    adminButtonText: {
        color: colors.text.primary,
        fontSize: 14,
        fontWeight: "600",
    },
});
