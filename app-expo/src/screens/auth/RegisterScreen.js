import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, ScrollView, StatusBar,
  Animated, Dimensions, ActivityIndicator
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { showAlert } from '../../utils/alert';
const colors = require('../../utils/colors');
const { RADIUS, SHADOWS, SPACING } = require('../../utils/colors');

const { width } = Dimensions.get('window');

const STEPS = [
  { title: 'Tes infos', subtitle: 'Dis-nous qui tu es', icon: '👤' },
  { title: 'Ton adresse', subtitle: 'Pour trouver des services pres de chez toi', icon: '📍' },
  { title: 'Ton role', subtitle: 'Comment utilises-tu Pépète ?', icon: '🎭' },
  { title: 'Bienvenue !', subtitle: 'Tout est pret', icon: '🎉' },
];

const ROLES = [
  { value: 'user', label: 'Proprietaire', icon: '🐶', desc: 'Je cherche des services pour mon animal' },
  { value: 'guardian', label: 'Gardien', icon: '🏠', desc: 'Je propose des services de garde' },
  { value: 'both', label: 'Les deux', icon: '🤝', desc: 'Proprietaire et gardien' },
];

const PremiumInput = ({ label, icon, value, onChangeText, placeholder, isFocused, fieldName, setFocusedField, ...props }) => {
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(glowAnim, {
      toValue: isFocused ? 1 : 0,
      duration: 220,
      useNativeDriver: false,
    }).start();
  }, [isFocused]);

  const borderColor = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.border, colors.primary],
  });

  const shadowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.2],
  });

  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.label}>{label}</Text>
      <Animated.View style={[
        styles.inputWrapper,
        {
          borderColor,
          shadowColor: colors.primary,
          shadowOpacity,
          shadowOffset: { width: 0, height: 4 },
          shadowRadius: 14,
        },
        isFocused && styles.inputFocused,
      ]}>
        <View style={[styles.inputIconWrap, isFocused && styles.inputIconWrapActive]}>
          <Text style={styles.inputIcon}>{icon}</Text>
        </View>
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
      </Animated.View>
    </View>
  );
};

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

  // Animations
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeSectionAnim = useRef(new Animated.Value(1)).current;
  const headerScale = useRef(new Animated.Value(0.9)).current;
  const headerFade = useRef(new Animated.Value(0)).current;
  const ctaBtnScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerFade, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(headerScale, { toValue: 1, tension: 45, friction: 8, useNativeDriver: true }),
    ]).start();
  }, []);

  const animateStep = (nextStep) => {
    const direction = nextStep > step ? 1 : -1;
    Animated.parallel([
      Animated.timing(fadeSectionAnim, { toValue: 0, duration: 120, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: -direction * 40, duration: 120, useNativeDriver: true }),
    ]).start(() => {
      setStep(nextStep);
      slideAnim.setValue(direction * 40);
      Animated.parallel([
        Animated.timing(fadeSectionAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, tension: 50, friction: 9, useNativeDriver: true }),
      ]).start();
    });
  };

  const validateStep = () => {
    switch (step) {
      case 0:
        if (!name || !email || !password || !confirmPassword) {
          showAlert('Champs manquants', 'Remplis tous les champs obligatoires');
          return false;
        }
        if (password !== confirmPassword) {
          showAlert('Oups !', 'Les mots de passe ne correspondent pas');
          return false;
        }
        if (password.length < 6) {
          showAlert('Mot de passe trop court', 'Minimum 6 caracteres requis');
          return false;
        }
        if (!/^\S+@\S+\.\S+$/.test(email)) {
          showAlert('Email invalide', 'Verifie ton adresse email');
          return false;
        }
        return true;
      case 1:
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
      showAlert('Erreur', result.error);
    }
  };

  const animateButtonPress = (callback) => {
    Animated.sequence([
      Animated.timing(ctaBtnScale, { toValue: 0.94, duration: 70, useNativeDriver: true }),
      Animated.spring(ctaBtnScale, { toValue: 1, tension: 300, friction: 10, useNativeDriver: true }),
    ]).start();
    callback();
  };

  const getPasswordStrength = () => {
    if (password.length === 0) return null;
    if (password.length < 6) return { label: 'Faible', color: colors.error, width: '33%' };
    if (password.length < 10) return { label: 'Moyen', color: colors.warning, width: '66%' };
    return { label: 'Fort', color: colors.success, width: '100%' };
  };

  const renderStep0 = () => (
    <>
      <PremiumInput
        label="Nom complet" icon="👤" fieldName="name"
        value={name} onChangeText={setName} placeholder="Ton prenom et nom"
        isFocused={focusedField === 'name'} setFocusedField={setFocusedField}
        autoCapitalize="words"
      />
      <PremiumInput
        label="Email" icon="📧" fieldName="email"
        value={email} onChangeText={setEmail} placeholder="ton@email.com"
        isFocused={focusedField === 'email'} setFocusedField={setFocusedField}
        keyboardType="email-address" autoCapitalize="none"
      />
      <PremiumInput
        label="Telephone (optionnel)" icon="📱" fieldName="phone"
        value={phone} onChangeText={setPhone} placeholder="06 12 34 56 78"
        isFocused={focusedField === 'phone'} setFocusedField={setFocusedField}
        keyboardType="phone-pad"
      />
      <PremiumInput
        label="Mot de passe" icon="🔒" fieldName="password"
        value={password} onChangeText={setPassword} placeholder="Minimum 6 caracteres"
        isFocused={focusedField === 'password'} setFocusedField={setFocusedField}
        secureTextEntry
      />
      <PremiumInput
        label="Confirmer" icon="🔐" fieldName="confirm"
        value={confirmPassword} onChangeText={setConfirmPassword} placeholder="Retape ton mot de passe"
        isFocused={focusedField === 'confirm'} setFocusedField={setFocusedField}
        secureTextEntry
      />
      {getPasswordStrength() && (
        <View style={styles.strengthRow}>
          <View style={styles.strengthBar}>
            <Animated.View style={[
              styles.strengthFill,
              {
                width: getPasswordStrength().width,
                backgroundColor: getPasswordStrength().color,
              }
            ]} />
          </View>
          <Text style={[styles.strengthText, { color: getPasswordStrength().color }]}>
            {getPasswordStrength().label}
          </Text>
        </View>
      )}
    </>
  );

  const renderStep1 = () => (
    <>
      <PremiumInput
        label="Ville" icon="📍" fieldName="city"
        value={city} onChangeText={setCity} placeholder="Ex: Asnieres-sur-Seine"
        isFocused={focusedField === 'city'} setFocusedField={setFocusedField}
        autoCapitalize="words"
      />
      <PremiumInput
        label="Code postal" icon="🏠" fieldName="postalCode"
        value={postalCode} onChangeText={setPostalCode} placeholder="Ex: 92600"
        isFocused={focusedField === 'postalCode'} setFocusedField={setFocusedField}
        keyboardType="number-pad" maxLength={5}
      />
      <View style={styles.infoCard}>
        <LinearGradient
          colors={['#EFF6FF', '#F0F3ED']}
          style={styles.infoCardGradient}
        >
          <Text style={styles.infoIcon}>{'💡'}</Text>
          <Text style={styles.infoText}>
            Ces informations sont optionnelles mais permettent de trouver des gardiens pres de chez toi.
          </Text>
        </LinearGradient>
      </View>
    </>
  );

  const renderStep2 = () => (
    <View style={styles.rolesContainer}>
      {ROLES.map((r, index) => {
        const isActive = role === r.value;
        return (
          <TouchableOpacity
            key={r.value}
            style={[styles.roleCard, isActive && styles.roleCardActive]}
            onPress={() => setRole(r.value)}
            activeOpacity={0.8}
          >
            {isActive && (
              <LinearGradient
                colors={['rgba(123,139,111,0.08)', 'rgba(123,139,111,0.03)']}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              />
            )}
            <View style={styles.roleCardInner}>
              <View style={[styles.roleIconWrap, isActive && styles.roleIconWrapActive]}>
                <Text style={styles.roleIcon}>{r.icon}</Text>
              </View>
              <View style={styles.roleTextWrap}>
                <Text style={[styles.roleLabel, isActive && styles.roleLabelActive]}>{r.label}</Text>
                <Text style={styles.roleDesc}>{r.desc}</Text>
              </View>
              <View style={[styles.radioOuter, isActive && styles.radioOuterActive]}>
                {isActive && (
                  <View style={styles.radioInner}>
                    <Text style={styles.radioCheck}>{'\u2713'}</Text>
                  </View>
                )}
              </View>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.summaryContainer}>
      <LinearGradient
        colors={[colors.secondary, colors.secondaryLight]}
        style={styles.checkCircle}
      >
        <Text style={styles.checkIcon}>{'\u2713'}</Text>
      </LinearGradient>
      <Text style={styles.welcomeTitle}>Bienvenue sur Pépète !</Text>
      <Text style={styles.welcomeSub}>Tout est pret. Voici un resume de votre profil :</Text>

      <View style={styles.summaryCard}>
        {[
          { icon: '👤', value: name },
          { icon: '📧', value: email },
          ...(city || postalCode ? [{ icon: '📍', value: `${city}${city && postalCode ? ' ' : ''}${postalCode ? `(${postalCode})` : ''}` }] : []),
          { icon: '🏷️', value: ROLES.find(r => r.value === role)?.label },
        ].map((item, i, arr) => (
          <View key={i}>
            <View style={styles.summaryRow}>
              <View style={styles.summaryIconWrap}>
                <Text style={styles.summaryIcon}>{item.icon}</Text>
              </View>
              <Text style={styles.summaryValue}>{item.value}</Text>
            </View>
            {i < arr.length - 1 && <View style={styles.summaryDivider} />}
          </View>
        ))}
      </View>
    </View>
  );

  const stepContent = [renderStep0, renderStep1, renderStep2, renderStep3];
  const isLastStep = step === 3;

  const insets = useSafeAreaInsets();
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Premium header with gradient */}
      <Animated.View style={{ opacity: headerFade, transform: [{ scale: headerScale }] }}>
        <LinearGradient
          colors={['#5E6D53', '#7B8B6F', '#96A88A']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.headerGradient, { paddingTop: insets.top + 12 }]}
        >
          {/* Decorative orbs in header */}
          <View style={styles.headerOrb1} />
          <View style={styles.headerOrb2} />

          {/* Back button */}
          <TouchableOpacity
            onPress={handleBack}
            style={styles.backBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.backIcon}>{step === 3 ? '' : '\u2190'}</Text>
          </TouchableOpacity>

          <View style={styles.headerContent}>
            {step < 3 && (
              <>
                <View style={styles.stepBadge}>
                  <Text style={styles.stepBadgeText}>{STEPS[step].icon}</Text>
                </View>
                <Text style={styles.headerTitle}>{STEPS[step].title}</Text>
                <Text style={styles.headerSub}>{STEPS[step].subtitle}</Text>
              </>
            )}
          </View>

          <View style={styles.headerCurve} />
        </LinearGradient>
      </Animated.View>

      {/* Premium progress indicator */}
      <View style={styles.progressContainer}>
        <View style={styles.progressSteps}>
          {STEPS.map((s, i) => (
            <View key={i} style={styles.progressStepWrap}>
              {i > 0 && (
                <View style={[styles.progressConnector, i <= step && styles.progressConnectorActive]} />
              )}
              <View style={[
                styles.progressDot,
                i < step && styles.progressDotCompleted,
                i === step && styles.progressDotCurrent,
              ]}>
                {i < step ? (
                  <Text style={styles.progressDotCheck}>{'\u2713'}</Text>
                ) : i === step ? (
                  <View style={styles.progressDotPulse} />
                ) : null}
              </View>
            </View>
          ))}
        </View>
        <Text style={styles.progressText}>Etape {step + 1} sur {STEPS.length}</Text>
      </View>

      <KeyboardAvoidingView
        style={styles.formWrapper}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={true}
          overScrollMode="always"
        >
          <Animated.View style={{
            transform: [{ translateX: slideAnim }],
            opacity: fadeSectionAnim,
          }}>
            {stepContent[step]()}
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Premium bottom CTA */}
      <View style={styles.bottomCTA}>
        <Animated.View style={{ transform: [{ scale: ctaBtnScale }] }}>
          <TouchableOpacity
            onPress={() => animateButtonPress(isLastStep ? handleCommencer : handleNext)}
            disabled={loading}
            activeOpacity={1}
          >
            <LinearGradient
              colors={loading ? ['#D1D5DB', '#C4C9D4'] : ['#5E6D53', '#7B8B6F', '#96A88A']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.premiumBtn}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" size="small" />
              ) : (
                <View style={styles.premiumBtnContent}>
                  <Text style={styles.premiumBtnText}>
                    {isLastStep ? 'Commencer' : 'Continuer'}
                  </Text>
                  <View style={styles.premiumBtnArrowWrap}>
                    <Text style={styles.premiumBtnArrow}>{isLastStep ? '🚀' : '\u2192'}</Text>
                  </View>
                </View>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

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
    backgroundColor: '#F8F6F2',
  },
  // Header
  headerGradient: {
    paddingTop: 12, // dynamic insets applied via style prop
    paddingBottom: 36,
    paddingHorizontal: 24,
    overflow: 'hidden',
  },
  headerOrb1: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.06)',
    top: -60,
    right: -40,
  },
  headerOrb2: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.04)',
    bottom: 20,
    left: -50,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  backIcon: {
    fontSize: 22,
    color: '#FFF',
    fontWeight: '700',
  },
  headerContent: {
    zIndex: 1,
  },
  stepBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  stepBadgeText: {
    fontSize: 20,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFF',
    letterSpacing: -0.3,
  },
  headerSub: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.88)',
    marginTop: 6,
    fontWeight: '500',
    lineHeight: 22,
  },
  headerCurve: {
    position: 'absolute',
    bottom: -1,
    left: 0,
    right: 0,
    height: 20,
    backgroundColor: '#F8F6F2',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  // Progress indicator
  progressContainer: {
    paddingHorizontal: 24,
    paddingTop: 4,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  progressSteps: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 16,
  },
  progressStepWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  progressConnector: {
    flex: 1,
    height: 3,
    backgroundColor: colors.border,
    borderRadius: 2,
    marginHorizontal: 4,
  },
  progressConnectorActive: {
    backgroundColor: colors.primary,
  },
  progressDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.background,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressDotCompleted: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  progressDotCurrent: {
    borderColor: colors.primary,
    borderWidth: 3,
    backgroundColor: '#FFF',
  },
  progressDotCheck: {
    fontSize: 13,
    color: '#FFF',
    fontWeight: '800',
  },
  progressDotPulse: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  progressText: {
    fontSize: 12,
    color: colors.textTertiary,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  // Form
  formWrapper: {
    flex: 1,
  },
  scroll: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 32,
    flexGrow: 1,
  },
  // Input fields
  fieldGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: 8,
    marginLeft: 4,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingHorizontal: 6,
    height: 56,
  },
  inputFocused: {
    backgroundColor: '#FFF',
  },
  inputIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  inputIconWrapActive: {
    backgroundColor: '#E8EDE5',
  },
  inputIcon: {
    fontSize: 18,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    paddingVertical: 0,
    fontWeight: '500',
  },
  // Password strength
  strengthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    marginTop: -8,
    gap: 12,
    paddingHorizontal: 4,
  },
  strengthBar: {
    flex: 1,
    height: 6,
    backgroundColor: colors.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  strengthFill: {
    height: '100%',
    borderRadius: 3,
  },
  strengthText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  // Info card
  infoCard: {
    marginTop: 8,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
  },
  infoCardGradient: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 18,
  },
  infoIcon: {
    fontSize: 18,
    marginRight: 12,
    marginTop: 1,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: colors.info,
    lineHeight: 21,
    fontWeight: '500',
  },
  // Role cards
  rolesContainer: {
    gap: 16,
  },
  roleCard: {
    backgroundColor: '#FFF',
    borderRadius: RADIUS.xl,
    borderWidth: 2,
    borderColor: colors.border,
    padding: 20,
    overflow: 'hidden',
  },
  roleCardActive: {
    borderColor: colors.primary,
    ...SHADOWS.md,
    shadowColor: colors.primary,
    shadowOpacity: 0.15,
  },
  roleCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  roleIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  roleIconWrapActive: {
    backgroundColor: '#DCE3D7',
  },
  roleIcon: {
    fontSize: 26,
  },
  roleTextWrap: {
    flex: 1,
  },
  roleLabel: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 3,
    letterSpacing: -0.2,
  },
  roleLabelActive: {
    color: colors.primary,
  },
  roleDesc: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  radioOuter: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  radioOuterActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  radioInner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCheck: {
    fontSize: 14,
    color: '#FFF',
    fontWeight: '800',
  },
  // Summary (step 4)
  summaryContainer: {
    alignItems: 'center',
    paddingTop: 16,
  },
  checkCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    ...SHADOWS.lg,
    shadowColor: colors.secondary,
    shadowOpacity: 0.3,
  },
  checkIcon: {
    fontSize: 40,
    color: '#FFF',
    fontWeight: '700',
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  welcomeSub: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 28,
    lineHeight: 24,
  },
  summaryCard: {
    backgroundColor: '#FFF',
    borderRadius: RADIUS.xl,
    padding: 24,
    width: '100%',
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...SHADOWS.md,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  summaryIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  summaryIcon: {
    fontSize: 18,
  },
  summaryValue: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    fontWeight: '600',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginVertical: 14,
    marginLeft: 54,
  },
  // Bottom CTA
  bottomCTA: {
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    paddingTop: 14,
    backgroundColor: '#F8F6F2',
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  premiumBtn: {
    height: 64,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.lg,
    shadowColor: '#5E6D53',
    shadowOpacity: 0.4,
  },
  premiumBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  premiumBtnText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginRight: 10,
  },
  premiumBtnArrowWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  premiumBtnArrow: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  loginLink: {
    alignItems: 'center',
    marginTop: 16,
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
