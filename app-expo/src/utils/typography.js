// ---------------------------------------------------------------------------
// Patoune v2.0 - Typography System
// Fonts: Playfair Display (brand/display) + DM Sans (UI/body)
// ---------------------------------------------------------------------------

import { Platform } from 'react-native';
import { FONT_SIZE, COLORS } from './colors';


// ---------------------------------------------------------------------------
// Font family constants
// These map to the font names loaded via @expo-google-fonts
// ---------------------------------------------------------------------------
export const FONTS = {
  /** Playfair Display Bold - used for the brand wordmark and hero headings */
  brand: 'PlayfairDisplay_700Bold',

  /** DM Sans Bold - section headings, card titles */
  heading: 'DMSans_700Bold',

  /** DM Sans Regular - body text, descriptions */
  body: 'DMSans_400Regular',

  /** DM Sans Medium - labels, navigation, subtle emphasis */
  bodyMedium: 'DMSans_500Medium',

  /** DM Sans SemiBold - buttons, badges, important labels */
  bodySemiBold: 'DMSans_600SemiBold',
};


// ---------------------------------------------------------------------------
// Fallback font family (before fonts are loaded, or on web)
// ---------------------------------------------------------------------------
const FALLBACK = Platform.select({
  web: 'system-ui, -apple-system, sans-serif',
  default: undefined,
});


// ---------------------------------------------------------------------------
// Pre-built text style presets
// Use these directly in StyleSheet or inline styles for consistency.
// ---------------------------------------------------------------------------
export const TEXT_STYLES = {
  // -- Brand / Display --
  brand: {
    fontFamily: FONTS.brand,
    fontSize: FONT_SIZE['4xl'],
    lineHeight: FONT_SIZE['4xl'] * 1.2,
    color: COLORS.text,
    letterSpacing: -0.5,
  },

  brandSmall: {
    fontFamily: FONTS.brand,
    fontSize: FONT_SIZE['2xl'],
    lineHeight: FONT_SIZE['2xl'] * 1.2,
    color: COLORS.text,
    letterSpacing: -0.3,
  },

  // -- Headings --
  h1: {
    fontFamily: FONTS.heading,
    fontSize: FONT_SIZE['3xl'],
    lineHeight: FONT_SIZE['3xl'] * 1.25,
    color: COLORS.text,
    letterSpacing: -0.3,
  },

  h2: {
    fontFamily: FONTS.heading,
    fontSize: FONT_SIZE['2xl'],
    lineHeight: FONT_SIZE['2xl'] * 1.3,
    color: COLORS.text,
    letterSpacing: -0.2,
  },

  h3: {
    fontFamily: FONTS.heading,
    fontSize: FONT_SIZE.xl,
    lineHeight: FONT_SIZE.xl * 1.3,
    color: COLORS.text,
  },

  h4: {
    fontFamily: FONTS.heading,
    fontSize: FONT_SIZE.lg,
    lineHeight: FONT_SIZE.lg * 1.35,
    color: COLORS.text,
  },

  // -- Body --
  body: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZE.base,
    lineHeight: FONT_SIZE.base * 1.5,
    color: COLORS.text,
  },

  bodyMedium: {
    fontFamily: FONTS.bodyMedium,
    fontSize: FONT_SIZE.base,
    lineHeight: FONT_SIZE.base * 1.5,
    color: COLORS.text,
  },

  bodySemiBold: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZE.base,
    lineHeight: FONT_SIZE.base * 1.5,
    color: COLORS.text,
  },

  bodySmall: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZE.sm,
    lineHeight: FONT_SIZE.sm * 1.45,
    color: COLORS.textSecondary,
  },

  bodySmallMedium: {
    fontFamily: FONTS.bodyMedium,
    fontSize: FONT_SIZE.sm,
    lineHeight: FONT_SIZE.sm * 1.45,
    color: COLORS.textSecondary,
  },

  // -- UI elements --
  button: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZE.md,
    letterSpacing: 0.2,
  },

  buttonSmall: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZE.sm,
    letterSpacing: 0.2,
  },

  label: {
    fontFamily: FONTS.bodyMedium,
    fontSize: FONT_SIZE.sm,
    lineHeight: FONT_SIZE.sm * 1.4,
    color: COLORS.textSecondary,
    letterSpacing: 0.1,
  },

  caption: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZE.xs,
    lineHeight: FONT_SIZE.xs * 1.4,
    color: COLORS.textTertiary,
  },

  overline: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZE.xs,
    lineHeight: FONT_SIZE.xs * 1.4,
    color: COLORS.textTertiary,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },

  // -- Input --
  input: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZE.base,
    color: COLORS.text,
  },

  inputLabel: {
    fontFamily: FONTS.bodyMedium,
    fontSize: FONT_SIZE.sm,
    color: COLORS.stone,
    marginBottom: 6,
  },

  // -- Navigation --
  tabLabel: {
    fontFamily: FONTS.bodyMedium,
    fontSize: FONT_SIZE.xs,
  },

  navTitle: {
    fontFamily: FONTS.heading,
    fontSize: FONT_SIZE.lg,
    color: COLORS.text,
  },
};


// ---------------------------------------------------------------------------
// Helper: build a custom text style from pieces
// ---------------------------------------------------------------------------

/**
 * Creates a text style object with sensible defaults.
 *
 * @param {object} options
 * @param {'brand'|'heading'|'body'|'bodyMedium'|'bodySemiBold'} [options.font='body']
 * @param {number} [options.size=15]
 * @param {string} [options.color=COLORS.text]
 * @param {number} [options.lineHeight] - auto-calculated if omitted
 * @param {number} [options.letterSpacing=0]
 * @returns {object} React Native text style
 */
export const textStyle = ({
  font = 'body',
  size = FONT_SIZE.base,
  color = COLORS.text,
  lineHeight,
  letterSpacing = 0,
} = {}) => ({
  fontFamily: FONTS[font] || FONTS.body,
  fontSize: size,
  lineHeight: lineHeight || Math.round(size * 1.45),
  color,
  ...(letterSpacing ? { letterSpacing } : {}),
});
