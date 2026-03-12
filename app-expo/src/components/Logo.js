// ---------------------------------------------------------------------------
// Patoune v4.0 — Logo Component
// Premium SVG paw logo — refined, geometric, Apple-level craft.
// ---------------------------------------------------------------------------
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Circle, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import { COLORS } from '../utils/colors';
import { FONTS } from '../utils/typography';

/**
 * Premium Paw SVG icon — refined proportions, smooth curves.
 */
export const PawIcon = ({ size = 32, color, gradient = false }) => (
  <Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
    {gradient && (
      <Defs>
        <SvgGradient id="pawGrad" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor="#00C853" />
          <Stop offset="1" stopColor="#00E676" />
        </SvgGradient>
      </Defs>
    )}
    {/* Main pad — smoother bezier */}
    <Path
      d="M32 50c-9 0-17-6.5-19-15a7.5 7.5 0 0 1 4.2-8.5c2.2-1 4.5.2 6.3 2.2l3.5 4.3c2.2 2.7 6.8 2.7 9 0l3.5-4.3c1.8-2 4.1-3.2 6.3-2.2a7.5 7.5 0 0 1 4.2 8.5C48 43.5 41 50 32 50z"
      fill={gradient ? 'url(#pawGrad)' : (color || '#FFF')}
    />
    {/* Toes — perfectly round, balanced */}
    <Circle cx="17" cy="17" r="6.5" fill={gradient ? 'url(#pawGrad)' : (color || '#FFF')} />
    <Circle cx="47" cy="17" r="6.5" fill={gradient ? 'url(#pawGrad)' : (color || '#FFF')} />
    <Circle cx="10.5" cy="31" r="5.8" fill={gradient ? 'url(#pawGrad)' : (color || '#FFF')} />
    <Circle cx="53.5" cy="31" r="5.8" fill={gradient ? 'url(#pawGrad)' : (color || '#FFF')} />
  </Svg>
);

/**
 * Full logo: paw icon + wordmark.
 *
 * @param {'light'|'dark'|'brand'} variant
 * @param {'sm'|'md'|'lg'|'xl'} size
 */
const Logo = ({ variant = 'light', size = 'md', showText = true, style }) => {
  const sizeConfig = {
    sm: { icon: 22, text: 20, gap: 6 },
    md: { icon: 32, text: 28, gap: 8 },
    lg: { icon: 46, text: 38, gap: 10 },
    xl: { icon: 60, text: 48, gap: 14 },
  };

  const colorConfig = {
    light: { icon: '#FFF', text: '#FFF', gradient: false },
    dark:  { icon: COLORS.primary, text: COLORS.text, gradient: true },
    brand: { icon: COLORS.primary, text: COLORS.primary, gradient: true },
  };

  const cfg = sizeConfig[size] || sizeConfig.md;
  const clr = colorConfig[variant] || colorConfig.light;

  return (
    <View style={[styles.container, style]}>
      <PawIcon size={cfg.icon} color={clr.icon} gradient={clr.gradient} />
      {showText && (
        <Text
          style={[
            styles.wordmark,
            { fontSize: cfg.text, color: clr.text },
          ]}
        >
          patoune
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  wordmark: {
    fontFamily: FONTS.brand,
    letterSpacing: -0.8,
    textTransform: 'lowercase',
  },
});

export default Logo;
