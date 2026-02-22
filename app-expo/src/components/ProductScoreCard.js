import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
const colors = require('../utils/colors');
const { SHADOWS, RADIUS, getScoreColor, getScoreBg, getScoreLabel } = require('../utils/colors');

const ProductScoreCard = ({ product, onPress, compact = false }) => {
  const score = product.nutritionScore || 0;
  const scoreColor = getScoreColor(score);
  const scoreBg = getScoreBg(score);
  const label = getScoreLabel(score);

  const Wrapper = onPress ? TouchableOpacity : View;

  return (
    <Wrapper
      style={[styles.card, compact && styles.cardCompact]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Score circle */}
      <View style={[styles.scoreCircle, { backgroundColor: scoreBg, borderColor: scoreColor }]}>
        <Text style={[styles.scoreNumber, { color: scoreColor }]}>{score}</Text>
        <Text style={[styles.scoreMax, { color: scoreColor }]}>/100</Text>
      </View>

      {/* Info */}
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{product.name}</Text>
        <Text style={styles.brand} numberOfLines={1}>{product.brand}</Text>

        <View style={styles.badges}>
          <View style={[styles.labelBadge, { backgroundColor: scoreBg }]}>
            <View style={[styles.labelDot, { backgroundColor: scoreColor }]} />
            <Text style={[styles.labelText, { color: scoreColor }]}>{label}</Text>
          </View>

          {product.category && (
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{product.category}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Arrow */}
      {onPress && (
        <Text style={styles.arrow}>›</Text>
      )}
    </Wrapper>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: RADIUS.xl,
    padding: 16,
    marginVertical: 5,
    ...SHADOWS.md,
  },
  cardCompact: {
    padding: 12,
  },
  scoreCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  scoreNumber: {
    fontSize: 22,
    fontWeight: '800',
    lineHeight: 24,
  },
  scoreMax: {
    fontSize: 9,
    fontWeight: '600',
    opacity: 0.7,
    marginTop: -2,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  brand: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  badges: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 6,
    flexWrap: 'wrap',
  },
  labelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
    gap: 5,
  },
  labelDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  labelText: {
    fontSize: 12,
    fontWeight: '600',
  },
  categoryBadge: {
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
  },
  categoryText: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  arrow: {
    fontSize: 24,
    color: colors.textLight,
    marginLeft: 8,
  },
});

export default ProductScoreCard;
