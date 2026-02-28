// Glassmorphism Layout — Updated 2026-02-27
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import BottomBar from './BottomBar';
import HeaderBar from './HeaderBar';
import TopNavBar from './TopNavBar';
import { COLORS } from '../../lib/styles/base';

interface LayoutProps {
  children: React.ReactNode;
  onProfile: () => void;
  onLogout: () => void;
  onSelectHome: () => void;
  onSelectOffline?: () => void;
  onSelectReels?: () => void;
  onSelectTournament?: () => void;
  isChooseScreen?: boolean;
  hideTopNav?: boolean;
  hideNavigation?: boolean;
  activeBottomTab?: 'home' | 'menu' | 'offline' | 'reels';
}

export default function Layout({
  children,
  onProfile,
  onLogout,
  onSelectHome,
  onSelectOffline,
  onSelectReels,
  onSelectTournament,
  isChooseScreen = true,
  hideTopNav = false,
  hideNavigation = false,
  activeBottomTab = 'home',
}: LayoutProps) {
  const router = useRouter();
  const handleReels = onSelectReels || (() => router.push('/(main)/reels'));

  return (
    <SafeAreaView style={styles.container}>
      {/* Gradient mesh background */}
      <LinearGradient
        colors={['#080B14', '#0E1228', '#0C0F20', '#080B14']}
        locations={[0, 0.3, 0.7, 1]}
        style={styles.gradientBg}
      />
      {/* Subtle gold accent orb at top-right */}
      <View style={styles.accentOrb} />

      {!hideNavigation && <HeaderBar />}
      {!hideNavigation && !hideTopNav && onSelectTournament && (
        <TopNavBar
          isChooseScreen={isChooseScreen}
          onSelectChoose={onSelectHome}
          onSelectTournament={onSelectTournament}
        />
      )}
      <View style={styles.content}>
        {children}
      </View>
      {!hideNavigation && (
        <BottomBar
          onProfile={onProfile}
          onLogout={onLogout}
          onHome={onSelectHome}
          onOffline={onSelectOffline}
          onSelectReels={handleReels}
          activeTab={activeBottomTab}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  gradientBg: {
    ...StyleSheet.absoluteFillObject,
  },
  accentOrb: {
    position: 'absolute',
    top: -60,
    right: -60,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(245, 166, 35, 0.04)',
  },
  content: {
    flex: 1,
  },
});
