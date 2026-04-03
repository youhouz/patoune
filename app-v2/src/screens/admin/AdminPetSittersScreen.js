import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Platform,
  StatusBar,
  ActivityIndicator,
  TextInput,
  Alert,
  Modal,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { getAdminPetSittersAPI, deleteAdminPetSitterAPI, updateAdminPetSitterAPI } from '../../api/admin';
import { showAlert } from '../../utils/alert';
import colors, { SHADOWS, RADIUS, SPACING, FONT_SIZE } from '../../utils/colors';

const HEADER_PADDING_TOP = Platform.OS === 'ios' ? 56 : (StatusBar.currentHeight || 24) + 12;

const AdminPetSittersScreen = ({ navigation }) => {
  const [petsitters, setPetsitters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [editModal, setEditModal] = useState(null);
  const [editBio, setEditBio] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editVerified, setEditVerified] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchPetSitters = useCallback(async (p = 1, q = '') => {
    try {
      setLoading(true);
      const res = await getAdminPetSittersAPI({ page: p, search: q });
      const d = res.data;
      setPetsitters(p === 1 ? d.data : (prev) => [...prev, ...d.data]);
      setTotalPages(d.pages);
      setTotal(d.total);
      setPage(p);
    } catch (err) {
      console.error('Fetch petsitters error:', err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPetSitters(1, search);
  }, []);

  const handleSearch = () => {
    fetchPetSitters(1, search);
  };

  const loadMore = () => {
    if (page < totalPages && !loading) {
      fetchPetSitters(page + 1, search);
    }
  };

  const handleDelete = (sitter) => {
    const name = sitter.user?.name || 'ce pet-sitter';
    const doDelete = async () => {
      try {
        await deleteAdminPetSitterAPI(sitter._id);
        setPetsitters((prev) => prev.filter((s) => s._id !== sitter._id));
        setTotal((t) => t - 1);
        showAlert('Supprime', `${name} a ete supprime.`);
      } catch (err) {
        showAlert('Erreur', err.message);
      }
    };

    if (Platform.OS === 'web') {
      if (confirm(`Supprimer ${name} ? Cette action est irreversible.`)) {
        doDelete();
      }
    } else {
      Alert.alert(
        'Supprimer',
        `Supprimer ${name} ? Cette action est irreversible.`,
        [
          { text: 'Annuler', style: 'cancel' },
          { text: 'Supprimer', style: 'destructive', onPress: doDelete },
        ]
      );
    }
  };

  const openEdit = (sitter) => {
    setEditModal(sitter);
    setEditBio(sitter.bio || '');
    setEditPrice(String(sitter.pricePerDay || 0));
    setEditVerified(sitter.verified || false);
  };

  const handleSaveEdit = async () => {
    if (!editModal) return;
    setSaving(true);
    try {
      const updates = {
        bio: editBio,
        pricePerDay: parseFloat(editPrice) || 0,
        verified: editVerified,
      };
      await updateAdminPetSitterAPI(editModal._id, updates);
      setPetsitters((prev) =>
        prev.map((s) =>
          s._id === editModal._id ? { ...s, ...updates } : s
        )
      );
      setEditModal(null);
      showAlert('Sauvegarde', 'Profil mis a jour.');
    } catch (err) {
      showAlert('Erreur', err.message);
    } finally {
      setSaving(false);
    }
  };

  const renderSitter = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {(item.user?.name || '?').charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.info}>
          <View style={styles.nameRow}>
            <Text style={styles.name} numberOfLines={1}>{item.user?.name || 'Sans nom'}</Text>
            {item.verified && (
              <View style={styles.verifiedChip}>
                <Feather name="check-circle" size={10} color="#527A56" />
                <Text style={styles.verifiedText}>Verifie</Text>
              </View>
            )}
          </View>
          <Text style={styles.email}>{item.user?.email || '-'}</Text>
          <View style={styles.metaRow}>
            <View style={styles.metaChip}>
              <Feather name="star" size={10} color="#C4956A" />
              <Text style={styles.metaText}>{(item.rating || 0).toFixed(1)} ({item.reviewCount || 0})</Text>
            </View>
            <View style={styles.metaChip}>
              <Feather name="dollar-sign" size={10} color={colors.primary} />
              <Text style={styles.metaText}>{item.pricePerDay || 0}€/jour</Text>
            </View>
            <View style={styles.metaChip}>
              <Feather name="briefcase" size={10} color={colors.textTertiary} />
              <Text style={styles.metaText}>{item.experience || 0} an{(item.experience || 0) > 1 ? 's' : ''}</Text>
            </View>
          </View>
          {item.bio ? (
            <Text style={styles.bio} numberOfLines={2}>{item.bio}</Text>
          ) : null}
          <View style={styles.tagsRow}>
            {item.acceptedAnimals?.slice(0, 3).map((a, i) => (
              <View key={i} style={styles.animalTag}>
                <Text style={styles.animalTagText}>{a}</Text>
              </View>
            ))}
            {item.services?.length > 0 && (
              <View style={styles.serviceTag}>
                <Text style={styles.serviceTagText}>{item.services.length} service{item.services.length > 1 ? 's' : ''}</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.editBtn}
          onPress={() => openEdit(item)}
          activeOpacity={0.7}
        >
          <Feather name="edit-2" size={14} color="#527A56" />
          <Text style={styles.editBtnText}>Modifier</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.deleteBtn}
          onPress={() => handleDelete(item)}
          activeOpacity={0.7}
        >
          <Feather name="trash-2" size={14} color="#C25B4A" />
          <Text style={styles.deleteBtnText}>Supprimer</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Feather name="arrow-left" size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pet-sitters</Text>
        <View style={styles.totalBadge}>
          <Text style={styles.totalText}>{total}</Text>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          placeholder="Chercher par bio..."
          placeholderTextColor={colors.placeholder}
          value={search}
          onChangeText={setSearch}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />
        <TouchableOpacity style={styles.searchBtn} onPress={handleSearch} activeOpacity={0.8}>
          <Feather name="search" size={18} color="#FFF" />
        </TouchableOpacity>
      </View>

      {Platform.OS === 'web' ? (
        <View style={styles.webScroll}>
          {petsitters.length === 0 && !loading ? (
            <View style={styles.emptyContainer}>
              <Feather name="users" size={40} color={colors.textTertiary} />
              <Text style={styles.emptyText}>Aucun pet-sitter trouve</Text>
            </View>
          ) : (
            petsitters.map((item) => <View key={item._id}>{renderSitter({ item })}</View>)
          )}
          {loading && <ActivityIndicator style={{ padding: SPACING.lg }} color={colors.primary} />}
        </View>
      ) : (
        <FlatList
          data={petsitters}
          keyExtractor={(item) => item._id}
          renderItem={renderSitter}
          contentContainerStyle={styles.list}
          onEndReached={loadMore}
          onEndReachedThreshold={0.3}
          ListEmptyComponent={
            !loading ? (
              <View style={styles.emptyContainer}>
                <Feather name="users" size={40} color={colors.textTertiary} />
                <Text style={styles.emptyText}>Aucun pet-sitter trouve</Text>
              </View>
            ) : null
          }
          ListFooterComponent={
            loading ? <ActivityIndicator style={{ padding: SPACING.lg }} color={colors.primary} /> : null
          }
        />
      )}

      {/* Edit Modal */}
      <Modal visible={!!editModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Modifier le profil</Text>
              <TouchableOpacity onPress={() => setEditModal(null)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Feather name="x" size={22} color={colors.text} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalLabel}>Bio</Text>
            <TextInput
              style={styles.modalTextArea}
              value={editBio}
              onChangeText={setEditBio}
              multiline
              maxLength={500}
              placeholder="Bio du pet-sitter..."
              placeholderTextColor={colors.placeholder}
            />

            <Text style={styles.modalLabel}>Prix par jour (€)</Text>
            <TextInput
              style={styles.modalInput}
              value={editPrice}
              onChangeText={setEditPrice}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor={colors.placeholder}
            />

            <TouchableOpacity
              style={styles.verifiedToggle}
              onPress={() => setEditVerified(!editVerified)}
              activeOpacity={0.7}
            >
              <View style={[styles.checkbox, editVerified && styles.checkboxActive]}>
                {editVerified && <Feather name="check" size={14} color="#FFF" />}
              </View>
              <Text style={styles.verifiedToggleText}>Profil verifie</Text>
            </TouchableOpacity>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setEditModal(null)}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelBtnText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveBtn}
                onPress={handleSaveEdit}
                activeOpacity={0.7}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Text style={styles.saveBtnText}>Sauvegarder</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    ...(Platform.OS === 'web' ? { height: '100vh', overflow: 'hidden' } : {}),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: HEADER_PADDING_TOP,
    paddingBottom: SPACING.base,
    paddingHorizontal: SPACING.lg,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.md,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.sm,
  },
  headerTitle: {
    flex: 1,
    fontSize: FONT_SIZE.xl,
    fontWeight: '800',
    color: colors.text,
    marginLeft: SPACING.md,
    letterSpacing: 0.2,
  },
  totalBadge: {
    backgroundColor: colors.primary + '15',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
  },
  totalText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '800',
    color: colors.primary,
  },
  searchRow: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    gap: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.md,
    fontSize: FONT_SIZE.sm,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
    ...SHADOWS.xs,
  },
  searchBtn: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.lg,
    backgroundColor: '#527A56',
    alignItems: 'center',
    justifyContent: 'center',
  },
  webScroll: {
    flex: 1,
    overflowY: 'auto',
    WebkitOverflowScrolling: 'touch',
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING['3xl'],
  },
  list: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING['3xl'],
  },

  // Card
  card: {
    backgroundColor: colors.white,
    borderRadius: RADIUS.xl,
    padding: SPACING.base,
    marginBottom: SPACING.md,
    ...SHADOWS.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '800',
    color: colors.primary,
  },
  info: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  name: {
    fontSize: FONT_SIZE.base,
    fontWeight: '700',
    color: colors.text,
    flexShrink: 1,
  },
  verifiedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF5F0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.xs,
    gap: 3,
  },
  verifiedText: {
    fontSize: FONT_SIZE['2xs'] || 10,
    fontWeight: '700',
    color: '#527A56',
  },
  email: {
    fontSize: FONT_SIZE.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
    marginTop: SPACING.sm,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.borderLight,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
  },
  metaText: {
    fontSize: FONT_SIZE['2xs'] || 10,
    fontWeight: '600',
    color: colors.textTertiary,
  },
  bio: {
    fontSize: FONT_SIZE.xs,
    color: colors.textSecondary,
    marginTop: SPACING.sm,
    lineHeight: 17,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
    marginTop: SPACING.sm,
  },
  animalTag: {
    backgroundColor: colors.primarySoft,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },
  animalTagText: {
    fontSize: FONT_SIZE['2xs'] || 10,
    fontWeight: '600',
    color: colors.primary,
    textTransform: 'capitalize',
  },
  serviceTag: {
    backgroundColor: colors.accentSoft || '#FFF5EB',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },
  serviceTagText: {
    fontSize: FONT_SIZE['2xs'] || 10,
    fontWeight: '600',
    color: '#C4956A',
  },

  // Actions
  actions: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  editBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.sm + 2,
    borderRadius: RADIUS.lg,
    backgroundColor: '#EFF5F0',
  },
  editBtnText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
    color: '#527A56',
  },
  deleteBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.sm + 2,
    borderRadius: RADIUS.lg,
    backgroundColor: '#FEF2F0',
  },
  deleteBtnText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
    color: '#C25B4A',
  },

  // Empty
  emptyContainer: {
    alignItems: 'center',
    paddingTop: SPACING['3xl'],
    gap: SPACING.md,
  },
  emptyText: {
    fontSize: FONT_SIZE.sm,
    color: colors.textTertiary,
    textAlign: 'center',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: RADIUS['2xl'],
    borderTopRightRadius: RADIUS['2xl'],
    padding: SPACING.xl,
    paddingBottom: Platform.OS === 'ios' ? 40 : SPACING.xl,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  modalTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '800',
    color: colors.text,
  },
  modalLabel: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
    color: colors.text,
    marginBottom: SPACING.xs,
    marginTop: SPACING.md,
  },
  modalTextArea: {
    backgroundColor: colors.background,
    borderRadius: RADIUS.lg,
    padding: SPACING.base,
    fontSize: FONT_SIZE.sm,
    color: colors.text,
    minHeight: 80,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalInput: {
    backgroundColor: colors.background,
    borderRadius: RADIUS.lg,
    padding: SPACING.base,
    fontSize: FONT_SIZE.sm,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  verifiedToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginTop: SPACING.lg,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: RADIUS.sm,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    backgroundColor: '#527A56',
    borderColor: '#527A56',
  },
  verifiedToggleText: {
    fontSize: FONT_SIZE.base,
    fontWeight: '600',
    color: colors.text,
  },
  modalActions: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.xl,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: SPACING.md + 2,
    borderRadius: RADIUS.lg,
    backgroundColor: colors.background,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelBtnText: {
    fontSize: FONT_SIZE.base,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  saveBtn: {
    flex: 1,
    paddingVertical: SPACING.md + 2,
    borderRadius: RADIUS.lg,
    backgroundColor: '#527A56',
    alignItems: 'center',
  },
  saveBtnText: {
    fontSize: FONT_SIZE.base,
    fontWeight: '700',
    color: '#FFF',
  },
});

export default AdminPetSittersScreen;
