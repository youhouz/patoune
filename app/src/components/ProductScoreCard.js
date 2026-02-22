import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Card from './Card';
const colors = require('../utils/colors');

const getScoreColor = (score) => {
  if (score >= 80) return colors.scoreExcellent;
  if (score >= 60) return colors.scoreGood;
  if (score >= 40) return colors.scoreMediocre;
  if (score >= 20) return colors.scoreBad;
  return colors.scoreVeryBad;
};

const getScoreLabel = (score) => {
  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'Bon';
  if (score >= 40) return 'Mediocre';
  if (score >= 20) return 'Mauvais';
  return 'Tres mauvais';
};

const ProductScoreCard = ({ product }) => {
  const scoreColor = getScoreColor(product.nutritionScore);
  const scoreLabel = getScoreLabel(product.nutritionScore);

  return (
    <Card>
      <View style={styles.header}>
        <View style={styles.info}>
          <Text style={styles.name}>{product.name}</Text>
          <Text style={styles.brand}>{product.brand}</Text>
          <Text style={styles.category}>{product.category}</Text>
        </View>
        <View style={[styles.scoreBadge, { backgroundColor: scoreColor }]}>
          <Text style={styles.scoreNumber}>{product.nutritionScore}</Text>
          <Text style={styles.scoreMax}>/100</Text>
        </View>
      </View>

      <View style={[styles.labelBadge, { backgroundColor: scoreColor + '20' }]}>
        <Text style={[styles.labelText, { color: scoreColor }]}>{scoreLabel}</Text>
      </View>

      {product.targetAnimal && product.targetAnimal.length > 0 && (
        <View style={styles.animals}>
          {product.targetAnimal.map((animal, idx) => (
            <View key={idx} style={styles.animalBadge}>
              <Text style={styles.animalText}>{animal}</Text>
            </View>
          ))}
        </View>
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  info: {
    flex: 1,
    marginRight: 12,
  },
  name: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  brand: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  category: {
    fontSize: 12,
    color: colors.textLight,
    marginTop: 2,
    textTransform: 'capitalize',
  },
  scoreBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreNumber: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.white,
  },
  scoreMax: {
    fontSize: 10,
    color: colors.white,
    opacity: 0.8,
  },
  labelBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 10,
  },
  labelText: {
    fontSize: 13,
    fontWeight: '600',
  },
  animals: {
    flexDirection: 'row',
    marginTop: 10,
    flexWrap: 'wrap',
    gap: 6,
  },
  animalBadge: {
    backgroundColor: colors.primary + '15',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  animalText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
});

export default ProductScoreCard;
