import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Alert, TextInput
} from 'react-native';
import { getMyPetsAPI } from '../../api/pets';
import { createBookingAPI } from '../../api/petsitters';
import Button from '../../components/Button';
import Card from '../../components/Card';
const colors = require('../../utils/colors');

const SERVICES = [
  { key: 'garde_domicile', label: 'Garde a domicile' },
  { key: 'garde_chez_sitter', label: 'Garde chez le gardien' },
  { key: 'promenade', label: 'Promenade' },
  { key: 'visite', label: 'Visite a domicile' },
  { key: 'toilettage', label: 'Toilettage' },
];

const BookingScreen = ({ route, navigation }) => {
  const { petsitter } = route.params;
  const [pets, setPets] = useState([]);
  const [selectedPet, setSelectedPet] = useState(null);
  const [selectedService, setSelectedService] = useState(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadPets();
  }, []);

  const loadPets = async () => {
    try {
      const response = await getMyPetsAPI();
      setPets(response.data.pets);
    } catch (error) {
      console.log('Erreur chargement animaux:', error);
    }
  };

  const calculatePrice = () => {
    if (!startDate || !endDate) return 0;
    // Calcul simple basé sur le nombre de jours
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));

    if (selectedService === 'promenade' || selectedService === 'visite') {
      return days * petsitter.pricePerHour;
    }
    return days * petsitter.pricePerDay;
  };

  const handleBooking = async () => {
    if (!selectedPet) {
      Alert.alert('Erreur', 'Selectionnez un animal');
      return;
    }
    if (!selectedService) {
      Alert.alert('Erreur', 'Selectionnez un service');
      return;
    }
    if (!startDate || !endDate) {
      Alert.alert('Erreur', 'Renseignez les dates (format: AAAA-MM-JJ)');
      return;
    }

    setLoading(true);
    try {
      await createBookingAPI({
        sitter: petsitter._id,
        pet: selectedPet,
        service: selectedService,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        totalPrice: calculatePrice(),
        notes,
      });

      Alert.alert(
        'Reservation envoyee !',
        'Le gardien va confirmer votre reservation.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de creer la reservation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Sélection animal */}
      <Card>
        <Text style={styles.sectionTitle}>Quel animal ?</Text>
        {pets.length === 0 ? (
          <Text style={styles.noPets}>
            Ajoutez un animal dans votre profil d'abord
          </Text>
        ) : (
          <View style={styles.options}>
            {pets.map((pet) => (
              <TouchableOpacity
                key={pet._id}
                style={[
                  styles.option,
                  selectedPet === pet._id && styles.optionActive
                ]}
                onPress={() => setSelectedPet(pet._id)}
              >
                <Text style={[
                  styles.optionText,
                  selectedPet === pet._id && styles.optionTextActive
                ]}>
                  {pet.name} ({pet.species})
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </Card>

      {/* Sélection service */}
      <Card>
        <Text style={styles.sectionTitle}>Quel service ?</Text>
        <View style={styles.options}>
          {SERVICES.filter(s =>
            petsitter.services?.includes(s.key)
          ).map((service) => (
            <TouchableOpacity
              key={service.key}
              style={[
                styles.option,
                selectedService === service.key && styles.optionActive
              ]}
              onPress={() => setSelectedService(service.key)}
            >
              <Text style={[
                styles.optionText,
                selectedService === service.key && styles.optionTextActive
              ]}>
                {service.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </Card>

      {/* Dates */}
      <Card>
        <Text style={styles.sectionTitle}>Quand ?</Text>
        <View style={styles.dateRow}>
          <View style={styles.dateField}>
            <Text style={styles.dateLabel}>Debut</Text>
            <TextInput
              style={styles.dateInput}
              value={startDate}
              onChangeText={setStartDate}
              placeholder="AAAA-MM-JJ"
              placeholderTextColor={colors.placeholder}
            />
          </View>
          <View style={styles.dateField}>
            <Text style={styles.dateLabel}>Fin</Text>
            <TextInput
              style={styles.dateInput}
              value={endDate}
              onChangeText={setEndDate}
              placeholder="AAAA-MM-JJ"
              placeholderTextColor={colors.placeholder}
            />
          </View>
        </View>
      </Card>

      {/* Notes */}
      <Card>
        <Text style={styles.sectionTitle}>Notes (optionnel)</Text>
        <TextInput
          style={styles.notesInput}
          value={notes}
          onChangeText={setNotes}
          placeholder="Instructions speciales, allergies, habitudes..."
          placeholderTextColor={colors.placeholder}
          multiline
          numberOfLines={3}
        />
      </Card>

      {/* Récapitulatif */}
      <Card style={styles.summary}>
        <Text style={styles.sectionTitle}>Recapitulatif</Text>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Gardien</Text>
          <Text style={styles.summaryValue}>{petsitter.user?.name}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Total estime</Text>
          <Text style={styles.totalPrice}>{calculatePrice()} EUR</Text>
        </View>
      </Card>

      <Button
        title="Confirmer la reservation"
        onPress={handleBooking}
        loading={loading}
        disabled={!selectedPet || !selectedService}
      />
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  noPets: {
    fontSize: 13,
    color: colors.textLight,
    fontStyle: 'italic',
  },
  options: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  option: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  optionActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  optionText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  optionTextActive: {
    color: colors.white,
  },
  dateRow: {
    flexDirection: 'row',
    gap: 12,
  },
  dateField: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 4,
  },
  dateInput: {
    backgroundColor: colors.background,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  notesInput: {
    backgroundColor: colors.background,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  summary: {
    backgroundColor: colors.primary + '08',
    borderWidth: 1,
    borderColor: colors.primary + '30',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  summaryLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  totalPrice: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.primary,
  },
});

export default BookingScreen;
