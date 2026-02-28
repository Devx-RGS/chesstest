import React from "react";
import { View, TouchableOpacity, Text, StyleSheet } from "react-native";
import { Heart, MessageCircle, Share2, Bookmark } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { colors } from "@/constants/themes";
import { formatCount } from "@/services/reelApi";

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
            {/* Like Button */}
            <TouchableOpacity style={styles.actionButton} onPress={handleLike}>
                <Heart
                    size={28}
                    color={isLiked ? "#FF2D55" : colors.text.primary}
                    fill={isLiked ? "#FF2D55" : "transparent"}
                />
                <Text style={styles.actionText}>{formatCount(likes)}</Text>
            </TouchableOpacity>

            {/* Comment Button */}
            <TouchableOpacity style={styles.actionButton} onPress={onComment}>
                <MessageCircle size={28} color={colors.text.primary} />
                <Text style={styles.actionText}>{formatCount(comments)}</Text>
            </TouchableOpacity>

            {/* Share Button */}
            <TouchableOpacity style={styles.actionButton} onPress={onShare}>
                <Share2 size={28} color={colors.text.primary} />
                <Text style={styles.actionText}>Share</Text>
            </TouchableOpacity>

            {/* Save Button - No counter, just "Save" text */}
            <TouchableOpacity style={styles.actionButton} onPress={handleSave}>
                <Bookmark
                    size={28}
                    color={isSaved ? colors.accent.cyan : colors.text.primary}
                    fill={isSaved ? colors.accent.cyan : "transparent"}
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
        color: colors.text.primary,
        fontSize: 12,
        fontWeight: "500",
    },
});

