import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  StatusBar,
  Share,
  ScrollView,
  Clipboard,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { getMeAPI } from '../../api/auth';
import { showAlert } from '../../utils/alert';
import colors, { SHADOWS, RADIUS, SPACING, FONT_SIZE } from '../../utils/colors';

const HEADER_PADDING_TOP = Platform.OS === 'ios' ? 56 : (StatusBar.currentHeight || 24) + 12;

const BADGE_DEFS = {
  fondateur:   { icon: 'flag', label: 'Fondateur', desc: 'Parmi les 1000 premiers membres', color: '#EAB308' },
  first_scan:  { icon: 'camera', label: 'Premier Scan', desc: 'Votre premier produit scanne', color: '#6B8F71' },
  scanner_10:  { icon: 'zap', label: 'Explorateur', desc: '10 produits scannes', color: '#527A56' },
  scanner_50:  { icon: 'award', label: 'Expert', desc: '50 produits scannes', color: '#C4956A' },
  scanner_100: { icon: 'star', label: 'Master Scanner', desc: '100 produits scannes', color: '#C25B4A' },
  streak_3:    { icon: 'trending-up', label: 'Régulier', desc: '3 jours de suite', color: '#5B7FC2' },
  streak_7:    { icon: 'target', label: 'Assidu', desc: '7 jours de suite', color: '#8B5CF6' },
  streak_30:   { icon: 'shield', label: 'Inarrêtable', desc: '30 jours de suite', color: '#EAB308' },
  referral_1:  { icon: 'users', label: 'Ambassadeur', desc: '1 ami parrainé', color: '#6B8F71' },
  referral_5:  { icon: 'gift', label: 'Influenceur', desc: '5 amis parrainés', color: '#C4956A' },
  referral_10: { icon: 'heart', label: 'Parrain VIP', desc: '10 amis parrainés', color: '#C25B4A' },
};

const ALL_BADGES = Object.keys(BADGE_DEFS);

const ReferralScreen = ({ navigation }) => {
  const { user, updateUser } = useAuth();
  const [copied, setCopied] = useState(false);

  useFocusEffect(
    useCallback(() => {
      // Refresh user data to get latest referral count and badges
      getMeAPI().then(res => {
        if (res.data?.user) updateUser(res.data.user);
      }).catch(() => {});
    }, [updateUser])
  );

  const referralCode = user?.referralCode || '...';
  const referralCount = user?.referralCount || 0;
  const totalScans = user?.totalScans || 0;
  const scanStreak = user?.scanStreak || 0;
  const earnedBadges = user?.badges || [];

  const referralLink = `https://pepete.fr?ref=${referralCode}`;

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Je protège la santé de mon animal avec Pepete ! Rejoins-moi et scanne les croquettes de ton compagnon.\n\nUtilise mon code : ${referralCode}\n\n${referralLink}`,
      });
    } catch (_) {}
  };

  const handleCopy = () => {
    if (Platform.OS === 'web') {
      try { navigator.clipboard.writeText(referralCode); } catch (_) {}
    } else {
      Clipboard.setString(referralCode);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const milestones = [
    { count: 1, label: '1 ami', reward: 'Badge Ambassadeur' },
    { count: 5, label: '5 amis', reward: 'Badge Influenceur' },
    { count: 10, label: '10 amis', reward: 'Badge Parrain VIP' },
  ];

  // Next badges to unlock (progress bars)
  const SCAN_TIERS = [
    { key: 'first_scan', target: 1 },
    { key: 'scanner_10', target: 10 },
    { key: 'scanner_50', target: 50 },
    { key: 'scanner_100', target: 100 },
  ];
  const STREAK_TIERS = [
    { key: 'streak_3', target: 3 },
    { key: 'streak_7', target: 7 },
    { key: 'streak_30', target: 30 },
  ];
  const REFERRAL_TIERS = [
    { key: 'referral_1', target: 1 },
    { key: 'referral_5', target: 5 },
    { key: 'referral_10', target: 10 },
  ];

  const nextScanBadge = SCAN_TIERS.find(t => !earnedBadges.includes(t.key) && totalScans < t.target);
  const nextStreakBadge = STREAK_TIERS.find(t => !earnedBadges.includes(t.key) && scanStreak < t.target);
  const nextReferralBadge = REFERRAL_TIERS.find(t => !earnedBadges.includes(t.key) && referralCount < t.target);

  const nextBadges = [
    nextScanBadge && { ...nextScanBadge, current: totalScans, type: 'scans' },
    nextStreakBadge && { ...nextStreakBadge, current: scanStreak, type: 'jours' },
    nextReferralBadge && { ...nextReferralBadge, current: referralCount, type: 'amis' },
  ].filter(Boolean);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} bounces>

        {/* Header gradient */}
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
            <Text style={styles.headerTitle}>Parrainage</Text>
            <View style={{ width: 36 }} />
          </View>

          {/* Stats row */}
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{referralCount}</Text>
              <Text style={styles.statLabel}>Filleul{referralCount !== 1 ? 's' : ''}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{totalScans}</Text>
              <Text style={styles.statLabel}>Scans</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{scanStreak}</Text>
              <Text style={styles.statLabel}>Streak</Text>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.content}>
          {/* Referral code card */}
          <View style={styles.codeCard}>
            <Text style={styles.codeLabel}>Ton code parrainage</Text>
            <View style={styles.codeRow}>
              <Text style={styles.codeText}>{referralCode}</Text>
              <TouchableOpacity style={styles.copyBtn} onPress={handleCopy} activeOpacity={0.7}>
                <Feather name={copied ? 'check' : 'copy'} size={18} color={copied ? '#6B8F71' : colors.textSecondary} />
              </TouchableOpacity>
            </View>
            {copied && <Text style={styles.copiedText}>Code copie !</Text>}
          </View>

          {/* Share CTA */}
          <TouchableOpacity onPress={handleShare} activeOpacity={0.85}>
            <LinearGradient
              colors={['#527A56', '#6B8F71']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.shareBtn}
            >
              <Feather name="share-2" size={20} color="#FFF" />
              <Text style={styles.shareBtnText}>Inviter mes amis</Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* How it works */}
          <View style={styles.howCard}>
            <Text style={styles.sectionTitle}>Comment ca marche ?</Text>
            <View style={styles.step}>
              <View style={[styles.stepCircle, { backgroundColor: '#EFF5F0' }]}>
                <Text style={[styles.stepNum, { color: '#6B8F71' }]}>1</Text>
              </View>
              <Text style={styles.stepText}>Partage ton code avec tes amis</Text>
            </View>
            <View style={styles.step}>
              <View style={[styles.stepCircle, { backgroundColor: '#FDF5ED' }]}>
                <Text style={[styles.stepNum, { color: '#C4956A' }]}>2</Text>
              </View>
              <Text style={styles.stepText}>Ils s'inscrivent avec ton code</Text>
            </View>
            <View style={styles.step}>
              <View style={[styles.stepCircle, { backgroundColor: '#E4ECFB' }]}>
                <Text style={[styles.stepNum, { color: '#5B7FC2' }]}>3</Text>
              </View>
              <Text style={styles.stepText}>Vous debloquez des badges exclusifs</Text>
            </View>
          </View>

          {/* Next badges progress */}
          {nextBadges.length > 0 && (
            <View style={styles.nextBadgesCard}>
              <Text style={styles.sectionTitle}>Prochains badges</Text>
              {nextBadges.map((b, i) => {
                const def = BADGE_DEFS[b.key];
                const pct = Math.min(100, Math.round((b.current / b.target) * 100));
                const remaining = b.target - b.current;
                return (
                  <View key={b.key} style={[styles.nextBadgeRow, i === nextBadges.length - 1 && { marginBottom: 0 }]}>
                    <View style={styles.nextBadgeHeader}>
                      <View style={[styles.nextBadgeIcon, { backgroundColor: def.color + '20' }]}>
                        <Feather name={def.icon} size={18} color={def.color} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.nextBadgeLabel}>{def.label}</Text>
                        <Text style={styles.nextBadgeDesc}>
                          Plus que {remaining} {b.type} !
                        </Text>
                      </View>
                      <Text style={[styles.nextBadgePct, { color: def.color }]}>{pct}%</Text>
                    </View>
                    <View style={styles.progressBarBg}>
                      <View style={[styles.progressBarFill, { width: `${pct}%`, backgroundColor: def.color }]} />
                    </View>
                    <Text style={styles.progressBarText}>{b.current}/{b.target} {b.type}</Text>
                  </View>
                );
              })}
            </View>
          )}

          {/* Milestones */}
          <View style={styles.milestonesCard}>
            <Text style={styles.sectionTitle}>Objectifs parrainage</Text>
            {milestones.map((m, i) => {
              const reached = referralCount >= m.count;
              const pct = Math.min(100, Math.round((referralCount / m.count) * 100));
              return (
                <View key={i} style={[styles.milestoneRow, i === milestones.length - 1 && { borderBottomWidth: 0 }]}>
                  <View style={styles.milestoneTop}>
                    <View style={[styles.milestoneCheck, reached && styles.milestoneCheckDone]}>
                      <Feather name={reached ? 'check' : 'circle'} size={16} color={reached ? '#FFF' : colors.textTertiary} />
                    </View>
                    <View style={styles.milestoneInfo}>
                      <Text style={[styles.milestoneLabel, reached && styles.milestoneLabelDone]}>{m.label}</Text>
                      <Text style={styles.milestoneReward}>{m.reward}</Text>
                    </View>
                    <Text style={styles.milestoneCount}>{Math.min(referralCount, m.count)}/{m.count}</Text>
                  </View>
                  <View style={styles.milestoneProgressBg}>
                    <View style={[styles.milestoneProgressFill, { width: `${pct}%`, backgroundColor: reached ? '#6B8F71' : '#C4956A' }]} />
                  </View>
                </View>
              );
            })}
          </View>

          {/* Badges collection */}
          <View style={styles.badgesCard}>
            <Text style={styles.sectionTitle}>Mes badges</Text>
            <View style={styles.badgesGrid}>
              {ALL_BADGES.map(key => {
                const def = BADGE_DEFS[key];
                const earned = earnedBadges.includes(key);
                return (
                  <View key={key} style={[styles.badgeItem, !earned && styles.badgeItemLocked]}>
                    <View style={[styles.badgeIcon, { backgroundColor: earned ? def.color + '20' : '#F0ECE4' }]}>
                      <Feather name={def.icon} size={22} color={earned ? def.color : '#C4C0B8'} />
                    </View>
                    <Text style={[styles.badgeName, !earned && styles.badgeNameLocked]} numberOfLines={1}>
                      {def.label}
                    </Text>
                    <Text style={styles.badgeDesc} numberOfLines={2}>{def.desc}</Text>
                    {!earned && (
                      <View style={styles.lockOverlay}>
                        <Feather name="lock" size={10} color="#C4C0B8" />
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          </View>

          <View style={{ height: SPACING['3xl'] }} />
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: { flex: 1 },
  headerGradient: {
    paddingBottom: SPACING['2xl'],
    paddingHorizontal: SPACING.xl,
    borderBottomLeftRadius: RADIUS['3xl'],
    borderBottomRightRadius: RADIUS['3xl'],
  },
  headerNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.xl,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: 0.3,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    alignItems: 'center',
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: FONT_SIZE['2xl'],
    fontWeight: '800',
    color: '#FFF',
  },
  statLabel: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.75)',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  content: {
    paddingHorizontal: SPACING.xl,
    marginTop: -SPACING.sm,
  },

  // Code card
  codeCard: {
    backgroundColor: '#FFF',
    borderRadius: RADIUS['2xl'],
    padding: SPACING.xl,
    marginTop: SPACING.lg,
    alignItems: 'center',
    ...SHADOWS.md,
  },
  codeLabel: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: SPACING.md,
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  codeText: {
    fontSize: FONT_SIZE['3xl'] || 28,
    fontWeight: '900',
    color: '#527A56',
    letterSpacing: 3,
  },
  copyBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copiedText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
    color: '#6B8F71',
    marginTop: SPACING.sm,
  },

  // Share button
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    padding: SPACING.lg,
    borderRadius: RADIUS.xl,
    marginTop: SPACING.base,
    ...SHADOWS.md,
  },
  shareBtnText: {
    fontSize: FONT_SIZE.base,
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: 0.3,
  },

  // How it works
  howCard: {
    backgroundColor: '#FFF',
    borderRadius: RADIUS['2xl'],
    padding: SPACING.xl,
    marginTop: SPACING.lg,
    ...SHADOWS.sm,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '800',
    color: colors.text,
    marginBottom: SPACING.lg,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginBottom: SPACING.base,
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNum: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '800',
  },
  stepText: {
    flex: 1,
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    color: colors.text,
  },

  // Next badges
  nextBadgesCard: {
    backgroundColor: '#FFF',
    borderRadius: RADIUS['2xl'],
    padding: SPACING.xl,
    marginTop: SPACING.base,
    ...SHADOWS.sm,
  },
  nextBadgeRow: {
    marginBottom: SPACING.lg,
  },
  nextBadgeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginBottom: SPACING.sm,
  },
  nextBadgeIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextBadgeLabel: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '800',
    color: colors.text,
  },
  nextBadgeDesc: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '500',
    color: colors.textSecondary,
    marginTop: 1,
  },
  nextBadgePct: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '900',
  },
  progressBarBg: {
    height: 8,
    backgroundColor: '#F0ECE4',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressBarText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textTertiary,
    marginTop: 4,
    textAlign: 'right',
  },

  // Milestones
  milestonesCard: {
    backgroundColor: '#FFF',
    borderRadius: RADIUS['2xl'],
    padding: SPACING.xl,
    marginTop: SPACING.base,
    ...SHADOWS.sm,
  },
  milestoneRow: {
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  milestoneTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  milestoneProgressBg: {
    height: 6,
    backgroundColor: '#F0ECE4',
    borderRadius: 3,
    overflow: 'hidden',
    marginLeft: 40,
  },
  milestoneProgressFill: {
    height: '100%',
    borderRadius: 3,
  },
  milestoneCheck: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  milestoneCheckDone: {
    backgroundColor: '#6B8F71',
  },
  milestoneInfo: {
    flex: 1,
  },
  milestoneLabel: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
    color: colors.text,
  },
  milestoneLabelDone: {
    color: '#6B8F71',
  },
  milestoneReward: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '500',
    color: colors.textTertiary,
    marginTop: 1,
  },
  milestoneCount: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
    color: colors.textSecondary,
  },

  // Badges
  badgesCard: {
    backgroundColor: '#FFF',
    borderRadius: RADIUS['2xl'],
    padding: SPACING.xl,
    marginTop: SPACING.base,
    ...SHADOWS.sm,
  },
  badgesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  badgeItem: {
    width: '30%',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: RADIUS.xl,
    backgroundColor: colors.background,
    position: 'relative',
  },
  badgeItemLocked: {
    opacity: 0.5,
  },
  badgeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xs,
  },
  badgeName: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  badgeNameLocked: {
    color: colors.textTertiary,
  },
  badgeDesc: {
    fontSize: 9,
    fontWeight: '500',
    color: colors.textTertiary,
    textAlign: 'center',
    marginTop: 2,
  },
  lockOverlay: {
    position: 'absolute',
    top: 6,
    right: 6,
  },
});

export default ReferralScreen;
