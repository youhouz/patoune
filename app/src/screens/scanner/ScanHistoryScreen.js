import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { getScanHistoryAPI } from '../../api/products';
const colors = require('../../utils/colors');

const getScoreColor = (score) => {
  if (score >= 80) return colors.scoreExcellent;
  if (score >= 60) return colors.scoreGood;
  if (score >= 40) return colors.scoreMediocre;
  if (score >= 20) return colors.scoreBad;
  return colors.scoreVeryBad;
};

const ScanHistoryScreen = ({ navigation }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const response = await getScanHistoryAPI();
      setHistory(response.data.history);
    } catch (error) {
      console.log('Erreur historique:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }) => {
    const product = item.product;
    if (!product) return null;

    return (
      <TouchableOpacity
        style={styles.item}
        onPress={() => navigation.navigate('ProductResult', { product })}
      >
        <View style={[styles.scoreBadge, { backgroundColor: getScoreColor(product.nutritionScore) }]}>
          <Text style={styles.scoreText}>{product.nutritionScore}</Text>
        </View>
        <View style={styles.itemInfo}>
          <Text style={styles.itemName}>{product.name}</Text>
          <Text style={styles.itemBrand}>{product.brand}</Text>
          <Text style={styles.itemDate}>
            {new Date(item.scannedAt).toLocaleDateString('fr-FR')}
          </Text>
        </View>
        <Text style={styles.arrow}>›</Text>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {history.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyIcon}>📋</Text>
          <Text style={styles.emptyText}>Aucun scan pour le moment</Text>
          <Text style={styles.emptySubtext}>Scannez un produit pour commencer</Text>
        </View>
      ) : (
        <FlatList
          data={history}
          renderItem={renderItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.list}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    padding: 16,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  scoreBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreText: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.white,
  },
  itemInfo: {
    flex: 1,
    marginLeft: 12,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  itemBrand: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 1,
  },
  itemDate: {
    fontSize: 11,
    color: colors.textLight,
    marginTop: 2,
  },
  arrow: {
    fontSize: 24,
    color: colors.textLight,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  emptySubtext: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
  },
});

export default ScanHistoryScreen;
