import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import ProductScoreCard from '../../components/ProductScoreCard';
import Card from '../../components/Card';
const colors = require('../../utils/colors');

const getRiskColor = (risk) => {
  switch (risk) {
    case 'dangerous': return colors.scoreVeryBad;
    case 'moderate': return colors.scoreMediocre;
    default: return colors.scoreExcellent;
  }
};

const getRiskLabel = (risk) => {
  switch (risk) {
    case 'dangerous': return 'Dangereux';
    case 'moderate': return 'Modere';
    default: return 'Sans risque';
  }
};

const ProductResultScreen = ({ route }) => {
  const { product } = route.params;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Score principal */}
      <ProductScoreCard product={product} />

      {/* Ingredients */}
      {product.ingredients && product.ingredients.length > 0 && (
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Ingredients</Text>
          {product.ingredients.map((ingredient, idx) => (
            <View key={idx} style={styles.ingredientRow}>
              <View style={[styles.riskDot, { backgroundColor: getRiskColor(ingredient.risk) }]} />
              <Text style={styles.ingredientName}>{ingredient.name}</Text>
              {ingredient.isControversial && (
                <View style={styles.controversialBadge}>
                  <Text style={styles.controversialText}>Controverse</Text>
                </View>
              )}
            </View>
          ))}
        </Card>
      )}

      {/* Additifs */}
      {product.additives && product.additives.length > 0 && (
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Additifs</Text>
          {product.additives.map((additive, idx) => (
            <View key={idx} style={styles.additiveRow}>
              <View style={styles.additiveInfo}>
                {additive.code && (
                  <Text style={styles.additiveCode}>{additive.code}</Text>
                )}
                <Text style={styles.additiveName}>{additive.name}</Text>
              </View>
              <View style={[styles.riskBadge, { backgroundColor: getRiskColor(additive.risk) + '20' }]}>
                <Text style={[styles.riskText, { color: getRiskColor(additive.risk) }]}>
                  {getRiskLabel(additive.risk)}
                </Text>
              </View>
            </View>
          ))}
        </Card>
      )}

      {/* Details du score */}
      {product.scoreDetails && (
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Details du score</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Proteines</Text>
            <Text style={styles.detailValue}>
              {product.scoreDetails.protein > 0 ? '+' : ''}{product.scoreDetails.protein}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Matieres grasses</Text>
            <Text style={styles.detailValue}>
              {product.scoreDetails.fat > 0 ? '+' : ''}{product.scoreDetails.fat}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Fibres</Text>
            <Text style={styles.detailValue}>
              {product.scoreDetails.fiber > 0 ? '+' : ''}{product.scoreDetails.fiber}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Penalite additifs</Text>
            <Text style={[styles.detailValue, { color: colors.error }]}>
              -{product.scoreDetails.additivesPenalty}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Bonus qualite</Text>
            <Text style={[styles.detailValue, { color: colors.success }]}>
              +{product.scoreDetails.qualityBonus}
            </Text>
          </View>
        </Card>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  section: {
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 14,
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  riskDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  ingredientName: {
    flex: 1,
    fontSize: 14,
    color: colors.textPrimary,
    textTransform: 'capitalize',
  },
  controversialBadge: {
    backgroundColor: colors.warning + '20',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  controversialText: {
    fontSize: 10,
    color: colors.warning,
    fontWeight: '600',
  },
  additiveRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  additiveInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  additiveCode: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
    marginRight: 8,
    backgroundColor: colors.background,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  additiveName: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  riskBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 6,
  },
  riskText: {
    fontSize: 11,
    fontWeight: '600',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  detailLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
});

export default ProductResultScreen;
