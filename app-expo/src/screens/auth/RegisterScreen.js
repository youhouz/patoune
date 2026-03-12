import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, Platform, Alert, StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import useResponsive from '../../hooks/useResponsive';

const Field = ({ label, icon, value, onChangeText, placeholder, focused, name, setFocused, right, ...props }) => (
  <View style={s.fieldGroup}>
    <Text style={s.label}>{label}</Text>
    <View style={[s.row, focused === name && s.rowFocused]}>
      <Feather name={icon} size={17} color={focused === name ? '#6B8F71' : '#C0C8C2'} style={{ marginRight: 10 }} />
      <TextInput
        style={[s.input, { flex: 1 }]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#C8CEC9"
        onFocus={() => setFocused(name)}
        onBlur={() => setFocused(null)}
        {...props}
      />
      {right}
    </View>
  </View>
);

const RegisterScreen = ({ navigation }) => {
  const { register } = useAuth();
  const { isTablet, contentWidth } = useResponsive();
  const [name, setName]                   = useState('');
  const [email, setEmail]                 = useState('');
  const [phone, setPhone]                 = useState('');
  const [password, setPassword]           = useState('');
  const [confirm, setConfirm]             = useState('');
  const [showPwd, setShowPwd]             = useState(false);
  const [loading, setLoading]             = useState(false);
  const [focused, setFocused]             = useState(null);
  const maxW = isTablet ? Math.min(contentWidth, 480) : '100%';

  const strengthLevel = password.length === 0 ? null : password.length < 6 ? 0 : password.length < 10 ? 1 : 2;
  const strengthColor = ['#E57373', '#FFB74D', '#6B8F71'][strengthLevel] || '#6B8F71';
  const strengthLabel = ['Faible', 'Moyen', 'Fort'][strengthLevel] || '';

  const handleRegister = async () => {
    if (!name || !email || !password || !confirm) {
      Alert.alert('Champs manquants', 'Remplis tous les champs obligatoires');
      return;
    }
    if (password !== confirm) {
      Alert.alert('Oups !', 'Les mots de passe ne correspondent pas');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Trop court', 'Minimum 6 caractères requis');
      return;
    }
    setLoading(true);
    const result = await register(name.trim(), email.trim().toLowerCase(), password, phone);
    setLoading(false);
    if (!result.success) Alert.alert('Erreur', result.error);
  };

  return (
    <View style={s.container}>
      <StatusBar barStyle="dark-content" />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[s.scroll, { flexGrow: 1 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Blobs décoratifs ── */}
        <View style={s.blob1} pointerEvents="none" />
        <View style={s.blob2} pointerEvents="none" />

        {/* ── En-tête ── */}
        <View style={[s.header, { maxWidth: maxW, alignSelf: 'center', width: '100%' }]}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={s.backBtn}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Feather name="arrow-left" size={20} color="#2C3E2F" />
          </TouchableOpacity>
          <Text style={s.title}>
            Rejoins{'\n'}<Text style={s.accent}>pépète !</Text>
          </Text>
          <Text style={s.sub}>Crée ton compte en 30 secondes</Text>
        </View>

        {/* ── Formulaire ── */}
        <View style={[s.form, { maxWidth: maxW, alignSelf: 'center', width: '100%' }]}>

          <Field label="Nom complet" icon="user" name="name"
            value={name} onChangeText={setName} placeholder="Ton prénom et nom"
            focused={focused} setFocused={setFocused} autoCapitalize="words"
          />
          <Field label="Email" icon="mail" name="email"
            value={email} onChangeText={setEmail} placeholder="ton@email.com"
            focused={focused} setFocused={setFocused}
            keyboardType="email-address" autoCapitalize="none"
          />
          <Field label="Téléphone (optionnel)" icon="phone" name="phone"
            value={phone} onChangeText={setPhone} placeholder="06 12 34 56 78"
            focused={focused} setFocused={setFocused} keyboardType="phone-pad"
          />
          <Field label="Mot de passe" icon="lock" name="pwd"
            value={password} onChangeText={setPassword} placeholder="Minimum 6 caractères"
            focused={focused} setFocused={setFocused} secureTextEntry={!showPwd}
            right={
              <TouchableOpacity onPress={() => setShowPwd(!showPwd)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Feather name={showPwd ? 'eye-off' : 'eye'} size={17} color="#C0C8C2" />
              </TouchableOpacity>
            }
          />

          {/* Indicateur de force */}
          {password.length > 0 && (
            <View style={s.strengthRow}>
              <View style={s.strengthBar}>
                <View style={[s.strengthFill, {
                  width: strengthLevel === 0 ? '33%' : strengthLevel === 1 ? '66%' : '100%',
                  backgroundColor: strengthColor,
                }]} />
              </View>
              <Text style={[s.strengthText, { color: strengthColor }]}>{strengthLabel}</Text>
            </View>
          )}

          <Field label="Confirmer le mot de passe" icon="shield" name="confirm"
            value={confirm} onChangeText={setConfirm} placeholder="Retape ton mot de passe"
            focused={focused} setFocused={setFocused} secureTextEntry
          />

          {/* ── CTA ── */}
          <TouchableOpacity onPress={handleRegister} disabled={loading} activeOpacity={0.88} style={{ marginTop: 8 }}>
            <LinearGradient
              colors={['#527A56', '#6B8F71']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={s.cta}
            >
              <Text style={s.ctaText}>{loading ? 'Création…' : 'Créer mon compte'}</Text>
              {!loading && <Feather name="arrow-right" size={18} color="#FFF" />}
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={s.link} onPress={() => navigation.goBack()}>
            <Text style={s.linkText}>
              Déjà un compte ?{'  '}
              <Text style={s.linkBold}>Se connecter</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  scroll:    { paddingBottom: 60 },

  blob1: { position: 'absolute', top: -60,  right: -60, width: 220, height: 220, borderRadius: 110, backgroundColor: 'rgba(107,143,113,0.08)' },
  blob2: { position: 'absolute', top: 140,  right: -30, width: 140, height: 140, borderRadius: 70,  backgroundColor: 'rgba(196,149,106,0.07)' },

  header:  { paddingTop: Platform.OS === 'ios' ? 64 : 52, paddingHorizontal: 28, paddingBottom: 8 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F5F5F3', alignItems: 'center', justifyContent: 'center', marginBottom: 28 },
  title:   { fontSize: 38, fontWeight: '900', color: '#1C2B1E', letterSpacing: -1.2, lineHeight: 44, marginBottom: 10 },
  accent:  { color: '#6B8F71' },
  sub:     { fontSize: 15, color: '#96A89A', fontWeight: '500', marginBottom: 8 },

  form:       { paddingHorizontal: 28, paddingTop: 24 },
  fieldGroup: { marginBottom: 18 },
  label:      { fontSize: 13, fontWeight: '700', color: '#4A5E4D', marginBottom: 8, letterSpacing: 0.2 },
  row:        { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F7F5', borderRadius: 14, paddingHorizontal: 16, height: 56, borderWidth: 1.5, borderColor: 'transparent' },
  rowFocused: { borderColor: '#6B8F71', backgroundColor: '#EFF5F0' },
  input:      { fontSize: 15, color: '#1C2B1E', fontWeight: '500' },

  strengthRow:  { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: -8, marginBottom: 14 },
  strengthBar:  { flex: 1, height: 4, backgroundColor: '#E8EDE8', borderRadius: 2, overflow: 'hidden' },
  strengthFill: { height: '100%', borderRadius: 2 },
  strengthText: { fontSize: 12, fontWeight: '700', width: 44 },

  cta:     { height: 58, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  ctaText: { fontSize: 17, fontWeight: '800', color: '#FFF', letterSpacing: 0.2 },

  link:     { alignItems: 'center', marginTop: 24 },
  linkText: { fontSize: 14, color: '#96A89A', fontWeight: '500' },
  linkBold: { color: '#6B8F71', fontWeight: '800' },
});

export default RegisterScreen;
