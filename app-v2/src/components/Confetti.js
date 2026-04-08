import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions, Easing } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Colors for confetti particles
const COLORS = ['#6B8F71', '#C4956A', '#EAB308', '#5B7FC2', '#8B5CF6', '#C25B4A', '#8CB092'];
const SHAPES = ['square', 'circle', 'rect'];

// A single confetti particle
const Particle = ({ delay, startX, endX, color, shape, size, rotateRange, duration }) => {
  const translateY = useRef(new Animated.Value(-50)).current;
  const translateX = useRef(new Animated.Value(startX)).current;
  const rotate = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: SCREEN_HEIGHT + 100,
        duration,
        delay,
        easing: Easing.quad,
        useNativeDriver: true,
      }),
      Animated.timing(translateX, {
        toValue: endX,
        duration,
        delay,
        easing: Easing.inOut(Easing.sin),
        useNativeDriver: true,
      }),
      Animated.timing(rotate, {
        toValue: 1,
        duration,
        delay,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.delay(delay + duration * 0.7),
        Animated.timing(opacity, {
          toValue: 0,
          duration: duration * 0.3,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  const rotation = rotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', `${rotateRange}deg`],
  });

  const shapeStyle =
    shape === 'circle'
      ? { width: size, height: size, borderRadius: size / 2 }
      : shape === 'rect'
      ? { width: size * 0.6, height: size * 1.4, borderRadius: 2 }
      : { width: size, height: size, borderRadius: 2 };

  return (
    <Animated.View
      style={[
        styles.particle,
        shapeStyle,
        {
          backgroundColor: color,
          transform: [{ translateX }, { translateY }, { rotate: rotation }],
          opacity,
        },
      ]}
    />
  );
};

/**
 * Confetti burst from top of screen.
 * Triggered by changing `active` prop.
 */
const Confetti = ({ active, count = 35 }) => {
  if (!active) return null;

  const particles = Array.from({ length: count }, (_, i) => {
    const startX = Math.random() * SCREEN_WIDTH;
    const endX = startX + (Math.random() * 200 - 100);
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];
    const shape = SHAPES[Math.floor(Math.random() * SHAPES.length)];
    const size = 8 + Math.random() * 8;
    const rotateRange = (Math.random() * 720 - 360) | 0;
    const delay = Math.random() * 300;
    const duration = 2000 + Math.random() * 1500;
    return (
      <Particle
        key={`${active}-${i}`}
        startX={startX}
        endX={endX}
        color={color}
        shape={shape}
        size={size}
        rotateRange={rotateRange}
        delay={delay}
        duration={duration}
      />
    );
  });

  return <View pointerEvents="none" style={styles.container}>{particles}</View>;
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    overflow: 'hidden',
  },
  particle: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
});

export default Confetti;
