import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { getWeeklySummaryAPI } from '../api/products';
import { SPACING, RADIUS, FONT_SIZE, SHADOWS } from '../utils/colors';
import colors, { getScoreColor } from '../utils/colors';

const DAY_LABELS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

/**
 * Small animated bar in the weekly chart.
 */
const Bar = ({ value, maxValue, index }) => {
  const height = useRef(new Animated.Value(0)).current;
  const targetH = maxValue > 0 ? (value / maxValue) * 40 : 0;

  useEffect(() => {
    Animated.timing(height, {
      toValue: Math.max(3, targetH),
      duration: 600,
      delay: index * 60,
      easing: Easing.out(Easing.ease),
      useNativeDriver: false,
    }).start();
  }, [targetH]);

  return (
    <View style={styles.barColumn}>
      <Animated.View
        style={[
          styles.bar,
          { height, backgroundColor: value > 0 ? '#6B8F71' : '#E8E4DC' },
        ]}
      />
    </View>
  );
};

/**
 * Weekly summary card shown on HomeScreen.
 * Hidden when user has no scans this week.
 */
const WeeklySummaryCard = ({ onPressHistory }) => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getWeeklySummaryAPI()
      .then(res => setSummary(res.data?.summary || null))
      .catch(() => setSummary(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading || !summary || summary.scansThisWeek === 0) return null;

  const maxDay = Math.max(...summary.perDay, 1);

  // Compute a motivational message
  let mood = '';
  if (summary.excellentCount >= 3) {
    mood = `${summary.excellentCount} excellents choix cette semaine ! 🌟`;
  } else if (summary.dangerousCount >= 3) {
    mood = `${summary.dangerousCount} produits à risque évités 🛡️`;
  } else if (summary.scansThisWeek >= 10) {
    mood = 'Tu es en feu cette semaine ! 🔥';
  } else if (summary.scansThisWeek >= 5) {
    mood = 'Bonne progression cette semaine 👏';
  } else {
    mood = 'Continue comme ça !';
  }

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.eyebrow}>CETTE SEMAINE</Text>
          <Text style={styles.title}>Ton récap hebdo</Text>
        </View>
        {onPressHistory && (
          <TouchableOpacity onPress={onPressHistory} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Feather name="arrow-right" size={18} color={colors.primary} />
          </TouchableOpacity>
        )}
      </View>

      <Text style={styles.mood}>{mood}</Text>

      {/* Stats row */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{summary.scansThisWeek}</Text>
          <Text style={styles.statLabel}>scans</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: getScoreColor(summary.avgScore) }]}>
            {summary.avgScore}
          </Text>
          <Text style={styles.statLabel}>score moyen</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: '#6B8F71' }]}>
            {summary.excellentCount}
          </Text>
          <Text style={styles.statLabel}>excellents</Text>
        </View>
      </View>

      {/* Bar chart */}
      <View style={styles.chartContainer}>
        <View style={styles.chart}>
          {summary.perDay.map((v, i) => (
            <Bar key={i} value={v} maxValue={maxDay} index={i} />
          ))}
        </View>
        <View style={styles.labelsRow}>
          {DAY_LABELS.map((l, i) => (
            <Text key={i} style={styles.dayLabel}>{l}</Text>
          ))}
        </View>
      </View>

      {summary.bestScan && (
        <View style={styles.bestRow}>
          <View style={styles.bestIcon}>
            <Feather name="award" size={14} color="#EAB308" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.bestLabel}>Meilleur scan de la semaine</Text>
            <Text style={styles.bestName} numberOfLines={1}>{summary.bestScan.name}</Text>
          </View>
          <View style={[styles.bestScore, { backgroundColor: getScoreColor(summary.bestScan.nutritionScore || 0) + '14' }]}>
            <Text style={[styles.bestScoreText, { color: getScoreColor(summary.bestScan.nutritionScore || 0) }]}>
              {summary.bestScan.nutritionScore || 0}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFF',
    borderRadius: RADIUS['2xl'],
    padding: SPACING.xl,
    ...SHADOWS.sm,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.xs,
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.textTertiary,
    letterSpacing: 1,
  },
  title: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '800',
    color: colors.text,
    marginTop: 2,
  },
  mood: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    color: colors.textSecondary,
    marginTop: SPACING.xs,
    marginBottom: SPACING.base,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    alignItems: 'center',
  },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: FONT_SIZE.xl, fontWeight: '900', color: colors.text },
  statLabel: { fontSize: 10, fontWeight: '600', color: colors.textTertiary, marginTop: 2 },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: colors.borderLight,
  },
  chartContainer: { marginTop: SPACING.base },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 44,
    gap: 6,
  },
  barColumn: { flex: 1, alignItems: 'center', justifyContent: 'flex-end' },
  bar: { width: '100%', borderRadius: 4, minHeight: 3 },
  labelsRow: { flexDirection: 'row', marginTop: 4, gap: 6 },
  dayLabel: {
    flex: 1,
    textAlign: 'center',
    fontSize: 10,
    fontWeight: '700',
    color: colors.textTertiary,
  },
  bestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.base,
    paddingTop: SPACING.base,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  bestIcon: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: '#FFFDF5',
    alignItems: 'center', justifyContent: 'center',
  },
  bestLabel: { fontSize: 10, fontWeight: '700', color: colors.textTertiary },
  bestName: { fontSize: FONT_SIZE.sm, fontWeight: '700', color: colors.text, marginTop: 1 },
  bestScore: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
  },
  bestScoreText: { fontSize: 11, fontWeight: '900' },
});

export default WeeklySummaryCard;
