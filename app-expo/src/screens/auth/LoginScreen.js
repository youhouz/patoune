// ---------------------------------------------------------------------------
// Patoune v2.0 - Login Screen
// Premium "Terracotta Studio" aesthetic - cream background, organic warmth
// ---------------------------------------------------------------------------

import React, { useState, useRef, useEffect } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../../utils/colors';
import { FONTS, TEXT_STYLES } from '../../utils/typography';
import Button from '../../components/Button';
import Input from '../../components/Input';


const LoginScreen = ({ navigation }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Subtle fade-in animation for the form
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleLogin = async () => {
    setErrorMessage('');

    if (!email.trim()) {
      setErrorMessage('Veuillez entrer votre adresse email');
      return;
    }
    if (!password) {
      setErrorMessage('Veuillez entrer votre mot de passe');
      return;
    }

    setLoading(true);
    const result = await login(email.trim().toLowerCase(), password);
    setLoading(false);

    if (!result.success) {
      setErrorMessage(result.error);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.cream} />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Brand header */}
          <View style={styles.brandSection}>
            <View style={styles.pawContainer}>
              <Ionicons name="paw" size={44} color={COLORS.primary} />
            </View>
            <Text style={styles.brandName}>patoune</Text>
          </View>

          {/* Welcome text */}
          <Animated.View
            style={[
              styles.formSection,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <Text style={styles.welcomeTitle}>Bon retour</Text>
            <Text style={styles.welcomeSubtitle}>
              Connectez-vous pour retrouver vos compagnons
            </Text>

            {/* Error message */}
            {errorMessage ? (
              <View style={styles.errorContainer}>
                <Ionicons
                  name="alert-circle-outline"
                  size={18}
                  color={COLORS.error}
                />
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            ) : null}

            {/* Email input */}
            <Input
              label="Email"
              placeholder="votre@email.com"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (errorMessage) setErrorMessage('');
              }}
              icon="mail"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />

            {/* Password input */}
            <Input
              label="Mot de passe"
              placeholder="Votre mot de passe"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (errorMessage) setErrorMessage('');
              }}
              icon="lock"
              secureTextEntry
            />

            {/* Login button */}
            <Button
              title="Se connecter"
              onPress={handleLogin}
              loading={loading}
              variant="primary"
              size="lg"
              style={styles.loginButton}
            />

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>ou</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Register link */}
            <TouchableOpacity
              style={styles.registerLink}
              onPress={() => navigation.navigate('Register')}
              activeOpacity={0.7}
            >
              <Text style={styles.registerText}>
                Pas encore de compte ?{' '}
                <Text style={styles.registerBold}>Creer un compte</Text>
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
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
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING['3xl'],
  },

  // ---- Brand ----
  brandSection: {
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 80 : 64,
    paddingBottom: SPACING['3xl'],
  },
  pawContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.base,
  },
  brandName: {
    fontFamily: FONTS.brand,
    fontSize: 36,
    color: COLORS.charcoal,
    letterSpacing: -0.5,
    textTransform: 'lowercase',
  },

  // ---- Form section ----
  formSection: {
    flex: 1,
  },
  welcomeTitle: {
    fontFamily: FONTS.heading,
    fontSize: 28,
    color: COLORS.charcoal,
    marginBottom: SPACING.xs,
    letterSpacing: -0.3,
  },
  welcomeSubtitle: {
    fontFamily: FONTS.body,
    fontSize: 15,
    color: COLORS.textSecondary,
    marginBottom: SPACING['2xl'],
    lineHeight: 22,
  },

  // ---- Error ----
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.errorSoft,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.base,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.lg,
    gap: SPACING.sm,
  },
  errorText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 14,
    color: COLORS.error,
    flex: 1,
  },

  // ---- Button ----
  loginButton: {
    marginTop: SPACING.sm,
  },

  // ---- Divider ----
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: SPACING['2xl'],
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  dividerText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 13,
    color: COLORS.textTertiary,
    marginHorizontal: SPACING.base,
  },

  // ---- Register link ----
  registerLink: {
    alignItems: 'center',
    paddingVertical: SPACING.base,
    backgroundColor: COLORS.primarySoft,
    borderRadius: RADIUS.lg,
  },
  registerText: {
    fontFamily: FONTS.body,
    fontSize: 15,
    color: COLORS.textSecondary,
  },
  registerBold: {
    fontFamily: FONTS.heading,
    color: COLORS.primary,
  },
});

export default LoginScreen;
