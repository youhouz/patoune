import React, { useState } from 'react';
import {
  View, Text, TextInput, ScrollView, StyleSheet, Alert
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';
import Button from '../../components/Button';
import Card from '../../components/Card';
const colors = require('../../utils/colors');

const SettingsScreen = () => {
  const { user, updateUser, logout } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      const response = await api.put('/users/me', { name: name.trim(), phone: phone.trim() });
      updateUser(response.data.user);
      Alert.alert('Succes', 'Profil mis a jour');
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de mettre a jour le profil');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Card>
        <Text style={styles.sectionTitle}>Informations personnelles</Text>

        <View style={styles.field}>
          <Text style={styles.label}>Nom</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Votre nom"
            placeholderTextColor={colors.placeholder}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={[styles.input, styles.disabled]}
            value={user?.email}
            editable={false}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Telephone</Text>
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
            placeholder="06 12 34 56 78"
            placeholderTextColor={colors.placeholder}
            keyboardType="phone-pad"
          />
        </View>

        <Button
          title="Sauvegarder"
          onPress={handleSave}
          loading={loading}
        />
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>Application</Text>
        <Text style={styles.version}>Yaka Animaux v1.0.0</Text>
      </Card>

      <Button
        title="Se deconnecter"
        variant="outline"
        onPress={logout}
        style={styles.logoutButton}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 16,
  },
  field: {
    marginBottom: 14,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 6,
  },
  input: {
    backgroundColor: colors.background,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  disabled: {
    opacity: 0.5,
  },
  version: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  logoutButton: {
    marginTop: 8,
    borderColor: colors.error,
  },
});

export default SettingsScreen;
