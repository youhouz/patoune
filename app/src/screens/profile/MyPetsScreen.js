import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, Image, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getMyPetsAPI, deletePetAPI } from '../../api/pets';
import Card from '../../components/Card';
import Button from '../../components/Button';
const colors = require('../../utils/colors');

const SPECIES_ICONS = {
  chien: '🐕',
  chat: '🐱',
  rongeur: '🐹',
  oiseau: '🐦',
  reptile: '🦎',
  poisson: '🐟',
  autre: '🐾',
};

const MyPetsScreen = ({ navigation }) => {
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      loadPets();
    }, [])
  );

  const loadPets = async () => {
    try {
      const response = await getMyPetsAPI();
      setPets(response.data.pets);
    } catch (error) {
      console.log('Erreur chargement animaux:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (pet) => {
    Alert.alert(
      'Supprimer',
      `Voulez-vous supprimer ${pet.name} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await deletePetAPI(pet._id);
              loadPets();
            } catch (error) {
              Alert.alert('Erreur', 'Impossible de supprimer');
            }
          }
        }
      ]
    );
  };

  const renderPet = ({ item }) => (
    <Card>
      <View style={styles.petHeader}>
        <Text style={styles.speciesIcon}>
          {SPECIES_ICONS[item.species] || '🐾'}
        </Text>
        <View style={styles.petInfo}>
          <Text style={styles.petName}>{item.name}</Text>
          <Text style={styles.petDetails}>
            {item.species} {item.breed ? `- ${item.breed}` : ''}
          </Text>
          <Text style={styles.petMeta}>
            {item.gender === 'male' ? 'Male' : 'Femelle'}
            {item.age ? ` - ${item.age} an(s)` : ''}
            {item.weight ? ` - ${item.weight} kg` : ''}
          </Text>
        </View>
        <TouchableOpacity onPress={() => handleDelete(item)}>
          <Text style={styles.deleteIcon}>✕</Text>
        </TouchableOpacity>
      </View>

      {item.vaccinated && (
        <View style={styles.vaccinBadge}>
          <Text style={styles.vaccinText}>Vaccine</Text>
        </View>
      )}

      {item.specialNeeds ? (
        <Text style={styles.specialNeeds}>Besoins: {item.specialNeeds}</Text>
      ) : null}
    </Card>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {pets.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyIcon}>🐾</Text>
          <Text style={styles.emptyText}>Pas encore d'animaux</Text>
          <Button
            title="Ajouter mon premier animal"
            onPress={() => navigation.navigate('AddPet')}
            style={styles.addButton}
          />
        </View>
      ) : (
        <>
          <FlatList
            data={pets}
            renderItem={renderPet}
            keyExtractor={(item) => item._id}
            contentContainerStyle={styles.list}
          />
          <TouchableOpacity
            style={styles.fab}
            onPress={() => navigation.navigate('AddPet')}
          >
            <Text style={styles.fabText}>+</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  list: {
    padding: 16,
    paddingBottom: 80,
  },
  petHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  speciesIcon: {
    fontSize: 36,
  },
  petInfo: {
    flex: 1,
    marginLeft: 12,
  },
  petName: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  petDetails: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
    textTransform: 'capitalize',
  },
  petMeta: {
    fontSize: 12,
    color: colors.textLight,
    marginTop: 2,
    textTransform: 'capitalize',
  },
  deleteIcon: {
    fontSize: 18,
    color: colors.textLight,
    padding: 8,
  },
  vaccinBadge: {
    backgroundColor: colors.success + '20',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 10,
  },
  vaccinText: {
    fontSize: 11,
    color: colors.success,
    fontWeight: '600',
  },
  specialNeeds: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 8,
    fontStyle: 'italic',
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 20,
  },
  addButton: {
    width: 250,
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  fabText: {
    fontSize: 28,
    color: colors.white,
    fontWeight: '300',
    lineHeight: 30,
  },
});

export default MyPetsScreen;
