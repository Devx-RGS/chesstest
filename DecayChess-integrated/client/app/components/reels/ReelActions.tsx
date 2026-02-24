import React from "react";
import { View, TouchableOpacity, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { formatCount } from "../../lib/services/reelApi";

interface ReelActionsProps {
    likes: number;
    comments: number;
    isLiked: boolean;
    isSaved: boolean;
    onLike: () => void;
    onComment: () => void;
    onShare: () => void;
    onSave: () => void;
}

export function ReelActions({
    likes,
    comments,
    isLiked,
    isSaved,
    onLike,
    onComment,
    onShare,
    onSave,
}: ReelActionsProps) {
    const handleLike = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onLike();
    };

    const handleSave = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onSave();
    };

    return (
        <View style={styles.container}>
            {/* Like */}
            <TouchableOpacity style={styles.actionButton} onPress={handleLike}>
                <Ionicons
                    name={isLiked ? "heart" : "heart-outline"}
                    size={30}
                    color={isLiked ? "#FF2D55" : "#FFFFFF"}
                />
                <Text style={styles.actionText}>{formatCount(likes)}</Text>
            </TouchableOpacity>

            {/* Comment */}
            <TouchableOpacity style={styles.actionButton} onPress={onComment}>
                <Ionicons name="chatbubble-outline" size={28} color="#FFFFFF" />
                <Text style={styles.actionText}>{formatCount(comments)}</Text>
            </TouchableOpacity>

            {/* Share */}
            <TouchableOpacity style={styles.actionButton} onPress={onShare}>
                <Ionicons name="share-social-outline" size={28} color="#FFFFFF" />
                <Text style={styles.actionText}>Share</Text>
            </TouchableOpacity>

            {/* Save */}
            <TouchableOpacity style={styles.actionButton} onPress={handleSave}>
                <Ionicons
                    name={isSaved ? "bookmark" : "bookmark-outline"}
                    size={28}
                    color={isSaved ? "#00D9FF" : "#FFFFFF"}
                />
                <Text style={styles.actionText}>Save</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: "absolute",
        right: 12,
        bottom: 120,
        alignItems: "center",
        gap: 20,
    },
    actionButton: {
        alignItems: "center",
        gap: 4,
    },
    actionText: {
        color: "#FFFFFF",
        fontSize: 12,
        fontWeight: "500",
    },
});
