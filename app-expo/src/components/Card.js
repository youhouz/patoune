// ---------------------------------------------------------------------------
// Pépète v4.0 - Card Component (San Francisco Agency Edition)
// Ultra-clean containers with soft diffusion shadows.
// ---------------------------------------------------------------------------

import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS, SHADOWS, RADIUS, SPACING } from '../utils/colors';

// ---------------------------------------------------------------------------
// Variant configurations
// ---------------------------------------------------------------------------
const VARIANT_STYLES = {
  elevated: {
    backgroundColor: COLORS.card,
    borderWidth: 0,
    borderColor: 'transparent',
    ...SHADOWS.lg, // Upgraded shadow for a floating tech feel
  },
  outlined: {
    backgroundColor: COLORS.card,
    borderWidth: 1.5, // Slightly bolder borders
    borderColor: COLORS.border,
  },
  flat: {
    backgroundColor: COLORS.background, // Match minimalist background
    borderWidth: 0,
    borderColor: 'transparent',
  },
};

/**
 * Card container component.
 */
const Card = ({
  children,
  variant = 'elevated',
  onPress,
  noPadding = false,
  style,
}) => {
  const variantStyle = VARIANT_STYLES[variant] || VARIANT_STYLES.elevated;

  const cardStyle = [
    styles.card,
    variantStyle,
    noPadding && styles.noPadding,
    style,
  ];

  if (onPress) {
    return (
      <TouchableOpacity
        style={cardStyle}
        onPress={onPress}
        activeOpacity={0.8} // Smoother generic opacity
        accessibilityRole="button"
      >
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={cardStyle}>{children}</View>;
};

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  card: {
    borderRadius: RADIUS.xl, // Squircular, very modern feel
    padding: SPACING.lg, // Generous padding
    marginVertical: SPACING.md,
    overflow: 'hidden',
  },
  noPadding: {
    padding: 0,
  },
});

export default Card;
