import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Avatar from './Avatar';
import { FONTS } from '../utils/typography';
const colors = require('../utils/colors');
const { SHADOWS, RADIUS } = require('../utils/colors');

const ANIMAL_ICON_MAP = {
  chien: 'gitlab',
  chat: 'github',
  rongeur: 'mouse-pointer',
  oiseau: 'feather',
  reptile: 'zap',
  poisson: 'droplet',
  autre: 'heart',
};

/* ---------- Star Rating (inline with Feather icons) ---------- */
const StarRating = ({ value = 0, count, size = 13 }) => {
  const fullStars = Math.floor(value);
  const hasHalf = value - fullStars >= 0.5;
  const stars = [];
  for (let i = 0; i < 5; i++) {
    if (i < fullStars || (i === fullStars && hasHalf)) {
      stars.push(
        <Feather key={i} name="star" size={size} color="#F59E0B" />
      );
    } else {
      stars.push(
        <Feather key={i} name="star" size={size} color={colors.border} />
      );
    }
  }
  return (
    <View style={styles.ratingRow}>
      <View style={styles.starsRow}>{stars}</View>
      {count != null && (
        <Text style={styles.ratingCount}>({count})</Text>
      )}
    </View>
  );
};

const PetSitterCard = ({ petsitter, onPress }) => {
  const { user, bio, pricePerDay, rating, reviewCount, acceptedAnimals, services } = petsitter;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Top row */}
      <View style={styles.header}>
        <Avatar
          name={user?.name || 'Gardien'}
          imageUri={user?.avatar}
          size="md"
          verified={petsitter.verified}
        />
        <View style={styles.info}>
          <View style={styles.nameRow}>
            <Text style={styles.name} numberOfLines={1}>{user?.name || 'Gardien'}</Text>
            {petsitter.verified && (
              <View style={styles.verifiedBadge}>
                <Feather name="check-circle" size={14} color={colors.secondary} />
              </View>
            )}
          </View>
          <StarRating value={rating || 0} count={reviewCount} size={13} />
        </View>
        <View style={styles.priceTag}>
          <Text style={styles.priceValue}>{pricePerDay}€</Text>
          <Text style={styles.priceUnit}>/jour</Text>
        </View>
      </View>

      {/* Bio */}
      {bio ? (
        <Text style={styles.bio} numberOfLines={2}>{bio}</Text>
      ) : null}

      {/* Bottom tags */}
      <View style={styles.footer}>
        {/* Animal chips */}
        <View style={styles.tags}>
          {acceptedAnimals?.slice(0, 4).map((animal, idx) => (
            <View key={idx} style={styles.animalChip}>
              <Feather
                name={ANIMAL_ICON_MAP[animal] || 'heart'}
                size={12}
                color={colors.primary}
              />
              <Text style={styles.animalText}>{animal}</Text>
            </View>
          ))}
          {acceptedAnimals?.length > 4 && (
            <View style={styles.moreChip}>
              <Text style={styles.moreText}>+{acceptedAnimals.length - 4}</Text>
            </View>
          )}
        </View>

        {/* Service count */}
        {services?.length > 0 && (
          <Text style={styles.serviceCount}>
            {services.length} service{services.length > 1 ? 's' : ''}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: RADIUS.xl,
    padding: 16,
    marginVertical: 5,
    ...SHADOWS.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  info: {
    flex: 1,
    marginLeft: 12,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 3,
  },
  name: {
    fontSize: 16,
    fontFamily: FONTS.heading,
    color: colors.text,
    flexShrink: 1,
  },
  verifiedBadge: {
    marginLeft: 2,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 1,
  },
  ratingCount: {
    fontSize: 11,
    fontFamily: FONTS.body,
    color: colors.textTertiary,
  },
  priceTag: {
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
    alignItems: 'center',
  },
  priceValue: {
    fontSize: 18,
    fontFamily: FONTS.heading,
    color: colors.primary,
  },
  priceUnit: {
    fontSize: 10,
    fontFamily: FONTS.bodyMedium,
    color: colors.primary,
    opacity: 0.7,
  },
  bio: {
    fontSize: 13,
    fontFamily: FONTS.body,
    color: colors.textSecondary,
    marginTop: 12,
    lineHeight: 19,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  tags: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
    flex: 1,
  },
  animalChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
    gap: 4,
  },
  animalText: {
    fontSize: 11,
    fontFamily: FONTS.bodyMedium,
    color: colors.textSecondary,
    textTransform: 'capitalize',
  },
  moreChip: {
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
  },
  moreText: {
    fontSize: 11,
    fontFamily: FONTS.bodySemiBold,
    color: colors.primary,
  },
  serviceCount: {
    fontSize: 12,
    fontFamily: FONTS.bodyMedium,
    color: colors.textTertiary,
  },
});

export default PetSitterCard;
