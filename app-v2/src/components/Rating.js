import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS } from '../utils/colors';

const Rating = ({ value = 0, count, size = 16, showValue = false }) => {
  const fullStars = Math.floor(value);
  const hasHalf = value - fullStars >= 0.5;

  const stars = Array.from({ length: 5 }, (_, i) => {
    const isFilled = i < fullStars || (i === fullStars && hasHalf);
    return (
      <Feather
        key={i}
        name="star"
        size={size}
        color={isFilled ? '#D4AD86' : COLORS.border}
      />
    );
  });

  return (
    <View style={styles.container}>
      <View style={styles.starsRow}>{stars}</View>
      {showValue && (
        <Text style={[styles.value, { fontSize: size - 2 }]}>{value.toFixed(1)}</Text>
      )}
      {count !== undefined && (
        <Text style={[styles.count, { fontSize: size - 3 }]}>({count})</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 1,
  },
  value: {
    fontWeight: '700',
    color: COLORS.text,
    marginLeft: 2,
  },
  count: {
    color: COLORS.textTertiary,
    fontWeight: '500',
  },
});

export default Rating;
