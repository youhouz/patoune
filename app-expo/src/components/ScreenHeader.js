// ---------------------------------------------------------------------------
// Patoune v2.0 - ScreenHeader Component
// Reusable screen header with SafeArea, back button, title/subtitle,
// and optional right action area. Supports dark, light, transparent variants.
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
import { FONTS, TEXT_STYLES } from '../utils/typography';


// ---------------------------------------------------------------------------
// Variant configurations
// ---------------------------------------------------------------------------
const VARIANTS = {
  dark: {
    gradientColors: COLORS.gradientCharcoal,
    titleColor: COLORS.textInverse,
    subtitleColor: 'rgba(255,255,255,0.65)',
    iconColor: COLORS.textInverse,
    statusBarStyle: 'light-content',
    useGradient: true,
  },
  light: {
    backgroundColor: COLORS.cream,
    titleColor: COLORS.charcoal,
    subtitleColor: COLORS.textSecondary,
    iconColor: COLORS.charcoal,
    statusBarStyle: 'dark-content',
    useGradient: false,
  },
  transparent: {
    backgroundColor: 'transparent',
    titleColor: COLORS.charcoal,
    subtitleColor: COLORS.textSecondary,
    iconColor: COLORS.charcoal,
    statusBarStyle: 'dark-content',
    useGradient: false,
  },
};


/**
 * Reusable screen header with SafeArea padding, back navigation,
 * title/subtitle, and an optional right-side action slot.
 *
 * @param {object}  props
 * @param {string}  props.title                         - Header title
 * @param {string}  [props.subtitle]                    - Subtitle text below the title
 * @param {function} [props.onBack]                     - Back button handler (hidden if undefined)
 * @param {React.ReactNode} [props.rightAction]         - Element rendered on the right side
 * @param {'dark'|'light'|'transparent'} [props.variant='light'] - Visual variant
 * @param {object}  [props.style]                       - Additional container style
 */
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
    <View style={[styles.inner, { paddingTop: topPadding + 12 }, style]}>
      <StatusBar barStyle={config.statusBarStyle} />

      {/* Row: Back | Title area | Right action */}
      <View style={styles.row}>
        {/* Back button */}
        {onBack ? (
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityRole="button"
            accessibilityLabel="Retour"
          >
            <Icon
              name="chevron-left"
              size={24}
              color={config.iconColor}
            />
          </TouchableOpacity>
        ) : (
          <View style={styles.backPlaceholder} />
        )}

        {/* Title block */}
        <View style={styles.titleBlock}>
          <Text
            style={[
              styles.title,
              { color: config.titleColor },
            ]}
            numberOfLines={1}
          >
            {title}
          </Text>
          {subtitle ? (
            <Text
              style={[
                styles.subtitle,
                { color: config.subtitleColor },
              ]}
              numberOfLines={1}
            >
              {subtitle}
            </Text>
          ) : null}
        </View>

        {/* Right action area */}
        {rightAction ? (
          <View style={styles.rightAction}>
            {rightAction}
          </View>
        ) : (
          <View style={styles.backPlaceholder} />
        )}
      </View>
    </View>
  );

  // Dark variant uses a gradient background
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

  // Light and transparent variants use a flat background color
  return (
    <View style={[styles.container, { backgroundColor: config.backgroundColor }]}>
      {content}
    </View>
  );
};


// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  container: {
    // Container fills the gradient or background
  },
  inner: {
    paddingHorizontal: SPACING.base,
    paddingBottom: SPACING.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backPlaceholder: {
    width: 40,
  },
  titleBlock: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.sm,
  },
  title: {
    fontFamily: FONTS.heading,
    fontSize: 18,
    letterSpacing: -0.2,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: FONTS.body,
    fontSize: 13,
    marginTop: 2,
    textAlign: 'center',
  },
  rightAction: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default ScreenHeader;
