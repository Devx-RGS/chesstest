import React, { useCallback, useEffect, useRef, useState } from "react";
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
    Image,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FolderOpen, User, ArrowLeft, Film } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { ReelCard } from "@/components/reels/ReelCard";
import { CommentsBottomSheet } from "@/components/reels/CommentsBottomSheet";
import { useReels, useLikeReel, useRecordView, usePublicGrandmasters, useReelsByFolder, useUserLikedReels, useSaveReel, useUserSavedReels } from "@/services/reelApi";
import { useReelStore } from "@/stores/reelStore";
import { useAuthStore } from "@/stores/authStore";
import { colors } from "@/constants/themes";
import { Reel } from "@/types/reel";
import * as Haptics from "expo-haptics";

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get("window");

// Generate a unique session ID for guests
const generateSessionId = () => `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

type FolderType = "all" | "random" | "grandmaster";

export default function ReelsScreen() {
    const insets = useSafeAreaInsets();

    // Folder state
    const [selectedFolder, setSelectedFolder] = useState<FolderType>("all");
    const [selectedGrandmaster, setSelectedGrandmaster] = useState<string | null>(null);

    // Fetch grandmasters for picker
    const { data: grandmasters } = usePublicGrandmasters();

    // Fetch reels based on folder selection
    const { data: fetchedReels, isLoading, error, refetch, isRefetching } = useReels();
    const { data: folderReels, isLoading: folderLoading, refetch: refetchFolder } = useReelsByFolder(
        selectedFolder === "all" ? undefined : selectedFolder,
        selectedGrandmaster || undefined
    );

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

    const viewabilityConfig = useRef({
        itemVisiblePercentThreshold: 50,
    }).current;

    // Determine which reels to show
    const displayReels = selectedFolder === "all"
        ? (storeReels.length > 0 ? storeReels : fetchedReels)
        : folderReels;

    // Sync liked reels from server for authenticated users
    useEffect(() => {
        if (userLikedReels && userLikedReels.length > 0) {
            initLikedReels(userLikedReels);
        }
    }, [userLikedReels, initLikedReels]);

    // Sync saved reels from server for authenticated users
    const initSavedReels = useReelStore((s) => s.initSavedReels);
    useEffect(() => {
        if (userSavedReels && userSavedReels.length > 0) {
            initSavedReels(userSavedReels);
        }
    }, [userSavedReels, initSavedReels]);

    // Sync fetched reels to store
    useEffect(() => {
        if (fetchedReels && fetchedReels.length > 0 && selectedFolder === "all") {
            setReels(fetchedReels);
        }
    }, [fetchedReels, setReels, selectedFolder]);

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

    const handleFolderChange = (folder: FolderType) => {
        Haptics.selectionAsync();
        setSelectedFolder(folder);
        setSelectedGrandmaster(null);
        setCurrentVisibleIndex(0);
    };

    const handleSelectGrandmaster = (name: string) => {
        Haptics.selectionAsync();
        setSelectedGrandmaster(name);
        setCurrentVisibleIndex(0);
    };

    const handleBackToGmList = () => {
        Haptics.selectionAsync();
        setSelectedGrandmaster(null);
    };

    const renderItem = useCallback(
        ({ item, index }: { item: Reel; index: number }) => (
            <ReelCard
                reel={item}
                isVisible={index === currentVisibleIndex}
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
        [currentVisibleIndex, isLiked, isSaved, handleLike, handleSave, handleComment, handleShare, handleView]
    );

    const isLoadingReels = selectedFolder === "all" ? isLoading : folderLoading;

    if (isLoadingReels && !displayReels?.length) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.accent.cyan} />
                <Text style={styles.loadingText}>Loading Reels...</Text>
            </View>
        );
    }

    if (error && selectedFolder === "all") {
        return (
            <View style={styles.errorContainer}>
                <Text style={styles.errorText}>Failed to load reels</Text>
                <Text style={styles.errorSubtext}>Pull down to retry</Text>
            </View>
        );
    }

    // Show grandmaster selection grid when GM folder selected but no GM chosen
    if (selectedFolder === "grandmaster" && !selectedGrandmaster) {
        return (
            <View style={styles.container}>
                <StatusBar style="light" />
                <LinearGradient
                    colors={[colors.background.primary, colors.background.secondary]}
                    style={styles.gmListContainer}
                >
                    {/* Header */}
                    <View style={[styles.gmListHeader, { paddingTop: insets.top + 10 }]}>
                        <TouchableOpacity onPress={() => handleFolderChange("all")} style={styles.backButton}>
                            <ArrowLeft size={24} color={colors.text.primary} />
                        </TouchableOpacity>
                        <Text style={styles.gmListTitle}>Grandmaster Games</Text>
                        <View style={{ width: 40 }} />
                    </View>

                    {/* Folder tabs */}
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.folderTabs}
                        style={{ flexGrow: 0, maxHeight: 50, marginBottom: 8 }}
                    >
                        <TouchableOpacity
                            onPress={() => handleFolderChange("all")}
                            style={styles.folderTab}
                        >
                            <Text style={styles.folderTabText}>All Reels</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => handleFolderChange("random")}
                            style={styles.folderTab}
                        >
                            <FolderOpen size={14} color={colors.text.muted} />
                            <Text style={styles.folderTabText}>Random</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.folderTab, styles.folderTabActive]}
                        >
                            <User size={14} color="#fff" />
                            <Text style={styles.folderTabTextActive}>Grandmasters</Text>
                        </TouchableOpacity>
                    </ScrollView>

                    <Text style={styles.gmListSubtitle}>Select a Grandmaster to watch their games</Text>

                    {/* Grandmaster Grid */}
                    <ScrollView contentContainerStyle={styles.gmGrid} showsVerticalScrollIndicator={false}>
                        {grandmasters?.map((gm) => (
                            <TouchableOpacity
                                key={gm._id}
                                style={styles.gmCard}
                                onPress={() => handleSelectGrandmaster(gm.name)}
                                activeOpacity={0.8}
                            >
                                <LinearGradient
                                    colors={[colors.accent.purple + "40", colors.accent.cyan + "20"]}
                                    style={styles.gmCardGradient}
                                >
                                    {gm.thumbnail ? (
                                        <Image
                                            source={{ uri: gm.thumbnail }}
                                            style={styles.gmCardImage}
                                            resizeMode="cover"
                                        />
                                    ) : (
                                        <User size={32} color={colors.accent.cyan} />
                                    )}
                                    <Text style={styles.gmCardName} numberOfLines={1}>{gm.name}</Text>
                                    <View style={styles.gmCardStats}>
                                        <Film size={12} color={colors.text.muted} />
                                        <Text style={styles.gmCardCount}>{gm.reelCount} reels</Text>
                                    </View>
                                </LinearGradient>
                            </TouchableOpacity>
                        ))}
                        {(!grandmasters || grandmasters.length === 0) && (
                            <View style={styles.noGmContainer}>
                                <User size={48} color={colors.text.muted} />
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

            {/* Folder Navigation Header */}
            {!isImmersive && (
                <View style={[styles.folderHeader, { paddingTop: insets.top + 8 }]}>
                    {/* Back button when viewing GM reels */}
                    {selectedFolder === "grandmaster" && selectedGrandmaster && (
                        <TouchableOpacity onPress={handleBackToGmList} style={styles.headerBackButton}>
                            <ArrowLeft size={20} color={colors.text.primary} />
                        </TouchableOpacity>
                    )}

                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.folderTabs}>
                        <TouchableOpacity
                            onPress={() => handleFolderChange("all")}
                            style={[styles.folderTab, selectedFolder === "all" && styles.folderTabActive]}
                        >
                            <Text style={[styles.folderTabText, selectedFolder === "all" && styles.folderTabTextActive]}>
                                All Reels
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => handleFolderChange("random")}
                            style={[styles.folderTab, selectedFolder === "random" && styles.folderTabActive]}
                        >
                            <FolderOpen size={14} color={selectedFolder === "random" ? "#fff" : colors.text.muted} />
                            <Text style={[styles.folderTabText, selectedFolder === "random" && styles.folderTabTextActive]}>
                                Random
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => handleFolderChange("grandmaster")}
                            style={[styles.folderTab, selectedFolder === "grandmaster" && styles.folderTabActive]}
                        >
                            <User size={14} color={selectedFolder === "grandmaster" ? "#fff" : colors.text.muted} />
                            <Text style={[styles.folderTabText, selectedFolder === "grandmaster" && styles.folderTabTextActive]}>
                                Grandmasters
                            </Text>
                        </TouchableOpacity>
                    </ScrollView>
                </View>
            )}

            {/* Show selected grandmaster name as subtitle */}
            {!isImmersive && selectedFolder === "grandmaster" && selectedGrandmaster && (
                <View style={styles.gmSubtitleContainer}>
                    <Text style={styles.gmSubtitle}>Viewing: {selectedGrandmaster}</Text>
                </View>
            )}

            {(!displayReels || displayReels.length === 0) ? (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>No reels in this folder</Text>
                    <Text style={styles.emptySubtext}>Try selecting a different folder</Text>
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
                            onRefresh={selectedFolder === "all" ? refetch : refetchFolder}
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
    folderHeader: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        backgroundColor: "rgba(0,0,0,0.7)",
        paddingBottom: 10,
    },
    folderTabs: {
        flexDirection: "row",
        paddingHorizontal: 16,
        gap: 10,
    },
    folderTab: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: "rgba(255,255,255,0.1)",
        height: 36,
    },
    folderTabActive: {
        backgroundColor: colors.accent.purple,
    },
    folderTabText: {
        color: colors.text.muted,
        fontSize: 13,
        fontWeight: "600",
    },
    folderTabTextActive: {
        color: "#fff",
    },
    gmPickerButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginHorizontal: 16,
        marginTop: 10,
        padding: 12,
        backgroundColor: "rgba(255,255,255,0.1)",
        borderRadius: 10,
    },
    gmPickerText: {
        color: colors.text.primary,
        fontSize: 14,
    },
    gmDropdown: {
        position: "absolute",
        left: 16,
        right: 16,
        zIndex: 200,
        backgroundColor: colors.background.secondary,
        borderRadius: 12,
        padding: 12,
        maxHeight: 300,
        elevation: 10,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    gmDropdownHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 12,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: "rgba(255,255,255,0.1)",
    },
    gmDropdownTitle: {
        color: colors.text.primary,
        fontSize: 16,
        fontWeight: "600",
    },
    gmOption: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 12,
        borderRadius: 8,
    },
    gmOptionActive: {
        backgroundColor: "rgba(123, 47, 247, 0.2)",
    },
    gmOptionText: {
        color: colors.text.primary,
        fontSize: 14,
    },
    gmOptionCount: {
        color: colors.text.muted,
        fontSize: 12,
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
    // GM List View styles
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
    gmCardImage: {
        width: 60,
        height: 60,
        borderRadius: 30,
        borderWidth: 2,
        borderColor: colors.accent.cyan,
    },
    gmCardName: {
        color: colors.text.primary,
        fontSize: 15,
        fontWeight: "600",
        marginTop: 12,
        textAlign: "center",
    },
    gmCardStats: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        marginTop: 8,
    },
    gmCardCount: {
        color: colors.text.muted,
        fontSize: 12,
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
