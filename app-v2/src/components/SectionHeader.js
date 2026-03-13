import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS, RADIUS, SPACING } from '../utils/colors';
import { FONTS } from '../utils/typography';

const SectionHeader = ({ title, onSeeAll, count, style }) => (
  <View style={[styles.container, style]}>
    <View style={styles.titleRow}>
      <Text style={styles.title}>{title}</Text>
      {count != null && count > 0 ? (
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{count}</Text>
        </View>
      ) : null}
    </View>

    {onSeeAll ? (
      <TouchableOpacity
        onPress={onSeeAll}
        activeOpacity={0.7}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Text style={styles.seeAll}>Voir tout</Text>
      </TouchableOpacity>
    ) : null}
  </View>
);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  title: {
    fontFamily: FONTS.brand,
    fontSize: 20,
    color: COLORS.charcoal,
    letterSpacing: -0.2,
  },
  countBadge: {
    backgroundColor: COLORS.primarySoft,
    borderRadius: RADIUS.full,
    minWidth: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  countText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 11,
    color: COLORS.primary,
  },
  seeAll: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 14,
    color: COLORS.primary,
    letterSpacing: 0.1,
  },
});

export default SectionHeader;
