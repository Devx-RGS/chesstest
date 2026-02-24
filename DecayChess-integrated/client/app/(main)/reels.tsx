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
    Alert,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { ReelCard } from "../components/reels/ReelCard";
import {
    useReels,
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

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

type TabType = "all" | "grandmaster" | "random";

export default function ReelsScreen() {
    const [activeTab, setActiveTab] = useState<TabType>("all");
    const [selectedGM, setSelectedGM] = useState<string | null>(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const flatListRef = useRef<FlatList>(null);

    const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
    const userId = useAuthStore((s) => s.user?.id);

    // Fetch queries per tab
    const { data: allReels = [], isLoading: allLoading } = useReels();
    const { data: randomReels = [], isLoading: randomLoading } = useRandomReels();
    const { data: grandmasters = [] } = useAvailableGrandmasters();
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
        activeTab === "all"
            ? allReels
            : activeTab === "random"
                ? randomReels
                : gmData?.reels || [];

    const isLoading = activeTab === "all" ? allLoading : activeTab === "random" ? randomLoading : gmLoading;

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

    const handleComment = useCallback(() => {
        // Comments are handled via a bottom sheet modal in the future
    }, []);

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
        { key: "all", label: "All", icon: "albums-outline" },
        { key: "grandmaster", label: "GM", icon: "trophy-outline" },
        { key: "random", label: "Random", icon: "shuffle-outline" },
    ];

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
                            setCurrentIndex(0);
                        }}
                    >
                        <Ionicons
                            name={tab.icon as any}
                            size={18}
                            color={activeTab === tab.key ? "#00D9FF" : "#A0A0B0"}
                        />
                        <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
                            {tab.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Grandmaster selector */}
            {activeTab === "grandmaster" && (
                <View style={styles.gmSelector}>
                    <FlatList
                        horizontal
                        data={grandmasters}
                        keyExtractor={(item: GrandmasterItem) => item.name}
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.gmList}
                        renderItem={({ item }: { item: GrandmasterItem }) => (
                            <TouchableOpacity
                                style={[styles.gmChip, selectedGM === item.name && styles.gmChipActive]}
                                onPress={() => setSelectedGM(item.name)}
                            >
                                <Text style={[styles.gmChipText, selectedGM === item.name && styles.gmChipTextActive]}>
                                    {item.name}
                                </Text>
                                <Text style={styles.gmCount}>{item.reelCount}</Text>
                            </TouchableOpacity>
                        )}
                    />
                </View>
            )}

            {/* Main Feed */}
            {isLoading ? (
                <View style={styles.loadingWrap}>
                    <ActivityIndicator size="large" color="#00D9FF" />
                    <Text style={styles.loadingText}>Loading reels...</Text>
                </View>
            ) : displayReels.length === 0 ? (
                <View style={styles.emptyWrap}>
                    <Ionicons name="film-outline" size={64} color="#6B7280" />
                    <Text style={styles.emptyTitle}>No Reels</Text>
                    <Text style={styles.emptyText}>
                        {activeTab === "grandmaster" && !selectedGM
                            ? "Select a grandmaster to see their reels"
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
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#000",
    },
    tabBar: {
        position: "absolute",
        top: 50,
        left: 0,
        right: 0,
        zIndex: 10,
        flexDirection: "row",
        justifyContent: "center",
        gap: 16,
    },
    tab: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: "rgba(0,0,0,0.5)",
    },
    tabActive: {
        backgroundColor: "rgba(0, 217, 255, 0.15)",
        borderWidth: 1,
        borderColor: "rgba(0, 217, 255, 0.3)",
    },
    tabText: {
        color: "#A0A0B0",
        fontSize: 14,
        fontWeight: "500",
    },
    tabTextActive: {
        color: "#00D9FF",
    },
    gmSelector: {
        position: "absolute",
        top: 100,
        left: 0,
        right: 0,
        zIndex: 10,
    },
    gmList: {
        paddingHorizontal: 16,
        gap: 8,
    },
    gmChip: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        paddingHorizontal: 14,
        paddingVertical: 7,
        borderRadius: 18,
        backgroundColor: "rgba(0,0,0,0.6)",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.1)",
    },
    gmChipActive: {
        backgroundColor: "rgba(123, 47, 247, 0.2)",
        borderColor: "#7B2FF7",
    },
    gmChipText: {
        color: "#A0A0B0",
        fontSize: 13,
    },
    gmChipTextActive: {
        color: "#7B2FF7",
        fontWeight: "600",
    },
    gmCount: {
        color: "#6B7280",
        fontSize: 11,
    },
    loadingWrap: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        gap: 12,
    },
    loadingText: {
        color: "#A0A0B0",
        fontSize: 14,
    },
    emptyWrap: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        gap: 10,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: "700",
        color: "#FFFFFF",
    },
    emptyText: {
        fontSize: 14,
        color: "#6B7280",
        textAlign: "center",
        paddingHorizontal: 32,
    },
});
