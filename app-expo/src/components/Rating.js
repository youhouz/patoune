import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
const colors = require('../utils/colors');

const Rating = ({ value = 0, count, size = 16, showValue = false }) => {
  const stars = [];
  const fullStars = Math.floor(value);
  const hasHalf = value - fullStars >= 0.5;

  for (let i = 0; i < 5; i++) {
    if (i < fullStars) {
      stars.push('★');
    } else if (i === fullStars && hasHalf) {
      stars.push('★');
    } else {
      stars.push('☆');
    }
  }

  return (
    <View style={styles.container}>
      <Text style={[styles.stars, { fontSize: size }]}>
        {stars.join('')}
      </Text>
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
  stars: {
    color: '#FBBF24',
    letterSpacing: 1,
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
