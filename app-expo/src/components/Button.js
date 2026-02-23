// ---------------------------------------------------------------------------
// Patoune v2.0 - Button Component
// Premium button with 6 variants and 3 sizes.
// Uses terracotta gradient for primary CTA, DM Sans typography,
// and haptic feedback for a tactile native feel.
// ---------------------------------------------------------------------------

import React, { useCallback } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Feather } from '@expo/vector-icons';
import { COLORS, SHADOWS, RADIUS } from '../utils/colors';
import { FONTS, TEXT_STYLES } from '../utils/typography';


// ---------------------------------------------------------------------------
// Size presets
// ---------------------------------------------------------------------------
const SIZE_STYLES = {
  sm: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    minHeight: 40,
    iconSize: 16,
    fontSize: 14,
    iconGap: 6,
  },
  md: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    minHeight: 52,
    iconSize: 18,
    fontSize: 16,
    iconGap: 8,
  },
  lg: {
    paddingVertical: 18,
    paddingHorizontal: 32,
    minHeight: 58,
    iconSize: 20,
    fontSize: 18,
    iconGap: 10,
  },
};


// ---------------------------------------------------------------------------
// Variant configurations
// ---------------------------------------------------------------------------
const VARIANTS = {
  secondary: {
    bg: COLORS.secondary,
    textColor: COLORS.textInverse,
    borderWidth: 0,
    borderColor: 'transparent',
  },
  outline: {
    bg: 'transparent',
    textColor: COLORS.primary,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },
  soft: {
    bg: COLORS.primarySoft,
    textColor: COLORS.primaryDark,
    borderWidth: 0,
    borderColor: 'transparent',
  },
  ghost: {
    bg: 'transparent',
    textColor: COLORS.primary,
    borderWidth: 0,
    borderColor: 'transparent',
  },
  danger: {
    bg: COLORS.errorSoft,
    textColor: COLORS.error,
    borderWidth: 0,
    borderColor: 'transparent',
  },
};


/**
 * Premium button component.
 *
 * @param {object} props
 * @param {string}  props.title                     - Button label text
 * @param {function} props.onPress                  - Press handler
 * @param {boolean} [props.loading=false]           - Show loading spinner
 * @param {boolean} [props.disabled=false]          - Disable interactions
 * @param {string}  [props.icon]                    - Feather icon name (left side)
 * @param {'primary'|'secondary'|'outline'|'soft'|'ghost'|'danger'} [props.variant='primary']
 * @param {'sm'|'md'|'lg'} [props.size='md']
 * @param {boolean} [props.fullWidth=true]          - Stretch to container width
 * @param {object}  [props.style]                   - Container style override
 * @param {object}  [props.textStyle]               - Text style override
 */
const Button = ({
  title,
  onPress,
  loading = false,
  disabled = false,
  icon,
  variant = 'primary',
  size = 'md',
  fullWidth = true,
  style,
  textStyle,
}) => {
  const sizeConfig = SIZE_STYLES[size] || SIZE_STYLES.md;

  // Trigger light haptic feedback on press (native only)
  const handlePress = useCallback((...args) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress?.(...args);
  }, [onPress]);

  // Shared inner content (icon + label or spinner)
  const renderContent = (textColor) => {
    if (loading) {
      return <ActivityIndicator color={textColor} size="small" />;
    }

    return (
      <View style={[styles.content, { gap: sizeConfig.iconGap }]}>
        {icon ? (
          <Feather name={icon} size={sizeConfig.iconSize} color={textColor} />
        ) : null}
        <Text
          style={[
            styles.label,
            {
              fontFamily: FONTS.bodySemiBold,
              fontSize: sizeConfig.fontSize,
              color: textColor,
            },
            textStyle,
          ]}
          numberOfLines={1}
        >
          {title}
        </Text>
      </View>
    );
  };


  // ---- Primary variant: terracotta gradient ----
  if (variant === 'primary') {
    return (
      <TouchableOpacity
        onPress={handlePress}
        disabled={loading || disabled}
        activeOpacity={0.85}
        style={[fullWidth && styles.fullWidth, style]}
        accessibilityRole="button"
        accessibilityLabel={title}
        accessibilityState={{ disabled: loading || disabled }}
      >
        <LinearGradient
          colors={disabled ? [COLORS.sand, COLORS.sand] : COLORS.gradientPrimary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[
            styles.base,
            {
              paddingVertical: sizeConfig.paddingVertical,
              paddingHorizontal: sizeConfig.paddingHorizontal,
              minHeight: sizeConfig.minHeight,
              borderRadius: RADIUS.lg,
            },
            !disabled && SHADOWS.glow(COLORS.primary),
          ]}
        >
          {renderContent(COLORS.textInverse)}
        </LinearGradient>
      </TouchableOpacity>
    );
  }


  // ---- Secondary variant: solid forest sage with subtle shadow ----
  if (variant === 'secondary') {
    const v = VARIANTS.secondary;
    return (
      <TouchableOpacity
        onPress={handlePress}
        disabled={loading || disabled}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel={title}
        accessibilityState={{ disabled: loading || disabled }}
        style={[
          styles.base,
          {
            backgroundColor: disabled ? COLORS.sand : v.bg,
            paddingVertical: sizeConfig.paddingVertical,
            paddingHorizontal: sizeConfig.paddingHorizontal,
            minHeight: sizeConfig.minHeight,
            borderRadius: RADIUS.lg,
          },
          !disabled && SHADOWS.glow(COLORS.secondary),
          disabled && styles.disabled,
          fullWidth && styles.fullWidth,
          style,
        ]}
      >
        {renderContent(disabled ? COLORS.textLight : v.textColor)}
      </TouchableOpacity>
    );
  }


  // ---- All other variants (outline, soft, ghost, danger) ----
  const v = VARIANTS[variant] || VARIANTS.outline;

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={loading || disabled}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: loading || disabled }}
      style={[
        styles.base,
        {
          backgroundColor: v.bg,
          borderWidth: v.borderWidth,
          borderColor: disabled ? COLORS.sand : v.borderColor,
          paddingVertical: sizeConfig.paddingVertical,
          paddingHorizontal: sizeConfig.paddingHorizontal,
          minHeight: sizeConfig.minHeight,
          borderRadius: RADIUS.lg,
        },
        disabled && styles.disabled,
        fullWidth && styles.fullWidth,
        style,
      ]}
    >
      {renderContent(disabled ? COLORS.textLight : v.textColor)}
    </TouchableOpacity>
  );
};


// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  label: {
    letterSpacing: 0.2,
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.5,
  },
});

export default Button;
