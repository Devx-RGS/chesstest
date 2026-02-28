import React, { useEffect, useRef } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    TouchableWithoutFeedback,
    StyleSheet,
    Dimensions,
    Animated,
    Switch,
    Platform,
    ScrollView,
    Pressable,
} from "react-native";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useThemeStore } from "@/stores/themeStore";
import { useAuthStore } from "@/stores/authStore";
import { authService } from "@/services/authService";
import { colors } from "@/constants/themes";
import * as Haptics from "expo-haptics";
import {
    X,
    Volume2,
    VolumeX,
    Vibrate,
    LogOut,
    Moon,
    Bell,
    Shield,
    HelpCircle,
    ChevronRight,
} from "lucide-react-native";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const SIDEBAR_WIDTH = SCREEN_WIDTH * 0.75;

interface SettingsSidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

export function SettingsSidebar({ isOpen, onClose }: SettingsSidebarProps) {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { soundEnabled, toggleSound, hapticEnabled, toggleHaptic } = useThemeStore();

    // Animation values
    const slideAnim = useRef(new Animated.Value(SIDEBAR_WIDTH)).current;
    const overlayAnim = useRef(new Animated.Value(0)).current;

    // Track visibility separately to allow exit animation to complete
    const [isVisible, setIsVisible] = React.useState(false);

    useEffect(() => {
        if (isOpen) {
            // Show component first, then animate in
            setIsVisible(true);
            // Slide in from right
            Animated.parallel([
                Animated.spring(slideAnim, {
                    toValue: 0,
                    useNativeDriver: true,
                    tension: 65,
                    friction: 11,
                }),
                Animated.timing(overlayAnim, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            // Slide out to right, then hide component
            Animated.parallel([
                Animated.spring(slideAnim, {
                    toValue: SIDEBAR_WIDTH,
                    useNativeDriver: true,
                    tension: 65,
                    friction: 11,
                }),
                Animated.timing(overlayAnim, {
                    toValue: 0,
                    duration: 200,
                    useNativeDriver: true,
                }),
            ]).start(() => {
                // Hide component after animation completes
                setIsVisible(false);
            });
        }
    }, [isOpen, slideAnim, overlayAnim]);

    const handleClose = () => {
        if (hapticEnabled) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        onClose();
    };

    const handleToggleSound = () => {
        if (hapticEnabled) {
            Haptics.selectionAsync();
        }
        toggleSound();
    };

    const handleToggleHaptic = () => {
        // Trigger haptic before toggling off
        if (hapticEnabled) {
            Haptics.selectionAsync();
        }
        toggleHaptic();
    };

    const handleLogout = async () => {
        if (hapticEnabled) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        }

        // Execute logout immediately - don't wait for sidebar to close
        useAuthStore.getState().logout();

        // Close sidebar and navigate after a brief delay
        onClose();
        setTimeout(() => {
            router.replace("/(auth)/login");
        }, 100);
    };

    // Only hide when animation is complete AND isOpen is false
    if (!isVisible && !isOpen) return null;

    return (
        <View style={styles.container} pointerEvents="box-none">
            {/* Overlay with blur effect */}
            <TouchableWithoutFeedback onPress={handleClose}>
                <Animated.View style={[styles.overlay, { opacity: overlayAnim }]}>
                    <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
                </Animated.View>
            </TouchableWithoutFeedback>

            {/* Sidebar */}
            <Animated.View
                style={[
                    styles.sidebar,
                    {
                        transform: [{ translateX: slideAnim }],
                        paddingTop: insets.top,
                        paddingBottom: insets.bottom + 60 // Extra space for tab bar
                    },
                ]}
            >
                {/* Neon left edge accent */}
                <LinearGradient
                    colors={[colors.accent.cyan, colors.accent.purple]}
                    style={styles.leftAccent}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                />

                {/* Sidebar content */}
                <View style={styles.sidebarContent}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.headerTitle}>Settings</Text>
                        <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                            <X size={22} color={colors.text.secondary} />
                        </TouchableOpacity>
                    </View>

                    {/* Scrollable content */}
                    <ScrollView
                        style={styles.scrollContent}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.scrollContentContainer}
                        bounces={false}
                    >
                        {/* Settings Options */}
                        <View style={styles.settingsSection}>
                            <Text style={styles.sectionLabel}>PREFERENCES</Text>

                            {/* Sound Toggle */}
                            <View style={styles.settingRow}>
                                <View style={styles.settingLeft}>
                                    <View style={[styles.iconContainer, { backgroundColor: colors.accent.cyan + "20" }]}>
                                        {soundEnabled ? (
                                            <Volume2 size={18} color={colors.accent.cyan} />
                                        ) : (
                                            <VolumeX size={18} color={colors.text.muted} />
                                        )}
                                    </View>
                                    <View>
                                        <Text style={styles.settingTitle}>Sound Effects</Text>
                                        <Text style={styles.settingDescription}>UI and game sounds</Text>
                                    </View>
                                </View>
                                <Switch
                                    value={soundEnabled}
                                    onValueChange={handleToggleSound}
                                    trackColor={{ false: colors.glass.medium, true: colors.accent.cyan + "60" }}
                                    thumbColor={soundEnabled ? colors.accent.cyan : colors.text.muted}
                                />
                            </View>

                            {/* Haptic Toggle */}
                            <View style={styles.settingRow}>
                                <View style={styles.settingLeft}>
                                    <View style={[styles.iconContainer, { backgroundColor: colors.accent.purple + "20" }]}>
                                        <Vibrate size={18} color={hapticEnabled ? colors.accent.purple : colors.text.muted} />
                                    </View>
                                    <View>
                                        <Text style={styles.settingTitle}>Haptic Feedback</Text>
                                        <Text style={styles.settingDescription}>Vibration on interactions</Text>
                                    </View>
                                </View>
                                <Switch
                                    value={hapticEnabled}
                                    onValueChange={handleToggleHaptic}
                                    trackColor={{ false: colors.glass.medium, true: colors.accent.purple + "60" }}
                                    thumbColor={hapticEnabled ? colors.accent.purple : colors.text.muted}
                                />
                            </View>
                        </View>

                        {/* Other Options */}
                        <View style={styles.settingsSection}>
                            <Text style={styles.sectionLabel}>MORE</Text>

                            <TouchableOpacity style={styles.menuRow}>
                                <View style={styles.settingLeft}>
                                    <View style={[styles.iconContainer, { backgroundColor: colors.warning + "20" }]}>
                                        <Bell size={18} color={colors.warning} />
                                    </View>
                                    <Text style={styles.settingTitle}>Notifications</Text>
                                </View>
                                <ChevronRight size={18} color={colors.text.muted} />
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.menuRow}>
                                <View style={styles.settingLeft}>
                                    <View style={[styles.iconContainer, { backgroundColor: colors.success + "20" }]}>
                                        <Shield size={18} color={colors.success} />
                                    </View>
                                    <Text style={styles.settingTitle}>Privacy & Security</Text>
                                </View>
                                <ChevronRight size={18} color={colors.text.muted} />
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.menuRow}>
                                <View style={styles.settingLeft}>
                                    <View style={[styles.iconContainer, { backgroundColor: colors.text.muted + "30" }]}>
                                        <HelpCircle size={18} color={colors.text.secondary} />
                                    </View>
                                    <Text style={styles.settingTitle}>Help & Support</Text>
                                </View>
                                <ChevronRight size={18} color={colors.text.muted} />
                            </TouchableOpacity>
                        </View>
                    </ScrollView>

                    {/* Fixed Bottom Section - Always visible */}
                    <View style={styles.bottomSection}>
                        {/* Logout Button */}
                        <Pressable
                            style={({ pressed }) => [
                                styles.logoutButton,
                                pressed && { opacity: 0.7 }
                            ]}
                            onPress={handleLogout}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                            <View style={styles.logoutGlow} />
                            <LogOut size={18} color={colors.danger} />
                            <Text style={styles.logoutText}>Log Out</Text>
                        </Pressable>

                        {/* App Version */}
                        <Text style={styles.versionText}>Chess App v1.0.0</Text>
                    </View>
                </View>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 1000,
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
    },
    sidebar: {
        position: "absolute",
        right: 0,
        top: 0,
        bottom: 0,
        width: SIDEBAR_WIDTH,
        backgroundColor: colors.background.primary,
        flexDirection: "row",
        // Shadow for depth
        shadowColor: "#000",
        shadowOffset: { width: -4, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 20,
    },
    leftAccent: {
        width: 3,
        height: "100%",
    },
    sidebarContent: {
        flex: 1,
        flexDirection: "column",
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 20,
        paddingTop: 10,
        paddingHorizontal: 20,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: "800",
        color: colors.text.primary,
    },
    closeButton: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: colors.glass.light,
        alignItems: "center",
        justifyContent: "center",
    },
    settingsSection: {
        marginBottom: 20,
    },
    sectionLabel: {
        fontSize: 11,
        fontWeight: "700",
        color: colors.text.muted,
        letterSpacing: 1,
        marginBottom: 12,
    },
    settingRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: colors.glass.light,
    },
    menuRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: colors.glass.light,
    },
    scrollContent: {
        flex: 1,
    },
    scrollContentContainer: {
        paddingHorizontal: 20,
    },
    bottomSection: {
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 24,
        marginBottom: 20,
        borderTopWidth: 1,
        borderTopColor: colors.glass.light,
        backgroundColor: colors.background.primary,
    },
    settingLeft: {
        flexDirection: "row",
        alignItems: "center",
        gap: 14,
    },
    iconContainer: {
        width: 36,
        height: 36,
        borderRadius: 10,
        alignItems: "center",
        justifyContent: "center",
    },
    settingTitle: {
        fontSize: 15,
        fontWeight: "600",
        color: colors.text.primary,
    },
    settingDescription: {
        fontSize: 12,
        color: colors.text.muted,
        marginTop: 2,
    },
    logoutButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        paddingVertical: 16,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: colors.danger + "50",
        backgroundColor: colors.danger + "10",
        position: "relative",
        overflow: "hidden",
    },
    logoutGlow: {
        position: "absolute",
        top: -20,
        left: "50%",
        marginLeft: -50,
        width: 100,
        height: 40,
        backgroundColor: colors.danger,
        opacity: 0.15,
        borderRadius: 50,
        // Simulated glow effect
        shadowColor: colors.danger,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 20,
    },
    logoutText: {
        fontSize: 15,
        fontWeight: "700",
        color: colors.danger,
    },
    versionText: {
        fontSize: 11,
        color: colors.text.muted,
        textAlign: "center",
        marginTop: 16,
    },
});
