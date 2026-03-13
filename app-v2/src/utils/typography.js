import { Platform } from 'react-native';
import { FONT_SIZE, COLORS } from './colors';

export const FONTS = {
  brand: 'DMSans_700Bold',
  heading: 'DMSans_700Bold',
  body: 'DMSans_400Regular',
  bodyMedium: 'DMSans_500Medium',
  bodySemiBold: 'DMSans_700Bold',
};

const FALLBACK = Platform.select({
  web: 'system-ui, -apple-system, sans-serif',
  default: undefined,
});

export const TEXT_STYLES = {
  brand: {
    fontFamily: FONTS.brand,
    fontSize: FONT_SIZE['4xl'],
    lineHeight: FONT_SIZE['4xl'] * 1.1,
    color: COLORS.text,
    letterSpacing: -1.5,
  },
  brandSmall: {
    fontFamily: FONTS.brand,
    fontSize: FONT_SIZE['2xl'],
    lineHeight: FONT_SIZE['2xl'] * 1.15,
    color: COLORS.text,
    letterSpacing: -1.0,
  },
  h1: {
    fontFamily: FONTS.heading,
    fontSize: FONT_SIZE['3xl'],
    lineHeight: FONT_SIZE['3xl'] * 1.2,
    color: COLORS.text,
    letterSpacing: -0.8,
  },
  h2: {
    fontFamily: FONTS.heading,
    fontSize: FONT_SIZE['2xl'],
    lineHeight: FONT_SIZE['2xl'] * 1.25,
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  h3: {
    fontFamily: FONTS.heading,
    fontSize: FONT_SIZE.xl,
    lineHeight: FONT_SIZE.xl * 1.3,
    color: COLORS.text,
    letterSpacing: -0.3,
  },
  h4: {
    fontFamily: FONTS.heading,
    fontSize: FONT_SIZE.lg,
    lineHeight: FONT_SIZE.lg * 1.35,
    color: COLORS.text,
    letterSpacing: -0.2,
  },
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
    lineHeight: FONT_SIZE.sm * 1.5,
    color: COLORS.textSecondary,
  },
  bodySmallMedium: {
    fontFamily: FONTS.bodyMedium,
    fontSize: FONT_SIZE.sm,
    lineHeight: FONT_SIZE.sm * 1.5,
    color: COLORS.textSecondary,
  },
  button: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZE.md,
    letterSpacing: 0,
  },
  buttonSmall: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZE.sm,
    letterSpacing: 0,
  },
  label: {
    fontFamily: FONTS.bodyMedium,
    fontSize: FONT_SIZE.sm,
    lineHeight: FONT_SIZE.sm * 1.4,
    color: COLORS.textSecondary,
    letterSpacing: 0.1,
  },
  caption: {
    fontFamily: FONTS.bodyMedium,
    fontSize: FONT_SIZE.xs,
    lineHeight: FONT_SIZE.xs * 1.4,
    color: COLORS.textTertiary,
  },
  overline: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZE.xs,
    lineHeight: FONT_SIZE.xs * 1.4,
    color: COLORS.textTertiary,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  input: {
    fontFamily: FONTS.bodyMedium,
    fontSize: FONT_SIZE.base,
    color: COLORS.text,
  },
  inputLabel: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZE.sm,
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  tabLabel: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZE.xs,
  },
  navTitle: {
    fontFamily: FONTS.heading,
    fontSize: FONT_SIZE.lg,
    color: COLORS.text,
    letterSpacing: -0.2,
  },
};

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
