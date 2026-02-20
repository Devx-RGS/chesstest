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
    Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from "expo-image-picker";
import { Upload, Link, Check, ArrowLeft, Film, Hash, Gamepad2, Zap, ChevronDown, ChevronUp, Star } from "lucide-react-native";
import { colors } from "@/constants/themes";
import { useRouter, useLocalSearchParams } from "expo-router";
import { apiClient } from "@/services/api";
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
    const params = useLocalSearchParams<{ whitePlayer?: string; blackPlayer?: string; grandmaster?: string }>();
    const targetGrandmaster = params.grandmaster || "";

    // Upload mode toggle
    const [uploadMode, setUploadMode] = useState<UploadMode>("local");

    // Form state
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [whitePlayer, setWhitePlayer] = useState(params.whitePlayer || "");
    const [blackPlayer, setBlackPlayer] = useState(params.blackPlayer || "");
    const [eventName, setEventName] = useState("");
    const [year, setYear] = useState("");
    const [difficulty, setDifficulty] = useState("intermediate");
    const [tags, setTags] = useState("");

    // Interactive chess challenge state
    const [interactiveEnabled, setInteractiveEnabled] = useState(false);
    const [chessFen, setChessFen] = useState("");
    const [triggerTimestamp, setTriggerTimestamp] = useState("");
    const [playerColor, setPlayerColor] = useState<'w' | 'b' | null>(null);
    const [challengePrompt, setChallengePrompt] = useState("");
    const [solutionMoves, setSolutionMoves] = useState("");
    const [challengeRating, setChallengeRating] = useState(3);

    // Video & Thumbnail source
    const [videoUri, setVideoUri] = useState<string | null>(null);
    const [videoUrl, setVideoUrl] = useState("");
    const [thumbnailUri, setThumbnailUri] = useState<string | null>(null);
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

        // Validate player names if provided
        if ((whitePlayer && !blackPlayer) || (!whitePlayer && blackPlayer)) {
            Alert.alert("Error", "Please enter both White and Black player names for game categorization.");
            return;
        }

        setIsUploading(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        try {
            let finalVideoUrl = videoUrl;
            let finalThumbnailUrl = thumbnailUrl;

            // Handle file uploads (video and/or thumbnail)
            if (uploadMode === "local" && (videoUri || thumbnailUri)) {
                const formData = new FormData();

                if (videoUri) {
                    formData.append("video", {
                        uri: videoUri,
                        name: "upload.mp4",
                        type: "video/mp4",
                    } as any);
                }

                if (thumbnailUri) {
                    const filename = thumbnailUri.split('/').pop() || "thumbnail.jpg";
                    const match = /\.(\w+)$/.exec(filename);
                    const type = match ? `image/${match[1]}` : `image`;

                    formData.append("thumbnail", {
                        uri: thumbnailUri,
                        name: filename,
                        type: type,
                    } as any);
                }

                const uploadRes = await apiClient.post("/upload", formData, {
                    headers: { "Content-Type": "multipart/form-data" },
                });

                if (!uploadRes.data.success) throw new Error("Upload failed");
                if (uploadRes.data.videoUrl) finalVideoUrl = uploadRes.data.videoUrl;
                if (uploadRes.data.thumbnailUrl) finalThumbnailUrl = uploadRes.data.thumbnailUrl;
            }

            // Prepare tags array
            const tagsArray = tags.split(",").map((t) => t.trim()).filter(Boolean);

            // Build interactive object
            const interactiveData = interactiveEnabled && chessFen.trim() ? {
                chessFen: chessFen.trim(),
                triggerTimestamp: triggerTimestamp ? parseFloat(triggerTimestamp) : null,
                playerColor: playerColor,
                challengePrompt: challengePrompt.trim() || null,
                solutionMoves: solutionMoves ? solutionMoves.split(",").map(m => m.trim()).filter(Boolean) : [],
                difficultyRating: challengeRating,
            } : undefined;

            // Create reel data
            const reelData = {
                adminId: "admin",
                videoData: {
                    video: {
                        url: finalVideoUrl,
                        thumbnail: finalThumbnailUrl || "",
                    },
                    content: {
                        title,
                        description,
                        tags: tagsArray.length > 0 ? tagsArray : ["chess"],
                        difficulty,
                        whitePlayer: whitePlayer || null,
                        blackPlayer: blackPlayer || null,
                    },
                    interactive: interactiveData,
                    status: "published",
                    whitePlayer: whitePlayer || null,
                    blackPlayer: blackPlayer || null,
                    event: eventName || null,
                    year: year ? parseInt(year) : null,
                    folder: targetGrandmaster ? "grandmaster" : "random",
                    grandmaster: targetGrandmaster || null,
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

                {/* Grandmaster Folder Badge */}
                {targetGrandmaster ? (
                    <View style={{
                        backgroundColor: "rgba(168, 85, 247, 0.15)",
                        borderWidth: 1,
                        borderColor: "rgba(168, 85, 247, 0.4)",
                        borderRadius: 12,
                        padding: 12,
                        marginBottom: 20,
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 10,
                    }}>
                        <Film size={18} color={colors.accent.purple} />
                        <Text style={{ color: colors.accent.purple, fontWeight: "600", fontSize: 14 }}>
                            Uploading to: {targetGrandmaster}
                        </Text>
                    </View>
                ) : null}

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

                {/* Thumbnail Section */}
                <Text style={styles.label}>Thumbnail (Optional)</Text>

                {uploadMode === "local" && (
                    <TouchableOpacity style={[styles.videoPicker, { height: 120, marginBottom: 16 }]} onPress={pickThumbnail}>
                        {thumbnailUri ? (
                            <View style={{ width: "100%", height: "100%", borderRadius: 12, overflow: "hidden" }}>
                                <Image
                                    source={{ uri: thumbnailUri }}
                                    style={{ width: "100%", height: "100%", resizeMode: "cover" }}
                                />
                                <View style={{ position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: "rgba(0,0,0,0.6)", padding: 4, alignItems: "center" }}>
                                    <Text style={{ color: "#fff", fontSize: 10 }}>Tap to change</Text>
                                </View>
                            </View>
                        ) : (
                            <View style={styles.videoPlaceholder}>
                                <Upload size={32} color={colors.text.secondary} />
                                <Text style={styles.videoText}>Select Thumbnail</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                )}

                <GlassCard variant="dark" style={styles.urlInputCard}>
                    <Link size={20} color={colors.accent.purple} />
                    <TextInput
                        style={styles.urlInput}
                        placeholder={thumbnailUri ? "Thumb uploaded from device" : "Or paste thumbnail image URL..."}
                        placeholderTextColor={colors.text.muted}
                        value={thumbnailUrl}
                        onChangeText={setThumbnailUrl}
                        autoCapitalize="none"
                        keyboardType="url"
                        editable={!thumbnailUri} // Disable URL input if local file selected
                    />
                    {thumbnailUri && (
                        <TouchableOpacity onPress={() => setThumbnailUri(null)}>
                            <Text style={{ color: colors.danger, fontSize: 12 }}>Clear File</Text>
                        </TouchableOpacity>
                    )}
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

                {/* Game Info Section */}
                <View style={styles.gameInfoSection}>
                    <View style={styles.gameInfoHeader}>
                        <Gamepad2 size={20} color={colors.accent.cyan} />
                        <Text style={styles.gameInfoTitle}>Game Categorization (Optional)</Text>
                    </View>
                    <Text style={styles.gameInfoSubtitle}>
                        Add player names to categorize this reel under a specific game matchup
                    </Text>

                    <View style={styles.playersRow}>
                        <View style={styles.playerInputContainer}>
                            <Text style={styles.playerLabel}>White Player</Text>
                            <TextInput
                                style={styles.playerInput}
                                placeholder="e.g. Magnus Carlsen"
                                placeholderTextColor={colors.text.muted}
                                value={whitePlayer}
                                onChangeText={setWhitePlayer}
                            />
                        </View>
                        <Text style={styles.vsText}>vs</Text>
                        <View style={styles.playerInputContainer}>
                            <Text style={styles.playerLabel}>Black Player</Text>
                            <TextInput
                                style={styles.playerInput}
                                placeholder="e.g. Hikaru Nakamura"
                                placeholderTextColor={colors.text.muted}
                                value={blackPlayer}
                                onChangeText={setBlackPlayer}
                            />
                        </View>
                    </View>

                    <View style={styles.eventRow}>
                        <View style={{ flex: 2 }}>
                            <Text style={styles.playerLabel}>Event (Optional)</Text>
                            <TextInput
                                style={styles.playerInput}
                                placeholder="e.g. World Championship"
                                placeholderTextColor={colors.text.muted}
                                value={eventName}
                                onChangeText={setEventName}
                            />
                        </View>
                        <View style={{ flex: 1, marginLeft: 12 }}>
                            <Text style={styles.playerLabel}>Year</Text>
                            <TextInput
                                style={styles.playerInput}
                                placeholder="2024"
                                placeholderTextColor={colors.text.muted}
                                value={year}
                                onChangeText={setYear}
                                keyboardType="numeric"
                            />
                        </View>
                    </View>
                </View>

                {/* Interactive Chess Challenge Section */}
                <View style={styles.gameInfoSection}>
                    <TouchableOpacity
                        style={styles.gameInfoHeader}
                        onPress={() => {
                            setInteractiveEnabled(!interactiveEnabled);
                            Haptics.selectionAsync();
                        }}
                        activeOpacity={0.7}
                    >
                        <Zap size={20} color={interactiveEnabled ? colors.warning : colors.text.muted} />
                        <Text style={[styles.gameInfoTitle, interactiveEnabled && { color: colors.warning }]}>
                            Interactive Chess Challenge
                        </Text>
                        <View style={{ flex: 1 }} />
                        {interactiveEnabled ? (
                            <ChevronUp size={20} color={colors.warning} />
                        ) : (
                            <ChevronDown size={20} color={colors.text.muted} />
                        )}
                    </TouchableOpacity>
                    <Text style={styles.gameInfoSubtitle}>
                        Enable to pause the video and show an interactive chess board
                    </Text>

                    {interactiveEnabled && (
                        <View>
                            {/* FEN String */}
                            <Text style={styles.playerLabel}>FEN Position *</Text>
                            <TextInput
                                style={styles.playerInput}
                                placeholder="e.g. r1bqkbnr/pppppppp/2n5/..."
                                placeholderTextColor={colors.text.muted}
                                value={chessFen}
                                onChangeText={setChessFen}
                                autoCapitalize="none"
                            />

                            {/* Trigger Timestamp */}
                            <View style={{ marginTop: 12 }}>
                                <Text style={styles.playerLabel}>Trigger Timestamp (seconds)</Text>
                                <TextInput
                                    style={styles.playerInput}
                                    placeholder="e.g. 10"
                                    placeholderTextColor={colors.text.muted}
                                    value={triggerTimestamp}
                                    onChangeText={setTriggerTimestamp}
                                    keyboardType="numeric"
                                />
                            </View>

                            {/* Player Color Assignment */}
                            <View style={{ marginTop: 12 }}>
                                <Text style={styles.playerLabel}>Player Color Assignment</Text>
                                <View style={styles.difficultyContainer}>
                                    <TouchableOpacity
                                        style={[
                                            styles.difficultyOption,
                                            playerColor === null && { backgroundColor: colors.accent.purple, borderColor: colors.accent.purple },
                                        ]}
                                        onPress={() => { setPlayerColor(null); Haptics.selectionAsync(); }}
                                    >
                                        <Text style={[
                                            styles.difficultyText,
                                            playerColor === null && { color: '#fff' },
                                        ]}>🎯 CHOOSE</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[
                                            styles.difficultyOption,
                                            playerColor === 'w' && { backgroundColor: '#f0f0f0', borderColor: '#f0f0f0' },
                                        ]}
                                        onPress={() => { setPlayerColor('w'); Haptics.selectionAsync(); }}
                                    >
                                        <Text style={[
                                            styles.difficultyText,
                                            playerColor === 'w' && { color: '#000' },
                                        ]}>♔ WHITE</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[
                                            styles.difficultyOption,
                                            playerColor === 'b' && { backgroundColor: '#333', borderColor: '#555' },
                                        ]}
                                        onPress={() => { setPlayerColor('b'); Haptics.selectionAsync(); }}
                                    >
                                        <Text style={[
                                            styles.difficultyText,
                                            playerColor === 'b' && { color: '#fff' },
                                        ]}>♚ BLACK</Text>
                                    </TouchableOpacity>
                                </View>
                                <Text style={{ color: colors.text.muted, fontSize: 11, marginTop: -12, marginBottom: 8 }}>
                                    {playerColor === null
                                        ? 'User will choose their own side'
                                        : `User will be forced to play as ${playerColor === 'w' ? 'White' : 'Black'}`}
                                </Text>
                            </View>

                            {/* Challenge Prompt (when color is forced) */}
                            {playerColor !== null && (
                                <View style={{ marginTop: 4 }}>
                                    <Text style={styles.playerLabel}>Challenge Prompt (optional)</Text>
                                    <TextInput
                                        style={styles.playerInput}
                                        placeholder={playerColor === 'w' ? 'e.g. Find the checkmate!' : 'e.g. Defend this endgame!'}
                                        placeholderTextColor={colors.text.muted}
                                        value={challengePrompt}
                                        onChangeText={setChallengePrompt}
                                    />
                                </View>
                            )}

                            {/* Challenge Difficulty Rating */}
                            <View style={{ marginTop: 4 }}>
                                <Text style={styles.playerLabel}>Challenge Difficulty (1–5)</Text>
                                <View style={styles.difficultyContainer}>
                                    {[1, 2, 3, 4, 5].map((n) => (
                                        <TouchableOpacity
                                            key={n}
                                            style={[
                                                styles.difficultyOption,
                                                challengeRating >= n && { backgroundColor: colors.warning, borderColor: colors.warning },
                                            ]}
                                            onPress={() => { setChallengeRating(n); Haptics.selectionAsync(); }}
                                        >
                                            <Star
                                                size={16}
                                                color={challengeRating >= n ? '#fff' : colors.text.muted}
                                                fill={challengeRating >= n ? '#fff' : 'none'}
                                            />
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>

                            {/* Solution Moves (optional) */}
                            <View style={{ marginTop: 12 }}>
                                <Text style={styles.playerLabel}>Solution Moves (optional, comma-separated UCI)</Text>
                                <TextInput
                                    style={styles.playerInput}
                                    placeholder="e.g. e7e5, d2d4, g8f6"
                                    placeholderTextColor={colors.text.muted}
                                    value={solutionMoves}
                                    onChangeText={setSolutionMoves}
                                    autoCapitalize="none"
                                />
                            </View>
                        </View>
                    )}
                </View>

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
    // Game Info Section styles
    gameInfoSection: {
        backgroundColor: colors.background.secondary,
        borderRadius: 16,
        padding: 16,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.1)",
    },
    gameInfoHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        marginBottom: 8,
    },
    gameInfoTitle: {
        color: colors.text.primary,
        fontSize: 16,
        fontWeight: "600",
    },
    gameInfoSubtitle: {
        color: colors.text.muted,
        fontSize: 13,
        marginBottom: 16,
    },
    playersRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 12,
    },
    playerInputContainer: {
        flex: 1,
    },
    playerLabel: {
        color: colors.text.secondary,
        fontSize: 12,
        fontWeight: "600",
        marginBottom: 6,
    },
    playerInput: {
        backgroundColor: colors.background.primary,
        borderRadius: 8,
        padding: 12,
        color: colors.text.primary,
        fontSize: 14,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.1)",
    },
    vsText: {
        color: colors.accent.cyan,
        fontSize: 14,
        fontWeight: "700",
        marginHorizontal: 8,
        marginTop: 20,
    },
    eventRow: {
        flexDirection: "row",
        gap: 12,
    },
});
