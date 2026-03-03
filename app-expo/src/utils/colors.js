// Patoune Design System — v2.0
// Brand: warm orange + clean white, Revolut-inspired, accessible for all ages

const COLORS = {
  // Brand Primary — Warm Orange
  primary: '#FF6B35',
  primaryLight: '#FF8F65',
  primaryDark: '#E55A25',
  primarySoft: '#FFF3EE',
  primaryGlow: 'rgba(255, 107, 53, 0.15)',

  // Brand Secondary — Nature Green
  secondary: '#2ECC71',
  secondaryLight: '#58D68D',
  secondaryDark: '#27AE60',
  secondarySoft: '#EAFAF1',

  // Accent — Indigo
  accent: '#5B5BD6',
  accentLight: '#8B8BF5',
  accentSoft: '#EFEFFF',

  // Backgrounds
  white: '#FFFFFF',
  background: '#F5F7FA',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  card: '#FFFFFF',
  border: '#E8EAF0',
  borderLight: '#F0F2F7',
  divider: '#ECEDF0',

  // Text — high contrast for readability
  text: '#111827',
  textPrimary: '#111827',
  textSecondary: '#4B5563',
  textTertiary: '#9CA3AF',
  textLight: '#C4C9D4',
  textInverse: '#FFFFFF',
  placeholder: '#B0B7C3',

  // Nutrition Scores
  scoreExcellent: '#059669',
  scoreGood: '#10B981',
  scoreMediocre: '#D97706',
  scoreBad: '#EA580C',
  scoreVeryBad: '#DC2626',

  scoreExcellentBg: '#ECFDF5',
  scoreGoodBg: '#F0FDF4',
  scoreMediocreBg: '#FFFBEB',
  scoreBadBg: '#FFF7ED',
  scoreVeryBadBg: '#FEF2F2',

  // Functional Colors
  success: '#059669',
  successSoft: '#ECFDF5',
  warning: '#D97706',
  warningSoft: '#FFFBEB',
  error: '#DC2626',
  errorSoft: '#FEF2F2',
  info: '#2563EB',
  infoSoft: '#EFF6FF',

  // Shadows & Overlays
  shadow: 'rgba(0, 0, 0, 0.04)',
  shadowMedium: 'rgba(0, 0, 0, 0.08)',
  overlay: 'rgba(0, 0, 0, 0.5)',
  overlayLight: 'rgba(0, 0, 0, 0.25)',

  // Gradients (arrays for LinearGradient)
  gradientPrimary: ['#FF6B35', '#FF8F65'],
  gradientWarm: ['#FF6B35', '#FBBF24'],
  gradientSuccess: ['#059669', '#10B981'],
  gradientAccent: ['#5B5BD6', '#8B8BF5'],
  gradientDark: ['#111827', '#1F2937'],
  gradientHero: ['#FF6B35', '#FF8065', '#FFB088'],
};

// Spacing — generous for big fingers and readability
const SPACING = {
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

// Border Radius
const RADIUS = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 18,
  xl: 22,
  '2xl': 28,
  '3xl': 36,
  full: 999,
};

// Font Sizes — increased for children & grandmothers
const FONT_SIZE = {
  xs: 12,
  sm: 14,
  base: 16,
  md: 17,
  lg: 19,
  xl: 22,
  '2xl': 26,
  '3xl': 30,
  '4xl': 36,
  '5xl': 44,
};

// Shadows
const SHADOWS = {
  sm: {
    shadowColor: '#111827',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#111827',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 4,
  },
  lg: {
    shadowColor: '#111827',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.09,
    shadowRadius: 20,
    elevation: 8,
  },
  xl: {
    shadowColor: '#111827',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 30,
    elevation: 14,
  },
  glow: function(color) {
    return {
      shadowColor: color || '#FF6B35',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.35,
      shadowRadius: 14,
      elevation: 10,
    };
  },
};

// Score helpers
const getScoreColor = function(score) {
  if (score >= 80) return COLORS.scoreExcellent;
  if (score >= 60) return COLORS.scoreGood;
  if (score >= 40) return COLORS.scoreMediocre;
  if (score >= 20) return COLORS.scoreBad;
  return COLORS.scoreVeryBad;
};

const getScoreBg = function(score) {
  if (score >= 80) return COLORS.scoreExcellentBg;
  if (score >= 60) return COLORS.scoreGoodBg;
  if (score >= 40) return COLORS.scoreMediocreBg;
  if (score >= 20) return COLORS.scoreBadBg;
  return COLORS.scoreVeryBadBg;
};

const getScoreLabel = function(score) {
  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'Bon';
  if (score >= 40) return 'Moyen';
  if (score >= 20) return 'Mauvais';
  return 'A eviter';
};

// CommonJS exports — backward compatible with all existing require() calls
module.exports = COLORS;
module.exports.COLORS = COLORS;
module.exports.SPACING = SPACING;
module.exports.RADIUS = RADIUS;
module.exports.FONT_SIZE = FONT_SIZE;
module.exports.SHADOWS = SHADOWS;
module.exports.getScoreColor = getScoreColor;
module.exports.getScoreBg = getScoreBg;
module.exports.getScoreLabel = getScoreLabel;
