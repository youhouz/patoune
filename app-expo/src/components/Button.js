import React, { useRef } from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, View, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
const colors = require('../utils/colors');
const { SHADOWS, RADIUS, FONT_SIZE } = require('../utils/colors');

const Button = ({
  title, onPress, loading, style, textStyle,
  variant = 'primary', disabled, icon, size = 'md',
  fullWidth = true
}) => {
  const sizeStyles = {
    sm: { paddingVertical: 13, paddingHorizontal: 20, minHeight: 48, borderRadius: RADIUS.md },
    md: { paddingVertical: 16, paddingHorizontal: 28, minHeight: 56, borderRadius: RADIUS.lg },
    lg: { paddingVertical: 18, paddingHorizontal: 34, minHeight: 62, borderRadius: RADIUS.xl },
  };

  const fontSizes = { sm: FONT_SIZE.sm, md: FONT_SIZE.md, lg: FONT_SIZE.lg };
  const sz = sizeStyles[size] || sizeStyles.md;

  const scaleAnim = useRef(new Animated.Value(1)).current;
  const spring = (val) => Animated.spring(scaleAnim, {
    toValue: val, tension: 320, friction: 10, useNativeDriver: true,
  }).start();

  if (variant === 'primary') {
    return (
      <TouchableOpacity
        onPress={onPress}
        onPressIn={() => spring(0.96)}
        onPressOut={() => spring(1)}
        disabled={loading || disabled}
        activeOpacity={0.9}
        style={[fullWidth && { width: '100%' }, style]}
      >
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <LinearGradient
          colors={disabled ? ['#D1D5DB', '#C6CAD0'] : ['#527A56', '#6B8F71']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.button, sz,
            !disabled && SHADOWS.glow('#527A56'),
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
        </Animated.View>
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
    dark: {
      bg: colors.dark,
      border: 'transparent',
      textColor: colors.white,
    },
  };

  const v = variantStyles[variant] || variantStyles.outline;

  return (
    <TouchableOpacity
      style={[fullWidth && { width: '100%' }, style]}
      onPress={onPress}
      onPressIn={() => spring(0.96)}
      onPressOut={() => spring(1)}
      disabled={loading || disabled}
      activeOpacity={0.9}
    >
      <Animated.View
        style={[
          styles.button, sz,
          {
            backgroundColor: v.bg,
            borderWidth: variant === 'outline' ? 1.5 : 0,
            borderColor: v.border,
          },
          variant === 'secondary' && SHADOWS.xs,
          disabled && styles.disabled,
          { transform: [{ scale: scaleAnim }] },
        ]}
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
      </Animated.View>
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
    gap: 10,
  },
  icon: {
    lineHeight: undefined,
  },
  text: {
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  primaryText: {
    color: '#FFF',
  },
  disabled: {
    opacity: 0.45,
  },
});

export default Button;
