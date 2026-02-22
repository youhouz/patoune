import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useAuth } from '../context/AuthContext';
import Card from '../components/Card';
const colors = require('../utils/colors');

const HomeScreen = ({ navigation }) => {
  const { user } = useAuth();

  const features = [
    {
      icon: '📷',
      title: 'Scanner un produit',
      description: 'Scannez et analysez la qualite des produits pour vos animaux',
      color: colors.primary,
      onPress: () => navigation.navigate('Scanner'),
    },
    {
      icon: '🐾',
      title: 'Trouver un gardien',
      description: 'Trouvez un gardien de confiance pres de chez vous',
      color: colors.secondary,
      onPress: () => navigation.navigate('Garde'),
    },
    {
      icon: '🐕',
      title: 'Mes animaux',
      description: 'Gerez les profils de vos compagnons',
      color: colors.info,
      onPress: () => navigation.navigate('Profil', { screen: 'MyPets' }),
    },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Bonjour 👋</Text>
          <Text style={styles.userName}>{user?.name}</Text>
        </View>
        <TouchableOpacity
          style={styles.avatarContainer}
          onPress={() => navigation.navigate('Profil')}
        >
          <Text style={styles.avatarText}>
            {user?.name?.charAt(0)?.toUpperCase() || '?'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Banner */}
      <Card style={styles.banner}>
        <Text style={styles.bannerTitle}>YAKA</Text>
        <Text style={styles.bannerSubtitle}>Le meilleur pour vos animaux</Text>
        <Text style={styles.bannerDescription}>
          Scannez des produits, trouvez des gardiens, et prenez soin de vos compagnons !
        </Text>
      </Card>

      {/* Features */}
      <Text style={styles.sectionTitle}>Que souhaitez-vous faire ?</Text>

      {features.map((feature, idx) => (
        <TouchableOpacity key={idx} onPress={feature.onPress} activeOpacity={0.8}>
          <Card style={styles.featureCard}>
            <View style={styles.featureRow}>
              <View style={[styles.featureIconBg, { backgroundColor: feature.color + '15' }]}>
                <Text style={styles.featureIcon}>{feature.icon}</Text>
              </View>
              <View style={styles.featureInfo}>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureDesc}>{feature.description}</Text>
              </View>
              <Text style={styles.featureArrow}>›</Text>
            </View>
          </Card>
        </TouchableOpacity>
      ))}

      {/* Quick stats */}
      <Card>
        <Text style={styles.statsTitle}>En un coup d'oeil</Text>
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statIcon}>📷</Text>
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>Scans</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statIcon}>🐾</Text>
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>Animaux</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statIcon}>📅</Text>
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>Gardes</Text>
          </View>
        </View>
      </Card>
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
    paddingTop: 50,
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  greeting: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  userName: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  avatarContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.white,
  },
  banner: {
    backgroundColor: colors.primary,
    marginBottom: 8,
  },
  bannerTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: colors.white,
    letterSpacing: 3,
  },
  bannerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  bannerDescription: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 8,
    lineHeight: 18,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 16,
    marginBottom: 8,
  },
  featureCard: {
    marginVertical: 4,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureIconBg: {
    width: 50,
    height: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureIcon: {
    fontSize: 24,
  },
  featureInfo: {
    flex: 1,
    marginLeft: 14,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  featureDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
    lineHeight: 16,
  },
  featureArrow: {
    fontSize: 24,
    color: colors.textLight,
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 14,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  stat: {
    alignItems: 'center',
  },
  statIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  statNumber: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.primary,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
});

export default HomeScreen;
