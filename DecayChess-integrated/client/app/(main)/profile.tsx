import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Layout from '../components/layout/Layout';
import { useAuthStore } from '../lib/stores/authStore';
import { useReelStore } from '../lib/stores/reelStore';
import Skeleton from '../components/ui/Skeleton';
import GlassCard from '../components/ui/GlassCard';
import GlassButton from '../components/ui/GlassButton';
import { COLORS, GLASS, SHADOWS, FONTS } from '../lib/styles/base';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ───────────────────── Profile Content Component ─────────────────────
function ProfileContent() {
  const router = useRouter();
  const { user, isAuthenticated, isAdmin } = useAuthStore();
  const savedReelsSet = useReelStore((s) => s.savedReels);
  const likedReelsSet = useReelStore((s) => s.likedReels);
  const reels = useReelStore((s) => s.reels);

  const savedReelIds = useMemo(() => Array.from(savedReelsSet), [savedReelsSet]);
  const likedCount = useMemo(() => likedReelsSet.size, [likedReelsSet]);

  const [activeTab, setActiveTab] = useState<'saved' | 'liked'>('saved');

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  const savedReels = reels.filter((r) => savedReelIds.includes(r._id));
  const likedReels = reels.filter((r) => likedReelsSet.has(r._id));

  const [asyncUser, setAsyncUser] = useState<{ name: string; email: string } | null>(null);
  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await AsyncStorage.getItem('user');
        if (userData) setAsyncUser(JSON.parse(userData));
      } catch (_e) { }
    };
    loadUser();
  }, []);

  const username = user?.username || asyncUser?.name || 'Guest';
  const email = user?.email || asyncUser?.email || '';
  const firstLetter = username.charAt(0).toUpperCase();

  const handleLogout = () => {
    Alert.alert('Log Out', 'This will clear all your local data. Continue?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: async () => {
          try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning); } catch (_) { }
          useAuthStore.getState().logout();
          await AsyncStorage.removeItem('user');
          await AsyncStorage.removeItem('token');
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Animated.View style={{ opacity: fadeAnim }}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
          <View style={styles.headerActions}>
            {isAdmin && (
              <TouchableOpacity
                onPress={() => router.push('/admin/upload' as any)}
                style={styles.iconButton}
              >
                <Ionicons name="videocam-outline" size={22} color={COLORS.white} />
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.iconButton} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={22} color={COLORS.red} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Avatar & User Info */}
        <View style={styles.profileSection}>
          <LinearGradient
            colors={[COLORS.gradientStart, COLORS.gradientEnd]}
            style={styles.avatarGradientRing}
          >
            <View style={styles.avatarInner}>
              <Text style={styles.avatarText}>{firstLetter}</Text>
            </View>
          </LinearGradient>
          <Text style={styles.username}>{username}</Text>
          {email ? <Text style={styles.userEmail}>{email}</Text> : null}
          <Text style={styles.userTitle}>CHESS ENTHUSIAST</Text>

          {isAdmin && (
            <TouchableOpacity
              onPress={() => {
                try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch (_) { }
                router.push('/admin/dashboard' as any);
              }}
              style={styles.adminButton}
            >
              <Ionicons name="shield-checkmark" size={16} color={COLORS.white} />
              <Text style={styles.adminButtonText}>Admin Dashboard</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Stats Card */}
        <GlassCard elevated style={styles.statsCard}>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <View style={[styles.statIconBg, { backgroundColor: 'rgba(255, 92, 92, 0.15)' }]}>
                <Ionicons name="heart" size={18} color={COLORS.red} />
              </View>
              <Text style={styles.statValue}>{likedCount}</Text>
              <Text style={styles.statLabel}>LIKED</Text>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statItem}>
              <View style={[styles.statIconBg, { backgroundColor: 'rgba(59, 130, 246, 0.15)' }]}>
                <Ionicons name="bookmark" size={18} color={COLORS.blue} />
              </View>
              <Text style={styles.statValue}>{savedReelIds.length}</Text>
              <Text style={styles.statLabel}>SAVED</Text>
            </View>
          </View>
        </GlassCard>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'saved' && styles.tabActive]}
            onPress={() => {
              setActiveTab('saved');
              try { Haptics.selectionAsync(); } catch (_) { }
            }}
          >
            <Text style={[styles.tabText, activeTab === 'saved' && styles.tabTextActive]}>
              Saved Reels
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'liked' && styles.tabActive]}
            onPress={() => {
              setActiveTab('liked');
              try { Haptics.selectionAsync(); } catch (_) { }
            }}
          >
            <Text style={[styles.tabText, activeTab === 'liked' && styles.tabTextActive]}>
              Liked
            </Text>
          </TouchableOpacity>
        </View>

        {/* Reels Grid */}
        <View style={styles.reelsGrid}>
          {(activeTab === 'saved' ? savedReels : likedReels).slice(0, 4).map((reel) => (
            <TouchableOpacity
              key={reel._id}
              style={styles.reelCard}
              onPress={() => {
                try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch (_) { }
                router.push('/(main)/reels');
              }}
            >
              {reel.video?.thumbnail ? (
                <Image source={{ uri: reel.video.thumbnail }} style={styles.reelImage} />
              ) : (
                <View style={[styles.reelImage, styles.reelPlaceholder]}>
                  <Ionicons name="videocam-outline" size={32} color={COLORS.mutedText} />
                </View>
              )}
              <View style={styles.reelOverlay}>
                <Text style={styles.reelTitle} numberOfLines={2}>
                  {reel.content.title}
                </Text>
              </View>
            </TouchableOpacity>
          ))}

          <TouchableOpacity
            style={styles.discoverCard}
            onPress={() => router.push('/(main)/reels')}
          >
            <View style={styles.discoverIcon}>
              <Ionicons name="add" size={24} color={COLORS.accent} />
            </View>
            <Text style={styles.discoverText}>Discover More</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Links */}
        <View style={styles.quickLinks}>
          <QuickLink icon="share-social-outline" label="Invite & Earn" />
          <QuickLink icon="help-circle-outline" label="How to Play" />
          <QuickLink icon="information-circle-outline" label="About Us" />
          <QuickLink icon="document-text-outline" label="Terms & Conditions" />
          <QuickLink icon="chatbubble-ellipses-outline" label="Help & Support" />
        </View>

        {!isAuthenticated && (
          <GlassButton
            label="Sign In"
            onPress={() => router.push('/(auth)/login')}
            style={styles.signInButton}
            fullWidth
          />
        )}
      </Animated.View>
    </ScrollView>
  );
}

function QuickLink({ icon, label }: { icon: string; label: string }) {
  return (
    <TouchableOpacity style={styles.quickLinkRow} activeOpacity={0.7}>
      <View style={styles.quickLinkIcon}>
        <Ionicons name={icon as any} size={20} color={COLORS.accent} />
      </View>
      <Text style={styles.quickLinkText}>{label}</Text>
      <Ionicons name="chevron-forward" size={18} color={COLORS.mutedText} />
    </TouchableOpacity>
  );
}

// ───────────────────── Skeleton ─────────────────────
function ProfileSkeleton() {
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={{ padding: 20, alignItems: 'center', gap: 12 }}>
        <Skeleton width={90} height={90} borderRadius={45} />
        <Skeleton width="60%" height={24} borderRadius={12} />
        <Skeleton width="40%" height={16} borderRadius={12} />
      </View>
      <View style={{ paddingHorizontal: 20 }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} height={56} borderRadius={12} style={{ marginBottom: 12 }} />
        ))}
      </View>
    </ScrollView>
  );
}

// ───────────────────── Page Export ─────────────────────
export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 300);
    return () => clearTimeout(t);
  }, []);

  return (
    <Layout
      onProfile={() => router.push('/profile')}
      onLogout={async () => {
        useAuthStore.getState().logout();
        await AsyncStorage.removeItem('user');
        await AsyncStorage.removeItem('token');
        router.push('/(auth)/login');
      }}
      onSelectHome={() => router.push('/choose')}
      onSelectOffline={() => router.push('/(offline)')}
      isChooseScreen={false}
      hideTopNav={true}
      activeBottomTab="menu"
    >
      {loading ? <ProfileSkeleton /> : <ProfileContent />}
    </Layout>
  );
}

// ───────────────────── Styles ─────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    fontFamily: FONTS.bold,
    color: COLORS.white,
    fontSize: 24,
    letterSpacing: 0.5,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconButton: {
    padding: 8,
    borderRadius: 10,
    backgroundColor: COLORS.glassBg,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarGradientRing: {
    width: 92,
    height: 92,
    borderRadius: 46,
    padding: 3,
    marginBottom: 14,
    ...SHADOWS.glow,
  },
  avatarInner: {
    flex: 1,
    borderRadius: 43,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: FONTS.bold,
    fontSize: 34,
    color: COLORS.accent,
  },
  username: {
    fontFamily: FONTS.bold,
    color: COLORS.white,
    fontSize: 26,
    marginBottom: 6,
  },
  userEmail: {
    fontFamily: FONTS.regular,
    color: COLORS.secondaryText,
    fontSize: 14,
    marginBottom: 8,
  },
  userTitle: {
    fontFamily: FONTS.bold,
    color: COLORS.accent,
    fontSize: 11,
    letterSpacing: 2,
    marginBottom: 12,
  },
  adminButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 92, 92, 0.12)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 92, 92, 0.25)',
    gap: 8,
    marginTop: 4,
  },
  adminButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
  },
  statsCard: {
    marginHorizontal: 20,
    marginBottom: 24,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statIconBg: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontFamily: FONTS.bold,
    color: COLORS.white,
    fontSize: 28,
  },
  statLabel: {
    fontFamily: FONTS.bold,
    color: COLORS.mutedText,
    fontSize: 10,
    letterSpacing: 1,
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: COLORS.glassBorder,
  },
  tabsContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: COLORS.glassBg,
    borderRadius: GLASS.borderRadiusPill,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    padding: 3,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: GLASS.borderRadiusPill,
  },
  tabActive: {
    backgroundColor: COLORS.accentGlow,
    borderWidth: 1,
    borderColor: COLORS.accentDim,
  },
  tabText: {
    color: COLORS.mutedText,
    fontSize: 13,
    fontWeight: '600',
  },
  tabTextActive: {
    color: COLORS.white,
  },
  reelsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  reelCard: {
    width: (SCREEN_WIDTH - 52) / 2,
    height: 160,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: COLORS.glassBg,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  reelImage: {
    width: '100%',
    height: '100%',
  },
  reelPlaceholder: {
    backgroundColor: COLORS.glassBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reelOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    padding: 10,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  reelTitle: {
    fontFamily: FONTS.semibold,
    color: COLORS.white,
    fontSize: 12,
    lineHeight: 16,
  },
  discoverCard: {
    width: (SCREEN_WIDTH - 52) / 2,
    height: 160,
    borderRadius: 14,
    backgroundColor: COLORS.glassBg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    borderStyle: 'dashed',
  },
  discoverIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.accentGlow,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  discoverText: {
    color: COLORS.secondaryText,
    fontSize: 12,
    fontWeight: '500',
  },
  quickLinks: {
    paddingHorizontal: 20,
    gap: 6,
    marginBottom: 24,
  },
  quickLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: COLORS.glassBg,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  quickLinkIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: COLORS.accentGlow,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  quickLinkText: {
    flex: 1,
    fontFamily: FONTS.medium,
    color: COLORS.primaryText,
    fontSize: 15,
  },
  signInButton: {
    marginHorizontal: 20,
    marginBottom: 24,
    borderRadius: GLASS.borderRadiusPill,
    overflow: 'hidden',
    ...SHADOWS.glow,
  },
  signInGradient: {
    paddingVertical: 14,
    borderRadius: GLASS.borderRadiusPill,
    alignItems: 'center',
  },
  signInText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
  },
});
