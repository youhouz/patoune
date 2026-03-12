// ═══════════════════════════════════════════════════════════════════════════
// Pépète v7.0 — Button Component (Dark Premium 2027)
// Spring animation, haptic feedback, neon glow effects
// ═══════════════════════════════════════════════════════════════════════════
import React, { useRef } from 'react';
import {
  TouchableOpacity, Text, StyleSheet, ActivityIndicator,
  View, Animated, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
const colors = require('../utils/colors');
const { COLORS, SHADOWS, RADIUS, FONT_SIZE } = require('../utils/colors');

let Haptics = null;
try { Haptics = require('expo-haptics'); } catch (_) {}
const haptic = () => {
  if (Platform.OS !== 'web' && Haptics) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  }
};

const Button = ({
  title, onPress, loading, style, textStyle,
  variant = 'primary', disabled, icon, iconRight, size = 'md',
  fullWidth = true, glow = true,
}) => {
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn = () => {
    Animated.spring(scale, { toValue: 0.96, useNativeDriver: true, tension: 300, friction: 10 }).start();
  };

  const onPressOut = () => {
    haptic();
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, tension: 200, friction: 8 }).start();
    onPress?.();
  };

  const sizeMap = {
    sm: { py: 12, px: 18, minH: 44, radius: RADIUS.md,     fontSize: FONT_SIZE.sm   },
    md: { py: 16, px: 24, minH: 54, radius: RADIUS.lg,     fontSize: FONT_SIZE.base },
    lg: { py: 18, px: 32, minH: 60, radius: RADIUS.xl,     fontSize: FONT_SIZE.md   },
    xl: { py: 20, px: 40, minH: 66, radius: RADIUS['2xl'], fontSize: FONT_SIZE.lg   },
  };
  const s = sizeMap[size] || sizeMap.md;

  if (variant === 'primary') {
    return (
      <Animated.View style={[fullWidth && { width: '100%' }, { transform: [{ scale }] }, style]}>
        <TouchableOpacity
          onPressIn={onPressIn}
          onPressOut={onPressOut}
          disabled={loading || disabled}
          activeOpacity={1}
          style={{ width: '100%' }}
        >
          <LinearGradient
            colors={disabled ? ['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.05)'] : ['#00C853', '#00E676']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={[
              baseStyles.btn,
              { paddingVertical: s.py, paddingHorizontal: s.px, minHeight: s.minH, borderRadius: s.radius },
              !disabled && glow && SHADOWS.glow('#00E676'),
            ]}
          >
            {loading ? (
              <ActivityIndicator color="#080B12" size="small" />
            ) : (
              <View style={baseStyles.content}>
                {icon && !iconRight && <View style={baseStyles.iconWrap}>{icon}</View>}
                <Text style={[baseStyles.text, baseStyles.primaryText, { fontSize: s.fontSize }, textStyle]}>
                  {title}
                </Text>
                {icon && iconRight && <View style={baseStyles.iconWrap}>{icon}</View>}
              </View>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    );
  }

  if (variant === 'outline') {
    return (
      <Animated.View style={[fullWidth && { width: '100%' }, { transform: [{ scale }] }, style]}>
        <TouchableOpacity
          onPressIn={onPressIn}
          onPressOut={onPressOut}
          disabled={loading || disabled}
          activeOpacity={1}
          style={[
            baseStyles.btn,
            { paddingVertical: s.py, paddingHorizontal: s.px, minHeight: s.minH, borderRadius: s.radius,
              backgroundColor: COLORS.primarySoft, borderWidth: 1.5, borderColor: COLORS.primary },
            disabled && baseStyles.disabled,
          ]}
        >
          {loading ? <ActivityIndicator color={COLORS.primary} size="small" /> : (
            <View style={baseStyles.content}>
              {icon && !iconRight && <View style={baseStyles.iconWrap}>{icon}</View>}
              <Text style={[baseStyles.text, { color: COLORS.primary, fontSize: s.fontSize }, textStyle]}>{title}</Text>
              {icon && iconRight && <View style={baseStyles.iconWrap}>{icon}</View>}
            </View>
          )}
        </TouchableOpacity>
      </Animated.View>
    );
  }

  const variantMap = {
    secondary: { bg: COLORS.glass,       border: COLORS.glassBorder,  color: COLORS.primary },
    ghost:     { bg: 'transparent',       border: 'transparent',       color: COLORS.primary },
    danger:    { bg: COLORS.errorSoft,    border: COLORS.error+'30',   color: COLORS.error   },
    dark:      { bg: COLORS.surfaceHigh,  border: COLORS.border,       color: COLORS.text    },
    violet:    { bg: COLORS.accentSoft,   border: COLORS.accent+'30',  color: COLORS.accent  },
  };
  const v = variantMap[variant] || variantMap.ghost;

  return (
    <Animated.View style={[fullWidth && { width: '100%' }, { transform: [{ scale }] }, style]}>
      <TouchableOpacity
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        disabled={loading || disabled}
        activeOpacity={1}
        style={[
          baseStyles.btn,
          { paddingVertical: s.py, paddingHorizontal: s.px, minHeight: s.minH, borderRadius: s.radius,
            backgroundColor: v.bg, borderWidth: 1, borderColor: v.border },
          disabled && baseStyles.disabled,
        ]}
      >
        {loading ? <ActivityIndicator color={v.color} size="small" /> : (
          <View style={baseStyles.content}>
            {icon && !iconRight && <View style={baseStyles.iconWrap}>{icon}</View>}
            <Text style={[baseStyles.text, { color: v.color, fontSize: s.fontSize }, textStyle]}>{title}</Text>
            {icon && iconRight && <View style={baseStyles.iconWrap}>{icon}</View>}
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

const baseStyles = StyleSheet.create({
  btn: { alignItems: 'center', justifyContent: 'center' },
  content: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconWrap: { alignItems: 'center', justifyContent: 'center' },
  text: { fontWeight: '700', letterSpacing: 0.2 },
  primaryText: { color: '#080B12', fontWeight: '800' },
  disabled: { opacity: 0.38 },
});

export default Button;
