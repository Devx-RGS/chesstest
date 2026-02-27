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
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { AdminAuthGuard } from "../components/admin/AdminAuthGuard";
import { useAdminReels, useAdminStats, useDeleteReel } from "../lib/services/adminApi";
import { useAuthStore } from "../lib/stores/authStore";
import { Reel } from "../lib/types/reel";
import { formatCount } from "../lib/services/reelApi";

function DashboardContent() {
    const { data: reels = [], isLoading: reelsLoading, isError: reelsError, error: reelsErrorObj, refetch: refetchReels } = useAdminReels();
    const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useAdminStats();
    const deleteReel = useDeleteReel();
    const logout = useAuthStore((s) => s.logout);
    const [refreshing, setRefreshing] = useState(false);

    // Debug log
    console.log(`[Dashboard] reels: ${reels.length}, loading: ${reelsLoading}, error: ${reelsError}`, reelsErrorObj);

    const onRefresh = async () => {
        setRefreshing(true);
        await Promise.all([refetchReels(), refetchStats()]);
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

    const statCards = stats
        ? [
            { icon: "film-outline" as const, label: "Total Reels", value: stats.totalReels, color: "#00D9FF" },
            { icon: "eye-outline" as const, label: "Total Views", value: formatCount(stats.totalViews), color: "#7B2FF7" },
            { icon: "heart-outline" as const, label: "Total Likes", value: formatCount(stats.totalLikes), color: "#FF2D55" },
            { icon: "document-outline" as const, label: "Drafts", value: stats.draftReels, color: "#F59E0B" },
        ]
        : [];

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.content}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#00D9FF" />}
        >
            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.headerTitle}>Dashboard</Text>
                    <Text style={styles.headerSub}>Manage your reels</Text>
                </View>
                <View style={styles.headerActions}>
                    <TouchableOpacity style={styles.iconBtn} onPress={() => router.push("/admin/upload")}>
                        <Ionicons name="add-circle" size={28} color="#00D9FF" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.iconBtn} onPress={handleLogout}>
                        <Ionicons name="log-out-outline" size={24} color="#EF4444" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Stats */}
            {statsLoading ? (
                <ActivityIndicator color="#00D9FF" style={{ marginVertical: 20 }} />
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

            {/* Reels List */}
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>All Reels ({reels.length})</Text>
                    <TouchableOpacity onPress={() => router.push("/admin/upload")}>
                        <Text style={styles.addText}>+ Add New</Text>
                    </TouchableOpacity>
                </View>

                {reelsLoading ? (
                    <ActivityIndicator color="#00D9FF" style={{ marginVertical: 20 }} />
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
        backgroundColor: "#0F0F23",
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
        fontSize: 28,
        fontWeight: "800",
        color: "#FFFFFF",
    },
    headerSub: {
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
        fontSize: 24,
        fontWeight: "700",
        color: "#FFFFFF",
    },
    statLabel: {
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
        fontSize: 18,
        fontWeight: "700",
        color: "#FFFFFF",
    },
    addText: {
        fontSize: 14,
        color: "#00D9FF",
        fontWeight: "600",
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
        fontSize: 15,
        fontWeight: "600",
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
        backgroundColor: "rgba(0, 217, 255, 0.12)",
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 12,
    },
    emptyBtnText: {
        color: "#00D9FF",
        fontWeight: "600",
    },
});
