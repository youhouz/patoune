// ---------------------------------------------------------------------------
// Patoune v2.0 - Register Screen (Multi-Step Wizard)
// 5 steps: Identite -> Role -> Localisation -> Profil gardien -> Confirmation
// Step 4 only shows if role is 'guardian' or 'both'
// ---------------------------------------------------------------------------

import React, { useReducer, useRef, useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  Animated,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';
import { useAuth } from '../../context/AuthContext';
import { COLORS, SPACING, RADIUS, SHADOWS, FONT_SIZE } from '../../utils/colors';
import { FONTS, TEXT_STYLES } from '../../utils/typography';
import Button from '../../components/Button';
import Input from '../../components/Input';
import Icon from '../../components/Icon';
import Card from '../../components/Card';


// ---------------------------------------------------------------------------
// State management
// ---------------------------------------------------------------------------
const initialState = {
  currentStep: 1,
  // Step 1 - Identity
  name: '',
  email: '',
  password: '',
  phone: '',
  // Step 2 - Role
  role: '',
  // Step 3 - Location
  address: {
    street: '',
    city: '',
    postalCode: '',
  },
  locationDetected: false,
  // Step 4 - Guardian profile
  guardianProfile: {
    bio: '',
    experience: '',
    acceptedAnimals: [],
    services: [],
    pricePerDay: '',
    pricePerHour: '',
  },
};

function formReducer(state, action) {
  switch (action.type) {
    case 'SET_FIELD':
      return { ...state, [action.field]: action.value };
    case 'SET_ADDRESS':
      return { ...state, address: { ...state.address, [action.field]: action.value } };
    case 'SET_GUARDIAN':
      return {
        ...state,
        guardianProfile: { ...state.guardianProfile, [action.field]: action.value },
      };
    case 'TOGGLE_ANIMAL': {
      const list = state.guardianProfile.acceptedAnimals;
      const updated = list.includes(action.value)
        ? list.filter((a) => a !== action.value)
        : [...list, action.value];
      return {
        ...state,
        guardianProfile: { ...state.guardianProfile, acceptedAnimals: updated },
      };
    }
    case 'TOGGLE_SERVICE': {
      const list = state.guardianProfile.services;
      const updated = list.includes(action.value)
        ? list.filter((s) => s !== action.value)
        : [...list, action.value];
      return {
        ...state,
        guardianProfile: { ...state.guardianProfile, services: updated },
      };
    }
    case 'NEXT_STEP':
      return { ...state, currentStep: state.currentStep + 1 };
    case 'PREV_STEP':
      return { ...state, currentStep: Math.max(1, state.currentStep - 1) };
    case 'SET_STEP':
      return { ...state, currentStep: action.step };
    default:
      return state;
  }
}


// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const ANIMAL_TYPES = [
  { key: 'chien', label: 'Chien', icon: 'heart' },
  { key: 'chat', label: 'Chat', icon: 'heart' },
  { key: 'rongeur', label: 'Rongeur', icon: 'heart' },
  { key: 'oiseau', label: 'Oiseau', icon: 'heart' },
  { key: 'reptile', label: 'Reptile', icon: 'heart' },
];

const SERVICE_TYPES = [
  { key: 'garde_domicile', label: 'Garde a domicile' },
  { key: 'garde_chez_sitter', label: 'Garde chez le gardien' },
  { key: 'promenade', label: 'Promenade' },
  { key: 'visite', label: 'Visite a domicile' },
  { key: 'toilettage', label: 'Toilettage' },
];


// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/** Progress bar at the top of each step */
const ProgressBar = ({ currentStep, totalSteps }) => {
  const progress = currentStep / totalSteps;
  const animWidth = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animWidth, {
      toValue: progress,
      duration: 400,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  const widthInterpolation = animWidth.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={progressStyles.container}>
      <View style={progressStyles.track}>
        <Animated.View
          style={[progressStyles.fill, { width: widthInterpolation }]}
        />
      </View>
      <Text style={progressStyles.label}>
        Etape {currentStep} sur {totalSteps}
      </Text>
    </View>
  );
};

const progressStyles = StyleSheet.create({
  container: {
    marginBottom: SPACING['2xl'],
  },
  track: {
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 2,
  },
  label: {
    fontFamily: FONTS.bodyMedium,
    fontSize: FONT_SIZE.xs,
    color: COLORS.textTertiary,
    marginTop: SPACING.sm,
    textAlign: 'right',
  },
});


/** Selectable chip used for animal types and services */
const SelectChip = ({ label, selected, onPress }) => (
  <TouchableOpacity
    style={[chipStyles.chip, selected && chipStyles.chipSelected]}
    onPress={() => {
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      onPress();
    }}
    activeOpacity={0.7}
  >
    {selected ? (
      <Icon name="check" size={14} color={COLORS.primary} />
    ) : null}
    <Text style={[chipStyles.label, selected && chipStyles.labelSelected]}>
      {label}
    </Text>
  </TouchableOpacity>
);

const chipStyles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.base,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.linen,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    gap: SPACING.xs,
    marginRight: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  chipSelected: {
    backgroundColor: COLORS.primarySoft,
    borderColor: COLORS.primary,
  },
  label: {
    fontFamily: FONTS.bodyMedium,
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
  },
  labelSelected: {
    color: COLORS.primaryDark,
    fontFamily: FONTS.bodySemiBold,
  },
});


/** Role selection card */
const RoleCard = ({ icon, title, description, selected, onPress }) => (
  <TouchableOpacity
    style={[roleStyles.card, selected && roleStyles.cardSelected]}
    onPress={() => {
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
      onPress();
    }}
    activeOpacity={0.8}
  >
    <View style={[roleStyles.iconBg, selected && roleStyles.iconBgSelected]}>
      <Icon name={icon} size={28} color={selected ? COLORS.primary : COLORS.pebble} />
    </View>
    <Text style={[roleStyles.title, selected && roleStyles.titleSelected]}>
      {title}
    </Text>
    <Text style={roleStyles.description}>{description}</Text>
    {selected ? (
      <View style={roleStyles.checkBadge}>
        <Icon name="check" size={14} color={COLORS.white} />
      </View>
    ) : null}
  </TouchableOpacity>
);

const roleStyles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    borderWidth: 2,
    borderColor: COLORS.border,
    padding: SPACING.xl,
    marginBottom: SPACING.base,
    alignItems: 'center',
    position: 'relative',
    ...SHADOWS.sm,
  },
  cardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primarySoft,
    ...SHADOWS.glow(COLORS.primary),
  },
  iconBg: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.linen,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  iconBgSelected: {
    backgroundColor: COLORS.white,
  },
  title: {
    fontFamily: FONTS.heading,
    fontSize: FONT_SIZE.lg,
    color: COLORS.charcoal,
    marginBottom: SPACING.xs,
  },
  titleSelected: {
    color: COLORS.primaryDark,
  },
  description: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZE.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  checkBadge: {
    position: 'absolute',
    top: SPACING.md,
    right: SPACING.md,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});


// ---------------------------------------------------------------------------
// Password strength helper
// ---------------------------------------------------------------------------
function getPasswordStrength(pw) {
  if (!pw) return { level: 0, label: '', color: COLORS.border };
  let score = 0;
  if (pw.length >= 6) score++;
  if (pw.length >= 10) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;

  if (score <= 1) return { level: 1, label: 'Faible', color: COLORS.error };
  if (score <= 3) return { level: 2, label: 'Moyen', color: COLORS.warning };
  return { level: 3, label: 'Fort', color: COLORS.success };
}


// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
const RegisterScreen = ({ navigation }) => {
  const { register } = useAuth();
  const [state, dispatch] = useReducer(formReducer, initialState);
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const scrollRef = useRef(null);

  // Fade animation for step transitions
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const animateStepTransition = useCallback(() => {
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 350,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  // Determine total steps based on role
  const needsGuardianStep = state.role === 'guardian' || state.role === 'both';
  const totalSteps = needsGuardianStep ? 5 : 4;

  // Map logical step to actual step number
  const getActualStep = (step) => {
    if (!needsGuardianStep && step >= 4) {
      // Skip step 4, so "confirmation" is at step 4 instead of 5
      return step;
    }
    return step;
  };

  const scrollToTop = () => {
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  };

  // ---- Step navigation ----
  const goNext = () => {
    // Validate current step
    if (state.currentStep === 1) {
      if (!state.name.trim()) {
        Alert.alert('Champ requis', 'Veuillez entrer votre nom');
        return;
      }
      if (!state.email.trim()) {
        Alert.alert('Champ requis', 'Veuillez entrer votre email');
        return;
      }
      if (!state.password || state.password.length < 6) {
        Alert.alert('Mot de passe', 'Le mot de passe doit contenir au moins 6 caracteres');
        return;
      }
    }

    if (state.currentStep === 2) {
      if (!state.role) {
        Alert.alert('Selection requise', 'Veuillez choisir votre profil');
        return;
      }
    }

    if (state.currentStep === 3) {
      if (!state.address.city.trim()) {
        Alert.alert('Localisation', 'Veuillez indiquer votre ville');
        return;
      }
    }

    // If on step 3 and doesn't need guardian step, jump to confirmation
    if (state.currentStep === 3 && !needsGuardianStep) {
      dispatch({ type: 'SET_STEP', step: totalSteps });
    } else {
      dispatch({ type: 'NEXT_STEP' });
    }

    animateStepTransition();
    scrollToTop();
  };

  const goBack = () => {
    if (state.currentStep === 1) {
      navigation.goBack();
      return;
    }

    // If on confirmation step and no guardian step, go back to step 3
    if (state.currentStep === totalSteps && !needsGuardianStep && totalSteps === 4) {
      dispatch({ type: 'SET_STEP', step: 3 });
    } else {
      dispatch({ type: 'PREV_STEP' });
    }

    animateStepTransition();
    scrollToTop();
  };

  // ---- Location detection ----
  const detectLocation = async () => {
    setLocationLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission refusee',
          'Activez la localisation pour detecter automatiquement votre position.'
        );
        setLocationLoading(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const [geocode] = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      if (geocode) {
        dispatch({
          type: 'SET_ADDRESS',
          field: 'street',
          value: geocode.street || geocode.name || '',
        });
        dispatch({
          type: 'SET_ADDRESS',
          field: 'city',
          value: geocode.city || geocode.subregion || '',
        });
        dispatch({
          type: 'SET_ADDRESS',
          field: 'postalCode',
          value: geocode.postalCode || '',
        });
        dispatch({ type: 'SET_FIELD', field: 'locationDetected', value: true });
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de detecter votre position. Entrez-la manuellement.');
    }
    setLocationLoading(false);
  };

  // ---- Final registration ----
  const handleRegister = async () => {
    setLoading(true);
    const result = await register(
      state.name.trim(),
      state.email.trim().toLowerCase(),
      state.password,
      state.phone.trim(),
      state.role,
      state.address,
      needsGuardianStep ? state.guardianProfile : null
    );
    setLoading(false);

    if (!result.success) {
      Alert.alert('Erreur', result.error);
    }
  };

  // ---- Password strength ----
  const strength = getPasswordStrength(state.password);


  // =========================================================================
  // STEP 1 - Identity
  // =========================================================================
  const renderStep1 = () => (
    <View>
      <Text style={styles.stepTitle}>Votre identite</Text>
      <Text style={styles.stepSubtitle}>
        Commencez par creer votre compte Patoune
      </Text>

      <Input
        label="Nom complet"
        placeholder="Prenom et nom"
        value={state.name}
        onChangeText={(v) => dispatch({ type: 'SET_FIELD', field: 'name', value: v })}
        icon="user"
        autoCapitalize="words"
      />

      <Input
        label="Email"
        placeholder="votre@email.com"
        value={state.email}
        onChangeText={(v) => dispatch({ type: 'SET_FIELD', field: 'email', value: v })}
        icon="mail"
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
      />

      <Input
        label="Mot de passe"
        placeholder="Minimum 6 caracteres"
        value={state.password}
        onChangeText={(v) => dispatch({ type: 'SET_FIELD', field: 'password', value: v })}
        icon="lock"
        secureTextEntry
      />

      {/* Password strength indicator */}
      {state.password.length > 0 ? (
        <View style={styles.strengthContainer}>
          <View style={styles.strengthTrack}>
            <View
              style={[
                styles.strengthFill,
                {
                  width: `${(strength.level / 3) * 100}%`,
                  backgroundColor: strength.color,
                },
              ]}
            />
          </View>
          <Text style={[styles.strengthLabel, { color: strength.color }]}>
            {strength.label}
          </Text>
        </View>
      ) : null}

      <Input
        label="Telephone (optionnel)"
        placeholder="06 12 34 56 78"
        value={state.phone}
        onChangeText={(v) => dispatch({ type: 'SET_FIELD', field: 'phone', value: v })}
        icon="phone"
        keyboardType="phone-pad"
      />
    </View>
  );


  // =========================================================================
  // STEP 2 - Role selection
  // =========================================================================
  const renderStep2 = () => (
    <View>
      <Text style={styles.stepTitle}>Quel est votre profil ?</Text>
      <Text style={styles.stepSubtitle}>
        Choisissez comment vous souhaitez utiliser Patoune
      </Text>

      <RoleCard
        icon="heart"
        title="Proprietaire"
        description="Je cherche les meilleurs soins pour mes animaux"
        selected={state.role === 'owner'}
        onPress={() => dispatch({ type: 'SET_FIELD', field: 'role', value: 'owner' })}
      />

      <RoleCard
        icon="shield"
        title="Gardien"
        description="Je propose mes services de garde d'animaux"
        selected={state.role === 'guardian'}
        onPress={() => dispatch({ type: 'SET_FIELD', field: 'role', value: 'guardian' })}
      />

      {/* Les deux option */}
      <TouchableOpacity
        style={[styles.bothOption, state.role === 'both' && styles.bothOptionSelected]}
        onPress={() => {
          if (Platform.OS !== 'web') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }
          dispatch({ type: 'SET_FIELD', field: 'role', value: 'both' });
        }}
        activeOpacity={0.7}
      >
        <Icon
          name="users"
          size={18}
          color={state.role === 'both' ? COLORS.primary : COLORS.textTertiary}
        />
        <Text
          style={[
            styles.bothOptionText,
            state.role === 'both' && styles.bothOptionTextActive,
          ]}
        >
          Les deux
        </Text>
        {state.role === 'both' ? (
          <Icon name="check-circle" size={18} color={COLORS.primary} />
        ) : null}
      </TouchableOpacity>
    </View>
  );


  // =========================================================================
  // STEP 3 - Location
  // =========================================================================
  const renderStep3 = () => (
    <View>
      <Text style={styles.stepTitle}>Ou etes-vous ?</Text>
      <Text style={styles.stepSubtitle}>
        Votre localisation nous aide a trouver des services pres de chez vous
      </Text>

      {/* Geolocation button */}
      <TouchableOpacity
        style={styles.locationButton}
        onPress={detectLocation}
        activeOpacity={0.7}
        disabled={locationLoading}
      >
        {locationLoading ? (
          <ActivityIndicator size="small" color={COLORS.primary} />
        ) : (
          <View style={styles.locationIconBg}>
            <Icon name="map-pin" size={22} color={COLORS.primary} />
          </View>
        )}
        <View style={styles.locationTextWrap}>
          <Text style={styles.locationTitle}>Utiliser ma position</Text>
          <Text style={styles.locationHint}>
            Detection automatique par GPS
          </Text>
        </View>
        <Icon name="chevron-right" size={20} color={COLORS.textTertiary} />
      </TouchableOpacity>

      {/* Detected city confirmation */}
      {state.locationDetected && state.address.city ? (
        <View style={styles.detectedCity}>
          <Icon name="check-circle" size={16} color={COLORS.success} />
          <Text style={styles.detectedCityText}>
            Position detectee : {state.address.city}
            {state.address.postalCode ? ` (${state.address.postalCode})` : ''}
          </Text>
        </View>
      ) : null}

      {/* Manual divider */}
      <View style={styles.divider}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>ou saisissez manuellement</Text>
        <View style={styles.dividerLine} />
      </View>

      <Input
        label="Rue"
        placeholder="12 rue des Lilas"
        value={state.address.street}
        onChangeText={(v) => dispatch({ type: 'SET_ADDRESS', field: 'street', value: v })}
        icon="home"
        autoCapitalize="words"
      />

      <Input
        label="Ville"
        placeholder="Paris"
        value={state.address.city}
        onChangeText={(v) => dispatch({ type: 'SET_ADDRESS', field: 'city', value: v })}
        icon="map-pin"
        autoCapitalize="words"
      />

      <Input
        label="Code postal"
        placeholder="75001"
        value={state.address.postalCode}
        onChangeText={(v) => dispatch({ type: 'SET_ADDRESS', field: 'postalCode', value: v })}
        icon="hash"
        keyboardType="number-pad"
        maxLength={5}
      />
    </View>
  );


  // =========================================================================
  // STEP 4 - Guardian profile (conditional)
  // =========================================================================
  const renderStep4 = () => (
    <View>
      <Text style={styles.stepTitle}>Votre profil gardien</Text>
      <Text style={styles.stepSubtitle}>
        Completez votre profil pour recevoir des demandes
      </Text>

      <Input
        label="Bio"
        placeholder="Presentez-vous en quelques mots..."
        value={state.guardianProfile.bio}
        onChangeText={(v) => dispatch({ type: 'SET_GUARDIAN', field: 'bio', value: v })}
        icon="edit-3"
        multiline
        autoCapitalize="sentences"
      />

      <Input
        label="Annees d'experience"
        placeholder="2"
        value={state.guardianProfile.experience}
        onChangeText={(v) => dispatch({ type: 'SET_GUARDIAN', field: 'experience', value: v })}
        icon="award"
        keyboardType="number-pad"
        maxLength={2}
      />

      {/* Accepted animals */}
      <Text style={styles.sectionLabel}>Animaux acceptes</Text>
      <View style={styles.chipContainer}>
        {ANIMAL_TYPES.map((animal) => (
          <SelectChip
            key={animal.key}
            label={animal.label}
            selected={state.guardianProfile.acceptedAnimals.includes(animal.key)}
            onPress={() => dispatch({ type: 'TOGGLE_ANIMAL', value: animal.key })}
          />
        ))}
      </View>

      {/* Services */}
      <Text style={styles.sectionLabel}>Services proposes</Text>
      <View style={styles.chipContainer}>
        {SERVICE_TYPES.map((service) => (
          <SelectChip
            key={service.key}
            label={service.label}
            selected={state.guardianProfile.services.includes(service.key)}
            onPress={() => dispatch({ type: 'TOGGLE_SERVICE', value: service.key })}
          />
        ))}
      </View>

      {/* Pricing */}
      <View style={styles.priceRow}>
        <View style={styles.priceField}>
          <Input
            label="Prix / jour"
            placeholder="25"
            value={state.guardianProfile.pricePerDay}
            onChangeText={(v) =>
              dispatch({ type: 'SET_GUARDIAN', field: 'pricePerDay', value: v })
            }
            icon="tag"
            keyboardType="number-pad"
          />
        </View>
        <View style={styles.priceField}>
          <Input
            label="Prix / heure"
            placeholder="8"
            value={state.guardianProfile.pricePerHour}
            onChangeText={(v) =>
              dispatch({ type: 'SET_GUARDIAN', field: 'pricePerHour', value: v })
            }
            icon="clock"
            keyboardType="number-pad"
          />
        </View>
      </View>
    </View>
  );


  // =========================================================================
  // STEP 5 (or 4 without guardian) - Confirmation
  // =========================================================================
  const renderConfirmation = () => (
    <View style={styles.confirmationContainer}>
      <View style={styles.successCircle}>
        <Icon name="check" size={40} color={COLORS.white} />
      </View>

      <Text style={styles.confirmTitle}>Bienvenue sur Patoune !</Text>
      <Text style={styles.confirmSubtitle}>
        Tout est pret. Voici un resume de votre profil :
      </Text>

      {/* Summary card */}
      <Card variant="outlined" style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <Icon name="user" size={16} color={COLORS.textTertiary} />
          <Text style={styles.summaryText}>{state.name}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Icon name="mail" size={16} color={COLORS.textTertiary} />
          <Text style={styles.summaryText}>{state.email}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Icon name="map-pin" size={16} color={COLORS.textTertiary} />
          <Text style={styles.summaryText}>
            {state.address.city || 'Non renseigne'}
            {state.address.postalCode ? ` (${state.address.postalCode})` : ''}
          </Text>
        </View>
        <View style={styles.summaryRow}>
          <Icon name="shield" size={16} color={COLORS.textTertiary} />
          <Text style={styles.summaryText}>
            {state.role === 'owner'
              ? 'Proprietaire'
              : state.role === 'guardian'
              ? 'Gardien'
              : 'Proprietaire & Gardien'}
          </Text>
        </View>
        {needsGuardianStep && state.guardianProfile.acceptedAnimals.length > 0 ? (
          <View style={styles.summaryRow}>
            <Icon name="heart" size={16} color={COLORS.textTertiary} />
            <Text style={styles.summaryText}>
              {state.guardianProfile.acceptedAnimals
                .map((a) => a.charAt(0).toUpperCase() + a.slice(1))
                .join(', ')}
            </Text>
          </View>
        ) : null}
      </Card>
    </View>
  );


  // =========================================================================
  // Determine which step to render
  // =========================================================================
  const isConfirmationStep = state.currentStep === totalSteps;

  const renderCurrentStep = () => {
    if (isConfirmationStep) return renderConfirmation();

    switch (state.currentStep) {
      case 1:
        return renderStep1();
      case 2:
        return renderStep2();
      case 3:
        return renderStep3();
      case 4:
        return renderStep4();
      default:
        return null;
    }
  };


  // =========================================================================
  // Render
  // =========================================================================
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.cream} />

      {/* Top bar: back button */}
      <View style={styles.topBar}>
        {state.currentStep > 1 ? (
          <TouchableOpacity
            style={styles.backButton}
            onPress={goBack}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            activeOpacity={0.7}
          >
            <Icon name="arrow-left" size={22} color={COLORS.charcoal} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            activeOpacity={0.7}
          >
            <Icon name="arrow-left" size={22} color={COLORS.charcoal} />
          </TouchableOpacity>
        )}
        <View style={styles.topBarBrand}>
          <Ionicons name="paw" size={20} color={COLORS.primary} />
          <Text style={styles.topBarTitle}>patoune</Text>
        </View>
        <View style={styles.backButton} />
      </View>

      {/* Progress bar */}
      <View style={styles.progressWrap}>
        <ProgressBar currentStep={state.currentStep} totalSteps={totalSteps} />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={{ opacity: fadeAnim }}>
            {renderCurrentStep()}
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Bottom action button */}
      <View style={styles.bottomBar}>
        {isConfirmationStep ? (
          <Button
            title="Commencer"
            onPress={handleRegister}
            loading={loading}
            variant="primary"
            size="lg"
            icon="arrow-right"
          />
        ) : (
          <Button
            title="Suivant"
            onPress={goNext}
            variant="primary"
            size="lg"
            icon="arrow-right"
          />
        )}
      </View>
    </View>
  );
};


// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.cream,
  },
  flex: {
    flex: 1,
  },

  // ---- Top bar ----
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 58 : 44,
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  topBarTitle: {
    fontFamily: FONTS.brand,
    fontSize: 18,
    color: COLORS.charcoal,
    letterSpacing: -0.3,
  },

  // ---- Progress ----
  progressWrap: {
    paddingHorizontal: SPACING.xl,
  },

  // ---- Scroll ----
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING['3xl'],
  },

  // ---- Step titles ----
  stepTitle: {
    fontFamily: FONTS.heading,
    fontSize: FONT_SIZE['2xl'],
    color: COLORS.charcoal,
    marginBottom: SPACING.xs,
    letterSpacing: -0.2,
  },
  stepSubtitle: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZE.base,
    color: COLORS.textSecondary,
    marginBottom: SPACING['2xl'],
    lineHeight: 22,
  },

  // ---- Password strength ----
  strengthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginTop: -SPACING.sm,
    marginBottom: SPACING.base,
  },
  strengthTrack: {
    flex: 1,
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  strengthFill: {
    height: '100%',
    borderRadius: 2,
  },
  strengthLabel: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZE.xs,
  },

  // ---- Role: "Les deux" option ----
  bothOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.base,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.linen,
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
  bothOptionSelected: {
    backgroundColor: COLORS.primarySoft,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },
  bothOptionText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: FONT_SIZE.base,
    color: COLORS.textTertiary,
  },
  bothOptionTextActive: {
    color: COLORS.primaryDark,
    fontFamily: FONTS.bodySemiBold,
  },

  // ---- Location ----
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.base,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.lg,
    ...SHADOWS.sm,
  },
  locationIconBg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationTextWrap: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  locationTitle: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZE.base,
    color: COLORS.charcoal,
  },
  locationHint: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZE.sm,
    color: COLORS.textTertiary,
    marginTop: 2,
  },
  detectedCity: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.successSoft,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.base,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.lg,
    gap: SPACING.sm,
  },
  detectedCityText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: FONT_SIZE.sm,
    color: COLORS.secondaryDark,
  },

  // ---- Divider ----
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: SPACING.xl,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  dividerText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: FONT_SIZE.xs,
    color: COLORS.textTertiary,
    marginHorizontal: SPACING.md,
  },

  // ---- Section labels (step 4) ----
  sectionLabel: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZE.base,
    color: COLORS.charcoal,
    marginBottom: SPACING.md,
    marginTop: SPACING.sm,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: SPACING.lg,
  },

  // ---- Price row ----
  priceRow: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  priceField: {
    flex: 1,
  },

  // ---- Confirmation ----
  confirmationContainer: {
    alignItems: 'center',
    paddingTop: SPACING['3xl'],
  },
  successCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: COLORS.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xl,
    ...SHADOWS.glow(COLORS.secondary),
  },
  confirmTitle: {
    fontFamily: FONTS.brand,
    fontSize: FONT_SIZE['3xl'],
    color: COLORS.charcoal,
    textAlign: 'center',
    marginBottom: SPACING.sm,
    letterSpacing: -0.3,
  },
  confirmSubtitle: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZE.base,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING['2xl'],
    lineHeight: 22,
  },
  summaryCard: {
    width: '100%',
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    gap: SPACING.md,
  },
  summaryText: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZE.base,
    color: COLORS.textSecondary,
    flex: 1,
  },

  // ---- Bottom bar ----
  bottomBar: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.md,
    paddingBottom: Platform.OS === 'ios' ? SPACING['3xl'] : SPACING.xl,
    backgroundColor: COLORS.cream,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
});


export default RegisterScreen;
