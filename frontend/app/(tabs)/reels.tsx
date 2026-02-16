import React, { useCallback, useEffect, useRef, useState } from "react";
import { useFocusEffect } from "expo-router";
import {
    View,
    FlatList,
    Dimensions,
    StyleSheet,
    ActivityIndicator,
    Text,
    RefreshControl,
    Share,
    TouchableOpacity,
    ScrollView,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Film, ArrowLeft, Crown } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { ReelCard } from "@/components/reels/ReelCard";
import { CommentsBottomSheet } from "@/components/reels/CommentsBottomSheet";
import { useReels, useLikeReel, useRecordView, useAvailableGrandmasters, useReelsByGrandmaster, useUserLikedReels, useSaveReel, useUserSavedReels, GrandmasterItem } from "@/services/reelApi";
import { useReelStore } from "@/stores/reelStore";
import { useAuthStore } from "@/stores/authStore";
import { colors } from "@/constants/themes";
import { Reel } from "@/types/reel";
import * as Haptics from "expo-haptics";

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get("window");

// Generate a unique session ID for guests
const generateSessionId = () => `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

type TabType = "all" | "grandmasters";

export default function ReelsScreen() {
    const insets = useSafeAreaInsets();

    // Tab state - "all" and "grandmasters"
    const [selectedTab, setSelectedTab] = useState<TabType>("all");
    const [selectedGrandmaster, setSelectedGrandmaster] = useState<string | null>(null);

    // Fetch grandmasters for picker
    const { data: grandmasters } = useAvailableGrandmasters();

    // Fetch reels based on selection
    const { data: fetchedReels, isLoading, error, refetch, isRefetching } = useReels();
    const { data: gmReelsData, isLoading: gmLoading, refetch: refetchGm } = useReelsByGrandmaster(selectedGrandmaster);

    // Fetch liked reels for authenticated users
    const { data: userLikedReels } = useUserLikedReels();

    // Fetch saved reels for authenticated users
    const { data: userSavedReels } = useUserSavedReels();

    const likeMutation = useLikeReel();
    const saveMutation = useSaveReel();
    const recordViewMutation = useRecordView();
    const [currentVisibleIndex, setCurrentVisibleIndex] = useState(0);
    const [commentsReelId, setCommentsReelId] = useState<string | null>(null);
    const [isImmersive, setIsImmersive] = useState(false);
    const [screenFocused, setScreenFocused] = useState(true);

    // Track screen focus to pause videos when navigating away
    useFocusEffect(
        useCallback(() => {
            setScreenFocused(true);
            return () => {
                setScreenFocused(false);
            };
        }, [])
    );

    // Track which reels have been viewed this session (prevents duplicate API calls)
    const viewedReelsRef = useRef<Set<string>>(new Set());
    const sessionIdRef = useRef<string>(generateSessionId());

    // Get user ID for view tracking
    const { user, isAuthenticated } = useAuthStore();
    const viewerId = isAuthenticated && user?.id ? user.id : sessionIdRef.current;

    // Use store's reels for live counts - this is critical for real-time updates
    const storeReels = useReelStore((s) => s.reels);
    const setReels = useReelStore((s) => s.setReels);
    const setCurrentIndex = useReelStore((s) => s.setCurrentIndex);
    const initLikedReels = useReelStore((s) => s.initLikedReels);
    const likeReel = useReelStore((s) => s.likeReel);
    const unlikeReel = useReelStore((s) => s.unlikeReel);
    const saveReel = useReelStore((s) => s.saveReel);
    const unsaveReel = useReelStore((s) => s.unsaveReel);
    const isLiked = useReelStore((s) => s.isLiked);
    const isSaved = useReelStore((s) => s.isSaved);
    const incrementViews = useReelStore((s) => s.incrementViews);
    // Get raw Sets to force re-render when liked/saved state changes
    const likedReelsSet = useReelStore((s) => s.likedReels);
    const savedReelsSet = useReelStore((s) => s.savedReels);

    const viewabilityConfig = useRef({
        itemVisiblePercentThreshold: 50,
    }).current;

    // Determine which reels to show
    const displayReels = selectedTab === "all"
        ? (storeReels.length > 0 ? storeReels : fetchedReels)
        : gmReelsData?.reels;

    // Sync liked reels from server for authenticated users
    useEffect(() => {
        // Always reinitialize liked reels from server data, even if empty
        // This ensures old likes are cleared when switching users
        if (userLikedReels !== undefined) {
            initLikedReels(userLikedReels || []);
        }
    }, [userLikedReels, initLikedReels]);

    // Sync saved reels from server for authenticated users
    const initSavedReels = useReelStore((s) => s.initSavedReels);
    useEffect(() => {
        // Always reinitialize saved reels from server data, even if empty
        if (userSavedReels !== undefined) {
            initSavedReels(userSavedReels || []);
        }
    }, [userSavedReels, initSavedReels]);

    // Sync fetched reels to store
    useEffect(() => {
        if (fetchedReels && fetchedReels.length > 0 && selectedTab === "all") {
            setReels(fetchedReels);
        }
    }, [fetchedReels, setReels, selectedTab]);

    const onViewableItemsChanged = useCallback(
        ({ viewableItems }: { viewableItems: Array<{ index: number | null; item: Reel }> }) => {
            if (viewableItems.length > 0 && viewableItems[0].index !== null) {
                const newIndex = viewableItems[0].index;
                setCurrentIndex(newIndex);
                setCurrentVisibleIndex(newIndex);
                Haptics.selectionAsync();
            }
        },
        [setCurrentIndex]
    );

    // Handle unique view recording (called after 2 seconds)
    const handleView = useCallback(
        (reelId: string) => {
            // Only send one view request per reel per session
            if (viewedReelsRef.current.has(reelId)) return;

            viewedReelsRef.current.add(reelId);

            // Update local count optimistically
            incrementViews(reelId);

            // Record view on backend
            recordViewMutation.mutate({ reelId, viewerId });
        },
        [viewerId, incrementViews, recordViewMutation]
    );

    // Optimistic like with backend sync
    const handleLike = useCallback(
        (reelId: string) => {
            const alreadyLiked = isLiked(reelId);

            // Optimistic local update (updates store reels)
            if (alreadyLiked) {
                unlikeReel(reelId);
            } else {
                likeReel(reelId);
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }

            // Sync with backend (fire and forget)
            likeMutation.mutate({
                reelId,
                action: alreadyLiked ? "unlike" : "like",
            });
        },
        [isLiked, likeReel, unlikeReel, likeMutation]
    );

    const handleSave = useCallback(
        (reelId: string) => {
            const alreadySaved = isSaved(reelId);

            // Optimistic local update
            if (alreadySaved) {
                unsaveReel(reelId);
            } else {
                saveReel(reelId);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            }

            // Sync with backend (fire and forget)
            saveMutation.mutate({
                reelId,
                action: alreadySaved ? "unsave" : "save",
            });
        },
        [isSaved, saveReel, unsaveReel, saveMutation]
    );

    const handleComment = useCallback((reel: Reel) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setCommentsReelId(reel._id);
    }, []);

    const handleShare = useCallback(async (reel: Reel) => {
        try {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            await Share.share({
                message: `Check out this chess reel: ${reel.content.title}\n\n${reel.content.description}`,
                title: reel.content.title,
            });
        } catch (error) {
            console.error("Share error:", error);
        }
    }, []);

    const handleTabChange = (tab: TabType) => {
        Haptics.selectionAsync();
        setSelectedTab(tab);
        setSelectedGrandmaster(null);
        setCurrentVisibleIndex(0);
    };

    const handleSelectGrandmaster = (name: string) => {
        Haptics.selectionAsync();
        setSelectedGrandmaster(name);
        setCurrentVisibleIndex(0);
    };

    const handleBackToGrandmasterList = () => {
        Haptics.selectionAsync();
        setSelectedGrandmaster(null);
    };

    const renderItem = useCallback(
        ({ item, index }: { item: Reel; index: number }) => (
            <ReelCard
                reel={item}
                isVisible={index === currentVisibleIndex && screenFocused}
                isLiked={isLiked(item._id)}
                isSaved={isSaved(item._id)}
                onLike={() => handleLike(item._id)}
                onSave={() => handleSave(item._id)}
                onComment={() => handleComment(item)}
                onShare={() => handleShare(item)}
                onView={() => handleView(item._id)}
                onImmersiveChange={setIsImmersive}
            />
        ),
        // Include likedReelsSet/savedReelsSet to force re-render when like state changes
        [currentVisibleIndex, screenFocused, isLiked, isSaved, likedReelsSet, savedReelsSet, handleLike, handleSave, handleComment, handleShare, handleView]
    );

    const isLoadingReels = selectedTab === "all" ? isLoading : gmLoading;

    if (isLoadingReels && !displayReels?.length) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.accent.cyan} />
                <Text style={styles.loadingText}>Loading Reels...</Text>
            </View>
        );
    }

    if (error && selectedTab === "all") {
        return (
            <View style={styles.errorContainer}>
                <Text style={styles.errorText}>Failed to load reels</Text>
                <Text style={styles.errorSubtext}>Pull down to retry</Text>
            </View>
        );
    }

    // Show grandmaster selection grid when Grandmasters tab selected but no grandmaster chosen
    if (selectedTab === "grandmasters" && !selectedGrandmaster) {
        return (
            <View style={styles.container}>
                <StatusBar style="light" />
                <LinearGradient
                    colors={[colors.background.primary, colors.background.secondary]}
                    style={styles.gmListContainer}
                >
                    {/* Simple Header with back button */}
                    <View style={[styles.gmListHeader, { paddingTop: insets.top + 10 }]}>
                        <TouchableOpacity onPress={() => handleTabChange("all")} style={styles.backButton}>
                            <ArrowLeft size={24} color={colors.text.primary} />
                        </TouchableOpacity>
                        <Text style={styles.gmListTitle}>Grandmasters</Text>
                        <View style={{ width: 40 }} />
                    </View>

                    <Text style={styles.gmListSubtitle}>Select a grandmaster to watch reels</Text>

                    {/* Grandmasters Grid */}
                    <ScrollView contentContainerStyle={styles.gmGrid} showsVerticalScrollIndicator={false}>
                        {grandmasters?.map((gm: GrandmasterItem) => (
                            <TouchableOpacity
                                key={gm.name}
                                style={styles.gmCard}
                                onPress={() => handleSelectGrandmaster(gm.name)}
                                activeOpacity={0.8}
                            >
                                <LinearGradient
                                    colors={[colors.accent.purple + "40", colors.accent.cyan + "20"]}
                                    style={styles.gmCardGradient}
                                >
                                    <Crown size={28} color={colors.accent.cyan} />
                                    <Text style={styles.gmCardName} numberOfLines={2}>
                                        {gm.name}
                                    </Text>
                                    <Text style={styles.gmCardCount}>
                                        {gm.reelCount} {gm.reelCount === 1 ? "reel" : "reels"}
                                    </Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        ))}
                        {(!grandmasters || grandmasters.length === 0) && (
                            <View style={styles.noGmContainer}>
                                <Crown size={48} color={colors.text.muted} />
                                <Text style={styles.noGmText}>No grandmasters yet</Text>
                                <Text style={styles.noGmSubtext}>Check back later!</Text>
                            </View>
                        )}
                    </ScrollView>
                </LinearGradient>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar style="light" />

            {/* Tab Navigation Header */}
            {!isImmersive && (
                <View style={[styles.tabHeader, { paddingTop: insets.top + 8 }]}>
                    {/* Back button when viewing grandmaster reels */}
                    {selectedTab === "grandmasters" && selectedGrandmaster && (
                        <TouchableOpacity onPress={handleBackToGrandmasterList} style={styles.headerBackButton}>
                            <ArrowLeft size={20} color={colors.text.primary} />
                        </TouchableOpacity>
                    )}

                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabButtons}>
                        <TouchableOpacity
                            onPress={() => handleTabChange("all")}
                            style={[styles.tabButton, selectedTab === "all" && styles.tabButtonActive]}
                        >
                            <Text style={[styles.tabButtonText, selectedTab === "all" && styles.tabButtonTextActive]}>
                                All Reels
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => handleTabChange("grandmasters")}
                            style={[styles.tabButton, selectedTab === "grandmasters" && styles.tabButtonActive]}
                        >
                            <Crown size={14} color={selectedTab === "grandmasters" ? "#fff" : colors.text.muted} />
                            <Text style={[styles.tabButtonText, selectedTab === "grandmasters" && styles.tabButtonTextActive]}>
                                Grandmasters
                            </Text>
                        </TouchableOpacity>
                    </ScrollView>
                </View>
            )}

            {/* Show selected grandmaster name as subtitle */}
            {!isImmersive && selectedTab === "grandmasters" && selectedGrandmaster && gmReelsData?.grandmaster && (
                <View style={styles.gmSubtitleContainer}>
                    <Text style={styles.gmSubtitle}>Viewing: {gmReelsData.grandmaster.name}</Text>
                </View>
            )}

            {(!displayReels || displayReels.length === 0) ? (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>No reels found</Text>
                    <Text style={styles.emptySubtext}>Try selecting a different grandmaster</Text>
                </View>
            ) : (
                <FlatList
                    data={displayReels}
                    renderItem={renderItem}
                    keyExtractor={(item) => item._id}
                    extraData={storeReels}
                    pagingEnabled
                    showsVerticalScrollIndicator={false}
                    snapToInterval={SCREEN_HEIGHT}
                    snapToAlignment="start"
                    decelerationRate="fast"
                    onViewableItemsChanged={onViewableItemsChanged}
                    viewabilityConfig={viewabilityConfig}
                    removeClippedSubviews
                    maxToRenderPerBatch={2}
                    windowSize={3}
                    initialNumToRender={1}
                    refreshControl={
                        <RefreshControl
                            refreshing={isRefetching}
                            onRefresh={selectedTab === "all" ? refetch : refetchGm}
                            tintColor={colors.accent.cyan}
                        />
                    }
                    getItemLayout={(_, index) => ({
                        length: SCREEN_HEIGHT,
                        offset: SCREEN_HEIGHT * index,
                        index,
                    })}
                />
            )}

            {/* Comments Bottom Sheet */}
            {commentsReelId && (
                <CommentsBottomSheet
                    reelId={commentsReelId}
                    visible={!!commentsReelId}
                    onClose={() => setCommentsReelId(null)}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background.primary,
    },
    tabHeader: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        backgroundColor: "rgba(0,0,0,0.7)",
        paddingBottom: 10,
    },
    tabButtons: {
        flexDirection: "row",
        paddingHorizontal: 16,
        gap: 10,
    },
    tabButton: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: "rgba(255,255,255,0.1)",
        height: 36,
    },
    tabButtonActive: {
        backgroundColor: colors.accent.purple,
    },
    tabButtonText: {
        color: colors.text.muted,
        fontSize: 13,
        fontWeight: "600",
    },
    tabButtonTextActive: {
        color: "#fff",
    },
    loadingContainer: {
        flex: 1,
        backgroundColor: colors.background.primary,
        justifyContent: "center",
        alignItems: "center",
        gap: 16,
    },
    loadingText: {
        color: colors.text.secondary,
        fontSize: 16,
    },
    errorContainer: {
        flex: 1,
        backgroundColor: colors.background.primary,
        justifyContent: "center",
        alignItems: "center",
        gap: 8,
    },
    errorText: {
        color: colors.danger,
        fontSize: 18,
        fontWeight: "600",
    },
    errorSubtext: {
        color: colors.text.muted,
        fontSize: 14,
    },
    emptyContainer: {
        flex: 1,
        backgroundColor: colors.background.primary,
        justifyContent: "center",
        alignItems: "center",
        gap: 8,
    },
    emptyText: {
        color: colors.text.primary,
        fontSize: 18,
        fontWeight: "600",
    },
    emptySubtext: {
        color: colors.text.muted,
        fontSize: 14,
    },
    // Grandmaster List View styles
    gmListContainer: {
        flex: 1,
    },
    gmListHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingBottom: 16,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "rgba(255,255,255,0.1)",
        alignItems: "center",
        justifyContent: "center",
    },
    gmListTitle: {
        color: colors.text.primary,
        fontSize: 20,
        fontWeight: "700",
    },
    gmListSubtitle: {
        color: colors.text.muted,
        fontSize: 14,
        textAlign: "center",
        marginTop: 4,
        marginBottom: 12,
    },
    gmGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        paddingHorizontal: 12,
        gap: 12,
        paddingBottom: 100,
    },
    gmCard: {
        width: (SCREEN_WIDTH - 48) / 2,
        borderRadius: 16,
        overflow: "hidden",
    },
    gmCardGradient: {
        padding: 20,
        alignItems: "center",
        justifyContent: "center",
        minHeight: 140,
    },
    gmCardName: {
        color: colors.text.primary,
        fontSize: 14,
        fontWeight: "600",
        marginTop: 12,
        textAlign: "center",
    },
    gmCardCount: {
        color: colors.text.muted,
        fontSize: 11,
        marginTop: 4,
        textAlign: "center",
    },
    noGmContainer: {
        flex: 1,
        width: SCREEN_WIDTH - 32,
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 60,
    },
    noGmText: {
        color: colors.text.primary,
        fontSize: 18,
        fontWeight: "600",
        marginTop: 16,
    },
    noGmSubtext: {
        color: colors.text.muted,
        fontSize: 14,
        marginTop: 4,
    },
    headerBackButton: {
        marginLeft: 12,
        marginRight: 4,
        padding: 4,
    },
    gmSubtitleContainer: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: colors.glass.light,
    },
    gmSubtitle: {
        color: colors.accent.cyan,
        fontSize: 14,
        fontWeight: "600",
        textAlign: "center",
    },
});
