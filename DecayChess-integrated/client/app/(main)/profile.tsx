import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Layout from '../components/layout/Layout';
import { useAuthStore } from '../lib/stores/authStore';
import { useReelStore } from '../lib/stores/reelStore';
import Skeleton from '../components/ui/Skeleton';

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

  // Get user info from authStore or fallback to AsyncStorage data
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
          // Clear both stores
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
        {/* ─── Header ─── */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
          <View style={styles.headerActions}>
            {isAdmin && (
              <TouchableOpacity
                onPress={() => router.push('/admin/upload' as any)}
                style={styles.iconButton}
              >
                <Ionicons name="videocam-outline" size={22} color="#FFFFFF" />
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.iconButton} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={22} color="#FF5C5C" />
            </TouchableOpacity>
          </View>
        </View>

        {/* ─── Avatar & User Info ─── */}
        <View style={styles.profileSection}>
          <View style={styles.avatarRing}>
            <View style={styles.avatarInner}>
              <Text style={styles.avatarText}>{firstLetter}</Text>
            </View>
          </View>
          <Text style={styles.username}>{username}</Text>
          {email ? <Text style={styles.userEmail}>{email}</Text> : null}
          <Text style={styles.userTitle}>CHESS ENTHUSIAST</Text>

          {/* Admin Dashboard Button */}
          {isAdmin && (
            <TouchableOpacity
              onPress={() => {
                try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch (_) { }
                router.push('/admin/dashboard' as any);
              }}
              style={styles.adminButton}
            >
              <Ionicons name="shield-checkmark" size={16} color="#FFFFFF" />
              <Text style={styles.adminButtonText}>Admin Dashboard</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ─── Stats Row ─── */}
        <View style={styles.statsCard}>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <View style={[styles.statIconBg, { backgroundColor: 'rgba(255, 107, 107, 0.2)' }]}>
                <Ionicons name="heart" size={18} color="#FF6B6B" />
              </View>
              <Text style={styles.statValue}>{likedCount}</Text>
              <Text style={styles.statLabel}>LIKED</Text>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statItem}>
              <View style={[styles.statIconBg, { backgroundColor: 'rgba(59, 130, 246, 0.2)' }]}>
                <Ionicons name="bookmark" size={18} color="#3B82F6" />
              </View>
              <Text style={styles.statValue}>{savedReelIds.length}</Text>
              <Text style={styles.statLabel}>SAVED</Text>
            </View>
          </View>
        </View>

        {/* ─── Tabs ─── */}
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

        {/* ─── Reels Grid ─── */}
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
                  <Ionicons name="videocam-outline" size={32} color="#6B7280" />
                </View>
              )}
              <View style={styles.reelOverlay}>
                <Text style={styles.reelTitle} numberOfLines={2}>
                  {reel.content.title}
                </Text>
              </View>
            </TouchableOpacity>
          ))}

          {/* Discover More Card */}
          <TouchableOpacity
            style={styles.discoverCard}
            onPress={() => router.push('/(main)/reels')}
          >
            <View style={styles.discoverIcon}>
              <Ionicons name="add" size={24} color="#FFFFFF" />
            </View>
            <Text style={styles.discoverText}>Discover More</Text>
          </TouchableOpacity>
        </View>

        {/* ─── Quick Links ─── */}
        <View style={styles.quickLinks}>
          <QuickLink icon="share-social-outline" label="Invite & Earn" />
          <QuickLink icon="help-circle-outline" label="How to Play" />
          <QuickLink icon="information-circle-outline" label="About Us" />
          <QuickLink icon="document-text-outline" label="Terms & Conditions" />
          <QuickLink icon="chatbubble-ellipses-outline" label="Help & Support" />
        </View>

        {!isAuthenticated && (
          <TouchableOpacity
            style={styles.signInButton}
            onPress={() => router.push('/(auth)/login')}
          >
            <Text style={styles.signInText}>Sign In</Text>
          </TouchableOpacity>
        )}
      </Animated.View>
    </ScrollView>
  );
}

function QuickLink({ icon, label }: { icon: string; label: string }) {
  return (
    <TouchableOpacity style={styles.quickLinkRow}>
      <View style={styles.quickLinkIcon}>
        <Ionicons name={icon as any} size={20} color="#00D9FF" />
      </View>
      <Text style={styles.quickLinkText}>{label}</Text>
      <Ionicons name="chevron-forward" size={18} color="#6B7280" />
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
    // Short delay for skeleton
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
    backgroundColor: '#0F0F23',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '600',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconButton: {
    padding: 8,
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarRing: {
    width: 90,
    height: 90,
    borderRadius: 45,
    padding: 3,
    backgroundColor: '#00D9FF',
    marginBottom: 12,
  },
  avatarInner: {
    flex: 1,
    borderRadius: 42,
    backgroundColor: '#1A1A3E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 36,
    fontWeight: '700',
    color: '#00D9FF',
  },
  username: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  userEmail: {
    color: '#A0A0B0',
    fontSize: 13,
    marginBottom: 6,
  },
  userTitle: {
    color: '#00D9FF',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
    marginBottom: 12,
  },
  adminButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 92, 92, 0.15)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 92, 92, 0.35)',
    gap: 8,
    marginTop: 4,
  },
  adminButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  statsCard: {
    marginHorizontal: 20,
    marginBottom: 24,
    padding: 20,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
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
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statValue: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
  },
  statLabel: {
    color: '#6B7280',
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  tabsContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#FFFFFF',
  },
  tabText: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#FFFFFF',
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
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  reelImage: {
    width: '100%',
    height: '100%',
  },
  reelPlaceholder: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  reelOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    padding: 10,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  reelTitle: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
  },
  discoverCard: {
    width: (SCREEN_WIDTH - 52) / 2,
    height: 160,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.03)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderStyle: 'dashed',
  },
  discoverIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  discoverText: {
    color: '#A0A0B0',
    fontSize: 12,
    fontWeight: '500',
  },
  quickLinks: {
    paddingHorizontal: 20,
    gap: 2,
    marginBottom: 24,
  },
  quickLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.03)',
    marginBottom: 8,
  },
  quickLinkIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 217, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  quickLinkText: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '500',
  },
  signInButton: {
    marginHorizontal: 20,
    backgroundColor: '#00D9FF',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 24,
  },
  signInText: {
    color: '#0F0F23',
    fontSize: 16,
    fontWeight: '700',
  },
});
