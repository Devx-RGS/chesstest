import React, { useState, useRef, useEffect } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    FlatList,
    Modal,
    StyleSheet,
    Dimensions,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useReelComments, usePostComment, Comment } from "../../_lib/services/reelApi";
import { useAuthStore } from "../../_lib/stores/authStore";
import { FONTS } from "../../_lib/styles/base";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

interface CommentSheetProps {
    reelId: string | null;
    visible: boolean;
    onClose: () => void;
}

export function CommentSheet({ reelId, visible, onClose }: CommentSheetProps) {
    const [text, setText] = useState("");
    const inputRef = useRef<TextInput>(null);
    const userId = useAuthStore((s) => s.user?.id);
    const username = useAuthStore((s) => s.user?.username);

    const { data: comments = [], isLoading } = useReelComments(reelId || "");
    const postComment = usePostComment();

    useEffect(() => {
        if (visible) {
            setTimeout(() => inputRef.current?.focus(), 400);
        } else {
            setText("");
        }
    }, [visible]);

    const handleSubmit = () => {
        if (!text.trim() || !reelId) return;
        postComment.mutate({ reelId, text: text.trim(), userId });
        setText("");
    };

    const formatTimeAgo = (dateStr: string) => {
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
                <Text style={styles.avatarText}>
                    {(item.userId?.username || "?")[0].toUpperCase()}
                </Text>
            </View>
            <View style={styles.commentContent}>
                <View style={styles.commentHeader}>
                    <Text style={styles.commentUsername}>
                        {item.userId?.username || "Anonymous"}
                    </Text>
                    <Text style={styles.commentTime}>{formatTimeAgo(item.createdAt)}</Text>
                </View>
                <Text style={styles.commentText}>{item.text}</Text>
            </View>
        </View>
    );

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />

            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={styles.sheetContainer}
            >
                <View style={styles.sheet}>
                    {/* Handle */}
                    <View style={styles.handleBar} />

                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.headerTitle}>
                            Comments {comments.length > 0 ? `(${comments.length})` : ""}
                        </Text>
                        <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                            <Ionicons name="close" size={22} color="#A0A0B0" />
                        </TouchableOpacity>
                    </View>

                    {/* Comments List */}
                    {isLoading ? (
                        <ActivityIndicator color="#F5A623" style={{ marginVertical: 40 }} />
                    ) : comments.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <Ionicons name="chatbubble-outline" size={36} color="#706D82" />
                            <Text style={styles.emptyText}>No comments yet</Text>
                            <Text style={styles.emptySubtext}>Be the first to comment!</Text>
                        </View>
                    ) : (
                        <FlatList
                            data={comments}
                            keyExtractor={(item) => item._id}
                            renderItem={renderComment}
                            contentContainerStyle={styles.commentsList}
                            showsVerticalScrollIndicator={false}
                        />
                    )}

                    {/* Input */}
                    <View style={styles.inputContainer}>
                        <View style={styles.inputAvatar}>
                            <Text style={styles.inputAvatarText}>
                                {(username || "?")[0].toUpperCase()}
                            </Text>
                        </View>
                        <TextInput
                            ref={inputRef}
                            style={styles.input}
                            placeholder="Add a comment..."
                            placeholderTextColor="#706D82"
                            value={text}
                            onChangeText={setText}
                            multiline
                            maxLength={500}
                        />
                        <TouchableOpacity
                            onPress={handleSubmit}
                            disabled={!text.trim() || postComment.isPending}
                            style={[styles.sendBtn, (!text.trim()) && styles.sendBtnDisabled]}
                        >
                            {postComment.isPending ? (
                                <ActivityIndicator size="small" color="#F5A623" />
                            ) : (
                                <Ionicons name="send" size={20} color={text.trim() ? "#F5A623" : "#706D82"} />
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.5)",
    },
    sheetContainer: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        maxHeight: SCREEN_HEIGHT * 0.65,
    },
    sheet: {
        backgroundColor: "#10473A",
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingBottom: Platform.OS === "ios" ? 34 : 16,
        maxHeight: SCREEN_HEIGHT * 0.65,
    },
    handleBar: {
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
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: "rgba(255,255,255,0.06)",
    },
    headerTitle: {
        fontFamily: FONTS.bold,
        color: "#FFFFFF",
        fontSize: 16,
    },
    commentsList: {
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 8,
    },
    commentRow: {
        flexDirection: "row",
        marginBottom: 16,
        gap: 10,
    },
    avatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: "rgba(245,166,35,0.15)",
        justifyContent: "center",
        alignItems: "center",
    },
    avatarText: {
        fontFamily: FONTS.bold,
        color: "#F5A623",
        fontSize: 14,
    },
    commentContent: {
        flex: 1,
    },
    commentHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginBottom: 2,
    },
    commentUsername: {
        fontFamily: FONTS.semibold,
        color: "#FFFFFF",
        fontSize: 13,
    },
    commentTime: {
        fontFamily: FONTS.regular,
        color: "#706D82",
        fontSize: 11,
    },
    commentText: {
        fontFamily: FONTS.regular,
        color: "#E0E0E8",
        fontSize: 14,
        lineHeight: 20,
    },
    emptyContainer: {
        alignItems: "center",
        paddingVertical: 40,
        gap: 8,
    },
    emptyText: {
        fontFamily: FONTS.semibold,
        color: "#FFFFFF",
        fontSize: 16,
    },
    emptySubtext: {
        fontFamily: FONTS.regular,
        color: "#706D82",
        fontSize: 13,
    },
    inputContainer: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderTopWidth: 1,
        borderTopColor: "rgba(255,255,255,0.06)",
        gap: 10,
    },
    inputAvatar: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: "rgba(245,166,35,0.15)",
        justifyContent: "center",
        alignItems: "center",
    },
    inputAvatarText: {
        fontFamily: FONTS.bold,
        color: "#F5A623",
        fontSize: 12,
    },
    input: {
        flex: 1,
        backgroundColor: "rgba(255,255,255,0.06)",
        borderRadius: 20,
        paddingHorizontal: 14,
        paddingVertical: 8,
        color: "#FFFFFF",
        fontSize: 14,
        fontFamily: FONTS.regular,
        maxHeight: 80,
    },
    sendBtn: {
        padding: 6,
    },
    sendBtnDisabled: {
        opacity: 0.5,
    },
});
