// ─────────────────────────────────────────────────────────────────────────────
// Pépète — LoginScreen v4.0
// DA premium unifiée — même système de design que les autres écrans de l'app
// Improvements: proper navigation reset, showAlert for web compat, ES imports
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Platform, StatusBar, Animated, ActivityIndicator,
  KeyboardAvoidingView, ScrollView, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { PawIcon } from '../../components/Logo';
import useResponsive from '../../hooks/useResponsive';
import { FONTS } from '../../utils/typography';
import { showAlert } from '../../utils/alert';
import colors, { SHADOWS, RADIUS, SPACING, FONT_SIZE } from '../../utils/colors';

const { height: SCREEN_H } = Dimensions.get('window');

// ─── Champ de saisie unifié ──────────────────────────────────────────────────
const Field = ({ label, icon, value, onChangeText, placeholder, focusedKey, setFocused, keyboardType, secureTextEntry, right, autoCapitalize, autoCorrect, onSubmitEditing, returnKeyType, inputRef }) => {
  const isFocused = focusedKey === label;
  return (
    <View style={s.fieldWrap}>
      <Text style={s.label}>{label}</Text>
      <View style={[s.fieldRow, isFocused && s.fieldRowFocused]}>
        <Feather name={icon} size={18} color={isFocused ? colors.primary : colors.textLight} style={s.fieldIcon} />
        <TextInput
          ref={inputRef}
          style={s.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.placeholder}
          keyboardType={keyboardType || 'default'}
          secureTextEntry={secureTextEntry}
          autoCapitalize={autoCapitalize || 'none'}
          autoCorrect={autoCorrect !== undefined ? autoCorrect : true}
          onFocus={() => setFocused(label)}
          onBlur={() => setFocused(null)}
          onSubmitEditing={onSubmitEditing}
          returnKeyType={returnKeyType || 'next'}
        />
        {right}
      </View>
    </View>
  );
};

// ─── Screen ──────────────────────────────────────────────────────────────────
const LoginScreen = ({ navigation }) => {
  const { login } = useAuth();
  const { isTablet, contentWidth } = useResponsive();
  const insets = useSafeAreaInsets();

  const [email, setEmail]     = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [focused, setFocused] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Animations
  const heroScale  = useRef(new Animated.Value(0.92)).current;
  const heroOpacity = useRef(new Animated.Value(0)).current;
  const cardSlide  = useRef(new Animated.Value(40)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const shakeAnim  = useRef(new Animated.Value(0)).current;

  const pwdRef = useRef(null);

  const maxW = isTablet ? Math.min(contentWidth, 520) : '100%';

  useEffect(() => {
    Animated.parallel([
      Animated.spring(heroScale,  { toValue: 1, tension: 50, friction: 7, useNativeDriver: true }),
      Animated.timing(heroOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
    ]).start();
    Animated.parallel([
      Animated.spring(cardSlide, { toValue: 0, tension: 60, friction: 8, delay: 150, useNativeDriver: true }),
      Animated.timing(cardOpacity, { toValue: 1, duration: 400, delay: 150, useNativeDriver: true }),
    ]).start();
  }, []);

  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10,  duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 8,   duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8,  duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0,   duration: 60, useNativeDriver: true }),
    ]).start();
  };

  const handleLogin = async () => {
    setErrorMsg('');
    if (!email.trim() || !password) {
      shake();
      setErrorMsg('Remplis tous les champs pour continuer');
      return;
    }
    setLoading(true);
    const result = await login(email.trim().toLowerCase(), password);
    setLoading(false);
    if (result.success) {
      // Reset to root Tabs — must target the RootStack (parent of AuthStack)
      const parent = navigation.getParent();
      if (parent) {
        parent.reset({ index: 0, routes: [{ name: 'Tabs' }] });
      } else {
        navigation.reset({ index: 0, routes: [{ name: 'Tabs' }] });
      }
    } else {
      shake();
      setErrorMsg(result.error || 'Connexion impossible. Vérifie tes identifiants.');
    }
  };

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" />

      {/* ── Hero gradient ── */}
      <LinearGradient
        colors={['#1C2B1E', '#2C3E2F', '#3D5E41']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[s.hero, { paddingTop: insets.top + 32 }]}
      >
        {/* Décors lumineux */}
        <View style={s.glow1} pointerEvents="none" />
        <View style={s.glow2} pointerEvents="none" />

        <Animated.View style={[s.heroInner, { transform: [{ scale: heroScale }], opacity: heroOpacity, maxWidth: maxW, alignSelf: 'center', width: '100%' }]}>
          {/* Badge logo */}
          <View style={s.logoBadge}>
            <PawIcon size={28} color="#FFF" />
          </View>
          <Text style={s.logoWord}>pépète.</Text>
          <Text style={s.heroTitle}>Bon retour <Text style={s.heroAccent}>!</Text></Text>
          <Text style={s.heroSub}>Connectez-vous pour continuer</Text>
        </Animated.View>
      </LinearGradient>

      {/* ── Card formulaire ── */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          style={s.scrollView}
          contentContainerStyle={[s.scrollContent, { paddingBottom: insets.bottom + 40 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <Animated.View
            style={[
              s.card,
              {
                maxWidth: maxW,
                alignSelf: 'center',
                width: '100%',
                transform: [{ translateY: cardSlide }, { translateX: shakeAnim }],
                opacity: cardOpacity,
              },
            ]}
          >
            {/* Titre section */}
            <Text style={s.cardTitle}>Connexion</Text>

            {/* Message d'erreur */}
            {errorMsg ? (
              <View style={s.errorBanner}>
                <Feather name="alert-circle" size={15} color={colors.error} />
                <Text style={s.errorBannerText}>{errorMsg}</Text>
              </View>
            ) : null}

            {/* Email */}
            <Field
              label="email"
              icon="mail"
              value={email}
              onChangeText={(v) => { setEmail(v); setErrorMsg(''); }}
              placeholder="votre@email.com"
              focusedKey={focused}
              setFocused={setFocused}
              keyboardType="email-address"
              autoCorrect={false}
              returnKeyType="next"
              onSubmitEditing={() => pwdRef.current?.focus()}
            />

            {/* Mot de passe */}
            <Field
              label="mot de passe"
              icon="lock"
              value={password}
              onChangeText={(v) => { setPassword(v); setErrorMsg(''); }}
              placeholder="Votre mot de passe"
              focusedKey={focused}
              setFocused={setFocused}
              secureTextEntry={!showPwd}
              inputRef={pwdRef}
              returnKeyType="done"
              onSubmitEditing={handleLogin}
              right={
                <TouchableOpacity
                  onPress={() => setShowPwd(!showPwd)}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                  <Feather name={showPwd ? 'eye-off' : 'eye'} size={18} color={colors.textLight} />
                </TouchableOpacity>
              }
            />

            {/* CTA */}
            <TouchableOpacity
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.88}
              style={[s.ctaWrap, loading && s.ctaDisabled]}
            >
              <LinearGradient
                colors={loading ? [colors.textLight, colors.textTertiary] : [colors.primaryDark, colors.primary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={s.cta}
              >
                {loading
                  ? <ActivityIndicator size="small" color="#FFF" />
                  : (
                    <>
                      <Text style={s.ctaText}>Se connecter</Text>
                      <Feather name="arrow-right" size={20} color="#FFF" />
                    </>
                  )
                }
              </LinearGradient>
            </TouchableOpacity>

            {/* Divider */}
            <View style={s.divider}>
              <View style={s.dividerLine} />
              <Text style={s.dividerLabel}>ou</Text>
              <View style={s.dividerLine} />
            </View>

            {/* Lien inscription */}
            <TouchableOpacity
              style={s.linkRow}
              onPress={() => navigation.navigate('Register')}
              activeOpacity={0.7}
            >
              <Text style={s.linkText}>Pas encore de compte ?</Text>
              <View style={s.linkBadge}>
                <Text style={s.linkBadgeText}>Créer un compte</Text>
                <Feather name="chevron-right" size={14} color={colors.primary} />
              </View>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },

  // Hero
  hero: {
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING['2xl'] + 10,
    overflow: 'hidden',
  },
  glow1: {
    position: 'absolute', top: -80, right: -80,
    width: 240, height: 240, borderRadius: 120,
    backgroundColor: 'rgba(107,143,113,0.12)',
  },
  glow2: {
    position: 'absolute', bottom: 20, left: -60,
    width: 160, height: 160, borderRadius: 80,
    backgroundColor: 'rgba(82,122,86,0.08)',
  },
  heroInner: {
    alignItems: 'flex-start',
  },
  logoBadge: {
    width: 56, height: 56, borderRadius: RADIUS.xl,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.base,
  },
  logoWord: {
    fontFamily: FONTS.brand,
    fontSize: FONT_SIZE.sm,
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: SPACING.lg,
  },
  heroTitle: {
    fontFamily: FONTS.brand,
    fontSize: FONT_SIZE['3xl'],
    color: '#FFF',
    letterSpacing: -1,
    lineHeight: FONT_SIZE['3xl'] * 1.1,
    marginBottom: SPACING.sm,
  },
  heroAccent: {
    color: '#8CB092',
  },
  heroSub: {
    fontFamily: FONTS.bodyMedium,
    fontSize: FONT_SIZE.base,
    color: 'rgba(255,255,255,0.55)',
  },

  // Scroll
  scrollView: { flex: 1 },
  scrollContent: {
    paddingTop: SPACING.xl,
    paddingHorizontal: SPACING.lg,
  },

  // Card
  card: {
    backgroundColor: colors.white,
    borderRadius: RADIUS['2xl'],
    padding: SPACING.xl,
    ...SHADOWS.lg,
  },
  cardTitle: {
    fontFamily: FONTS.heading,
    fontSize: FONT_SIZE['2xl'],
    color: colors.text,
    letterSpacing: -0.5,
    marginBottom: SPACING.xl,
  },

  // Error banner
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: colors.errorSoft || '#FBE8E4',
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.base,
    borderLeftWidth: 3,
    borderLeftColor: colors.error,
  },
  errorBannerText: {
    flex: 1,
    fontFamily: FONTS.bodyMedium,
    fontSize: FONT_SIZE.sm,
    color: colors.error,
    lineHeight: 18,
  },

  // Fields
  fieldWrap: {
    marginBottom: SPACING.base,
  },
  label: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZE.xs,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: SPACING.sm,
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.base,
    height: 54,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  fieldRowFocused: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryUltra || '#F5FAF6',
  },
  fieldIcon: {
    marginRight: SPACING.sm,
  },
  input: {
    flex: 1,
    fontFamily: FONTS.bodyMedium,
    fontSize: FONT_SIZE.base,
    color: colors.text,
    paddingVertical: 0,
  },

  // CTA
  ctaWrap: {
    marginTop: SPACING.sm,
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    ...SHADOWS.glow ? SHADOWS.glow() : {},
  },
  ctaDisabled: { opacity: 0.7 },
  cta: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    borderRadius: RADIUS.xl,
  },
  ctaText: {
    fontFamily: FONTS.heading,
    fontSize: FONT_SIZE.md,
    color: '#FFF',
    letterSpacing: 0.2,
  },

  // Divider
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: SPACING.xl,
    gap: SPACING.base,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerLabel: {
    fontFamily: FONTS.bodyMedium,
    fontSize: FONT_SIZE.sm,
    color: colors.textLight,
  },

  // Link
  linkRow: {
    alignItems: 'center',
    gap: SPACING.sm,
  },
  linkText: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZE.sm,
    color: colors.textSecondary,
  },
  linkBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primarySoft,
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
  },
  linkBadgeText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZE.sm,
    color: colors.primary,
  },
});

export default LoginScreen;
