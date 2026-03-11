// ---------------------------------------------------------------------------
// Pépète v4.0 - ScreenHeader Component (San Francisco Agency Edition)
// ---------------------------------------------------------------------------

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from './Icon';
import { COLORS, RADIUS, SPACING } from '../utils/colors';
import { FONTS } from '../utils/typography';

const VARIANTS = {
  dark: {
    gradientColors: COLORS.gradientDark,
    titleColor: COLORS.textInverse,
    subtitleColor: 'rgba(255,255,255,0.7)',
    iconColor: COLORS.textInverse,
    statusBarStyle: 'light-content',
    useGradient: true,
  },
  light: {
    backgroundColor: COLORS.background, // Match minimalist background
    titleColor: COLORS.text,
    subtitleColor: COLORS.textSecondary,
    iconColor: COLORS.text,
    statusBarStyle: 'dark-content',
    useGradient: false,
  },
  transparent: {
    backgroundColor: 'transparent',
    titleColor: COLORS.text,
    subtitleColor: COLORS.textSecondary,
    iconColor: COLORS.text,
    statusBarStyle: 'dark-content',
    useGradient: false,
  },
};

const ScreenHeader = ({
  title,
  subtitle,
  onBack,
  rightAction,
  variant = 'light',
  style,
}) => {
  const insets = useSafeAreaInsets();
  const config = VARIANTS[variant] || VARIANTS.light;

  const topPadding = Math.max(insets.top, Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0);

  const content = (
    <View style={[styles.inner, { paddingTop: topPadding + 16 }, style]}>
      <StatusBar barStyle={config.statusBarStyle} />

      <View style={styles.row}>
        {onBack ? (
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack}
            activeOpacity={0.7}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityRole="button"
          >
            <Icon name="chevron-left" size={24} color={config.iconColor} />
          </TouchableOpacity>
        ) : (
          <View style={styles.backPlaceholder} />
        )}

        <View style={styles.titleBlock}>
          <Text style={[styles.title, { color: config.titleColor }]} numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={[styles.subtitle, { color: config.subtitleColor }]} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>

        {rightAction ? (
          <View style={styles.rightAction}>{rightAction}</View>
        ) : (
          <View style={styles.backPlaceholder} />
        )}
      </View>
    </View>
  );

  if (config.useGradient) {
    return (
      <LinearGradient
        colors={config.gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.container}
      >
        {content}
      </LinearGradient>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: config.backgroundColor }]}>
      {content}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {},
  inner: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.full, // Circular icons for high end modern UI
    backgroundColor: 'rgba(15, 23, 42, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backPlaceholder: {
    width: 44,
  },
  titleBlock: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.base,
  },
  title: {
    fontFamily: FONTS.heading,
    fontSize: 18,
    letterSpacing: -0.3, // Modern kerning
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 13,
    marginTop: 4,
    textAlign: 'center',
  },
  rightAction: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default ScreenHeader;
