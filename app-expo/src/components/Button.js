import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FONTS } from '../utils/typography';
const colors = require('../utils/colors');
const { SHADOWS, RADIUS } = require('../utils/colors');

const Button = ({
  title, onPress, loading, style, textStyle,
  variant = 'primary', disabled, icon, size = 'md',
  fullWidth = true
}) => {
  // Ultra-modern SF Agency sizing
  const sizeStyles = {
    sm: { paddingVertical: 12, paddingHorizontal: 16, minHeight: 44 },
    md: { paddingVertical: 16, paddingHorizontal: 24, minHeight: 56 },
    lg: { paddingVertical: 20, paddingHorizontal: 32, minHeight: 64 },
  };

  const fontSizes = { sm: 14, md: 16, lg: 18 };

  if (variant === 'primary') {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={loading || disabled}
        activeOpacity={0.8}
        style={[fullWidth && { width: '100%' }, style]}
      >
        <LinearGradient
          colors={disabled ? ['#E2E8F0', '#CBD5E1'] : colors.gradientPrimary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.button, sizeStyles[size],
            { borderRadius: RADIUS.full }, // Pill-shaped buttons are very modern
            !disabled && SHADOWS.glow(colors.primary),
          ]}
        >
          {loading ? (
            <ActivityIndicator color={colors.white} size="small" />
          ) : (
            <View style={styles.content}>
              {icon && <Text style={[styles.icon, { fontSize: fontSizes[size] }]}>{icon}</Text>}
              <Text style={[styles.text, styles.primaryText, { fontSize: fontSizes[size] }, textStyle]}>
                {title}
              </Text>
            </View>
          )}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  const variantStyles = {
    outline: {
      bg: 'transparent',
      border: colors.border,
      textColor: colors.textPrimary,
    },
    secondary: {
      bg: colors.primarySoft,
      border: 'transparent',
      textColor: colors.primary,
    },
    ghost: {
      bg: 'transparent',
      border: 'transparent',
      textColor: colors.textSecondary,
    },
    danger: {
      bg: colors.errorSoft,
      border: 'transparent',
      textColor: colors.error,
    },
  };

  const v = variantStyles[variant] || variantStyles.outline;

  return (
    <TouchableOpacity
      style={[
        styles.button, sizeStyles[size],
        {
          backgroundColor: v.bg,
          borderWidth: variant === 'outline' ? 1.5 : 0,
          borderColor: v.border,
          borderRadius: RADIUS.full, // Pill-shaped buttons
        },
        disabled && styles.disabled,
        fullWidth && { width: '100%' },
        style,
      ]}
      onPress={onPress}
      disabled={loading || disabled}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color={v.textColor} size="small" />
      ) : (
        <View style={styles.content}>
          {icon && <Text style={[styles.icon, { fontSize: fontSizes[size] }]}>{icon}</Text>}
          <Text style={[styles.text, { color: v.textColor, fontSize: fontSizes[size] }, textStyle]}>
            {title}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  icon: {
    lineHeight: undefined,
  },
  text: {
    fontFamily: FONTS.bodySemiBold,
    letterSpacing: -0.2, // Tighter tracking for modern look
  },
  primaryText: {
    color: '#FFFFFF',
  },
  disabled: {
    opacity: 0.5,
  },
});

export default Button;
