// ═══════════════════════════════════════════════════════════════════════════
// Pépète v7.0 — LoginScreen (Dark Premium 2027)
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
import { PepeteIcon } from '../../components/PepeteLogo';
import useResponsive from '../../hooks/useResponsive';
import { showAlert } from '../../utils/alert';
const { COLORS, RADIUS, SPACING, FONT_SIZE } = require('../../utils/colors');

// ── Premium dark input field
const DarkInput = ({ label, icon, value, onChangeText, placeholder, secureTextEntry, toggle, keyboardType, autoCapitalize, autoComplete }) => {
  const [focused, setFocused] = useState(false);
  const borderAnim = useRef(new Animated.Value(0)).current;

  const onFocus = () => {
    setFocused(true);
    Animated.timing(borderAnim, { toValue: 1, duration: 220, useNativeDriver: false }).start();
  };
  const onBlur = () => {
    setFocused(false);
    Animated.timing(borderAnim, { toValue: 0, duration: 220, useNativeDriver: false }).start();
  };

  const borderColor = borderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [COLORS.border, COLORS.primary],
  });

  return (
    <View style={inputStyles.group}>
      <Text style={inputStyles.label}>{label}</Text>
      <Animated.View style={[inputStyles.wrapper, { borderColor }]}>
        <Feather name={icon} size={18} color={focused ? COLORS.primary : COLORS.textTertiary} style={{ marginRight: 12 }} />
        <TextInput
          style={inputStyles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={COLORS.placeholder}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType || 'default'}
          autoCapitalize={autoCapitalize || 'none'}
          autoComplete={autoComplete}
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

const inputStyles = StyleSheet.create({
  group: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 8, letterSpacing: 0.3 },
  wrapper: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.surfaceHigh,
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    paddingHorizontal: 16,
    height: 58,
  },
  input: {
    flex: 1, fontSize: 16, color: COLORS.text,
    paddingVertical: 0, fontWeight: '500',
  },
});

// ═══════════════════════════════════════════════════════════
const LoginScreen = ({ navigation }) => {
  const { login } = useAuth();
  const { isTablet, contentWidth } = useResponsive();
  const insets = useSafeAreaInsets();
  
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [showPwd, setShowPwd]   = useState(false);

  const fadeIn  = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(40)).current;
  const formMaxWidth = isTablet ? Math.min(contentWidth, 480) : undefined;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeIn,  { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(slideUp, { toValue: 0, tension: 50, friction: 8, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleLogin = async () => {
    if (!email || !password) {
      showAlert('Oups !', 'Remplis tous les champs pour continuer');
      return;
    }
    setLoading(true);
    const result = await login(email.trim().toLowerCase(), password);
    setLoading(false);
    if (!result.success) showAlert('Connexion impossible', result.error);
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* ── Ambient glow ── */}
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
        >
          <Animated.View style={[
            styles.inner,
            formMaxWidth ? { maxWidth: formMaxWidth, alignSelf: 'center', width: '100%' } : null,
            { opacity: fadeIn, transform: [{ translateY: slideUp }] },
          ]}>

            {/* ── Logo block ── */}
            <View style={styles.logoBlock}>
              <View style={styles.logoGlow}>
                <PepeteIcon size={56} color={COLORS.primary} />
              </View>
              <Text style={styles.brand}>Pépète</Text>
              <Text style={styles.tagline}>Content de vous revoir</Text>
            </View>

            {/* ── Glass card ── */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Connexion</Text>

              <DarkInput
                label="Adresse email"
                icon="mail"
                value={email}
                onChangeText={setEmail}
                placeholder="votre@email.com"
                keyboardType="email-address"
                autoComplete="email"
              />
              <DarkInput
                label="Mot de passe"
                icon="lock"
                value={password}
                onChangeText={setPassword}
                placeholder="Votre mot de passe"
                secureTextEntry={!showPwd}
                toggle={{ icon: showPwd ? 'eye-off' : 'eye', onPress: () => setShowPwd(!showPwd) }}
              />

              <TouchableOpacity style={styles.forgotBtn} onPress={() => {}}>
                <Text style={styles.forgotText}>Mot de passe oublié ?</Text>
              </TouchableOpacity>

              <Button
                title="Se connecter"
                onPress={handleLogin}
                loading={loading}
                size="lg"
                style={{ marginTop: 8 }}
              />
            </View>

            {/* ── Divider ── */}
            <View style={styles.divRow}>
              <View style={styles.divLine} />
              <Text style={styles.divText}>ou</Text>
              <View style={styles.divLine} />
            </View>

            {/* ── Register link ── */}
            <TouchableOpacity style={styles.registerBtn} onPress={() => navigation.navigate('Register')}>
              <Text style={styles.registerText}>Pas encore de compte ?</Text>
              <Text style={styles.registerBold}> Créer un compte →</Text>
            </TouchableOpacity>

            {/* ── Guest ── */}
            <TouchableOpacity style={styles.guestBtn} onPress={() => navigation.getParent()?.navigate?.('MainTabs')}>
              <Text style={styles.guestText}>Continuer sans compte</Text>
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
    opacity: 0.6,
  },
  scroll: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 80, paddingBottom: 40 },
  inner: {},

  // Logo
  logoBlock: { alignItems: 'center', marginBottom: 40 },
  logoGlow: {
    width: 90, height: 90, borderRadius: 26,
    backgroundColor: COLORS.primarySoft,
    borderWidth: 1,
    borderColor: COLORS.primary + '30',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 30,
  },
  brand: { fontSize: 32, fontWeight: '900', color: COLORS.text, letterSpacing: -1.5, marginBottom: 6 },
  tagline: { fontSize: 15, color: COLORS.textSecondary, fontWeight: '400' },

  // Card
  card: {
    backgroundColor: COLORS.surfaceHigh,
    borderRadius: RADIUS['2xl'],
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 24,
    marginBottom: 20,
  },
  cardTitle: { fontSize: 20, fontWeight: '800', color: COLORS.text, marginBottom: 24, letterSpacing: -0.5 },

  forgotBtn: { alignSelf: 'flex-end', marginBottom: 8, marginTop: -4 },
  forgotText: { fontSize: 13, color: COLORS.primary, fontWeight: '600' },

  // Divider
  divRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  divLine: { flex: 1, height: 1, backgroundColor: COLORS.border },
  divText: { fontSize: 13, color: COLORS.textTertiary, fontWeight: '500' },

  // Register
  registerBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: COLORS.surfaceHigh,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 12,
  },
  registerText: { fontSize: 15, color: COLORS.textSecondary, fontWeight: '400' },
  registerBold: { fontSize: 15, color: COLORS.primary, fontWeight: '700' },

  // Guest
  guestBtn: { alignItems: 'center', paddingVertical: 14 },
  guestText: { fontSize: 14, color: COLORS.textTertiary, fontWeight: '500' },
});

export default LoginScreen;
