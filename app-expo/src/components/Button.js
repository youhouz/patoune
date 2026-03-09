import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
const colors = require('../utils/colors');
const { SHADOWS, RADIUS } = require('../utils/colors');

const Button = ({
  title, onPress, loading, style, textStyle,
  variant = 'primary', disabled, icon, size = 'md',
  fullWidth = true
}) => {
  // Generous touch targets — accessible for all ages
  const sizeStyles = {
    sm: { paddingVertical: 12, paddingHorizontal: 18, minHeight: 46 },
    md: { paddingVertical: 15, paddingHorizontal: 26, minHeight: 54 },
    lg: { paddingVertical: 19, paddingHorizontal: 32, minHeight: 62 },
  };

  const fontSizes = { sm: 15, md: 17, lg: 19 };

  if (variant === 'primary') {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={loading || disabled}
        activeOpacity={0.85}
        style={[fullWidth && { width: '100%' }, style]}
      >
        <LinearGradient
          colors={disabled ? ['#CCC', '#BBB'] : ['#7B8B6F', '#96A88A']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[
            styles.button, sizeStyles[size],
            { borderRadius: RADIUS.lg },
            !disabled && SHADOWS.glow('#7B8B6F'),
          ]}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" size="small" />
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
      border: colors.primary,
      textColor: colors.primary,
    },
    secondary: {
      bg: colors.primarySoft,
      border: 'transparent',
      textColor: colors.primary,
    },
    ghost: {
      bg: 'transparent',
      border: 'transparent',
      textColor: colors.primary,
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
          borderWidth: variant === 'outline' ? 2 : 0,
          borderColor: v.border,
          borderRadius: RADIUS.lg,
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
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  primaryText: {
    color: '#FFF',
  },
  disabled: {
    opacity: 0.5,
  },
});

export default Button;
