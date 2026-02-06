import React, { useState } from "react";
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    RefreshControl,
    Alert,
    ActivityIndicator,
    Modal,
    TextInput,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ArrowLeft, Plus, Film, Trash2, Edit2, X, User } from "lucide-react-native";
import * as Haptics from "expo-haptics";

import { colors } from "@/constants/themes";
import { GlassCard } from "@/components/ui/GlassCard";
import {
    useGrandmasterFolder,
    useReelsByFolder,
    useDeleteReel,
    useUpdateGrandmaster,
    useDeleteGrandmaster
} from "@/services/adminApi";

export default function FolderDetailScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { id } = useLocalSearchParams<{ id: string }>();

    // Fetch folder and reels
    const { data: folder, isLoading: folderLoading, refetch: refetchFolder } = useGrandmasterFolder(id || "");
    const { data: reels, isLoading: reelsLoading, refetch: refetchReels } = useReelsByFolder("grandmaster", folder?.name);
    const deleteReelMutation = useDeleteReel();
    const updateFolderMutation = useUpdateGrandmaster();
    const deleteFolderMutation = useDeleteGrandmaster();

    const [refreshing, setRefreshing] = useState(false);
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [editName, setEditName] = useState("");
    const [editDescription, setEditDescription] = useState("");
    const [editThumbnail, setEditThumbnail] = useState("");

    const onRefresh = async () => {
        setRefreshing(true);
        await Promise.all([refetchFolder(), refetchReels()]);
        setRefreshing(false);
    };

    const handleDeleteReel = (reelId: string) => {
        Alert.alert(
            "Delete Reel",
            "Are you sure you want to delete this reel?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await deleteReelMutation.mutateAsync(reelId);
                            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                            refetchReels();
                            refetchFolder();
                        } catch (error) {
                            Alert.alert("Error", "Failed to delete reel");
                        }
                    },
                },
            ]
        );
    };

    const openEditModal = () => {
        setEditName(folder?.name || "");
        setEditDescription(folder?.description || "");
        setEditThumbnail(folder?.thumbnail || "");
        setEditModalVisible(true);
    };

    const handleUpdateFolder = async () => {
        if (!editName.trim()) {
            Alert.alert("Error", "Name is required");
            return;
        }

        try {
            await updateFolderMutation.mutateAsync({
                id: id || "",
                data: {
                    name: editName.trim(),
                    description: editDescription,
                    thumbnail: editThumbnail || undefined,
                },
            });
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setEditModalVisible(false);
            refetchFolder();
        } catch (error: any) {
            Alert.alert("Error", error.response?.data?.error || "Failed to update folder");
        }
    };

    const handleDeleteFolder = () => {
        Alert.alert(
            "Delete Folder",
            "What would you like to do with the reels in this folder?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Move to Random",
                    onPress: async () => {
                        try {
                            await deleteFolderMutation.mutateAsync({ id: id || "", deleteReels: false });
                            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                            router.back();
                        } catch (error) {
                            Alert.alert("Error", "Failed to delete folder");
                        }
                    },
                },
                {
                    text: "Delete All",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await deleteFolderMutation.mutateAsync({ id: id || "", deleteReels: true });
                            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                            router.back();
                        } catch (error) {
                            Alert.alert("Error", "Failed to delete folder");
                        }
                    },
                },
            ]
        );
    };

    if (folderLoading) {
        return (
            <LinearGradient colors={[colors.background.primary, "#0f172a"]} style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                <ActivityIndicator size="large" color={colors.accent.purple} />
            </LinearGradient>
        );
    }

    return (
        <LinearGradient colors={[colors.background.primary, "#0f172a"]} style={{ flex: 1 }}>
            <ScrollView
                style={{ flex: 1, paddingTop: insets.top }}
                contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.text.primary} />}
            >
                {/* Header */}
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                        <TouchableOpacity
                            onPress={() => router.back()}
                            style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.1)", justifyContent: "center", alignItems: "center" }}
                        >
                            <ArrowLeft size={20} color={colors.text.primary} />
                        </TouchableOpacity>
                        <View>
                            <Text style={{ color: colors.text.primary, fontSize: 22, fontWeight: "700" }}>{folder?.name}</Text>
                            <Text style={{ color: colors.text.muted, fontSize: 13 }}>{folder?.reelCount || 0} reels</Text>
                        </View>
                    </View>

                    <View style={{ flexDirection: "row", gap: 10 }}>
                        <TouchableOpacity
                            onPress={openEditModal}
                            style={{ padding: 10, backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 10 }}
                        >
                            <Edit2 size={18} color={colors.text.primary} />
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={handleDeleteFolder}
                            style={{ padding: 10, backgroundColor: "rgba(239, 68, 68, 0.15)", borderRadius: 10 }}
                        >
                            <Trash2 size={18} color={colors.danger} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Description */}
                {folder?.description && (
                    <GlassCard variant="dark" style={{ marginBottom: 20, padding: 16 }}>
                        <Text style={{ color: colors.text.secondary, fontSize: 14, lineHeight: 20 }}>{folder.description}</Text>
                    </GlassCard>
                )}

                {/* Upload Button */}
                <TouchableOpacity
                    onPress={() => router.push({ pathname: "/admin/upload", params: { grandmaster: folder?.name } } as any)}
                    style={{
                        backgroundColor: colors.accent.purple,
                        padding: 16,
                        borderRadius: 12,
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 10,
                        marginBottom: 24,
                    }}
                >
                    <Plus size={20} color="white" />
                    <Text style={{ color: "white", fontSize: 16, fontWeight: "600" }}>Upload Reel to This Folder</Text>
                </TouchableOpacity>

                {/* Reels List */}
                <Text style={{ color: colors.text.primary, fontSize: 18, fontWeight: "600", marginBottom: 16 }}>Reels</Text>

                {reelsLoading ? (
                    <ActivityIndicator color={colors.accent.cyan} style={{ marginTop: 40 }} />
                ) : reels && reels.length > 0 ? (
                    <View style={{ gap: 12 }}>
                        {reels.map((reel) => (
                            <GlassCard key={reel._id} variant="dark" style={{ flexDirection: "row", alignItems: "center", padding: 14 }}>
                                <View style={{ width: 50, height: 50, borderRadius: 8, backgroundColor: "rgba(255,255,255,0.05)", justifyContent: "center", alignItems: "center", marginRight: 14 }}>
                                    <Film size={22} color={colors.text.muted} />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={{ color: colors.text.primary, fontSize: 15, fontWeight: "600" }} numberOfLines={1}>
                                        {reel.content.title}
                                    </Text>
                                    <Text style={{ color: colors.text.muted, fontSize: 12, marginTop: 2 }}>
                                        {reel.content.difficulty || "Unknown"} • {reel.content.tags?.slice(0, 2).join(", ")}
                                    </Text>
                                </View>
                                <TouchableOpacity
                                    onPress={() => handleDeleteReel(reel._id)}
                                    style={{ padding: 8, backgroundColor: "rgba(239, 68, 68, 0.15)", borderRadius: 8 }}
                                >
                                    <Trash2 size={16} color={colors.danger} />
                                </TouchableOpacity>
                            </GlassCard>
                        ))}
                    </View>
                ) : (
                    <View style={{ alignItems: "center", paddingVertical: 60 }}>
                        <User size={48} color={colors.text.muted} style={{ marginBottom: 16 }} />
                        <Text style={{ color: colors.text.muted, fontSize: 16 }}>No reels in this folder yet</Text>
                        <Text style={{ color: colors.text.muted, fontSize: 13, marginTop: 4 }}>Tap the button above to upload</Text>
                    </View>
                )}
            </ScrollView>

            {/* Edit Modal */}
            <Modal visible={editModalVisible} animationType="slide" transparent>
                <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "flex-end" }}>
                    <View style={{ backgroundColor: colors.background.primary, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: insets.bottom + 24 }}>
                        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                            <Text style={{ color: colors.text.primary, fontSize: 20, fontWeight: "700" }}>Edit Folder</Text>
                            <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                                <X size={24} color={colors.text.muted} />
                            </TouchableOpacity>
                        </View>

                        <Text style={{ color: colors.text.secondary, fontSize: 13, marginBottom: 8 }}>Name *</Text>
                        <TextInput
                            style={{ backgroundColor: colors.background.secondary, borderRadius: 12, padding: 16, color: colors.text.primary, fontSize: 16, marginBottom: 16, borderWidth: 1, borderColor: "rgba(255,255,255,0.1)" }}
                            value={editName}
                            onChangeText={setEditName}
                            placeholder="Grandmaster name"
                            placeholderTextColor={colors.text.muted}
                        />

                        <Text style={{ color: colors.text.secondary, fontSize: 13, marginBottom: 8 }}>Description</Text>
                        <TextInput
                            style={{ backgroundColor: colors.background.secondary, borderRadius: 12, padding: 16, color: colors.text.primary, fontSize: 16, marginBottom: 16, borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", minHeight: 80 }}
                            value={editDescription}
                            onChangeText={setEditDescription}
                            placeholder="Optional description"
                            placeholderTextColor={colors.text.muted}
                            multiline
                        />

                        <Text style={{ color: colors.text.secondary, fontSize: 13, marginBottom: 8 }}>Thumbnail URL</Text>
                        <TextInput
                            style={{ backgroundColor: colors.background.secondary, borderRadius: 12, padding: 16, color: colors.text.primary, fontSize: 16, marginBottom: 24, borderWidth: 1, borderColor: "rgba(255,255,255,0.1)" }}
                            value={editThumbnail}
                            onChangeText={setEditThumbnail}
                            placeholder="https://..."
                            placeholderTextColor={colors.text.muted}
                        />

                        <TouchableOpacity
                            onPress={handleUpdateFolder}
                            disabled={updateFolderMutation.isPending}
                            style={{ backgroundColor: colors.accent.purple, padding: 16, borderRadius: 12, alignItems: "center" }}
                        >
                            {updateFolderMutation.isPending ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <Text style={{ color: "white", fontSize: 16, fontWeight: "600" }}>Save Changes</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </LinearGradient>
    );
}
