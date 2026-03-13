// ─────────────────────────────────────────────────────────────────────────────
// Pépète — RegisterScreen v3.0
// DA premium unifiée — même système que les autres écrans de l'app
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Platform, Alert, StatusBar, Animated, ActivityIndicator,
  KeyboardAvoidingView, ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { PawIcon } from '../../components/Logo';
import useResponsive from '../../hooks/useResponsive';
import { FONTS } from '../../utils/typography';
const colors = require('../../utils/colors');
const { SHADOWS, RADIUS, SPACING, FONT_SIZE } = require('../../utils/colors');

// ─── Force + couleur du mot de passe ────────────────────────────────────────
const getPwdStrength = (pwd) => {
  if (!pwd) return null;
  const len = pwd.length;
  const hasUpper = /[A-Z]/.test(pwd);
  const hasNum   = /[0-9]/.test(pwd);
  const hasSpec  = /[^A-Za-z0-9]/.test(pwd);
  const score = (len >= 8 ? 1 : 0) + (len >= 12 ? 1 : 0) + (hasUpper ? 1 : 0) + (hasNum ? 1 : 0) + (hasSpec ? 1 : 0);
  if (len < 6)   return { level: 0, label: 'Trop court', color: colors.error,   width: '15%' };
  if (score <= 2) return { level: 1, label: 'Faible',     color: '#E57373',      width: '33%' };
  if (score <= 3) return { level: 2, label: 'Moyen',      color: '#FFB74D',      width: '60%' };
  if (score <= 4) return { level: 3, label: 'Fort',       color: colors.primary, width: '82%' };
  return             { level: 4, label: 'Excellent',  color: colors.primaryDark, width: '100%' };
};

// ─── Champ de saisie unifié ──────────────────────────────────────────────────
const Field = ({ label, icon, value, onChangeText, placeholder, focusedKey, setFocused, fieldKey, keyboardType, secureTextEntry, right, autoCapitalize, onSubmitEditing, returnKeyType, inputRef, error }) => {
  const isFocused = focusedKey === fieldKey;
  return (
    <View style={s.fieldWrap}>
      <Text style={s.label}>{label}</Text>
      <View style={[s.fieldRow, isFocused && s.fieldRowFocused, error && s.fieldRowError]}>
        <Feather name={icon} size={18} color={error ? colors.error : isFocused ? colors.primary : colors.textLight} style={s.fieldIcon} />
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
          autoCorrect={false}
          onFocus={() => setFocused(fieldKey)}
          onBlur={() => setFocused(null)}
          onSubmitEditing={onSubmitEditing}
          returnKeyType={returnKeyType || 'next'}
        />
        {right}
      </View>
      {error ? <Text style={s.fieldError}>{error}</Text> : null}
    </View>
  );
};

// ─── Screen ──────────────────────────────────────────────────────────────────
const RegisterScreen = ({ navigation }) => {
  const { register } = useAuth();
  const { isTablet, contentWidth } = useResponsive();
  const insets = useSafeAreaInsets();

  const [name,     setName]     = useState('');
  const [email,    setEmail]    = useState('');
  const [phone,    setPhone]    = useState('');
  const [password, setPassword] = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [showPwd,  setShowPwd]  = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [focused,  setFocused]  = useState(null);
  const [errors,   setErrors]   = useState({});

  // Animations
  const slideAnim  = useRef(new Animated.Value(30)).current;
  const fadeAnim   = useRef(new Animated.Value(0)).current;
  const shakeAnim  = useRef(new Animated.Value(0)).current;

  const emailRef   = useRef(null);
  const phoneRef   = useRef(null);
  const pwdRef     = useRef(null);
  const confirmRef = useRef(null);

  const maxW = isTablet ? Math.min(contentWidth, 520) : '100%';
  const strength = getPwdStrength(password);

  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideAnim, { toValue: 0, tension: 55, friction: 8, delay: 100, useNativeDriver: true }),
      Animated.timing(fadeAnim,  { toValue: 1, duration: 450, delay: 100, useNativeDriver: true }),
    ]).start();
  }, []);

  const shake = () => Animated.sequence([
    Animated.timing(shakeAnim, { toValue: 10,  duration: 55, useNativeDriver: true }),
    Animated.timing(shakeAnim, { toValue: -10, duration: 55, useNativeDriver: true }),
    Animated.timing(shakeAnim, { toValue: 8,   duration: 55, useNativeDriver: true }),
    Animated.timing(shakeAnim, { toValue: 0,   duration: 55, useNativeDriver: true }),
  ]).start();

  const validate = () => {
    const errs = {};
    if (!name.trim())     errs.name     = 'Le nom est requis';
    if (!email.trim())    errs.email    = "L'email est requis";
    else if (!/\S+@\S+\.\S+/.test(email)) errs.email = 'Email invalide';
    if (!password)        errs.password = 'Le mot de passe est requis';
    else if (password.length < 6) errs.password = '6 caractères minimum requis';
    if (!confirm)         errs.confirm  = 'Confirme ton mot de passe';
    else if (password !== confirm) errs.confirm = 'Les mots de passe ne correspondent pas';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) { shake(); return; }
    setLoading(true);
    const result = await register(name.trim(), email.trim().toLowerCase(), password, phone.trim());
    setLoading(false);
    if (!result.success) {
      shake();
      setErrors({ global: result.error || "Impossible de créer le compte." });
    }
  };

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" />

      {/* ── Hero ── */}
      <LinearGradient
        colors={['#1C2B1E', '#3D5E41']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[s.hero, { paddingTop: insets.top + 16 }]}
      >
        <View style={s.glow1} pointerEvents="none" />
        <View style={[s.heroInner, { maxWidth: maxW, alignSelf: 'center', width: '100%' }]}>
          <TouchableOpacity
            style={s.backBtn}
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            activeOpacity={0.7}
          >
            <Feather name="arrow-left" size={20} color="rgba(255,255,255,0.9)" />
          </TouchableOpacity>
          <View style={s.heroBadgeRow}>
            <View style={s.logoBadge}>
              <PawIcon size={24} color="#FFF" />
            </View>
          </View>
          <Text style={s.heroTitle}>Rejoindre{'\n'}patoune <Text style={s.heroAccent}>!</Text></Text>
          <Text style={s.heroSub}>Compte gratuit · 30 secondes</Text>
        </View>
      </LinearGradient>

      {/* ── Formulaire ── */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={s.scrollView}
          contentContainerStyle={[s.scrollContent, { paddingBottom: insets.bottom + 48 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            style={[
              s.card,
              { maxWidth: maxW, alignSelf: 'center', width: '100%' },
              { opacity: fadeAnim, transform: [{ translateY: slideAnim }, { translateX: shakeAnim }] },
            ]}
          >
            {/* Erreur globale */}
            {errors.global ? (
              <View style={s.errorBanner}>
                <Feather name="alert-circle" size={15} color={colors.error} />
                <Text style={s.errorBannerText}>{errors.global}</Text>
              </View>
            ) : null}

            {/* Section identité */}
            <Text style={s.sectionLabel}>Identité</Text>
            <Field
              label="Nom complet" icon="user" fieldKey="name"
              value={name} onChangeText={(v) => { setName(v); setErrors((e) => ({ ...e, name: null })); }}
              placeholder="Votre prénom et nom"
              focusedKey={focused} setFocused={setFocused}
              autoCapitalize="words"
              returnKeyType="next"
              onSubmitEditing={() => emailRef.current?.focus()}
              error={errors.name}
            />
            <Field
              label="Adresse email" icon="mail" fieldKey="email"
              value={email} onChangeText={(v) => { setEmail(v); setErrors((e) => ({ ...e, email: null })); }}
              placeholder="votre@email.com"
              focusedKey={focused} setFocused={setFocused}
              keyboardType="email-address"
              inputRef={emailRef}
              returnKeyType="next"
              onSubmitEditing={() => phoneRef.current?.focus()}
              error={errors.email}
            />
            <Field
              label="Téléphone (optionnel)" icon="phone" fieldKey="phone"
              value={phone} onChangeText={setPhone}
              placeholder="06 12 34 56 78"
              focusedKey={focused} setFocused={setFocused}
              keyboardType="phone-pad"
              inputRef={phoneRef}
              returnKeyType="next"
              onSubmitEditing={() => pwdRef.current?.focus()}
            />

            {/* Divider */}
            <View style={s.sectionDivider} />

            {/* Section sécurité */}
            <Text style={s.sectionLabel}>Sécurité</Text>
            <Field
              label="Mot de passe" icon="lock" fieldKey="password"
              value={password}
              onChangeText={(v) => { setPassword(v); setErrors((e) => ({ ...e, password: null })); }}
              placeholder="Minimum 6 caractères"
              focusedKey={focused} setFocused={setFocused}
              secureTextEntry={!showPwd}
              inputRef={pwdRef}
              returnKeyType="next"
              onSubmitEditing={() => confirmRef.current?.focus()}
              error={errors.password}
              right={
                <TouchableOpacity onPress={() => setShowPwd(!showPwd)} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                  <Feather name={showPwd ? 'eye-off' : 'eye'} size={18} color={colors.textLight} />
                </TouchableOpacity>
              }
            />

            {/* Barre de force */}
            {strength && (
              <View style={s.strengthRow}>
                <View style={s.strengthTrack}>
                  <View style={[s.strengthFill, { width: strength.width, backgroundColor: strength.color }]} />
                </View>
                <Text style={[s.strengthLabel, { color: strength.color }]}>{strength.label}</Text>
              </View>
            )}

            <Field
              label="Confirmer le mot de passe" icon="shield" fieldKey="confirm"
              value={confirm}
              onChangeText={(v) => { setConfirm(v); setErrors((e) => ({ ...e, confirm: null })); }}
              placeholder="Retape ton mot de passe"
              focusedKey={focused} setFocused={setFocused}
              secureTextEntry={!showConfirm}
              inputRef={confirmRef}
              returnKeyType="done"
              onSubmitEditing={handleRegister}
              error={errors.confirm}
              right={
                <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                  <Feather name={showConfirm ? 'eye-off' : 'eye'} size={18} color={colors.textLight} />
                </TouchableOpacity>
              }
            />

            {/* Confirmation match */}
            {confirm.length > 0 && password.length > 0 && (
              <View style={[s.matchRow, password === confirm ? s.matchOk : s.matchFail]}>
                <Feather name={password === confirm ? 'check-circle' : 'x-circle'} size={14} color={password === confirm ? colors.success : colors.error} />
                <Text style={[s.matchText, { color: password === confirm ? colors.success : colors.error }]}>
                  {password === confirm ? 'Les mots de passe correspondent' : 'Les mots de passe ne correspondent pas'}
                </Text>
              </View>
            )}

            {/* CTA */}
            <TouchableOpacity
              onPress={handleRegister}
              disabled={loading}
              activeOpacity={0.88}
              style={[s.ctaWrap, loading && { opacity: 0.75 }]}
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
                      <Text style={s.ctaText}>Créer mon compte</Text>
                      <Feather name="arrow-right" size={20} color="#FFF" />
                    </>
                  )
                }
              </LinearGradient>
            </TouchableOpacity>

            {/* Lien connexion */}
            <View style={s.divider}>
              <View style={s.dividerLine} />
              <Text style={s.dividerLabel}>ou</Text>
              <View style={s.dividerLine} />
            </View>
            <TouchableOpacity
              style={s.linkRow}
              onPress={() => navigation.goBack()}
              activeOpacity={0.7}
            >
              <Text style={s.linkText}>Déjà un compte ?</Text>
              <View style={s.linkBadge}>
                <Text style={s.linkBadgeText}>Se connecter</Text>
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
    paddingBottom: SPACING['2xl'],
    overflow: 'hidden',
  },
  glow1: {
    position: 'absolute', top: -60, right: -60,
    width: 200, height: 200, borderRadius: 100,
    backgroundColor: 'rgba(107,143,113,0.10)',
  },
  heroInner: {},
  backBtn: {
    width: 40, height: 40,
    borderRadius: RADIUS.lg,
    backgroundColor: 'rgba(255,255,255,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
  },
  heroBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.base,
  },
  logoBadge: {
    width: 48, height: 48,
    borderRadius: RADIUS.xl,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: {
    fontFamily: FONTS.brand,
    fontSize: FONT_SIZE['2xl'],
    color: '#FFF',
    letterSpacing: -0.8,
    lineHeight: FONT_SIZE['2xl'] * 1.2,
    marginBottom: SPACING.sm,
  },
  heroAccent: { color: '#8CB092' },
  heroSub: {
    fontFamily: FONTS.bodyMedium,
    fontSize: FONT_SIZE.sm,
    color: 'rgba(255,255,255,0.5)',
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
  },

  // Section labels
  sectionLabel: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZE.xs,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: SPACING.base,
  },
  sectionDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: SPACING.lg,
  },

  // Fields
  fieldWrap: { marginBottom: SPACING.base },
  label: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZE.xs,
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
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
  fieldRowError: {
    borderColor: colors.error,
    backgroundColor: '#FFF5F5',
  },
  fieldIcon: { marginRight: SPACING.sm },
  input: {
    flex: 1,
    fontFamily: FONTS.bodyMedium,
    fontSize: FONT_SIZE.base,
    color: colors.text,
    paddingVertical: 0,
  },
  fieldError: {
    fontFamily: FONTS.bodyMedium,
    fontSize: FONT_SIZE.xs,
    color: colors.error,
    marginTop: 5,
    marginLeft: 4,
  },

  // Strength
  strengthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginTop: -SPACING.sm,
    marginBottom: SPACING.base,
  },
  strengthTrack: {
    flex: 1,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: RADIUS.full,
    overflow: 'hidden',
  },
  strengthFill: {
    height: '100%',
    borderRadius: RADIUS.full,
  },
  strengthLabel: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: FONT_SIZE.xs,
    width: 58,
    textAlign: 'right',
  },

  // Match indicator
  matchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    marginTop: -SPACING.sm,
    marginBottom: SPACING.sm,
  },
  matchOk:   { backgroundColor: colors.successSoft || '#EFF5F0' },
  matchFail: { backgroundColor: colors.errorSoft || '#FBE8E4' },
  matchText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: FONT_SIZE.xs,
  },

  // CTA
  ctaWrap: {
    marginTop: SPACING.sm,
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
  },
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

  // Divider / link
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: SPACING.xl,
    gap: SPACING.base,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerLabel: {
    fontFamily: FONTS.bodyMedium,
    fontSize: FONT_SIZE.sm,
    color: colors.textLight,
  },
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

export default RegisterScreen;
