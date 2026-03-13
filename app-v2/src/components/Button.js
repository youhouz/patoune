import React, { useRef } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SHADOWS, RADIUS, FONT_SIZE } from '../utils/colors';

const SIZE_STYLES = {
  sm: { paddingVertical: 13, paddingHorizontal: 20, minHeight: 48, borderRadius: RADIUS.md },
  md: { paddingVertical: 16, paddingHorizontal: 28, minHeight: 56, borderRadius: RADIUS.lg },
  lg: { paddingVertical: 18, paddingHorizontal: 34, minHeight: 62, borderRadius: RADIUS.xl },
};

const FONT_SIZES = {
  sm: FONT_SIZE.sm,
  md: FONT_SIZE.md,
  lg: FONT_SIZE.lg,
};

const VARIANT_STYLES = {
  outline: {
    bg: 'transparent',
    border: COLORS.primary,
    textColor: COLORS.primary,
  },
  secondary: {
    bg: COLORS.primarySoft,
    border: 'transparent',
    textColor: COLORS.primary,
  },
  ghost: {
    bg: 'transparent',
    border: 'transparent',
    textColor: COLORS.primary,
  },
  danger: {
    bg: COLORS.errorSoft,
    border: 'transparent',
    textColor: COLORS.error,
  },
  dark: {
    bg: COLORS.dark,
    border: 'transparent',
    textColor: COLORS.white,
  },
};

const GRADIENT_ENABLED = ['#527A56', '#6B8F71'];
const GRADIENT_DISABLED = ['#D1D5DB', '#C6CAD0'];

const Button = ({
  title,
  onPress,
  loading = false,
  style,
  textStyle,
  variant = 'primary',
  disabled = false,
  icon,
  size = 'md',
  fullWidth = true,
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const animateTo = (value) => {
    Animated.spring(scaleAnim, {
      toValue: value,
      tension: 320,
      friction: 10,
      useNativeDriver: true,
    }).start();
  };

  const isDisabled = loading || disabled;
  const sz = SIZE_STYLES[size] ?? SIZE_STYLES.md;
  const fontSize = FONT_SIZES[size] ?? FONT_SIZES.md;

  const renderContent = (textColor) => {
    if (loading) {
      return <ActivityIndicator color={textColor} size="small" />;
    }
    return (
      <View style={styles.content}>
        {icon ? <Text style={[styles.icon, { fontSize }]}>{icon}</Text> : null}
        <Text style={[styles.text, { color: textColor, fontSize }, textStyle]}>
          {title}
        </Text>
      </View>
    );
  };

  if (variant === 'primary') {
    return (
      <TouchableOpacity
        onPress={onPress}
        onPressIn={() => animateTo(0.96)}
        onPressOut={() => animateTo(1)}
        disabled={isDisabled}
        activeOpacity={0.9}
        style={[fullWidth && styles.fullWidth, style]}
      >
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          <LinearGradient
            colors={disabled ? GRADIENT_DISABLED : GRADIENT_ENABLED}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[
              styles.button,
              sz,
              !disabled && SHADOWS.glow('#527A56'),
            ]}
          >
            {renderContent('#FFF')}
          </LinearGradient>
        </Animated.View>
      </TouchableOpacity>
    );
  }

  const v = VARIANT_STYLES[variant] ?? VARIANT_STYLES.outline;

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={() => animateTo(0.96)}
      onPressOut={() => animateTo(1)}
      disabled={isDisabled}
      activeOpacity={0.9}
      style={[fullWidth && styles.fullWidth, style]}
    >
      <Animated.View
        style={[
          styles.button,
          sz,
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
        {renderContent(v.textColor)}
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  fullWidth: {
    width: '100%',
  },
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
  disabled: {
    opacity: 0.45,
  },
});

export default Button;
