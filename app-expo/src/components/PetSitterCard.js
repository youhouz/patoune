import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import Rating from './Rating';
const colors = require('../utils/colors');
const { SHADOWS, RADIUS } = require('../utils/colors');

const Avatar = ({ name, uri, size = 52 }) => {
  if (uri) {
    return <Image source={{ uri }} style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]} />;
  }
  return (
    <View style={[styles.avatarPlaceholder, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={[styles.avatarLetter, { fontSize: size * 0.38 }]}>
        {name?.charAt(0)?.toUpperCase() || '?'}
      </Text>
    </View>
  );
};

const PetSitterCard = ({ petsitter, onPress }) => {
  const { user, bio, pricePerDay, rating, reviewCount, acceptedAnimals, services } = petsitter;

  const animalEmojis = {
    chien: '🐕', chat: '🐱', rongeur: '🐹', oiseau: '🐦',
    reptile: '🦎', poisson: '🐟', autre: '🐾',
  };

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Top row */}
      <View style={styles.header}>
        <Avatar name={user?.name} uri={user?.avatar} />
        <View style={styles.info}>
          <View style={styles.nameRow}>
            <Text style={styles.name} numberOfLines={1}>{user?.name || 'Gardien'}</Text>
            {petsitter.verified && (
              <View style={styles.verifiedBadge}>
                <Text style={styles.verifiedIcon}>✓</Text>
              </View>
            )}
          </View>
          <Rating value={rating || 0} count={reviewCount} size={13} />
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
              <Text style={styles.animalEmoji}>{animalEmojis[animal] || '🐾'}</Text>
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
  avatar: {
    backgroundColor: colors.border,
  },
  avatarPlaceholder: {
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.glow('#FF6B35'),
  },
  avatarLetter: {
    color: colors.white,
    fontWeight: '700',
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
    fontWeight: '700',
    color: colors.text,
    flexShrink: 1,
  },
  verifiedBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifiedIcon: {
    fontSize: 10,
    color: '#FFF',
    fontWeight: '800',
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
    fontWeight: '800',
    color: colors.primary,
  },
  priceUnit: {
    fontSize: 10,
    color: colors.primary,
    fontWeight: '500',
    opacity: 0.7,
  },
  bio: {
    fontSize: 13,
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
  animalEmoji: {
    fontSize: 12,
  },
  animalText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '500',
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
    color: colors.primary,
    fontWeight: '600',
  },
  serviceCount: {
    fontSize: 12,
    color: colors.textTertiary,
    fontWeight: '500',
  },
});

export default PetSitterCard;
