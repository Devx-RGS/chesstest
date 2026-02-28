import React, { useState } from "react";
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ActivityIndicator,
    RefreshControl,
    TextInput,
    Image,
    Modal,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { AdminAuthGuard } from "../components/admin/AdminAuthGuard";
import { useAdminReels, useAdminStats, useDeleteReel, useGrandmasterFolders, useCreateGrandmaster } from "../lib/services/adminApi";
import { useAuthStore } from "../lib/stores/authStore";
import { Reel } from "../lib/types/reel";
import { formatCount } from "../lib/services/reelApi";
import { FONTS } from "../lib/styles/base";

function DashboardContent() {
    const { data: reels = [], isLoading: reelsLoading, isError: reelsError, error: reelsErrorObj, refetch: refetchReels } = useAdminReels();
    const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useAdminStats();
    const { data: gmFolders = [], isLoading: gmLoading, refetch: refetchGM } = useGrandmasterFolders();
    const createGM = useCreateGrandmaster();
    const deleteReel = useDeleteReel();
    const logout = useAuthStore((s) => s.logout);
    const [refreshing, setRefreshing] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newGMName, setNewGMName] = useState("");
    const [newGMThumb, setNewGMThumb] = useState("");
    const [newGMDesc, setNewGMDesc] = useState("");

    // Debug log
    console.log(`[Dashboard] reels: ${reels.length}, loading: ${reelsLoading}, error: ${reelsError}`, reelsErrorObj);

    const onRefresh = async () => {
        setRefreshing(true);
        await Promise.all([refetchReels(), refetchStats(), refetchGM()]);
        setRefreshing(false);
    };

    const handleDelete = (reel: Reel) => {
        Alert.alert(
            "Delete Reel",
            `Delete "${reel.content.title}"?`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: () => deleteReel.mutate(reel._id),
                },
            ]
        );
    };

    const handleLogout = () => {
        logout();
        router.replace("/");
    };

    const handleCreateFolder = async () => {
        if (!newGMName.trim()) {
            Alert.alert("Error", "Please enter a grandmaster name");
            return;
        }
        try {
            await createGM.mutateAsync({
                name: newGMName.trim(),
                thumbnail: newGMThumb.trim() || undefined,
                description: newGMDesc.trim() || undefined,
            });
            setShowCreateModal(false);
            setNewGMName("");
            setNewGMThumb("");
            setNewGMDesc("");
            Alert.alert("Success", `Folder "${newGMName}" created`);
        } catch (err: any) {
            Alert.alert("Error", err?.response?.data?.message || "Failed to create folder");
        }
    };

    const statCards = stats
        ? [
            { icon: "film-outline" as const, label: "Total Reels", value: stats.totalReels, color: "#F5A623" },
            { icon: "eye-outline" as const, label: "Total Views", value: formatCount(stats.totalViews), color: "#7B2FF7" },
            { icon: "heart-outline" as const, label: "Total Likes", value: formatCount(stats.totalLikes), color: "#FF2D55" },
            { icon: "document-outline" as const, label: "Drafts", value: stats.draftReels, color: "#F59E0B" },
        ]
        : [];

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.content}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#F5A623" />}
        >
            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.headerTitle}>Dashboard</Text>
                    <Text style={styles.headerSub}>Manage your reels</Text>
                </View>
                <View style={styles.headerActions}>
                    <TouchableOpacity style={styles.iconBtn} onPress={() => router.push("/admin/upload")}>
                        <Ionicons name="add-circle" size={28} color="#F5A623" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.iconBtn} onPress={handleLogout}>
                        <Ionicons name="log-out-outline" size={24} color="#EF4444" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Stats */}
            {statsLoading ? (
                <ActivityIndicator color="#F5A623" style={{ marginVertical: 20 }} />
            ) : (
                <View style={styles.statsGrid}>
                    {statCards.map((s) => (
                        <View key={s.label} style={styles.statCard}>
                            <View style={[styles.statIcon, { backgroundColor: `${s.color}15` }]}>
                                <Ionicons name={s.icon} size={22} color={s.color} />
                            </View>
                            <Text style={styles.statValue}>{s.value}</Text>
                            <Text style={styles.statLabel}>{s.label}</Text>
                        </View>
                    ))}
                </View>
            )}

            {/* Grandmaster Folders Section */}
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Grand Master Folders</Text>
                    <TouchableOpacity onPress={() => setShowCreateModal(true)}>
                        <Text style={styles.addText}>+ Create Folder</Text>
                    </TouchableOpacity>
                </View>

                {gmLoading ? (
                    <ActivityIndicator color="#F5A623" style={{ marginVertical: 16 }} />
                ) : gmFolders.length === 0 ? (
                    <View style={styles.emptyFolders}>
                        <Ionicons name="trophy-outline" size={32} color="#706D82" />
                        <Text style={styles.emptyFolderText}>No folders yet. Create your first grandmaster folder.</Text>
                    </View>
                ) : (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
                        {gmFolders.map((gm) => (
                            <View key={gm._id} style={styles.gmFolderCard}>
                                {gm.thumbnail ? (
                                    <Image source={{ uri: gm.thumbnail }} style={styles.gmFolderThumb} />
                                ) : (
                                    <View style={[styles.gmFolderThumb, styles.gmFolderPlaceholder]}>
                                        <Ionicons name="person" size={24} color="#F5A623" />
                                    </View>
                                )}
                                <Text style={styles.gmFolderName} numberOfLines={1}>{gm.name}</Text>
                                <Text style={styles.gmFolderCount}>{gm.reelCount} reels</Text>
                            </View>
                        ))}
                    </ScrollView>
                )}
            </View>

            {/* Create Folder Modal */}
            <Modal visible={showCreateModal} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        <Text style={styles.modalTitle}>Create Grand Master Folder</Text>

                        <Text style={styles.inputLabel}>Name *</Text>
                        <TextInput
                            style={styles.modalInput}
                            placeholder="e.g. Magnus Carlsen"
                            placeholderTextColor="#706D82"
                            value={newGMName}
                            onChangeText={setNewGMName}
                        />

                        <Text style={styles.inputLabel}>Thumbnail URL</Text>
                        <TextInput
                            style={styles.modalInput}
                            placeholder="https://example.com/photo.jpg"
                            placeholderTextColor="#706D82"
                            value={newGMThumb}
                            onChangeText={setNewGMThumb}
                            autoCapitalize="none"
                        />

                        <Text style={styles.inputLabel}>Description</Text>
                        <TextInput
                            style={[styles.modalInput, { height: 60 }]}
                            placeholder="Optional description..."
                            placeholderTextColor="#706D82"
                            value={newGMDesc}
                            onChangeText={setNewGMDesc}
                            multiline
                        />

                        <View style={styles.modalActions}>
                            <TouchableOpacity style={styles.modalCancel} onPress={() => setShowCreateModal(false)}>
                                <Text style={styles.modalCancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalSubmit, createGM.isPending && { opacity: 0.5 }]}
                                onPress={handleCreateFolder}
                                disabled={createGM.isPending}
                            >
                                {createGM.isPending ? (
                                    <ActivityIndicator size="small" color="#FFFFFF" />
                                ) : (
                                    <Text style={styles.modalSubmitText}>Create</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Reels List */}
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>All Reels ({reels.length})</Text>
                    <TouchableOpacity onPress={() => router.push("/admin/upload")}>
                        <Text style={styles.addText}>+ Add New</Text>
                    </TouchableOpacity>
                </View>

                {reelsLoading ? (
                    <ActivityIndicator color="#F5A623" style={{ marginVertical: 20 }} />
                ) : reelsError ? (
                    <View style={styles.emptyState}>
                        <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
                        <Text style={styles.emptyText}>Failed to load reels</Text>
                        <Text style={[styles.emptyText, { fontSize: 12, color: '#9CA3AF' }]}>
                            {(reelsErrorObj as any)?.response?.status === 401 ? 'Session expired. Please log in again.' :
                                (reelsErrorObj as any)?.response?.status === 403 ? 'Admin access required.' :
                                    (reelsErrorObj as any)?.message || 'Network error'}
                        </Text>
                        <TouchableOpacity style={styles.emptyBtn} onPress={() => refetchReels()}>
                            <Text style={styles.emptyBtnText}>Retry</Text>
                        </TouchableOpacity>
                    </View>
                ) : reels.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Ionicons name="film-outline" size={48} color="#6B7280" />
                        <Text style={styles.emptyText}>No reels yet</Text>
                        <TouchableOpacity style={styles.emptyBtn} onPress={() => router.push("/admin/upload")}>
                            <Text style={styles.emptyBtnText}>Upload your first reel</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    reels.map((reel) => (
                        <View key={reel._id} style={styles.reelCard}>
                            <View style={styles.reelInfo}>
                                <Text style={styles.reelTitle} numberOfLines={1}>
                                    {reel.content.title || "Untitled"}
                                </Text>
                                <View style={styles.reelMeta}>
                                    <View style={[styles.statusBadge, reel.status === "published" ? styles.published : styles.draft]}>
                                        <Text style={styles.statusText}>{reel.status}</Text>
                                    </View>
                                    <Text style={styles.metaText}>
                                        <Ionicons name="eye-outline" size={12} color="#6B7280" /> {reel.engagement?.views || 0}
                                    </Text>
                                    <Text style={styles.metaText}>
                                        <Ionicons name="heart-outline" size={12} color="#6B7280" /> {reel.engagement?.likes || 0}
                                    </Text>
                                </View>
                                {reel.content.difficulty && (
                                    <Text style={styles.diffLabel}>{reel.content.difficulty}</Text>
                                )}
                            </View>
                            <TouchableOpacity
                                onPress={() => handleDelete(reel)}
                                style={styles.deleteBtn}
                            >
                                <Ionicons name="trash-outline" size={20} color="#EF4444" />
                            </TouchableOpacity>
                        </View>
                    ))
                )}
            </View>
        </ScrollView>
    );
}

export default function AdminDashboardScreen() {
    return (
        <AdminAuthGuard>
            <DashboardContent />
        </AdminAuthGuard>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#080B14",
    },
    content: {
        padding: 20,
        paddingTop: 60,
        paddingBottom: 40,
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 24,
    },
    headerTitle: {
        fontFamily: FONTS.extrabold,
        fontSize: 28,
        color: "#FFFFFF",
    },
    headerSub: {
        fontFamily: FONTS.regular,
        fontSize: 14,
        color: "#A0A0B0",
        marginTop: 2,
    },
    headerActions: {
        flexDirection: "row",
        gap: 12,
    },
    iconBtn: {
        padding: 6,
    },
    statsGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 12,
        marginBottom: 28,
    },
    statCard: {
        width: "47%",
        backgroundColor: "rgba(26, 26, 46, 0.8)",
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.06)",
    },
    statIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 10,
    },
    statValue: {
        fontFamily: FONTS.bold,
        fontSize: 24,
        color: "#FFFFFF",
    },
    statLabel: {
        fontFamily: FONTS.regular,
        fontSize: 12,
        color: "#A0A0B0",
        marginTop: 2,
    },
    section: {
        marginBottom: 20,
    },
    sectionHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 14,
    },
    sectionTitle: {
        fontFamily: FONTS.bold,
        fontSize: 18,
        color: "#FFFFFF",
    },
    addText: {
        fontFamily: FONTS.semibold,
        fontSize: 14,
        color: "#F5A623",
    },
    reelCard: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "rgba(26, 26, 46, 0.6)",
        borderRadius: 14,
        padding: 14,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.05)",
    },
    reelInfo: {
        flex: 1,
        gap: 4,
    },
    reelTitle: {
        fontFamily: FONTS.semibold,
        fontSize: 15,
        color: "#E0E0E8",
    },
    reelMeta: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
    },
    published: {
        backgroundColor: "rgba(16, 185, 129, 0.15)",
    },
    draft: {
        backgroundColor: "rgba(245, 158, 11, 0.15)",
    },
    statusText: {
        fontSize: 11,
        fontWeight: "600",
        color: "#10B981",
        textTransform: "capitalize",
    },
    metaText: {
        fontSize: 12,
        color: "#6B7280",
    },
    diffLabel: {
        fontSize: 11,
        color: "#A0A0B0",
        textTransform: "capitalize",
    },
    deleteBtn: {
        padding: 10,
    },
    emptyState: {
        alignItems: "center",
        paddingVertical: 40,
        gap: 12,
    },
    emptyText: {
        fontSize: 16,
        color: "#6B7280",
    },
    emptyBtn: {
        backgroundColor: "rgba(245, 166, 35, 0.12)",
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 12,
    },
    emptyBtnText: {
        fontFamily: FONTS.semibold,
        color: "#F5A623",
    },
    // Grandmaster folder styles
    emptyFolders: {
        alignItems: "center",
        paddingVertical: 24,
        gap: 10,
    },
    emptyFolderText: {
        color: "#706D82",
        fontSize: 13,
        textAlign: "center",
    },
    gmFolderCard: {
        width: 130,
        backgroundColor: "rgba(255,255,255,0.04)",
        borderRadius: 14,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.08)",
        overflow: "hidden",
    },
    gmFolderThumb: {
        width: 130,
        height: 90,
        backgroundColor: "#111629",
    },
    gmFolderPlaceholder: {
        alignItems: "center",
        justifyContent: "center",
    },
    gmFolderName: {
        fontFamily: FONTS.semibold,
        color: "#FFFFFF",
        fontSize: 13,
        paddingHorizontal: 10,
        paddingTop: 8,
    },
    gmFolderCount: {
        fontFamily: FONTS.regular,
        color: "#706D82",
        fontSize: 11,
        paddingHorizontal: 10,
        paddingBottom: 10,
        paddingTop: 2,
    },
    // Modal styles
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.7)",
        justifyContent: "center",
        alignItems: "center",
        padding: 24,
    },
    modalCard: {
        width: "100%",
        backgroundColor: "#111629",
        borderRadius: 20,
        padding: 24,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.08)",
    },
    modalTitle: {
        fontFamily: FONTS.bold,
        color: "#FFFFFF",
        fontSize: 20,
        marginBottom: 20,
    },
    inputLabel: {
        fontFamily: FONTS.semibold,
        color: "#B0ACBE",
        fontSize: 12,
        marginBottom: 6,
        marginTop: 12,
    },
    modalInput: {
        backgroundColor: "rgba(255,255,255,0.06)",
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontSize: 15,
        color: "#FFFFFF",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.08)",
    },
    modalActions: {
        flexDirection: "row",
        justifyContent: "flex-end",
        gap: 12,
        marginTop: 24,
    },
    modalCancel: {
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 12,
    },
    modalCancelText: {
        fontFamily: FONTS.semibold,
        color: "#B0ACBE",
        fontSize: 15,
    },
    modalSubmit: {
        backgroundColor: "#F5A623",
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 12,
    },
    modalSubmitText: {
        fontFamily: FONTS.bold,
        color: "#FFFFFF",
        fontSize: 15,
    },
});
