const COLORS = {
  primary:        '#6B8F71',
  primaryLight:   '#8CB092',
  primaryDark:    '#527A56',
  primarySoft:    '#EFF5F0',
  primaryGlow:    'rgba(107, 143, 113, 0.12)',
  primaryMuted:   '#D4E5D6',
  primaryUltra:   '#F5FAF6',

  secondary:      '#527A56',
  secondaryLight: '#6B8F71',
  secondaryDark:  '#3D5E41',
  secondarySoft:  '#EFF5F0',

  accent:         '#C4956A',
  accentLight:    '#D4AD86',
  accentDark:     '#A67B52',
  accentSoft:     '#FDF5ED',

  tertiary:       '#B8A88A',
  tertiaryLight:  '#D4C8AE',
  tertiarySoft:   '#FAF7F2',

  white:          '#FFFFFF',
  background:     '#FAF7F2',
  surface:        '#FFFFFF',
  surfaceElevated:'#FFFFFF',
  card:           '#FFFFFF',
  border:         '#E8E2D8',
  borderLight:    '#F0ECE4',
  borderSubtle:   '#F5F1EB',
  divider:        '#EDE8E0',

  glass:          'rgba(255, 255, 255, 0.72)',
  glassBorder:    'rgba(255, 255, 255, 0.20)',
  glassOverlay:   'rgba(255, 255, 255, 0.85)',

  dark:           '#2C3E2F',
  darkSurface:    '#3A4E3D',
  darkCard:       '#485E4B',
  darkMuted:      '#5A6E5D',

  text:           '#2C3E2F',
  textPrimary:    '#2C3E2F',
  textSecondary:  '#6B7E6E',
  textTertiary:   '#8A9A8C',
  textLight:      '#B0BEB2',
  textInverse:    '#FFFFFF',
  placeholder:    '#A0AEA2',

  scoreExcellent:   '#527A56',
  scoreGood:        '#6B8F71',
  scoreMediocre:    '#C4956A',
  scoreBad:         '#D4855A',
  scoreVeryBad:     '#C25B4A',

  scoreExcellentBg: '#EFF5F0',
  scoreGoodBg:      '#F0F6F1',
  scoreMediocreBg:  '#FDF5ED',
  scoreBadBg:       '#FDF0E8',
  scoreVeryBadBg:   '#FBE8E4',

  success:     '#527A56',
  successSoft: '#EFF5F0',
  warning:     '#C4956A',
  warningSoft: '#FDF5ED',
  error:       '#C25B4A',
  errorSoft:   '#FBE8E4',
  info:        '#6B8F71',
  infoSoft:    '#EFF5F0',

  cream:     '#FAF7F2',
  linen:     '#F5F1EB',
  charcoal:  '#2C3E2F',
  stone:     '#6B7E6E',
  pebble:    '#8A9A8C',
  sand:      '#B0BEB2',

  shadow:       'rgba(44, 62, 47, 0.03)',
  shadowMedium: 'rgba(44, 62, 47, 0.06)',
  shadowHeavy:  'rgba(44, 62, 47, 0.10)',
  overlay:      'rgba(44, 62, 47, 0.55)',
  overlayLight: 'rgba(44, 62, 47, 0.25)',

  gradientPrimary:   ['#6B8F71', '#8CB092'],
  gradientWarm:      ['#6B8F71', '#C4956A'],
  gradientSuccess:   ['#527A56', '#6B8F71'],
  gradientAccent:    ['#C4956A', '#D4AD86'],
  gradientDark:      ['#2C3E2F', '#3A4E3D'],
  gradientHero:      ['#527A56', '#6B8F71', '#8CB092'],
  gradientCharcoal:  ['#2C3E2F', '#3A4E3D'],
  gradientSunrise:   ['#6B8F71', '#C4956A'],
  gradientOcean:     ['#6B8F71', '#8CB092'],
  gradientForest:    ['#527A56', '#6B8F71'],
  gradientMidnight:  ['#3A4E3D', '#5A6E5D'],
  gradientGlass:     ['rgba(255,255,255,0.95)', 'rgba(255,255,255,0.80)'],
};

const SPACING = {
  xs:   4,
  sm:   8,
  md:   12,
  base: 16,
  lg:   20,
  xl:   24,
  '2xl': 32,
  '3xl': 40,
  '4xl': 48,
  '5xl': 64,
  '6xl': 80,
};

const RADIUS = {
  xs:   8,
  sm:   12,
  md:   16,
  lg:   20,
  xl:   24,
  '2xl': 28,
  '3xl': 36,
  pill:  999,
  full:  999,
};

const FONT_SIZE = {
  '2xs':  11,
  xs:   12,
  sm:   14,
  base: 16,
  md:   17,
  lg:   19,
  xl:   22,
  '2xl': 26,
  '3xl': 32,
  '4xl': 38,
  '5xl': 48,
};

const SHADOWS = {
  xs: {
    shadowColor: '#2C3E2F',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  sm: {
    shadowColor: '#2C3E2F',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  md: {
    shadowColor: '#2C3E2F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 4,
  },
  lg: {
    shadowColor: '#2C3E2F',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 28,
    elevation: 8,
  },
  xl: {
    shadowColor: '#2C3E2F',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.12,
    shadowRadius: 40,
    elevation: 12,
  },
  glow: function(color) {
    return {
      shadowColor: color || '#6B8F71',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.28,
      shadowRadius: 20,
      elevation: 10,
    };
  },
  soft: {
    shadowColor: '#2C3E2F',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 1,
  },
  card: {
    shadowColor: '#2C3E2F',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  float: {
    shadowColor: '#2C3E2F',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.10,
    shadowRadius: 32,
    elevation: 10,
  },
};

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

module.exports = COLORS;
module.exports.COLORS = COLORS;
module.exports.SPACING = SPACING;
module.exports.RADIUS = RADIUS;
module.exports.FONT_SIZE = FONT_SIZE;
module.exports.SHADOWS = SHADOWS;
module.exports.getScoreColor = getScoreColor;
module.exports.getScoreBg = getScoreBg;
module.exports.getScoreLabel = getScoreLabel;
