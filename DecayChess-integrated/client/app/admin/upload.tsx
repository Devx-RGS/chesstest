import React, { useState } from "react";
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
    Image,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";
import { AdminAuthGuard } from "../components/admin/AdminAuthGuard";
import { usePostReel, PREDEFINED_GRANDMASTERS, PostReelData } from "../lib/services/adminApi";
import { axiosClient } from "../lib/services/axiosClient";

type UploadMode = "local" | "url";

function UploadContent() {
    // Upload mode
    const [uploadMode, setUploadMode] = useState<UploadMode>("url");

    // Form state
    const [videoUrl, setVideoUrl] = useState("");
    const [videoUri, setVideoUri] = useState<string | null>(null);
    const [thumbnailUrl, setThumbnailUrl] = useState("");
    const [thumbnailUri, setThumbnailUri] = useState<string | null>(null);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [tags, setTags] = useState("");
    const [difficulty, setDifficulty] = useState<"beginner" | "intermediate" | "advanced">("beginner");
    const [folder, setFolder] = useState<"random" | "grandmaster">("random");
    const [grandmaster, setGrandmaster] = useState("");
    const [fenString, setFenString] = useState("");
    const [whitePlayer, setWhitePlayer] = useState("");
    const [blackPlayer, setBlackPlayer] = useState("");

    // Interactive chess fields
    const [chessFen, setChessFen] = useState("");
    const [triggerTimestamp, setTriggerTimestamp] = useState("");
    const [playerColor, setPlayerColor] = useState<"w" | "b" | null>(null);
    const [challengePrompt, setChallengePrompt] = useState("");
    const [solutionMoves, setSolutionMoves] = useState("");
    const [challengeRating, setChallengeRating] = useState(3);
    const [showInteractive, setShowInteractive] = useState(false);

    const postReel = usePostReel();

    // Local file pickers
    const pickVideo = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Videos,
            allowsEditing: true,
            quality: 1,
        });
        if (!result.canceled) {
            setVideoUri(result.assets[0].uri);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
    };

    const pickThumbnail = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 1,
        });
        if (!result.canceled) {
            setThumbnailUri(result.assets[0].uri);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
    };

    const handleSubmit = async () => {
        if (!title.trim()) { Alert.alert("Missing", "Title is required."); return; }
        if (uploadMode === "url" && !videoUrl.trim()) { Alert.alert("Missing", "Video URL is required."); return; }
        if (uploadMode === "local" && !videoUri) { Alert.alert("Missing", "Select a video from your device."); return; }
        if ((whitePlayer && !blackPlayer) || (!whitePlayer && blackPlayer)) {
            Alert.alert("Missing", "Please enter both player names."); return;
        }

        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        try {
            let finalVideoUrl = videoUrl.trim();
            let finalThumbnailUrl = thumbnailUrl.trim();

            // Handle local file uploads
            if (uploadMode === "local" && (videoUri || thumbnailUri)) {
                const formData = new FormData();
                if (videoUri) {
                    formData.append("video", { uri: videoUri, name: "upload.mp4", type: "video/mp4" } as any);
                }
                if (thumbnailUri) {
                    const filename = thumbnailUri.split('/').pop() || "thumbnail.jpg";
                    const match = /\.(\w+)$/.exec(filename);
                    const type = match ? `image/${match[1]}` : "image";
                    formData.append("thumbnail", { uri: thumbnailUri, name: filename, type } as any);
                }
                const uploadRes = await axiosClient.post("/upload", formData, {
                    headers: { "Content-Type": "multipart/form-data" },
                });
                if (uploadRes.data.videoUrl) finalVideoUrl = uploadRes.data.videoUrl;
                if (uploadRes.data.thumbnailUrl) finalThumbnailUrl = uploadRes.data.thumbnailUrl;
            }

            const data: PostReelData = {
                videoUrl: finalVideoUrl,
                title: title.trim(),
                description: description.trim(),
                tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
                difficulty,
                folder,
                grandmaster: folder === "grandmaster" ? grandmaster : null,
                fenString: fenString.trim() || undefined,
                thumbnailUrl: finalThumbnailUrl || undefined,
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
                };
            }

            postReel.mutate(data, {
                onSuccess: () => {
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    Alert.alert("Success", "Reel uploaded!", [{ text: "OK", onPress: () => router.back() }]);
                },
                onError: (err: any) => {
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                    Alert.alert("Error", err?.message || "Upload failed");
                },
            });
        } catch (error: any) {
            Alert.alert("Error", error?.response?.data?.message || "Upload failed");
        }
    };

    const difficulties: Array<"beginner" | "intermediate" | "advanced"> = ["beginner", "intermediate", "advanced"];
    const diffColors: Record<string, string> = { beginner: "#10B981", intermediate: "#F59E0B", advanced: "#EF4444" };

    return (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
            <LinearGradient colors={["#0F0F23", "#0f172a"]} style={{ flex: 1 }}>
                <ScrollView style={styles.container} contentContainerStyle={styles.content}>
                    {/* Header */}
                    <View style={styles.header}>
                        <TouchableOpacity onPress={() => router.back()}>
                            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Upload Reel</Text>
                        <View style={{ width: 24 }} />
                    </View>

                    {/* Upload Mode Toggle */}
                    <View style={styles.glassCard}>
                        <Text style={styles.sectionTitle}>📤 Upload Mode</Text>
                        <View style={styles.modeToggle}>
                            <TouchableOpacity
                                style={[styles.modeBtn, uploadMode === "local" && styles.modeBtnActive]}
                                onPress={() => setUploadMode("local")}
                            >
                                <Ionicons name="phone-portrait-outline" size={16} color={uploadMode === "local" ? "#0F0F23" : "#A0A0B0"} />
                                <Text style={[styles.modeBtnText, uploadMode === "local" && styles.modeBtnTextActive]}>Device</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modeBtn, uploadMode === "url" && styles.modeBtnActive]}
                                onPress={() => setUploadMode("url")}
                            >
                                <Ionicons name="link-outline" size={16} color={uploadMode === "url" ? "#0F0F23" : "#A0A0B0"} />
                                <Text style={[styles.modeBtnText, uploadMode === "url" && styles.modeBtnTextActive]}>URL</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Video Source */}
                    <View style={styles.glassCard}>
                        <Text style={styles.sectionTitle}>🎬 Video</Text>
                        {uploadMode === "local" ? (
                            <>
                                <TouchableOpacity style={styles.pickBtn} onPress={pickVideo}>
                                    <Ionicons name="videocam-outline" size={24} color="#00D9FF" />
                                    <Text style={styles.pickBtnText}>{videoUri ? "Change Video" : "Select Video"}</Text>
                                </TouchableOpacity>
                                {videoUri && <Text style={styles.selectedFile} numberOfLines={1}>✓ {videoUri.split('/').pop()}</Text>}
                            </>
                        ) : (
                            <TextInput
                                style={styles.input}
                                value={videoUrl}
                                onChangeText={setVideoUrl}
                                placeholder="https://example.com/video.mp4"
                                placeholderTextColor="#6B7280"
                                autoCapitalize="none"
                            />
                        )}
                    </View>

                    {/* Thumbnail */}
                    <View style={styles.glassCard}>
                        <Text style={styles.sectionTitle}>🖼️ Thumbnail (optional)</Text>
                        {uploadMode === "local" ? (
                            <>
                                <TouchableOpacity style={styles.pickBtn} onPress={pickThumbnail}>
                                    <Ionicons name="image-outline" size={24} color="#00D9FF" />
                                    <Text style={styles.pickBtnText}>{thumbnailUri ? "Change Thumbnail" : "Select Thumbnail"}</Text>
                                </TouchableOpacity>
                                {thumbnailUri && (
                                    <Image source={{ uri: thumbnailUri }} style={styles.thumbPreview} resizeMode="cover" />
                                )}
                            </>
                        ) : (
                            <TextInput
                                style={styles.input}
                                value={thumbnailUrl}
                                onChangeText={setThumbnailUrl}
                                placeholder="https://example.com/thumbnail.jpg"
                                placeholderTextColor="#6B7280"
                                autoCapitalize="none"
                            />
                        )}
                    </View>

                    {/* Content Details */}
                    <View style={styles.glassCard}>
                        <Text style={styles.sectionTitle}>📝 Details</Text>
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
                        <Text style={styles.sectionTitle}>♟ Players</Text>
                        <View style={styles.row}>
                            <View style={[styles.field, { flex: 1 }]}>
                                <Text style={styles.label}>♔ White</Text>
                                <TextInput style={styles.input} value={whitePlayer} onChangeText={setWhitePlayer} placeholder="White player" placeholderTextColor="#6B7280" />
                            </View>
                            <View style={[styles.field, { flex: 1 }]}>
                                <Text style={styles.label}>♚ Black</Text>
                                <TextInput style={styles.input} value={blackPlayer} onChangeText={setBlackPlayer} placeholder="Black player" placeholderTextColor="#6B7280" />
                            </View>
                        </View>
                    </View>

                    {/* Difficulty */}
                    <View style={styles.glassCard}>
                        <Text style={styles.sectionTitle}>⚡ Difficulty</Text>
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
                        <Text style={styles.sectionTitle}>📁 Folder</Text>
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
                                <View style={styles.gmGrid}>
                                    {PREDEFINED_GRANDMASTERS.map((gm) => (
                                        <TouchableOpacity key={gm} style={[styles.gmChip, grandmaster === gm && styles.gmChipActive]} onPress={() => setGrandmaster(gm)}>
                                            <Text style={[styles.gmChipText, grandmaster === gm && styles.gmChipTextActive]}>{gm}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                                <TextInput style={[styles.input, { marginTop: 8 }]} value={grandmaster} onChangeText={setGrandmaster} placeholder="Or type custom name" placeholderTextColor="#6B7280" />
                            </View>
                        )}
                    </View>

                    {/* FEN String */}
                    <View style={styles.glassCard}>
                        <Text style={styles.sectionTitle}>♜ FEN String (optional)</Text>
                        <TextInput style={styles.input} value={fenString} onChangeText={setFenString} placeholder="rnbqkbnr/pppppppp/..." placeholderTextColor="#6B7280" autoCapitalize="none" />
                    </View>

                    {/* Interactive Toggle */}
                    <View style={styles.glassCard}>
                        <TouchableOpacity style={styles.toggleRow} onPress={() => setShowInteractive(!showInteractive)}>
                            <View style={styles.toggleLeft}>
                                <Ionicons name="game-controller-outline" size={18} color="#00D9FF" />
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
                                            <Text style={[styles.pillText, playerColor === "w" && styles.pillTextActive]}>♔ White</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity style={[styles.pill, playerColor === "b" && styles.pillActive]} onPress={() => setPlayerColor("b")}>
                                            <Text style={[styles.pillText, playerColor === "b" && styles.pillTextActive]}>♚ Black</Text>
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
                            </View>
                        )}
                    </View>

                    {/* Submit */}
                    <TouchableOpacity
                        style={[styles.submitBtn, postReel.isPending && styles.submitBtnDisabled]}
                        onPress={handleSubmit}
                        disabled={postReel.isPending}
                    >
                        {postReel.isPending ? (
                            <ActivityIndicator color="#0F0F23" />
                        ) : (
                            <>
                                <Ionicons name="cloud-upload-outline" size={20} color="#0F0F23" />
                                <Text style={styles.submitText}>Upload Reel</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </ScrollView>
            </LinearGradient>
        </KeyboardAvoidingView>
    );
}

export default function AdminUploadScreen() {
    return (
        <AdminAuthGuard>
            <UploadContent />
        </AdminAuthGuard>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    content: { padding: 20, paddingTop: 60, paddingBottom: 40 },
    header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 24 },
    headerTitle: { fontSize: 22, fontWeight: "800", color: "#FFFFFF" },
    glassCard: {
        backgroundColor: "rgba(255,255,255,0.04)",
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.08)",
    },
    sectionTitle: { color: "#FFFFFF", fontSize: 15, fontWeight: "700", marginBottom: 10 },
    modeToggle: { flexDirection: "row", gap: 10 },
    modeBtn: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.1)",
        backgroundColor: "rgba(255,255,255,0.04)",
    },
    modeBtnActive: { backgroundColor: "#00D9FF", borderColor: "#00D9FF" },
    modeBtnText: { color: "#A0A0B0", fontSize: 14, fontWeight: "600" },
    modeBtnTextActive: { color: "#0F0F23" },
    pickBtn: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        paddingVertical: 16,
        paddingHorizontal: 16,
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: "rgba(0, 217, 255, 0.3)",
        borderStyle: "dashed",
        backgroundColor: "rgba(0, 217, 255, 0.05)",
        justifyContent: "center",
    },
    pickBtnText: { color: "#00D9FF", fontSize: 15, fontWeight: "600" },
    selectedFile: { color: "#10B981", fontSize: 12, marginTop: 8, fontStyle: "italic" },
    thumbPreview: { width: "100%", height: 120, borderRadius: 10, marginTop: 10 },
    field: { marginBottom: 14 },
    label: { color: "#A0A0B0", fontSize: 13, fontWeight: "600", marginBottom: 6 },
    subLabel: { color: "#A0A0B0", fontSize: 12, marginBottom: 4 },
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
    pillActive: { borderColor: "#00D9FF", backgroundColor: "rgba(0, 217, 255, 0.12)" },
    pillText: { color: "#A0A0B0", fontSize: 13, fontWeight: "500", textTransform: "capitalize" },
    pillTextActive: { color: "#00D9FF" },
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
    gmChipText: { color: "#A0A0B0", fontSize: 12 },
    gmChipTextActive: { color: "#7B2FF7", fontWeight: "600" },
    toggleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    toggleLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
    starsRow: { flexDirection: "row", gap: 6, marginTop: 4 },
    submitBtn: {
        flexDirection: "row",
        height: 56,
        borderRadius: 16,
        backgroundColor: "#00D9FF",
        justifyContent: "center",
        alignItems: "center",
        gap: 8,
        marginTop: 8,
    },
    submitBtnDisabled: { opacity: 0.6 },
    submitText: { fontSize: 17, fontWeight: "700", color: "#0F0F23" },
});
