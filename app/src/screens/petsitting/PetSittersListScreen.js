import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity
} from 'react-native';
import { searchPetSittersAPI } from '../../api/petsitters';
import PetSitterCard from '../../components/PetSitterCard';
import SearchBar from '../../components/SearchBar';
const colors = require('../../utils/colors');

const ANIMAL_FILTERS = ['Tous', 'Chien', 'Chat', 'Rongeur', 'Oiseau', 'Reptile'];

const PetSittersListScreen = ({ navigation }) => {
  const [petsitters, setPetsitters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAnimal, setSelectedAnimal] = useState('Tous');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadPetSitters();
  }, [selectedAnimal]);

  const loadPetSitters = async () => {
    setLoading(true);
    try {
      const params = {};
      if (selectedAnimal !== 'Tous') {
        params.animal = selectedAnimal.toLowerCase();
      }
      const response = await searchPetSittersAPI(params);
      setPetsitters(response.data.petsitters);
    } catch (error) {
      console.log('Erreur chargement gardiens:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Barre de recherche */}
      <View style={styles.searchSection}>
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Rechercher un gardien..."
        />
      </View>

      {/* Filtres par animal */}
      <View style={styles.filters}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={ANIMAL_FILTERS}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.filterChip,
                selectedAnimal === item && styles.filterChipActive
              ]}
              onPress={() => setSelectedAnimal(item)}
            >
              <Text style={[
                styles.filterText,
                selectedAnimal === item && styles.filterTextActive
              ]}>
                {item}
              </Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.filterList}
        />
      </View>

      {/* Liste des gardiens */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : petsitters.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyIcon}>🐾</Text>
          <Text style={styles.emptyText}>Aucun gardien trouve</Text>
          <Text style={styles.emptySubtext}>
            Essayez de modifier vos filtres ou elargir la zone
          </Text>
        </View>
      ) : (
        <FlatList
          data={petsitters}
          renderItem={({ item }) => (
            <PetSitterCard
              petsitter={item}
              onPress={() => navigation.navigate('PetSitterDetail', { petsitter: item })}
            />
          )}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  searchSection: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
    backgroundColor: colors.white,
  },
  filters: {
    backgroundColor: colors.white,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  filterList: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  filterTextActive: {
    color: colors.white,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    padding: 16,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  emptySubtext: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});

export default PetSittersListScreen;
