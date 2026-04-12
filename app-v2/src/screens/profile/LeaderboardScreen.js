import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  StatusBar,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { getLeaderboardAPI, getMonthlyLeaderboardAPI } from '../../api/products';
import { hapticSelection } from '../../utils/haptics';
import colors, { SHADOWS, RADIUS, SPACING, FONT_SIZE } from '../../utils/colors';

const HEADER_PADDING_TOP = Platform.OS === 'ios' ? 56 : (StatusBar.currentHeight || 24) + 12;

const RANK_COLORS = ['#EAB308', '#B0BAB3', '#C4956A']; // gold, silver, bronze
const RANK_EMOJIS = ['🥇', '🥈', '🥉'];

const LeaderboardScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [mode, setMode] = useState('month'); // 'month' | 'all'
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [monthlyData, setMonthlyData] = useState(null);

  const loadLeaderboard = useCallback(async (m) => {
    setLoading(true);
    try {
      if (m === 'month') {
        const res = await getMonthlyLeaderboardAPI();
        setMonthlyData(res.data || null);
        const list = (res.data?.leaderboard || []).map(e => ({
          ...e,
          totalScans: e.scanCount, // normalize for display
        }));
        setLeaderboard(list);
      } else {
        const res = await getLeaderboardAPI();
        setLeaderboard(res.data?.leaderboard || []);
      }
    } catch (_) {
      setLeaderboard([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadLeaderboard(mode);
    }, [mode, loadLeaderboard])
  );

  const switchMode = (m) => {
    if (m === mode) return;
    hapticSelection();
    setMode(m);
  };

  const myRank = mode === 'month' && monthlyData?.myRank
    ? monthlyData.myRank
    : leaderboard.findIndex(l => l.name === user?.name) + 1;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} bounces>

        {/* Header */}
        <LinearGradient
          colors={['#527A56', '#6B8F71', '#8CB092']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.headerGradient, { paddingTop: HEADER_PADDING_TOP }]}
        >
          <View style={styles.headerNav}>
            <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
              <Feather name="chevron-left" size={22} color="#FFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Classement</Text>
            <View style={{ width: 36 }} />
          </View>

          <Text style={styles.headerEmoji}>🏆</Text>
          <Text style={styles.headerSub}>Les protecteurs d'animaux les plus actifs</Text>

          {/* Period toggle */}
          <View style={styles.toggleContainer}>
            <TouchableOpacity
              style={[styles.toggleBtn, mode === 'month' && styles.toggleBtnActive]}
              onPress={() => switchMode('month')}
              activeOpacity={0.8}
            >
              <Text style={[styles.toggleText, mode === 'month' && styles.toggleTextActive]}>
                Ce mois-ci
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleBtn, mode === 'all' && styles.toggleBtnActive]}
              onPress={() => switchMode('all')}
              activeOpacity={0.8}
            >
              <Text style={[styles.toggleText, mode === 'all' && styles.toggleTextActive]}>
                Tout le temps
              </Text>
            </TouchableOpacity>
          </View>

          {mode === 'month' && monthlyData?.daysRemaining > 0 && (
            <View style={styles.daysRemainingBadge}>
              <Feather name="clock" size={12} color="#FFF" />
              <Text style={styles.daysRemainingText}>
                Fin du concours dans {monthlyData.daysRemaining} jour{monthlyData.daysRemaining > 1 ? 's' : ''}
              </Text>
            </View>
          )}

          {myRank > 0 && (
            <View style={styles.myRankBadge}>
              <Text style={styles.myRankText}>Vous êtes #{myRank}</Text>
            </View>
          )}
        </LinearGradient>

        {/* Content */}
        <View style={styles.content}>
          {/* Rewards card - shown only in monthly mode */}
          {mode === 'month' && !loading && (
            <View style={styles.rewardsCard}>
              <View style={styles.rewardsHeader}>
                <Text style={styles.rewardsEmoji}>🎁</Text>
                <Text style={styles.rewardsTitle}>Récompenses du mois</Text>
              </View>
              <View style={styles.rewardsList}>
                <View style={styles.rewardRow}>
                  <Text style={styles.rewardMedal}>🥇</Text>
                  <View style={styles.rewardInfo}>
                    <Text style={styles.rewardName}>Champion du mois</Text>
                    <Text style={styles.rewardDesc}>Badge exclusif + récompense surprise 🎉</Text>
                  </View>
                </View>
                <View style={styles.rewardRow}>
                  <Text style={styles.rewardMedal}>🥈</Text>
                  <View style={styles.rewardInfo}>
                    <Text style={styles.rewardName}>Vice-Champion</Text>
                    <Text style={styles.rewardDesc}>Badge exclusif "Vice-Champion"</Text>
                  </View>
                </View>
                <View style={[styles.rewardRow, { borderBottomWidth: 0 }]}>
                  <Text style={styles.rewardMedal}>🥉</Text>
                  <View style={styles.rewardInfo}>
                    <Text style={styles.rewardName}>Médaille de bronze</Text>
                    <Text style={styles.rewardDesc}>Badge exclusif "Bronze du mois"</Text>
                  </View>
                </View>
              </View>
              <Text style={styles.rewardsFooter}>
                Classement remis à zéro chaque début de mois
              </Text>
            </View>
          )}

          {loading ? (
            <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
          ) : leaderboard.length === 0 ? (
            <View style={styles.emptyCard}>
              <Feather name="users" size={36} color={colors.textTertiary} />
              <Text style={styles.emptyText}>Pas encore de classement</Text>
              <Text style={styles.emptySub}>Scannez des produits pour apparaitre ici !</Text>
            </View>
          ) : (
            <>
              {/* Top 3 podium */}
              {leaderboard.length >= 3 && (
                <View style={styles.podium}>
                  {[1, 0, 2].map(idx => {
                    const entry = leaderboard[idx];
                    if (!entry) return null;
                    const isFirst = idx === 0;
                    return (
                      <View key={idx} style={[styles.podiumItem, isFirst && styles.podiumFirst]}>
                        <Text style={styles.podiumEmoji}>{RANK_EMOJIS[idx]}</Text>
                        <View style={[styles.podiumAvatar, { borderColor: RANK_COLORS[idx] }]}>
                          <Text style={styles.podiumInitial}>
                            {(entry.name || '?').charAt(0).toUpperCase()}
                          </Text>
                        </View>
                        <Text style={styles.podiumName} numberOfLines={1}>{entry.name?.split(' ')[0] || '?'}</Text>
                        <Text style={[styles.podiumScans, { color: RANK_COLORS[idx] }]}>{entry.totalScans} scans</Text>
                        {entry.scanStreak > 0 && (
                          <View style={styles.podiumStreakBadge}>
                            <Text style={styles.podiumStreakText}>🔥 {entry.scanStreak}j</Text>
                          </View>
                        )}
                      </View>
                    );
                  })}
                </View>
              )}

              {/* Full list */}
              <View style={styles.listCard}>
                {leaderboard.map((entry, idx) => {
                  const isMe = entry.name === user?.name;
                  return (
                    <View key={idx} style={[styles.listRow, isMe && styles.listRowMe, idx === leaderboard.length - 1 && { borderBottomWidth: 0 }]}>
                      <Text style={[styles.listRank, idx < 3 && { color: RANK_COLORS[idx], fontWeight: '900' }]}>
                        {idx < 3 ? RANK_EMOJIS[idx] : `#${idx + 1}`}
                      </Text>
                      <View style={styles.listAvatarCircle}>
                        <Text style={styles.listInitial}>
                          {(entry.name || '?').charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <View style={styles.listInfo}>
                        <Text style={[styles.listName, isMe && styles.listNameMe]}>
                          {entry.name?.split(' ')[0] || 'Anonyme'}
                          {isMe ? ' (vous)' : ''}
                        </Text>
                        <View style={styles.listMeta}>
                          <Text style={styles.listMetaText}>{entry.totalScans} scans</Text>
                          {entry.badgeCount > 0 && (
                            <Text style={styles.listMetaText}>• {entry.badgeCount} badges</Text>
                          )}
                          {entry.referralCount > 0 && (
                            <Text style={styles.listMetaText}>• {entry.referralCount} filleuls</Text>
                          )}
                        </View>
                      </View>
                      {entry.scanStreak >= 3 && (
                        <View style={styles.listStreakBadge}>
                          <Text style={styles.listStreakText}>🔥{entry.scanStreak}</Text>
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            </>
          )}

          <View style={{ height: SPACING['3xl'] }} />
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollView: { flex: 1 },
  headerGradient: {
    paddingBottom: SPACING['2xl'], paddingHorizontal: SPACING.xl,
    borderBottomLeftRadius: RADIUS['3xl'], borderBottomRightRadius: RADIUS['3xl'],
    alignItems: 'center',
  },
  headerNav: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    width: '100%', marginBottom: SPACING.lg,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: FONT_SIZE.xl, fontWeight: '800', color: '#FFF' },
  headerEmoji: { fontSize: 48, marginBottom: SPACING.sm },
  headerSub: { fontSize: FONT_SIZE.sm, fontWeight: '600', color: 'rgba(255,255,255,0.8)', textAlign: 'center' },
  myRankBadge: {
    marginTop: SPACING.md, backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm, borderRadius: RADIUS.full,
  },
  myRankText: { fontSize: FONT_SIZE.sm, fontWeight: '700', color: '#FFF' },

  // Toggle
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: RADIUS.full,
    padding: 4,
    marginTop: SPACING.md,
  },
  toggleBtn: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
  },
  toggleBtnActive: {
    backgroundColor: '#FFF',
  },
  toggleText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.8)',
  },
  toggleTextActive: {
    color: '#527A56',
    fontWeight: '900',
  },
  daysRemainingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    backgroundColor: 'rgba(0,0,0,0.15)',
    borderRadius: RADIUS.full,
  },
  daysRemainingText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFF',
  },

  // Rewards card
  rewardsCard: {
    backgroundColor: '#FFFDF5',
    borderRadius: RADIUS['2xl'],
    padding: SPACING.xl,
    marginTop: SPACING.lg,
    borderWidth: 1,
    borderColor: '#EAB30820',
    ...SHADOWS.sm,
  },
  rewardsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.base,
  },
  rewardsEmoji: { fontSize: 24 },
  rewardsTitle: {
    fontSize: FONT_SIZE.base,
    fontWeight: '800',
    color: colors.text,
  },
  rewardsList: {},
  rewardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#EAB30815',
  },
  rewardMedal: { fontSize: 24 },
  rewardInfo: { flex: 1 },
  rewardName: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '800',
    color: colors.text,
  },
  rewardDesc: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '500',
    color: colors.textSecondary,
    marginTop: 1,
  },
  rewardsFooter: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textTertiary,
    textAlign: 'center',
    marginTop: SPACING.md,
    fontStyle: 'italic',
  },

  content: { paddingHorizontal: SPACING.xl, marginTop: -SPACING.sm },

  // Empty
  emptyCard: {
    backgroundColor: '#FFF', borderRadius: RADIUS['2xl'], padding: SPACING['2xl'],
    alignItems: 'center', marginTop: SPACING.lg, ...SHADOWS.sm,
  },
  emptyText: { fontSize: FONT_SIZE.lg, fontWeight: '700', color: colors.text, marginTop: SPACING.md },
  emptySub: { fontSize: FONT_SIZE.sm, fontWeight: '500', color: colors.textTertiary, marginTop: SPACING.xs },

  // Podium
  podium: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-end',
    gap: SPACING.sm, marginTop: SPACING.lg, marginBottom: SPACING.lg,
  },
  podiumItem: { alignItems: 'center', width: 90 },
  podiumFirst: { marginBottom: SPACING.lg },
  podiumEmoji: { fontSize: 28, marginBottom: SPACING.xs },
  podiumAvatar: {
    width: 56, height: 56, borderRadius: 28, borderWidth: 3,
    backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center',
    ...SHADOWS.sm,
  },
  podiumInitial: { fontSize: FONT_SIZE.xl, fontWeight: '800', color: colors.text },
  podiumName: { fontSize: FONT_SIZE.sm, fontWeight: '700', color: colors.text, marginTop: SPACING.xs },
  podiumScans: { fontSize: FONT_SIZE.xs, fontWeight: '700', marginTop: 2 },
  podiumStreakBadge: {
    marginTop: 4, backgroundColor: '#FBE8E4', paddingHorizontal: 8, paddingVertical: 2, borderRadius: RADIUS.full,
  },
  podiumStreakText: { fontSize: 10, fontWeight: '700', color: '#C25B4A' },

  // List
  listCard: {
    backgroundColor: '#FFF', borderRadius: RADIUS['2xl'], ...SHADOWS.sm, overflow: 'hidden',
  },
  listRow: {
    flexDirection: 'row', alignItems: 'center', padding: SPACING.base,
    borderBottomWidth: 1, borderBottomColor: colors.borderLight,
  },
  listRowMe: { backgroundColor: '#EFF5F0' },
  listRank: {
    width: 32, fontSize: FONT_SIZE.sm, fontWeight: '700', color: colors.textTertiary, textAlign: 'center',
  },
  listAvatarCircle: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: colors.background,
    alignItems: 'center', justifyContent: 'center', marginHorizontal: SPACING.md,
  },
  listInitial: { fontSize: FONT_SIZE.sm, fontWeight: '700', color: colors.text },
  listInfo: { flex: 1 },
  listName: { fontSize: FONT_SIZE.sm, fontWeight: '600', color: colors.text },
  listNameMe: { fontWeight: '800', color: '#527A56' },
  listMeta: { flexDirection: 'row', gap: 6, marginTop: 2 },
  listMetaText: { fontSize: 11, fontWeight: '500', color: colors.textTertiary },
  listStreakBadge: {
    backgroundColor: '#FBE8E4', paddingHorizontal: 8, paddingVertical: 3, borderRadius: RADIUS.full,
  },
  listStreakText: { fontSize: 11, fontWeight: '700', color: '#C25B4A' },
});

export default LeaderboardScreen;
