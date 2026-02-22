import React, { useState } from 'react';
import {
  View, Text, TextInput, ScrollView, TouchableOpacity,
  StyleSheet, Alert, Switch
} from 'react-native';
import { addPetAPI } from '../../api/pets';
import Button from '../../components/Button';
const colors = require('../../utils/colors');

const SPECIES = [
  { key: 'chien', label: 'Chien', icon: '🐕' },
  { key: 'chat', label: 'Chat', icon: '🐱' },
  { key: 'rongeur', label: 'Rongeur', icon: '🐹' },
  { key: 'oiseau', label: 'Oiseau', icon: '🐦' },
  { key: 'reptile', label: 'Reptile', icon: '🦎' },
  { key: 'poisson', label: 'Poisson', icon: '🐟' },
  { key: 'autre', label: 'Autre', icon: '🐾' },
];

const AddPetScreen = ({ navigation }) => {
  const [name, setName] = useState('');
  const [species, setSpecies] = useState('');
  const [breed, setBreed] = useState('');
  const [age, setAge] = useState('');
  const [weight, setWeight] = useState('');
  const [gender, setGender] = useState('');
  const [vaccinated, setVaccinated] = useState(false);
  const [specialNeeds, setSpecialNeeds] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!name || !species || !gender) {
      Alert.alert('Erreur', 'Remplissez les champs obligatoires (nom, espece, genre)');
      return;
    }

    setLoading(true);
    try {
      await addPetAPI({
        name: name.trim(),
        species,
        breed: breed.trim(),
        age: age ? parseInt(age) : undefined,
        weight: weight ? parseFloat(weight) : undefined,
        gender,
        vaccinated,
        specialNeeds: specialNeeds.trim(),
        description: description.trim(),
      });

      Alert.alert('Bravo !', `${name} a ete ajoute avec succes`, [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      Alert.alert('Erreur', "Impossible d'ajouter l'animal");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Nom */}
      <View style={styles.field}>
        <Text style={styles.label}>Nom de l'animal *</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="ex: Rex, Minou..."
          placeholderTextColor={colors.placeholder}
        />
      </View>

      {/* Espèce */}
      <View style={styles.field}>
        <Text style={styles.label}>Espece *</Text>
        <View style={styles.speciesGrid}>
          {SPECIES.map((s) => (
            <TouchableOpacity
              key={s.key}
              style={[styles.speciesChip, species === s.key && styles.speciesActive]}
              onPress={() => setSpecies(s.key)}
            >
              <Text style={styles.speciesIcon}>{s.icon}</Text>
              <Text style={[
                styles.speciesLabel,
                species === s.key && styles.speciesLabelActive
              ]}>
                {s.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Genre */}
      <View style={styles.field}>
        <Text style={styles.label}>Genre *</Text>
        <View style={styles.genderRow}>
          <TouchableOpacity
            style={[styles.genderOption, gender === 'male' && styles.genderActive]}
            onPress={() => setGender('male')}
          >
            <Text style={[styles.genderText, gender === 'male' && styles.genderTextActive]}>
              Male
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.genderOption, gender === 'femelle' && styles.genderActive]}
            onPress={() => setGender('femelle')}
          >
            <Text style={[styles.genderText, gender === 'femelle' && styles.genderTextActive]}>
              Femelle
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Race */}
      <View style={styles.field}>
        <Text style={styles.label}>Race</Text>
        <TextInput
          style={styles.input}
          value={breed}
          onChangeText={setBreed}
          placeholder="ex: Labrador, Siamois..."
          placeholderTextColor={colors.placeholder}
        />
      </View>

      {/* Âge et Poids */}
      <View style={styles.row}>
        <View style={[styles.field, { flex: 1 }]}>
          <Text style={styles.label}>Age (annees)</Text>
          <TextInput
            style={styles.input}
            value={age}
            onChangeText={setAge}
            placeholder="ex: 3"
            placeholderTextColor={colors.placeholder}
            keyboardType="numeric"
          />
        </View>
        <View style={{ width: 12 }} />
        <View style={[styles.field, { flex: 1 }]}>
          <Text style={styles.label}>Poids (kg)</Text>
          <TextInput
            style={styles.input}
            value={weight}
            onChangeText={setWeight}
            placeholder="ex: 12.5"
            placeholderTextColor={colors.placeholder}
            keyboardType="decimal-pad"
          />
        </View>
      </View>

      {/* Vacciné */}
      <View style={styles.switchRow}>
        <Text style={styles.label}>Vaccine</Text>
        <Switch
          value={vaccinated}
          onValueChange={setVaccinated}
          trackColor={{ false: colors.border, true: colors.primary + '60' }}
          thumbColor={vaccinated ? colors.primary : '#f4f3f4'}
        />
      </View>

      {/* Besoins spéciaux */}
      <View style={styles.field}>
        <Text style={styles.label}>Besoins speciaux</Text>
        <TextInput
          style={[styles.input, styles.multiline]}
          value={specialNeeds}
          onChangeText={setSpecialNeeds}
          placeholder="Allergies, medicaments, regime special..."
          placeholderTextColor={colors.placeholder}
          multiline
        />
      </View>

      {/* Description */}
      <View style={styles.field}>
        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, styles.multiline]}
          value={description}
          onChangeText={setDescription}
          placeholder="Decrivez votre animal..."
          placeholderTextColor={colors.placeholder}
          multiline
        />
      </View>

      <Button
        title="Ajouter mon animal"
        onPress={handleSubmit}
        loading={loading}
        style={styles.submitButton}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  field: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 6,
  },
  input: {
    backgroundColor: colors.background,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  multiline: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  speciesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  speciesChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  speciesActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  speciesIcon: {
    fontSize: 18,
    marginRight: 6,
  },
  speciesLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  speciesLabelActive: {
    color: colors.white,
  },
  genderRow: {
    flexDirection: 'row',
    gap: 12,
  },
  genderOption: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  genderActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  genderText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  genderTextActive: {
    color: colors.white,
  },
  row: {
    flexDirection: 'row',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 4,
  },
  submitButton: {
    marginTop: 8,
  },
});

export default AddPetScreen;
