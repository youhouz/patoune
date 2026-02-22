import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Alert, TextInput, Platform, Animated, ActivityIndicator,
  StatusBar, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { getMyPetsAPI } from '../../api/pets';
import { createBookingAPI } from '../../api/petsitters';
const colors = require('../../utils/colors');
const { SHADOWS, RADIUS, SPACING, FONT_SIZE } = require('../../utils/colors');

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TOP_PADDING = Platform.OS === 'ios' ? 58 : 48;

const STEPS = [
  { key: 'pet', label: 'Animal', icon: '🐾' },
  { key: 'service', label: 'Service', icon: '🛎️' },
  { key: 'dates', label: 'Dates', icon: '📅' },
  { key: 'confirm', label: 'Confirmer', icon: '✓' },
];

const SERVICES = [
  { key: 'garde_domicile', label: 'Garde a domicile', icon: '🏠', desc: 'Chez vous' },
  { key: 'garde_chez_sitter', label: 'Chez le gardien', icon: '🏡', desc: 'Chez le gardien' },
  { key: 'promenade', label: 'Promenade', icon: '🦮', desc: 'Balade quotidienne' },
  { key: 'visite', label: 'Visite a domicile', icon: '👋', desc: 'Visite ponctuelle' },
  { key: 'toilettage', label: 'Toilettage', icon: '✨', desc: 'Soin & beaute' },
];

const PET_SPECIES_EMOJI = {
  chien: '🐶',
  chat: '🐱',
  rongeur: '🐹',
  oiseau: '🐦',
  reptile: '🦎',
};

/* ---------- Step Indicator ---------- */
const StepIndicator = ({ currentStep }) => {
  const stepIndex = STEPS.findIndex(s => s.key === currentStep);

  return (
    <View style={styles.stepIndicator}>
      {STEPS.map((step, idx) => {
        const isActive = idx <= stepIndex;
        const isCurrent = idx === stepIndex;
        return (
          <React.Fragment key={step.key}>
            <View style={styles.stepDot}>
              <View style={[
                styles.stepDotInner,
                isActive && styles.stepDotInnerActive,
                isCurrent && styles.stepDotInnerCurrent,
              ]}>
                {isActive ? (
                  <Text style={styles.stepDotIcon}>
                    {idx < stepIndex ? '✓' : step.icon}
                  </Text>
                ) : (
                  <Text style={styles.stepDotNumber}>{idx + 1}</Text>
                )}
              </View>
              <Text style={[
                styles.stepDotLabel,
                isActive && styles.stepDotLabelActive,
              ]}>{step.label}</Text>
            </View>
            {idx < STEPS.length - 1 && (
              <View style={[
                styles.stepLine,
                idx < stepIndex && styles.stepLineActive,
              ]} />
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
};

/* ---------- Section Card ---------- */
const SectionCard = ({ title, icon, number, children, style, active = true }) => (
  <View style={[styles.sectionCard, !active && styles.sectionCardInactive, style]}>
    <View style={styles.sectionHeader}>
      <View style={[styles.sectionNumberBadge, active && styles.sectionNumberBadgeActive]}>
        <Text style={[styles.sectionNumber, active && styles.sectionNumberActive]}>{number}</Text>
      </View>
      {icon && <Text style={styles.sectionIcon}>{icon}</Text>}
      <Text style={[styles.sectionTitle, !active && styles.sectionTitleInactive]}>{title}</Text>
    </View>
    {children}
  </View>
);

/* ---------- Main Screen ---------- */
const BookingScreen = ({ route, navigation }) => {
  const { petsitter } = route.params;
  const [pets, setPets] = useState([]);
  const [loadingPets, setLoadingPets] = useState(true);
  const [selectedPet, setSelectedPet] = useState(null);
  const [selectedService, setSelectedService] = useState(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadPets();
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  const loadPets = async () => {
    setLoadingPets(true);
    try {
      const response = await getMyPetsAPI();
      setPets(response.data.pets || []);
    } catch (error) {
      console.log('Erreur chargement animaux:', error);
    } finally {
      setLoadingPets(false);
    }
  };

  /* Auto-format date input: insert dashes as user types */
  const formatDateInput = (text, setter) => {
    // Remove non-digits
    let cleaned = text.replace(/[^0-9]/g, '');
    if (cleaned.length > 8) cleaned = cleaned.substring(0, 8);

    let formatted = cleaned;
    if (cleaned.length > 4) {
      formatted = cleaned.substring(0, 4) + '-' + cleaned.substring(4);
    }
    if (cleaned.length > 6) {
      formatted = cleaned.substring(0, 4) + '-' + cleaned.substring(4, 6) + '-' + cleaned.substring(6);
    }
    setter(formatted);
  };

  const calculatePrice = () => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0;
    const days = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));

    if (selectedService === 'promenade' || selectedService === 'visite') {
      return days * (petsitter.pricePerHour || 0);
    }
    return days * (petsitter.pricePerDay || 0);
  };

  const getDays = () => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0;
    return Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));
  };

  const getUnitPrice = () => {
    if (selectedService === 'promenade' || selectedService === 'visite') {
      return petsitter.pricePerHour || 0;
    }
    return petsitter.pricePerDay || 0;
  };

  const getUnitLabel = () => {
    if (selectedService === 'promenade' || selectedService === 'visite') {
      return 'EUR/h';
    }
    return 'EUR/j';
  };

  // Determine current step for the indicator
  const getCurrentStep = () => {
    if (!selectedPet) return 'pet';
    if (!selectedService) return 'service';
    if (!startDate || !endDate) return 'dates';
    return 'confirm';
  };

  const isFormValid = selectedPet && selectedService && startDate && endDate;

  const handleBooking = async () => {
    if (!selectedPet) {
      Alert.alert('Attention', 'Selectionnez un animal');
      return;
    }
    if (!selectedService) {
      Alert.alert('Attention', 'Selectionnez un service');
      return;
    }
    if (!startDate || !endDate) {
      Alert.alert('Attention', 'Renseignez les dates (format: AAAA-MM-JJ)');
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      Alert.alert('Attention', 'Format de date invalide. Utilisez AAAA-MM-JJ');
      return;
    }
    if (end <= start) {
      Alert.alert('Attention', 'La date de fin doit etre apres la date de debut');
      return;
    }

    setLoading(true);
    try {
      await createBookingAPI({
        sitter: petsitter._id,
        pet: selectedPet,
        service: selectedService,
        startDate: start,
        endDate: end,
        totalPrice: calculatePrice(),
        notes,
      });

      Alert.alert(
        'Reservation envoyee !',
        'Le gardien va confirmer votre reservation sous peu.',
        [{ text: 'Super !', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de creer la reservation. Reessayez.');
    } finally {
      setLoading(false);
    }
  };

  const selectedPetObj = pets.find(p => p._id === selectedPet);
  const selectedServiceObj = SERVICES.find(s => s.key === selectedService);
  const availableServices = SERVICES.filter(s => petsitter.services?.includes(s.key));

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <LinearGradient
          colors={[colors.primary, colors.primaryDark]}
          style={styles.header}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {/* Back Button */}
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.backBtnIcon}>←</Text>
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Nouvelle reservation</Text>
          <View style={styles.headerSitterRow}>
            <View style={styles.headerSitterAvatar}>
              <Text style={styles.headerSitterInitial}>
                {petsitter.user?.name?.charAt(0)?.toUpperCase() || '?'}
              </Text>
            </View>
            <View style={styles.headerSitterInfo}>
              <Text style={styles.headerSitterName}>
                {petsitter.user?.name || 'Gardien'}
              </Text>
              <Text style={styles.headerSitterPrice}>
                {petsitter.pricePerHour || '--'} EUR/h  •  {petsitter.pricePerDay || '--'} EUR/jour
              </Text>
            </View>
            {petsitter.verified && (
              <View style={styles.headerVerifiedBadge}>
                <Text style={styles.headerVerifiedIcon}>✓</Text>
              </View>
            )}
          </View>
        </LinearGradient>

        {/* Step Indicator */}
        <View style={styles.stepIndicatorWrapper}>
          <StepIndicator currentStep={getCurrentStep()} />
        </View>

        <Animated.View style={{ opacity: fadeAnim }}>
          {/* Step 1: Pet Selection */}
          <SectionCard title="Quel animal ?" icon="🐾" number="1" active={getCurrentStep() === 'pet' || !!selectedPet}>
            {loadingPets ? (
              <ActivityIndicator size="small" color={colors.primary} style={{ paddingVertical: SPACING.lg }} />
            ) : pets.length === 0 ? (
              <View style={styles.noPetsContainer}>
                <Text style={styles.noPetsIcon}>🐾</Text>
                <Text style={styles.noPetsText}>
                  Ajoutez un animal dans votre profil d'abord
                </Text>
                <TouchableOpacity
                  style={styles.noPetsBtn}
                  onPress={() => navigation.navigate('Profil', { screen: 'AddPet' })}
                  activeOpacity={0.7}
                >
                  <Text style={styles.noPetsBtnText}>Ajouter un animal</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.petGrid}>
                {pets.map((pet) => {
                  const isSelected = selectedPet === pet._id;
                  return (
                    <TouchableOpacity
                      key={pet._id}
                      style={[styles.petCard, isSelected && styles.petCardActive]}
                      onPress={() => setSelectedPet(pet._id)}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.petCardIcon, isSelected && styles.petCardIconActive]}>
                        <Text style={styles.petCardEmoji}>
                          {PET_SPECIES_EMOJI[pet.species?.toLowerCase()] || '🐾'}
                        </Text>
                      </View>
                      <Text style={[styles.petCardName, isSelected && styles.petCardNameActive]} numberOfLines={1}>
                        {pet.name}
                      </Text>
                      <Text style={[styles.petCardSpecies, isSelected && styles.petCardSpeciesActive]}>
                        {pet.species ? pet.species.charAt(0).toUpperCase() + pet.species.slice(1) : ''}
                      </Text>
                      {isSelected && (
                        <View style={styles.petCardCheck}>
                          <Text style={styles.petCardCheckText}>✓</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </SectionCard>

          {/* Step 2: Service Selection */}
          <SectionCard title="Quel service ?" icon="🛎️" number="2" active={getCurrentStep() === 'service' || !!selectedService}>
            <View style={styles.serviceList}>
              {availableServices.map((service) => {
                const isSelected = selectedService === service.key;
                return (
                  <TouchableOpacity
                    key={service.key}
                    style={[styles.serviceOption, isSelected && styles.serviceOptionActive]}
                    onPress={() => setSelectedService(service.key)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.serviceRadio, isSelected && styles.serviceRadioActive]}>
                      {isSelected && <View style={styles.serviceRadioDot} />}
                    </View>
                    <View style={styles.serviceOptionIconBox}>
                      <Text style={styles.serviceOptionIcon}>{service.icon}</Text>
                    </View>
                    <View style={styles.serviceOptionInfo}>
                      <Text style={[styles.serviceOptionLabel, isSelected && styles.serviceOptionLabelActive]}>
                        {service.label}
                      </Text>
                      <Text style={styles.serviceOptionDesc}>{service.desc}</Text>
                    </View>
                    <View style={styles.serviceOptionPriceBox}>
                      <Text style={[styles.serviceOptionPrice, isSelected && styles.serviceOptionPriceActive]}>
                        {service.key === 'promenade' || service.key === 'visite'
                          ? `${petsitter.pricePerHour || '--'}`
                          : `${petsitter.pricePerDay || '--'}`}
                      </Text>
                      <Text style={styles.serviceOptionPriceUnit}>
                        {service.key === 'promenade' || service.key === 'visite' ? 'EUR/h' : 'EUR/j'}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
              {availableServices.length === 0 && (
                <View style={styles.noServiceContainer}>
                  <Text style={styles.noServiceIcon}>🚫</Text>
                  <Text style={styles.noServiceText}>Aucun service disponible</Text>
                </View>
              )}
            </View>
          </SectionCard>

          {/* Step 3: Dates */}
          <SectionCard title="Quand ?" icon="📅" number="3" active={getCurrentStep() === 'dates' || (!!startDate && !!endDate)}>
            <View style={styles.dateRow}>
              <View style={styles.dateField}>
                <Text style={styles.dateLabel}>Debut</Text>
                <View style={[styles.dateInputWrapper, startDate.length === 10 && styles.dateInputWrapperFilled]}>
                  <Text style={styles.dateInputIcon}>📆</Text>
                  <TextInput
                    style={styles.dateInput}
                    value={startDate}
                    onChangeText={(text) => formatDateInput(text, setStartDate)}
                    placeholder="AAAA-MM-JJ"
                    placeholderTextColor={colors.placeholder}
                    maxLength={10}
                    keyboardType="number-pad"
                  />
                </View>
              </View>
              <View style={styles.dateArrow}>
                <View style={styles.dateArrowCircle}>
                  <Text style={styles.dateArrowText}>→</Text>
                </View>
              </View>
              <View style={styles.dateField}>
                <Text style={styles.dateLabel}>Fin</Text>
                <View style={[styles.dateInputWrapper, endDate.length === 10 && styles.dateInputWrapperFilled]}>
                  <Text style={styles.dateInputIcon}>📆</Text>
                  <TextInput
                    style={styles.dateInput}
                    value={endDate}
                    onChangeText={(text) => formatDateInput(text, setEndDate)}
                    placeholder="AAAA-MM-JJ"
                    placeholderTextColor={colors.placeholder}
                    maxLength={10}
                    keyboardType="number-pad"
                  />
                </View>
              </View>
            </View>
            {getDays() > 0 && (
              <View style={styles.durationBadge}>
                <Text style={styles.durationIcon}>⏱️</Text>
                <Text style={styles.durationText}>
                  {getDays()} jour{getDays() > 1 ? 's' : ''}
                </Text>
              </View>
            )}
          </SectionCard>

          {/* Step 4: Notes */}
          <SectionCard title="Notes (optionnel)" icon="📝" number="4" active>
            <TextInput
              style={styles.notesInput}
              value={notes}
              onChangeText={setNotes}
              placeholder="Instructions speciales, allergies, habitudes, regime alimentaire..."
              placeholderTextColor={colors.placeholder}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            <Text style={styles.notesHint}>{notes.length}/500 caracteres</Text>
          </SectionCard>

          {/* Summary */}
          <View style={styles.summaryCard}>
            <LinearGradient
              colors={['rgba(255,107,53,0.08)', 'rgba(255,107,53,0.02)']}
              style={styles.summaryGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.summaryHeader}>
                <Text style={styles.summaryHeaderIcon}>📋</Text>
                <Text style={styles.summaryHeaderTitle}>Recapitulatif</Text>
              </View>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Gardien</Text>
                <Text style={styles.summaryValue}>{petsitter.user?.name || 'Gardien'}</Text>
              </View>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Animal</Text>
                <Text style={styles.summaryValue}>
                  {selectedPetObj
                    ? `${PET_SPECIES_EMOJI[selectedPetObj.species?.toLowerCase()] || '🐾'} ${selectedPetObj.name}`
                    : '--'}
                </Text>
              </View>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Service</Text>
                <Text style={styles.summaryValue}>
                  {selectedServiceObj ? selectedServiceObj.label : '--'}
                </Text>
              </View>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Periode</Text>
                <Text style={styles.summaryValue}>
                  {startDate && endDate ? `${startDate} → ${endDate}` : '--'}
                </Text>
              </View>

              {getDays() > 0 && selectedService && (
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Calcul</Text>
                  <Text style={styles.summaryCalcValue}>
                    {getDays()}j x {getUnitPrice()} {getUnitLabel()}
                  </Text>
                </View>
              )}

              <View style={styles.summaryDivider} />

              <View style={styles.summaryTotalRow}>
                <Text style={styles.summaryTotalLabel}>Total estime</Text>
                <Text style={styles.summaryTotalValue}>{calculatePrice()} EUR</Text>
              </View>
            </LinearGradient>
          </View>

          {/* Confirm Button */}
          <View style={styles.confirmSection}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleBooking}
              disabled={!isFormValid || loading}
              style={{ borderRadius: RADIUS.lg, overflow: 'hidden', width: '100%' }}
            >
              <LinearGradient
                colors={isFormValid ? colors.gradientPrimary : [colors.textLight, colors.textLight]}
                style={styles.confirmBtn}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {loading ? (
                  <ActivityIndicator size="small" color={colors.white} />
                ) : (
                  <>
                    <Text style={styles.confirmBtnIcon}>✓</Text>
                    <Text style={styles.confirmBtnText}>Confirmer la reservation</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <Text style={styles.confirmHint}>
              Le gardien devra confirmer votre demande
            </Text>
          </View>

          <View style={{ height: SPACING['3xl'] }} />
        </Animated.View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: SPACING['3xl'],
  },

  // Header
  header: {
    paddingTop: TOP_PADDING,
    paddingBottom: SPACING.xl,
    paddingHorizontal: SPACING.lg,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  backBtnIcon: {
    fontSize: 22,
    color: colors.white,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: FONT_SIZE['2xl'],
    fontWeight: '800',
    color: colors.white,
    letterSpacing: -0.3,
    marginBottom: SPACING.base,
  },
  headerSitterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    gap: SPACING.md,
  },
  headerSitterAvatar: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.xl,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerSitterInitial: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    color: colors.white,
  },
  headerSitterInfo: {
    flex: 1,
  },
  headerSitterName: {
    fontSize: FONT_SIZE.base,
    fontWeight: '700',
    color: colors.white,
  },
  headerSitterPrice: {
    fontSize: FONT_SIZE.xs,
    color: 'rgba(255,255,255,0.75)',
    fontWeight: '500',
    marginTop: 2,
  },
  headerVerifiedBadge: {
    width: 28,
    height: 28,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(16, 185, 129, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerVerifiedIcon: {
    fontSize: 14,
    color: '#34D399',
    fontWeight: '700',
  },

  // Step Indicator
  stepIndicatorWrapper: {
    backgroundColor: colors.white,
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.base,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    ...SHADOWS.sm,
  },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  stepDot: {
    alignItems: 'center',
    width: 56,
  },
  stepDotInner: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.full,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.border,
    marginBottom: SPACING.xs,
  },
  stepDotInnerActive: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  stepDotInnerCurrent: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  stepDotIcon: {
    fontSize: 14,
    color: colors.white,
    fontWeight: '700',
  },
  stepDotNumber: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
    color: colors.textTertiary,
  },
  stepDotLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textTertiary,
    textAlign: 'center',
  },
  stepDotLabelActive: {
    color: colors.primary,
  },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: colors.border,
    marginTop: 18,
    marginHorizontal: -2,
  },
  stepLineActive: {
    backgroundColor: colors.primary,
  },

  // Section Card
  sectionCard: {
    backgroundColor: colors.white,
    marginHorizontal: SPACING.base,
    marginTop: SPACING.base,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    ...SHADOWS.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  sectionCardInactive: {
    opacity: 0.6,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.base,
    gap: SPACING.sm,
  },
  sectionNumberBadge: {
    width: 26,
    height: 26,
    borderRadius: RADIUS.full,
    backgroundColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionNumberBadgeActive: {
    backgroundColor: colors.primary,
  },
  sectionNumber: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '700',
    color: colors.textTertiary,
  },
  sectionNumberActive: {
    color: colors.white,
  },
  sectionIcon: {
    fontSize: 18,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    color: colors.text,
  },
  sectionTitleInactive: {
    color: colors.textTertiary,
  },

  // No pets
  noPetsContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  },
  noPetsIcon: {
    fontSize: 40,
    marginBottom: SPACING.md,
  },
  noPetsText: {
    fontSize: FONT_SIZE.base,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.base,
    lineHeight: 22,
  },
  noPetsBtn: {
    backgroundColor: colors.primarySoft,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.full,
  },
  noPetsBtnText: {
    fontSize: FONT_SIZE.base,
    fontWeight: '600',
    color: colors.primary,
  },

  // Pet Grid
  petGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  petCard: {
    width: '47%',
    backgroundColor: colors.background,
    borderRadius: RADIUS.lg,
    padding: SPACING.base,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.border,
    position: 'relative',
  },
  petCardActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  petCardIcon: {
    width: 52,
    height: 52,
    borderRadius: RADIUS.full,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
    ...SHADOWS.sm,
  },
  petCardIconActive: {
    backgroundColor: colors.white,
  },
  petCardEmoji: {
    fontSize: 26,
  },
  petCardName: {
    fontSize: FONT_SIZE.base,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 2,
  },
  petCardNameActive: {
    color: colors.primary,
  },
  petCardSpecies: {
    fontSize: FONT_SIZE.xs,
    color: colors.textTertiary,
    fontWeight: '500',
  },
  petCardSpeciesActive: {
    color: colors.primary,
  },
  petCardCheck: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
    width: 24,
    height: 24,
    borderRadius: RADIUS.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.sm,
  },
  petCardCheckText: {
    fontSize: 13,
    color: colors.white,
    fontWeight: '700',
  },

  // Service List
  serviceList: {
    gap: SPACING.sm,
  },
  serviceOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    backgroundColor: colors.background,
    borderWidth: 2,
    borderColor: colors.border,
    gap: SPACING.md,
  },
  serviceOptionActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  serviceRadio: {
    width: 22,
    height: 22,
    borderRadius: RADIUS.full,
    borderWidth: 2,
    borderColor: colors.textLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceRadioActive: {
    borderColor: colors.primary,
  },
  serviceRadioDot: {
    width: 12,
    height: 12,
    borderRadius: RADIUS.full,
    backgroundColor: colors.primary,
  },
  serviceOptionIconBox: {
    width: 42,
    height: 42,
    borderRadius: RADIUS.md,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.sm,
  },
  serviceOptionIcon: {
    fontSize: 20,
  },
  serviceOptionInfo: {
    flex: 1,
  },
  serviceOptionLabel: {
    fontSize: FONT_SIZE.base,
    fontWeight: '600',
    color: colors.text,
  },
  serviceOptionLabelActive: {
    color: colors.primary,
  },
  serviceOptionDesc: {
    fontSize: FONT_SIZE.xs,
    color: colors.textTertiary,
    marginTop: 1,
  },
  serviceOptionPriceBox: {
    alignItems: 'flex-end',
  },
  serviceOptionPrice: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  serviceOptionPriceActive: {
    color: colors.primary,
  },
  serviceOptionPriceUnit: {
    fontSize: 10,
    color: colors.textTertiary,
    fontWeight: '500',
    marginTop: -1,
  },
  noServiceContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  },
  noServiceIcon: {
    fontSize: 28,
    marginBottom: SPACING.sm,
  },
  noServiceText: {
    fontSize: FONT_SIZE.sm,
    color: colors.textTertiary,
    fontStyle: 'italic',
    textAlign: 'center',
  },

  // Dates
  dateRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: SPACING.sm,
  },
  dateField: {
    flex: 1,
  },
  dateLabel: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: SPACING.sm,
  },
  dateInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: RADIUS.lg,
    borderWidth: 2,
    borderColor: colors.border,
    paddingHorizontal: SPACING.md,
  },
  dateInputWrapperFilled: {
    borderColor: '#10B981',
    backgroundColor: '#ECFDF5',
  },
  dateInputIcon: {
    fontSize: 16,
    marginRight: SPACING.sm,
  },
  dateInput: {
    flex: 1,
    paddingVertical: SPACING.md,
    fontSize: FONT_SIZE.base,
    color: colors.text,
    fontWeight: '600',
  },
  dateArrow: {
    paddingBottom: SPACING.sm,
  },
  dateArrowCircle: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.full,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateArrowText: {
    fontSize: FONT_SIZE.md,
    color: colors.primary,
    fontWeight: '700',
  },
  durationBadge: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 2,
    borderRadius: RADIUS.full,
    marginTop: SPACING.md,
    gap: SPACING.xs,
  },
  durationIcon: {
    fontSize: 13,
  },
  durationText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    color: '#10B981',
  },

  // Notes
  notesInput: {
    backgroundColor: colors.background,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.md,
    fontSize: FONT_SIZE.base,
    color: colors.text,
    borderWidth: 1.5,
    borderColor: colors.border,
    minHeight: 100,
    lineHeight: 22,
  },
  notesHint: {
    fontSize: FONT_SIZE.xs,
    color: colors.textTertiary,
    textAlign: 'right',
    marginTop: SPACING.xs,
  },

  // Summary
  summaryCard: {
    marginHorizontal: SPACING.base,
    marginTop: SPACING.lg,
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: colors.primary + '25',
    ...SHADOWS.md,
  },
  summaryGradient: {
    padding: SPACING.lg,
    backgroundColor: colors.white,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.base,
  },
  summaryHeaderIcon: {
    fontSize: 18,
  },
  summaryHeaderTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    color: colors.text,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm + 2,
  },
  summaryLabel: {
    fontSize: FONT_SIZE.base,
    color: colors.textSecondary,
  },
  summaryValue: {
    fontSize: FONT_SIZE.base,
    fontWeight: '600',
    color: colors.text,
    maxWidth: '60%',
    textAlign: 'right',
  },
  summaryCalcValue: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '500',
    color: colors.textTertiary,
    fontStyle: 'italic',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: SPACING.md,
  },
  summaryTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryTotalLabel: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    color: colors.text,
  },
  summaryTotalValue: {
    fontSize: FONT_SIZE['2xl'],
    fontWeight: '800',
    color: colors.primary,
  },

  // Confirm
  confirmSection: {
    marginHorizontal: SPACING.base,
    marginTop: SPACING.xl,
    alignItems: 'center',
  },
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.base + 4,
    paddingHorizontal: SPACING['3xl'],
    borderRadius: RADIUS.lg,
    gap: SPACING.sm,
    width: '100%',
    ...SHADOWS.glow(),
  },
  confirmBtnIcon: {
    fontSize: 18,
    color: colors.white,
    fontWeight: '700',
  },
  confirmBtnText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
    color: colors.white,
  },
  confirmHint: {
    fontSize: FONT_SIZE.sm,
    color: colors.textTertiary,
    marginTop: SPACING.md,
    textAlign: 'center',
  },
});

export default BookingScreen;
