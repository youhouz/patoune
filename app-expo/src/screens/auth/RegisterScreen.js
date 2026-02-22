import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Alert, StatusBar
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/Button';
const colors = require('../../utils/colors');
const { RADIUS } = require('../../utils/colors');

const InputField = ({ label, icon, value, onChangeText, placeholder, focusedField, fieldName, setFocusedField, ...props }) => (
  <View style={styles.fieldGroup}>
    <Text style={styles.label}>{label}</Text>
    <View style={[styles.inputWrapper, focusedField === fieldName && styles.inputFocused]}>
      <Text style={styles.inputIcon}>{icon}</Text>
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
    </View>
  </View>
);

const RegisterScreen = ({ navigation }) => {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

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
      Alert.alert('Mot de passe trop court', 'Minimum 6 caracteres requis');
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

      <LinearGradient
        colors={['#FF6B35', '#FF8F65', '#FFB088']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.backIcon}>{'←'}</Text>
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Rejoins Patoune !</Text>
          <Text style={styles.headerSub}>Cree ton compte en 30 secondes</Text>
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
          {/* Progress dots */}
          <View style={styles.progress}>
            <View style={[styles.dot, styles.dotActive]} />
            <View style={styles.dotLine} />
            <View style={[styles.dot, (email && name) ? styles.dotActive : null]} />
            <View style={styles.dotLine} />
            <View style={[styles.dot, password ? styles.dotActive : null]} />
          </View>

          <InputField
            label="Nom complet" icon="👤" fieldName="name"
            value={name} onChangeText={setName} placeholder="Ton prenom et nom"
            focusedField={focusedField} setFocusedField={setFocusedField}
            autoCapitalize="words"
          />

          <InputField
            label="Email" icon="📧" fieldName="email"
            value={email} onChangeText={setEmail} placeholder="ton@email.com"
            focusedField={focusedField} setFocusedField={setFocusedField}
            keyboardType="email-address" autoCapitalize="none"
          />

          <InputField
            label="Telephone (optionnel)" icon="📱" fieldName="phone"
            value={phone} onChangeText={setPhone} placeholder="06 12 34 56 78"
            focusedField={focusedField} setFocusedField={setFocusedField}
            keyboardType="phone-pad"
          />

          <InputField
            label="Mot de passe" icon="🔒" fieldName="password"
            value={password} onChangeText={setPassword} placeholder="Minimum 6 caracteres"
            focusedField={focusedField} setFocusedField={setFocusedField}
            secureTextEntry
          />

          <InputField
            label="Confirmer le mot de passe" icon="🔐" fieldName="confirm"
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
            title="Creer mon compte"
            onPress={handleRegister}
            loading={loading}
            style={{ marginTop: 12 }}
            size="lg"
            icon="🚀"
          />

          <TouchableOpacity
            style={styles.loginLink}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.loginText}>
              Deja un compte ?{' '}
              <Text style={styles.loginBold}>Se connecter</Text>
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
    paddingTop: Platform.OS === 'ios' ? 56 : 44,
    paddingBottom: 40,
    paddingHorizontal: 24,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  backIcon: {
    fontSize: 20,
    color: '#FFF',
    fontWeight: '700',
  },
  headerContent: {
    zIndex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFF',
  },
  headerSub: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 4,
    fontWeight: '500',
  },
  headerCurve: {
    position: 'absolute',
    bottom: -1,
    left: 0,
    right: 0,
    height: 24,
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  formWrapper: {
    flex: 1,
  },
  scroll: {
    paddingHorizontal: 24,
    paddingTop: 4,
    paddingBottom: 40,
  },
  progress: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
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
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 7,
    marginLeft: 2,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingHorizontal: 14,
    height: 52,
  },
  inputFocused: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  inputIcon: {
    fontSize: 17,
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
    paddingVertical: 0,
  },
  strengthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 10,
  },
  strengthBar: {
    flex: 1,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  strengthFill: {
    height: '100%',
    borderRadius: 2,
  },
  strengthText: {
    fontSize: 12,
    fontWeight: '600',
  },
  loginLink: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  loginText: {
    fontSize: 15,
    color: colors.textSecondary,
  },
  loginBold: {
    color: colors.primary,
    fontWeight: '700',
  },
});

export default RegisterScreen;
