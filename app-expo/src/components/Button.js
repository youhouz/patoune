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
  const sizeStyles = {
    sm: { paddingVertical: 10, paddingHorizontal: 16, minHeight: 40 },
    md: { paddingVertical: 14, paddingHorizontal: 24, minHeight: 52 },
    lg: { paddingVertical: 18, paddingHorizontal: 32, minHeight: 58 },
  };

  const fontSizes = { sm: 14, md: 16, lg: 18 };

  if (variant === 'primary') {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={loading || disabled}
        activeOpacity={0.85}
        style={[fullWidth && { width: '100%' }, style]}
      >
        <LinearGradient
          colors={disabled ? ['#CCC', '#BBB'] : ['#FF6B35', '#FF8F65']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[
            styles.button, sizeStyles[size],
            { borderRadius: RADIUS.lg },
            !disabled && SHADOWS.glow('#FF6B35'),
          ]}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" size="small" />
          ) : (
            <View style={styles.content}>
              {icon && <Text style={styles.icon}>{icon}</Text>}
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
          borderWidth: variant === 'outline' ? 1.5 : 0,
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
          {icon && <Text style={styles.icon}>{icon}</Text>}
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
    fontSize: 18,
  },
  text: {
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  primaryText: {
    color: '#FFF',
  },
  disabled: {
    opacity: 0.5,
  },
});

export default Button;
