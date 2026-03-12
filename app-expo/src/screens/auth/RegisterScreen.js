import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Alert, StatusBar
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/Button';
import useResponsive from '../../hooks/useResponsive';
const colors = require('../../utils/colors');
const { RADIUS, SPACING } = require('../../utils/colors');

const InputField = ({ label, icon, value, onChangeText, placeholder, focusedField, fieldName, setFocusedField, ...props }) => (
  <View style={styles.fieldGroup}>
    <Text style={styles.label}>{label}</Text>
    <View style={[styles.inputWrapper, focusedField === fieldName && styles.inputFocused]}>
      <Feather name={icon} size={18} color={focusedField === fieldName ? colors.primary : colors.textTertiary} style={{ marginRight: 12 }} />
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.placeholder}
        onFocus={() => setFocusedField(fieldName)}
        onBlur={() => setFocusedField(null)}
        {...props}
      />
    </View>
  </View>
);

const RegisterScreen = ({ navigation }) => {
  const { register } = useAuth();
  const { isTablet, contentWidth } = useResponsive();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const formMaxWidth = isTablet ? Math.min(contentWidth, 480) : undefined;

  const handleRegister = async () => {
    if (!name || !email || !password || !confirmPassword) {
      Alert.alert('Champs manquants', 'Remplis tous les champs obligatoires');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Oups !', 'Les mots de passe ne correspondent pas');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Mot de passe trop court', 'Minimum 6 caractères requis');
      return;
    }
    setLoading(true);
    const result = await register(name.trim(), email.trim().toLowerCase(), password, phone);
    setLoading(false);
    if (!result.success) {
      Alert.alert('Erreur', result.error);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Single ScrollView wrapping header + form — ensures scroll works on web */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={true}
        >
          {/* ── Gradient Header (scrolls with content) ── */}
          <LinearGradient
            colors={['#527A56', '#6B8F71', '#8CB092']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.headerGradient}
          >
            <View style={styles.circle1} pointerEvents="none" />
            <View style={styles.circle2} pointerEvents="none" />
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backBtn}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Feather name="arrow-left" size={22} color="#FFF" />
            </TouchableOpacity>
            <View style={styles.headerContent}>
              <Text style={styles.headerTitle}>Rejoins Pépète !</Text>
              <Text style={styles.headerSub}>Crée ton compte en 30 secondes</Text>
            </View>
          </LinearGradient>

          {/* ── Form Body ── */}
          <View style={[styles.formBody, formMaxWidth ? { maxWidth: formMaxWidth, alignSelf: 'center', width: '100%' } : null]}>
          {/* Progress dots */}
          <View style={styles.progress}>
            <View style={[styles.dot, styles.dotActive]} />
            <View style={styles.dotLine} />
            <View style={[styles.dot, (email && name) ? styles.dotActive : null]} />
            <View style={styles.dotLine} />
            <View style={[styles.dot, password ? styles.dotActive : null]} />
          </View>

          <InputField
            label="Nom complet" icon="user" fieldName="name"
            value={name} onChangeText={setName} placeholder="Ton prénom et nom"
            focusedField={focusedField} setFocusedField={setFocusedField}
            autoCapitalize="words"
          />

          <InputField
            label="Email" icon="mail" fieldName="email"
            value={email} onChangeText={setEmail} placeholder="ton@email.com"
            focusedField={focusedField} setFocusedField={setFocusedField}
            keyboardType="email-address" autoCapitalize="none"
          />

          <InputField
            label="Téléphone (optionnel)" icon="phone" fieldName="phone"
            value={phone} onChangeText={setPhone} placeholder="06 12 34 56 78"
            focusedField={focusedField} setFocusedField={setFocusedField}
            keyboardType="phone-pad"
          />

          <InputField
            label="Mot de passe" icon="lock" fieldName="password"
            value={password} onChangeText={setPassword} placeholder="Minimum 6 caractères"
            focusedField={focusedField} setFocusedField={setFocusedField}
            secureTextEntry
          />

          <InputField
            label="Confirmer le mot de passe" icon="shield" fieldName="confirm"
            value={confirmPassword} onChangeText={setConfirmPassword} placeholder="Retape ton mot de passe"
            focusedField={focusedField} setFocusedField={setFocusedField}
            secureTextEntry
          />

          {/* Password strength */}
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

          <Button
            title="Créer mon compte"
            onPress={handleRegister}
            loading={loading}
            style={{ marginTop: 12 }}
            size="lg"
          />

          <TouchableOpacity
            style={styles.loginLink}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.loginText}>
              Déjà un compte ?{' '}
              <Text style={styles.loginBold}>Se connecter</Text>
            </Text>
          </TouchableOpacity>
          </View>
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
    paddingTop: Platform.OS === 'ios' ? 60 : 48,
    paddingBottom: 44,
    paddingHorizontal: 24,
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
    bottom: 10, left: -50,
    width: 180, height: 180, borderRadius: 90,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
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
  scroll: {
    flexGrow: 1,
  },
  formBody: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 48,
  },
  progress: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 26,
    marginTop: 4,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.border,
  },
  dotActive: {
    backgroundColor: colors.primary,
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  dotLine: {
    width: 40,
    height: 2,
    backgroundColor: colors.border,
    marginHorizontal: 6,
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
  loginLink: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
    paddingVertical: 18,
    backgroundColor: colors.primarySoft,
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    borderColor: colors.primary + '25',
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
