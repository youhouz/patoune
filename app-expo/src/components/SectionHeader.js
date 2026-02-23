// ---------------------------------------------------------------------------
// Patoune v2.0 - SectionHeader Component
// Section title with optional "Voir tout" link and count badge.
// Uses Playfair Display (brand font) for the title.
// ---------------------------------------------------------------------------

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS, RADIUS, SPACING } from '../utils/colors';
import { FONTS } from '../utils/typography';


/**
 * Section header with optional "See all" action and count badge.
 *
 * @param {object}   props
 * @param {string}   props.title          - Section title (rendered in Playfair Display)
 * @param {function} [props.onSeeAll]     - Handler for "Voir tout" link (hidden if undefined)
 * @param {number}   [props.count]        - Optional count badge displayed next to the title
 * @param {object}   [props.style]        - Container style override
 */
const SectionHeader = ({ title, onSeeAll, count, style }) => {
  return (
    <View style={[styles.container, style]}>
      {/* Title + count */}
      <View style={styles.titleRow}>
        <Text style={styles.title}>{title}</Text>
        {count != null && count > 0 ? (
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{count}</Text>
          </View>
        ) : null}
      </View>

      {/* "Voir tout" link */}
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
};


// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
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
