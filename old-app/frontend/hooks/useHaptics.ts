import * as Haptics from "expo-haptics";
import { useThemeStore } from "@/stores/themeStore";

export type HapticType =
    | "light"
    | "medium"
    | "heavy"
    | "success"
    | "warning"
    | "error"
    | "selection";

/**
 * Custom hook for haptic feedback
 */
export function useHaptics() {
    const hapticEnabled = useThemeStore((state) => state.hapticEnabled);

    const triggerHaptic = async (type: HapticType = "light") => {
        if (!hapticEnabled) return;

        try {
            switch (type) {
                case "light":
                    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    break;
                case "medium":
                    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    break;
                case "heavy":
                    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                    break;
                case "success":
                    await Haptics.notificationAsync(
                        Haptics.NotificationFeedbackType.Success
                    );
                    break;
                case "warning":
                    await Haptics.notificationAsync(
                        Haptics.NotificationFeedbackType.Warning
                    );
                    break;
                case "error":
                    await Haptics.notificationAsync(
                        Haptics.NotificationFeedbackType.Error
                    );
                    break;
                case "selection":
                    await Haptics.selectionAsync();
                    break;
            }
        } catch (error) {
            // Haptics not available on this device
            console.log("Haptics not available:", error);
        }
    };

    // Specific haptic patterns for chess
    const onMove = () => triggerHaptic("light");
    const onCapture = () => triggerHaptic("medium");
    const onCheck = () => triggerHaptic("warning");
    const onCheckmate = () => triggerHaptic("success");
    const onIllegalMove = () => triggerHaptic("error");
    const onSelect = () => triggerHaptic("selection");
    const onButtonPress = () => triggerHaptic("light");

    return {
        triggerHaptic,
        onMove,
        onCapture,
        onCheck,
        onCheckmate,
        onIllegalMove,
        onSelect,
        onButtonPress,
        hapticEnabled,
    };
}
