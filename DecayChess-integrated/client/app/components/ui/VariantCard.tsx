import React, { useState } from 'react';
import { Animated, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import { COLORS, GLASS, SHADOWS, FONTS } from '../../lib/styles/base';
import GlassCard from './GlassCard';
import GlassButton from './GlassButton';

interface VariantCardProps {
  variantName: string;
  activePlayers: number;
  description: string;
  onPlay: () => void;
  closingTime?: string;
  disabled: boolean;
  subtitle?: string;
  rulesItems?: string[];
}

export default function VariantCard({
  variantName,
  activePlayers,
  description,
  onPlay,
  closingTime,
  disabled,
  subtitle,
  rulesItems = [],
}: VariantCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const pulseAnim = React.useRef(new Animated.Value(1)).current;
  const expandAnim = React.useRef(new Animated.Value(0)).current;
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 0.2, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  React.useEffect(() => {
    Animated.timing(expandAnim, {
      toValue: isExpanded ? 1 : 0,
      duration: 250,
      useNativeDriver: false,
    }).start();
  }, [isExpanded]);

  const toggleExpand = () => setIsExpanded(!isExpanded);

  const maxHeight = expandAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 400],
  });

  const handlePressIn = () => {
    Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true, speed: 50, bounciness: 4 }).start();
  };
  const handlePressOut = () => {
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 50, bounciness: 4 }).start();
  };



  return (
    <Animated.View style={[{ transform: [{ scale: scaleAnim }], marginBottom: 14 }]}>
      <GlassCard elevated noPadding intensity={25}>
        <View style={styles.cardContent}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.titleSection}>
              <Text style={styles.variantName}>{variantName}</Text>
              {!!subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
              {closingTime && (
                <Text style={styles.closingTime}>Closing at {closingTime}</Text>
              )}
            </View>
            <GlassButton
              label="PLAY"
              onPress={onPlay}
              disabled={disabled}
              style={{ height: 40, paddingHorizontal: 16 }}
              textStyle={{ fontSize: 13, letterSpacing: 1 }}
            />
          </View>

          {/* Live section */}
          <View style={styles.liveSection}>
            <TouchableOpacity style={styles.playerSection} onPress={toggleExpand} activeOpacity={0.7}>
              <View style={styles.playersInfo}>
                <Animated.View style={[styles.activeDot, { opacity: pulseAnim }]} />
                <Text style={styles.playersText}>{activePlayers} live players</Text>
              </View>
              <Animated.View
                style={[
                  styles.dropdownIcon,
                  {
                    transform: [{
                      rotate: expandAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0deg', '180deg'],
                      }),
                    }],
                  },
                ]}
              >
                <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M7 10l5 5 5-5"
                    stroke={COLORS.mutedText}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
              </Animated.View>
            </TouchableOpacity>

            <Animated.View style={[styles.description, { maxHeight }]}>
              <Text style={styles.descriptionText}>{description}</Text>
              {rulesItems.length > 0 && (
                <View style={styles.rulesContainer}>
                  <Text style={styles.rulesHeading}>Rules</Text>
                  {rulesItems.map((rule, idx) => (
                    <View key={idx} style={styles.ruleItem}>
                      <View style={styles.ruleBullet} />
                      <Text style={styles.ruleText}>{rule}</Text>
                    </View>
                  ))}
                </View>
              )}
            </Animated.View>
          </View>
        </View>
      </GlassCard>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: GLASS.borderRadius,
    marginBottom: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    ...SHADOWS.glass,
  },
  blurWrap: {
    borderRadius: GLASS.borderRadius,
    overflow: 'hidden',
  },
  androidCard: {
    backgroundColor: COLORS.surfaceLight,
  },
  cardOverlay: {
    backgroundColor: COLORS.glassBg,
  },
  cardContent: {
    padding: 16,
    paddingBottom: 0,
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  titleSection: {
    flex: 1,
    marginRight: 16,
  },
  variantName: {
    fontFamily: FONTS.bold,
    color: COLORS.white,
    fontSize: 26,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontFamily: FONTS.regular,
    color: COLORS.secondaryText,
    fontSize: 12,
    marginTop: 4,
  },
  closingTime: {
    color: COLORS.yellow,
    fontSize: 13,
    marginTop: 4,
    fontWeight: '500',
  },
  liveSection: {
    marginHorizontal: -16,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderTopWidth: 1,
    borderTopColor: COLORS.glassBorder,
  },
  playerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  playersInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.green,
    marginRight: 8,
  },
  playersText: {
    fontFamily: FONTS.medium,
    color: COLORS.mutedText,
    fontSize: 12,
  },
  dropdownIcon: {
    padding: 4,
  },
  description: {
    overflow: 'hidden',
  },
  descriptionText: {
    fontFamily: FONTS.regular,
    color: COLORS.secondaryText,
    fontSize: 14,
    lineHeight: 20,
    padding: 16,
    paddingTop: 0,
  },
  rulesContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  rulesHeading: {
    fontFamily: FONTS.semibold,
    color: COLORS.white,
    fontSize: 15,
    marginTop: 6,
    marginBottom: 8,
  },
  ruleItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 5,
  },
  ruleBullet: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: COLORS.accent,
    marginTop: 7,
    marginRight: 8,
  },
  ruleText: {
    fontFamily: FONTS.regular,
    color: 'rgba(255,255,255,0.75)',
    fontSize: 12,
    lineHeight: 18,
    flex: 1,
  },
  playButton: {
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: 10,
    ...SHADOWS.glow,
  },
  playButtonText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1,
  },
});
