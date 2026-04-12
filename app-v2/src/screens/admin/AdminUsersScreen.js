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
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { getUsersAPI } from '../../api/admin';
import colors, { SHADOWS, RADIUS, SPACING, FONT_SIZE } from '../../utils/colors';

const HEADER_PADDING_TOP = Platform.OS === 'ios' ? 56 : (StatusBar.currentHeight || 24) + 12;

const AdminUsersScreen = ({ navigation }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchUsers = useCallback(async (p = 1, q = '') => {
    try {
      setLoading(true);
      const res = await getUsersAPI({ page: p, limit: 30, search: q });
      const d = res.data;
      setUsers(p === 1 ? d.data : (prev) => [...prev, ...d.data]);
      setTotalPages(d.pages);
      setTotal(d.total);
      setPage(p);
    } catch (err) {
      console.error('Fetch users error:', err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers(1, search);
  }, []);

  const handleSearch = () => {
    fetchUsers(1, search);
  };

  const loadMore = () => {
    if (page < totalPages && !loading) {
      fetchUsers(page + 1, search);
    }
  };

  const renderUser = ({ item }) => (
    <View style={styles.userCard}>
      <View style={styles.userAvatar}>
        <Text style={styles.userInitials}>
          {(item.name || '?').charAt(0).toUpperCase()}
        </Text>
      </View>
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{item.name}</Text>
        <Text style={styles.userEmail}>{item.email}</Text>
        <View style={styles.userMeta}>
          {item.phone ? (
            <View style={styles.metaChip}>
              <Feather name="phone" size={10} color={colors.textTertiary} />
              <Text style={styles.metaText}>{item.phone}</Text>
            </View>
          ) : null}
          <View style={[styles.metaChip, { backgroundColor: roleColor(item.role) + '15' }]}>
            <Text style={[styles.metaText, { color: roleColor(item.role), fontWeight: '700' }]}>
              {item.role}
            </Text>
          </View>
          {item.address?.city ? (
            <View style={styles.metaChip}>
              <Feather name="map-pin" size={10} color={colors.textTertiary} />
              <Text style={styles.metaText}>{item.address.city}</Text>
            </View>
          ) : null}
        </View>
      </View>
      <Text style={styles.userDate}>
        {new Date(item.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
      </Text>
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
        <Text style={styles.headerTitle}>Utilisateurs</Text>
        <View style={styles.totalBadge}>
          <Text style={styles.totalText}>{total}</Text>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          placeholder="Chercher par nom, email, ville..."
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
          {users.length === 0 && !loading ? (
            <Text style={styles.emptyText}>Aucun utilisateur trouvé</Text>
          ) : (
            users.map((item) => <View key={item._id}>{renderUser({ item })}</View>)
          )}
          {loading && <ActivityIndicator style={{ padding: SPACING.lg }} color={colors.primary} />}
        </View>
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => item._id}
          renderItem={renderUser}
          contentContainerStyle={styles.list}
          onEndReached={loadMore}
          onEndReachedThreshold={0.3}
          ListEmptyComponent={
            !loading ? (
              <Text style={styles.emptyText}>Aucun utilisateur trouvé</Text>
            ) : null
          }
          ListFooterComponent={
            loading ? <ActivityIndicator style={{ padding: SPACING.lg }} color={colors.primary} /> : null
          }
        />
      )}
    </View>
  );
};

function roleColor(role) {
  const map = { admin: '#C25B4A', guardian: '#C4956A', both: '#6B8F71', user: '#527A56' };
  return map[role] || colors.textSecondary;
}

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
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    ...SHADOWS.sm,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userInitials: {
    fontSize: FONT_SIZE.md,
    fontWeight: '800',
    color: colors.primary,
  },
  userInfo: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  userName: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
    color: colors.text,
  },
  userEmail: {
    fontSize: FONT_SIZE.xs,
    color: colors.textSecondary,
    fontWeight: '400',
    marginTop: 1,
  },
  userMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
    marginTop: SPACING.xs,
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
    fontSize: FONT_SIZE['2xs'],
    fontWeight: '600',
    color: colors.textTertiary,
  },
  userDate: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '500',
    color: colors.textTertiary,
  },
  emptyText: {
    fontSize: FONT_SIZE.sm,
    color: colors.textTertiary,
    textAlign: 'center',
    marginTop: SPACING['2xl'],
  },
});

export default AdminUsersScreen;
