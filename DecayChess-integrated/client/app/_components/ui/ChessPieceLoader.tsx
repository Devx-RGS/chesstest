/**
 * ChessPieceLoader — A cycling chess piece animation used as a custom
 * pull-to-refresh indicator. Shows chess pieces rapidly appearing one
 * after another with a scale + fade animation.
 */
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Image, StyleSheet, View } from 'react-native';
import { COLORS } from '../../_lib/styles/base';

const PIECE_ASSETS = [
  require('../../../assets/wk.png'),
  require('../../../assets/bq.png'),
  require('../../../assets/wr.png'),
  require('../../../assets/bn.png'),
  require('../../../assets/wb.png'),
  require('../../../assets/bp.png'),
  require('../../../assets/wq.png'),
  require('../../../assets/bk.png'),
  require('../../../assets/wn.png'),
  require('../../../assets/br.png'),
  require('../../../assets/wp.png'),
  require('../../../assets/bb.png'),
];

const CYCLE_MS = 180; // Speed of piece cycling

interface ChessPieceLoaderProps {
  size?: number;
  active?: boolean;
}

export default function ChessPieceLoader({ size = 36, active = true }: ChessPieceLoaderProps) {
  const [index, setIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    if (!active) return;

    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % PIECE_ASSETS.length);
    }, CYCLE_MS);

    return () => clearInterval(interval);
  }, [active]);

  useEffect(() => {
    // Reset and animate in each new piece
    fadeAnim.setValue(0);
    scaleAnim.setValue(0.5);

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: CYCLE_MS * 0.6,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        speed: 60,
        bounciness: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, [index]);

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.pieceWrap,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <Image
          source={PIECE_ASSETS[index]}
          style={{ width: size, height: size, resizeMode: 'contain' }}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
  },
  pieceWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
