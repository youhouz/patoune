import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, ScrollView,
  Animated, StatusBar, Dimensions, ActivityIndicator
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../context/AuthContext';
import { showAlert } from '../../utils/alert';
import PepeteLogo from '../../components/PepeteLogo';
const colors = require('../../utils/colors');
const { SHADOWS, RADIUS, SPACING, FONT_SIZE } = require('../../utils/colors');

const { width, height } = Dimensions.get('window');

const LoginScreen = ({ navigation }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

  // Staggered entrance animations
  const heroFade = useRef(new Animated.Value(0)).current;
  const heroScale = useRef(new Animated.Value(0.85)).current;
  const heroSlide = useRef(new Animated.Value(-20)).current;
  const cardFade = useRef(new Animated.Value(0)).current;
  const cardSlide = useRef(new Animated.Value(50)).current;
  const ctaFade = useRef(new Animated.Value(0)).current;
  const ctaSlide = useRef(new Animated.Value(40)).current;
  const trustFade = useRef(new Animated.Value(0)).current;

  // Micro-interactions
  const loginBtnScale = useRef(new Animated.Value(1)).current;
  const registerBtnScale = useRef(new Animated.Value(1)).current;
  const emailGlow = useRef(new Animated.Value(0)).current;
  const passwordGlow = useRef(new Animated.Value(0)).current;

  // Floating orb animations
  const orbFloat1 = useRef(new Animated.Value(0)).current;
  const orbFloat2 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Entrance sequence
    Animated.stagger(120, [
      Animated.parallel([
        Animated.timing(heroFade, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.spring(heroScale, { toValue: 1, tension: 40, friction: 7, useNativeDriver: true }),
        Animated.spring(heroSlide, { toValue: 0, tension: 40, friction: 8, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(cardFade, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.spring(cardSlide, { toValue: 0, tension: 45, friction: 9, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(ctaFade, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.spring(ctaSlide, { toValue: 0, tension: 50, friction: 8, useNativeDriver: true }),
      ]),
      Animated.timing(trustFade, { toValue: 1, duration: 500, useNativeDriver: true }),
    ]).start();

    // Floating orb loop
    const floatLoop = (anim, duration) => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, { toValue: 1, duration, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0, duration, useNativeDriver: true }),
        ])
      ).start();
    };
    floatLoop(orbFloat1, 4000);
    floatLoop(orbFloat2, 5500);
  }, []);

  // Input focus glow
  useEffect(() => {
    Animated.timing(emailGlow, {
      toValue: focusedField === 'email' ? 1 : 0,
      duration: 250,
      useNativeDriver: false,
    }).start();
    Animated.timing(passwordGlow, {
      toValue: focusedField === 'password' ? 1 : 0,
      duration: 250,
      useNativeDriver: false,
    }).start();
  }, [focusedField]);

  const animateButtonPress = (animValue, callback) => {
    Animated.sequence([
      Animated.timing(animValue, { toValue: 0.94, duration: 70, useNativeDriver: true }),
      Animated.spring(animValue, { toValue: 1, tension: 300, friction: 10, useNativeDriver: true }),
    ]).start();
    callback();
  };

  const handleLogin = async () => {
    if (!email || !password) {
      showAlert('Oups !', 'Remplis tous les champs pour continuer');
      return;
    }
    setLoading(true);
    const result = await login(email.trim().toLowerCase(), password);
    setLoading(false);
    if (!result.success) {
      showAlert('Connexion impossible', result.error);
    }
  };

  const getInputBorderColor = (glowAnim) =>
    glowAnim.interpolate({
      inputRange: [0, 1],
      outputRange: ['rgba(232,234,240,0.8)', colors.primary],
    });

  const getInputElevation = (glowAnim) =>
    glowAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 0.22],
    });

  const orbTranslate1 = orbFloat1.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 12],
  });

  const orbTranslate2 = orbFloat2.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -10],
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Deep luxe gradient background */}
      <LinearGradient
        colors={['#E55A25', '#FF6B35', '#FF8F65', '#FFB088', '#FFDCC8']}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Animated floating orbs for depth */}
      <View style={styles.orbContainer}>
        <Animated.View style={[styles.orb, styles.orb1, { transform: [{ translateY: orbTranslate1 }] }]} />
        <Animated.View style={[styles.orb, styles.orb2, { transform: [{ translateY: orbTranslate2 }] }]} />
        <View style={[styles.orb, styles.orb3]} />
        <View style={[styles.orb, styles.orb4]} />
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Hero brand header */}
          <Animated.View style={[
            styles.heroSection,
            {
              opacity: heroFade,
              transform: [{ scale: heroScale }, { translateY: heroSlide }],
            },
          ]}>
            <PepeteLogo size={96} theme="light" tagline="Le meilleur pour vos animaux" />
            <View style={styles.taglineDivider} />
          </Animated.View>

          {/* Premium glass card */}
          <Animated.View style={[
            styles.formCard,
            {
              opacity: cardFade,
              transform: [{ translateY: cardSlide }],
            },
          ]}>
            {/* Inner top highlight */}
            <View style={styles.cardHighlight} />

            <Text style={styles.welcomeTitle}>Content de vous revoir !</Text>
            <Text style={styles.welcomeSub}>Connectez-vous pour continuer</Text>

            {/* Email field */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Adresse email</Text>
              <Animated.View style={[
                styles.inputWrapper,
                {
                  borderColor: getInputBorderColor(emailGlow),
                  shadowColor: colors.primary,
                  shadowOpacity: getInputElevation(emailGlow),
                  shadowOffset: { width: 0, height: 6 },
                  shadowRadius: 16,
                },
                focusedField === 'email' && styles.inputFocused,
              ]}>
                <View style={[styles.inputIconWrap, focusedField === 'email' && styles.inputIconWrapFocused]}>
                  <Text style={styles.inputIcon}>{'📧'}</Text>
                </View>
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="votre@email.com"
                  placeholderTextColor={colors.textLight}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                />
              </Animated.View>
            </View>

            {/* Password field */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Mot de passe</Text>
              <Animated.View style={[
                styles.inputWrapper,
                {
                  borderColor: getInputBorderColor(passwordGlow),
                  shadowColor: colors.primary,
                  shadowOpacity: getInputElevation(passwordGlow),
                  shadowOffset: { width: 0, height: 6 },
                  shadowRadius: 16,
                },
                focusedField === 'password' && styles.inputFocused,
              ]}>
                <View style={[styles.inputIconWrap, focusedField === 'password' && styles.inputIconWrapFocused]}>
                  <Text style={styles.inputIcon}>{'🔒'}</Text>
                </View>
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Votre mot de passe"
                  placeholderTextColor={colors.textLight}
                  secureTextEntry={!showPassword}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                />
                <TouchableOpacity
                  style={styles.eyeBtn}
                  onPress={() => setShowPassword(!showPassword)}
                  hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}
                >
                  <Text style={styles.eyeIcon}>{showPassword ? '🙈' : '👁️'}</Text>
                </TouchableOpacity>
              </Animated.View>
            </View>

            {/* Premium CTA */}
            <Animated.View style={[styles.ctaWrap, { transform: [{ scale: loginBtnScale }] }]}>
              <TouchableOpacity
                onPress={() => animateButtonPress(loginBtnScale, handleLogin)}
                disabled={loading}
                activeOpacity={1}
              >
                <LinearGradient
                  colors={loading ? ['#D1D5DB', '#C4C9D4'] : ['#E55A25', '#FF6B35', '#FF8F65']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.premiumBtn}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFF" size="small" />
                  ) : (
                    <>
                      <Text style={styles.premiumBtnText}>Se connecter</Text>
                      <Text style={styles.premiumBtnArrow}>{'  \u2192'}</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>

            {/* Trust bar */}
            <Animated.View style={[styles.trustBar, { opacity: trustFade }]}>
              <View style={styles.trustAvatars}>
                {[
                  { emoji: '🐕', bg: '#FFD4BC' },
                  { emoji: '🐈', bg: '#C8F7DC' },
                  { emoji: '🐾', bg: '#D4DAFF' },
                  { emoji: '🦮', bg: '#FFEAA7' },
                ].map((item, i) => (
                  <View
                    key={i}
                    style={[
                      styles.trustAvatar,
                      { backgroundColor: item.bg, marginLeft: i > 0 ? -10 : 0, zIndex: 4 - i },
                    ]}
                  >
                    <Text style={styles.trustAvatarText}>{item.emoji}</Text>
                  </View>
                ))}
              </View>
              <View style={styles.trustTextWrap}>
                <Text style={styles.trustCount}>2 000+ proprietaires</Text>
                <View style={styles.trustStars}>
                  <Text style={styles.trustStarText}>{'★★★★★'}</Text>
                  <Text style={styles.trustRating}> 4.9</Text>
                </View>
              </View>
            </Animated.View>
          </Animated.View>

          {/* Bottom section */}
          <Animated.View style={[
            styles.bottomSection,
            {
              opacity: ctaFade,
              transform: [{ translateY: ctaSlide }],
            },
          ]}>
            {/* Elegant divider */}
            <View style={styles.divider}>
              <LinearGradient
                colors={['transparent', 'rgba(255,255,255,0.5)', 'transparent']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.dividerLine}
              />
              <View style={styles.dividerBadge}>
                <Text style={styles.dividerText}>ou</Text>
              </View>
              <LinearGradient
                colors={['transparent', 'rgba(255,255,255,0.5)', 'transparent']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.dividerLine}
              />
            </View>

            {/* Register CTA */}
            <Animated.View style={{ transform: [{ scale: registerBtnScale }] }}>
              <TouchableOpacity
                onPress={() => animateButtonPress(registerBtnScale, () => navigation.navigate('Register'))}
                activeOpacity={1}
              >
                <View style={styles.registerBtn}>
                  <Text style={styles.registerText}>
                    Pas encore de compte ?
                  </Text>
                  <View style={styles.registerHighlight}>
                    <Text style={styles.registerBold}>Creer un compte</Text>
                    <Text style={styles.registerArrow}>{' \u2192'}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            </Animated.View>

            {/* Security badge */}
            <View style={styles.securityBadge}>
              <Text style={styles.securityIcon}>{'🔒'}</Text>
              <Text style={styles.securityText}>Connexion securisee et chiffree</Text>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  // Floating orbs
  orbContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  orb: {
    position: 'absolute',
    borderRadius: 999,
  },
  orb1: {
    width: 320,
    height: 320,
    top: -100,
    right: -80,
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  orb2: {
    width: 240,
    height: 240,
    bottom: 100,
    left: -100,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  orb3: {
    width: 160,
    height: 160,
    top: height * 0.38,
    right: -50,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  orb4: {
    width: 100,
    height: 100,
    top: height * 0.15,
    left: 20,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 76 : 56,
    paddingBottom: 48,
    justifyContent: 'center',
  },
  // Hero brand
  heroSection: {
    alignItems: 'center',
    marginBottom: 32,
  },

  taglineDivider: {
    width: 48,
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.4)',
    borderRadius: 2,
    marginTop: 16,
  },
  // Glass card
  formCard: {
    backgroundColor: 'rgba(255,255,255,0.97)',
    borderRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 36,
    paddingBottom: 28,
    ...SHADOWS.xl,
    shadowColor: 'rgba(0,0,0,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.8)',
    overflow: 'hidden',
  },
  cardHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: colors.primary,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  welcomeSub: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 28,
    lineHeight: 24,
  },
  // Fields
  fieldGroup: {
    marginBottom: 20,
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
    backgroundColor: '#FAFBFC',
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    borderColor: 'rgba(232,234,240,0.8)',
    paddingHorizontal: 6,
    height: 64,
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
  inputIconWrapFocused: {
    backgroundColor: '#FFE8DB',
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
  eyeBtn: {
    padding: 12,
  },
  eyeIcon: {
    fontSize: 20,
  },
  // CTA
  ctaWrap: {
    marginTop: 12,
  },
  premiumBtn: {
    height: 64,
    borderRadius: RADIUS.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.lg,
    shadowColor: '#E55A25',
    shadowOpacity: 0.4,
  },
  premiumBtnText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  premiumBtnArrow: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 18,
    fontWeight: '700',
  },
  // Trust bar
  trustBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  trustAvatars: {
    flexDirection: 'row',
    marginRight: 14,
  },
  trustAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    borderColor: '#FFF',
  },
  trustAvatarText: {
    fontSize: 13,
  },
  trustTextWrap: {
    alignItems: 'flex-start',
  },
  trustCount: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '700',
  },
  trustStars: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 1,
  },
  trustStarText: {
    fontSize: 11,
    color: '#FBBF24',
    letterSpacing: 1,
  },
  trustRating: {
    fontSize: 12,
    color: colors.textTertiary,
    fontWeight: '700',
  },
  // Bottom
  bottomSection: {
    marginTop: 28,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 22,
    paddingHorizontal: 8,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerBadge: {
    marginHorizontal: 16,
    paddingHorizontal: 14,
    paddingVertical: 4,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
  },
  dividerText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  registerBtn: {
    alignItems: 'center',
    paddingVertical: 22,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderRadius: RADIUS.xl,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  registerText: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '500',
    marginBottom: 4,
  },
  registerHighlight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  registerBold: {
    color: '#FFF',
    fontWeight: '800',
    fontSize: 17,
  },
  registerArrow: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 16,
    fontWeight: '700',
  },
  securityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    opacity: 0.7,
  },
  securityIcon: {
    fontSize: 12,
    marginRight: 6,
  },
  securityText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});

export default LoginScreen;
