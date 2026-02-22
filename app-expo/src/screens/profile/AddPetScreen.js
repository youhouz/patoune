import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Switch,
  Platform,
  StatusBar,
  KeyboardAvoidingView,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { addPetAPI } from '../../api/pets';
const colors = require('../../utils/colors');
const { SHADOWS, RADIUS, SPACING, FONT_SIZE } = require('../../utils/colors');

const HEADER_PADDING_TOP = Platform.OS === 'ios' ? 56 : (StatusBar.currentHeight || 24) + 12;

const SPECIES = [
  { key: 'chien', label: 'Chien', icon: '🐕', color: '#FF6B35' },
  { key: 'chat', label: 'Chat', icon: '🐱', color: '#6C5CE7' },
  { key: 'rongeur', label: 'Rongeur', icon: '🐹', color: '#F59E0B' },
  { key: 'oiseau', label: 'Oiseau', icon: '🐦', color: '#3B82F6' },
  { key: 'reptile', label: 'Reptile', icon: '🦎', color: '#10B981' },
  { key: 'poisson', label: 'Poisson', icon: '🐟', color: '#0EA5E9' },
  { key: 'autre', label: 'Autre', icon: '🐾', color: '#6B7280' },
];

const GENDERS = [
  { key: 'male', label: 'Male', icon: '♂', color: '#3B82F6', bgColor: '#EFF6FF' },
  { key: 'femelle', label: 'Femelle', icon: '♀', color: '#EC4899', bgColor: '#FDF2F8' },
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
  const [loading, setLoading] = useState(false);

  // Validation state
  const [errors, setErrors] = useState({});

  // Refs for focus management
  const scrollRef = useRef(null);
  const breedRef = useRef(null);
  const ageRef = useRef(null);
  const weightRef = useRef(null);
  const specialNeedsRef = useRef(null);

  // Success animation
  const successAnim = useRef(new Animated.Value(0)).current;

  const clearError = (field) => {
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!name.trim()) {
      newErrors.name = 'Le nom est requis';
    }
    if (!species) {
      newErrors.species = 'Choisissez une espece';
    }
    if (!gender) {
      newErrors.gender = 'Choisissez le genre';
    }
    if (age && (isNaN(parseInt(age, 10)) || parseInt(age, 10) < 0)) {
      newErrors.age = 'Age invalide';
    }
    if (weight && (isNaN(parseFloat(weight)) || parseFloat(weight) < 0)) {
      newErrors.weight = 'Poids invalide';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      // Scroll to top to show errors
      scrollRef.current?.scrollTo({ y: 0, animated: true });
      return;
    }

    setLoading(true);
    try {
      await addPetAPI({
        name: name.trim(),
        species,
        breed: breed.trim() || undefined,
        age: age ? parseInt(age, 10) : undefined,
        weight: weight ? parseFloat(weight) : undefined,
        gender,
        vaccinated,
        specialNeeds: specialNeeds.trim() || undefined,
      });

      // Play success animation
      Animated.spring(successAnim, {
        toValue: 1,
        tension: 50,
        friction: 5,
        useNativeDriver: true,
      }).start();

      Alert.alert(
        'Felicitations ! 🎉',
        `${name.trim()} a ete ajoute avec succes a votre famille.`,
        [{ text: 'Super', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      const msg =
        error?.response?.data?.error ||
        "Impossible d'ajouter l'animal. Verifiez votre connexion et reessayez.";
      Alert.alert('Erreur', msg);
    } finally {
      setLoading(false);
    }
  };

  // Computed: progress indicator
  const filledCount = [name, species, gender].filter(Boolean).length;
  const totalRequired = 3;
  const progress = filledCount / totalRequired;

  // Selected species config
  const selectedSpecies = SPECIES.find((s) => s.key === species);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Text style={styles.backArrow}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nouvel animal</Text>
        {/* Progress indicator */}
        <View style={styles.progressContainer}>
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${progress * 100}%`,
                  backgroundColor:
                    progress === 1 ? '#10B981' : '#FF6B35',
                },
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            {filledCount}/{totalRequired}
          </Text>
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <ScrollView
          ref={scrollRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Preview Card */}
          {(name || selectedSpecies) && (
            <View style={styles.previewCard}>
              <LinearGradient
                colors={
                  selectedSpecies
                    ? [selectedSpecies.color, selectedSpecies.color + 'CC']
                    : ['#FF6B35', '#FF8F65']
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.previewGradient}
              >
                <Text style={styles.previewIcon}>
                  {selectedSpecies?.icon || '🐾'}
                </Text>
                <View style={styles.previewInfo}>
                  <Text style={styles.previewName} numberOfLines={1}>
                    {name || 'Nom de votre animal'}
                  </Text>
                  <Text style={styles.previewSpecies}>
                    {selectedSpecies?.label || 'Espece'}
                    {breed ? ` - ${breed}` : ''}
                  </Text>
                </View>
              </LinearGradient>
            </View>
          )}

          {/* Section: Identity */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Identite</Text>
            <View style={styles.sectionCard}>
              {/* Name Input */}
              <View style={styles.field}>
                <Text style={styles.label}>
                  Nom <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    errors.name && styles.inputError,
                  ]}
                  value={name}
                  onChangeText={(val) => {
                    setName(val);
                    clearError('name');
                  }}
                  placeholder="ex: Rex, Minou, Bulle..."
                  placeholderTextColor={colors.placeholder}
                  autoCapitalize="words"
                  returnKeyType="next"
                  onSubmitEditing={() => breedRef.current?.focus()}
                />
                {errors.name && (
                  <Text style={styles.errorText}>{errors.name}</Text>
                )}
              </View>

              {/* Species Grid */}
              <View style={styles.field}>
                <Text style={styles.label}>
                  Espece <Text style={styles.required}>*</Text>
                </Text>
                {errors.species && (
                  <Text style={styles.errorText}>{errors.species}</Text>
                )}
                <View style={styles.speciesGrid}>
                  {SPECIES.map((s) => {
                    const isActive = species === s.key;
                    return (
                      <TouchableOpacity
                        key={s.key}
                        style={[
                          styles.speciesChip,
                          isActive && {
                            backgroundColor: s.color + '15',
                            borderColor: s.color,
                          },
                        ]}
                        onPress={() => {
                          setSpecies(s.key);
                          clearError('species');
                        }}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.speciesEmoji}>{s.icon}</Text>
                        <Text
                          style={[
                            styles.speciesLabel,
                            isActive && { color: s.color, fontWeight: '700' },
                          ]}
                        >
                          {s.label}
                        </Text>
                        {isActive && (
                          <View
                            style={[
                              styles.speciesCheck,
                              { backgroundColor: s.color },
                            ]}
                          >
                            <Text style={styles.speciesCheckText}>✓</Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Gender Selector */}
              <View style={styles.fieldLast}>
                <Text style={styles.label}>
                  Genre <Text style={styles.required}>*</Text>
                </Text>
                {errors.gender && (
                  <Text style={styles.errorText}>{errors.gender}</Text>
                )}
                <View style={styles.genderRow}>
                  {GENDERS.map((g) => {
                    const isActive = gender === g.key;
                    return (
                      <TouchableOpacity
                        key={g.key}
                        style={[
                          styles.genderOption,
                          isActive && {
                            backgroundColor: g.bgColor,
                            borderColor: g.color,
                          },
                        ]}
                        onPress={() => {
                          setGender(g.key);
                          clearError('gender');
                        }}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.genderIcon,
                            isActive && { color: g.color },
                          ]}
                        >
                          {g.icon}
                        </Text>
                        <Text
                          style={[
                            styles.genderLabel,
                            isActive && {
                              color: g.color,
                              fontWeight: '700',
                            },
                          ]}
                        >
                          {g.label}
                        </Text>
                        {isActive && (
                          <View
                            style={[
                              styles.genderCheck,
                              { backgroundColor: g.color },
                            ]}
                          >
                            <Text style={styles.genderCheckText}>✓</Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </View>
          </View>

          {/* Section: Characteristics */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Caracteristiques</Text>
            <View style={styles.sectionCard}>
              {/* Breed */}
              <View style={styles.field}>
                <Text style={styles.label}>Race</Text>
                <TextInput
                  ref={breedRef}
                  style={styles.input}
                  value={breed}
                  onChangeText={setBreed}
                  placeholder="ex: Labrador, Siamois, Persan..."
                  placeholderTextColor={colors.placeholder}
                  autoCapitalize="words"
                  returnKeyType="next"
                  onSubmitEditing={() => ageRef.current?.focus()}
                />
              </View>

              {/* Age & Weight Row */}
              <View style={styles.inlineRow}>
                <View style={styles.inlineField}>
                  <Text style={styles.label}>Age (annees)</Text>
                  <TextInput
                    ref={ageRef}
                    style={[
                      styles.input,
                      errors.age && styles.inputError,
                    ]}
                    value={age}
                    onChangeText={(val) => {
                      setAge(val);
                      clearError('age');
                    }}
                    placeholder="ex: 3"
                    placeholderTextColor={colors.placeholder}
                    keyboardType="numeric"
                    returnKeyType="next"
                    onSubmitEditing={() => weightRef.current?.focus()}
                  />
                  {errors.age && (
                    <Text style={styles.errorText}>{errors.age}</Text>
                  )}
                </View>
                <View style={styles.inlineSpacer} />
                <View style={styles.inlineField}>
                  <Text style={styles.label}>Poids (kg)</Text>
                  <TextInput
                    ref={weightRef}
                    style={[
                      styles.input,
                      errors.weight && styles.inputError,
                    ]}
                    value={weight}
                    onChangeText={(val) => {
                      setWeight(val);
                      clearError('weight');
                    }}
                    placeholder="ex: 12.5"
                    placeholderTextColor={colors.placeholder}
                    keyboardType="decimal-pad"
                    returnKeyType="done"
                  />
                  {errors.weight && (
                    <Text style={styles.errorText}>{errors.weight}</Text>
                  )}
                </View>
              </View>

              {/* Vaccinated Switch */}
              <View style={styles.switchRow}>
                <View style={styles.switchIconContainer}>
                  <Text style={styles.switchEmoji}>💉</Text>
                </View>
                <View style={styles.switchInfo}>
                  <Text style={styles.switchLabel}>Vaccine</Text>
                  <Text style={styles.switchDescription}>
                    A jour de ses vaccins
                  </Text>
                </View>
                <Switch
                  value={vaccinated}
                  onValueChange={setVaccinated}
                  trackColor={{
                    false: colors.border,
                    true: '#10B98170',
                  }}
                  thumbColor={vaccinated ? '#10B981' : '#f4f3f4'}
                  ios_backgroundColor={colors.border}
                />
              </View>
            </View>
          </View>

          {/* Section: Additional Info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Informations complementaires</Text>
            <View style={styles.sectionCard}>
              <View style={styles.fieldLast}>
                <Text style={styles.label}>Besoins speciaux</Text>
                <Text style={styles.labelHint}>
                  Allergies, medicaments, regime alimentaire, habitudes...
                </Text>
                <TextInput
                  ref={specialNeedsRef}
                  style={[styles.input, styles.textArea]}
                  value={specialNeeds}
                  onChangeText={setSpecialNeeds}
                  placeholder="Decrivez les besoins particuliers de votre animal..."
                  placeholderTextColor={colors.placeholder}
                  multiline
                  textAlignVertical="top"
                  numberOfLines={4}
                />
                <Text style={styles.charCount}>
                  {specialNeeds.length}/500
                </Text>
              </View>
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[
              styles.submitButton,
              loading && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            activeOpacity={0.85}
            disabled={loading}
          >
            <LinearGradient
              colors={
                loading
                  ? [colors.textLight, colors.textTertiary]
                  : ['#FF6B35', '#FF8F65']
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.submitGradient}
            >
              {loading ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <>
                  <Text style={styles.submitIcon}>🐾</Text>
                  <Text style={styles.submitText}>
                    Ajouter {name.trim() || 'mon animal'}
                  </Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.bottomSpacer} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING['3xl'],
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: HEADER_PADDING_TOP,
    paddingBottom: SPACING.base,
    paddingHorizontal: SPACING.lg,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.md,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.sm,
  },
  backArrow: {
    fontSize: 26,
    color: colors.text,
    fontWeight: '600',
    marginTop: -2,
  },
  headerTitle: {
    flex: 1,
    fontSize: FONT_SIZE.xl,
    fontWeight: '800',
    color: colors.text,
    marginLeft: SPACING.base,
    letterSpacing: 0.2,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  progressTrack: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
    color: colors.textTertiary,
  },

  // Preview Card
  previewCard: {
    marginBottom: SPACING.xl,
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    ...SHADOWS.md,
  },
  previewGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.base,
    borderRadius: RADIUS.xl,
  },
  previewIcon: {
    fontSize: 36,
    marginRight: SPACING.base,
  },
  previewInfo: {
    flex: 1,
  },
  previewName: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '700',
    color: colors.white,
    marginBottom: 2,
  },
  previewSpecies: {
    fontSize: FONT_SIZE.sm,
    color: 'rgba(255, 255, 255, 0.85)',
    fontWeight: '500',
  },

  // Sections
  section: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: SPACING.md,
    marginLeft: SPACING.xs,
  },
  sectionCard: {
    backgroundColor: colors.white,
    borderRadius: RADIUS.xl,
    padding: SPACING.base,
    ...SHADOWS.md,
  },

  // Fields
  field: {
    marginBottom: SPACING.lg,
  },
  fieldLast: {
    marginBottom: 0,
  },
  label: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    color: colors.text,
    marginBottom: SPACING.sm,
  },
  labelHint: {
    fontSize: FONT_SIZE.xs,
    color: colors.textTertiary,
    marginBottom: SPACING.sm,
    marginTop: -SPACING.xs,
    lineHeight: 16,
  },
  required: {
    color: colors.error,
    fontWeight: '400',
  },
  input: {
    backgroundColor: colors.background,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.md + 2,
    fontSize: FONT_SIZE.base,
    color: colors.text,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  inputError: {
    borderColor: colors.error,
    backgroundColor: colors.errorSoft,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
    paddingTop: SPACING.md,
  },
  errorText: {
    fontSize: FONT_SIZE.xs,
    color: colors.error,
    fontWeight: '500',
    marginTop: SPACING.xs,
    marginLeft: SPACING.xs,
  },
  charCount: {
    fontSize: FONT_SIZE.xs,
    color: colors.textLight,
    textAlign: 'right',
    marginTop: SPACING.xs,
  },

  // Species Grid
  speciesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  speciesChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    borderRadius: RADIUS.lg,
    backgroundColor: colors.background,
    borderWidth: 1.5,
    borderColor: colors.border,
    gap: SPACING.xs,
  },
  speciesEmoji: {
    fontSize: 18,
  },
  speciesLabel: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  speciesCheck: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 2,
  },
  speciesCheckText: {
    fontSize: 10,
    color: colors.white,
    fontWeight: '800',
  },

  // Gender
  genderRow: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  genderOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.base,
    borderRadius: RADIUS.lg,
    backgroundColor: colors.background,
    borderWidth: 1.5,
    borderColor: colors.border,
    gap: SPACING.sm,
  },
  genderIcon: {
    fontSize: 20,
    color: colors.textSecondary,
  },
  genderLabel: {
    fontSize: FONT_SIZE.base,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  genderCheck: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  genderCheckText: {
    fontSize: 11,
    color: colors.white,
    fontWeight: '800',
  },

  // Inline Row (Age + Weight)
  inlineRow: {
    flexDirection: 'row',
    marginBottom: SPACING.lg,
  },
  inlineField: {
    flex: 1,
  },
  inlineSpacer: {
    width: SPACING.md,
  },

  // Switch
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  switchIconContainer: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  switchEmoji: {
    fontSize: 18,
  },
  switchInfo: {
    flex: 1,
    marginRight: SPACING.base,
  },
  switchLabel: {
    fontSize: FONT_SIZE.base,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  switchDescription: {
    fontSize: FONT_SIZE.xs,
    color: colors.textTertiary,
    fontWeight: '400',
  },

  // Submit
  submitButton: {
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    marginTop: SPACING.sm,
    ...SHADOWS.glow('#FF6B35'),
  },
  submitButtonDisabled: {
    ...SHADOWS.sm,
  },
  submitGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.base + 2,
    borderRadius: RADIUS.xl,
    gap: SPACING.sm,
  },
  submitIcon: {
    fontSize: 18,
  },
  submitText: {
    fontSize: FONT_SIZE.md,
    fontWeight: '700',
    color: colors.white,
    letterSpacing: 0.3,
  },

  bottomSpacer: {
    height: SPACING['2xl'],
  },
});

export default AddPetScreen;
