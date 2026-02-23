// ---------------------------------------------------------------------------
// Patoune v2.0 - Card Component
// Clean container with warm shadows (charcoal-tinted, never pure black).
// Three variants: elevated, outlined, flat. Pressable when onPress is set.
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
    ...SHADOWS.md,
  },
  outlined: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    // No shadow for outlined - the border provides definition
  },
  flat: {
    backgroundColor: COLORS.linen,
    borderWidth: 0,
    borderColor: 'transparent',
    // No shadow - flat sits flush with the background
  },
};


/**
 * Card container component.
 *
 * @param {object}   props
 * @param {React.ReactNode} props.children
 * @param {'elevated'|'outlined'|'flat'} [props.variant='elevated']
 * @param {function} [props.onPress]     - Makes the card pressable
 * @param {boolean}  [props.noPadding]   - Remove inner padding
 * @param {object}   [props.style]       - Style override
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

  // Pressable card (e.g. pet sitter listing, product result)
  if (onPress) {
    return (
      <TouchableOpacity
        style={cardStyle}
        onPress={onPress}
        activeOpacity={0.7}
        accessibilityRole="button"
      >
        {children}
      </TouchableOpacity>
    );
  }

  // Static card
  return <View style={cardStyle}>{children}</View>;
};


// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  card: {
    borderRadius: RADIUS.lg,
    padding: SPACING.base,
    marginVertical: SPACING.sm,
    overflow: 'hidden',
  },
  noPadding: {
    padding: 0,
  },
});

export default Card;
