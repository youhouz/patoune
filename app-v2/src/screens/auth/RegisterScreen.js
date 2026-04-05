// ─────────────────────────────────────────────────────────────────────────────
// Pépète — RegisterScreen v4.0
// Scroll garanti sur tous les écrans + clavier
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Platform, StatusBar, Animated, ActivityIndicator, ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { PepeteIcon } from '../../components/PepeteLogo';
import useResponsive from '../../hooks/useResponsive';
import { FONTS } from '../../utils/typography';
const colors = require('../../utils/colors');
const { SHADOWS, RADIUS, SPACING, FONT_SIZE } = require('../../utils/colors');

// ─── Password strength ──────────────────────────────────────────────────────
const getPwdStrength = (pwd) => {
  if (!pwd) return null;
  const len = pwd.length;
  const hasUpper = /[A-Z]/.test(pwd);
  const hasNum   = /[0-9]/.test(pwd);
  const hasSpec  = /[^A-Za-z0-9]/.test(pwd);
  const score = (len >= 8 ? 1 : 0) + (len >= 12 ? 1 : 0) + (hasUpper ? 1 : 0) + (hasNum ? 1 : 0) + (hasSpec ? 1 : 0);
  if (len < 6)   return { label: 'Trop court', color: colors.error,      width: '15%' };
  if (score <= 2) return { label: 'Faible',     color: '#E57373',         width: '33%' };
  if (score <= 3) return { label: 'Moyen',      color: '#FFB74D',         width: '60%' };
  if (score <= 4) return { label: 'Fort',       color: colors.primary,    width: '82%' };
  return             { label: 'Excellent',  color: colors.primaryDark, width: '100%' };
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
  const [referral, setReferral]  = useState('');
  const [roles,    setRoles]    = useState({ user: true, guardian: false });
  const [showPwd,  setShowPwd]  = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [focused,  setFocused]  = useState(null);
  const [errors,   setErrors]   = useState({});

  const slideAnim = useRef(new Animated.Value(30)).current;
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const emailRef   = useRef(null);
  const phoneRef   = useRef(null);
  const pwdRef     = useRef(null);
  const confirmRef = useRef(null);
  const scrollRef  = useRef(null);

  const maxW = isTablet ? Math.min(contentWidth, 520) : '100%';
  const strength = getPwdStrength(password);

  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideAnim, { toValue: 0, tension: 55, friction: 8, delay: 100, useNativeDriver: true }),
      Animated.timing(fadeAnim,  { toValue: 1, duration: 450, delay: 100, useNativeDriver: true }),
    ]).start();
    // Auto-fill referral code from deep link
    AsyncStorage.getItem('pending_referral_code').then(code => {
      if (code) {
        setReferral(code);
        AsyncStorage.removeItem('pending_referral_code');
      }
    }).catch(() => {});
  }, []);

  const shake = () => Animated.sequence([
    Animated.timing(shakeAnim, { toValue: 10,  duration: 55, useNativeDriver: true }),
    Animated.timing(shakeAnim, { toValue: -10, duration: 55, useNativeDriver: true }),
    Animated.timing(shakeAnim, { toValue: 8,   duration: 55, useNativeDriver: true }),
    Animated.timing(shakeAnim, { toValue: 0,   duration: 55, useNativeDriver: true }),
  ]).start();

  const validate = () => {
    const errs = {};
    if (!name.trim())     errs.name     = 'Entre ton prénom et nom';
    if (!email.trim())    errs.email    = "Entre ton adresse email";
    else if (!/\S+@\S+\.\S+/.test(email.trim())) errs.email = 'Format email invalide (ex: nom@email.com)';
    if (!password)        errs.password = 'Entre un mot de passe';
    else if (password.length < 6) errs.password = `Trop court (${password.length}/6 caractères minimum)`;
    if (!confirm)         errs.confirm  = 'Confirme ton mot de passe';
    else if (password !== confirm) errs.confirm = 'Les mots de passe ne correspondent pas';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const toggleRole = (r) => {
    setRoles(prev => {
      const next = { ...prev, [r]: !prev[r] };
      if (!next.user && !next.guardian) return prev;
      return next;
    });
  };

  const getFinalRole = () => {
    if (roles.user && roles.guardian) return 'both';
    if (roles.guardian) return 'guardian';
    return 'user';
  };

  const handleRegister = async () => {
    if (!validate()) { shake(); return; }
    setLoading(true);
    try {
      const result = await register({ name: name.trim(), email: email.trim().toLowerCase(), password, phone: phone.trim(), role: getFinalRole(), referralCode: referral.trim() || undefined });
      setLoading(false);
      if (result.success) {
        const parent = navigation.getParent()?.getParent();
        if (parent) {
          parent.reset({ index: 0, routes: [{ name: 'Tabs' }] });
        } else {
          navigation.getParent()?.reset({ index: 0, routes: [{ name: 'Tabs' }] });
        }
      } else {
        shake();
        setErrors({ global: result.error || "Impossible de créer le compte." });
      }
    } catch (e) {
      setLoading(false);
      shake();
      setErrors({ global: `Erreur inattendue: ${e.message || e}` });
    }
  };

  const renderField = ({ label, icon, fieldKey, value, onChangeText, placeholder, keyboardType, secureTextEntry, right, autoCapitalize, returnKeyType, onSubmitEditing, inputRef, error }) => {
    const isFocused = focused === fieldKey;
    return (
      <View style={s.fieldWrap}>
        <Text style={s.label}>{label}</Text>
        <View style={[s.fieldRow, isFocused && s.fieldRowFocused, error && s.fieldRowError]}>
          <Feather name={icon} size={18} color={error ? colors.error : isFocused ? colors.primary : colors.textLight} style={{ marginRight: SPACING.sm }} />
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
            onFocus={() => { setFocused(fieldKey); }}
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

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" />

      <View style={{ flex: 1 }}>
        <ScrollView
          ref={scrollRef}
          style={StyleSheet.absoluteFill}
          bounces={true}
          overScrollMode="always"
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          showsVerticalScrollIndicator={true}
          contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 20) + 60 }}
          automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
        >
          {/* ── Hero ── */}
          <LinearGradient
            colors={['#1C2B1E', '#2C3E2F', '#3D5E41']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={s.hero}
          >
            <View style={s.glow1} pointerEvents="none" />
            <View style={s.glow2} pointerEvents="none" />
            <View style={[s.heroInner, { maxWidth: maxW, alignSelf: 'center', width: '100%' }]}>
              <TouchableOpacity
                style={s.backBtn}
                onPress={() => navigation.goBack()}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                activeOpacity={0.7}
              >
                <Feather name="arrow-left" size={20} color="rgba(255,255,255,0.9)" />
              </TouchableOpacity>
              <View style={s.logoBadge}>
                <PepeteIcon size={44} color="#FFF" />
              </View>
              <Text style={s.logoWord}>pépète.</Text>
              <Text style={s.heroTitle}>Créer un compte <Text style={s.heroAccent}>!</Text></Text>
              <Text style={s.heroSub}>Compte gratuit · 30 secondes</Text>
            </View>
          </LinearGradient>

          {/* ── Formulaire ── */}
          <View style={s.formArea}>
            <Animated.View
              style={[
                s.card,
                { maxWidth: maxW, alignSelf: 'center', width: '100%' },
                { opacity: fadeAnim, transform: [{ translateY: slideAnim }, { translateX: shakeAnim }] },
              ]}
            >
              <Text style={s.cardTitle}>Inscription</Text>

              {errors.global ? (
                <View style={s.errorBanner}>
                  <Feather name="alert-circle" size={15} color={colors.error} />
                  <Text style={s.errorBannerText}>{errors.global}</Text>
                </View>
              ) : null}

              {/* ── Identité ── */}
              <Text style={s.sectionLabel}>Identité</Text>

              {renderField({
                label: 'Nom complet', icon: 'user', fieldKey: 'name',
                value: name, onChangeText: (v) => { setName(v); setErrors(e => ({ ...e, name: null })); },
                placeholder: 'Votre prénom et nom', autoCapitalize: 'words',
                onSubmitEditing: () => emailRef.current?.focus(), error: errors.name,
              })}
              {renderField({
                label: 'Adresse email', icon: 'mail', fieldKey: 'email',
                value: email, onChangeText: (v) => { setEmail(v); setErrors(e => ({ ...e, email: null })); },
                placeholder: 'votre@email.com', keyboardType: 'email-address', inputRef: emailRef,
                onSubmitEditing: () => phoneRef.current?.focus(), error: errors.email,
              })}
              {renderField({
                label: 'Téléphone (optionnel)', icon: 'phone', fieldKey: 'phone',
                value: phone, onChangeText: setPhone,
                placeholder: '06 12 34 56 78', keyboardType: 'phone-pad', inputRef: phoneRef,
                onSubmitEditing: () => pwdRef.current?.focus(),
              })}

              <View style={s.sectionDivider} />

              {/* ── Rôle ── */}
              <Text style={s.sectionLabel}>Je suis</Text>
              <Text style={s.roleHint}>Tu peux choisir les deux !</Text>
              <View style={s.roleRow}>
                <TouchableOpacity
                  style={[s.roleOption, roles.user && s.roleOptionActive]}
                  onPress={() => toggleRole('user')} activeOpacity={0.8}
                >
                  <View style={[s.roleIconWrap, roles.user && s.roleIconWrapActive]}>
                    <Feather name="heart" size={20} color={roles.user ? '#FFF' : colors.primary} />
                  </View>
                  <Text style={[s.roleLabel, roles.user && s.roleLabelActive]}>Propriétaire</Text>
                  <Text style={s.roleDesc}>J'ai un animal</Text>
                  {roles.user && (
                    <View style={s.roleCheck}>
                      <Feather name="check" size={14} color={colors.primary} />
                    </View>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={[s.roleOption, roles.guardian && s.roleOptionActive]}
                  onPress={() => toggleRole('guardian')} activeOpacity={0.8}
                >
                  <View style={[s.roleIconWrap, roles.guardian && s.roleIconWrapActive]}>
                    <Feather name="home" size={20} color={roles.guardian ? '#FFF' : colors.primary} />
                  </View>
                  <Text style={[s.roleLabel, roles.guardian && s.roleLabelActive]}>Pet-sitter</Text>
                  <Text style={s.roleDesc}>Je garde des animaux</Text>
                  {roles.guardian && (
                    <View style={s.roleCheck}>
                      <Feather name="check" size={14} color={colors.primary} />
                    </View>
                  )}
                </TouchableOpacity>
              </View>

              <View style={s.sectionDivider} />

              {/* ── Sécurité ── */}
              <Text style={s.sectionLabel}>Sécurité</Text>

              {renderField({
                label: 'Mot de passe', icon: 'lock', fieldKey: 'password',
                value: password, onChangeText: (v) => { setPassword(v); setErrors(e => ({ ...e, password: null })); },
                placeholder: 'Minimum 6 caractères', secureTextEntry: !showPwd, inputRef: pwdRef,
                onSubmitEditing: () => confirmRef.current?.focus(), error: errors.password,
                right: (
                  <TouchableOpacity onPress={() => setShowPwd(!showPwd)} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                    <Feather name={showPwd ? 'eye-off' : 'eye'} size={18} color={colors.textLight} />
                  </TouchableOpacity>
                ),
              })}

              {strength && (
                <View style={s.strengthRow}>
                  <View style={s.strengthTrack}>
                    <View style={[s.strengthFill, { width: strength.width, backgroundColor: strength.color }]} />
                  </View>
                  <Text style={[s.strengthLabel, { color: strength.color }]}>{strength.label}</Text>
                </View>
              )}

              {renderField({
                label: 'Confirmer le mot de passe', icon: 'shield', fieldKey: 'confirm',
                value: confirm, onChangeText: (v) => { setConfirm(v); setErrors(e => ({ ...e, confirm: null })); },
                placeholder: 'Retape ton mot de passe', secureTextEntry: !showConfirm, inputRef: confirmRef,
                returnKeyType: 'done', onSubmitEditing: handleRegister, error: errors.confirm,
                right: (
                  <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                    <Feather name={showConfirm ? 'eye-off' : 'eye'} size={18} color={colors.textLight} />
                  </TouchableOpacity>
                ),
              })}

              {confirm.length > 0 && password.length > 0 && (
                <View style={[s.matchRow, password === confirm ? s.matchOk : s.matchFail]}>
                  <Feather name={password === confirm ? 'check-circle' : 'x-circle'} size={14} color={password === confirm ? colors.success : colors.error} />
                  <Text style={[s.matchText, { color: password === confirm ? colors.success : colors.error }]}>
                    {password === confirm ? 'Les mots de passe correspondent' : 'Les mots de passe ne correspondent pas'}
                  </Text>
                </View>
              )}

              {/* Referral code (optional) */}
              {renderField({
                label: 'Code parrainage (optionnel)', icon: 'gift', fieldKey: 'referral',
                value: referral, onChangeText: setReferral,
                placeholder: 'Ex: PEP1234', autoCapitalize: 'characters',
                returnKeyType: 'done', onSubmitEditing: handleRegister,
              })}

              {/* CTA */}
              <TouchableOpacity
                onPress={handleRegister} disabled={loading} activeOpacity={0.88}
                style={[s.ctaWrap, loading && { opacity: 0.75 }]}
              >
                <LinearGradient
                  colors={loading ? [colors.textLight, colors.textTertiary] : [colors.primaryDark, colors.primary]}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={s.cta}
                >
                  {loading
                    ? <ActivityIndicator size="small" color="#FFF" />
                    : <>
                        <Text style={s.ctaText}>Créer mon compte</Text>
                        <Feather name="arrow-right" size={20} color="#FFF" />
                      </>
                  }
                </LinearGradient>
              </TouchableOpacity>

              <View style={s.divider}>
                <View style={s.dividerLine} />
                <Text style={s.dividerLabel}>ou</Text>
                <View style={s.dividerLine} />
              </View>

              <TouchableOpacity style={s.linkRow} onPress={() => navigation.goBack()} activeOpacity={0.7}>
                <Text style={s.linkText}>Déjà un compte ?</Text>
                <View style={s.linkBadge}>
                  <Text style={s.linkBadgeText}>Se connecter</Text>
                  <Feather name="chevron-right" size={14} color={colors.primary} />
                </View>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </ScrollView>
      </View>
    </View>
  );
};

// ─── Styles ──────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#1C2B1E' },

  // Hero
  hero: {
    paddingTop: 16,
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
  heroInner: { alignItems: 'flex-start' },
  backBtn: {
    width: 40, height: 40, borderRadius: RADIUS.lg,
    backgroundColor: 'rgba(255,255,255,0.10)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: SPACING.base,
  },
  logoBadge: {
    width: 56, height: 56, borderRadius: RADIUS.xl,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: SPACING.base,
  },
  logoWord: {
    fontFamily: FONTS.brand, fontSize: FONT_SIZE.sm,
    color: 'rgba(255,255,255,0.5)', letterSpacing: 2,
    textTransform: 'uppercase', marginBottom: SPACING.lg,
  },
  heroTitle: {
    fontFamily: FONTS.brand, fontSize: FONT_SIZE['3xl'],
    color: '#FFF', letterSpacing: -1,
    lineHeight: FONT_SIZE['3xl'] * 1.1, marginBottom: SPACING.sm,
  },
  heroAccent: { color: '#8CB092' },
  heroSub: {
    fontFamily: FONTS.bodyMedium, fontSize: FONT_SIZE.base,
    color: 'rgba(255,255,255,0.55)',
  },

  // Form area
  formArea: {
    backgroundColor: colors.background,
    paddingTop: SPACING.xl,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xl,
  },

  // Card
  card: {
    backgroundColor: colors.white,
    borderRadius: RADIUS['2xl'],
    padding: SPACING.xl,
    ...SHADOWS.lg,
  },
  cardTitle: {
    fontFamily: FONTS.heading, fontSize: FONT_SIZE['2xl'],
    color: colors.text, letterSpacing: -0.5, marginBottom: SPACING.xl,
  },

  // Error
  errorBanner: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    backgroundColor: colors.errorSoft || '#FBE8E4',
    borderRadius: RADIUS.lg, padding: SPACING.md,
    marginBottom: SPACING.base,
    borderLeftWidth: 3, borderLeftColor: colors.error,
  },
  errorBannerText: {
    flex: 1, fontFamily: FONTS.bodyMedium, fontSize: FONT_SIZE.sm, color: colors.error,
  },

  // Section
  sectionLabel: {
    fontFamily: FONTS.bodySemiBold, fontSize: FONT_SIZE.xs,
    color: colors.textSecondary, textTransform: 'uppercase',
    letterSpacing: 0.8, marginBottom: SPACING.base,
  },
  sectionDivider: { height: 1, backgroundColor: colors.border, marginVertical: SPACING.lg },

  // Fields
  fieldWrap: { marginBottom: SPACING.base },
  label: {
    fontFamily: FONTS.bodySemiBold, fontSize: FONT_SIZE.xs,
    color: colors.textTertiary, textTransform: 'uppercase',
    letterSpacing: 0.6, marginBottom: SPACING.sm,
  },
  fieldRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: RADIUS.lg, paddingHorizontal: SPACING.base,
    height: 54, borderWidth: 1.5, borderColor: colors.border,
  },
  fieldRowFocused: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryUltra || '#F5FAF6',
  },
  fieldRowError: { borderColor: colors.error, backgroundColor: '#FFF5F5' },
  input: {
    flex: 1, fontFamily: FONTS.bodyMedium, fontSize: FONT_SIZE.base,
    color: colors.text, paddingVertical: 0,
  },
  fieldError: {
    fontFamily: FONTS.bodyMedium, fontSize: FONT_SIZE.xs,
    color: colors.error, marginTop: 5, marginLeft: 4,
  },

  // Strength
  strengthRow: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.md,
    marginTop: -SPACING.sm, marginBottom: SPACING.base,
  },
  strengthTrack: {
    flex: 1, height: 4, backgroundColor: colors.border,
    borderRadius: RADIUS.full, overflow: 'hidden',
  },
  strengthFill: { height: '100%', borderRadius: RADIUS.full },
  strengthLabel: {
    fontFamily: FONTS.bodySemiBold, fontSize: FONT_SIZE.xs, width: 58, textAlign: 'right',
  },

  // Match
  matchRow: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md, marginTop: -SPACING.sm, marginBottom: SPACING.sm,
  },
  matchOk:   { backgroundColor: colors.successSoft || '#EFF5F0' },
  matchFail: { backgroundColor: colors.errorSoft || '#FBE8E4' },
  matchText: { fontFamily: FONTS.bodyMedium, fontSize: FONT_SIZE.xs },

  // Role
  roleRow: { flexDirection: 'row', gap: SPACING.base, marginBottom: SPACING.base },
  roleOption: {
    flex: 1, alignItems: 'center',
    paddingVertical: SPACING.base, paddingHorizontal: SPACING.sm,
    borderRadius: RADIUS.xl, borderWidth: 2,
    borderColor: colors.border, backgroundColor: colors.background,
  },
  roleOptionActive: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  roleIconWrap: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: colors.primarySoft,
    alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.sm,
  },
  roleIconWrapActive: { backgroundColor: colors.primary },
  roleLabel: {
    fontFamily: FONTS.heading, fontSize: FONT_SIZE.base, color: colors.text, marginBottom: 2,
  },
  roleLabelActive: { color: colors.primaryDark },
  roleDesc: {
    fontFamily: FONTS.body, fontSize: FONT_SIZE.xs,
    color: colors.textSecondary, textAlign: 'center',
  },
  roleHint: {
    fontFamily: FONTS.bodyMedium, fontSize: FONT_SIZE.xs,
    color: colors.primary, marginBottom: SPACING.base,
    fontStyle: 'italic',
  },
  roleCheck: {
    position: 'absolute', top: 8, right: 8,
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: colors.primarySoft,
    alignItems: 'center', justifyContent: 'center',
  },

  // CTA
  ctaWrap: { marginTop: SPACING.sm, borderRadius: RADIUS.xl, overflow: 'hidden' },
  cta: {
    height: 56, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: SPACING.sm, borderRadius: RADIUS.xl,
  },
  ctaText: {
    fontFamily: FONTS.heading, fontSize: FONT_SIZE.md, color: '#FFF', letterSpacing: 0.2,
  },

  // Divider
  divider: {
    flexDirection: 'row', alignItems: 'center',
    marginVertical: SPACING.xl, gap: SPACING.base,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerLabel: {
    fontFamily: FONTS.bodyMedium, fontSize: FONT_SIZE.sm, color: colors.textLight,
  },

  // Link
  linkRow: { alignItems: 'center', gap: SPACING.sm },
  linkText: {
    fontFamily: FONTS.body, fontSize: FONT_SIZE.sm, color: colors.textSecondary,
  },
  linkBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: colors.primarySoft,
    paddingHorizontal: SPACING.base, paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
  },
  linkBadgeText: {
    fontFamily: FONTS.bodySemiBold, fontSize: FONT_SIZE.sm, color: colors.primary,
  },
});

export default RegisterScreen;
