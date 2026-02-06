import React, { useState, useEffect, useCallback } from "react";
import { View, Text, ScrollView, Animated, TouchableOpacity, RefreshControl, TextInput, Alert, Platform, Modal, Image } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Users, Film, Trash2, LogOut, Plus, Play, Edit2, X, Hash, Activity, Home, FolderOpen, ChevronDown, ChevronRight, User } from "lucide-react-native";
import * as Haptics from "expo-haptics";

import { colors } from "@/constants/themes";
import { GlassCard } from "@/components/ui/GlassCard";
import { AnimatedButton } from "@/components/ui/AnimatedButton";
import { useAuthStore } from "@/stores/authStore";
import { apiClient } from "@/services/api";
import {
    useFolderStats,
    useGrandmasterFolders,
    useCreateGrandmaster,
    GrandmasterFolder
} from "@/services/adminApi";

// Types
interface Reel {
    _id: string;
    video: {
        url: string;
    };
    content: {
        title: string;
        description?: string;
        tags?: string[];
        difficulty?: "beginner" | "intermediate" | "advanced";
    };
    chessData?: {
        fen?: string;
        pgn?: string;
    };
    status: string;
    folder?: "random" | "grandmaster";
    grandmaster?: string | null;
}

const DIFFICULTY_LEVELS = ["beginner", "intermediate", "advanced"];
const BADGE_COLORS = {
    beginner: colors.success,
    intermediate: colors.warning,
    advanced: colors.danger
};

export default function AdminDashboard() {
    const router = useRouter();
    const insets = useSafeAreaInsets();

    // Auth Store Selectors (Performance Optimization)
    const logout = useAuthStore(state => state.logout);
    const isAdmin = useAuthStore(state => state.isAdmin);

    // State
    const [reels, setReels] = useState<Reel[]>([]);
    const [stats, setStats] = useState({ totalReels: 0, totalUsers: 0 });
    const [isLoading, setIsLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState<"create" | "manage">("manage");

    // Folder state
    const [expandedFolders, setExpandedFolders] = useState<{ random: boolean; grandmaster: boolean }>({
        random: false,
        grandmaster: false
    });
    const [selectedGrandmaster, setSelectedGrandmaster] = useState<string | null>(null);

    // Fetch folder stats and grandmasters
    const { data: folderStats, refetch: refetchFolderStats } = useFolderStats();
    const { data: gmFolders, refetch: refetchGmFolders } = useGrandmasterFolders();
    const createGrandmasterMutation = useCreateGrandmaster();

    // Create folder modal state
    const [createModalVisible, setCreateModalVisible] = useState(false);
    const [newFolderName, setNewFolderName] = useState("");
    const [newFolderDescription, setNewFolderDescription] = useState("");
    const [newFolderThumbnail, setNewFolderThumbnail] = useState("");

    // Form State
    const [formData, setFormData] = useState({
        videoUrl: "",
        title: "",
        description: "",
        tags: "",
        difficulty: "beginner",
        fen: "",
        pgn: ""
    });

    // Edit Modal State
    const [editingReel, setEditingReel] = useState<Reel | null>(null);

    // Animations
    const fadeAnim = React.useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
        }).start();

        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        if (activeTab === "create") return; // Don't fetch if creating

        try {
            const [statsRes, reelsRes] = await Promise.all([
                apiClient.get<any>("/admin/stats"),
                apiClient.get<any>("/admin/videos")
            ]);

            if (statsRes.data.success) {
                setStats(statsRes.data.stats);
            }
            if (reelsRes.data.success) {
                setReels(reelsRes.data.data);
            }
        } catch (error) {
            console.error("Failed to fetch dashboard data", error);
        } finally {
            setRefreshing(false);
        }
    };

    const handleLogout = () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.replace("/(auth)/login");
        // Delay clearing state slightly to ensure smooth transition
        // entirely purely for UX perception
        setTimeout(() => {
            logout();
        }, 50);
    };

    const handlePostReel = async () => {
        if (!formData.videoUrl || !formData.title) {
            Alert.alert("Missing Fields", "Please provide Video URL and Title.");
            return;
        }

        try {
            setIsLoading(true);
            const tagsArray = formData.tags.split(",").map(t => t.trim()).filter(Boolean);

            const payload = {
                adminId: "admin", // Middleware handles auth, this is just for log
                videoData: {
                    video: { url: formData.videoUrl },
                    content: {
                        title: formData.title,
                        description: formData.description,
                        tags: tagsArray,
                        difficulty: formData.difficulty
                    },
                    chessData: {
                        fen: formData.fen,
                        pgn: formData.pgn
                    },
                    status: "published"
                }
            };

            await apiClient.post("/admin/video", payload);

            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert("Success", "Reel deployed successfully!");

            // Reset form
            setFormData({
                videoUrl: "",
                title: "",
                description: "",
                tags: "",
                difficulty: "beginner",
                fen: "",
                pgn: ""
            });

            setActiveTab("manage");
            fetchDashboardData();

        } catch (error) {
            Alert.alert("Error", "Failed to deploy reel.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteReel = (id: string) => {
        Alert.alert(
            "Delete Protocol",
            "Confirm deletion of neural data?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        // Optimistic Update
                        setReels(prev => prev.filter(r => r._id !== id));
                        setStats(prev => ({ ...prev, totalReels: prev.totalReels - 1 }));
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

                        try {
                            await apiClient.delete(`/admin/video/${id}`);
                        } catch (error) {
                            fetchDashboardData(); // Revert
                            Alert.alert("Error", "Deletion failed.");
                        }
                    }
                }
            ]
        );
    };

    const openEditModal = (reel: Reel) => {
        setEditingReel(reel);
        setFormData({
            videoUrl: reel.video.url,
            title: reel.content.title,
            description: reel.content.description || "",
            tags: reel.content.tags?.map(t => t.replace(/^#/, '')).join(", ") || "",
            difficulty: reel.content.difficulty || "beginner",
            fen: reel.chessData?.fen || "",
            pgn: reel.chessData?.pgn || ""
        });
    };

    const handleUpdateReel = async () => {
        if (!editingReel) return;

        try {
            setIsLoading(true);
            setIsLoading(true);
            const tagsArray = formData.tags.split(",").map(t => t.trim().replace(/^#/, '')).filter(Boolean);

            const payload = {
                updatedData: {
                    video: { url: formData.videoUrl },
                    content: {
                        title: formData.title,
                        description: formData.description,
                        tags: tagsArray,
                        difficulty: formData.difficulty
                    },
                    chessData: {
                        fen: formData.fen,
                        pgn: formData.pgn
                    },
                    status: editingReel.status
                }
            };

            await apiClient.put(`/admin/video/${editingReel._id}`, payload);

            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setEditingReel(null);
            fetchDashboardData();

        } catch (error) {
            Alert.alert("Error", "Update failed.");
        } finally {
            setIsLoading(false);
        }
    };

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchDashboardData();
    }, [activeTab]);

    return (
        <LinearGradient
            colors={[colors.background.primary, "#0f172a"]}
            style={{ flex: 1 }}
        >
            <View style={{ flex: 1, paddingTop: insets.top }}>
                {/* Custom Header */}
                <View style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    paddingHorizontal: 20,
                    paddingBottom: 20,
                    paddingTop: 10
                }}>
                    <View>
                        <Text style={{ fontSize: 32, fontWeight: "900", color: colors.text.primary, letterSpacing: 1 }}>
                            ADMIN
                        </Text>
                        <Text style={{ fontSize: 12, color: colors.accent.cyan, letterSpacing: 2 }}>
                            DASHBOARD
                        </Text>
                    </View>
                    <View style={{ flexDirection: "row", gap: 10 }}>
                        <TouchableOpacity
                            onPress={() => router.push("/(tabs)/profile" as any)}
                            style={{
                                padding: 10,
                                backgroundColor: "rgba(34, 197, 94, 0.15)",
                                borderRadius: 12,
                                borderWidth: 1,
                                borderColor: "rgba(34, 197, 94, 0.3)"
                            }}
                        >
                            <Home size={20} color={colors.success} />
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={handleLogout}
                            style={{
                                padding: 10,
                                backgroundColor: "rgba(239, 68, 68, 0.15)",
                                borderRadius: 12,
                                borderWidth: 1,
                                borderColor: "rgba(239, 68, 68, 0.3)"
                            }}
                        >
                            <LogOut size={20} color={colors.danger} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Main Content */}
                <ScrollView
                    contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent.cyan} />
                    }
                >
                    <Animated.View style={{ opacity: fadeAnim }}>

                        {/* KPI Cards */}
                        <View style={{ flexDirection: "row", gap: 15, marginBottom: 30 }}>
                            <GlassCard variant="dark" style={{ flex: 1, alignItems: "center", padding: 20 }}>
                                <View style={{ padding: 10, backgroundColor: "rgba(6, 182, 212, 0.2)", borderRadius: 50, marginBottom: 10 }}>
                                    <Film size={24} color={colors.accent.cyan} />
                                </View>
                                <Text style={{ fontSize: 32, fontWeight: "800", color: colors.text.primary }}>
                                    {stats.totalReels}
                                </Text>
                                <Text style={{ fontSize: 12, color: colors.text.secondary }}>Total Reels</Text>
                            </GlassCard>

                            <GlassCard variant="dark" style={{ flex: 1, alignItems: "center", padding: 20 }}>
                                <View style={{ padding: 10, backgroundColor: "rgba(168, 85, 247, 0.2)", borderRadius: 50, marginBottom: 10 }}>
                                    <Users size={24} color={colors.accent.purple} />
                                </View>
                                <Text style={{ fontSize: 32, fontWeight: "800", color: colors.text.primary }}>
                                    {stats.totalUsers}
                                </Text>
                                <Text style={{ fontSize: 12, color: colors.text.secondary }}>Total Users</Text>
                            </GlassCard>
                        </View>

                        {/* Action Buttons */}
                        <View style={{ flexDirection: "row", gap: 15, marginBottom: 20 }}>
                            <TouchableOpacity
                                onPress={() => setActiveTab("manage")}
                                style={{
                                    flex: 1,
                                    padding: 14,
                                    alignItems: "center",
                                    backgroundColor: activeTab === "manage" ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.05)",
                                    borderRadius: 12,
                                    borderWidth: 1,
                                    borderColor: activeTab === "manage" ? colors.text.muted : "transparent"
                                }}
                            >
                                <Text style={{ color: activeTab === "manage" ? "white" : colors.text.muted, fontWeight: "600" }}>Manage Content</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => router.push("/admin/upload" as any)}
                                style={{
                                    flex: 1,
                                    padding: 14,
                                    alignItems: "center",
                                    backgroundColor: colors.accent.purple,
                                    borderRadius: 12,
                                    flexDirection: "row",
                                    justifyContent: "center",
                                    gap: 8
                                }}
                            >
                                <Plus size={18} color="white" />
                                <Text style={{ color: "white", fontWeight: "600" }}>Upload Reel</Text>
                            </TouchableOpacity>
                        </View>

                        {/* List View - Now shows folder structure */}
                        {activeTab === "manage" && (
                            <View style={{ gap: 12 }}>
                                {/* Random Games Folder */}
                                <TouchableOpacity
                                    onPress={() => setExpandedFolders(prev => ({ ...prev, random: !prev.random }))}
                                    style={{
                                        backgroundColor: "rgba(255,255,255,0.05)",
                                        padding: 16,
                                        borderRadius: 12,
                                        flexDirection: "row",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        borderWidth: 1,
                                        borderColor: expandedFolders.random ? colors.accent.cyan : "rgba(255,255,255,0.1)"
                                    }}
                                >
                                    <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                                        <FolderOpen size={22} color={colors.accent.cyan} />
                                        <View>
                                            <Text style={{ color: colors.text.primary, fontWeight: "700", fontSize: 16 }}>
                                                Random Games
                                            </Text>
                                            <Text style={{ color: colors.text.muted, fontSize: 12 }}>
                                                {folderStats?.random || 0} videos
                                            </Text>
                                        </View>
                                    </View>
                                    {expandedFolders.random ? (
                                        <ChevronDown size={20} color={colors.text.muted} />
                                    ) : (
                                        <ChevronRight size={20} color={colors.text.muted} />
                                    )}
                                </TouchableOpacity>

                                {/* Random Games Content */}
                                {expandedFolders.random && (
                                    <View style={{ paddingLeft: 20, gap: 10 }}>
                                        {reels.filter(r => r.folder === "random" || !r.folder).map((reel) => (
                                            <GlassCard key={reel._id} variant="dark" style={{ flexDirection: "row", alignItems: "center", padding: 12 }}>
                                                <Film size={18} color={colors.text.muted} style={{ marginRight: 12 }} />
                                                <Text style={{ color: colors.text.primary, flex: 1 }} numberOfLines={1}>
                                                    {reel.content.title}
                                                </Text>
                                                <View style={{ flexDirection: "row", gap: 4 }}>
                                                    <TouchableOpacity onPress={() => openEditModal(reel)} style={{ padding: 6 }}>
                                                        <Edit2 size={16} color={colors.accent.cyan} />
                                                    </TouchableOpacity>
                                                    <TouchableOpacity onPress={() => handleDeleteReel(reel._id)} style={{ padding: 6 }}>
                                                        <Trash2 size={16} color={colors.danger} />
                                                    </TouchableOpacity>
                                                </View>
                                            </GlassCard>
                                        ))}
                                        {reels.filter(r => r.folder === "random" || !r.folder).length === 0 && (
                                            <Text style={{ color: colors.text.muted, textAlign: "center", padding: 20 }}>No videos yet</Text>
                                        )}
                                    </View>
                                )}

                                {/* Grand Master Games Folder */}
                                <TouchableOpacity
                                    onPress={() => setExpandedFolders(prev => ({ ...prev, grandmaster: !prev.grandmaster }))}
                                    style={{
                                        backgroundColor: "rgba(255,255,255,0.05)",
                                        padding: 16,
                                        borderRadius: 12,
                                        flexDirection: "row",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        borderWidth: 1,
                                        borderColor: expandedFolders.grandmaster ? colors.accent.purple : "rgba(255,255,255,0.1)"
                                    }}
                                >
                                    <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                                        <User size={22} color={colors.accent.purple} />
                                        <View>
                                            <Text style={{ color: colors.text.primary, fontWeight: "700", fontSize: 16 }}>
                                                Grand Master Games
                                            </Text>
                                            <Text style={{ color: colors.text.muted, fontSize: 12 }}>
                                                {folderStats?.grandmaster || 0} videos
                                            </Text>
                                        </View>
                                    </View>
                                    {expandedFolders.grandmaster ? (
                                        <ChevronDown size={20} color={colors.text.muted} />
                                    ) : (
                                        <ChevronRight size={20} color={colors.text.muted} />
                                    )}
                                </TouchableOpacity>

                                {/* Grandmaster Folders Grid */}
                                {expandedFolders.grandmaster && (
                                    <View style={{ paddingLeft: 10, paddingTop: 8 }}>
                                        {/* Create Folder Button */}
                                        <TouchableOpacity
                                            onPress={() => setCreateModalVisible(true)}
                                            style={{
                                                backgroundColor: "rgba(123, 47, 247, 0.15)",
                                                padding: 14,
                                                borderRadius: 12,
                                                flexDirection: "row",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                gap: 10,
                                                marginBottom: 16,
                                                borderWidth: 1,
                                                borderColor: colors.accent.purple,
                                                borderStyle: "dashed"
                                            }}
                                        >
                                            <Plus size={18} color={colors.accent.purple} />
                                            <Text style={{ color: colors.accent.purple, fontWeight: "600" }}>Create Folder</Text>
                                        </TouchableOpacity>

                                        {/* Folder Cards Grid */}
                                        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
                                            {(gmFolders || []).map((folder: GrandmasterFolder) => (
                                                <TouchableOpacity
                                                    key={folder._id}
                                                    onPress={() => router.push(`/admin/folder/${folder._id}` as any)}
                                                    style={{
                                                        width: "47%",
                                                        backgroundColor: "rgba(255,255,255,0.05)",
                                                        borderRadius: 12,
                                                        padding: 14,
                                                        borderWidth: 1,
                                                        borderColor: "rgba(255,255,255,0.1)"
                                                    }}
                                                >
                                                    <View style={{
                                                        width: "100%",
                                                        height: 60,
                                                        borderRadius: 8,
                                                        backgroundColor: "rgba(123, 47, 247, 0.2)",
                                                        justifyContent: "center",
                                                        alignItems: "center",
                                                        marginBottom: 10,
                                                        overflow: "hidden"
                                                    }}>
                                                        {folder.thumbnail ? (
                                                            <Image
                                                                source={{ uri: folder.thumbnail }}
                                                                style={{ width: "100%", height: "100%", borderRadius: 8 }}
                                                                resizeMode="cover"
                                                            />
                                                        ) : (
                                                            <User size={28} color={colors.accent.purple} />
                                                        )}
                                                    </View>
                                                    <Text style={{ color: colors.text.primary, fontWeight: "600", fontSize: 14 }} numberOfLines={1}>
                                                        {folder.name}
                                                    </Text>
                                                    <Text style={{ color: colors.text.muted, fontSize: 12, marginTop: 4 }}>
                                                        {folder.reelCount} reels
                                                    </Text>
                                                </TouchableOpacity>
                                            ))}
                                        </View>

                                        {(!gmFolders || gmFolders.length === 0) && (
                                            <Text style={{ color: colors.text.muted, textAlign: "center", padding: 24 }}>
                                                No folders yet. Create one to get started!
                                            </Text>
                                        )}
                                    </View>
                                )}
                            </View>
                        )}

                    </Animated.View>
                </ScrollView>
            </View>

            {/* Edit Modal */}
            <Modal
                visible={!!editingReel}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setEditingReel(null)}
            >
                <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.8)", justifyContent: "flex-end" }}>
                    <View style={{ backgroundColor: colors.background.secondary, borderTopLeftRadius: 20, borderTopRightRadius: 20, height: "80%", padding: 20 }}>
                        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                            <Text style={{ fontSize: 20, fontWeight: "bold", color: colors.text.primary }}>Edit Protocol</Text>
                            <TouchableOpacity onPress={() => setEditingReel(null)}>
                                <X size={24} color={colors.text.secondary} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView contentContainerStyle={{ paddingBottom: 50 }}>
                            {/* Reusing Form logic here for simplicity, typically separate component */}
                            <TextInput
                                placeholder="Title"
                                placeholderTextColor={colors.text.muted}
                                value={formData.title}
                                onChangeText={(t) => setFormData({ ...formData, title: t })}
                                style={styles.input}
                            />

                            <TextInput
                                placeholder="Description"
                                placeholderTextColor={colors.text.muted}
                                value={formData.description}
                                onChangeText={(t) => setFormData({ ...formData, description: t })}
                                multiline
                                style={[styles.input, { height: 80 }]}
                            />

                            <View style={{ flexDirection: "row", gap: 10, marginBottom: 20 }}>
                                {DIFFICULTY_LEVELS.map((level) => (
                                    <TouchableOpacity
                                        key={level}
                                        onPress={() => setFormData({ ...formData, difficulty: level as any })}
                                        style={{
                                            paddingVertical: 8,
                                            paddingHorizontal: 16,
                                            borderRadius: 20,
                                            backgroundColor: formData.difficulty === level ? BADGE_COLORS[level as keyof typeof BADGE_COLORS] : "rgba(255,255,255,0.1)",
                                            borderWidth: 1,
                                            borderColor: formData.difficulty === level ? BADGE_COLORS[level as keyof typeof BADGE_COLORS] : "rgba(255,255,255,0.1)"
                                        }}
                                    >
                                        <Text style={{
                                            color: formData.difficulty === level ? "white" : colors.text.muted,
                                            textTransform: "capitalize",
                                            fontWeight: "600",
                                            fontSize: 12
                                        }}>
                                            {level}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <TextInput
                                placeholder="#Tags"
                                placeholderTextColor={colors.text.muted}
                                value={formData.tags}
                                onChangeText={(t) => setFormData({ ...formData, tags: t })}
                                style={styles.input}
                                autoCapitalize="none"
                            />



                            <AnimatedButton
                                title="Save Changes"
                                onPress={handleUpdateReel}
                                loading={isLoading}
                            />
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* Create Folder Modal */}
            <Modal
                visible={createModalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setCreateModalVisible(false)}
            >
                <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.8)", justifyContent: "flex-end" }}>
                    <View style={{
                        backgroundColor: colors.background.primary,
                        borderTopLeftRadius: 24,
                        borderTopRightRadius: 24,
                        padding: 24,
                        paddingBottom: insets.bottom + 24
                    }}>
                        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                            <Text style={{ color: colors.text.primary, fontSize: 20, fontWeight: "700" }}>Create Grandmaster Folder</Text>
                            <TouchableOpacity onPress={() => setCreateModalVisible(false)}>
                                <X size={24} color={colors.text.muted} />
                            </TouchableOpacity>
                        </View>

                        <Text style={{ color: colors.text.secondary, fontSize: 13, marginBottom: 8 }}>Grandmaster Name *</Text>
                        <TextInput
                            style={{
                                backgroundColor: colors.background.secondary,
                                borderRadius: 12,
                                padding: 16,
                                color: colors.text.primary,
                                fontSize: 16,
                                marginBottom: 16,
                                borderWidth: 1,
                                borderColor: "rgba(255,255,255,0.1)"
                            }}
                            value={newFolderName}
                            onChangeText={setNewFolderName}
                            placeholder="e.g., Magnus Carlsen"
                            placeholderTextColor={colors.text.muted}
                        />

                        <Text style={{ color: colors.text.secondary, fontSize: 13, marginBottom: 8 }}>Description (optional)</Text>
                        <TextInput
                            style={{
                                backgroundColor: colors.background.secondary,
                                borderRadius: 12,
                                padding: 16,
                                color: colors.text.primary,
                                fontSize: 16,
                                marginBottom: 16,
                                borderWidth: 1,
                                borderColor: "rgba(255,255,255,0.1)",
                                minHeight: 80
                            }}
                            value={newFolderDescription}
                            onChangeText={setNewFolderDescription}
                            placeholder="Brief description about this grandmaster"
                            placeholderTextColor={colors.text.muted}
                            multiline
                        />

                        <Text style={{ color: colors.text.secondary, fontSize: 13, marginBottom: 8 }}>Thumbnail URL (optional)</Text>
                        <TextInput
                            style={{
                                backgroundColor: colors.background.secondary,
                                borderRadius: 12,
                                padding: 16,
                                color: colors.text.primary,
                                fontSize: 16,
                                marginBottom: 24,
                                borderWidth: 1,
                                borderColor: "rgba(255,255,255,0.1)"
                            }}
                            value={newFolderThumbnail}
                            onChangeText={setNewFolderThumbnail}
                            placeholder="https://..."
                            placeholderTextColor={colors.text.muted}
                        />

                        <TouchableOpacity
                            onPress={async () => {
                                if (!newFolderName.trim()) {
                                    Alert.alert("Error", "Grandmaster name is required");
                                    return;
                                }
                                try {
                                    await createGrandmasterMutation.mutateAsync({
                                        name: newFolderName.trim(),
                                        description: newFolderDescription,
                                        thumbnail: newFolderThumbnail || undefined
                                    });
                                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                                    setCreateModalVisible(false);
                                    setNewFolderName("");
                                    setNewFolderDescription("");
                                    setNewFolderThumbnail("");
                                    refetchGmFolders();
                                    refetchFolderStats();
                                } catch (error: any) {
                                    Alert.alert("Error", error.response?.data?.error || "Failed to create folder");
                                }
                            }}
                            disabled={createGrandmasterMutation.isPending}
                            style={{
                                backgroundColor: colors.accent.purple,
                                padding: 16,
                                borderRadius: 12,
                                alignItems: "center"
                            }}
                        >
                            {createGrandmasterMutation.isPending ? (
                                <Text style={{ color: "white", fontSize: 16, fontWeight: "600" }}>Creating...</Text>
                            ) : (
                                <Text style={{ color: "white", fontSize: 16, fontWeight: "600" }}>Create Folder</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </LinearGradient>
    );
}

const styles = {
    input: {
        backgroundColor: "rgba(0,0,0,0.3)",
        color: colors.text.primary,
        padding: 15,
        borderRadius: 12,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: colors.glass.medium,
        fontSize: 16
    }
};
