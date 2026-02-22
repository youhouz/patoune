import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
const colors = require('../utils/colors');
const { SHADOWS, RADIUS } = require('../utils/colors');

const Card = ({ children, style, onPress, variant = 'default', noPadding }) => {
  const variantStyles = {
    default: { backgroundColor: colors.white, ...SHADOWS.md },
    elevated: { backgroundColor: colors.white, ...SHADOWS.lg },
    flat: { backgroundColor: colors.background, ...SHADOWS.sm },
    outlined: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border },
  };

  const cardStyle = [
    styles.card,
    variantStyles[variant],
    noPadding && { padding: 0 },
    style,
  ];

  if (onPress) {
    return (
      <TouchableOpacity style={cardStyle} onPress={onPress} activeOpacity={0.7}>
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={cardStyle}>{children}</View>;
};

const styles = StyleSheet.create({
  card: {
    borderRadius: RADIUS.xl,
    padding: 16,
    marginVertical: 6,
  },
});

export default Card;
