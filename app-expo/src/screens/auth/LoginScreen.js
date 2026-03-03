import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Alert,
  Animated, StatusBar, Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/Button';
const colors = require('../../utils/colors');
const { SHADOWS, RADIUS, SPACING } = require('../../utils/colors');

const { width } = Dimensions.get('window');

const LoginScreen = ({ navigation }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Oups !', 'Remplis tous les champs pour continuer');
      return;
    }
    setLoading(true);
    const result = await login(email.trim().toLowerCase(), password);
    setLoading(false);
    if (!result.success) {
      Alert.alert('Connexion impossible', result.error);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header gradient with brand */}
      <LinearGradient
        colors={['#FF6B35', '#FF7848', '#FFB088']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        {/* Decorative circles */}
        <View style={styles.circle1} />
        <View style={styles.circle2} />

        <View style={styles.headerContent}>
          <View style={styles.logoCircle}>
            <Text style={styles.pawEmoji}>🐾</Text>
          </View>
          <Text style={styles.logo}>patoune</Text>
          <Text style={styles.tagline}>Le meilleur pour vos animaux</Text>
        </View>
        <View style={styles.headerCurve} />
      </LinearGradient>

      <KeyboardAvoidingView
        style={styles.formWrapper}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.welcomeBack}>Content de vous revoir !</Text>
          <Text style={styles.subtitle}>Connectez-vous pour continuer</Text>

          {/* Email field */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Adresse email</Text>
            <View style={[
              styles.inputWrapper,
              focusedField === 'email' && styles.inputFocused,
            ]}>
              <Text style={styles.inputIcon}>{'📧'}</Text>
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
            </View>
          </View>

          {/* Password field */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Mot de passe</Text>
            <View style={[
              styles.inputWrapper,
              focusedField === 'password' && styles.inputFocused,
            ]}>
              <Text style={styles.inputIcon}>{'🔒'}</Text>
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
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <Text style={styles.eyeIcon}>{showPassword ? '🙈' : '👁️'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          <Button
            title="Se connecter"
            onPress={handleLogin}
            loading={loading}
            style={{ marginTop: 10 }}
            size="lg"
          />

          {/* Separator */}
          <View style={styles.separator}>
            <View style={styles.separatorLine} />
            <Text style={styles.separatorText}>ou</Text>
            <View style={styles.separatorLine} />
          </View>

          {/* Register CTA */}
          <TouchableOpacity
            style={styles.registerBtn}
            onPress={() => navigation.navigate('Register')}
            activeOpacity={0.75}
          >
            <Text style={styles.registerText}>
              Pas encore de compte ?{'  '}
              <Text style={styles.registerBold}>Creer un compte</Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  headerGradient: {
    paddingTop: Platform.OS === 'ios' ? 64 : 52,
    paddingBottom: 56,
    alignItems: 'center',
    overflow: 'hidden',
  },
  circle1: {
    position: 'absolute',
    top: -40, right: -40,
    width: 160, height: 160, borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  circle2: {
    position: 'absolute',
    bottom: 0, left: -50,
    width: 200, height: 200, borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  headerContent: {
    alignItems: 'center',
    zIndex: 1,
  },
  headerCurve: {
    position: 'absolute',
    bottom: -1,
    left: 0, right: 0,
    height: 32,
    backgroundColor: colors.white,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
  },
  logoCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  pawEmoji: {
    fontSize: 36,
  },
  logo: {
    fontSize: 40,
    fontWeight: '900',
    color: '#FFF',
    letterSpacing: 2,
    textTransform: 'lowercase',
  },
  tagline: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.88)',
    marginTop: 8,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  formWrapper: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 48,
  },
  welcomeBack: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 30,
  },
  fieldGroup: {
    marginBottom: 20,
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
  eyeBtn: {
    padding: 4,
  },
  eyeIcon: {
    fontSize: 20,
  },
  separator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 26,
  },
  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  separatorText: {
    marginHorizontal: 16,
    fontSize: 14,
    color: colors.textTertiary,
    fontWeight: '600',
  },
  registerBtn: {
    alignItems: 'center',
    paddingVertical: 18,
    backgroundColor: colors.primarySoft,
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    borderColor: colors.primary + '25',
  },
  registerText: {
    fontSize: 16,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  registerBold: {
    color: colors.primary,
    fontWeight: '800',
  },
});

export default LoginScreen;
