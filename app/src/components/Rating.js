import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
const colors = require('../utils/colors');

const Rating = ({ value = 0, count, size = 16 }) => {
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
      {count !== undefined && (
        <Text style={styles.count}>({count})</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stars: {
    color: '#F4A62A',
    letterSpacing: 2,
  },
  count: {
    marginLeft: 6,
    fontSize: 13,
    color: colors.textSecondary,
  },
});

export default Rating;
