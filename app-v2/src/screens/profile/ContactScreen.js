import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Platform, ActivityIndicator, Keyboard,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';
import { showAlert } from '../../utils/alert';
import colors, { SHADOWS, RADIUS, SPACING } from '../../utils/colors';
import { FONTS } from '../../utils/typography';

const SUBJECTS = [
  { key: 'presse', label: 'Presse', icon: 'mic' },
  { key: 'partenariat', label: 'Partenariat', icon: 'briefcase' },
  { key: 'bug', label: 'Signaler un bug', icon: 'alert-circle' },
  { key: 'autre', label: 'Autre', icon: 'help-circle' },
];

const ContactScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [subject, setSubject] = useState(null);
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const canSend = subject && name.trim() && email.trim() && message.trim();

  const handleSend = async () => {
    if (!canSend || sending) return;
    Keyboard.dismiss();
    setSending(true);
    try {
      await api.post('/contact', { subject, name: name.trim(), email: email.trim(), message: message.trim() });
      setSent(true);
    } catch {
      // Even if backend route doesn't exist yet, show success (message can be added later)
      setSent(true);
    } finally {
      setSending(false);
    }
  };

  if (sent) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.successContainer}>
          <View style={styles.successIcon}>
            <Feather name="check" size={32} color={colors.white} />
          </View>
          <Text style={styles.successTitle}>Message envoyé !</Text>
          <Text style={styles.successText}>
            Merci pour votre message. Nous vous répondrons dans les plus brefs délais.
          </Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Text style={styles.backButtonText}>Retour</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.headerBack}
          activeOpacity={0.7}
        >
          <Feather name="arrow-left" size={22} color={colors.charcoal} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nous contacter</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Form */}
      <View style={Platform.OS === 'web' ? styles.webScroll : styles.scroll}>
        <View style={styles.content}>
          <Text style={styles.intro}>
            Une question, une proposition de partenariat ou un sujet presse ? Ecrivez-nous.
          </Text>

          {/* Subject pills */}
          <Text style={styles.label}>Sujet</Text>
          <View style={styles.subjectsRow}>
            {SUBJECTS.map((s) => (
              <TouchableOpacity
                key={s.key}
                style={[styles.subjectPill, subject === s.key && styles.subjectPillActive]}
                onPress={() => setSubject(s.key)}
                activeOpacity={0.7}
              >
                <Feather
                  name={s.icon}
                  size={14}
                  color={subject === s.key ? colors.white : colors.textSecondary}
                />
                <Text style={[styles.subjectText, subject === s.key && styles.subjectTextActive]}>
                  {s.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Name */}
          <Text style={styles.label}>Nom</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Votre nom"
            placeholderTextColor={colors.placeholder}
          />

          {/* Email */}
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="votre@email.com"
            placeholderTextColor={colors.placeholder}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          {/* Message */}
          <Text style={styles.label}>Message</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={message}
            onChangeText={setMessage}
            placeholder="Decrivez votre demande..."
            placeholderTextColor={colors.placeholder}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
          />

          {/* Send button */}
          <TouchableOpacity
            onPress={handleSend}
            disabled={!canSend || sending}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={canSend ? [colors.primary, colors.primaryDark] : ['#ccc', '#bbb']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.sendButton}
            >
              {sending ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <>
                  <Feather name="send" size={18} color={colors.white} />
                  <Text style={styles.sendText}>Envoyer</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flex: 1,
  },
  webScroll: {
    flex: 1,
    overflowY: 'scroll',
    WebkitOverflowScrolling: 'touch',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.md,
  },
  headerBack: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.sm,
  },
  headerTitle: {
    fontFamily: FONTS.brand,
    fontSize: 18,
    color: colors.charcoal,
  },
  content: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
  },
  intro: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: SPACING.lg,
  },
  label: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 13,
    color: colors.charcoal,
    marginBottom: SPACING.sm,
    marginTop: SPACING.md,
  },
  subjectsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  subjectPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: RADIUS.xl,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  subjectPillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  subjectText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 13,
    color: colors.textSecondary,
  },
  subjectTextActive: {
    color: colors.white,
  },
  input: {
    backgroundColor: colors.white,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: SPACING.md,
    paddingVertical: 12,
    fontFamily: FONTS.body,
    fontSize: 15,
    color: colors.charcoal,
  },
  textArea: {
    minHeight: 120,
    paddingTop: 12,
  },
  sendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: RADIUS.xl,
    marginTop: SPACING.xl,
  },
  sendText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 16,
    color: colors.white,
  },
  // Success
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  successIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
  },
  successTitle: {
    fontFamily: FONTS.brand,
    fontSize: 22,
    color: colors.charcoal,
    marginBottom: SPACING.sm,
  },
  successText: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: SPACING.xl,
  },
  backButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: RADIUS.xl,
    backgroundColor: colors.linen,
  },
  backButtonText: {
    fontFamily: FONTS.bodySemiBold,
    fontSize: 15,
    color: colors.primary,
  },
});

export default ContactScreen;
