// ---------------------------------------------------------------------------
// Patoune v2.0 - Design System Tokens
// Aesthetic: "Terracotta Studio"
// Organic, sophisticated, inspired by artisanal ceramics & botanical illustration
// ---------------------------------------------------------------------------

export const COLORS = {
  // ---- Primary - Terracotta (brand identity) ----
  primary: '#C4704B',
  primaryLight: '#D4896A',
  primaryDark: '#A85A38',
  primarySoft: '#FDF0EB',
  primaryGlow: 'rgba(196, 112, 75, 0.15)',

  // ---- Secondary - Forest Sage (nature, trust) ----
  secondary: '#6B8F71',
  secondaryLight: '#8BAF8F',
  secondaryDark: '#4A7050',
  secondarySoft: '#EEF5EF',

  // ---- Accent - Dusty Gold (warmth, premium) ----
  accent: '#C4A35A',
  accentLight: '#D4B97A',
  accentSoft: '#FBF6EB',

  // ---- Neutrals - Warm ceramic tones ----
  charcoal: '#2C2825',
  stone: '#5C5650',
  pebble: '#8C8580',
  sand: '#C4BCB5',
  linen: '#F5F0EB',
  cream: '#FDFAF7',
  white: '#FFFFFF',

  // ---- Surfaces ----
  background: '#FDFAF7',
  surface: '#FFFFFF',
  card: '#FFFFFF',
  border: '#EDE8E3',
  borderLight: '#F5F0EB',

  // ---- Text ----
  text: '#2C2825',
  textPrimary: '#2C2825',
  textSecondary: '#5C5650',
  textTertiary: '#8C8580',
  textLight: '#C4BCB5',
  textInverse: '#FFFFFF',
  placeholder: '#C4BCB5',

  // ---- Functional states ----
  success: '#5A9E6F',
  successSoft: '#EEF5EF',
  warning: '#D4A14A',
  warningSoft: '#FBF6EB',
  error: '#C75050',
  errorSoft: '#FDF0EF',
  info: '#5A7EA0',
  infoSoft: '#EEF3F8',

  // ---- Score colors (scanner feature) ----
  scoreExcellent: '#5A9E6F',
  scoreGood: '#6B8F71',
  scoreMediocre: '#D4A14A',
  scoreBad: '#C4704B',
  scoreVeryBad: '#C75050',

  // Score backgrounds (backward compat)
  scoreExcellentBg: '#EEF5EF',
  scoreGoodBg: '#EEF5EF',
  scoreMediocreBg: '#FBF6EB',
  scoreBadBg: '#FDF0EB',
  scoreVeryBadBg: '#FDF0EF',

  // ---- Shadows & Overlays ----
  shadow: 'rgba(44, 40, 37, 0.04)',
  shadowMedium: 'rgba(44, 40, 37, 0.08)',
  overlay: 'rgba(44, 40, 37, 0.5)',
  overlayLight: 'rgba(44, 40, 37, 0.3)',

  // ---- Gradient arrays ----
  gradientPrimary: ['#C4704B', '#D4896A'],
  gradientWarm: ['#C4704B', '#C4A35A'],
  gradientForest: ['#4A7050', '#6B8F71'],
  gradientCharcoal: ['#2C2825', '#3D3835'],
  gradientGold: ['#C4A35A', '#D4B97A'],
  // Backward compat aliases
  gradientSuccess: ['#4A7050', '#6B8F71'],
  gradientAccent: ['#C4A35A', '#D4B97A'],
  gradientDark: ['#2C2825', '#3D3835'],
};


// ---------------------------------------------------------------------------
// Spacing scale (4px base unit)
// ---------------------------------------------------------------------------
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
  '4xl': 48,
  '5xl': 64,
};


// ---------------------------------------------------------------------------
// Border radius scale
// ---------------------------------------------------------------------------
export const RADIUS = {
  xs: 6,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  full: 999,
};


// ---------------------------------------------------------------------------
// Font size scale
// ---------------------------------------------------------------------------
export const FONT_SIZE = {
  xs: 11,
  sm: 13,
  base: 15,
  md: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 28,
  '4xl': 34,
  '5xl': 42,
};


// ---------------------------------------------------------------------------
// Shadow presets - warm tinted (charcoal, never pure black)
// ---------------------------------------------------------------------------
export const SHADOWS = {
  sm: {
    shadowColor: '#2C2825',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  md: {
    shadowColor: '#2C2825',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  lg: {
    shadowColor: '#2C2825',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 6,
  },
  xl: {
    shadowColor: '#2C2825',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 10,
  },
  // Colored glow - great for primary CTA buttons
  glow: (color = '#C4704B') => ({
    shadowColor: color,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  }),
};


// ---------------------------------------------------------------------------
// Score helpers (used by the product scanner)
// ---------------------------------------------------------------------------

/**
 * Returns the appropriate color for a given product health score.
 * @param {number} score - Value between 0 and 100
 * @returns {string} Hex color
 */
export const getScoreColor = (score) => {
  if (score >= 80) return COLORS.scoreExcellent;
  if (score >= 60) return COLORS.scoreGood;
  if (score >= 40) return COLORS.scoreMediocre;
  if (score >= 20) return COLORS.scoreBad;
  return COLORS.scoreVeryBad;
};

/**
 * Returns the soft background color for a given score.
 * @param {number} score
 * @returns {string} Hex color
 */
export const getScoreBg = (score) => {
  if (score >= 80) return COLORS.scoreExcellentBg;
  if (score >= 60) return COLORS.scoreGoodBg;
  if (score >= 40) return COLORS.scoreMediocreBg;
  if (score >= 20) return COLORS.scoreBadBg;
  return COLORS.scoreVeryBadBg;
};

/**
 * Returns a human-readable French label for a score.
 * @param {number} score
 * @returns {string}
 */
export const getScoreLabel = (score) => {
  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'Bon';
  if (score >= 40) return 'Moyen';
  if (score >= 20) return 'Mauvais';
  return 'Tres mauvais';
};


// ---------------------------------------------------------------------------
// Backward-compatible CommonJS exports
// Many existing screens use: const colors = require('../utils/colors');
// ---------------------------------------------------------------------------
const colors = COLORS;
module.exports = colors;
module.exports.COLORS = COLORS;
module.exports.SPACING = SPACING;
module.exports.RADIUS = RADIUS;
module.exports.FONT_SIZE = FONT_SIZE;
module.exports.SHADOWS = SHADOWS;
module.exports.getScoreColor = getScoreColor;
module.exports.getScoreBg = getScoreBg;
module.exports.getScoreLabel = getScoreLabel;
