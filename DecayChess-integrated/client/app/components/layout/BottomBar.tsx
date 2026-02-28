// Floating Glass Bottom Navigation Bar — Premium
import React, { useRef } from 'react';
import { Animated, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, GLASS, SHADOWS } from '../../lib/styles/base';

interface BottomBarProps {
  onProfile: () => void;
  onLogout: () => void;
  onHome: () => void;
  onOffline?: () => void;
  onSelectReels?: () => void;
  activeTab?: 'home' | 'menu' | 'offline' | 'reels';
}

const tabs = [
  { key: 'home', label: 'Home', icon: 'grid-outline', iconActive: 'grid' },
  { key: 'offline', label: 'Offline', icon: 'game-controller-outline', iconActive: 'game-controller' },
  { key: 'reels', label: 'Reels', icon: 'play-circle-outline', iconActive: 'play-circle' },
  { key: 'menu', label: 'Menu', icon: 'menu-outline', iconActive: 'menu' },
] as const;

function TabItem({
  isActive,
  onPress,
  label,
  iconName,
  iconNameActive,
  disabled,
}: {
  isActive: boolean;
  onPress?: () => void;
  label: string;
  iconName: string;
  iconNameActive: string;
  disabled?: boolean;
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, { toValue: 0.85, useNativeDriver: true, speed: 50, bounciness: 6 }).start();
  };
  const handlePressOut = () => {
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 50, bounciness: 6 }).start();
  };

  return (
    <TouchableOpacity
      style={styles.tab}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <Animated.View style={[styles.tabInner, { transform: [{ scale: scaleAnim }] }]}>
        {isActive && <View style={styles.activeGlow} />}
        <Ionicons
          name={(isActive ? iconNameActive : iconName) as any}
          size={22}
          color={isActive ? COLORS.accent : COLORS.mutedText}
        />
        <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
          {label}
        </Text>
        {isActive && <View style={styles.activeDot} />}
      </Animated.View>
    </TouchableOpacity>
  );
}

export default function BottomBar({
  onProfile,
  onLogout: _onLogout,
  onHome,
  onOffline,
  onSelectReels,
  activeTab = 'home',
}: BottomBarProps) {
  const getHandler = (key: string) => {
    switch (key) {
      case 'home': return onHome;
      case 'offline': return onOffline;
      case 'reels': return onSelectReels;
      case 'menu': return onProfile;
      default: return onHome;
    }
  };

  const BarContent = () => (
    <View style={styles.innerContainer}>
      {tabs.map((tab) => (
        <TabItem
          key={tab.key}
          isActive={activeTab === tab.key}
          onPress={getHandler(tab.key)}
          label={tab.label}
          iconName={tab.icon}
          iconNameActive={tab.iconActive}
          disabled={tab.key === 'offline' ? !onOffline : tab.key === 'reels' ? !onSelectReels : false}
        />
      ))}
    </View>
  );

  if (Platform.OS === 'ios') {
    return (
      <View style={styles.floatingWrapper}>
        <BlurView intensity={60} tint="dark" style={styles.bar}>
          <BarContent />
        </BlurView>
      </View>
    );
  }

  return (
    <View style={styles.floatingWrapper}>
      <View style={[styles.bar, styles.androidBar]}>
        <BarContent />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  floatingWrapper: {
    paddingHorizontal: 12,
    paddingBottom: Platform.OS === 'ios' ? 28 : 10,
  },
  bar: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    ...SHADOWS.glass,
  },
  androidBar: {
    backgroundColor: 'rgba(17, 22, 41, 0.95)',
  },
  innerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  tab: {
    alignItems: 'center',
    flex: 1,
  },
  tabInner: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    position: 'relative',
  },
  activeGlow: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(245, 166, 35, 0.08)',
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.mutedText,
    marginTop: 2,
    letterSpacing: 0.2,
  },
  tabLabelActive: {
    color: COLORS.accent,
    fontWeight: '700',
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.accent,
    marginTop: 3,
  },
});
