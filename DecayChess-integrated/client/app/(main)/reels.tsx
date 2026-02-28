import React, { useState, useCallback, useEffect, useRef } from "react";
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    Dimensions,
    ActivityIndicator,
    ViewToken,
    Share,
    Image,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { ReelCard } from "../components/reels/ReelCard";
import {
    useRandomReels,
    useAvailableGrandmasters,
    useReelsByGrandmaster,
    useUserLikedReels,
    useUserSavedReels,
    useLikeReel,
    useSaveReel,
    useRecordView,
    GrandmasterItem,
} from "../lib/services/reelApi";
import { useReelStore } from "../lib/stores/reelStore";
import { useAuthStore } from "../lib/stores/authStore";
import { Reel } from "../lib/types/reel";
import { FONTS } from "../lib/styles/base";

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get("window");

type TabType = "grandmaster" | "random";

export default function ReelsScreen() {
    const [activeTab, setActiveTab] = useState<TabType>("random");
    const [selectedGM, setSelectedGM] = useState<string | null>(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const flatListRef = useRef<FlatList>(null);

    const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
    const userId = useAuthStore((s) => s.user?.id);

    // Fetch queries per tab
    const { data: randomReels = [], isLoading: randomLoading } = useRandomReels();
    const { data: grandmasters = [], isLoading: gmListLoading } = useAvailableGrandmasters();
    const { data: gmData, isLoading: gmLoading } = useReelsByGrandmaster(selectedGM);

    // Init liked/saved reel sets from server
    const { data: likedIds } = useUserLikedReels();
    const { data: savedIds } = useUserSavedReels();
    const initLiked = useReelStore((s) => s.initLikedReels);
    const initSaved = useReelStore((s) => s.initSavedReels);
    const setStoreReels = useReelStore((s) => s.setReels);
    const isLiked = useReelStore((s) => s.isLiked);
    const isSaved = useReelStore((s) => s.isSaved);
    const likeReelLocal = useReelStore((s) => s.likeReel);
    const unlikeReelLocal = useReelStore((s) => s.unlikeReel);
    const saveReelLocal = useReelStore((s) => s.saveReel);
    const unsaveReelLocal = useReelStore((s) => s.unsaveReel);
    const incrementViews = useReelStore((s) => s.incrementViews);

    // Mutations
    const likeMutation = useLikeReel();
    const saveMutation = useSaveReel();
    const viewMutation = useRecordView();

    useEffect(() => {
        if (likedIds) initLiked(likedIds);
    }, [likedIds]);

    useEffect(() => {
        if (savedIds) initSaved(savedIds);
    }, [savedIds]);

    // Determine which reels to show based on active tab
    const displayReels: Reel[] =
        activeTab === "random"
            ? randomReels
            : gmData?.reels || [];

    const isLoading = activeTab === "random" ? randomLoading : gmLoading;

    // Keep Zustand store in sync
    useEffect(() => {
        setStoreReels(displayReels);
    }, [displayReels]);

    const onViewableItemsChanged = useCallback(
        ({ viewableItems }: { viewableItems: ViewToken[] }) => {
            if (viewableItems.length > 0 && viewableItems[0].index != null) {
                setCurrentIndex(viewableItems[0].index);
            }
        },
        []
    );

    const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 50 }).current;

    // Handlers for ReelCard interaction callbacks
    const handleLike = useCallback((reelId: string) => {
        const liked = isLiked(reelId);
        if (liked) {
            unlikeReelLocal(reelId);
            likeMutation.mutate({ reelId, action: "unlike" });
        } else {
            likeReelLocal(reelId);
            likeMutation.mutate({ reelId, action: "like" });
        }
    }, [isLiked, likeReelLocal, unlikeReelLocal, likeMutation]);

    const handleSave = useCallback((reelId: string) => {
        const saved = isSaved(reelId);
        if (saved) {
            unsaveReelLocal(reelId);
            saveMutation.mutate({ reelId, action: "unsave" });
        } else {
            saveReelLocal(reelId);
            saveMutation.mutate({ reelId, action: "save" });
        }
    }, [isSaved, saveReelLocal, unsaveReelLocal, saveMutation]);

    const handleView = useCallback((reelId: string) => {
        incrementViews(reelId);
        if (userId) viewMutation.mutate({ reelId, viewerId: userId });
    }, [incrementViews, userId, viewMutation]);

    const handleComment = useCallback(() => { }, []);

    const handleShare = useCallback(async (reel: Reel) => {
        try {
            await Share.share({ message: `Check out this chess reel: ${reel.content.title}` });
        } catch (e) { /* ignore */ }
    }, []);

    const renderReel = useCallback(
        ({ item, index }: { item: Reel; index: number }) => (
            <ReelCard
                reel={item}
                isVisible={index === currentIndex}
                isLiked={isLiked(item._id)}
                isSaved={isSaved(item._id)}
                onLike={() => handleLike(item._id)}
                onSave={() => handleSave(item._id)}
                onComment={handleComment}
                onShare={() => handleShare(item)}
                onView={() => handleView(item._id)}
            />
        ),
        [currentIndex, isLiked, isSaved, handleLike, handleSave, handleComment, handleShare, handleView]
    );

    const tabs: { key: TabType; label: string; icon: string }[] = [
        { key: "grandmaster", label: "Grand Masters", icon: "trophy-outline" },
        { key: "random", label: "Random", icon: "shuffle-outline" },
    ];

    // Show GM folder grid when grandmaster tab is active and no GM is selected
    const showFolderGrid = activeTab === "grandmaster" && !selectedGM;

    const renderGMFolder = ({ item }: { item: GrandmasterItem }) => (
        <TouchableOpacity
            style={styles.folderCard}
            activeOpacity={0.85}
            onPress={() => {
                setSelectedGM(item.name);
                setCurrentIndex(0);
            }}
        >
            {item.thumbnail ? (
                <Image source={{ uri: item.thumbnail }} style={styles.folderThumbnail} />
            ) : (
                <LinearGradient
                    colors={['#1E2545', '#111629']}
                    style={styles.folderThumbnail}
                >
                    <Ionicons name="person" size={32} color="#F5A623" />
                </LinearGradient>
            )}
            <View style={styles.folderInfo}>
                <Text style={styles.folderName} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.folderCount}>{item.reelCount} reel{item.reelCount !== 1 ? 's' : ''}</Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <StatusBar style="light" backgroundColor="transparent" translucent />

            {/* Tab Bar */}
            <View style={styles.tabBar}>
                {tabs.map((tab) => (
                    <TouchableOpacity
                        key={tab.key}
                        style={[styles.tab, activeTab === tab.key && styles.tabActive]}
                        onPress={() => {
                            setActiveTab(tab.key);
                            setSelectedGM(null);
                            setCurrentIndex(0);
                        }}
                    >
                        <Ionicons
                            name={tab.icon as any}
                            size={16}
                            color={activeTab === tab.key ? "#F5A623" : "#B0ACBE"}
                        />
                        <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
                            {tab.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Grand Masters folder back button */}
            {activeTab === "grandmaster" && selectedGM && (
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => {
                        setSelectedGM(null);
                        setCurrentIndex(0);
                    }}
                >
                    <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
                    <Text style={styles.backText}>{selectedGM}</Text>
                </TouchableOpacity>
            )}

            {/* GM Folder Grid View */}
            {showFolderGrid ? (
                <View style={styles.folderGridContainer}>
                    <Text style={styles.folderGridTitle}>Grand Masters</Text>
                    <Text style={styles.folderGridSubtitle}>Select a grandmaster to view their reels</Text>
                    {gmListLoading ? (
                        <ActivityIndicator size="large" color="#F5A623" style={{ marginTop: 40 }} />
                    ) : grandmasters.length === 0 ? (
                        <View style={styles.emptyWrap}>
                            <Ionicons name="trophy-outline" size={48} color="#706D82" />
                            <Text style={styles.emptyTitle}>No Grand Masters</Text>
                            <Text style={styles.emptyText}>No grandmaster folders have been created yet</Text>
                        </View>
                    ) : (
                        <FlatList
                            data={grandmasters}
                            keyExtractor={(item) => item.name}
                            renderItem={renderGMFolder}
                            numColumns={2}
                            contentContainerStyle={styles.folderGrid}
                            columnWrapperStyle={styles.folderRow}
                            showsVerticalScrollIndicator={false}
                        />
                    )}
                </View>
            ) : (
                <>
                    {/* Main Reel Feed */}
                    {isLoading ? (
                        <View style={styles.loadingWrap}>
                            <ActivityIndicator size="large" color="#F5A623" />
                            <Text style={styles.loadingText}>Loading reels...</Text>
                        </View>
                    ) : displayReels.length === 0 ? (
                        <View style={styles.emptyWrap}>
                            <Ionicons name="film-outline" size={48} color="#706D82" />
                            <Text style={styles.emptyTitle}>No Reels</Text>
                            <Text style={styles.emptyText}>
                                {activeTab === "grandmaster" && selectedGM
                                    ? `No reels found for ${selectedGM}`
                                    : "No reels available in this category"}
                            </Text>
                        </View>
                    ) : (
                        <FlatList
                            ref={flatListRef}
                            data={displayReels}
                            renderItem={renderReel}
                            keyExtractor={(item) => item._id}
                            pagingEnabled
                            showsVerticalScrollIndicator={false}
                            snapToInterval={SCREEN_HEIGHT}
                            decelerationRate="fast"
                            onViewableItemsChanged={onViewableItemsChanged}
                            viewabilityConfig={viewabilityConfig}
                            getItemLayout={(_, index) => ({
                                length: SCREEN_HEIGHT,
                                offset: SCREEN_HEIGHT * index,
                                index,
                            })}
                            windowSize={3}
                            maxToRenderPerBatch={2}
                            removeClippedSubviews
                        />
                    )}
                </>
            )}
        </View>
    );
}

const FOLDER_CARD_WIDTH = (SCREEN_WIDTH - 56) / 2;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#080B14",
    },
    tabBar: {
        position: "absolute",
        top: 50,
        left: 0,
        right: 0,
        zIndex: 10,
        flexDirection: "row",
        justifyContent: "center",
        gap: 10,
    },
    tab: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 24,
        backgroundColor: "rgba(0,0,0,0.55)",
    },
    tabActive: {
        backgroundColor: "rgba(245, 166, 35, 0.15)",
        borderWidth: 1,
        borderColor: "rgba(245, 166, 35, 0.35)",
    },
    tabText: {
        fontFamily: FONTS.semibold,
        color: "#B0ACBE",
        fontSize: 14,
    },
    tabTextActive: {
        color: "#F5A623",
    },
    backButton: {
        position: "absolute",
        top: 100,
        left: 16,
        zIndex: 10,
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        backgroundColor: "rgba(0,0,0,0.6)",
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
    },
    backText: {
        fontFamily: FONTS.semibold,
        color: "#FFFFFF",
        fontSize: 14,
    },
    folderGridContainer: {
        flex: 1,
        paddingTop: 110,
        paddingHorizontal: 20,
    },
    folderGridTitle: {
        fontFamily: FONTS.bold,
        color: "#FFFFFF",
        fontSize: 24,
        letterSpacing: 0.3,
        marginBottom: 6,
    },
    folderGridSubtitle: {
        fontFamily: FONTS.regular,
        color: "#B0ACBE",
        fontSize: 14,
        marginBottom: 24,
    },
    folderGrid: {
        paddingBottom: 40,
    },
    folderRow: {
        justifyContent: "space-between",
        marginBottom: 14,
    },
    folderCard: {
        width: FOLDER_CARD_WIDTH,
        backgroundColor: "rgba(255,255,255,0.04)",
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.08)",
        overflow: "hidden",
    },
    folderThumbnail: {
        width: "100%",
        height: FOLDER_CARD_WIDTH * 0.75,
        backgroundColor: "#111629",
        alignItems: "center",
        justifyContent: "center",
    },
    folderInfo: {
        padding: 12,
    },
    folderName: {
        fontFamily: FONTS.semibold,
        color: "#FFFFFF",
        fontSize: 15,
        marginBottom: 3,
    },
    folderCount: {
        fontFamily: FONTS.regular,
        color: "#706D82",
        fontSize: 12,
    },
    loadingWrap: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        gap: 12,
    },
    loadingText: {
        color: "#B0ACBE",
        fontSize: 14,
    },
    emptyWrap: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        gap: 10,
    },
    emptyTitle: {
        fontFamily: FONTS.bold,
        fontSize: 20,
        color: "#FFFFFF",
    },
    emptyText: {
        fontFamily: FONTS.regular,
        fontSize: 14,
        color: "#706D82",
        textAlign: "center",
        paddingHorizontal: 40,
    },
});
