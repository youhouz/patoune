import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Alert, StatusBar,
  Animated, Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/Button';
const colors = require('../../utils/colors');
const { RADIUS, SHADOWS } = require('../../utils/colors');

const { width } = Dimensions.get('window');

const STEPS = [
  { title: 'Tes infos', subtitle: 'Dis-nous qui tu es' },
  { title: 'Ton adresse', subtitle: 'Pour trouver des services pres de chez toi' },
  { title: 'Ton role', subtitle: 'Comment utilises-tu Patoune ?' },
  { title: 'Bienvenue !', subtitle: 'Tout est pret' },
];

const ROLES = [
  { value: 'user', label: 'Proprietaire', icon: '🐶', desc: 'Je cherche des services pour mon animal' },
  { value: 'guardian', label: 'Gardien', icon: '🏠', desc: 'Je propose des services de garde' },
  { value: 'both', label: 'Les deux', icon: '🤝', desc: 'Proprietaire et gardien' },
];

const InputField = ({ label, icon, value, onChangeText, placeholder, focusedField, fieldName, setFocusedField, ...props }) => (
  <View style={styles.fieldGroup}>
    <Text style={styles.label}>{label}</Text>
    <View style={[styles.inputWrapper, focusedField === fieldName && styles.inputFocused]}>
      <Text style={styles.inputIcon}>{icon}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textLight}
        onFocus={() => setFocusedField(fieldName)}
        onBlur={() => setFocusedField(null)}
        {...props}
      />
    </View>
  </View>
);

const RegisterScreen = ({ navigation }) => {
  const { register } = useAuth();
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [role, setRole] = useState('user');
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const slideAnim = useRef(new Animated.Value(0)).current;

  const animateStep = (nextStep) => {
    const direction = nextStep > step ? 1 : -1;
    Animated.sequence([
      Animated.timing(slideAnim, { toValue: -direction * 30, duration: 120, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 0, useNativeDriver: true }),
    ]).start(() => {
      setStep(nextStep);
      Animated.timing(slideAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start();
    });
  };

  const validateStep = () => {
    switch (step) {
      case 0:
        if (!name || !email || !password || !confirmPassword) {
          Alert.alert('Champs manquants', 'Remplis tous les champs obligatoires');
          return false;
        }
        if (password !== confirmPassword) {
          Alert.alert('Oups !', 'Les mots de passe ne correspondent pas');
          return false;
        }
        if (password.length < 6) {
          Alert.alert('Mot de passe trop court', 'Minimum 6 caracteres requis');
          return false;
        }
        if (!/^\S+@\S+\.\S+$/.test(email)) {
          Alert.alert('Email invalide', 'Verifie ton adresse email');
          return false;
        }
        return true;
      case 1:
        // City/postal code are optional
        return true;
      case 2:
        return true;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (!validateStep()) return;
    if (step < 3) {
      animateStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 0) {
      animateStep(step - 1);
    } else {
      navigation.goBack();
    }
  };

  const handleCommencer = async () => {
    // Register the user — on success, AuthContext sets user
    // and AppNavigator auto-switches to the main app
    setLoading(true);
    const address = (city || postalCode) ? {
      city: city.trim(),
      postalCode: postalCode.trim(),
      country: 'France',
    } : undefined;

    const result = await register(
      name.trim(),
      email.trim().toLowerCase(),
      password,
      phone,
      role,
      address
    );
    setLoading(false);
    if (!result.success) {
      Alert.alert('Erreur', result.error);
    }
    // On success, AuthContext sets user → AppNavigator shows TabNavigator
  };

  const renderStep0 = () => (
    <>
      <InputField
        label="Nom complet" icon="👤" fieldName="name"
        value={name} onChangeText={setName} placeholder="Ton prenom et nom"
        focusedField={focusedField} setFocusedField={setFocusedField}
        autoCapitalize="words"
      />
      <InputField
        label="Email" icon="📧" fieldName="email"
        value={email} onChangeText={setEmail} placeholder="ton@email.com"
        focusedField={focusedField} setFocusedField={setFocusedField}
        keyboardType="email-address" autoCapitalize="none"
      />
      <InputField
        label="Telephone (optionnel)" icon="📱" fieldName="phone"
        value={phone} onChangeText={setPhone} placeholder="06 12 34 56 78"
        focusedField={focusedField} setFocusedField={setFocusedField}
        keyboardType="phone-pad"
      />
      <InputField
        label="Mot de passe" icon="🔒" fieldName="password"
        value={password} onChangeText={setPassword} placeholder="Minimum 6 caracteres"
        focusedField={focusedField} setFocusedField={setFocusedField}
        secureTextEntry
      />
      <InputField
        label="Confirmer" icon="🔐" fieldName="confirm"
        value={confirmPassword} onChangeText={setConfirmPassword} placeholder="Retape ton mot de passe"
        focusedField={focusedField} setFocusedField={setFocusedField}
        secureTextEntry
      />
      {password.length > 0 && (
        <View style={styles.strengthRow}>
          <View style={styles.strengthBar}>
            <View style={[
              styles.strengthFill,
              {
                width: password.length < 6 ? '33%' : password.length < 10 ? '66%' : '100%',
                backgroundColor: password.length < 6 ? colors.error : password.length < 10 ? colors.warning : colors.success,
              }
            ]} />
          </View>
          <Text style={[styles.strengthText, {
            color: password.length < 6 ? colors.error : password.length < 10 ? colors.warning : colors.success
          }]}>
            {password.length < 6 ? 'Faible' : password.length < 10 ? 'Moyen' : 'Fort'}
          </Text>
        </View>
      )}
    </>
  );

  const renderStep1 = () => (
    <>
      <InputField
        label="Ville" icon="📍" fieldName="city"
        value={city} onChangeText={setCity} placeholder="Ex: Asnieres-sur-Seine"
        focusedField={focusedField} setFocusedField={setFocusedField}
        autoCapitalize="words"
      />
      <InputField
        label="Code postal" icon="🏠" fieldName="postalCode"
        value={postalCode} onChangeText={setPostalCode} placeholder="Ex: 92600"
        focusedField={focusedField} setFocusedField={setFocusedField}
        keyboardType="number-pad" maxLength={5}
      />
      <View style={styles.optionalNote}>
        <Text style={styles.optionalText}>
          Ces informations sont optionnelles mais permettent de trouver des gardiens pres de chez toi.
        </Text>
      </View>
    </>
  );

  const renderStep2 = () => (
    <View style={styles.rolesContainer}>
      {ROLES.map((r) => (
        <TouchableOpacity
          key={r.value}
          style={[styles.roleCard, role === r.value && styles.roleCardActive]}
          onPress={() => setRole(r.value)}
          activeOpacity={0.7}
        >
          <View style={styles.roleCardInner}>
            <Text style={styles.roleIcon}>{r.icon}</Text>
            <View style={styles.roleTextWrap}>
              <Text style={[styles.roleLabel, role === r.value && styles.roleLabelActive]}>{r.label}</Text>
              <Text style={styles.roleDesc}>{r.desc}</Text>
            </View>
            <View style={[styles.radioOuter, role === r.value && styles.radioOuterActive]}>
              {role === r.value && <View style={styles.radioInner} />}
            </View>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.summaryContainer}>
      <View style={styles.checkCircle}>
        <Text style={styles.checkIcon}>✓</Text>
      </View>
      <Text style={styles.welcomeTitle}>Bienvenue sur Patoune !</Text>
      <Text style={styles.welcomeSub}>Tout est pret. Voici un resume de votre profil :</Text>

      <View style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryIcon}>👤</Text>
          <Text style={styles.summaryValue}>{name}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryIcon}>📧</Text>
          <Text style={styles.summaryValue}>{email}</Text>
        </View>
        {(city || postalCode) ? (
          <View style={styles.summaryRow}>
            <Text style={styles.summaryIcon}>📍</Text>
            <Text style={styles.summaryValue}>
              {city}{city && postalCode ? ' ' : ''}{postalCode ? `(${postalCode})` : ''}
            </Text>
          </View>
        ) : null}
        <View style={styles.summaryRow}>
          <Text style={styles.summaryIcon}>🏷️</Text>
          <Text style={styles.summaryValue}>{ROLES.find(r => r.value === role)?.label}</Text>
        </View>
      </View>
    </View>
  );

  const stepContent = [renderStep0, renderStep1, renderStep2, renderStep3];
  const isLastStep = step === 3;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <LinearGradient
        colors={['#FF6B35', '#FF8F65', '#FFB088']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <TouchableOpacity
          onPress={handleBack}
          style={styles.backBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.backIcon}>{step === 3 ? '' : '←'}</Text>
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>
            {step === 3 ? '' : STEPS[step].title}
          </Text>
          <Text style={styles.headerSub}>
            {step === 3 ? '' : STEPS[step].subtitle}
          </Text>
        </View>
        <View style={styles.headerCurve} />
      </LinearGradient>

      {/* Progress bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${((step + 1) / STEPS.length) * 100}%` }]} />
        </View>
        <Text style={styles.progressText}>Etape {step + 1} sur {STEPS.length}</Text>
      </View>

      <KeyboardAvoidingView
        style={styles.formWrapper}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={{ transform: [{ translateX: slideAnim }] }}>
            {stepContent[step]()}
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Bottom CTA */}
      <View style={styles.bottomCTA}>
        {isLastStep ? (
          <Button
            title="Commencer"
            onPress={handleCommencer}
            loading={loading}
            size="lg"
            icon="→"
          />
        ) : (
          <Button
            title="Continuer"
            onPress={handleNext}
            size="lg"
            icon="→"
          />
        )}

        {step === 0 && (
          <TouchableOpacity
            style={styles.loginLink}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.loginText}>
              Deja un compte ?{' '}
              <Text style={styles.loginBold}>Se connecter</Text>
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  headerGradient: {
    paddingTop: Platform.OS === 'ios' ? 60 : 48,
    paddingBottom: 44,
    paddingHorizontal: 24,
    overflow: 'hidden',
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  backIcon: {
    fontSize: 22,
    color: '#FFF',
    fontWeight: '700',
  },
  headerContent: {
    zIndex: 1,
  },
  headerTitle: {
    fontSize: 30,
    fontWeight: '900',
    color: '#FFF',
    letterSpacing: -0.3,
  },
  headerSub: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.88)',
    marginTop: 6,
    fontWeight: '500',
  },
  headerCurve: {
    position: 'absolute',
    bottom: -1,
    left: 0,
    right: 0,
    height: 28,
    backgroundColor: colors.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  progressContainer: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: colors.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 3,
  },
  progressText: {
    fontSize: 13,
    color: colors.textTertiary,
    fontWeight: '600',
  },
  formWrapper: {
    flex: 1,
  },
  scroll: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
  },
  fieldGroup: {
    marginBottom: 18,
  },
  label: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 9,
    marginLeft: 2,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: RADIUS.lg,
    borderWidth: 2,
    borderColor: colors.border,
    paddingHorizontal: 16,
    height: 60,
  },
  inputFocused: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  inputIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    paddingVertical: 0,
    fontWeight: '500',
  },
  strengthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 10,
  },
  strengthBar: {
    flex: 1,
    height: 5,
    backgroundColor: colors.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  strengthFill: {
    height: '100%',
    borderRadius: 3,
  },
  strengthText: {
    fontSize: 13,
    fontWeight: '700',
  },
  optionalNote: {
    backgroundColor: colors.infoSoft,
    padding: 16,
    borderRadius: RADIUS.md,
    marginTop: 8,
  },
  optionalText: {
    fontSize: 14,
    color: colors.info,
    lineHeight: 20,
  },
  // Role cards
  rolesContainer: {
    gap: 14,
  },
  roleCard: {
    backgroundColor: colors.background,
    borderRadius: RADIUS.lg,
    borderWidth: 2,
    borderColor: colors.border,
    padding: 18,
  },
  roleCardActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  roleCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  roleIcon: {
    fontSize: 32,
    marginRight: 14,
  },
  roleTextWrap: {
    flex: 1,
  },
  roleLabel: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 3,
  },
  roleLabelActive: {
    color: colors.primary,
  },
  roleDesc: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  radioOuterActive: {
    borderColor: colors.primary,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
  },
  // Summary (step 4)
  summaryContainer: {
    alignItems: 'center',
    paddingTop: 20,
  },
  checkCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  checkIcon: {
    fontSize: 36,
    color: '#FFF',
    fontWeight: '700',
  },
  welcomeTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  welcomeSub: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 28,
  },
  summaryCard: {
    backgroundColor: colors.background,
    borderRadius: RADIUS.lg,
    padding: 20,
    width: '100%',
    gap: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  summaryIcon: {
    fontSize: 20,
  },
  summaryValue: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '500',
  },
  // Bottom CTA
  bottomCTA: {
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'ios' ? 34 : 24,
    paddingTop: 12,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  loginLink: {
    alignItems: 'center',
    marginTop: 14,
    paddingVertical: 14,
  },
  loginText: {
    fontSize: 16,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  loginBold: {
    color: colors.primary,
    fontWeight: '800',
  },
});

export default RegisterScreen;
