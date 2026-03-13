import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS, SHADOWS, RADIUS, SPACING } from '../utils/colors';

const VARIANT_STYLES = {
  elevated: {
    backgroundColor: COLORS.card,
    borderWidth: 0,
    borderColor: 'transparent',
    ...SHADOWS.lg,
  },
  outlined: {
    backgroundColor: COLORS.card,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  flat: {
    backgroundColor: COLORS.background,
    borderWidth: 0,
    borderColor: 'transparent',
  },
};

const Card = ({
  children,
  variant = 'elevated',
  onPress,
  noPadding = false,
  style,
}) => {
  const variantStyle = VARIANT_STYLES[variant] ?? VARIANT_STYLES.elevated;

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
        activeOpacity={0.8}
        accessibilityRole="button"
      >
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={cardStyle}>{children}</View>;
};

const styles = StyleSheet.create({
  card: {
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    marginVertical: SPACING.md,
    overflow: 'hidden',
  },
  noPadding: {
    padding: 0,
  },
});

export default Card;
