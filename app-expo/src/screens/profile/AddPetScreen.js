// ─────────────────────────────────────────────────────────────────────────────
// Pépète — AddPetScreen v3.0 — création + édition + photo picker
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, ScrollView, TouchableOpacity,
  StyleSheet, Switch, Platform, StatusBar, KeyboardAvoidingView,
  ActivityIndicator, Alert, Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { PepeteIcon } from '../../components/PepeteLogo';
import { addPetAPI, updatePetAPI } from '../../api/pets';
import { FONTS } from '../../utils/typography';
const colors = require('../../utils/colors');
const { SHADOWS, RADIUS, SPACING, FONT_SIZE } = require('../../utils/colors');

const SPECIES = [
  { key: 'chien',   label: 'Chien',   emoji: '🐶', gradient: ['#527A56','#6B8F71'] },
  { key: 'chat',    label: 'Chat',    emoji: '🐱', gradient: ['#6B8F71','#8CB092'] },
  { key: 'rongeur', label: 'Rongeur', emoji: '🐹', gradient: ['#C4956A','#D4AD86'] },
  { key: 'oiseau',  label: 'Oiseau',  emoji: '🦜', gradient: ['#8CB092','#B0BEB2'] },
  { key: 'reptile', label: 'Reptile', emoji: '🦎', gradient: ['#3D5E41','#527A56'] },
  { key: 'poisson', label: 'Poisson', emoji: '🐟', gradient: ['#B8A88A','#D4C8AE'] },
  { key: 'autre',   label: 'Autre',   emoji: '🐾', gradient: ['#8A9A8C','#B0BEB2'] },
];

const GENDERS = [
  { key: 'male',    label: 'Mâle',   icon: '♂', color: '#8CB092', bg: '#EFF5F0' },
  { key: 'femelle', label: 'Femelle', icon: '♀', color: '#C4956A', bg: '#FDF5ED' },
];

const AddPetScreen = ({ navigation, route }) => {
  const editPet = route.params?.pet ?? null;
  const isEdit = !!editPet;

  const insets = useSafeAreaInsets();

  // ─── State ────────────────────────────────────────────────────────────────
  const [photoUri, setPhotoUri] = useState(editPet?.photos?.[0] ?? null);
  const [name, setName] = useState(editPet?.name ?? '');
  const [species, setSpecies] = useState(editPet?.species ?? '');
  const [breed, setBreed] = useState(editPet?.breed ?? '');
  const [age, setAge] = useState(editPet?.age != null ? String(editPet.age) : '');
  const [weight, setWeight] = useState(editPet?.weight != null ? String(editPet.weight) : '');
  const [gender, setGender] = useState(editPet?.gender ?? '');
  const [vaccinated, setVaccinated] = useState(editPet?.vaccinated ?? false);
  const [sterilized, setSterilized] = useState(editPet?.sterilized ?? false);
  const [specialNeeds, setSpecialNeeds] = useState(editPet?.specialNeeds ?? '');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const scrollRef = useRef(null);
  const breedRef = useRef(null);
  const ageRef = useRef(null);
  const weightRef = useRef(null);

  // ─── Photo picker ─────────────────────────────────────────────────────────
  const pickPhoto = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission requise', 'Autorisez l\'accès à la galerie pour choisir une photo.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
        base64: true,
      });
      if (!result.canceled && result.assets?.[0]) {
        const asset = result.assets[0];
        const uri = asset.base64
          ? `data:image/jpeg;base64,${asset.base64}`
          : asset.uri;
        setPhotoUri(uri);
      }
    } catch (err) {
      console.log('Erreur photo picker:', err);
    }
  };

  // ─── Validation ───────────────────────────────────────────────────────────
  const clearError = (field) => {
    if (errors[field]) setErrors((p) => { const n = { ...p }; delete n[field]; return n; });
  };

  const validate = () => {
    const e = {};
    if (!name.trim()) e.name = 'Le nom est requis';
    if (!species) e.species = 'Choisissez une espèce';
    if (!gender) e.gender = 'Choisissez le genre';
    if (age && (isNaN(parseInt(age, 10)) || parseInt(age, 10) < 0)) e.age = 'Âge invalide';
    if (weight && (isNaN(parseFloat(weight)) || parseFloat(weight) < 0)) e.weight = 'Poids invalide';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ─── Submit ───────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!validate()) {
      scrollRef.current?.scrollTo({ y: 0, animated: true });
      return;
    }
    setLoading(true);
    try {
      const payload = {
        name: name.trim(),
        species,
        breed: breed.trim() || undefined,
        age: age ? parseInt(age, 10) : undefined,
        weight: weight ? parseFloat(weight) : undefined,
        gender,
        vaccinated,
        sterilized,
        specialNeeds: specialNeeds.trim() || undefined,
        photos: photoUri ? [photoUri] : (editPet?.photos ?? []),
      };
      if (isEdit) {
        await updatePetAPI(editPet._id, payload);
      } else {
        await addPetAPI(payload);
      }
      navigation.goBack();
    } catch (err) {
      const msg = err?.response?.data?.message || 'Une erreur est survenue. Réessayez.';
      Alert.alert('Erreur', msg);
    } finally {
      setLoading(false);
    }
  };

  const selectedSpecies = SPECIES.find((s) => s.key === species);

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />

      {/* Header gradient */}
      <LinearGradient
        colors={['#1C2B1E', '#2C3E2F', '#3D5E41']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + 12 }]}
      >
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Feather name="chevron-left" size={22} color="rgba(255,255,255,0.9)" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isEdit ? `Modifier ${editPet.name}` : 'Nouvel animal'}
        </Text>
        <View style={styles.headerIcon}>
          <PepeteIcon size={22} color="rgba(255,255,255,0.6)" />
        </View>
      </LinearGradient>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          ref={scrollRef}
          style={styles.scroll}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 48 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── Photo picker ── */}
          <View style={styles.photoSection}>
            <TouchableOpacity
              style={styles.photoCircle}
              onPress={pickPhoto}
              activeOpacity={0.85}
            >
              {photoUri ? (
                <Image source={{ uri: photoUri }} style={styles.photoImage} resizeMode="cover" />
              ) : selectedSpecies ? (
                <LinearGradient
                  colors={selectedSpecies.gradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.photoPlaceholder}
                >
                  <Text style={styles.photoEmoji}>{selectedSpecies.emoji}</Text>
                  <View style={styles.photoCameraOverlay}>
                    <Feather name="camera" size={16} color="#FFF" />
                  </View>
                </LinearGradient>
              ) : (
                <LinearGradient
                  colors={['#3D5E41', '#527A56']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.photoPlaceholder}
                >
                  <PepeteIcon size={36} color="rgba(255,255,255,0.5)" />
                  <View style={styles.photoCameraOverlay}>
                    <Feather name="camera" size={16} color="#FFF" />
                  </View>
                </LinearGradient>
              )}
            </TouchableOpacity>
            <Text style={styles.photoHint}>
              {photoUri ? 'Appuyez pour changer la photo' : 'Appuyez pour ajouter une photo'}
            </Text>
            {photoUri && (
              <TouchableOpacity onPress={() => setPhotoUri(null)} hitSlop={{ top: 8, bottom: 8, left: 16, right: 16 }}>
                <Text style={styles.photoRemove}>Supprimer la photo</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* ── Section Identité ── */}
          <Text style={styles.sectionTitle}>Identité</Text>
          <View style={styles.sectionCard}>
            {/* Nom */}
            <View style={styles.field}>
              <Text style={styles.label}>Nom <Text style={styles.required}>*</Text></Text>
              <TextInput
                style={[styles.input, errors.name && styles.inputError]}
                value={name}
                onChangeText={(v) => { setName(v); clearError('name'); }}
                placeholder="Ex : Luna, Max, Sushi…"
                placeholderTextColor={colors.textLight}
                returnKeyType="next"
                onSubmitEditing={() => breedRef.current?.focus()}
                autoCapitalize="words"
              />
              {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
            </View>

            {/* Espèce */}
            <View style={styles.field}>
              <Text style={styles.label}>Espèce <Text style={styles.required}>*</Text></Text>
              <View style={styles.speciesGrid}>
                {SPECIES.map((s) => {
                  const active = species === s.key;
                  return (
                    <TouchableOpacity
                      key={s.key}
                      style={[styles.speciesChip, active && styles.speciesChipActive]}
                      onPress={() => { setSpecies(s.key); clearError('species'); }}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.speciesEmoji}>{s.emoji}</Text>
                      <Text style={[styles.speciesLabel, active && styles.speciesLabelActive]}>
                        {s.label}
                      </Text>
                      {active && (
                        <LinearGradient
                          colors={s.gradient}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={styles.speciesCheck}
                        >
                          <Feather name="check" size={10} color="#FFF" />
                        </LinearGradient>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
              {errors.species && <Text style={styles.errorText}>{errors.species}</Text>}
            </View>

            {/* Genre */}
            <View style={[styles.field, { marginBottom: 0 }]}>
              <Text style={styles.label}>Genre <Text style={styles.required}>*</Text></Text>
              <View style={styles.genderRow}>
                {GENDERS.map((g) => {
                  const active = gender === g.key;
                  return (
                    <TouchableOpacity
                      key={g.key}
                      style={[
                        styles.genderBtn,
                        active && { backgroundColor: g.bg, borderColor: g.color },
                      ]}
                      onPress={() => { setGender(g.key); clearError('gender'); }}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.genderIcon, active && { color: g.color }]}>{g.icon}</Text>
                      <Text style={[styles.genderLabel, active && { color: g.color }]}>{g.label}</Text>
                      {active && <Feather name="check-circle" size={16} color={g.color} />}
                    </TouchableOpacity>
                  );
                })}
              </View>
              {errors.gender && <Text style={styles.errorText}>{errors.gender}</Text>}
            </View>
          </View>

          {/* ── Section Détails ── */}
          <Text style={styles.sectionTitle}>Détails</Text>
          <View style={styles.sectionCard}>
            {/* Race */}
            <View style={styles.field}>
              <Text style={styles.label}>Race</Text>
              <TextInput
                ref={breedRef}
                style={styles.input}
                value={breed}
                onChangeText={setBreed}
                placeholder="Ex : Berger australien, Siamois…"
                placeholderTextColor={colors.textLight}
                returnKeyType="next"
                onSubmitEditing={() => ageRef.current?.focus()}
                autoCapitalize="words"
              />
            </View>

            {/* Âge + Poids en ligne */}
            <View style={styles.row}>
              <View style={[styles.field, styles.rowField]}>
                <Text style={styles.label}>Âge (ans)</Text>
                <TextInput
                  ref={ageRef}
                  style={[styles.input, errors.age && styles.inputError]}
                  value={age}
                  onChangeText={(v) => { setAge(v); clearError('age'); }}
                  placeholder="Ex : 3"
                  placeholderTextColor={colors.textLight}
                  keyboardType="numeric"
                  returnKeyType="next"
                  onSubmitEditing={() => weightRef.current?.focus()}
                />
                {errors.age && <Text style={styles.errorText}>{errors.age}</Text>}
              </View>
              <View style={{ width: SPACING.md }} />
              <View style={[styles.field, styles.rowField]}>
                <Text style={styles.label}>Poids (kg)</Text>
                <TextInput
                  ref={weightRef}
                  style={[styles.input, errors.weight && styles.inputError]}
                  value={weight}
                  onChangeText={(v) => { setWeight(v); clearError('weight'); }}
                  placeholder="Ex : 12.5"
                  placeholderTextColor={colors.textLight}
                  keyboardType="decimal-pad"
                  returnKeyType="done"
                />
                {errors.weight && <Text style={styles.errorText}>{errors.weight}</Text>}
              </View>
            </View>

            {/* Vacciné */}
            <View style={[styles.switchRow, { marginBottom: 0 }]}>
              <View style={styles.switchIconWrap}>
                <Feather name="shield" size={18} color={vaccinated ? colors.success : colors.textTertiary} />
              </View>
              <View style={styles.switchInfo}>
                <Text style={styles.switchLabel}>Vacciné</Text>
                <Text style={styles.switchSub}>Vaccins à jour</Text>
              </View>
              <Switch
                value={vaccinated}
                onValueChange={setVaccinated}
                trackColor={{ false: colors.border, true: colors.success }}
                thumbColor={colors.white}
              />
            </View>

            {/* Stérilisé / Castré */}
            <View style={[styles.switchRow, { marginBottom: 0 }]}>
              <View style={styles.switchIconWrap}>
                <Feather name="scissors" size={18} color={sterilized ? colors.success : colors.textTertiary} />
              </View>
              <View style={styles.switchInfo}>
                <Text style={styles.switchLabel}>Stérilisé / Castré</Text>
                <Text style={styles.switchSub}>Animal stérilisé ou castré</Text>
              </View>
              <Switch
                value={sterilized}
                onValueChange={setSterilized}
                trackColor={{ false: colors.border, true: colors.success }}
                thumbColor={colors.white}
              />
            </View>
          </View>

          {/* ── Section Besoins spéciaux ── */}
          <Text style={styles.sectionTitle}>Besoins particuliers</Text>
          <View style={styles.sectionCard}>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={specialNeeds}
              onChangeText={setSpecialNeeds}
              placeholder="Allergies, régime alimentaire, traitement médical, comportement…"
              placeholderTextColor={colors.textLight}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          {/* ── Bouton submit ── */}
          <TouchableOpacity
            style={styles.submitBtn}
            onPress={handleSubmit}
            activeOpacity={0.85}
            disabled={loading}
          >
            <LinearGradient
              colors={loading ? [colors.textLight, colors.textTertiary] : [colors.primaryDark, colors.primary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.submitGrad}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <>
                  <PepeteIcon size={18} color="#FFF" />
                  <Text style={styles.submitText}>
                    {isEdit ? 'Enregistrer les modifications' : `Ajouter ${name.trim() || 'mon animal'}`}
                  </Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xl,
    gap: SPACING.base,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.lg,
    backgroundColor: 'rgba(255,255,255,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontFamily: FONTS.brand,
    fontSize: FONT_SIZE.xl,
    color: '#FFF',
    letterSpacing: -0.4,
  },
  headerIcon: {
    width: 38,
    alignItems: 'flex-end',
  },

  // Scroll
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: SPACING.base,
    paddingTop: SPACING.xl,
  },

  // Photo
  photoSection: {
    alignItems: 'center',
    marginBottom: SPACING['2xl'],
  },
  photoCircle: {
    width: 112,
    height: 112,
    borderRadius: 56,
    overflow: 'hidden',
    ...SHADOWS.md,
    marginBottom: SPACING.md,
  },
  photoImage: {
    width: 112,
    height: 112,
  },
  photoPlaceholder: {
    width: 112,
    height: 112,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoEmoji: {
    fontSize: 40,
  },
  photoCameraOverlay: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoHint: {
    fontFamily: FONTS.bodyMedium,
    fontSize: FONT_SIZE.sm,
    color: colors.textSecondary,
    marginBottom: SPACING.xs,
  },
  photoRemove: {
    fontFamily: FONTS.bodyMedium,
    fontSize: FONT_SIZE.sm,
    color: colors.error,
    textDecorationLine: 'underline',
  },

  // Sections
  sectionTitle: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZE.xs,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: SPACING.sm,
    marginLeft: SPACING.xs,
  },
  sectionCard: {
    backgroundColor: colors.white,
    borderRadius: RADIUS.xl,
    padding: SPACING.base,
    marginBottom: SPACING.xl,
    ...SHADOWS.md,
  },

  // Fields
  field: { marginBottom: SPACING.base },
  label: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZE.sm,
    color: colors.text,
    marginBottom: SPACING.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  required: {
    color: colors.error,
    fontWeight: '400',
  },
  input: {
    backgroundColor: colors.background,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.base,
    paddingVertical: Platform.OS === 'ios' ? SPACING.base : SPACING.md,
    fontFamily: FONTS.body,
    fontSize: FONT_SIZE.base,
    color: colors.text,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  inputError: {
    borderColor: colors.error,
  },
  textArea: {
    minHeight: 80,
    paddingTop: SPACING.md,
    textAlignVertical: 'top',
  },
  errorText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: FONT_SIZE.xs,
    color: colors.error,
    marginTop: SPACING.xs,
  },

  row: {
    flexDirection: 'row',
    marginBottom: SPACING.base,
  },
  rowField: { flex: 1, marginBottom: 0 },

  // Species
  speciesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  speciesChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.lg,
    backgroundColor: colors.background,
    borderWidth: 1.5,
    borderColor: colors.border,
    gap: SPACING.xs,
  },
  speciesChipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  speciesEmoji: { fontSize: 16 },
  speciesLabel: {
    fontFamily: FONTS.bodyMedium,
    fontSize: FONT_SIZE.sm,
    color: colors.textSecondary,
  },
  speciesLabelActive: { color: colors.primaryDark },
  speciesCheck: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Gender
  genderRow: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  genderBtn: {
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
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZE.base,
    color: colors.textSecondary,
  },

  // Switch
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.base,
  },
  switchIconWrap: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  switchInfo: {
    flex: 1,
    marginRight: SPACING.base,
  },
  switchLabel: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZE.base,
    color: colors.text,
  },
  switchSub: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZE.xs,
    color: colors.textTertiary,
    marginTop: 1,
  },

  // Submit
  submitBtn: {
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    marginTop: SPACING.sm,
    ...SHADOWS.md,
  },
  submitGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.base + 2,
    gap: SPACING.sm,
  },
  submitText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZE.md,
    color: '#FFF',
    letterSpacing: 0.3,
  },
});

export default AddPetScreen;
