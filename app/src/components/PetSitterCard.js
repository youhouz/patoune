import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import Card from './Card';
import Rating from './Rating';
const colors = require('../utils/colors');

const PetSitterCard = ({ petsitter, onPress }) => {
  const { user, bio, pricePerDay, rating, reviewCount, acceptedAnimals, services } = petsitter;

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <Card>
        <View style={styles.header}>
          <Image
            source={
              user?.avatar
                ? { uri: user.avatar }
                : require('../assets/default-avatar.png')
            }
            style={styles.avatar}
            defaultSource={require('../assets/default-avatar.png')}
          />
          <View style={styles.info}>
            <Text style={styles.name}>{user?.name || 'Gardien'}</Text>
            <Rating value={rating} count={reviewCount} size={14} />
            <Text style={styles.price}>{pricePerDay}EUR/jour</Text>
          </View>
          {petsitter.verified && (
            <View style={styles.verifiedBadge}>
              <Text style={styles.verifiedText}>Verifie</Text>
            </View>
          )}
        </View>

        {bio ? <Text style={styles.bio} numberOfLines={2}>{bio}</Text> : null}

        <View style={styles.tags}>
          {acceptedAnimals?.map((animal, idx) => (
            <View key={idx} style={styles.tag}>
              <Text style={styles.tagText}>{animal}</Text>
            </View>
          ))}
        </View>

        <View style={styles.services}>
          {services?.map((service, idx) => (
            <Text key={idx} style={styles.serviceText}>
              {service.replace(/_/g, ' ')}
            </Text>
          ))}
        </View>
      </Card>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.border,
  },
  info: {
    flex: 1,
    marginLeft: 12,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  price: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primary,
    marginTop: 2,
  },
  verifiedBadge: {
    backgroundColor: colors.secondary + '20',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  verifiedText: {
    fontSize: 11,
    color: colors.secondary,
    fontWeight: '600',
  },
  bio: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 10,
    lineHeight: 18,
  },
  tags: {
    flexDirection: 'row',
    marginTop: 10,
    flexWrap: 'wrap',
    gap: 6,
  },
  tag: {
    backgroundColor: colors.primary + '15',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 6,
  },
  tagText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  services: {
    flexDirection: 'row',
    marginTop: 8,
    flexWrap: 'wrap',
    gap: 8,
  },
  serviceText: {
    fontSize: 12,
    color: colors.textSecondary,
    textTransform: 'capitalize',
  },
});

export default PetSitterCard;
