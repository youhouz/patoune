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
  KeyboardAvoidingView,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { addPetAPI } from '../../api/pets';
import { FONTS } from '../../utils/typography';
const { COLORS, SHADOWS, RADIUS, SPACING, FONT_SIZE } = require('../../utils/colors');

const SPECIES = [
  { key: 'chien', label: 'Chien', icon: 'gitlab', color: COLORS.primary },
  { key: 'chat', label: 'Chat', icon: 'github', color: COLORS.accent },
  { key: 'rongeur', label: 'Rongeur', icon: 'mouse-pointer', color: COLORS.warning },
  { key: 'oiseau', label: 'Oiseau', icon: 'feather', color: COLORS.secondary },
  { key: 'reptile', label: 'Reptile', icon: 'zap', color: COLORS.success },
  { key: 'poisson', label: 'Poisson', icon: 'droplet', color: COLORS.info },
  { key: 'autre', label: 'Autre', icon: 'heart', color: COLORS.pebble },
];

const GENDERS = [
  { key: 'male', label: 'Male', icon: '\u2642', color: '#3B82F6', bgColor: '#EFF6FF' },
  { key: 'femelle', label: 'Femelle', icon: '\u2640', color: '#EC4899', bgColor: '#FDF2F8' },
];

const AddPetScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
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
        'Felicitations !',
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
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Feather name="arrow-left" size={20} color={COLORS.charcoal} />
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
                    progress === 1 ? COLORS.success : COLORS.primary,
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
                    : COLORS.gradientPrimary
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.previewGradient}
              >
                <View style={styles.previewIconContainer}>
                  <Feather
                    name={selectedSpecies?.icon || 'heart'}
                    size={32}
                    color={COLORS.white}
                  />
                </View>
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
                  placeholderTextColor={COLORS.placeholder}
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
                        <Feather name={s.icon} size={18} color={isActive ? s.color : COLORS.pebble} />
                        <Text
                          style={[
                            styles.speciesLabel,
                            isActive && { color: s.color, fontFamily: FONTS.heading },
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
                            <Feather name="check" size={10} color={COLORS.white} />
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
                              fontFamily: FONTS.heading,
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
                            <Feather name="check" size={11} color={COLORS.white} />
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
                  placeholderTextColor={COLORS.placeholder}
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
                    placeholderTextColor={COLORS.placeholder}
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
                    placeholderTextColor={COLORS.placeholder}
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
                  <Feather name="shield" size={18} color={COLORS.success} />
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
                    false: COLORS.border,
                    true: COLORS.success + '70',
                  }}
                  thumbColor={vaccinated ? COLORS.success : '#f4f3f4'}
                  ios_backgroundColor={COLORS.border}
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
                  placeholderTextColor={COLORS.placeholder}
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
                  ? [COLORS.sand, COLORS.pebble]
                  : COLORS.gradientPrimary
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.submitGradient}
            >
              {loading ? (
                <ActivityIndicator size="small" color={COLORS.white} />
              ) : (
                <>
                  <Feather name="heart" size={18} color={COLORS.white} />
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
    backgroundColor: COLORS.cream,
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
    paddingBottom: SPACING.base,
    paddingHorizontal: SPACING.lg,
    backgroundColor: COLORS.cream,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.sm,
  },
  headerTitle: {
    flex: 1,
    fontSize: FONT_SIZE.xl,
    fontFamily: FONTS.heading,
    color: COLORS.charcoal,
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
    backgroundColor: COLORS.border,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    fontSize: FONT_SIZE.xs,
    fontFamily: FONTS.bodySemiBold,
    color: COLORS.pebble,
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
  previewIconContainer: {
    marginRight: SPACING.base,
  },
  previewInfo: {
    flex: 1,
  },
  previewName: {
    fontSize: FONT_SIZE.lg,
    fontFamily: FONTS.heading,
    color: COLORS.white,
    marginBottom: 2,
  },
  previewSpecies: {
    fontSize: FONT_SIZE.sm,
    fontFamily: FONTS.bodyMedium,
    color: 'rgba(255, 255, 255, 0.85)',
  },

  // Sections
  section: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: FONT_SIZE.sm,
    fontFamily: FONTS.bodySemiBold,
    color: COLORS.stone,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: SPACING.md,
    marginLeft: SPACING.xs,
  },
  sectionCard: {
    backgroundColor: COLORS.white,
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
    fontFamily: FONTS.bodySemiBold,
    color: COLORS.charcoal,
    marginBottom: SPACING.sm,
  },
  labelHint: {
    fontSize: FONT_SIZE.xs,
    fontFamily: FONTS.body,
    color: COLORS.pebble,
    marginBottom: SPACING.sm,
    marginTop: -SPACING.xs,
    lineHeight: 16,
  },
  required: {
    color: COLORS.error,
    fontWeight: '400',
  },
  input: {
    backgroundColor: COLORS.linen,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.md + 2,
    fontSize: FONT_SIZE.base,
    fontFamily: FONTS.body,
    color: COLORS.charcoal,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  inputError: {
    borderColor: COLORS.error,
    backgroundColor: COLORS.errorSoft,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
    paddingTop: SPACING.md,
  },
  errorText: {
    fontSize: FONT_SIZE.xs,
    fontFamily: FONTS.bodyMedium,
    color: COLORS.error,
    marginTop: SPACING.xs,
    marginLeft: SPACING.xs,
  },
  charCount: {
    fontSize: FONT_SIZE.xs,
    fontFamily: FONTS.body,
    color: COLORS.sand,
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
    backgroundColor: COLORS.linen,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    gap: SPACING.xs,
  },
  speciesLabel: {
    fontSize: FONT_SIZE.sm,
    fontFamily: FONTS.bodySemiBold,
    color: COLORS.stone,
  },
  speciesCheck: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 2,
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
    backgroundColor: COLORS.linen,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    gap: SPACING.sm,
  },
  genderIcon: {
    fontSize: 20,
    color: COLORS.stone,
  },
  genderLabel: {
    fontSize: FONT_SIZE.base,
    fontFamily: FONTS.bodySemiBold,
    color: COLORS.stone,
  },
  genderCheck: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
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
    backgroundColor: COLORS.linen,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  switchInfo: {
    flex: 1,
    marginRight: SPACING.base,
  },
  switchLabel: {
    fontSize: FONT_SIZE.base,
    fontFamily: FONTS.bodySemiBold,
    color: COLORS.charcoal,
    marginBottom: 2,
  },
  switchDescription: {
    fontSize: FONT_SIZE.xs,
    fontFamily: FONTS.body,
    color: COLORS.pebble,
  },

  // Submit
  submitButton: {
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    marginTop: SPACING.sm,
    ...SHADOWS.glow(COLORS.primary),
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
  submitText: {
    fontSize: FONT_SIZE.md,
    fontFamily: FONTS.heading,
    color: COLORS.white,
    letterSpacing: 0.3,
  },

  bottomSpacer: {
    height: SPACING['2xl'],
  },
});

export default AddPetScreen;
