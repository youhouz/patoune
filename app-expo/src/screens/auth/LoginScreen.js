import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, Platform, Alert, StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { PawIcon } from '../../components/Logo';
import useResponsive from '../../hooks/useResponsive';

const LoginScreen = ({ navigation }) => {
  const { login } = useAuth();
  const { isTablet, contentWidth } = useResponsive();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [showPwd, setShowPwd]   = useState(false);
  const [focused, setFocused]   = useState(null);
  const maxW = isTablet ? Math.min(contentWidth, 480) : '100%';

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Oups !', 'Remplis tous les champs pour continuer');
      return;
    }
    setLoading(true);
    const result = await login(email.trim().toLowerCase(), password);
    setLoading(false);
    if (!result.success) Alert.alert('Connexion impossible', result.error);
  };

  return (
    <View style={s.container}>
      <StatusBar barStyle="dark-content" />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={s.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Blobs décoratifs ── */}
        <View style={s.blob1} pointerEvents="none" />
        <View style={s.blob2} pointerEvents="none" />
        <View style={s.blob3} pointerEvents="none" />

        <View style={[s.inner, { maxWidth: maxW, alignSelf: 'center', width: '100%' }]}>

          {/* ── Logo badge ── */}
          <View style={s.logoArea}>
            <View style={s.logoBadge}>
              <PawIcon size={28} color="#6B8F71" />
            </View>
            <Text style={s.logoName}>pépète.</Text>
            <Text style={s.logoTagline}>Le meilleur pour vos animaux</Text>
          </View>

          {/* ── Titre ── */}
          <Text style={s.title}>
            Bon retour,{'\n'}<Text style={s.accent}>content de vous voir !</Text>
          </Text>
          <Text style={s.sub}>Connectez-vous pour continuer</Text>

          {/* ── Email ── */}
          <View style={s.fieldGroup}>
            <Text style={s.label}>Adresse email</Text>
            <View style={[s.row, focused === 'email' && s.rowFocused]}>
              <Feather name="mail" size={17} color={focused === 'email' ? '#6B8F71' : '#C0C8C2'} style={{ marginRight: 10 }} />
              <TextInput
                style={s.input}
                value={email}
                onChangeText={setEmail}
                placeholder="votre@email.com"
                placeholderTextColor="#C8CEC9"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                onFocus={() => setFocused('email')}
                onBlur={() => setFocused(null)}
              />
            </View>
          </View>

          {/* ── Mot de passe ── */}
          <View style={s.fieldGroup}>
            <Text style={s.label}>Mot de passe</Text>
            <View style={[s.row, focused === 'pwd' && s.rowFocused]}>
              <Feather name="lock" size={17} color={focused === 'pwd' ? '#6B8F71' : '#C0C8C2'} style={{ marginRight: 10 }} />
              <TextInput
                style={[s.input, { flex: 1 }]}
                value={password}
                onChangeText={setPassword}
                placeholder="Votre mot de passe"
                placeholderTextColor="#C8CEC9"
                secureTextEntry={!showPwd}
                onFocus={() => setFocused('pwd')}
                onBlur={() => setFocused(null)}
              />
              <TouchableOpacity onPress={() => setShowPwd(!showPwd)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Feather name={showPwd ? 'eye-off' : 'eye'} size={17} color="#C0C8C2" />
              </TouchableOpacity>
            </View>
          </View>

          {/* ── CTA ── */}
          <TouchableOpacity onPress={handleLogin} disabled={loading} activeOpacity={0.88} style={{ marginTop: 8 }}>
            <LinearGradient
              colors={['#527A56', '#6B8F71']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={s.cta}
            >
              <Text style={s.ctaText}>{loading ? 'Connexion…' : 'Se connecter'}</Text>
              {!loading && <Feather name="arrow-right" size={18} color="#FFF" />}
            </LinearGradient>
          </TouchableOpacity>

          {/* ── Séparateur ── */}
          <View style={s.sep}>
            <View style={s.sepLine} />
            <Text style={s.sepText}>ou</Text>
            <View style={s.sepLine} />
          </View>

          {/* ── Inscription ── */}
          <TouchableOpacity style={s.link} onPress={() => navigation.navigate('Register')} activeOpacity={0.75}>
            <Text style={s.linkText}>
              Pas encore de compte ?{'  '}
              <Text style={s.linkBold}>Créer un compte</Text>
            </Text>
          </TouchableOpacity>

        </View>
      </ScrollView>
    </View>
  );
};

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF6EE' },
  scroll:    { paddingBottom: 80 },

  /* blobs */
  blob1: { position: 'absolute', top: -80,  right: -60, width: 260, height: 260, borderRadius: 130, backgroundColor: 'rgba(107,143,113,0.07)' },
  blob2: { position: 'absolute', top: 200,  right: -20, width: 120, height: 120, borderRadius: 60,  backgroundColor: 'rgba(196,149,106,0.07)' },
  blob3: { position: 'absolute', bottom: 60, left: -60, width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(107,143,113,0.05)' },

  inner:    { paddingHorizontal: 28 },
  logoArea: { paddingTop: Platform.OS === 'ios' ? 72 : 60, paddingBottom: 28, alignItems: 'center' },
  logoBadge: { width: 68, height: 68, borderRadius: 34, backgroundColor: '#EFF5F0', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  logoName: { fontSize: 28, fontWeight: '900', color: '#1C2B1E', letterSpacing: -0.8, marginBottom: 4 },
  logoTagline: { fontSize: 13, color: '#96A89A', fontWeight: '500' },

  title:  { fontSize: 34, fontWeight: '900', color: '#1C2B1E', letterSpacing: -1,   lineHeight: 40, marginBottom: 10 },
  accent: { color: '#6B8F71' },
  sub:    { fontSize: 15, color: '#96A89A', fontWeight: '500', marginBottom: 36 },

  fieldGroup: { marginBottom: 18 },
  label:      { fontSize: 13, fontWeight: '700', color: '#4A5E4D', marginBottom: 8, letterSpacing: 0.2 },
  row:        { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0EDE6', borderRadius: 14, paddingHorizontal: 16, height: 56, borderWidth: 1.5, borderColor: 'transparent' },
  rowFocused: { borderColor: '#6B8F71', backgroundColor: '#EFF5F0' },
  input:      { flex: 1, fontSize: 15, color: '#1C2B1E', fontWeight: '500' },

  cta:        { height: 58, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  ctaText:    { fontSize: 17, fontWeight: '800', color: '#FFF', letterSpacing: 0.2 },

  sep:     { flexDirection: 'row', alignItems: 'center', marginVertical: 28, gap: 12 },
  sepLine: { flex: 1, height: 1, backgroundColor: '#EAEEEA' },
  sepText: { fontSize: 13, color: '#C0C8C2', fontWeight: '600' },

  link:     { alignItems: 'center' },
  linkText: { fontSize: 14, color: '#96A89A', fontWeight: '500' },
  linkBold: { color: '#6B8F71', fontWeight: '800' },
});

export default LoginScreen;
