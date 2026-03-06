/**
 * DailyTasks — Shows daily coin-earning task progress on the profile page.
 * Refetches automatically every time the screen is focused.
 */
import React, { useCallback, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, FONTS, GLASS } from "../../lib/styles/base";
import { axiosClient } from "../../lib/services/axiosClient";

interface Task {
    id: string;
    title: string;
    description: string;
    completed: boolean;
    reward: number;
    progress: number;
    total: number;
}

interface DailyTasksData {
    tasks: Task[];
    totalEarned: number;
}

export default function DailyTasks() {
    const [data, setData] = useState<DailyTasksData | null>(null);
    const [loading, setLoading] = useState(true);

    // Refetch every time this screen gains focus
    useFocusEffect(
        useCallback(() => {
            let cancelled = false;

            const fetchTasks = async () => {
                try {
                    const res = await axiosClient.get<DailyTasksData>("/coins/daily-tasks");
                    if (!cancelled) setData(res.data);
                } catch (err) {
                    console.warn("[DailyTasks] Failed to fetch:", err);
                } finally {
                    if (!cancelled) setLoading(false);
                }
            };

            fetchTasks();
            return () => { cancelled = true; };
        }, [])
    );

    if (loading) {
        return (
            <View style={styles.card}>
                <View style={styles.headerRow}>
                    <Text style={styles.sectionTitle}>🎯  Daily Tasks</Text>
                </View>
                <ActivityIndicator color={COLORS.accent} style={{ paddingVertical: 20 }} />
            </View>
        );
    }

    if (!data) return null;

    return (
        <View style={styles.card}>
            {/* Header */}
            <View style={styles.headerRow}>
                <Text style={styles.sectionTitle}>🎯  Daily Tasks</Text>
                <View style={styles.earnedBadge}>
                    <Text style={styles.earnedText}>+{data.totalEarned} 🪙</Text>
                </View>
            </View>

            {/* Task rows */}
            {data.tasks.map((task) => (
                <View key={task.id} style={styles.taskRow}>
                    {/* Status icon */}
                    <View
                        style={[
                            styles.statusIcon,
                            task.completed ? styles.statusDone : styles.statusPending,
                        ]}
                    >
                        <Ionicons
                            name={task.completed ? "checkmark" : "time-outline"}
                            size={16}
                            color={task.completed ? "#080B14" : COLORS.mutedText}
                        />
                    </View>

                    {/* Task info */}
                    <View style={styles.taskInfo}>
                        <Text
                            style={[
                                styles.taskTitle,
                                task.completed && styles.taskTitleDone,
                            ]}
                        >
                            {task.title}
                        </Text>

                        {/* Progress bar for multi-step tasks */}
                        {task.total > 1 ? (
                            <View style={styles.progressRow}>
                                <View style={styles.progressBarBg}>
                                    <View
                                        style={[
                                            styles.progressBarFill,
                                            { width: `${(task.progress / task.total) * 100}%` },
                                        ]}
                                    />
                                </View>
                                <Text style={styles.progressText}>
                                    {task.progress}/{task.total}
                                </Text>
                            </View>
                        ) : (
                            <Text style={styles.taskDesc}>
                                {task.completed ? "Completed" : task.description}
                            </Text>
                        )}
                    </View>

                    {/* Reward badge */}
                    <View style={[styles.rewardBadge, task.completed && styles.rewardBadgeDone]}>
                        <Text style={[styles.rewardText, task.completed && styles.rewardTextDone]}>
                            +{task.reward} 🪙
                        </Text>
                    </View>
                </View>
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        marginHorizontal: 20,
        marginBottom: 24,
        backgroundColor: COLORS.glassBg,
        borderRadius: GLASS.borderRadius,
        borderWidth: 1,
        borderColor: COLORS.glassBorder,
        padding: 16,
    },
    headerRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 14,
    },
    sectionTitle: {
        fontFamily: FONTS.bold,
        fontSize: 16,
        color: COLORS.white,
        letterSpacing: 0.3,
    },
    earnedBadge: {
        backgroundColor: "rgba(245, 166, 35, 0.12)",
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "rgba(245, 166, 35, 0.2)",
    },
    earnedText: {
        fontFamily: FONTS.semibold,
        fontSize: 13,
        color: COLORS.accent,
    },
    taskRow: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 10,
        borderTopWidth: 1,
        borderTopColor: COLORS.glassBorder,
        gap: 12,
    },
    statusIcon: {
        width: 30,
        height: 30,
        borderRadius: 15,
        alignItems: "center",
        justifyContent: "center",
    },
    statusDone: {
        backgroundColor: COLORS.green,
    },
    statusPending: {
        backgroundColor: "rgba(255, 255, 255, 0.06)",
        borderWidth: 1,
        borderColor: COLORS.glassBorder,
    },
    taskInfo: {
        flex: 1,
    },
    taskTitle: {
        fontFamily: FONTS.semibold,
        fontSize: 14,
        color: COLORS.primaryText,
    },
    taskTitleDone: {
        color: COLORS.secondaryText,
    },
    taskDesc: {
        fontFamily: FONTS.regular,
        fontSize: 12,
        color: COLORS.mutedText,
        marginTop: 2,
    },
    progressRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginTop: 4,
    },
    progressBarBg: {
        flex: 1,
        height: 6,
        borderRadius: 3,
        backgroundColor: "rgba(255, 255, 255, 0.06)",
        overflow: "hidden",
    },
    progressBarFill: {
        height: "100%",
        borderRadius: 3,
        backgroundColor: COLORS.accent,
    },
    progressText: {
        fontFamily: FONTS.medium,
        fontSize: 11,
        color: COLORS.mutedText,
        minWidth: 24,
    },
    rewardBadge: {
        backgroundColor: "rgba(255, 255, 255, 0.04)",
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: COLORS.glassBorder,
    },
    rewardBadgeDone: {
        backgroundColor: "rgba(74, 222, 128, 0.1)",
        borderColor: "rgba(74, 222, 128, 0.2)",
    },
    rewardText: {
        fontFamily: FONTS.medium,
        fontSize: 12,
        color: COLORS.mutedText,
    },
    rewardTextDone: {
        color: COLORS.green,
    },
});
