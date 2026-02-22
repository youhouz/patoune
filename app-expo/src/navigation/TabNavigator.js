import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { View, Text, StyleSheet, Platform } from 'react-native';
import HomeScreen from '../screens/HomeScreen';
import ScannerNavigator from './ScannerNavigator';
import PetSittersListScreen from '../screens/petsitting/PetSittersListScreen';
import PetSitterDetailScreen from '../screens/petsitting/PetSitterDetailScreen';
import BookingScreen from '../screens/petsitting/BookingScreen';
import MessagesScreen from '../screens/petsitting/MessagesScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import MyPetsScreen from '../screens/profile/MyPetsScreen';
import AddPetScreen from '../screens/profile/AddPetScreen';
import SettingsScreen from '../screens/profile/SettingsScreen';
const colors = require('../utils/colors');
const { SHADOWS } = require('../utils/colors');

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
    fontSize: 17,
    color: colors.text,
  },
  headerBackTitleVisible: false,
  cardStyle: { backgroundColor: colors.background },
};

const PetSittingNavigator = () => (
  <PetSittingStack.Navigator screenOptions={stackScreenOptions}>
    <PetSittingStack.Screen name="PetSittersList" component={PetSittersListScreen} options={{ headerShown: false }} />
    <PetSittingStack.Screen name="PetSitterDetail" component={PetSitterDetailScreen} options={{ headerShown: false }} />
    <PetSittingStack.Screen name="Booking" component={BookingScreen} options={{ title: 'Reserver' }} />
    <PetSittingStack.Screen name="Messages" component={MessagesScreen} options={{ title: 'Messages' }} />
  </PetSittingStack.Navigator>
);

const ProfileNavigator = () => (
  <ProfileStack.Navigator screenOptions={stackScreenOptions}>
    <ProfileStack.Screen name="ProfileMain" component={ProfileScreen} options={{ headerShown: false }} />
    <ProfileStack.Screen name="MyPets" component={MyPetsScreen} options={{ title: 'Mes Animaux' }} />
    <ProfileStack.Screen name="AddPet" component={AddPetScreen} options={{ title: 'Nouvel Animal' }} />
    <ProfileStack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Reglages' }} />
  </ProfileStack.Navigator>
);

const TAB_ICONS = {
  Accueil: { default: '🏠', active: '🏠' },
  Scanner: { default: '📷', active: '📷' },
  Garde: { default: '🐾', active: '🐾' },
  Profil: { default: '👤', active: '👤' },
};

const TabIcon = ({ route, focused }) => (
  <View style={[styles.tabIconWrap, focused && styles.tabIconActive]}>
    <Text style={[styles.tabEmoji, focused && styles.tabEmojiActive]}>
      {TAB_ICONS[route]?.default || '•'}
    </Text>
    {focused && <View style={styles.activeDot} />}
  </View>
);

const TabNavigator = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      headerShown: false,
      tabBarIcon: ({ focused }) => <TabIcon route={route.name} focused={focused} />,
      tabBarActiveTintColor: colors.primary,
      tabBarInactiveTintColor: colors.textLight,
      tabBarStyle: {
        height: Platform.OS === 'ios' ? 88 : 68,
        paddingBottom: Platform.OS === 'ios' ? 28 : 10,
        paddingTop: 10,
        backgroundColor: colors.white,
        borderTopWidth: 0,
        ...SHADOWS.lg,
      },
      tabBarLabelStyle: {
        fontSize: 11,
        fontWeight: '600',
        marginTop: -2,
      },
    })}
  >
    <Tab.Screen name="Accueil" component={HomeScreen} />
    <Tab.Screen name="Scanner" component={ScannerNavigator} />
    <Tab.Screen name="Garde" component={PetSittingNavigator} />
    <Tab.Screen name="Profil" component={ProfileNavigator} />
  </Tab.Navigator>
);

const styles = StyleSheet.create({
  tabIconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 44,
    height: 32,
  },
  tabIconActive: {
    // no transform needed
  },
  tabEmoji: {
    fontSize: 22,
    opacity: 0.4,
  },
  tabEmojiActive: {
    opacity: 1,
    fontSize: 24,
  },
  activeDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: colors.primary,
    marginTop: 3,
  },
});

export default TabNavigator;
