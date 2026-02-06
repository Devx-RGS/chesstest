import React, { useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from "expo-image-picker";
import { Upload, Link, Check, ArrowLeft, Film, Hash, FolderOpen, User } from "lucide-react-native";
import { colors } from "@/constants/themes";
import { useRouter, useLocalSearchParams } from "expo-router";
import { apiClient } from "@/services/api";
import { useGrandmasterFolders, GrandmasterFolder } from "@/services/adminApi";
import { GlassCard } from "@/components/ui/GlassCard";
import * as Haptics from "expo-haptics";

const DIFFICULTY_LEVELS = ["beginner", "intermediate", "advanced"];
const BADGE_COLORS = {
    beginner: colors.success,
    intermediate: colors.warning,
    advanced: colors.danger,
};

type UploadMode = "local" | "url";

export default function UploadReelScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const params = useLocalSearchParams<{ grandmaster?: string }>();

    // Fetch grandmaster folders from API
    const { data: gmFolders, isLoading: gmLoading } = useGrandmasterFolders();

    // Upload mode toggle
    const [uploadMode, setUploadMode] = useState<UploadMode>("local");

    // Form state
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [whitePlayer, setWhitePlayer] = useState("");
    const [blackPlayer, setBlackPlayer] = useState("");
    const [difficulty, setDifficulty] = useState("intermediate");
    const [tags, setTags] = useState("");

    // Folder state - pre-select if grandmaster param passed
    const [folder, setFolder] = useState<"random" | "grandmaster">(params.grandmaster ? "grandmaster" : "random");
    const [selectedGrandmaster, setSelectedGrandmaster] = useState<string | null>(params.grandmaster || null);

    // Video source
    const [videoUri, setVideoUri] = useState<string | null>(null);
    const [videoUrl, setVideoUrl] = useState("");
    const [thumbnailUrl, setThumbnailUrl] = useState("");

    const [isUploading, setIsUploading] = useState(false);

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

    const handleUpload = async () => {
        // Validate inputs
        if (!title) {
            Alert.alert("Error", "Please enter a title.");
            return;
        }

        if (uploadMode === "local" && !videoUri) {
            Alert.alert("Error", "Please select a video from your device.");
            return;
        }

        if (uploadMode === "url" && !videoUrl) {
            Alert.alert("Error", "Please enter a video URL.");
            return;
        }

        // Validate grandmaster selection if folder is grandmaster
        if (folder === "grandmaster" && !selectedGrandmaster) {
            Alert.alert("Error", "Please select a Grandmaster for this reel.");
            return;
        }

        setIsUploading(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        try {
            let finalVideoUrl = videoUrl;

            // If local upload, first upload the video file
            if (uploadMode === "local" && videoUri) {
                const formData = new FormData();
                formData.append("video", {
                    uri: videoUri,
                    name: "upload.mp4",
                    type: "video/mp4",
                } as any);

                const uploadRes = await apiClient.post("/upload", formData, {
                    headers: { "Content-Type": "multipart/form-data" },
                });

                if (!uploadRes.data.success) throw new Error("Video upload failed");
                finalVideoUrl = uploadRes.data.url;
            }

            // Prepare tags array
            const tagsArray = tags.split(",").map((t) => t.trim()).filter(Boolean);

            // Create reel data - match the schema structure
            const reelData = {
                adminId: "admin",
                videoData: {
                    video: {
                        url: finalVideoUrl,
                        thumbnail: thumbnailUrl || "",
                    },
                    content: {
                        title,
                        description,
                        tags: tagsArray.length > 0 ? tagsArray : ["chess"],
                        difficulty,
                    },
                    status: "published",
                    folder,
                    grandmaster: folder === "grandmaster" ? selectedGrandmaster : null,
                },
            };

            await apiClient.post("/admin/video", reelData);

            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert("Success", "Reel uploaded successfully!", [
                { text: "OK", onPress: () => router.back() },
            ]);
        } catch (error: any) {
            console.error("Upload error:", error?.response?.data || error);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            const errorMessage = error?.response?.data?.message || error?.response?.data?.error || "Failed to upload reel. Please try again.";
            Alert.alert("Error", errorMessage);
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <LinearGradient
            colors={[colors.background.primary, "#0f172a"]}
            style={styles.container}
        >
            <ScrollView
                contentContainerStyle={[
                    styles.content,
                    { paddingTop: insets.top + 10, paddingBottom: insets.bottom + 40 },
                ]}
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity
                        onPress={() => router.back()}
                        style={styles.backButton}
                    >
                        <ArrowLeft size={24} color={colors.text.primary} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Upload Reel</Text>
                    <View style={{ width: 40 }} />
                </View>

                {/* Upload Mode Toggle */}
                <GlassCard variant="dark" style={styles.modeToggle}>
                    <TouchableOpacity
                        style={[
                            styles.modeButton,
                            uploadMode === "local" && styles.modeButtonActive,
                        ]}
                        onPress={() => {
                            setUploadMode("local");
                            Haptics.selectionAsync();
                        }}
                    >
                        <Upload size={18} color={uploadMode === "local" ? "#fff" : colors.text.muted} />
                        <Text
                            style={[
                                styles.modeText,
                                uploadMode === "local" && styles.modeTextActive,
                            ]}
                        >
                            From Device
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[
                            styles.modeButton,
                            uploadMode === "url" && styles.modeButtonActive,
                        ]}
                        onPress={() => {
                            setUploadMode("url");
                            Haptics.selectionAsync();
                        }}
                    >
                        <Link size={18} color={uploadMode === "url" ? "#fff" : colors.text.muted} />
                        <Text
                            style={[
                                styles.modeText,
                                uploadMode === "url" && styles.modeTextActive,
                            ]}
                        >
                            From URL
                        </Text>
                    </TouchableOpacity>
                </GlassCard>

                {/* Video Source Section */}
                {uploadMode === "local" ? (
                    <TouchableOpacity style={styles.videoPicker} onPress={pickVideo}>
                        {videoUri ? (
                            <View style={styles.videoPlaceholder}>
                                <Check size={40} color={colors.success} />
                                <Text style={styles.videoSelectedText}>Video Selected</Text>
                                <Text style={styles.videoHint}>Tap to change</Text>
                            </View>
                        ) : (
                            <View style={styles.videoPlaceholder}>
                                <Upload size={40} color={colors.text.secondary} />
                                <Text style={styles.videoText}>Select Video</Text>
                                <Text style={styles.videoHint}>Tap to browse</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                ) : (
                    <GlassCard variant="dark" style={styles.urlInputCard}>
                        <Link size={20} color={colors.accent.cyan} />
                        <TextInput
                            style={styles.urlInput}
                            placeholder="Paste video URL here..."
                            placeholderTextColor={colors.text.muted}
                            value={videoUrl}
                            onChangeText={setVideoUrl}
                            autoCapitalize="none"
                            keyboardType="url"
                        />
                    </GlassCard>
                )}

                {/* Thumbnail URL Input */}
                <Text style={styles.label}>Thumbnail URL (optional)</Text>
                <GlassCard variant="dark" style={styles.urlInputCard}>
                    <Link size={20} color={colors.accent.purple} />
                    <TextInput
                        style={styles.urlInput}
                        placeholder="Paste thumbnail image URL here..."
                        placeholderTextColor={colors.text.muted}
                        value={thumbnailUrl}
                        onChangeText={setThumbnailUrl}
                        autoCapitalize="none"
                        keyboardType="url"
                    />
                </GlassCard>

                {/* Form Fields */}
                <Text style={styles.label}>Title *</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Ex: Amazing Sicilian Defense"
                    placeholderTextColor={colors.text.muted}
                    value={title}
                    onChangeText={setTitle}
                />

                <Text style={styles.label}>Description</Text>
                <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Describe the clip..."
                    placeholderTextColor={colors.text.muted}
                    value={description}
                    onChangeText={setDescription}
                    multiline
                />

                <View style={styles.row}>
                    <View style={styles.halfInput}>
                        <Text style={styles.label}>White Player</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Name"
                            placeholderTextColor={colors.text.muted}
                            value={whitePlayer}
                            onChangeText={setWhitePlayer}
                        />
                    </View>
                    <View style={styles.halfInput}>
                        <Text style={styles.label}>Black Player</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Name"
                            placeholderTextColor={colors.text.muted}
                            value={blackPlayer}
                            onChangeText={setBlackPlayer}
                        />
                    </View>
                </View>

                <Text style={styles.label}>Difficulty</Text>
                <View style={styles.difficultyContainer}>
                    {DIFFICULTY_LEVELS.map((level) => (
                        <TouchableOpacity
                            key={level}
                            style={[
                                styles.difficultyOption,
                                difficulty === level && {
                                    backgroundColor: BADGE_COLORS[level as keyof typeof BADGE_COLORS],
                                    borderColor: BADGE_COLORS[level as keyof typeof BADGE_COLORS],
                                },
                            ]}
                            onPress={() => {
                                setDifficulty(level);
                                Haptics.selectionAsync();
                            }}
                        >
                            <Text
                                style={[
                                    styles.difficultyText,
                                    difficulty === level && styles.selectedDifficultyText,
                                ]}
                            >
                                {level.toUpperCase()}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <Text style={styles.label}>Tags</Text>
                <View style={styles.tagsInputRow}>
                    <Hash size={16} color={colors.text.muted} />
                    <TextInput
                        style={styles.tagsInput}
                        placeholder="#opening, #tactics, #endgame"
                        placeholderTextColor={colors.text.muted}
                        value={tags}
                        onChangeText={setTags}
                    />
                </View>

                {/* Folder Selection */}
                <Text style={styles.label}>Save to Folder *</Text>
                <View style={styles.folderContainer}>
                    <TouchableOpacity
                        style={[
                            styles.folderOption,
                            folder === "random" && styles.folderOptionActive,
                        ]}
                        onPress={() => {
                            setFolder("random");
                            setSelectedGrandmaster(null);
                            Haptics.selectionAsync();
                        }}
                    >
                        <FolderOpen size={18} color={folder === "random" ? "#fff" : colors.text.muted} />
                        <Text style={[styles.folderText, folder === "random" && styles.folderTextActive]}>
                            Random Games
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[
                            styles.folderOption,
                            folder === "grandmaster" && styles.folderOptionActive,
                        ]}
                        onPress={() => {
                            setFolder("grandmaster");
                            Haptics.selectionAsync();
                        }}
                    >
                        <User size={18} color={folder === "grandmaster" ? "#fff" : colors.text.muted} />
                        <Text style={[styles.folderText, folder === "grandmaster" && styles.folderTextActive]}>
                            Grand Master
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Grandmaster Picker - only show when folder is grandmaster */}
                {folder === "grandmaster" && (
                    <View style={styles.grandmasterSection}>
                        <Text style={styles.label}>Select Grand Master *</Text>
                        {gmLoading ? (
                            <ActivityIndicator color={colors.accent.purple} style={{ padding: 20 }} />
                        ) : (gmFolders && gmFolders.length > 0) ? (
                            <View style={styles.grandmasterGrid}>
                                {gmFolders.map((gm: GrandmasterFolder) => (
                                    <TouchableOpacity
                                        key={gm._id}
                                        style={[
                                            styles.grandmasterChip,
                                            selectedGrandmaster === gm.name && styles.grandmasterChipActive,
                                        ]}
                                        onPress={() => {
                                            setSelectedGrandmaster(gm.name);
                                            Haptics.selectionAsync();
                                        }}
                                    >
                                        <Text
                                            style={[
                                                styles.grandmasterChipText,
                                                selectedGrandmaster === gm.name && styles.grandmasterChipTextActive,
                                            ]}
                                            numberOfLines={1}
                                        >
                                            {gm.name}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        ) : (
                            <Text style={{ color: colors.text.muted, textAlign: "center", padding: 20 }}>
                                No grandmaster folders yet. Create one from the dashboard.
                            </Text>
                        )}
                    </View>
                )}

                {/* Upload Button */}
                <TouchableOpacity
                    style={[styles.uploadButton, isUploading && styles.disabledButton]}
                    onPress={handleUpload}
                    disabled={isUploading}
                >
                    {isUploading ? (
                        <ActivityIndicator color={colors.text.primary} />
                    ) : (
                        <>
                            <Film size={20} color={colors.text.primary} />
                            <Text style={styles.uploadButtonText}>Upload Reel</Text>
                        </>
                    )}
                </TouchableOpacity>
            </ScrollView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        padding: 20,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 24,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: colors.glass.light,
        alignItems: "center",
        justifyContent: "center",
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: "700",
        color: colors.text.primary,
    },
    modeToggle: {
        flexDirection: "row",
        padding: 4,
        marginBottom: 20,
    },
    modeButton: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        padding: 12,
        borderRadius: 10,
    },
    modeButtonActive: {
        backgroundColor: colors.accent.purple,
    },
    modeText: {
        color: colors.text.muted,
        fontWeight: "600",
        fontSize: 14,
    },
    modeTextActive: {
        color: "#fff",
    },
    videoPicker: {
        height: 150,
        backgroundColor: "rgba(255,255,255,0.05)",
        borderRadius: 16,
        borderWidth: 2,
        borderColor: "rgba(255,255,255,0.1)",
        borderStyle: "dashed",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 24,
    },
    videoPlaceholder: {
        alignItems: "center",
        gap: 4,
    },
    videoText: {
        color: colors.text.secondary,
        fontSize: 16,
        fontWeight: "600",
        marginTop: 8,
    },
    videoSelectedText: {
        color: colors.success,
        fontSize: 16,
        fontWeight: "600",
        marginTop: 8,
    },
    videoHint: {
        color: colors.text.muted,
        fontSize: 12,
    },
    urlInputCard: {
        flexDirection: "row",
        alignItems: "center",
        padding: 16,
        marginBottom: 24,
        gap: 12,
    },
    urlInput: {
        flex: 1,
        color: colors.text.primary,
        fontSize: 16,
    },
    label: {
        color: colors.text.secondary,
        marginBottom: 8,
        fontSize: 14,
        fontWeight: "500",
    },
    input: {
        backgroundColor: colors.background.secondary,
        borderRadius: 12,
        padding: 16,
        color: colors.text.primary,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.1)",
        fontSize: 16,
    },
    textArea: {
        height: 100,
        textAlignVertical: "top",
    },
    row: {
        flexDirection: "row",
        gap: 12,
    },
    halfInput: {
        flex: 1,
    },
    difficultyContainer: {
        flexDirection: "row",
        gap: 10,
        marginBottom: 20,
    },
    difficultyOption: {
        flex: 1,
        padding: 12,
        borderRadius: 8,
        backgroundColor: colors.background.secondary,
        alignItems: "center",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.1)",
    },
    difficultyText: {
        color: colors.text.muted,
        fontSize: 11,
        fontWeight: "700",
    },
    selectedDifficultyText: {
        color: "#fff",
    },
    tagsInputRow: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: colors.background.secondary,
        borderRadius: 12,
        padding: 16,
        marginBottom: 30,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.1)",
        gap: 10,
    },
    tagsInput: {
        flex: 1,
        color: colors.text.primary,
        fontSize: 16,
    },
    uploadButton: {
        backgroundColor: colors.success,
        padding: 18,
        borderRadius: 12,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
    },
    disabledButton: {
        opacity: 0.7,
    },
    uploadButtonText: {
        color: colors.text.primary,
        fontSize: 16,
        fontWeight: "bold",
    },
    folderContainer: {
        flexDirection: "row",
        gap: 12,
        marginBottom: 20,
    },
    folderOption: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        padding: 14,
        borderRadius: 12,
        backgroundColor: colors.background.secondary,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.1)",
    },
    folderOptionActive: {
        backgroundColor: colors.accent.purple,
        borderColor: colors.accent.purple,
    },
    folderText: {
        color: colors.text.muted,
        fontSize: 14,
        fontWeight: "600",
    },
    folderTextActive: {
        color: "#fff",
    },
    grandmasterSection: {
        marginBottom: 20,
    },
    grandmasterGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 10,
    },
    grandmasterChip: {
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 20,
        backgroundColor: colors.background.secondary,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.1)",
    },
    grandmasterChipActive: {
        backgroundColor: colors.accent.cyan,
        borderColor: colors.accent.cyan,
    },
    grandmasterChipText: {
        color: colors.text.muted,
        fontSize: 13,
        fontWeight: "600",
    },
    grandmasterChipTextActive: {
        color: colors.background.primary,
    },
});
