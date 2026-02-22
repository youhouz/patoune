// Patoune Design System - Colors & Tokens
// Modern, warm, trustworthy palette for pet care

export const COLORS = {
  // Primary - Warm Orange (brand identity)
  primary: '#FF6B35',
  primaryLight: '#FF8F65',
  primaryDark: '#E55A25',
  primarySoft: '#FFF0EB',
  primaryGlow: 'rgba(255, 107, 53, 0.15)',

  // Secondary - Nature Green (health, trust)
  secondary: '#2ECC71',
  secondaryLight: '#58D68D',
  secondaryDark: '#27AE60',
  secondarySoft: '#E8F8F0',

  // Accent - Deep Purple (premium feel)
  accent: '#6C5CE7',
  accentLight: '#A29BFE',
  accentSoft: '#F0EEFF',

  // Neutrals
  white: '#FFFFFF',
  background: '#FAFBFD',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  card: '#FFFFFF',
  border: '#F0F1F3',
  borderLight: '#F7F8FA',
  divider: '#ECEDF0',

  // Text
  text: '#1A1D26',
  textPrimary: '#1A1D26',
  textSecondary: '#6B7280',
  textTertiary: '#9CA3AF',
  textLight: '#B0B7C3',
  textInverse: '#FFFFFF',
  placeholder: '#B0B7C3',

  // Scores
  scoreExcellent: '#10B981',
  scoreGood: '#34D399',
  scoreMediocre: '#FBBF24',
  scoreBad: '#F97316',
  scoreVeryBad: '#EF4444',

  scoreExcellentBg: '#ECFDF5',
  scoreGoodBg: '#F0FDF9',
  scoreMediocreBg: '#FFFBEB',
  scoreBadBg: '#FFF7ED',
  scoreVeryBadBg: '#FEF2F2',

  // Functional
  success: '#10B981',
  successSoft: '#ECFDF5',
  warning: '#F59E0B',
  warningSoft: '#FFFBEB',
  error: '#EF4444',
  errorSoft: '#FEF2F2',
  info: '#3B82F6',
  infoSoft: '#EFF6FF',

  // Shadows & Overlay
  shadow: 'rgba(0, 0, 0, 0.04)',
  shadowMedium: 'rgba(0, 0, 0, 0.08)',
  overlay: 'rgba(0, 0, 0, 0.5)',
  overlayLight: 'rgba(0, 0, 0, 0.3)',

  // Gradients
  gradientPrimary: ['#FF6B35', '#FF8F65'],
  gradientWarm: ['#FF6B35', '#FBBF24'],
  gradientSuccess: ['#10B981', '#34D399'],
  gradientAccent: ['#6C5CE7', '#A29BFE'],
  gradientDark: ['#1A1D26', '#2D3142'],
};

export const SPACING = {
  xs: 4, sm: 8, md: 12, base: 16, lg: 20, xl: 24, '2xl': 32, '3xl': 40, '4xl': 48, '5xl': 64,
};

export const RADIUS = {
  xs: 6, sm: 8, md: 12, lg: 16, xl: 20, '2xl': 24, '3xl': 32, full: 999,
};

export const FONT_SIZE = {
  xs: 11, sm: 13, base: 15, md: 16, lg: 18, xl: 20, '2xl': 24, '3xl': 28, '4xl': 34, '5xl': 42,
};

export const SHADOWS = {
  sm: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3, elevation: 1 },
  md: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
  lg: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 16, elevation: 6 },
  xl: { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.1, shadowRadius: 24, elevation: 10 },
  glow: (color = '#FF6B35') => ({
    shadowColor: color, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 8,
  }),
};

export const getScoreColor = (score) => {
  if (score >= 80) return COLORS.scoreExcellent;
  if (score >= 60) return COLORS.scoreGood;
  if (score >= 40) return COLORS.scoreMediocre;
  if (score >= 20) return COLORS.scoreBad;
  return COLORS.scoreVeryBad;
};

export const getScoreBg = (score) => {
  if (score >= 80) return COLORS.scoreExcellentBg;
  if (score >= 60) return COLORS.scoreGoodBg;
  if (score >= 40) return COLORS.scoreMediocreBg;
  if (score >= 20) return COLORS.scoreBadBg;
  return COLORS.scoreVeryBadBg;
};

export const getScoreLabel = (score) => {
  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'Bon';
  if (score >= 40) return 'Moyen';
  if (score >= 20) return 'Mauvais';
  return 'Tres mauvais';
};

// Backward compat default export
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
