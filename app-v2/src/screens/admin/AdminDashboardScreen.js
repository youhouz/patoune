import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
  StatusBar,
  ActivityIndicator,
  Animated,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { getDashboardAPI, getVisitorAnalyticsAPI } from '../../api/admin';
import colors, { SHADOWS, RADIUS, SPACING, FONT_SIZE } from '../../utils/colors';

const HEADER_PADDING_TOP = Platform.OS === 'ios' ? 56 : (StatusBar.currentHeight || 24) + 12;

const AdminDashboardScreen = ({ navigation }) => {
  const [dashboard, setDashboard] = useState(null);
  const [visitors, setVisitors] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  const fadeAnim = useRef(new Animated.Value(0)).current;

  const fetchData = useCallback(async () => {
    try {
      const [dashRes, visitRes] = await Promise.all([
        getDashboardAPI(),
        getVisitorAnalyticsAPI(7),
      ]);
      setDashboard(dashRes.data.data);
      setVisitors(visitRes.data.data);
    } catch (err) {
      console.error('Admin fetch error:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Chargement des analytics...</Text>
      </View>
    );
  }

  const t = dashboard?.totals || {};
  const g = dashboard?.growth || {};
  const charts = dashboard?.charts || {};
  const vs = visitors?.summary || {};

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Header */}
      <LinearGradient
        colors={['#2C3E2F', '#3A4E3D', '#527A56']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Feather name="arrow-left" size={20} color="#FFF" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Admin Dashboard</Text>
          <Text style={styles.headerSubtitle}>Pepete Analytics</Text>
        </View>
        <View style={styles.liveIndicator}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>Live</Text>
        </View>
      </LinearGradient>

      {/* Tabs */}
      <View style={styles.tabBar}>
        {[
          { key: 'overview', label: 'Vue globale', icon: 'bar-chart-2' },
          { key: 'visitors', label: 'Visiteurs', icon: 'eye' },
          { key: 'users', label: 'Utilisateurs', icon: 'users' },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key)}
            activeOpacity={0.7}
          >
            <Feather
              name={tab.icon}
              size={14}
              color={activeTab === tab.key ? colors.primary : colors.textTertiary}
            />
            <Text
              style={[
                styles.tabText,
                activeTab === tab.key && styles.tabTextActive,
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        <Animated.View style={{ opacity: fadeAnim }}>
          {activeTab === 'overview' && renderOverview(t, g, charts)}
          {activeTab === 'visitors' && renderVisitors(visitors)}
          {activeTab === 'users' && renderUsers(charts, g, navigation)}
        </Animated.View>
        <View style={{ height: SPACING['5xl'] }} />
      </ScrollView>
    </View>
  );
};

// ─── Overview Tab ──────────────────────────────────────────────────────────────
function renderOverview(t, g, charts) {
  return (
    <>
      {/* KPI Grid */}
      <Text style={styles.sectionTitle}>Chiffres cles</Text>
      <View style={styles.kpiGrid}>
        <KPICard icon="users" label="Utilisateurs" value={t.users} sub={`+${g.usersThisWeek || 0} cette semaine`} color="#527A56" />
        <KPICard icon="heart" label="Animaux" value={t.pets} color="#C4956A" />
        <KPICard icon="shield" label="Pet-sitters" value={t.petSitters} color="#6B8F71" />
        <KPICard icon="camera" label="Scans" value={t.scans} sub={`+${g.scansToday || 0} aujourd'hui`} color="#8CB092" />
        <KPICard icon="calendar" label="Réservations" value={t.bookings} sub={`+${g.bookingsThisMonth || 0} ce mois`} color="#C4956A" />
        <KPICard icon="message-circle" label="Messages" value={t.messages} color="#527A56" />
        <KPICard icon="package" label="Produits" value={t.products} color="#6B8F71" />
        <KPICard icon="mail" label="Abonnes pre-launch" value={t.subscribers} color="#8CB092" />
      </View>

      {/* Growth */}
      <Text style={styles.sectionTitle}>Croissance</Text>
      <View style={styles.growthCard}>
        <GrowthRow label="Nouveaux users aujourd'hui" value={g.usersToday} icon="trending-up" />
        <GrowthRow label="Nouveaux users cette semaine" value={g.usersThisWeek} icon="trending-up" />
        <GrowthRow label="Nouveaux users ce mois" value={g.usersThisMonth} icon="trending-up" />
        <GrowthRow label="Scans aujourd'hui" value={g.scansToday} icon="camera" />
        <GrowthRow label="Scans cette semaine" value={g.scansThisWeek} icon="camera" isLast />
      </View>

      {/* Inscriptions trend */}
      {charts.registrationTrend?.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Inscriptions (30 jours)</Text>
          <View style={styles.trendCard}>
            {charts.registrationTrend.map((day) => (
              <View key={day._id} style={styles.trendRow}>
                <Text style={styles.trendDate}>{formatDate(day._id)}</Text>
                <View style={styles.trendBarWrap}>
                  <View
                    style={[
                      styles.trendBar,
                      {
                        width: `${Math.min(100, (day.count / Math.max(...charts.registrationTrend.map((d) => d.count))) * 100)}%`,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.trendCount}>{day.count}</Text>
              </View>
            ))}
          </View>
        </>
      )}

      {/* Feedbacks alert */}
      {t.newFeedbacks > 0 && (
        <View style={styles.alertCard}>
          <Feather name="alert-circle" size={18} color={colors.warning} />
          <Text style={styles.alertText}>
            {t.newFeedbacks} feedback{t.newFeedbacks > 1 ? 's' : ''} non lu{t.newFeedbacks > 1 ? 's' : ''}
          </Text>
        </View>
      )}
    </>
  );
}

// ─── Visitors Tab ──────────────────────────────────────────────────────────────
function renderVisitors(visitors) {
  if (!visitors) return <Text style={styles.emptyText}>Aucune donnee visiteur pour le moment</Text>;
  const { summary, requestsByDevice, topPaths, requestsTrend, topIps, recentVisitors } = visitors;

  return (
    <>
      {/* Summary */}
      <Text style={styles.sectionTitle}>Resume ({summary.period})</Text>
      <View style={styles.kpiGrid}>
        <KPICard icon="activity" label="Requetes" value={summary.totalRequests} color="#527A56" />
        <KPICard icon="globe" label="IPs uniques" value={summary.uniqueIps} color="#C4956A" />
      </View>

      {/* By device */}
      <Text style={styles.sectionTitle}>Par appareil</Text>
      <View style={styles.card}>
        {requestsByDevice?.map((d) => (
          <View key={d._id} style={styles.deviceRow}>
            <Feather
              name={d._id === 'ios' ? 'smartphone' : d._id === 'android' ? 'smartphone' : d._id === 'web' ? 'monitor' : 'help-circle'}
              size={16}
              color={colors.primary}
            />
            <Text style={styles.deviceLabel}>{d._id || 'unknown'}</Text>
            <Text style={styles.deviceCount}>{d.count}</Text>
          </View>
        ))}
      </View>

      {/* Traffic trend */}
      {requestsTrend?.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Trafic par jour</Text>
          <View style={styles.trendCard}>
            {requestsTrend.map((day) => (
              <View key={day._id} style={styles.trendRow}>
                <Text style={styles.trendDate}>{formatDate(day._id)}</Text>
                <View style={styles.trendBarWrap}>
                  <View
                    style={[
                      styles.trendBar,
                      {
                        width: `${Math.min(100, (day.count / Math.max(...requestsTrend.map((d) => d.count))) * 100)}%`,
                        backgroundColor: colors.accent,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.trendCount}>{day.count}</Text>
                <Text style={styles.trendSub}>{day.uniqueVisitors} uniq</Text>
              </View>
            ))}
          </View>
        </>
      )}

      {/* Top endpoints */}
      <Text style={styles.sectionTitle}>Top endpoints</Text>
      <View style={styles.card}>
        {topPaths?.map((p, i) => (
          <View key={i} style={[styles.pathRow, i < topPaths.length - 1 && styles.rowBorder]}>
            <Text style={styles.pathRank}>#{i + 1}</Text>
            <Text style={styles.pathName} numberOfLines={1}>{p._id}</Text>
            <Text style={styles.pathCount}>{p.count}</Text>
            <Text style={styles.pathDuration}>{Math.round(p.avgDuration)}ms</Text>
          </View>
        ))}
      </View>

      {/* Top IPs */}
      <Text style={styles.sectionTitle}>Top IPs</Text>
      <View style={styles.card}>
        {topIps?.slice(0, 10).map((ip, i) => (
          <View key={i} style={[styles.ipRow, i < 9 && styles.rowBorder]}>
            <View style={styles.ipInfo}>
              <Text style={styles.ipAddress} numberOfLines={1}>{ip._id}</Text>
              <Text style={styles.ipMeta}>
                {ip.devices?.join(', ')} — {ip.count} req
              </Text>
            </View>
            <Text style={styles.ipDate}>{formatDateTime(ip.lastSeen)}</Text>
          </View>
        ))}
      </View>

      {/* Recent visitors */}
      <Text style={styles.sectionTitle}>Derniers visiteurs</Text>
      <View style={styles.card}>
        {recentVisitors?.slice(0, 15).map((v, i) => (
          <View key={i} style={[styles.visitorRow, i < 14 && styles.rowBorder]}>
            <View style={[styles.deviceDot, { backgroundColor: v.device === 'ios' ? '#527A56' : v.device === 'android' ? '#6B8F71' : '#C4956A' }]} />
            <View style={styles.visitorInfo}>
              <Text style={styles.visitorIp}>{v._id}</Text>
              <Text style={styles.visitorMeta}>
                {v.device} — {v.requestCount} req — {v.path}
              </Text>
            </View>
            <Text style={styles.visitorDate}>{formatDateTime(v.lastSeen)}</Text>
          </View>
        ))}
      </View>
    </>
  );
}

// ─── Users Tab ─────────────────────────────────────────────────────────────────
function renderUsers(charts, g, navigation) {
  return (
    <>
      {/* By role */}
      <Text style={styles.sectionTitle}>Par role</Text>
      <View style={styles.kpiGrid}>
        {charts.usersByRole?.map((r) => (
          <KPICard
            key={r._id}
            icon={r._id === 'admin' ? 'shield' : r._id === 'guardian' ? 'briefcase' : r._id === 'both' ? 'layers' : 'user'}
            label={r._id || 'user'}
            value={r.count}
            color={r._id === 'admin' ? '#C25B4A' : r._id === 'guardian' ? '#C4956A' : '#527A56'}
          />
        ))}
      </View>

      {/* By city */}
      {charts.usersByCity?.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Top villes</Text>
          <View style={styles.card}>
            {charts.usersByCity.map((c, i) => (
              <View key={i} style={[styles.cityRow, i < charts.usersByCity.length - 1 && styles.rowBorder]}>
                <Feather name="map-pin" size={14} color={colors.primary} />
                <Text style={styles.cityName}>{c._id}</Text>
                <Text style={styles.cityCount}>{c.count}</Text>
              </View>
            ))}
          </View>
        </>
      )}

      {/* Bookings by status */}
      {charts.bookingsByStatus?.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Reservations par statut</Text>
          <View style={styles.card}>
            {charts.bookingsByStatus.map((b, i) => (
              <View key={i} style={[styles.statusRow, i < charts.bookingsByStatus.length - 1 && styles.rowBorder]}>
                <View style={[styles.statusDot, { backgroundColor: statusColor(b._id) }]} />
                <Text style={styles.statusLabel}>{b._id}</Text>
                <Text style={styles.statusCount}>{b.count}</Text>
              </View>
            ))}
          </View>
        </>
      )}

      {/* View all users button */}
      <TouchableOpacity
        style={styles.viewAllButton}
        onPress={() => navigation.navigate('AdminUsers')}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={['#527A56', '#6B8F71']}
          style={styles.viewAllGradient}
        >
          <Feather name="list" size={18} color="#FFF" />
          <Text style={styles.viewAllText}>Voir tous les utilisateurs</Text>
        </LinearGradient>
      </TouchableOpacity>

      {/* Manage pet-sitters button */}
      <TouchableOpacity
        style={[styles.viewAllButton, { marginTop: 10 }]}
        onPress={() => navigation.navigate('AdminPetSitters')}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={['#C4956A', '#A07850']}
          style={styles.viewAllGradient}
        >
          <Feather name="users" size={18} color="#FFF" />
          <Text style={styles.viewAllText}>Gerer les pet-sitters</Text>
        </LinearGradient>
      </TouchableOpacity>
    </>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────────
function KPICard({ icon, label, value, sub, color }) {
  return (
    <View style={styles.kpiCard}>
      <View style={[styles.kpiIcon, { backgroundColor: color + '15' }]}>
        <Feather name={icon} size={18} color={color} />
      </View>
      <Text style={styles.kpiValue}>{value ?? 0}</Text>
      <Text style={styles.kpiLabel}>{label}</Text>
      {sub ? <Text style={styles.kpiSub}>{sub}</Text> : null}
    </View>
  );
}

function GrowthRow({ label, value, icon, isLast }) {
  return (
    <View style={[styles.growthRow, !isLast && styles.rowBorder]}>
      <Feather name={icon} size={14} color={colors.primary} />
      <Text style={styles.growthLabel}>{label}</Text>
      <Text style={styles.growthValue}>{value ?? 0}</Text>
    </View>
  );
}

// ─── Helpers ───────────────────────────────────────────────────────────────────
function formatDate(dateStr) {
  const d = new Date(dateStr);
  return `${d.getDate()}/${d.getMonth() + 1}`;
}

function formatDateTime(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return `${d.getDate()}/${d.getMonth() + 1} ${d.getHours()}h${String(d.getMinutes()).padStart(2, '0')}`;
}

function statusColor(status) {
  const map = { pending: '#C4956A', confirmed: '#527A56', ongoing: '#6B8F71', completed: '#8CB092', cancelled: '#C25B4A' };
  return map[status] || colors.textTertiary;
}

// ─── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    ...(Platform.OS === 'web' ? { height: '100vh', overflow: 'hidden' } : {}),
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    gap: SPACING.md,
  },
  loadingText: {
    fontSize: FONT_SIZE.sm,
    color: colors.textSecondary,
    fontWeight: '500',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: HEADER_PADDING_TOP,
    paddingBottom: SPACING.base,
    paddingHorizontal: SPACING.lg,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.md,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  headerTitle: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: 0.3,
  },
  headerSubtitle: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.6)',
    marginTop: 1,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 2,
    borderRadius: RADIUS.full,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4ADE80',
  },
  liveText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
    color: '#4ADE80',
  },

  // Tab bar
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.sm + 2,
    borderRadius: RADIUS.lg,
    backgroundColor: colors.white,
    ...SHADOWS.xs,
  },
  tabActive: {
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.primary + '30',
  },
  tabText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
    color: colors.textTertiary,
  },
  tabTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },

  scrollView: {
    flex: 1,
    ...(Platform.OS === 'web' ? { overflowY: 'auto', WebkitOverflowScrolling: 'touch' } : {}),
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
  },

  // Sections
  sectionTitle: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: SPACING.md,
    marginTop: SPACING.lg,
    marginLeft: SPACING.xs,
  },

  // KPI grid
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  kpiCard: {
    width: '48%',
    flexGrow: 1,
    backgroundColor: colors.white,
    borderRadius: RADIUS.xl,
    padding: SPACING.base,
    ...SHADOWS.sm,
  },
  kpiIcon: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  kpiValue: {
    fontSize: FONT_SIZE['2xl'],
    fontWeight: '800',
    color: colors.text,
  },
  kpiLabel: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
    color: colors.textSecondary,
    marginTop: 2,
  },
  kpiSub: {
    fontSize: FONT_SIZE['2xs'],
    fontWeight: '500',
    color: colors.primary,
    marginTop: 3,
  },

  // Growth card
  growthCard: {
    backgroundColor: colors.white,
    borderRadius: RADIUS.xl,
    padding: SPACING.base,
    ...SHADOWS.sm,
  },
  growthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    gap: SPACING.sm,
  },
  growthLabel: {
    flex: 1,
    fontSize: FONT_SIZE.sm,
    fontWeight: '500',
    color: colors.text,
  },
  growthValue: {
    fontSize: FONT_SIZE.md,
    fontWeight: '800',
    color: colors.primary,
  },

  // Trend
  trendCard: {
    backgroundColor: colors.white,
    borderRadius: RADIUS.xl,
    padding: SPACING.base,
    ...SHADOWS.sm,
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
    gap: SPACING.sm,
  },
  trendDate: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
    color: colors.textSecondary,
    width: 36,
  },
  trendBarWrap: {
    flex: 1,
    height: 8,
    backgroundColor: colors.borderLight,
    borderRadius: 4,
    overflow: 'hidden',
  },
  trendBar: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  trendCount: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
    color: colors.text,
    width: 28,
    textAlign: 'right',
  },
  trendSub: {
    fontSize: FONT_SIZE['2xs'],
    color: colors.textTertiary,
    fontWeight: '500',
    width: 40,
  },

  // Generic card
  card: {
    backgroundColor: colors.white,
    borderRadius: RADIUS.xl,
    padding: SPACING.base,
    ...SHADOWS.sm,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },

  // Alert card
  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: colors.warningSoft,
    borderRadius: RADIUS.lg,
    padding: SPACING.base,
    marginTop: SPACING.lg,
    borderWidth: 1,
    borderColor: colors.warning + '30',
  },
  alertText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    color: colors.warning,
  },

  emptyText: {
    fontSize: FONT_SIZE.sm,
    color: colors.textTertiary,
    textAlign: 'center',
    marginTop: SPACING['2xl'],
  },

  // Device rows
  deviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.sm,
  },
  deviceLabel: {
    flex: 1,
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    color: colors.text,
    textTransform: 'capitalize',
  },
  deviceCount: {
    fontSize: FONT_SIZE.md,
    fontWeight: '800',
    color: colors.primary,
  },

  // Path rows
  pathRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
  },
  pathRank: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
    color: colors.textTertiary,
    width: 24,
  },
  pathName: {
    flex: 1,
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
    color: colors.text,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  pathCount: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
    color: colors.primary,
    width: 40,
    textAlign: 'right',
  },
  pathDuration: {
    fontSize: FONT_SIZE['2xs'],
    color: colors.textTertiary,
    fontWeight: '500',
    width: 40,
    textAlign: 'right',
  },

  // IP rows
  ipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  ipInfo: {
    flex: 1,
  },
  ipAddress: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
    color: colors.text,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  ipMeta: {
    fontSize: FONT_SIZE['2xs'],
    color: colors.textTertiary,
    fontWeight: '500',
    marginTop: 2,
  },
  ipDate: {
    fontSize: FONT_SIZE['2xs'],
    color: colors.textSecondary,
    fontWeight: '500',
  },

  // Visitor rows
  visitorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
  },
  deviceDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  visitorInfo: {
    flex: 1,
  },
  visitorIp: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
    color: colors.text,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  visitorMeta: {
    fontSize: FONT_SIZE['2xs'],
    color: colors.textTertiary,
    fontWeight: '500',
    marginTop: 1,
  },
  visitorDate: {
    fontSize: FONT_SIZE['2xs'],
    color: colors.textSecondary,
    fontWeight: '500',
  },

  // City rows
  cityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
  },
  cityName: {
    flex: 1,
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    color: colors.text,
  },
  cityCount: {
    fontSize: FONT_SIZE.md,
    fontWeight: '800',
    color: colors.primary,
  },

  // Status rows
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statusLabel: {
    flex: 1,
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    color: colors.text,
    textTransform: 'capitalize',
  },
  statusCount: {
    fontSize: FONT_SIZE.md,
    fontWeight: '800',
    color: colors.text,
  },

  // View all button
  viewAllButton: {
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    marginTop: SPACING.xl,
    ...SHADOWS.glow('#527A56'),
  },
  viewAllGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.base,
    borderRadius: RADIUS.xl,
    gap: SPACING.sm,
  },
  viewAllText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
    color: '#FFF',
    letterSpacing: 0.3,
  },
});

export default AdminDashboardScreen;
