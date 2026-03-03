// ---------------------------------------------------------------------------
// Patoune v2.0 - Badge Component
// Status badge / pill for tags, roles, animal types, and verification.
// Compact, accessible, with optional Feather icon.
// ---------------------------------------------------------------------------

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS, RADIUS, SPACING } from '../utils/colors';
import { FONTS } from '../utils/typography';


// ---------------------------------------------------------------------------
// Predefined color schemes
// Pass a key to `color` for a quick preset, or pass a custom object.
// ---------------------------------------------------------------------------
const COLOR_PRESETS = {
  // Brand
  primary: {
    bg: COLORS.primarySoft,
    text: COLORS.primaryDark,
    icon: COLORS.primary,
  },
  secondary: {
    bg: COLORS.secondarySoft,
    text: COLORS.secondaryDark,
    icon: COLORS.secondary,
  },
  accent: {
    bg: COLORS.accentSoft,
    text: '#8A7A3A', // dark gold for readability
    icon: COLORS.accent,
  },

  // Functional
  success: {
    bg: COLORS.successSoft,
    text: '#3A7A4A',
    icon: COLORS.success,
  },
  warning: {
    bg: COLORS.warningSoft,
    text: '#8A6A2A',
    icon: COLORS.warning,
  },
  error: {
    bg: COLORS.errorSoft,
    text: COLORS.error,
    icon: COLORS.error,
  },
  info: {
    bg: COLORS.infoSoft,
    text: '#3A5A7A',
    icon: COLORS.info,
  },

  // Neutral
  neutral: {
    bg: COLORS.linen,
    text: COLORS.stone,
    icon: COLORS.pebble,
  },
};


// ---------------------------------------------------------------------------
// Size presets
// ---------------------------------------------------------------------------
const SIZE_CONFIG = {
  sm: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    fontSize: 11,
    iconSize: 11,
    gap: 3,
    borderRadius: RADIUS.sm,
  },
  md: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    fontSize: 13,
    iconSize: 13,
    gap: 4,
    borderRadius: RADIUS.md,
  },
};


/**
 * Status badge / pill component.
 *
 * @param {object}  props
 * @param {string}  props.label                     - Badge text
 * @param {string|object} [props.color='neutral']   - Preset name or custom { bg, text, icon }
 * @param {string}  [props.icon]                    - Feather icon name
 * @param {'sm'|'md'} [props.size='sm']             - Badge size
 * @param {object}  [props.style]                   - Container style override
 */
const Badge = ({
  label,
  color = 'neutral',
  icon,
  size = 'sm',
  style,
}) => {
  // Resolve color scheme: preset string or custom object
  const colors = typeof color === 'string'
    ? (COLOR_PRESETS[color] || COLOR_PRESETS.neutral)
    : color;

  const sizeConfig = SIZE_CONFIG[size] || SIZE_CONFIG.sm;

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: colors.bg,
          paddingVertical: sizeConfig.paddingVertical,
          paddingHorizontal: sizeConfig.paddingHorizontal,
          borderRadius: sizeConfig.borderRadius,
          gap: sizeConfig.gap,
        },
        style,
      ]}
      accessibilityRole="text"
      accessibilityLabel={label}
    >
      {icon ? (
        <Feather
          name={icon}
          size={sizeConfig.iconSize}
          color={colors.icon || colors.text}
        />
      ) : null}

      <Text
        style={[
          styles.label,
          {
            fontSize: sizeConfig.fontSize,
            color: colors.text,
          },
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );
};


// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  label: {
    fontFamily: FONTS.bodySemiBold,
    letterSpacing: 0.1,
  },
});

export default Badge;
