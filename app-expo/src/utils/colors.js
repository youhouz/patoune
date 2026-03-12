// ═══════════════════════════════════════════════════════════════════════════
// Pépète v7.0 — Dark Premium Design System 2027
// Inspired: Apple Intelligence × Revolut 3.0 × Arc Browser
// ═══════════════════════════════════════════════════════════════════════════

const COLORS = {
  // ── Backgrounds (dark spectrum) ──────────────────────────────────────────
  bg:             '#080B12',   // page background
  surface:        '#0E1118',   // cards, panels
  surfaceHigh:    '#141A27',   // elevated cards
  surfaceTop:     '#1A2133',   // modals, sheets
  surfaceHover:   '#1F2840',   // hover state

  // ── Glass morphism ────────────────────────────────────────────────────────
  glass:          'rgba(255,255,255,0.04)',
  glassHover:     'rgba(255,255,255,0.07)',
  glassBorder:    'rgba(255,255,255,0.07)',
  glassStrong:    'rgba(255,255,255,0.10)',
  glassOverlay:   'rgba(8,11,18,0.80)',

  // ── Brand Electric Green (Pépète identity) ────────────────────────────────
  primary:       '#00E676',
  primaryDark:   '#00C853',
  primaryDeep:   '#00A844',
  primaryGlow:   'rgba(0,230,118,0.20)',
  primarySoft:   'rgba(0,230,118,0.08)',
  primaryUltra:  'rgba(0,230,118,0.04)',
  primaryMuted:  'rgba(0,230,118,0.30)',
  primaryLight:  '#4FFFAB',

  // ── Secondary: Emerald tints ──────────────────────────────────────────────
  secondary:     '#00BFA5',
  secondaryLight:'#26D9BF',
  secondaryDark: '#009688',
  secondarySoft: 'rgba(0,191,165,0.08)',

  // ── Accent Violet (AI / premium features) ─────────────────────────────────
  accent:        '#A78BFA',
  accentDark:    '#7C3AED',
  accentLight:   '#C4B5FD',
  accentSoft:    'rgba(167,139,250,0.08)',
  accentGlow:    'rgba(167,139,250,0.18)',

  // ── Accent Cyan (Scanner) ─────────────────────────────────────────────────
  cyan:          '#22D3EE',
  cyanGlow:      'rgba(34,211,238,0.18)',
  cyanSoft:      'rgba(34,211,238,0.08)',

  // ── Accent Amber (warnings / scores) ─────────────────────────────────────
  amber:         '#FBBF24',
  amberGlow:     'rgba(251,191,36,0.18)',
  amberSoft:     'rgba(251,191,36,0.08)',

  // ── Functional ────────────────────────────────────────────────────────────
  success:       '#00E676',
  successSoft:   'rgba(0,230,118,0.08)',
  warning:       '#FBBF24',
  warningSoft:   'rgba(251,191,36,0.08)',
  error:         '#F87171',
  errorSoft:     'rgba(248,113,113,0.08)',
  info:          '#22D3EE',
  infoSoft:      'rgba(34,211,238,0.08)',

  // ── Text — crisp white hierarchy ──────────────────────────────────────────
  text:          '#F8FAFC',
  textPrimary:   '#F8FAFC',
  textSecondary: 'rgba(248,250,252,0.60)',
  textTertiary:  'rgba(248,250,252,0.35)',
  textLight:     'rgba(248,250,252,0.20)',
  textInverse:   '#080B12',
  placeholder:   'rgba(248,250,252,0.28)',

  // ── Nutrition Scores (vivid on dark) ──────────────────────────────────────
  scoreExcellent:   '#00E676',
  scoreGood:        '#4ADE80',
  scoreMediocre:    '#FBBF24',
  scoreBad:         '#FB923C',
  scoreVeryBad:     '#F87171',

  scoreExcellentBg: 'rgba(0,230,118,0.10)',
  scoreGoodBg:      'rgba(74,222,128,0.10)',
  scoreMediocreBg:  'rgba(251,191,36,0.10)',
  scoreBadBg:       'rgba(251,146,60,0.10)',
  scoreVeryBadBg:   'rgba(248,113,113,0.10)',

  // ── Borders — barely-there ────────────────────────────────────────────────
  border:        'rgba(255,255,255,0.07)',
  borderLight:   'rgba(255,255,255,0.04)',
  borderStrong:  'rgba(255,255,255,0.14)',
  borderSubtle:  'rgba(255,255,255,0.03)',
  divider:       'rgba(255,255,255,0.05)',

  // ── Shadows & Overlays ────────────────────────────────────────────────────
  shadow:        'rgba(0,0,0,0.35)',
  shadowMedium:  'rgba(0,0,0,0.55)',
  shadowHeavy:   'rgba(0,0,0,0.75)',
  overlay:       'rgba(8,11,18,0.85)',
  overlayLight:  'rgba(8,11,18,0.55)',

  // ── Backward compat aliases ───────────────────────────────────────────────
  white:         '#F8FAFC',
  background:    '#080B12',
  card:          '#141A27',
  dark:          '#080B12',
  cream:         '#0E1118',
  linen:         '#141A27',
  charcoal:      '#080B12',
  stone:         'rgba(248,250,252,0.60)',
  pebble:        'rgba(248,250,252,0.35)',
  sand:          'rgba(248,250,252,0.20)',

  // ── Gradients ─────────────────────────────────────────────────────────────
  gradientPrimary:   ['#00E676', '#00BFA5'],
  gradientWarm:      ['#00E676', '#A78BFA'],
  gradientSuccess:   ['#00C853', '#00E676'],
  gradientAccent:    ['#A78BFA', '#22D3EE'],
  gradientDark:      ['#080B12', '#141A27'],
  gradientHero:      ['#0E1118', '#141A27', '#1A2133'],
  gradientCharcoal:  ['#080B12', '#0E1118'],
  gradientSunrise:   ['#00E676', '#FBBF24'],
  gradientOcean:     ['#00BFA5', '#22D3EE'],
  gradientForest:    ['#00C853', '#00E676'],
  gradientMidnight:  ['#080B12', '#0E1118'],
  gradientGlass:     ['rgba(255,255,255,0.06)', 'rgba(255,255,255,0.02)'],
};

// -- Spacing — 4-point grid --
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

// -- Border Radius --
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

// -- Font Sizes --
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

// -- Shadows — layered depth --
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
      shadowColor: color || '#00E676',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.45,
      shadowRadius: 22,
      elevation: 12,
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

// -- Score helpers --
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

// CommonJS — backward compatible
module.exports = COLORS;
module.exports.COLORS = COLORS;
module.exports.SPACING = SPACING;
module.exports.RADIUS = RADIUS;
module.exports.FONT_SIZE = FONT_SIZE;
module.exports.SHADOWS = SHADOWS;
module.exports.getScoreColor = getScoreColor;
module.exports.getScoreBg = getScoreBg;
module.exports.getScoreLabel = getScoreLabel;
