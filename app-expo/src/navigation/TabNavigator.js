import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import HomeScreen from '../screens/HomeScreen';
import ScannerNavigator from './ScannerNavigator';
import PetSittersListScreen from '../screens/petsitting/PetSittersListScreen';
import PetSitterDetailScreen from '../screens/petsitting/PetSitterDetailScreen';
import BookingScreen from '../screens/petsitting/BookingScreen';
import MessagesScreen from '../screens/petsitting/MessagesScreen';
import AIAssistantScreen from '../screens/ai/AIAssistantScreen';
import GuestGateScreen from '../screens/auth/GuestGateScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import MyPetsScreen from '../screens/profile/MyPetsScreen';
import AddPetScreen from '../screens/profile/AddPetScreen';
import SettingsScreen from '../screens/profile/SettingsScreen';
const colors = require('../utils/colors');

const Tab = createBottomTabNavigator();
const PetSittingStack = createStackNavigator();
const ProfileStack = createStackNavigator();

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

const AuthStack = createStackNavigator();
const AuthNavigatorStack = () => (
  <AuthStack.Navigator screenOptions={{ headerShown: false }}>
    <AuthStack.Screen name="Login" component={LoginScreen} />
    <AuthStack.Screen name="Register" component={RegisterScreen} />
  </AuthStack.Navigator>
);

// Tab configuration with Feather icon and label
const TAB_CONFIG = {
  Accueil:   { icon: 'home', label: 'Accueil' },
  Scanner:   { icon: 'maximize', label: 'Scanner' },
  Garde:     { icon: 'users', label: 'Garde' },
  Assistant: { icon: 'message-circle', label: 'IA' },
  Profil:    { icon: 'user', label: 'Profil' },
};

const TabIcon = ({ routeName, focused }) => {
  const config = TAB_CONFIG[routeName];
  return (
    <View style={styles.tabItem}>
      <View style={[styles.iconPill, focused && styles.iconPillActive]}>
        <Feather
          name={config?.icon || 'circle'}
          size={22}
          color={focused ? colors.primary : colors.textTertiary}
        />
      </View>
      <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>
        {config?.label}
      </Text>
    </View>
  );
};

const TabNavigator = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      headerShown: false,
      tabBarIcon: ({ focused }) => <TabIcon routeName={route.name} focused={focused} />,
      tabBarLabel: () => null,
      tabBarActiveTintColor: colors.primary,
      tabBarInactiveTintColor: colors.textLight,
      tabBarStyle: {
        height: Platform.OS === 'ios' ? 86 : 68,
        paddingBottom: Platform.OS === 'ios' ? 22 : 6,
        paddingTop: 6,
        backgroundColor: colors.white,
        borderTopWidth: 1,
        borderTopColor: colors.borderLight,
        shadowColor: '#2C3E2F',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.06,
        shadowRadius: 12,
        elevation: 8,
      },
    })}
  >
    <Tab.Screen name="Accueil" component={HomeScreen} />
    <Tab.Screen name="Scanner" component={ScannerNavigator} />
    <Tab.Screen name="Garde" component={PetSittingNavigator} />
    <Tab.Screen name="Assistant" component={AIAssistantScreen} />
    <Tab.Screen name="Profil" component={ProfileNavigator} />
    {/* Hidden screen for auth flows */}
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
    width: 52,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  iconPillActive: {
    backgroundColor: colors.primarySoft,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.textLight,
    marginTop: 3,
  },
  tabLabelActive: {
    color: colors.primary,
    fontWeight: '700',
  },
});

export default TabNavigator;
