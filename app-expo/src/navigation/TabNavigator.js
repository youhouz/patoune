import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { useAuth } from '../context/AuthContext';
import HomeScreen from '../screens/HomeScreen';
import ScannerNavigator from './ScannerNavigator';
import PetSittersListScreen from '../screens/petsitting/PetSittersListScreen';
import PetSitterDetailScreen from '../screens/petsitting/PetSitterDetailScreen';
import BookingScreen from '../screens/petsitting/BookingScreen';
import MessagesScreen from '../screens/petsitting/MessagesScreen';
import AIAssistantScreen from '../screens/ai/AIAssistantScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import MyPetsScreen from '../screens/profile/MyPetsScreen';
import AddPetScreen from '../screens/profile/AddPetScreen';
import SettingsScreen from '../screens/profile/SettingsScreen';
import GuestGateScreen from '../screens/auth/GuestGateScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
const colors = require('../utils/colors');
const { SHADOWS, RADIUS } = require('../utils/colors');

const Tab = createBottomTabNavigator();
const PetSittingStack = createStackNavigator();
const ProfileStack = createStackNavigator();
const AuthStack = createStackNavigator();

const stackScreenOptions = {
  headerStyle: {
    backgroundColor: colors.white,
    elevation: 0,
    shadowOpacity: 0,
    borderBottomWidth: 0,
  },
  headerTintColor: colors.primary,
  headerTitleStyle: {
    fontWeight: '700',
    fontSize: 18,
    color: colors.text,
  },
  headerBackTitleVisible: false,
  cardStyle: { backgroundColor: colors.background },
};

const PetSittingNavigator = () => {
  const { user } = useAuth();
  if (!user) return <GuestGateScreen />;
  return (
    <PetSittingStack.Navigator screenOptions={stackScreenOptions}>
      <PetSittingStack.Screen name="PetSittersList" component={PetSittersListScreen} options={{ headerShown: false }} />
      <PetSittingStack.Screen name="PetSitterDetail" component={PetSitterDetailScreen} options={{ headerShown: false }} />
      <PetSittingStack.Screen name="Booking" component={BookingScreen} options={{ title: 'Réserver' }} />
      <PetSittingStack.Screen name="Messages" component={MessagesScreen} options={{ title: 'Messages' }} />
    </PetSittingStack.Navigator>
  );
};

const ProfileNavigator = () => {
  const { user } = useAuth();
  if (!user) return <GuestGateScreen />;
  return (
    <ProfileStack.Navigator screenOptions={stackScreenOptions}>
      <ProfileStack.Screen name="ProfileMain" component={ProfileScreen} options={{ headerShown: false }} />
      <ProfileStack.Screen name="MyPets" component={MyPetsScreen} options={{ title: 'Mes Animaux' }} />
      <ProfileStack.Screen name="AddPet" component={AddPetScreen} options={{ title: 'Nouvel Animal' }} />
      <ProfileStack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Réglages' }} />
    </ProfileStack.Navigator>
  );
};

const AuthNavigatorStack = () => (
  <AuthStack.Navigator screenOptions={{ headerShown: false }}>
    <AuthStack.Screen name="Login" component={LoginScreen} />
    <AuthStack.Screen name="Register" component={RegisterScreen} />
  </AuthStack.Navigator>
);

// Tab configuration with emoji and label
const TAB_CONFIG = {
  Accueil:   { emoji: '🏠', label: 'Accueil' },
  Scanner:   { emoji: '📷', label: 'Scanner' },
  Garde:     { emoji: '❤️', label: 'Garde' },
  Assistant: { emoji: '🤖', label: 'Assistant' },
  Profil:    { emoji: '👤', label: 'Profil' },
};

// Premium pill tab with glow effect on active
const TabIcon = ({ routeName, focused }) => (
  <View style={styles.tabItem}>
    <View style={[styles.iconPill, focused && styles.iconPillActive]}>
      <Text style={[styles.tabEmoji, focused && styles.tabEmojiActive]}>
        {TAB_CONFIG[routeName]?.emoji || '•'}
      </Text>
    </View>
    <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>
      {TAB_CONFIG[routeName]?.label}
    </Text>
  </View>
);

const TabNavigator = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      headerShown: false,
      tabBarIcon: ({ focused }) => <TabIcon routeName={route.name} focused={focused} />,
      tabBarLabel: () => null,
      tabBarActiveTintColor: colors.primary,
      tabBarInactiveTintColor: colors.textLight,
      tabBarStyle: {
        height: Platform.OS === 'ios' ? 88 : Platform.OS === 'web' ? 68 : 70,
        paddingBottom: Platform.OS === 'ios' ? 24 : Platform.OS === 'web' ? 8 : 6,
        paddingTop: 8,
        backgroundColor: colors.white,
        borderTopWidth: 0,
        ...SHADOWS.md,
      },
      tabBarAccessibilityLabel: route.name,
    })}
  >
    <Tab.Screen name="Accueil" component={HomeScreen} />
    <Tab.Screen name="Scanner" component={ScannerNavigator} />
    <Tab.Screen name="Garde" component={PetSittingNavigator} />
    <Tab.Screen name="Assistant" component={AIAssistantScreen} />
    <Tab.Screen name="Profil" component={ProfileNavigator} />
    <Tab.Screen
      name="AuthStack"
      component={AuthNavigatorStack}
      options={{ tabBarButton: () => null, tabBarStyle: { display: 'none' } }}
    />
  </Tab.Navigator>
);

const styles = StyleSheet.create({
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 2,
  },
  iconPill: {
    width: 48,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  iconPillActive: {
    backgroundColor: colors.primarySoft,
  },
  tabEmoji: {
    fontSize: 20,
    opacity: 0.35,
  },
  tabEmojiActive: {
    opacity: 1,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textLight,
    marginTop: 3,
    letterSpacing: 0.1,
  },
  tabLabelActive: {
    color: colors.primary,
    fontWeight: '800',
  },
});

export default TabNavigator;
