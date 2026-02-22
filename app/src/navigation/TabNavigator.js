import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
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
import { View, Text, StyleSheet } from 'react-native';
const colors = require('../utils/colors');

const Tab = createBottomTabNavigator();
const PetSittingStack = createStackNavigator();
const ProfileStack = createStackNavigator();

const PetSittingNavigator = () => (
  <PetSittingStack.Navigator
    screenOptions={{
      headerStyle: { backgroundColor: colors.white, elevation: 0, shadowOpacity: 0 },
      headerTintColor: colors.textPrimary,
      headerTitleStyle: { fontWeight: '700' },
    }}
  >
    <PetSittingStack.Screen name="PetSittersList" component={PetSittersListScreen} options={{ title: 'Garde' }} />
    <PetSittingStack.Screen name="PetSitterDetail" component={PetSitterDetailScreen} options={{ title: 'Gardien' }} />
    <PetSittingStack.Screen name="Booking" component={BookingScreen} options={{ title: 'Reserver' }} />
    <PetSittingStack.Screen name="Messages" component={MessagesScreen} options={{ title: 'Messages' }} />
  </PetSittingStack.Navigator>
);

const ProfileNavigator = () => (
  <ProfileStack.Navigator
    screenOptions={{
      headerStyle: { backgroundColor: colors.white, elevation: 0, shadowOpacity: 0 },
      headerTintColor: colors.textPrimary,
      headerTitleStyle: { fontWeight: '700' },
    }}
  >
    <ProfileStack.Screen name="ProfileMain" component={ProfileScreen} options={{ title: 'Profil' }} />
    <ProfileStack.Screen name="MyPets" component={MyPetsScreen} options={{ title: 'Mes Animaux' }} />
    <ProfileStack.Screen name="AddPet" component={AddPetScreen} options={{ title: 'Ajouter un animal' }} />
    <ProfileStack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Parametres' }} />
  </ProfileStack.Navigator>
);

const TabIcon = ({ label, focused }) => (
  <View style={styles.tabIcon}>
    <Text style={[styles.tabEmoji, focused && styles.tabEmojiActive]}>
      {label === 'Accueil' ? '🏠' : label === 'Scanner' ? '📷' : label === 'Garde' ? '🐾' : '👤'}
    </Text>
  </View>
);

const TabNavigator = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      headerShown: false,
      tabBarIcon: ({ focused }) => <TabIcon label={route.name} focused={focused} />,
      tabBarActiveTintColor: colors.primary,
      tabBarInactiveTintColor: colors.textLight,
      tabBarStyle: {
        height: 60,
        paddingBottom: 8,
        paddingTop: 8,
        backgroundColor: colors.white,
        borderTopWidth: 1,
        borderTopColor: colors.border,
      },
      tabBarLabelStyle: {
        fontSize: 11,
        fontWeight: '600',
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
  tabIcon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabEmoji: {
    fontSize: 22,
    opacity: 0.5,
  },
  tabEmojiActive: {
    opacity: 1,
  },
});

export default TabNavigator;
