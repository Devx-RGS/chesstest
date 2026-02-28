import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS, GLASS } from '../../lib/styles/base';

interface TopNavBarProps {
  isChooseScreen: boolean;
  onSelectChoose: () => void;
  onSelectTournament: () => void;
}

export default function TopNavBar({ isChooseScreen, onSelectChoose, onSelectTournament }: TopNavBarProps) {
  const iconSize = 20;

  return (
    <View style={styles.topNavBar}>
      <View style={styles.pillContainer}>
        <TouchableOpacity
          style={[styles.pillTab, isChooseScreen && styles.pillTabActive]}
          onPress={onSelectChoose}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons
            name="chess-knight"
            size={iconSize}
            color={isChooseScreen ? COLORS.white : COLORS.mutedText}
          />
          <Text style={[styles.tabText, isChooseScreen && styles.tabTextActive]}>
            1 VS 1
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.pillTab, !isChooseScreen && styles.pillTabActive]}
          onPress={onSelectTournament}
          activeOpacity={0.7}
        >
          <Ionicons
            name="trophy-outline"
            size={iconSize}
            color={!isChooseScreen ? COLORS.white : COLORS.mutedText}
          />
          <Text style={[styles.tabText, !isChooseScreen && styles.tabTextActive]}>
            TOURNAMENT
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  topNavBar: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: 'transparent',
  },
  pillContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.glassBg,
    borderRadius: GLASS.borderRadiusPill,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    padding: 3,
  },
  pillTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: GLASS.borderRadiusPill,
    gap: 6,
  },
  pillTabActive: {
    backgroundColor: COLORS.accentGlow,
    borderWidth: 1,
    borderColor: COLORS.accentDim,
  },
  tabText: {
    color: COLORS.mutedText,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  tabTextActive: {
    color: COLORS.white,
  },
});
