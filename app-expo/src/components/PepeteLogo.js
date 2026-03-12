// ─── Pépète Logo — Custom SVG Brand Mark ─────────────────
// A unique, memorable logo: stylized cat silhouette curled into a "P"
// with a paw print accent and the brand wordmark below.
// Designed to be instantly recognizable and work at any size.

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Circle, G, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';

// ─── The Icon Mark ───────────────────────────────────────
// A cat silhouette curled into the shape of a "P" letter,
// with a small paw print detail. Works as standalone app icon.
const PepeteIcon = ({ size = 80, color, gradientColors }) => {
  const useGradient = !!gradientColors;
  const fill = useGradient ? 'url(#iconGrad)' : (color || '#00E676');
  const accentFill = useGradient ? 'url(#accentGrad)' : (color || '#00E676');

  return (
    <Svg width={size} height={size} viewBox="0 0 120 120" fill="none">
      {useGradient && (
        <Defs>
          <SvgGradient id="iconGrad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={gradientColors[0]} />
            <Stop offset="1" stopColor={gradientColors[1]} />
          </SvgGradient>
          <SvgGradient id="accentGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={gradientColors[0]} stopOpacity="0.7" />
            <Stop offset="1" stopColor={gradientColors[1]} stopOpacity="0.5" />
          </SvgGradient>
        </Defs>
      )}

      {/* Cat silhouette curled into P shape */}
      <G>
        {/* Body — the vertical stroke of "P", a sitting cat's back/tail */}
        <Path
          d="M38 108 C38 108 36 95 36 80 L36 52 C36 52 36 40 42 32
             C48 24 56 20 60 18 C60 18 54 14 50 8
             C48 5 50 2 54 4 C58 6 62 10 64 14
             C68 10 74 6 78 4 C82 2 84 5 82 8
             C78 14 72 18 72 18 C80 22 88 30 90 42
             C92 54 84 68 72 72 C64 74 56 72 50 66
             L50 80 C50 95 48 108 48 108 Z"
          fill={fill}
        />

        {/* Ear left — pointed */}
        <Path
          d="M50 8 C50 8 44 18 42 24 C42 24 48 16 54 14 Z"
          fill={fill}
        />

        {/* Ear right — pointed */}
        <Path
          d="M82 8 C82 8 88 18 90 24 C90 24 78 14 72 14 Z"
          fill={fill}
        />

        {/* Eye */}
        <Circle cx="58" cy="38" r="3.5" fill="#FFF" />
        <Circle cx="58" cy="38" r="1.8" fill="#2C2825" />

        {/* Nose */}
        <Path
          d="M62 45 L64 48 L60 48 Z"
          fill="#A3B296"
        />

        {/* Whiskers — left */}
        <Path d="M54 46 L40 43" stroke="#FFF" strokeWidth="1" strokeLinecap="round" opacity="0.6" />
        <Path d="M54 48 L40 50" stroke="#FFF" strokeWidth="1" strokeLinecap="round" opacity="0.6" />

        {/* Whiskers — right */}
        <Path d="M68 46 L82 43" stroke="#FFF" strokeWidth="1" strokeLinecap="round" opacity="0.6" />
        <Path d="M68 48 L82 50" stroke="#FFF" strokeWidth="1" strokeLinecap="round" opacity="0.6" />

        {/* Tail curl — the round part of "P" */}
        <Path
          d="M72 72 C72 72 84 66 88 54 C92 42 84 30 72 28
             C60 26 50 34 50 44 C50 54 58 60 66 58
             C74 56 78 48 74 42"
          fill="none"
          stroke={fill}
          strokeWidth="6"
          strokeLinecap="round"
          opacity="0.3"
        />
      </G>

      {/* Mini paw print accent — bottom right */}
      <G opacity="0.85">
        {/* Main pad */}
        <Path
          d="M92 96 C92 92 96 88 100 88 C104 88 108 92 108 96
             C108 100 104 104 100 104 C96 104 92 100 92 96 Z"
          fill={accentFill}
        />
        {/* Toe pads */}
        <Circle cx="91" cy="86" r="3" fill={accentFill} />
        <Circle cx="98" cy="82" r="3.2" fill={accentFill} />
        <Circle cx="106" cy="84" r="3" fill={accentFill} />
        <Circle cx="111" cy="90" r="2.5" fill={accentFill} />
      </G>
    </Svg>
  );
};

// ─── Full Logo — Icon + Wordmark ─────────────────────────
// variant: 'full' | 'icon' | 'wordmark'
// theme: 'light' (white text) | 'dark' (dark text) | 'brand' (orange)
const PepeteLogo = ({
  size = 80,
  variant = 'full',
  theme = 'dark',
  tagline,
  style,
}) => {
  const textColor =
    theme === 'light' ? '#FFFFFF' :
    theme === 'brand' ? '#00E676' :
    '#2C2825';

  const taglineColor =
    theme === 'light' ? 'rgba(255,255,255,0.8)' :
    theme === 'brand' ? 'rgba(255, 107, 53, 0.7)' :
    'rgba(44,40,37,0.55)';

  const gradientColors =
    theme === 'light' ? ['#FFFFFF', 'rgba(255,255,255,0.85)'] :
    null; // Use the default orange gradient

  const iconGradient = theme === 'light'
    ? ['#FFFFFF', '#F0F0F0']
    : ['#00E676', '#00C853'];

  const iconColor = theme === 'light' ? '#FFFFFF' : undefined;

  const wordmarkSize = size * 0.5;
  const taglineSize = size * 0.16;
  const dotSize = size * 0.05;

  if (variant === 'icon') {
    return (
      <View style={[styles.container, style]}>
        <PepeteIcon size={size} gradientColors={iconGradient} color={iconColor} />
      </View>
    );
  }

  if (variant === 'wordmark') {
    return (
      <View style={[styles.container, style]}>
        <View style={styles.wordmarkRow}>
          <Text style={[styles.wordmark, { fontSize: wordmarkSize, color: textColor }]}>
            pépète
          </Text>
          <View style={[styles.accentDot, { width: dotSize, height: dotSize, backgroundColor: '#00E676' }]} />
        </View>
        {tagline && (
          <Text style={[styles.tagline, { fontSize: taglineSize, color: taglineColor }]}>
            {tagline}
          </Text>
        )}
      </View>
    );
  }

  // Full logo — icon + wordmark
  return (
    <View style={[styles.container, style]}>
      <PepeteIcon size={size} gradientColors={iconGradient} color={iconColor} />
      <View style={styles.wordmarkRow}>
        <Text style={[styles.wordmark, { fontSize: wordmarkSize, color: textColor }]}>
          pépète
        </Text>
        <View style={[styles.accentDot, {
          width: dotSize,
          height: dotSize,
          backgroundColor: theme === 'light' ? 'rgba(255,255,255,0.8)' : '#00E676',
        }]} />
      </View>
      {tagline && (
        <Text style={[styles.tagline, { fontSize: taglineSize, color: taglineColor }]}>
          {tagline}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  wordmarkRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginTop: 6,
  },
  wordmark: {
    fontFamily: 'PlayfairDisplay_700Bold',
    letterSpacing: 3,
    textTransform: 'lowercase',
  },
  accentDot: {
    borderRadius: 50,
    marginLeft: 2,
    marginBottom: '12%',
  },
  tagline: {
    fontFamily: 'DMSans_500Medium',
    letterSpacing: 0.5,
    marginTop: 6,
  },
});

export { PepeteIcon };
export default PepeteLogo;
