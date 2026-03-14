import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    TextInput,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { AdminAuthGuard } from "../_components/admin/AdminAuthGuard";
import { useAdminReels, useUpdateReel, useGrandmasterFolders, PostReelData } from "../_lib/services/adminApi";
import { FONTS } from "../_lib/styles/base";

function EditContent() {
    const { reelId } = useLocalSearchParams<{ reelId: string }>();
    const { data: reels = [] } = useAdminReels();
    const reel = reels.find((r) => r._id === reelId);
    const updateReel = useUpdateReel();
    const { data: gmFolders = [], isLoading: gmFoldersLoading } = useGrandmasterFolders();

    // Form state
    const [videoUrl, setVideoUrl] = useState("");
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [tags, setTags] = useState("");
    const [difficulty, setDifficulty] = useState<"beginner" | "intermediate" | "advanced">("beginner");
    const [folder, setFolder] = useState<"random" | "grandmaster">("random");
    const [grandmaster, setGrandmaster] = useState("");
    const [whitePlayer, setWhitePlayer] = useState("");
    const [blackPlayer, setBlackPlayer] = useState("");

    // Interactive chess fields
    const [chessFen, setChessFen] = useState("");
    const [triggerTimestamp, setTriggerTimestamp] = useState("");
    const [playerColor, setPlayerColor] = useState<"w" | "b" | null>(null);
    const [challengePrompt, setChallengePrompt] = useState("");
    const [solutionMoves, setSolutionMoves] = useState("");
    const [challengeRating, setChallengeRating] = useState(3);
    const [timeLimit, setTimeLimit] = useState("");
    const [showInteractive, setShowInteractive] = useState(false);

    // Populate form when reel data loads
    useEffect(() => {
        if (reel) {
            setVideoUrl(reel.video?.url || "");
            setTitle(reel.content?.title || "");
            setDescription(reel.content?.description || "");
            setTags((reel.content?.tags || []).join(", "));
            setDifficulty((reel.content?.difficulty as any) || "beginner");
            setFolder((reel as any)?.folder || "random");
            setGrandmaster((reel as any)?.grandmaster || "");
            setWhitePlayer(reel.content?.whitePlayer || "");
            setBlackPlayer(reel.content?.blackPlayer || "");

            if (reel.interactive) {
                setShowInteractive(true);
                setChessFen(reel.interactive.chessFen || "");
                setTriggerTimestamp(reel.interactive.triggerTimestamp ? String(reel.interactive.triggerTimestamp) : "");
                setPlayerColor(reel.interactive.playerColor || null);
                setChallengePrompt(reel.interactive.challengePrompt || "");
                setSolutionMoves((reel.interactive.solutionMoves || []).join(", "));
                setChallengeRating(reel.interactive.difficultyRating || 3);
                setTimeLimit(reel.interactive.timeLimit ? String(reel.interactive.timeLimit) : "");
            }
        }
    }, [reel]);

    const handleSubmit = async () => {
        if (!title.trim()) { Alert.alert("Missing", "Title is required."); return; }
        if (!videoUrl.trim()) { Alert.alert("Missing", "Video URL is required."); return; }

        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        const data: PostReelData = {
            videoUrl: videoUrl.trim(),
            title: title.trim(),
            description: description.trim(),
            tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
            difficulty,
            folder,
            grandmaster: folder === "grandmaster" ? grandmaster : null,
            whitePlayer: whitePlayer.trim() || undefined,
            blackPlayer: blackPlayer.trim() || undefined,
        };

        if (showInteractive && chessFen.trim()) {
            data.interactive = {
                chessFen: chessFen.trim(),
                triggerTimestamp: triggerTimestamp ? parseFloat(triggerTimestamp) : undefined,
                playerColor: playerColor || undefined,
                challengePrompt: challengePrompt.trim() || undefined,
                solutionMoves: solutionMoves.split(",").map((m) => m.trim()).filter(Boolean),
                difficultyRating: challengeRating,
                timeLimit: timeLimit ? parseFloat(timeLimit) : undefined,
            };
        }

        updateReel.mutate(
            { reelId: reelId!, reelData: data },
            {
                onSuccess: () => {
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    Alert.alert("Success", "Reel updated!", [{ text: "OK", onPress: () => router.back() }]);
                },
                onError: (err: any) => {
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                    Alert.alert("Error", err?.message || "Update failed");
                },
            }
        );
    };

    const difficulties: Array<"beginner" | "intermediate" | "advanced"> = ["beginner", "intermediate", "advanced"];
    const diffColors: Record<string, string> = { beginner: "#10B981", intermediate: "#F59E0B", advanced: "#EF4444" };

    if (!reel) {
        return (
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#0D3B2E" }}>
                <ActivityIndicator size="large" color="#F5A623" />
                <Text style={{ color: "#A0A0B0", marginTop: 12 }}>Loading reel...</Text>
            </View>
        );
    }

    return (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
            <LinearGradient colors={["#0D3B2E", "#093026"]} style={{ flex: 1 }}>
                <ScrollView style={styles.container} contentContainerStyle={styles.content}>
                    {/* Header */}
                    <View style={styles.header}>
                        <TouchableOpacity onPress={() => router.back()}>
                            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Edit Reel</Text>
                        <View style={{ width: 24 }} />
                    </View>

                    {/* Video URL */}
                    <View style={styles.glassCard}>
                        <Text style={styles.sectionTitle}>Video URL</Text>
                        <TextInput
                            style={styles.input}
                            value={videoUrl}
                            onChangeText={setVideoUrl}
                            placeholder="https://example.com/video.mp4"
                            placeholderTextColor="#6B7280"
                            autoCapitalize="none"
                        />
                    </View>

                    {/* Content Details */}
                    <View style={styles.glassCard}>
                        <Text style={styles.sectionTitle}>Reel Details</Text>
                        <View style={styles.field}>
                            <Text style={styles.label}>Title *</Text>
                            <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="Reel title" placeholderTextColor="#6B7280" />
                        </View>
                        <View style={styles.field}>
                            <Text style={styles.label}>Description</Text>
                            <TextInput style={[styles.input, styles.textArea]} value={description} onChangeText={setDescription} placeholder="Describe the reel..." placeholderTextColor="#6B7280" multiline numberOfLines={3} />
                        </View>
                        <View style={styles.field}>
                            <Text style={styles.label}>Tags (comma separated)</Text>
                            <TextInput style={styles.input} value={tags} onChangeText={setTags} placeholder="opening, tactics, endgame" placeholderTextColor="#6B7280" />
                        </View>
                    </View>

                    {/* Players */}
                    <View style={styles.glassCard}>
                        <Text style={styles.sectionTitle}>Players Matchup</Text>
                        <View style={styles.row}>
                            <View style={[styles.field, { flex: 1 }]}>
                                <Text style={styles.label}>White Player</Text>
                                <TextInput style={styles.input} value={whitePlayer} onChangeText={setWhitePlayer} placeholder="White player" placeholderTextColor="#6B7280" />
                            </View>
                            <View style={[styles.field, { flex: 1 }]}>
                                <Text style={styles.label}>Black Player</Text>
                                <TextInput style={styles.input} value={blackPlayer} onChangeText={setBlackPlayer} placeholder="Black player" placeholderTextColor="#6B7280" />
                            </View>
                        </View>
                    </View>

                    {/* Difficulty */}
                    <View style={styles.glassCard}>
                        <Text style={styles.sectionTitle}>Difficulty Level</Text>
                        <View style={styles.pillRow}>
                            {difficulties.map((d) => (
                                <TouchableOpacity
                                    key={d}
                                    style={[styles.pill, difficulty === d && { backgroundColor: `${diffColors[d]}25`, borderColor: diffColors[d] }]}
                                    onPress={() => setDifficulty(d)}
                                >
                                    <Text style={[styles.pillText, difficulty === d && { color: diffColors[d] }]}>{d}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Folder */}
                    <View style={styles.glassCard}>
                        <Text style={styles.sectionTitle}>Storage Folder</Text>
                        <View style={styles.pillRow}>
                            <TouchableOpacity style={[styles.pill, folder === "random" && styles.pillActive]} onPress={() => setFolder("random")}>
                                <Text style={[styles.pillText, folder === "random" && styles.pillTextActive]}>Random</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.pill, folder === "grandmaster" && styles.pillActive]} onPress={() => setFolder("grandmaster")}>
                                <Text style={[styles.pillText, folder === "grandmaster" && styles.pillTextActive]}>Grandmaster</Text>
                            </TouchableOpacity>
                        </View>
                        {folder === "grandmaster" && (
                            <View style={{ marginTop: 12 }}>
                                <Text style={styles.label}>Select Grand Master Folder</Text>
                                {gmFoldersLoading ? (
                                    <ActivityIndicator color="#F5A623" style={{ marginVertical: 12 }} />
                                ) : gmFolders.length === 0 ? (
                                    <Text style={{ color: '#706D82', fontSize: 13, marginTop: 4 }}>No folders created yet.</Text>
                                ) : (
                                    <View style={styles.gmGrid}>
                                        {gmFolders.map((gm) => (
                                            <TouchableOpacity
                                                key={gm._id}
                                                style={[styles.gmChip, grandmaster === gm.name && styles.gmChipActive]}
                                                onPress={() => setGrandmaster(gm.name)}
                                            >
                                                <Text style={[styles.gmChipText, grandmaster === gm.name && styles.gmChipTextActive]}>{gm.name}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                )}
                            </View>
                        )}
                    </View>

                    {/* Interactive Toggle */}
                    <View style={styles.glassCard}>
                        <TouchableOpacity style={styles.toggleRow} onPress={() => setShowInteractive(!showInteractive)}>
                            <View style={styles.toggleLeft}>
                                <Ionicons name="game-controller-outline" size={18} color="#F5A623" />
                                <Text style={styles.sectionTitle}>Interactive Challenge</Text>
                            </View>
                            <Ionicons name={showInteractive ? "chevron-up" : "chevron-down"} size={20} color="#A0A0B0" />
                        </TouchableOpacity>

                        {showInteractive && (
                            <View style={{ marginTop: 12 }}>
                                <View style={styles.field}>
                                    <Text style={styles.subLabel}>Chess FEN Position *</Text>
                                    <TextInput style={styles.input} value={chessFen} onChangeText={setChessFen} placeholder="Position FEN" placeholderTextColor="#6B7280" autoCapitalize="none" />
                                </View>
                                <View style={styles.field}>
                                    <Text style={styles.subLabel}>Trigger Timestamp (sec)</Text>
                                    <TextInput style={styles.input} value={triggerTimestamp} onChangeText={setTriggerTimestamp} placeholder="e.g. 15.5" placeholderTextColor="#6B7280" keyboardType="decimal-pad" />
                                </View>
                                <View style={styles.field}>
                                    <Text style={styles.subLabel}>Player Color</Text>
                                    <View style={styles.pillRow}>
                                        <TouchableOpacity style={[styles.pill, playerColor === "w" && styles.pillActive]} onPress={() => setPlayerColor("w")}>
                                            <Text style={[styles.pillText, playerColor === "w" && styles.pillTextActive]}>{whitePlayer.trim() || 'White'}</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity style={[styles.pill, playerColor === "b" && styles.pillActive]} onPress={() => setPlayerColor("b")}>
                                            <Text style={[styles.pillText, playerColor === "b" && styles.pillTextActive]}>{blackPlayer.trim() || 'Black'}</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity style={[styles.pill, playerColor === null && styles.pillActive]} onPress={() => setPlayerColor(null)}>
                                            <Text style={[styles.pillText, playerColor === null && styles.pillTextActive]}>User Picks</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                                <View style={styles.field}>
                                    <Text style={styles.subLabel}>Challenge Prompt</Text>
                                    <TextInput style={styles.input} value={challengePrompt} onChangeText={setChallengePrompt} placeholder="Find the best move!" placeholderTextColor="#6B7280" />
                                </View>
                                <View style={styles.field}>
                                    <Text style={styles.subLabel}>Solution Moves (comma separated)</Text>
                                    <TextInput style={styles.input} value={solutionMoves} onChangeText={setSolutionMoves} placeholder="Nf6, Qxd5" placeholderTextColor="#6B7280" />
                                </View>
                                <View style={styles.field}>
                                    <Text style={styles.subLabel}>Difficulty Rating</Text>
                                    <View style={styles.starsRow}>
                                        {[1, 2, 3, 4, 5].map((n) => (
                                            <TouchableOpacity key={n} onPress={() => setChallengeRating(n)}>
                                                <Ionicons
                                                    name={n <= challengeRating ? "star" : "star-outline"}
                                                    size={28}
                                                    color={n <= challengeRating ? "#F59E0B" : "#4B5563"}
                                                />
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </View>
                                <View style={styles.field}>
                                    <Text style={styles.subLabel}>Time Limit (seconds)</Text>
                                    <TextInput style={styles.input} value={timeLimit} onChangeText={setTimeLimit} placeholder="e.g. 60" placeholderTextColor="#6B7280" keyboardType="decimal-pad" />
                                </View>
                            </View>
                        )}
                    </View>

                    {/* Submit */}
                    <TouchableOpacity
                        style={[styles.submitBtn, updateReel.isPending && styles.submitBtnDisabled]}
                        onPress={handleSubmit}
                        disabled={updateReel.isPending}
                    >
                        {updateReel.isPending ? (
                            <ActivityIndicator color="#0D3B2E" />
                        ) : (
                            <>
                                <Ionicons name="save-outline" size={20} color="#0D3B2E" />
                                <Text style={styles.submitText}>Save Changes</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </ScrollView>
            </LinearGradient>
        </KeyboardAvoidingView>
    );
}

export default function AdminEditScreen() {
    return (
        <AdminAuthGuard>
            <EditContent />
        </AdminAuthGuard>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    content: { padding: 20, paddingTop: 60, paddingBottom: 40 },
    header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 24 },
    headerTitle: { fontFamily: FONTS.extrabold, fontSize: 22, color: "#FFFFFF" },
    glassCard: {
        backgroundColor: "rgba(255,255,255,0.04)",
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.08)",
    },
    sectionTitle: { fontFamily: FONTS.bold, color: "#FFFFFF", fontSize: 15, marginBottom: 10 },
    field: { marginBottom: 14 },
    label: { fontFamily: FONTS.semibold, color: "#A0A0B0", fontSize: 13, marginBottom: 6 },
    subLabel: { fontFamily: FONTS.regular, color: "#A0A0B0", fontSize: 12, marginBottom: 4 },
    input: {
        backgroundColor: "rgba(255,255,255,0.05)",
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 12,
        color: "#FFFFFF",
        fontSize: 14,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.08)",
    },
    textArea: { height: 80, textAlignVertical: "top" },
    row: { flexDirection: "row", gap: 12 },
    pillRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
    pill: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.12)",
        backgroundColor: "rgba(255,255,255,0.04)",
    },
    pillActive: { borderColor: "#F5A623", backgroundColor: "rgba(245, 166, 35, 0.12)" },
    pillText: { fontFamily: FONTS.medium, color: "#A0A0B0", fontSize: 13, textTransform: "capitalize" },
    pillTextActive: { color: "#F5A623" },
    gmGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    gmChip: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        backgroundColor: "rgba(255,255,255,0.06)",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.08)",
    },
    gmChipActive: { borderColor: "#7B2FF7", backgroundColor: "rgba(123, 47, 247, 0.15)" },
    gmChipText: { fontFamily: FONTS.regular, color: "#A0A0B0", fontSize: 12 },
    gmChipTextActive: { fontFamily: FONTS.semibold, color: "#7B2FF7" },
    toggleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    toggleLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
    starsRow: { flexDirection: "row", gap: 6, marginTop: 4 },
    submitBtn: {
        flexDirection: "row",
        height: 56,
        borderRadius: 16,
        backgroundColor: "#F5A623",
        justifyContent: "center",
        alignItems: "center",
        gap: 8,
        marginTop: 8,
    },
    submitBtnDisabled: { opacity: 0.6 },
    submitText: { fontFamily: FONTS.bold, fontSize: 17, color: "#0D3B2E" },
});
