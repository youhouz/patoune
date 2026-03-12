// ═══════════════════════════════════════════════════════════════════════════
// Pépète v7.0 — RegisterScreen (Dark Premium 2027)
// ═══════════════════════════════════════════════════════════════════════════
import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, ScrollView,
  StatusBar, Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/Button';
import useResponsive from '../../hooks/useResponsive';
import { showAlert } from '../../utils/alert';
const { COLORS, RADIUS, FONT_SIZE } = require('../../utils/colors');

// ── Premium dark input field (re-used pattern)
const DarkInput = ({ label, icon, value, onChangeText, placeholder, secureTextEntry, toggle, keyboardType, autoCapitalize }) => {
  const [focused, setFocused] = useState(false);
  const borderAnim = useRef(new Animated.Value(0)).current;

  const onFocus = () => {
    setFocused(true);
    Animated.timing(borderAnim, { toValue: 1, duration: 220, useNativeDriver: false }).start();
  };
  const onBlur  = () => {
    setFocused(false);
    Animated.timing(borderAnim, { toValue: 0, duration: 220, useNativeDriver: false }).start();
  };

  const borderColor = borderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [COLORS.border, COLORS.primary],
  });

  return (
    <View style={s.group}>
      <Text style={s.label}>{label}</Text>
      <Animated.View style={[s.wrapper, { borderColor }]}>
        <Feather name={icon} size={18} color={focused ? COLORS.primary : COLORS.textTertiary} style={{ marginRight: 12 }} />
        <TextInput
          style={s.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={COLORS.placeholder}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType || 'default'}
          autoCapitalize={autoCapitalize || 'none'}
          autoCorrect={false}
          onFocus={onFocus}
          onBlur={onBlur}
        />
        {toggle && (
          <TouchableOpacity onPress={toggle.onPress} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Feather name={toggle.icon} size={18} color={COLORS.textTertiary} />
          </TouchableOpacity>
        )}
      </Animated.View>
    </View>
  );
};

const s = StyleSheet.create({
  group: { marginBottom: 14 },
  label: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 8, letterSpacing: 0.3 },
  wrapper: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.surfaceHigh,
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    paddingHorizontal: 16,
    height: 56,
  },
  input: { flex: 1, fontSize: 16, color: COLORS.text, paddingVertical: 0, fontWeight: '500' },
});

// ═══════════════════════════════════════════════════════════
const RegisterScreen = ({ navigation }) => {
  const { register } = useAuth();
  const { isTablet, contentWidth } = useResponsive();
  const insets = useSafeAreaInsets();

  const [name,            setName]            = useState('');
  const [email,           setEmail]           = useState('');
  const [phone,           setPhone]           = useState('');
  const [password,        setPassword]        = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading,         setLoading]         = useState(false);
  const [showPwd,         setShowPwd]         = useState(false);
  const [showConfirm,     setShowConfirm]     = useState(false);

  const fadeIn  = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(40)).current;
  const formMaxWidth = isTablet ? Math.min(contentWidth, 480) : undefined;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeIn,  { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(slideUp, { toValue: 0, tension: 50, friction: 8, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleRegister = async () => {
    if (!name || !email || !password || !confirmPassword) {
      showAlert('Oups !', 'Remplis tous les champs obligatoires');
      return;
    }
    if (password !== confirmPassword) {
      showAlert('Erreur', 'Les mots de passe ne correspondent pas');
      return;
    }
    if (password.length < 6) {
      showAlert('Mot de passe trop court', 'Minimum 6 caractères');
      return;
    }
    setLoading(true);
    const result = await register({ name, email: email.trim().toLowerCase(), phone, password });
    setLoading(false);
    if (!result.success) showAlert('Inscription impossible', result.error);
  };

  const pwdStrength = password.length === 0 ? 0 : password.length < 6 ? 1 : password.length < 10 ? 2 : 3;
  const pwdColor = [COLORS.border, COLORS.error, COLORS.warning, COLORS.primary][pwdStrength];
  const pwdLabel = ['', 'Faible', 'Moyen', 'Fort'][pwdStrength];

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Ambient glow */}
      <LinearGradient
        colors={[COLORS.primaryGlow, 'transparent']}
        style={styles.glow}
        pointerEvents="none"
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[styles.scroll, { paddingBottom: Math.max(100, insets.bottom + 40) }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={true}
        >
          <Animated.View style={[
            styles.inner,
            formMaxWidth ? { maxWidth: formMaxWidth, alignSelf: 'center', width: '100%' } : null,
            { opacity: fadeIn, transform: [{ translateY: slideUp }] },
          ]}>

            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity
                style={styles.backBtn}
                onPress={() => navigation.goBack()}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Feather name="arrow-left" size={20} color={COLORS.text} />
              </TouchableOpacity>
              <View style={styles.headerText}>
                <Text style={styles.title}>Créer un compte</Text>
                <Text style={styles.subtitle}>Rejoins Pépète — C'est gratuit</Text>
              </View>
            </View>

            {/* Progress */}
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, {
                width: `${Math.min(100, ((name ? 20 : 0) + (email ? 20 : 0) + (phone ? 10 : 0) + (password.length >= 6 ? 25 : 0) + (confirmPassword && confirmPassword === password ? 25 : 0)))}%`,
              }]} />
            </View>

            {/* Form card */}
            <View style={styles.card}>
              <DarkInput label="Nom complet *" icon="user" value={name} onChangeText={setName} placeholder="Ton prénom et nom" autoCapitalize="words" />
              <DarkInput label="Email *" icon="mail" value={email} onChangeText={setEmail} placeholder="ton@email.com" keyboardType="email-address" />
              <DarkInput label="Téléphone (optionnel)" icon="phone" value={phone} onChangeText={setPhone} placeholder="06 12 34 56 78" keyboardType="phone-pad" />
              <DarkInput
                label="Mot de passe *" icon="lock"
                value={password} onChangeText={setPassword}
                placeholder="Minimum 6 caractères"
                secureTextEntry={!showPwd}
                toggle={{ icon: showPwd ? 'eye-off' : 'eye', onPress: () => setShowPwd(!showPwd) }}
              />

              {/* Password strength */}
              {password.length > 0 && (
                <View style={styles.strengthRow}>
                  <View style={styles.strengthTrack}>
                    <View style={[styles.strengthFill, {
                      width: `${[0, 33, 66, 100][pwdStrength]}%`,
                      backgroundColor: pwdColor,
                    }]} />
                  </View>
                  <Text style={[styles.strengthLabel, { color: pwdColor }]}>{pwdLabel}</Text>
                </View>
              )}

              <DarkInput
                label="Confirmer le mot de passe *" icon="shield"
                value={confirmPassword} onChangeText={setConfirmPassword}
                placeholder="Retape ton mot de passe"
                secureTextEntry={!showConfirm}
                toggle={{ icon: showConfirm ? 'eye-off' : 'eye', onPress: () => setShowConfirm(!showConfirm) }}
              />

              <Button
                title="Créer mon compte"
                onPress={handleRegister}
                loading={loading}
                size="lg"
                style={{ marginTop: 8 }}
              />
            </View>

            {/* Back to login */}
            <TouchableOpacity style={styles.loginBtn} onPress={() => navigation.goBack()}>
              <Text style={styles.loginText}>Déjà un compte ?</Text>
              <Text style={styles.loginBold}> Se connecter →</Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  glow: {
    position: 'absolute',
    top: -100, left: -100, right: -100,
    height: 400,
    opacity: 0.5,
  },
  scroll: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 60, paddingBottom: 40 },
  inner: {},

  header: { flexDirection: 'row', alignItems: 'flex-start', gap: 16, marginBottom: 28 },
  backBtn: {
    width: 44, height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.surfaceHigh,
    borderWidth: 1, borderColor: COLORS.border,
    alignItems: 'center', justifyContent: 'center',
    marginTop: 4,
  },
  headerText: { flex: 1 },
  title: { fontSize: 28, fontWeight: '900', color: COLORS.text, letterSpacing: -1 },
  subtitle: { fontSize: 15, color: COLORS.textSecondary, marginTop: 4 },

  progressBar: {
    height: 3,
    backgroundColor: COLORS.border,
    borderRadius: 2,
    marginBottom: 28,
    overflow: 'hidden',
  },
  progressFill: {
    height: 3,
    backgroundColor: COLORS.primary,
    borderRadius: 2,
  },

  card: {
    backgroundColor: COLORS.surfaceHigh,
    borderRadius: RADIUS['2xl'],
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 24,
    marginBottom: 20,
  },

  strengthRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: -6, marginBottom: 14 },
  strengthTrack: { flex: 1, height: 4, backgroundColor: COLORS.border, borderRadius: 2, overflow: 'hidden' },
  strengthFill: { height: 4, borderRadius: 2 },
  strengthLabel: { fontSize: 12, fontWeight: '700', minWidth: 42 },

  loginBtn: { flexDirection: 'row', justifyContent: 'center', paddingVertical: 14 },
  loginText: { fontSize: 15, color: COLORS.textSecondary },
  loginBold: { fontSize: 15, color: COLORS.primary, fontWeight: '700' },
});

export default RegisterScreen;
