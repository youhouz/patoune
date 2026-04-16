// ---------------------------------------------------------------------------
// Declarer un animal perdu.
// ---------------------------------------------------------------------------

import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity,
  ActivityIndicator, Image, Platform, KeyboardAvoidingView,
} from 'react-native';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { createLostPetAPI } from '../../api/lostPets';
import { getMyPetsAPI } from '../../api/pets';
import ScreenHeader from '../../components/ScreenHeader';
import { useAuth } from '../../context/AuthContext';
import { showAlert } from '../../utils/alert';
import colors, { SPACING, RADIUS } from '../../utils/colors';

const SPECIES = ['chien', 'chat', 'rongeur', 'oiseau', 'reptile', 'poisson', 'autre'];

const CreateLostPetScreen = () => {
  const nav = useNavigation();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const [myPets, setMyPets] = useState([]);
  const [selectedPet, setSelectedPet] = useState(null);

  const [name, setName] = useState('');
  const [species, setSpecies] = useState('chien');
  const [breed, setBreed] = useState('');
  const [color, setColor] = useState('');
  const [microchip, setMicrochip] = useState('');
  const [distinctiveSigns, setDistinctiveSigns] = useState('');
  const [lastSeenAddress, setLastSeenAddress] = useState('');
  const [circumstances, setCircumstances] = useState('');
  const [contactName, setContactName] = useState(user?.name || '');
  const [contactPhone, setContactPhone] = useState(user?.phone || '');
  const [reward, setReward] = useState('');
  const [photos, setPhotos] = useState([]);
  const [coords, setCoords] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await getMyPetsAPI();
        setMyPets(res.data?.pets || res.data || []);
      } catch (_) {}
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const pos = await Location.getCurrentPositionAsync({});
          setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        }
      } catch (_) {}
    })();
  }, []);

  const pickPet = (pet) => {
    setSelectedPet(pet);
    setName(pet.name || '');
    setSpecies(pet.species || 'chien');
    setBreed(pet.breed || '');
    setMicrochip(pet.microchip || '');
  };

  const pickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      showAlert('Permission requise', 'Autorisez l\'acces a vos photos.');
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'], quality: 0.7, base64: true,
    });
    if (res.canceled || !res.assets?.[0]) return;
    const asset = res.assets[0];
    const uri = asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : asset.uri;
    setPhotos((p) => [...p, uri].slice(0, 4));
  };

  const submit = async () => {
    if (!name.trim() || !contactName.trim() || !contactPhone.trim()) {
      showAlert('Champs manquants', 'Nom, contact et telephone sont obligatoires.');
      return;
    }
    if (!coords) {
      showAlert('Position requise', 'Activez la geolocalisation pour declarer une perte.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await createLostPetAPI({
        pet: selectedPet?._id || null,
        name: name.trim(), species, breed: breed.trim(), color: color.trim(),
        microchip: microchip.trim(), distinctiveSigns: distinctiveSigns.trim(),
        photos, lat: coords.lat, lng: coords.lng,
        lastSeenAddress: lastSeenAddress.trim(), circumstances: circumstances.trim(),
        contactName: contactName.trim(), contactPhone: contactPhone.trim(),
        contactEmail: user?.email || '',
        reward: parseFloat(reward) || 0,
      });
      const id = res.data?.lostPet?._id;
      showAlert(
        'Alerte publiee',
        'Les utilisateurs a proximite peuvent deja voir votre signalement. Partagez le lien pour maximiser les chances.',
        [{ text: 'OK', onPress: () => nav.replace('LostPetDetail', { id }) }]
      );
    } catch (err) {
      const msg = err.response?.data?.error || 'Impossible de publier l\'alerte.';
      showAlert('Erreur', msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={s.container}>
        <ScreenHeader
          title="Declarer une perte"
          subtitle="Alertez la communaute en 1 minute"
          onBack={() => nav.goBack()}
          variant="light"
        />
        <ScrollView
          contentContainerStyle={[s.scroll, { paddingBottom: insets.bottom + 120 }]}
          keyboardShouldPersistTaps="handled"
        >
          {myPets.length > 0 ? (
            <View style={s.block}>
              <Text style={s.blockTitle}>Animal concerne</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                {myPets.map(p => (
                  <TouchableOpacity
                    key={p._id}
                    onPress={() => pickPet(p)}
                    style={[s.petChip, selectedPet?._id === p._id && s.petChipActive]}
                  >
                    <Feather name="heart" size={14} color={selectedPet?._id === p._id ? '#fff' : colors.primary} />
                    <Text style={[s.petChipText, selectedPet?._id === p._id && { color: '#fff' }]}>{p.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          ) : null}

          <View style={s.block}>
            <Text style={s.blockTitle}>Informations animal</Text>
            <Label text="Prenom *" />
            <TextInput style={s.input} value={name} onChangeText={setName} placeholder="Ex: Milou" />

            <Label text="Espece *" />
            <View style={s.speciesRow}>
              {SPECIES.map(sp => (
                <TouchableOpacity
                  key={sp}
                  style={[s.speciesChip, species === sp && s.speciesChipActive]}
                  onPress={() => setSpecies(sp)}
                >
                  <Text style={[s.speciesText, species === sp && { color: '#fff' }]}>{sp}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Label text="Race" />
            <TextInput style={s.input} value={breed} onChangeText={setBreed} placeholder="Ex: Jack Russell" />

            <Label text="Couleur / robe" />
            <TextInput style={s.input} value={color} onChangeText={setColor} placeholder="Ex: Blanc taches noires" />

            <Label text="Puce electronique" />
            <TextInput style={s.input} value={microchip} onChangeText={setMicrochip} keyboardType="numeric" placeholder="15 chiffres (si connu)" />

            <Label text="Signes distinctifs" />
            <TextInput
              style={[s.input, s.inputMulti]}
              value={distinctiveSigns}
              onChangeText={setDistinctiveSigns}
              multiline
              placeholder="Collier rouge, tatouage, boiterie..."
            />
          </View>

          <View style={s.block}>
            <Text style={s.blockTitle}>Photos ({photos.length}/4)</Text>
            <View style={s.photosRow}>
              {photos.map((p, i) => (
                <View key={i} style={s.photoItem}>
                  <Image source={{ uri: p }} style={s.photoImg} />
                  <TouchableOpacity
                    style={s.photoRemove}
                    onPress={() => setPhotos(photos.filter((_, idx) => idx !== i))}
                  >
                    <Feather name="x" size={14} color="#fff" />
                  </TouchableOpacity>
                </View>
              ))}
              {photos.length < 4 ? (
                <TouchableOpacity style={s.photoAdd} onPress={pickPhoto}>
                  <Feather name="plus" size={24} color={colors.primary} />
                </TouchableOpacity>
              ) : null}
            </View>
          </View>

          <View style={s.block}>
            <Text style={s.blockTitle}>Ou et quand</Text>
            <Label text="Dernier lieu vu" />
            <TextInput style={s.input} value={lastSeenAddress} onChangeText={setLastSeenAddress} placeholder="Rue, ville..." />
            {coords ? (
              <Text style={s.geoOk}>
                <Feather name="map-pin" size={12} /> Position GPS capturee automatiquement
              </Text>
            ) : (
              <Text style={s.geoKo}>GPS non disponible — activer la localisation</Text>
            )}

            <Label text="Circonstances" />
            <TextInput
              style={[s.input, s.inputMulti]}
              value={circumstances}
              onChangeText={setCircumstances}
              multiline
              placeholder="Comment a-t-il disparu ?"
            />
          </View>

          <View style={s.block}>
            <Text style={s.blockTitle}>Contact</Text>
            <Label text="Nom *" />
            <TextInput style={s.input} value={contactName} onChangeText={setContactName} />
            <Label text="Telephone *" />
            <TextInput style={s.input} value={contactPhone} onChangeText={setContactPhone} keyboardType="phone-pad" />
            <Label text="Recompense (EUR, facultatif)" />
            <TextInput style={s.input} value={reward} onChangeText={setReward} keyboardType="numeric" placeholder="0" />
          </View>

          <TouchableOpacity
            style={[s.cta, submitting && s.ctaDisabled]}
            onPress={submit}
            disabled={submitting}
            activeOpacity={0.85}
          >
            {submitting
              ? <ActivityIndicator color="#fff" />
              : (
                <>
                  <Feather name="alert-triangle" size={18} color="#fff" />
                  <Text style={s.ctaText}>Publier l'alerte</Text>
                </>
              )
            }
          </TouchableOpacity>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
};

const Label = ({ text }) => <Text style={s.label}>{text}</Text>;

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  scroll: { padding: SPACING.base },
  block: {
    backgroundColor: colors.white,
    borderRadius: RADIUS.md,
    padding: SPACING.base,
    marginBottom: SPACING.base,
    borderWidth: 1, borderColor: colors.borderLight,
  },
  blockTitle: {
    fontSize: 15, fontWeight: '700', color: colors.charcoal,
    marginBottom: SPACING.sm,
  },
  label: { fontSize: 12, color: colors.stone, marginTop: 10, marginBottom: 4 },
  input: {
    backgroundColor: colors.linen,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
    fontSize: 14,
    color: colors.charcoal,
  },
  inputMulti: { minHeight: 70, textAlignVertical: 'top' },

  petChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999,
    backgroundColor: colors.primarySoft,
    borderWidth: 1, borderColor: colors.primarySoft,
  },
  petChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  petChipText: { color: colors.primaryDark, fontWeight: '600' },

  speciesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  speciesChip: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999,
    backgroundColor: colors.linen,
  },
  speciesChipActive: { backgroundColor: colors.primary },
  speciesText: { color: colors.stone, fontSize: 13, textTransform: 'capitalize' },

  photosRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  photoItem: { position: 'relative' },
  photoImg: { width: 70, height: 70, borderRadius: 10 },
  photoRemove: {
    position: 'absolute', top: -6, right: -6,
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: colors.error,
    alignItems: 'center', justifyContent: 'center',
  },
  photoAdd: {
    width: 70, height: 70, borderRadius: 10,
    borderWidth: 2, borderStyle: 'dashed', borderColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },

  geoOk: { color: colors.primary, fontSize: 12, marginTop: 6 },
  geoKo: { color: colors.error, fontSize: 12, marginTop: 6 },

  cta: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.primary,
    height: 54, borderRadius: 27, gap: 8,
    marginTop: SPACING.base,
  },
  ctaDisabled: { opacity: 0.6 },
  ctaText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});

export default CreateLostPetScreen;
