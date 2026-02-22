import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, Image, StyleSheet, TouchableOpacity
} from 'react-native';
import { getPetSitterReviewsAPI } from '../../api/petsitters';
import Rating from '../../components/Rating';
import Card from '../../components/Card';
import Button from '../../components/Button';
const colors = require('../../utils/colors');

const PetSitterDetailScreen = ({ route, navigation }) => {
  const { petsitter } = route.params;
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    loadReviews();
  }, []);

  const loadReviews = async () => {
    try {
      const response = await getPetSitterReviewsAPI(petsitter._id);
      setReviews(response.data.reviews);
    } catch (error) {
      console.log('Erreur reviews:', error);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Profil */}
      <Card>
        <View style={styles.profileHeader}>
          <Image
            source={
              petsitter.user?.avatar
                ? { uri: petsitter.user.avatar }
                : require('../../assets/default-avatar.png')
            }
            style={styles.avatar}
            defaultSource={require('../../assets/default-avatar.png')}
          />
          <View style={styles.profileInfo}>
            <Text style={styles.name}>{petsitter.user?.name || 'Gardien'}</Text>
            <Rating value={petsitter.rating} count={petsitter.reviewCount} />
            {petsitter.verified && (
              <View style={styles.verifiedBadge}>
                <Text style={styles.verifiedText}>Profil verifie</Text>
              </View>
            )}
          </View>
        </View>

        {petsitter.bio ? (
          <Text style={styles.bio}>{petsitter.bio}</Text>
        ) : null}

        <Text style={styles.experience}>
          {petsitter.experience} an(s) d'experience
        </Text>
      </Card>

      {/* Tarifs */}
      <Card>
        <Text style={styles.sectionTitle}>Tarifs</Text>
        <View style={styles.priceRow}>
          <Text style={styles.priceLabel}>Par jour</Text>
          <Text style={styles.priceValue}>{petsitter.pricePerDay} EUR</Text>
        </View>
        <View style={styles.priceRow}>
          <Text style={styles.priceLabel}>Par heure</Text>
          <Text style={styles.priceValue}>{petsitter.pricePerHour} EUR</Text>
        </View>
      </Card>

      {/* Services */}
      <Card>
        <Text style={styles.sectionTitle}>Services</Text>
        <View style={styles.tags}>
          {petsitter.services?.map((service, idx) => (
            <View key={idx} style={styles.serviceTag}>
              <Text style={styles.serviceTagText}>
                {service.replace(/_/g, ' ')}
              </Text>
            </View>
          ))}
        </View>
      </Card>

      {/* Animaux acceptes */}
      <Card>
        <Text style={styles.sectionTitle}>Animaux acceptes</Text>
        <View style={styles.tags}>
          {petsitter.acceptedAnimals?.map((animal, idx) => (
            <View key={idx} style={styles.animalTag}>
              <Text style={styles.animalTagText}>{animal}</Text>
            </View>
          ))}
        </View>
      </Card>

      {/* Avis */}
      <Card>
        <Text style={styles.sectionTitle}>
          Avis ({reviews.length})
        </Text>
        {reviews.length === 0 ? (
          <Text style={styles.noReviews}>Pas encore d'avis</Text>
        ) : (
          reviews.slice(0, 5).map((review, idx) => (
            <View key={idx} style={styles.reviewItem}>
              <View style={styles.reviewHeader}>
                <Text style={styles.reviewAuthor}>{review.author?.name}</Text>
                <Rating value={review.rating} size={12} />
              </View>
              <Text style={styles.reviewComment}>{review.comment}</Text>
              <Text style={styles.reviewDate}>
                {new Date(review.createdAt).toLocaleDateString('fr-FR')}
              </Text>
            </View>
          ))
        )}
      </Card>

      {/* Boutons action */}
      <View style={styles.actions}>
        <Button
          title="Reserver"
          onPress={() => navigation.navigate('Booking', { petsitter })}
          style={styles.bookButton}
        />
        <Button
          title="Envoyer un message"
          variant="outline"
          onPress={() => navigation.navigate('Messages', { userId: petsitter.user?._id, userName: petsitter.user?.name })}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.border,
  },
  profileInfo: {
    flex: 1,
    marginLeft: 16,
  },
  name: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  verifiedBadge: {
    backgroundColor: colors.secondary + '20',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  verifiedText: {
    fontSize: 11,
    color: colors.secondary,
    fontWeight: '600',
  },
  bio: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 14,
    lineHeight: 20,
  },
  experience: {
    fontSize: 13,
    color: colors.textLight,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  priceLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  priceValue: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  serviceTag: {
    backgroundColor: colors.info + '15',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  serviceTagText: {
    fontSize: 13,
    color: colors.info,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  animalTag: {
    backgroundColor: colors.primary + '15',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  animalTagText: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  reviewItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reviewAuthor: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  reviewComment: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
    lineHeight: 18,
  },
  reviewDate: {
    fontSize: 11,
    color: colors.textLight,
    marginTop: 4,
  },
  noReviews: {
    fontSize: 13,
    color: colors.textLight,
    fontStyle: 'italic',
  },
  actions: {
    marginTop: 8,
    gap: 10,
  },
  bookButton: {
    marginBottom: 0,
  },
});

export default PetSitterDetailScreen;
