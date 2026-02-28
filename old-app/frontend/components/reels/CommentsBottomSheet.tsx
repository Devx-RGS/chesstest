import React, { useState, useCallback, forwardRef, useMemo, useRef, useImperativeHandle } from "react";
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    Modal,
    Animated,
    Dimensions,
    Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { X, Send, MessageCircle, Trash2 } from "lucide-react-native";
import { colors } from "@/constants/themes";
import { useReelComments, usePostComment, useDeleteComment } from "@/services/reelApi";
import * as Haptics from "expo-haptics";
import { useAuthStore } from "@/stores/authStore";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

interface CommentsBottomSheetProps {
    reelId: string;
    onClose: () => void;
    visible: boolean;
}

interface Comment {
    _id: string;
    reelId: string;
    userId: {
        _id: string;
        username: string;
        profile?: {
            avatarUrl?: string;
        };
    } | null;
    text: string;
    createdAt: string;
}

export function CommentsBottomSheet({ reelId, onClose, visible }: CommentsBottomSheetProps) {
    const [commentText, setCommentText] = useState("");
    const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

    const { data: comments, isLoading, refetch } = useReelComments(reelId);
    const postComment = usePostComment();
    const deleteComment = useDeleteComment();
    const { user } = useAuthStore();

    // Animate in/out
    React.useEffect(() => {
        if (visible) {
            Animated.spring(slideAnim, {
                toValue: 0,
                friction: 8,
                tension: 45,
                useNativeDriver: true,
            }).start();
        } else {
            Animated.timing(slideAnim, {
                toValue: SCREEN_HEIGHT,
                duration: 200,
                useNativeDriver: true,
            }).start();
        }
    }, [visible, slideAnim]);

    const handleSubmitComment = useCallback(async () => {
        if (!commentText.trim()) return;

        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

        try {
            await postComment.mutateAsync({
                reelId,
                text: commentText.trim(),
            });
            setCommentText("");
        } catch (error) {
            console.error("Failed to post comment:", error);
        }
    }, [commentText, reelId, postComment]);

    const formatTimeAgo = useCallback((dateString: string) => {
        const now = new Date();
        const date = new Date(dateString);
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 1) return "Just now";
        if (diffMins < 60) return `${diffMins}m`;
        if (diffHours < 24) return `${diffHours}h`;
        if (diffDays < 7) return `${diffDays}d`;
        return date.toLocaleDateString();
    }, []);

    const handleDeleteComment = useCallback((commentId: string) => {
        Alert.alert(
            "Delete Comment",
            "Are you sure you want to delete this comment?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                        try {
                            await deleteComment.mutateAsync({ reelId, commentId });
                        } catch (error) {
                            console.error("Failed to delete comment:", error);
                            Alert.alert("Error", "Failed to delete comment");
                        }
                    },
                },
            ]
        );
    }, [reelId, deleteComment]);

    const renderComment = useCallback(
        ({ item }: { item: Comment }) => {
            const isOwnComment = user?.id === item.userId?._id;

            return (
                <View style={styles.commentItem}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>
                            {item.userId?.username?.[0]?.toUpperCase() || "?"}
                        </Text>
                    </View>
                    <View style={styles.commentContent}>
                        <View style={styles.commentHeader}>
                            <Text style={styles.username}>
                                {item.userId?.username || "Anonymous"}
                            </Text>
                            <Text style={styles.timeAgo}>{formatTimeAgo(item.createdAt)}</Text>
                            {isOwnComment && (
                                <TouchableOpacity
                                    onPress={() => handleDeleteComment(item._id)}
                                    style={styles.deleteButton}
                                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                >
                                    <Trash2 size={14} color={colors.text.muted} />
                                </TouchableOpacity>
                            )}
                        </View>
                        <Text style={styles.commentText}>{item.text}</Text>
                    </View>
                </View>
            );
        },
        [formatTimeAgo, user, handleDeleteComment]
    );

    if (!visible) return null;

    return (
        <Modal
            visible={visible}
            transparent
            animationType="none"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <TouchableOpacity style={styles.backdrop} onPress={onClose} />

                <Animated.View
                    style={[
                        styles.container,
                        { transform: [{ translateY: slideAnim }] }
                    ]}
                >
                    <SafeAreaView style={styles.safeArea} edges={["bottom"]}>
                        {/* Header */}
                        <View style={styles.header}>
                            <View style={styles.handle} />
                            <View style={styles.headerContent}>
                                <View style={styles.headerLeft}>
                                    <MessageCircle size={20} color={colors.text.primary} />
                                    <Text style={styles.headerTitle}>
                                        Comments ({comments?.length || 0})
                                    </Text>
                                </View>
                                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                                    <X size={24} color={colors.text.primary} />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Comments List */}
                        {isLoading ? (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator size="large" color={colors.accent.cyan} />
                            </View>
                        ) : (
                            <FlatList
                                data={comments || []}
                                renderItem={renderComment}
                                keyExtractor={(item) => item._id}
                                style={styles.list}
                                contentContainerStyle={styles.listContent}
                                showsVerticalScrollIndicator={false}
                                ListEmptyComponent={
                                    <View style={styles.emptyContainer}>
                                        <MessageCircle size={48} color={colors.text.muted} />
                                        <Text style={styles.emptyText}>No comments yet</Text>
                                        <Text style={styles.emptySubtext}>Be the first to comment!</Text>
                                    </View>
                                }
                            />
                        )}

                        {/* Input */}
                        <KeyboardAvoidingView
                            behavior={Platform.OS === "ios" ? "padding" : "height"}
                        >
                            <View style={styles.inputContainer}>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Add a comment..."
                                    placeholderTextColor={colors.text.muted}
                                    value={commentText}
                                    onChangeText={setCommentText}
                                    multiline
                                    maxLength={500}
                                />
                                <TouchableOpacity
                                    onPress={handleSubmitComment}
                                    disabled={!commentText.trim() || postComment.isPending}
                                    style={[
                                        styles.sendButton,
                                        (!commentText.trim() || postComment.isPending) && styles.sendButtonDisabled,
                                    ]}
                                >
                                    {postComment.isPending ? (
                                        <ActivityIndicator size="small" color={colors.accent.cyan} />
                                    ) : (
                                        <Send size={20} color={commentText.trim() ? colors.accent.cyan : colors.text.muted} />
                                    )}
                                </TouchableOpacity>
                            </View>
                        </KeyboardAvoidingView>
                    </SafeAreaView>
                </Animated.View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: "transparent",
    },
    backdrop: {
        flex: 0.35,
        backgroundColor: "rgba(0,0,0,0.5)",
    },
    container: {
        flex: 0.65,
        backgroundColor: colors.background.secondary,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
    },
    safeArea: {
        flex: 1,
    },
    header: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: colors.glass.border,
    },
    handle: {
        width: 40,
        height: 4,
        backgroundColor: colors.text.muted,
        borderRadius: 2,
        alignSelf: "center",
        marginBottom: 12,
    },
    headerContent: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    headerLeft: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    headerTitle: {
        color: colors.text.primary,
        fontSize: 18,
        fontWeight: "600",
    },
    closeButton: {
        padding: 4,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    list: {
        flex: 1,
    },
    listContent: {
        padding: 16,
    },
    commentItem: {
        flexDirection: "row",
        marginBottom: 16,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.accent.purple,
        justifyContent: "center",
        alignItems: "center",
        marginRight: 12,
    },
    avatarText: {
        color: colors.text.primary,
        fontSize: 16,
        fontWeight: "600",
    },
    commentContent: {
        flex: 1,
    },
    commentHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 4,
    },
    username: {
        color: colors.text.primary,
        fontSize: 14,
        fontWeight: "600",
        marginRight: 8,
    },
    timeAgo: {
        color: colors.text.muted,
        fontSize: 12,
    },
    commentText: {
        color: colors.text.secondary,
        fontSize: 14,
        lineHeight: 20,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingVertical: 60,
        gap: 8,
    },
    emptyText: {
        color: colors.text.primary,
        fontSize: 16,
        fontWeight: "600",
        marginTop: 12,
    },
    emptySubtext: {
        color: colors.text.muted,
        fontSize: 14,
    },
    inputContainer: {
        flexDirection: "row",
        alignItems: "center",
        padding: 12,
        borderTopWidth: 1,
        borderTopColor: colors.glass.border,
        backgroundColor: colors.background.primary,
    },
    input: {
        flex: 1,
        backgroundColor: colors.glass.light,
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 10,
        color: colors.text.primary,
        fontSize: 14,
        maxHeight: 100,
    },
    sendButton: {
        marginLeft: 12,
        padding: 8,
    },
    sendButtonDisabled: {
        opacity: 0.5,
    },
    deleteButton: {
        marginLeft: "auto",
        padding: 4,
    },
});
