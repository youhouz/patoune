// Pépète Design System — v4.0 (San Francisco Agency Edition)
// Brand: Ultra-modern, high-contrast, minimalist, vibrant gradient

const COLORS = {
  // Brand Primary — Electric Indigo
  primary: '#4F46E5', // Indigo 600
  primaryLight: '#818CF8', // Indigo 400
  primaryDark: '#3730A3', // Indigo 800
  primarySoft: '#EEF2FF', // Indigo 50
  primaryGlow: 'rgba(79, 70, 229, 0.25)',

  // Brand Secondary — Rose/Coral
  secondary: '#F43F5E', // Rose 500
  secondaryLight: '#FB7185', // Rose 400
  secondaryDark: '#BE123C', // Rose 700
  secondarySoft: '#FFF1F2', // Rose 50

  // Accent — Emerald 
  accent: '#10B981',
  accentLight: '#34D399',
  accentSoft: '#D1FAE5',

  // Backgrounds - Ultra clean Minimalist
  white: '#FFFFFF',
  background: '#F8FAFC', // Slate 50
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  card: '#FFFFFF',
  border: '#E2E8F0', // Slate 200
  borderLight: '#F1F5F9', // Slate 100
  divider: '#F1F5F9',

  // Text — High contrast slate/black
  text: '#0F172A', // Slate 900
  textPrimary: '#0F172A',
  textSecondary: '#475569', // Slate 600
  textTertiary: '#94A3B8', // Slate 400
  textLight: '#CBD5E1', // Slate 300
  textInverse: '#FFFFFF',
  placeholder: '#A1A1AA', // Zinc 400

  // Nutrition Scores - Modern styling
  scoreExcellent: '#059669',
  scoreGood: '#10B981',
  scoreMediocre: '#F59E0B',
  scoreBad: '#EA580C',
  scoreVeryBad: '#DC2626',

  scoreExcellentBg: '#ECFDF5',
  scoreGoodBg: '#F0FDF4',
  scoreMediocreBg: '#FFFBEB',
  scoreBadBg: '#FFF7ED',
  scoreVeryBadBg: '#FEF2F2',

  // Functional Colors
  success: '#10B981',
  successSoft: '#D1FAE5',
  warning: '#F59E0B',
  warningSoft: '#FEF3C7',
  error: '#EF4444',
  errorSoft: '#FEE2E2',
  info: '#3B82F6',
  infoSoft: '#DBEAFE',

  // Semantic aliases — Tech minimalist
  cream: '#F8FAFC',
  linen: '#F1F5F9',
  charcoal: '#0F172A',
  stone: '#475569',
  pebble: '#94A3B8',
  sand: '#CBD5E1',

  // Shadows & Overlays
  shadow: 'rgba(15, 23, 42, 0.04)',
  shadowMedium: 'rgba(15, 23, 42, 0.08)',
  overlay: 'rgba(15, 23, 42, 0.6)',
  overlayLight: 'rgba(15, 23, 42, 0.3)',

  // Gradients for modern glow
  gradientPrimary: ['#4F46E5', '#6366F1'],
  gradientWarm: ['#F43F5E', '#FB7185'],
  gradientSuccess: ['#10B981', '#34D399'],
  gradientAccent: ['#06B6D4', '#22D3EE'],
  gradientDark: ['#0F172A', '#1E293B'],
  gradientCharcoal: ['#0F172A', '#1E293B'],
  gradientHero: ['#4F46E5', '#818CF8', '#C7D2FE'],
};

// Spacing — crisp, geometric rhythm
const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 24,
  xl: 32,
  '2xl': 40,
  '3xl': 48,
  '4xl': 64,
  '5xl': 80,
};

// Border Radius - Apple-like rounded corners (squircle feel)
const RADIUS = {
  xs: 6,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
  full: 9999,
};

// Font Sizes
const FONT_SIZE = {
  xs: 12,
  sm: 14,
  base: 16,
  md: 18,
  lg: 20,
  xl: 24,
  '2xl': 30,
  '3xl': 36,
  '4xl': 48,
  '5xl': 60,
};

// Modern, diffusion-like shadows
const SHADOWS = {
  sm: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 4,
  },
  lg: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 8,
  },
  xl: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.1,
    shadowRadius: 32,
    elevation: 12,
  },
  glow: function(color) {
    return {
      shadowColor: color || '#4F46E5',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.25,
      shadowRadius: 20,
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
  return 'À éviter';
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
