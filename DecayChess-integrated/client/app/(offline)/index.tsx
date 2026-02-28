import React, { useRef, useState } from 'react'
import { Animated, StyleSheet, Text, TouchableOpacity, View, ScrollView } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import Layout from '../components/layout/Layout'
import GlassCard from '../components/ui/GlassCard'
import { COLORS, GLASS, SHADOWS, SPACING } from '../lib/styles/base'

const timeControls = [
  { key: 'bullet', label: 'Bullet', description: '1+0 (1 min, no increment)', icon: 'flash-outline' as const, baseTime: 60000, increment: 0 },
  { key: 'standard', label: 'Standard', description: '10+0 (10 min, no increment)', icon: 'time-outline' as const, baseTime: 600000, increment: 0 },
]

export default function OfflineMenu() {
  const router = useRouter()
  const [selected, setSelected] = useState(0)
  const scaleAnim = useRef(new Animated.Value(1)).current

  const handleProfile = () => router.push('/(main)/profile' as any)
  const handleLogout = () => router.push('/(auth)/login' as any)
  const handleHome = () => router.push('/(main)/choose' as any)

  const handleStart = () => {
    const tc = timeControls[selected]
    router.push({ pathname: '/(offline)/classic', params: { baseTime: String(tc.baseTime), increment: String(tc.increment) } } as any)
  }

  const handlePressIn = () => {
    Animated.spring(scaleAnim, { toValue: 0.96, useNativeDriver: true, speed: 50, bounciness: 4 }).start()
  }
  const handlePressOut = () => {
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 50, bounciness: 4 }).start()
  }

  return (
    <Layout
      onProfile={handleProfile}
      onLogout={handleLogout}
      onSelectHome={handleHome}
      onSelectOffline={() => { }}
      isChooseScreen={false}
      hideTopNav={true}
      activeBottomTab="offline"
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Text style={styles.pageTitle}>Offline Mode</Text>
        <Text style={styles.pageSubtitle}>Play on the same device. No internet required.</Text>

        {/* Time Control Section */}
        <Text style={styles.sectionTitle}>Classic • Time Control</Text>
        {timeControls.map((tc, idx) => (
          <TouchableOpacity
            key={tc.key}
            onPress={() => setSelected(idx)}
            activeOpacity={0.85}
          >
            <GlassCard
              style={[styles.modeCard, selected === idx && styles.modeCardSelected]}
              borderGlow={selected === idx}
            >
              <View style={styles.modeCardRow}>
                <View style={[styles.modeIcon, selected === idx && styles.modeIconActive]}>
                  <Ionicons name={tc.icon} size={20} color={selected === idx ? COLORS.white : COLORS.accent} />
                </View>
                <View style={styles.modeInfo}>
                  <Text style={[styles.modeLabel, selected === idx && styles.modeLabelActive]}>{tc.label}</Text>
                  <Text style={styles.modeDesc}>{tc.description}</Text>
                </View>
                {selected === idx && (
                  <View style={styles.checkCircle}>
                    <Ionicons name="checkmark" size={14} color={COLORS.white} />
                  </View>
                )}
              </View>
            </GlassCard>
          </TouchableOpacity>
        ))}

        {/* CTA Button */}
        <Animated.View style={{ transform: [{ scale: scaleAnim }], marginTop: 8 }}>
          <TouchableOpacity
            onPress={handleStart}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={[COLORS.gradientStart, COLORS.gradientEnd]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.ctaButton}
            >
              <Ionicons name="play" size={20} color={COLORS.white} />
              <Text style={styles.ctaText}>Start Classic Local Game</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* More Variants */}
        <Text style={[styles.sectionTitle, { marginTop: 36 }]}>More Variants (Offline)</Text>

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => router.push({ pathname: '/(offline)/crazyhouse', params: { baseTime: '180000', increment: '0' } } as any)}
        >
          <GlassCard style={styles.variantCard}>
            <View style={styles.variantRow}>
              <View style={styles.variantIcon}>
                <Ionicons name="shuffle-outline" size={18} color={COLORS.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.variantTitle}>Crazyhouse (with Timer)</Text>
                <Text style={styles.variantDesc}>3:00 each, no increment; sequential pocket drops with 10s drop timer</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={COLORS.mutedText} />
            </View>
          </GlassCard>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => router.push({ pathname: '/(offline)/decay', params: { baseTime: '180000', increment: '0' } } as any)}
        >
          <GlassCard style={styles.variantCard}>
            <View style={styles.variantRow}>
              <View style={styles.variantIcon}>
                <Ionicons name="hourglass-outline" size={18} color={COLORS.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.variantTitle}>Decay</Text>
                <Text style={styles.variantDesc}>3:00 each, no increment; queen decay timer (freezes when expired)</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={COLORS.mutedText} />
            </View>
          </GlassCard>
        </TouchableOpacity>
      </ScrollView>
    </Layout>
  )
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: SPACING.xl,
    paddingBottom: 40,
  },
  pageTitle: {
    color: COLORS.white,
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: 0.3,
    marginBottom: 6,
  },
  pageSubtitle: {
    color: COLORS.secondaryText,
    fontSize: 15,
    marginBottom: 28,
  },
  sectionTitle: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 14,
    letterSpacing: 0.2,
  },
  modeCard: {
    marginBottom: 12,
  },
  modeCardSelected: {
    borderColor: COLORS.accentDim,
  },
  modeCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modeIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: COLORS.accentGlow,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  modeIconActive: {
    backgroundColor: COLORS.accent,
  },
  modeInfo: {
    flex: 1,
  },
  modeLabel: {
    color: COLORS.primaryText,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 3,
  },
  modeLabelActive: {
    color: COLORS.accent,
  },
  modeDesc: {
    color: COLORS.mutedText,
    fontSize: 13,
  },
  checkCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 14,
    gap: 8,
    ...SHADOWS.glow,
  },
  ctaText: {
    color: COLORS.white,
    fontSize: 17,
    fontWeight: '700',
  },
  variantCard: {
    marginBottom: 10,
  },
  variantRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  variantIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: COLORS.accentGlow,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  variantTitle: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 3,
  },
  variantDesc: {
    color: COLORS.mutedText,
    fontSize: 12,
    lineHeight: 17,
  },
})
