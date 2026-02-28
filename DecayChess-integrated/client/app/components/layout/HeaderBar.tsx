// Premium Floating Glass Header — Rebuilt
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Animated, Modal, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import { COLORS, GLASS, SHADOWS, SPACING } from '../../lib/styles/base';
import SpeakerIcon from '../ui/SpeakerIcon';

export default function HeaderBar() {
  const router = useRouter();
  const [menuVisible, setMenuVisible] = useState(false);

  const closeMenu = () => setMenuVisible(false);
  const openMenu = () => setMenuVisible(true);

  const goProfile = () => { closeMenu(); router.push('/(main)/profile' as any); };
  const goOffline = () => { closeMenu(); router.push('/(offline)' as any); };
  const goHome = () => { closeMenu(); router.push('/(main)/choose' as any); };
  const goNewsletter = () => { router.push('/(main)/newsletter' as any); };

  const HeaderContent = () => (
    <View style={styles.headerInner}>
      <TouchableOpacity style={styles.avatarTouch} activeOpacity={0.7} onPress={openMenu}>
        <View style={styles.avatarCircle}>
          <Ionicons name="person" size={16} color={COLORS.accent} />
        </View>
      </TouchableOpacity>

      <View style={styles.brandContainer}>
        <Text style={styles.brandDecay}>Decay</Text>
        <Text style={styles.brandChess}>Chess</Text>
      </View>

      <TouchableOpacity style={styles.headerAction} activeOpacity={0.7} onPress={goNewsletter}>
        <SpeakerIcon size={32} color={COLORS.primaryText} strokeWidth={1.4} />
      </TouchableOpacity>
    </View>
  );

  const MenuItems = () => (
    <View style={styles.menuContent}>
      <Text style={styles.menuLabel}>QUICK MENU</Text>
      {[
        { icon: 'person-outline' as const, label: 'Profile', onPress: goProfile },
        { icon: 'home-outline' as const, label: 'Home', onPress: goHome },
        { icon: 'game-controller-outline' as const, label: 'Offline Mode', onPress: goOffline },
      ].map((item, i) => (
        <TouchableOpacity key={item.label} style={[styles.menuItem, i > 0 && styles.menuItemBorder]} onPress={item.onPress} activeOpacity={0.7}>
          <View style={styles.menuIconCircle}>
            <Ionicons name={item.icon} size={16} color={COLORS.accent} />
          </View>
          <Text style={styles.menuItemLabel}>{item.label}</Text>
          <Ionicons name="chevron-forward" size={14} color={COLORS.mutedText} />
        </TouchableOpacity>
      ))}
    </View>
  );

  const MenuCard = () => (
    <Modal visible={menuVisible} transparent animationType="fade" onRequestClose={closeMenu}>
      <TouchableOpacity style={styles.menuOverlay} activeOpacity={1} onPress={closeMenu}>
        {Platform.OS === 'ios' ? (
          <BlurView intensity={50} tint="dark" style={styles.menuCard}>
            <MenuItems />
          </BlurView>
        ) : (
          <View style={[styles.menuCard, styles.menuCardAndroid]}>
            <MenuItems />
          </View>
        )}
      </TouchableOpacity>
    </Modal>
  );

  if (Platform.OS === 'ios') {
    return (
      <BlurView intensity={40} tint="dark" style={styles.headerBar}>
        <HeaderContent />
        <View style={styles.bottomGlow} />
        <MenuCard />
      </BlurView>
    );
  }

  return (
    <View style={[styles.headerBar, styles.headerAndroid]}>
      <HeaderContent />
      <View style={styles.bottomGlow} />
      <MenuCard />
    </View>
  );
}

const styles = StyleSheet.create({
  headerBar: {
    overflow: 'hidden',
  },
  headerAndroid: {
    backgroundColor: 'rgba(17, 22, 41, 0.95)',
  },
  headerInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.xl,
    paddingVertical: 14,
  },
  bottomGlow: {
    height: 1,
    backgroundColor: 'rgba(245, 166, 35, 0.08)',
  },
  avatarTouch: {
    padding: 2,
  },
  avatarCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(245, 166, 35, 0.1)',
    borderWidth: 1.5,
    borderColor: 'rgba(245, 166, 35, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  brandDecay: {
    color: COLORS.white,
    fontSize: 22,
    fontWeight: '300',
    letterSpacing: 1,
  },
  brandChess: {
    color: COLORS.accent,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  headerAction: {
    padding: 4,
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Menu
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  menuCard: {
    position: 'absolute',
    top: 62,
    left: 16,
    borderRadius: 20,
    overflow: 'hidden',
    minWidth: 220,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    ...SHADOWS.glass,
  },
  menuCardAndroid: {
    backgroundColor: 'rgba(23, 29, 51, 0.98)',
  },
  menuContent: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    padding: 16,
  },
  menuLabel: {
    color: COLORS.captionText,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2.5,
    marginBottom: 14,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  menuItemBorder: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  menuIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(245, 166, 35, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuItemLabel: {
    flex: 1,
    color: COLORS.primaryText,
    fontSize: 15,
    fontWeight: '500',
  },
});
