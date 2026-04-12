// ─────────────────────────────────────────────────────────────────────────────
// Pépète — PetSitterBookingsScreen
// Dashboard pet-sitter : demandes de réservation + gestion
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, StatusBar, RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { getMyBookingsAPI, updateBookingStatusAPI } from '../../api/petsitters';
import { useAuth } from '../../context/AuthContext';
import { showAlert } from '../../utils/alert';
import { FONTS } from '../../utils/typography';
import colors, { SHADOWS, RADIUS, SPACING, FONT_SIZE } from '../../utils/colors';

const STATUS_CONFIG = {
  pending:   { label: 'En attente', color: '#F59E0B', bg: '#FEF3C7', icon: 'clock' },
  confirmed: { label: 'Confirmee',  color: '#10B981', bg: '#D1FAE5', icon: 'check-circle' },
  ongoing:   { label: 'En cours',   color: '#3B82F6', bg: '#DBEAFE', icon: 'play-circle' },
  completed: { label: 'Terminee',   color: '#6B7280', bg: '#F3F4F6', icon: 'check' },
  cancelled: { label: 'Annulee',    color: '#EF4444', bg: '#FEE2E2', icon: 'x-circle' },
};

const SERVICE_LABELS = {
  garde_domicile: 'Garde a domicile',
  garde_chez_sitter: 'Garde chez sitter',
  promenade: 'Promenade',
  visite: 'Visite a domicile',
  toilettage: 'Toilettage',
};

const PetSitterBookingsScreen = ({ navigation }) => {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);

  useFocusEffect(
    useCallback(() => {
      loadBookings();
    }, [])
  );

  const loadBookings = async () => {
    try {
      const res = await getMyBookingsAPI();
      const data = res.data?.bookings || res.data || [];
      // Filter bookings where I am the sitter
      const myBookings = Array.isArray(data) ? data.filter(b => {
        const sitterUserId = b.sitter?.user?._id || b.sitter?.user;
        return sitterUserId === user?.id;
      }) : [];
      setBookings(myBookings);
    } catch (err) {
      console.log('Erreur chargement réservations:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadBookings();
  }, []);

  const handleStatusChange = (booking, newStatus) => {
    const labels = { confirmed: 'accepter', cancelled: 'refuser' };
    showAlert(
      `${labels[newStatus] === 'accepter' ? 'Accepter' : 'Refuser'} cette demande ?`,
      `Réservation de ${booking.owner?.name || 'un proprietaire'} pour ${booking.pet?.name || 'un animal'}.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: labels[newStatus] === 'accepter' ? 'Accepter' : 'Refuser',
          style: newStatus === 'cancelled' ? 'destructive' : 'default',
          onPress: () => updateStatus(booking._id, newStatus),
        },
      ]
    );
  };

  const updateStatus = async (id, status) => {
    setUpdatingId(id);
    try {
      await updateBookingStatusAPI(id, status);
      setBookings(prev => prev.map(b => b._id === id ? { ...b, status } : b));
    } catch (err) {
      showAlert('Erreur', 'Impossible de mettre à jour la réservation.');
    } finally {
      setUpdatingId(null);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  const renderBooking = ({ item }) => {
    const config = STATUS_CONFIG[item.status] || STATUS_CONFIG.pending;
    const isUpdating = updatingId === item._id;

    return (
      <View style={[s.card, isUpdating && { opacity: 0.6 }]}>
        {/* Status badge */}
        <View style={s.cardHeader}>
          <View style={[s.statusBadge, { backgroundColor: config.bg }]}>
            <Feather name={config.icon} size={12} color={config.color} />
            <Text style={[s.statusText, { color: config.color }]}>{config.label}</Text>
          </View>
          <Text style={s.cardDate}>
            {formatDate(item.startDate)} → {formatDate(item.endDate)}
          </Text>
        </View>

        {/* Owner & Pet info */}
        <View style={s.infoSection}>
          <View style={s.infoRow}>
            <Feather name="user" size={15} color={colors.primary} />
            <Text style={s.infoLabel}>Proprietaire :</Text>
            <Text style={s.infoValue}>{item.owner?.name || 'Inconnu'}</Text>
          </View>
          <View style={s.infoRow}>
            <Feather name="heart" size={15} color={colors.primary} />
            <Text style={s.infoLabel}>Animal :</Text>
            <Text style={s.infoValue}>{item.pet?.name || 'Non precise'}</Text>
          </View>
          <View style={s.infoRow}>
            <Feather name="briefcase" size={15} color={colors.primary} />
            <Text style={s.infoLabel}>Service :</Text>
            <Text style={s.infoValue}>{SERVICE_LABELS[item.service] || item.service || '-'}</Text>
          </View>
          {item.totalPrice > 0 && (
            <View style={s.infoRow}>
              <Feather name="credit-card" size={15} color={colors.primary} />
              <Text style={s.infoLabel}>Total :</Text>
              <Text style={[s.infoValue, { fontWeight: '800', color: colors.primaryDark }]}>{item.totalPrice} €</Text>
            </View>
          )}
        </View>

        {/* Action buttons for pending bookings */}
        {item.status === 'pending' && (
          <View style={s.actionRow}>
            <TouchableOpacity
              style={s.declineBtn}
              onPress={() => handleStatusChange(item, 'cancelled')}
              disabled={isUpdating}
              activeOpacity={0.7}
            >
              <Feather name="x" size={16} color={colors.error} />
              <Text style={s.declineBtnText}>Refuser</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={s.acceptBtn}
              onPress={() => handleStatusChange(item, 'confirmed')}
              disabled={isUpdating}
              activeOpacity={0.7}
            >
              {isUpdating ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <>
                  <Feather name="check" size={16} color="#FFF" />
                  <Text style={s.acceptBtnText}>Accepter</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Message button for confirmed/ongoing */}
        {(item.status === 'confirmed' || item.status === 'ongoing') && item.owner?._id && (
          <TouchableOpacity
            style={s.messageBtn}
            onPress={() => navigation.navigate('Garde', { screen: 'Messages', params: { userId: item.owner._id, userName: item.owner.name } })}
            activeOpacity={0.7}
          >
            <Feather name="message-circle" size={16} color={colors.primary} />
            <Text style={s.messageBtnText}>Contacter {item.owner?.name}</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const pendingCount = bookings.filter(b => b.status === 'pending').length;

  const renderEmpty = () => (
    <View style={s.emptyWrap}>
      <View style={s.emptyIcon}>
        <Feather name="inbox" size={48} color={colors.textLight} />
      </View>
      <Text style={s.emptyTitle}>Aucune demande</Text>
      <Text style={s.emptySub}>
        Les demandes de reservation de proprietaires{'\n'}apparaitront ici.
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={s.loadingWrap}>
        <StatusBar barStyle="light-content" />
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={s.loadingText}>Chargement...</Text>
      </View>
    );
  }

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" />

      <LinearGradient
        colors={['#1C2B1E', '#2C3E2F', '#3D5E41']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[s.header, { paddingTop: insets.top + 12 }]}
      >
        <View style={s.headerRow}>
          <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
            <Feather name="chevron-left" size={22} color="rgba(255,255,255,0.9)" />
          </TouchableOpacity>
          <View style={s.headerCenter}>
            <Text style={s.headerTitle}>Mes reservations</Text>
            {pendingCount > 0 && (
              <View style={s.pendingBadge}>
                <Text style={s.pendingBadgeText}>{pendingCount}</Text>
              </View>
            )}
          </View>
        </View>
      </LinearGradient>

      <FlatList
        data={bookings}
        renderItem={renderBooking}
        keyExtractor={item => item._id}
        contentContainerStyle={[s.list, bookings.length === 0 && { flex: 1 }, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      />
    </View>
  );
};

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background, gap: SPACING.md },
  loadingText: { fontFamily: FONTS.bodyMedium, fontSize: FONT_SIZE.base, color: colors.textSecondary },

  header: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.xl },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.base },
  backBtn: {
    width: 38, height: 38, borderRadius: RADIUS.lg,
    backgroundColor: 'rgba(255,255,255,0.10)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerCenter: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  headerTitle: { fontFamily: FONTS.brand, fontSize: FONT_SIZE.xl, color: '#FFF', letterSpacing: -0.4 },
  pendingBadge: {
    backgroundColor: '#F59E0B', paddingHorizontal: SPACING.sm, paddingVertical: 2,
    borderRadius: RADIUS.full,
  },
  pendingBadgeText: { fontFamily: FONTS.bodySemiBold, fontSize: FONT_SIZE.xs, color: '#FFF' },

  list: { padding: SPACING.base, paddingTop: SPACING.xl, gap: SPACING.md },

  // Card
  card: {
    backgroundColor: colors.white, borderRadius: RADIUS.xl,
    padding: SPACING.base, ...SHADOWS.md,
  },
  cardHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: SPACING.base, paddingBottom: SPACING.sm,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: SPACING.md, paddingVertical: 4, borderRadius: RADIUS.full,
  },
  statusText: { fontFamily: FONTS.bodySemiBold, fontSize: FONT_SIZE.xs },
  cardDate: { fontFamily: FONTS.bodyMedium, fontSize: FONT_SIZE.sm, color: colors.textSecondary },

  // Info
  infoSection: { gap: SPACING.sm },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  infoLabel: { fontFamily: FONTS.body, fontSize: FONT_SIZE.sm, color: colors.textSecondary },
  infoValue: { fontFamily: FONTS.bodySemiBold, fontSize: FONT_SIZE.sm, color: colors.text, flex: 1 },

  // Actions
  actionRow: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.base },
  declineBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.xs,
    paddingVertical: SPACING.md, borderRadius: RADIUS.xl,
    backgroundColor: '#FEE2E2', borderWidth: 1, borderColor: 'rgba(239,68,68,0.2)',
  },
  declineBtnText: { fontFamily: FONTS.bodySemiBold, fontSize: FONT_SIZE.sm, color: colors.error },
  acceptBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.xs,
    paddingVertical: SPACING.md, borderRadius: RADIUS.xl, backgroundColor: colors.primary,
  },
  acceptBtnText: { fontFamily: FONTS.bodySemiBold, fontSize: FONT_SIZE.sm, color: '#FFF' },

  // Message
  messageBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm,
    paddingVertical: SPACING.md, borderRadius: RADIUS.xl, marginTop: SPACING.base,
    backgroundColor: colors.primarySoft, borderWidth: 1, borderColor: colors.primary + '30',
  },
  messageBtnText: { fontFamily: FONTS.bodySemiBold, fontSize: FONT_SIZE.sm, color: colors.primary },

  // Empty
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: SPACING['2xl'] },
  emptyIcon: {
    width: 96, height: 96, borderRadius: 48, backgroundColor: colors.background,
    alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.xl,
  },
  emptyTitle: { fontFamily: FONTS.heading, fontSize: FONT_SIZE['2xl'], color: colors.text, marginBottom: SPACING.sm },
  emptySub: {
    fontFamily: FONTS.body, fontSize: FONT_SIZE.base, color: colors.textSecondary,
    textAlign: 'center', lineHeight: 22,
  },
});

export default PetSitterBookingsScreen;
