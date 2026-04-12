// ─────────────────────────────────────────────────────────────────────────────
// Pépète — PetSitterProfileScreen
// Création / édition du profil pet-sitter (annonce)
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet,
  ActivityIndicator, StatusBar, Switch, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { becomePetSitterAPI, updatePetSitterAPI, searchPetSittersAPI } from '../../api/petsitters';
import { showAlert } from '../../utils/alert';
import { FONTS } from '../../utils/typography';
import colors, { SHADOWS, RADIUS, SPACING, FONT_SIZE } from '../../utils/colors';

const SERVICES = [
  { key: 'garde_domicile', label: 'Garde à domicile', icon: 'home', desc: 'Chez le propriétaire' },
  { key: 'garde_chez_sitter', label: 'Garde chez moi', icon: 'lock', desc: 'Chez vous' },
  { key: 'promenade', label: 'Promenade', icon: 'map-pin', desc: 'Balades quotidiennes' },
  { key: 'visite', label: 'Visite à domicile', icon: 'eye', desc: 'Passage chez le propriétaire' },
  { key: 'toilettage', label: 'Toilettage', icon: 'scissors', desc: 'Soins et toilettage' },
];

const ANIMALS = [
  { key: 'chien', label: 'Chien', emoji: '🐶' },
  { key: 'chat', label: 'Chat', emoji: '🐱' },
  { key: 'rongeur', label: 'Rongeur', emoji: '🐹' },
  { key: 'oiseau', label: 'Oiseau', emoji: '🦜' },
  { key: 'reptile', label: 'Reptile', emoji: '🦎' },
  { key: 'poisson', label: 'Poisson', emoji: '🐟' },
  { key: 'autre', label: 'Autre', emoji: '🐾' },
];

const DAYS = [
  { key: 'lundi', label: 'Lun' },
  { key: 'mardi', label: 'Mar' },
  { key: 'mercredi', label: 'Mer' },
  { key: 'jeudi', label: 'Jeu' },
  { key: 'vendredi', label: 'Ven' },
  { key: 'samedi', label: 'Sam' },
  { key: 'dimanche', label: 'Dim' },
];

const PetSitterProfileScreen = ({ navigation }) => {
  const { user, updateUser } = useAuth();
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEdit, setIsEdit] = useState(false);

  // Form state
  const [bio, setBio] = useState('');
  const [experience, setExperience] = useState('');
  const [pricePerDay, setPricePerDay] = useState('');
  const [pricePerHour, setPricePerHour] = useState('');
  const [selectedServices, setSelectedServices] = useState([]);
  const [selectedAnimals, setSelectedAnimals] = useState([]);
  const [selectedDays, setSelectedDays] = useState([]);

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [])
  );

  const loadProfile = async () => {
    try {
      // Try to find existing profile
      const res = await searchPetSittersAPI({});
      const sitters = res.data?.petsitters || res.data || [];
      const myProfile = sitters.find(s => s.user?._id === user?.id || s.user === user?.id);
      if (myProfile) {
        setIsEdit(true);
        setBio(myProfile.bio || '');
        setExperience(myProfile.experience ? String(myProfile.experience) : '');
        setPricePerDay(myProfile.pricePerDay ? String(myProfile.pricePerDay) : '');
        setPricePerHour(myProfile.pricePerHour ? String(myProfile.pricePerHour) : '');
        setSelectedServices(myProfile.services || []);
        setSelectedAnimals(myProfile.acceptedAnimals || []);
        const days = (myProfile.availability || []).map(a => a.day);
        setSelectedDays(days);
      }
    } catch (err) {
      console.log('Pas de profil pet-sitter existant');
    } finally {
      setLoading(false);
    }
  };

  const toggleItem = (list, setList, item) => {
    setList(prev => prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]);
  };

  const handleSave = async () => {
    if (!bio.trim()) {
      showAlert('Champ requis', 'Ajoute une description pour ton annonce.');
      return;
    }
    if (selectedServices.length === 0) {
      showAlert('Services requis', 'Sélectionne au moins un service.');
      return;
    }
    if (selectedAnimals.length === 0) {
      showAlert('Animaux requis', 'Sélectionne au moins un type d\'animal.');
      return;
    }

    setSaving(true);
    try {
      const data = {
        bio: bio.trim(),
        experience: parseInt(experience) || 0,
        pricePerDay: parseFloat(pricePerDay) || 0,
        pricePerHour: parseFloat(pricePerHour) || 0,
        services: selectedServices,
        acceptedAnimals: selectedAnimals,
        availability: selectedDays.map(day => ({ day, startTime: '08:00', endTime: '20:00' })),
      };

      if (isEdit) {
        await updatePetSitterAPI(data);
        showAlert('Profil mis à jour', 'Ton annonce a été mise à jour avec succès !');
      } else {
        await becomePetSitterAPI(data);
        setIsEdit(true);
        // Update user to reflect isPetSitter
        if (user) {
          await updateUser({ ...user, isPetSitter: true });
        }
        showAlert('Annonce créée', 'Ton profil pet-sitter est maintenant en ligne !');
      }
      // Navigate back to profile after successful save
      navigation.goBack();
    } catch (err) {
      console.log('Erreur sauvegarde profil pet-sitter:', err?.response?.data);
      const msg = err?.response?.data?.error || 'Erreur lors de la sauvegarde.';
      showAlert('Erreur', msg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={s.loadingWrap}>
        <StatusBar barStyle="light-content" />
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={s.loadingText}>Chargement...</Text>
      </View>
    );
  }

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <LinearGradient
        colors={['#1C2B1E', '#2C3E2F', '#3D5E41']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[s.header, { paddingTop: insets.top + 12 }]}
      >
        <View style={s.headerRow}>
          <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
            <Feather name="chevron-left" size={22} color="rgba(255,255,255,0.9)" />
          </TouchableOpacity>
          <Text style={s.headerTitle}>{isEdit ? 'Mon annonce' : 'Créer mon annonce'}</Text>
        </View>
      </LinearGradient>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Bio */}
        <Text style={s.sectionTitle}>Description</Text>
        <View style={s.card}>
          <Text style={s.label}>Parle de toi et de ton expérience</Text>
          <TextInput
            style={[s.input, s.textArea]}
            value={bio}
            onChangeText={setBio}
            placeholder="Je suis passionné(e) par les animaux depuis toujours..."
            placeholderTextColor={colors.placeholder}
            multiline
            maxLength={500}
          />
          <Text style={s.charCount}>{bio.length}/500</Text>
        </View>

        {/* Experience */}
        <View style={s.card}>
          <Text style={s.label}>Années d'expérience</Text>
          <TextInput
            style={s.input}
            value={experience}
            onChangeText={setExperience}
            placeholder="Ex: 3"
            placeholderTextColor={colors.placeholder}
            keyboardType="number-pad"
          />
        </View>

        {/* Services */}
        <Text style={s.sectionTitle}>Mes services</Text>
        <View style={s.card}>
          {SERVICES.map(svc => {
            const active = selectedServices.includes(svc.key);
            return (
              <TouchableOpacity
                key={svc.key}
                style={[s.serviceRow, active && s.serviceRowActive]}
                onPress={() => toggleItem(selectedServices, setSelectedServices, svc.key)}
                activeOpacity={0.7}
              >
                <View style={[s.serviceIcon, active && s.serviceIconActive]}>
                  <Feather name={svc.icon} size={18} color={active ? '#FFF' : colors.primary} />
                </View>
                <View style={s.serviceInfo}>
                  <Text style={[s.serviceLabel, active && s.serviceLabelActive]}>{svc.label}</Text>
                  <Text style={s.serviceDesc}>{svc.desc}</Text>
                </View>
                <View style={[s.checkbox, active && s.checkboxActive]}>
                  {active && <Feather name="check" size={14} color="#FFF" />}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Tarifs */}
        <Text style={s.sectionTitle}>Tarifs</Text>
        <View style={s.card}>
          <View style={s.priceRow}>
            <View style={s.priceField}>
              <Text style={s.label}>Prix / jour (€)</Text>
              <TextInput
                style={s.input}
                value={pricePerDay}
                onChangeText={setPricePerDay}
                placeholder="25"
                placeholderTextColor={colors.placeholder}
                keyboardType="decimal-pad"
              />
            </View>
            <View style={s.priceField}>
              <Text style={s.label}>Prix / heure (€)</Text>
              <TextInput
                style={s.input}
                value={pricePerHour}
                onChangeText={setPricePerHour}
                placeholder="10"
                placeholderTextColor={colors.placeholder}
                keyboardType="decimal-pad"
              />
            </View>
          </View>
        </View>

        {/* Animaux acceptés */}
        <Text style={s.sectionTitle}>Animaux acceptes</Text>
        <View style={s.card}>
          <View style={s.animalGrid}>
            {ANIMALS.map(a => {
              const active = selectedAnimals.includes(a.key);
              return (
                <TouchableOpacity
                  key={a.key}
                  style={[s.animalChip, active && s.animalChipActive]}
                  onPress={() => toggleItem(selectedAnimals, setSelectedAnimals, a.key)}
                  activeOpacity={0.7}
                >
                  <Text style={s.animalEmoji}>{a.emoji}</Text>
                  <Text style={[s.animalLabel, active && s.animalLabelActive]}>{a.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Disponibilités */}
        <Text style={s.sectionTitle}>Disponibilités</Text>
        <View style={s.card}>
          <View style={s.daysRow}>
            {DAYS.map(d => {
              const active = selectedDays.includes(d.key);
              return (
                <TouchableOpacity
                  key={d.key}
                  style={[s.dayChip, active && s.dayChipActive]}
                  onPress={() => toggleItem(selectedDays, setSelectedDays, d.key)}
                  activeOpacity={0.7}
                >
                  <Text style={[s.dayLabel, active && s.dayLabelActive]}>{d.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </ScrollView>

      {/* Save button */}
      <View style={[s.bottomBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <TouchableOpacity onPress={handleSave} disabled={saving} activeOpacity={0.88} style={s.saveWrap}>
          <LinearGradient
            colors={saving ? [colors.textLight, colors.textTertiary] : [colors.primaryDark, colors.primary]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={s.saveBtn}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <>
                <Feather name={isEdit ? 'save' : 'plus-circle'} size={18} color="#FFF" />
                <Text style={s.saveBtnText}>{isEdit ? 'Enregistrer' : 'Publier mon annonce'}</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background, gap: SPACING.md },
  loadingText: { fontFamily: FONTS.bodyMedium, fontSize: FONT_SIZE.base, color: colors.textSecondary },

  header: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.xl },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.base },
  backBtn: {
    width: 38, height: 38, borderRadius: RADIUS.lg,
    backgroundColor: 'rgba(255,255,255,0.10)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontFamily: FONTS.brand, fontSize: FONT_SIZE.xl, color: '#FFF', letterSpacing: -0.4 },

  scroll: { flex: 1 },

  sectionTitle: {
    fontFamily: FONTS.bodySemiBold, fontSize: FONT_SIZE.xs,
    color: colors.textSecondary, textTransform: 'uppercase',
    letterSpacing: 0.8, marginBottom: SPACING.sm,
    marginTop: SPACING.xl, marginHorizontal: SPACING.lg,
  },
  card: {
    backgroundColor: colors.white, borderRadius: RADIUS.xl,
    padding: SPACING.base, marginHorizontal: SPACING.lg,
    marginBottom: SPACING.sm, ...SHADOWS.md,
  },
  label: {
    fontFamily: FONTS.bodySemiBold, fontSize: FONT_SIZE.sm,
    color: colors.textSecondary, marginBottom: SPACING.sm,
  },
  input: {
    fontFamily: FONTS.body, fontSize: FONT_SIZE.base, color: colors.text,
    backgroundColor: colors.background, borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.base, paddingVertical: SPACING.md,
    borderWidth: 1, borderColor: colors.border,
  },
  textArea: { height: 120, textAlignVertical: 'top' },
  charCount: {
    fontFamily: FONTS.body, fontSize: FONT_SIZE.xs,
    color: colors.textLight, textAlign: 'right', marginTop: SPACING.xs,
  },

  // Services
  serviceRow: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.base,
    paddingVertical: SPACING.md, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  serviceRowActive: { borderBottomColor: colors.primarySoft },
  serviceIcon: {
    width: 40, height: 40, borderRadius: RADIUS.lg,
    backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center',
  },
  serviceIconActive: { backgroundColor: colors.primary },
  serviceInfo: { flex: 1 },
  serviceLabel: { fontFamily: FONTS.bodySemiBold, fontSize: FONT_SIZE.base, color: colors.text },
  serviceLabelActive: { color: colors.primaryDark },
  serviceDesc: { fontFamily: FONTS.body, fontSize: FONT_SIZE.xs, color: colors.textSecondary },
  checkbox: {
    width: 24, height: 24, borderRadius: 12,
    borderWidth: 2, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  checkboxActive: { backgroundColor: colors.primary, borderColor: colors.primary },

  // Prices
  priceRow: { flexDirection: 'row', gap: SPACING.base },
  priceField: { flex: 1 },

  // Animals
  animalGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  animalChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full, borderWidth: 1.5,
    borderColor: colors.border, backgroundColor: colors.background,
  },
  animalChipActive: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  animalEmoji: { fontSize: 16 },
  animalLabel: { fontFamily: FONTS.bodyMedium, fontSize: FONT_SIZE.sm, color: colors.text },
  animalLabelActive: { color: colors.primaryDark, fontWeight: '700' },

  // Days
  daysRow: { flexDirection: 'row', gap: SPACING.xs, flexWrap: 'wrap' },
  dayChip: {
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full, borderWidth: 1.5,
    borderColor: colors.border, backgroundColor: colors.background,
  },
  dayChipActive: { borderColor: colors.primary, backgroundColor: colors.primary },
  dayLabel: { fontFamily: FONTS.bodySemiBold, fontSize: FONT_SIZE.sm, color: colors.text },
  dayLabelActive: { color: '#FFF' },

  // Bottom bar
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: colors.white, paddingTop: SPACING.md,
    paddingHorizontal: SPACING.lg, borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.06)', ...SHADOWS.lg,
  },
  saveWrap: { borderRadius: RADIUS.xl, overflow: 'hidden' },
  saveBtn: {
    height: 54, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: SPACING.sm, borderRadius: RADIUS.xl,
  },
  saveBtnText: { fontFamily: FONTS.heading, fontSize: FONT_SIZE.md, color: '#FFF' },
});

export default PetSitterProfileScreen;
