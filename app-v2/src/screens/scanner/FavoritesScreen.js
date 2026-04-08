import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Platform,
  ActivityIndicator,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { getFavoritesAPI, toggleFavoriteAPI } from '../../api/products';
import { hapticLight } from '../../utils/haptics';
import colors, { SHADOWS, RADIUS, SPACING, FONT_SIZE, getScoreColor, getScoreLabel } from '../../utils/colors';

const HEADER_PADDING_TOP = Platform.OS === 'ios' ? 56 : (StatusBar.currentHeight || 24) + 12;

const FavoritesScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadFavorites = useCallback(async () => {
    try {
      const res = await getFavoritesAPI();
      setFavorites(res.data?.favorites || []);
    } catch (_) {
      setFavorites([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadFavorites();
    }, [loadFavorites])
  );

  const handleRemove = async (productId) => {
    hapticLight();
    // Optimistic removal
    setFavorites(f => f.filter(p => p._id !== productId));
    try {
      await toggleFavoriteAPI(productId);
    } catch (_) {
      loadFavorites();
    }
  };

  const renderFavorite = ({ item, index }) => {
    const score = item.nutritionScore ?? 0;
    const color = getScoreColor(score);
    const label = getScoreLabel(score);
    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.85}
        onPress={() => navigation.navigate('ProductResult', { product: item })}
      >
        {item.image ? (
          <Image source={{ uri: item.image }} style={styles.cardImage} />
        ) : (
          <View style={[styles.cardImagePlaceholder, { backgroundColor: color + '14' }]}>
            <Feather name="package" size={24} color={color} />
          </View>
        )}
        <View style={styles.cardBody}>
          <Text style={styles.cardName} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.cardBrand} numberOfLines={1}>{item.brand || 'Marque inconnue'}</Text>
          <View style={styles.cardScoreRow}>
            <View style={[styles.scoreChip, { backgroundColor: color + '16' }]}>
              <Text style={[styles.scoreChipText, { color }]}>{score}/100</Text>
            </View>
            <Text style={[styles.scoreLabel, { color }]}>{label}</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.heartBtn}
          onPress={() => handleRemove(item._id)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Feather name="heart" size={20} color="#FF5C7A" />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <LinearGradient
        colors={['#527A56', '#6B8F71']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: HEADER_PADDING_TOP }]}
      >
        <View style={styles.headerNav}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
            <Feather name="chevron-left" size={22} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Mes favoris</Text>
          <View style={{ width: 36 }} />
        </View>
        <View style={styles.headerContent}>
          <Text style={styles.headerEmoji}>❤️</Text>
          <Text style={styles.headerSub}>
            {favorites.length === 0
              ? 'Aucun produit sauvegardé'
              : `${favorites.length} produit${favorites.length > 1 ? 's' : ''} sauvegardé${favorites.length > 1 ? 's' : ''}`
            }
          </Text>
        </View>
      </LinearGradient>

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 60 }} />
      ) : favorites.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIcon}>
            <Feather name="heart" size={40} color={colors.textTertiary} />
          </View>
          <Text style={styles.emptyTitle}>Pas encore de favoris</Text>
          <Text style={styles.emptyText}>
            Appuie sur le coeur lors d'un scan pour sauvegarder un produit ici.
          </Text>
          <TouchableOpacity
            style={styles.emptyBtn}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('ScannerMain')}
          >
            <Feather name="camera" size={16} color="#FFF" />
            <Text style={styles.emptyBtnText}>Scanner un produit</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={favorites}
          keyExtractor={(item) => item._id}
          renderItem={renderFavorite}
          contentContainerStyle={{
            padding: SPACING.xl,
            paddingBottom: insets.bottom + SPACING['3xl'],
          }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    paddingBottom: SPACING['2xl'],
    paddingHorizontal: SPACING.xl,
    borderBottomLeftRadius: RADIUS['3xl'],
    borderBottomRightRadius: RADIUS['3xl'],
  },
  headerNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: FONT_SIZE.xl, fontWeight: '800', color: '#FFF' },
  headerContent: { alignItems: 'center' },
  headerEmoji: { fontSize: 40, marginBottom: SPACING.xs },
  headerSub: { fontSize: FONT_SIZE.sm, fontWeight: '600', color: 'rgba(255,255,255,0.85)' },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: RADIUS['2xl'],
    padding: SPACING.base,
    marginBottom: SPACING.md,
    ...SHADOWS.sm,
  },
  cardImage: {
    width: 60, height: 60, borderRadius: RADIUS.xl, marginRight: SPACING.md,
  },
  cardImagePlaceholder: {
    width: 60, height: 60, borderRadius: RADIUS.xl, marginRight: SPACING.md,
    alignItems: 'center', justifyContent: 'center',
  },
  cardBody: { flex: 1 },
  cardName: { fontSize: FONT_SIZE.base, fontWeight: '800', color: colors.text },
  cardBrand: { fontSize: FONT_SIZE.xs, fontWeight: '500', color: colors.textTertiary, marginTop: 2 },
  cardScoreRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: SPACING.xs },
  scoreChip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: RADIUS.full },
  scoreChipText: { fontSize: 11, fontWeight: '900' },
  scoreLabel: { fontSize: 11, fontWeight: '700' },
  heartBtn: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#FFF1F3',
  },

  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING['2xl'],
    marginTop: -SPACING['3xl'],
  },
  emptyIcon: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#FFF1F3',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: SPACING.lg,
  },
  emptyTitle: { fontSize: FONT_SIZE.lg, fontWeight: '800', color: colors.text },
  emptyText: {
    fontSize: FONT_SIZE.sm, fontWeight: '500', color: colors.textSecondary,
    textAlign: 'center', marginTop: SPACING.sm, lineHeight: 20,
  },
  emptyBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: colors.primary,
    paddingHorizontal: SPACING.xl, paddingVertical: SPACING.md,
    borderRadius: RADIUS.full, marginTop: SPACING.lg,
    ...SHADOWS.sm,
  },
  emptyBtnText: { color: '#FFF', fontSize: FONT_SIZE.sm, fontWeight: '800' },
});

export default FavoritesScreen;
