import React, { useState } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';
import { COLORS, GLASS, SHADOWS, FONTS } from '../../_lib/styles/base';
import GlassCard from './GlassCard';

interface VariantCardProps {
  variantName: string;
  activePlayers: number;
  description: string;
  onPlay: () => void;
  closingTime?: string;
  disabled: boolean;
  subtitle?: string;
  rulesItems?: string[];
  accentColor?: string;
  icon?: string;
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
  accentColor = COLORS.accent,
  icon,
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
        {/* Left accent strip */}
        <View style={[styles.accentStrip, { backgroundColor: accentColor }]} />

        {/* Whole card is clickable for play */}
        <TouchableOpacity
          style={styles.cardTouchable}
          onPress={onPlay}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          activeOpacity={0.85}
          disabled={disabled}
        >
          <View style={styles.cardContent}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.titleRow}>
                {!!icon && (
                  <View style={[styles.iconWrap, { backgroundColor: accentColor + '20' }]}>
                    <Ionicons name={icon as any} size={20} color={accentColor} />
                  </View>
                )}
                <View style={styles.titleSection}>
                  <Text style={styles.variantName}>{variantName}</Text>
                  {!!subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
                  {closingTime && (
                    <Text style={styles.closingTime}>Closing at {closingTime}</Text>
                  )}
                </View>
              </View>
              {/* Small play icon instead of big button */}
              <View style={[styles.playCircle, { borderColor: accentColor + '40' }]}>
                <Ionicons name="play" size={16} color={accentColor} style={{ marginLeft: 2 }} />
              </View>
            </View>
          </View>
        </TouchableOpacity>

        {/* Live section — separate touch target for expand */}
        <View style={styles.liveSection}>
          <TouchableOpacity style={styles.playerSection} onPress={toggleExpand} activeOpacity={0.7}>
            <View style={styles.playersInfo}>
              <Animated.View style={[styles.activeDot, { opacity: pulseAnim, backgroundColor: accentColor }]} />
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
                    <View style={[styles.ruleBullet, { backgroundColor: accentColor }]} />
                    <Text style={styles.ruleText}>{rule}</Text>
                  </View>
                ))}
              </View>
            )}
          </Animated.View>
        </View>
      </GlassCard>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  accentStrip: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    borderTopLeftRadius: 18,
    borderBottomLeftRadius: 18,
    zIndex: 2,
  },
  cardTouchable: {
    paddingLeft: 3, // offset for accent strip
  },
  cardContent: {
    padding: 16,
    paddingBottom: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  titleSection: {
    flex: 1,
  },
  variantName: {
    fontFamily: FONTS.extrabold,
    color: COLORS.white,
    fontSize: 22,
    letterSpacing: 0.3,
  },
  subtitle: {
    fontFamily: FONTS.regular,
    color: COLORS.mutedText,
    fontSize: 11,
    marginTop: 3,
    opacity: 0.7,
  },
  closingTime: {
    color: COLORS.yellow,
    fontSize: 12,
    marginTop: 3,
    fontFamily: FONTS.medium,
  },
  playCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1.5,
    backgroundColor: 'rgba(255,255,255,0.04)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  liveSection: {
    marginLeft: 3, // offset for accent strip
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
});
