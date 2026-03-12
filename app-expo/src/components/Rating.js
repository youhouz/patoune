import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
const colors = require('../utils/colors');

const Rating = ({ value = 0, count, size = 16, showValue = false }) => {
  const fullStars = Math.floor(value);
  const hasHalf = value - fullStars >= 0.5;
  const stars = [];

  for (let i = 0; i < 5; i++) {
    if (i < fullStars || (i === fullStars && hasHalf)) {
      stars.push(<Feather key={i} name="star" size={size} color="#D4AD86" />);
    } else {
      stars.push(<Feather key={i} name="star" size={size} color={colors.border} />);
    }
  }

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
    color: colors.text,
    marginLeft: 2,
  },
  count: {
    color: colors.textTertiary,
    fontWeight: '500',
  },
});

export default Rating;
