import React, { useState, useRef, useEffect } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    FlatList,
    Modal,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Animated,
    Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useReelComments, usePostComment, useDeleteComment, Comment } from "../../lib/services/reelApi";
import { useAuthStore } from "../../lib/stores/authStore";

interface CommentsBottomSheetProps {
    visible: boolean;
    reelId: string;
    onClose: () => void;
}

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

export function CommentsBottomSheet({ visible, reelId, onClose }: CommentsBottomSheetProps) {
    const [text, setText] = useState("");
    const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
    const inputRef = useRef<TextInput>(null);

    const { data: comments = [], isLoading } = useReelComments(reelId);
    const postComment = usePostComment();
    const deleteComment = useDeleteComment();
    const user = useAuthStore((s) => s.user);

    useEffect(() => {
        if (visible) {
            Animated.spring(slideAnim, {
                toValue: 0,
                useNativeDriver: true,
                tension: 80,
                friction: 12,
            }).start();
        } else {
            Animated.timing(slideAnim, {
                toValue: SCREEN_HEIGHT,
                duration: 250,
                useNativeDriver: true,
            }).start();
        }
    }, [visible]);

    const handlePost = () => {
        if (!text.trim()) return;
        postComment.mutate({ reelId, text: text.trim(), userId: user?.id });
        setText("");
    };

    const handleDelete = (commentId: string) => {
        deleteComment.mutate({ reelId, commentId });
    };

    const timeAgo = (dateStr: string) => {
        const diff = Date.now() - new Date(dateStr).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return "now";
        if (mins < 60) return `${mins}m`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs}h`;
        const days = Math.floor(hrs / 24);
        return `${days}d`;
    };

    const renderComment = ({ item }: { item: Comment }) => (
        <View style={styles.commentRow}>
            <View style={styles.avatar}>
                <Ionicons name="person-circle-outline" size={36} color="#A0A0B0" />
            </View>
            <View style={styles.commentBody}>
                <View style={styles.commentHeader}>
                    <Text style={styles.username}>
                        {item.userId?.username || "Anonymous"}
                    </Text>
                    <Text style={styles.timeAgo}>{timeAgo(item.createdAt)}</Text>
                </View>
                <Text style={styles.commentText}>{item.text}</Text>
            </View>
            {user && (item.userId?._id === user.id || item._id.startsWith("temp-")) && (
                <TouchableOpacity onPress={() => handleDelete(item._id)} style={styles.deleteBtn}>
                    <Ionicons name="trash-outline" size={16} color="#EF4444" />
                </TouchableOpacity>
            )}
        </View>
    );

    return (
        <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
            <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
                <Animated.View
                    style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}
                >
                    <TouchableOpacity activeOpacity={1}>
                        {/* Header */}
                        <View style={styles.handle} />
                        <View style={styles.header}>
                            <Text style={styles.headerTitle}>
                                Comments ({comments.length})
                            </Text>
                            <TouchableOpacity onPress={onClose}>
                                <Ionicons name="close" size={24} color="#FFFFFF" />
                            </TouchableOpacity>
                        </View>

                        {/* Comments List */}
                        <FlatList
                            data={comments}
                            renderItem={renderComment}
                            keyExtractor={(item) => item._id}
                            style={styles.list}
                            contentContainerStyle={styles.listContent}
                            ListEmptyComponent={
                                <View style={styles.emptyState}>
                                    <Ionicons name="chatbubble-ellipses-outline" size={48} color="#6B7280" />
                                    <Text style={styles.emptyText}>
                                        {isLoading ? "Loading comments..." : "No comments yet. Be the first!"}
                                    </Text>
                                </View>
                            }
                        />

                        {/* Input */}
                        <KeyboardAvoidingView
                            behavior={Platform.OS === "ios" ? "padding" : undefined}
                        >
                            <View style={styles.inputRow}>
                                <TextInput
                                    ref={inputRef}
                                    style={styles.input}
                                    placeholder="Add a comment..."
                                    placeholderTextColor="#6B7280"
                                    value={text}
                                    onChangeText={setText}
                                    onSubmitEditing={handlePost}
                                    returnKeyType="send"
                                />
                                <TouchableOpacity
                                    onPress={handlePost}
                                    disabled={!text.trim()}
                                    style={[styles.sendBtn, !text.trim() && styles.sendBtnDisabled]}
                                >
                                    <Ionicons name="send" size={20} color={text.trim() ? "#00D9FF" : "#6B7280"} />
                                </TouchableOpacity>
                            </View>
                        </KeyboardAvoidingView>
                    </TouchableOpacity>
                </Animated.View>
            </TouchableOpacity>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.6)",
        justifyContent: "flex-end",
    },
    sheet: {
        backgroundColor: "#1A1A2E",
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: SCREEN_HEIGHT * 0.65,
        paddingBottom: Platform.OS === "ios" ? 34 : 12,
    },
    handle: {
        width: 40,
        height: 4,
        borderRadius: 2,
        backgroundColor: "rgba(255,255,255,0.2)",
        alignSelf: "center",
        marginTop: 10,
        marginBottom: 6,
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: "rgba(255,255,255,0.08)",
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: "700",
        color: "#FFFFFF",
    },
    list: {
        minHeight: 200,
        maxHeight: SCREEN_HEIGHT * 0.42,
    },
    listContent: {
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    commentRow: {
        flexDirection: "row",
        alignItems: "flex-start",
        paddingVertical: 10,
        gap: 10,
    },
    avatar: {
        width: 36,
        height: 36,
        justifyContent: "center",
        alignItems: "center",
    },
    commentBody: {
        flex: 1,
    },
    commentHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    username: {
        fontSize: 13,
        fontWeight: "600",
        color: "#E0E0E8",
    },
    timeAgo: {
        fontSize: 11,
        color: "#6B7280",
    },
    commentText: {
        fontSize: 14,
        color: "#D1D5DB",
        marginTop: 3,
        lineHeight: 20,
    },
    deleteBtn: {
        padding: 6,
    },
    emptyState: {
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 40,
        gap: 12,
    },
    emptyText: {
        fontSize: 14,
        color: "#6B7280",
    },
    inputRow: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderTopWidth: 1,
        borderTopColor: "rgba(255,255,255,0.08)",
        gap: 10,
    },
    input: {
        flex: 1,
        height: 40,
        backgroundColor: "rgba(255,255,255,0.06)",
        borderRadius: 20,
        paddingHorizontal: 16,
        color: "#FFFFFF",
        fontSize: 14,
    },
    sendBtn: {
        padding: 8,
    },
    sendBtnDisabled: {
        opacity: 0.5,
    },
});
