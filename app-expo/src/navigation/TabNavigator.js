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
import PetSitterProfileScreen from '../screens/petsitting/PetSitterProfileScreen';
import PetSitterBookingsScreen from '../screens/petsitting/PetSitterBookingsScreen';
import AIAssistantScreen from '../screens/ai/AIAssistantScreen';
import PaywallScreen from '../screens/paywall/PaywallScreen';
import LostPetsScreen from '../screens/lost-pets/LostPetsScreen';
import CreateLostPetScreen from '../screens/lost-pets/CreateLostPetScreen';
import LostPetDetailScreen from '../screens/lost-pets/LostPetDetailScreen';
import HealthRecordScreen from '../screens/health/HealthRecordScreen';
import ProsScreen from '../screens/pros/ProsScreen';
import ProDetailScreen from '../screens/pros/ProDetailScreen';
import InsuranceScreen from '../screens/insurance/InsuranceScreen';
import GuestGateScreen from '../screens/auth/GuestGateScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import MyPetsScreen from '../screens/profile/MyPetsScreen';
import AddPetScreen from '../screens/profile/AddPetScreen';
import SettingsScreen from '../screens/profile/SettingsScreen';
import FeedbackScreen from '../screens/profile/FeedbackScreen';
import AdminDashboardScreen from '../screens/admin/AdminDashboardScreen';
import AdminUsersScreen from '../screens/admin/AdminUsersScreen';
const colors = require('../utils/colors');

const Tab = createBottomTabNavigator();
const RootStack = createStackNavigator();
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
  headerTitleStyle: { fontWeight: '700', fontSize: 18, color: colors.text },
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
      <ProfileStack.Screen name="Feedback" component={FeedbackScreen} options={{ headerShown: false }} />
      <ProfileStack.Screen name="AdminDashboard" component={AdminDashboardScreen} options={{ headerShown: false }} />
      <ProfileStack.Screen name="AdminUsers" component={AdminUsersScreen} options={{ headerShown: false }} />
      <ProfileStack.Screen name="PetSitterProfile" component={PetSitterProfileScreen} options={{ headerShown: false }} />
      <ProfileStack.Screen name="PetSitterBookings" component={PetSitterBookingsScreen} options={{ headerShown: false }} />
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

// ─── 3 tabs uniquement ──────────────────────────────────
const VISIBLE_TABS = {
  Accueil: { icon: 'home',     label: 'Accueil' },
  Scanner: { icon: 'maximize', label: 'Scanner' },
  Profil:  { icon: 'user',     label: 'Profil'  },
};

const TabIcon = ({ routeName, focused }) => {
  const config = VISIBLE_TABS[routeName];
  if (!config) return null;
  return (
    <View style={[styles.tabItem, focused && styles.tabItemActive]}>
      <Feather
        name={config.icon}
        size={22}
        color={focused ? colors.primary : '#B8C4BC'}
      />
      <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>
        {config.label}
      </Text>
      {focused && <View style={styles.activeDot} />}
    </View>
  );
};

// Tab avec SEULEMENT 3 écrans — aucun écran caché
const ThreeTabs = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      headerShown: false,
      tabBarIcon: ({ focused }) => <TabIcon routeName={route.name} focused={focused} />,
      tabBarLabel: () => null,
      tabBarStyle: {
        height: Platform.OS === 'ios' ? 84 : 68,
        paddingBottom: Platform.OS === 'ios' ? 24 : 0,
        paddingTop: 0,
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.06)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 6,
      },
      tabBarItemStyle: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
      },
    })}
  >
    <Tab.Screen name="Accueil" component={HomeScreen} />
    <Tab.Screen name="Scanner" component={ScannerNavigator} />
    <Tab.Screen
      name="Profil"
      component={ProfileNavigator}
      listeners={({ navigation }) => ({
        tabPress: () => {
          navigation.navigate('Profil', { screen: 'ProfileMain' });
        },
      })}
    />
  </Tab.Navigator>
);

// Root Stack — overlay les écrans hors tab bar
const TabNavigator = () => (
  <RootStack.Navigator screenOptions={{ headerShown: false, presentation: 'card' }}>
    <RootStack.Screen name="Tabs"           component={ThreeTabs} />
    <RootStack.Screen name="Garde"          component={PetSittingNavigator} />
    <RootStack.Screen name="Assistant"      component={AIAssistantScreen} />
    <RootStack.Screen name="Paywall"        component={PaywallScreen} options={{ presentation: 'modal' }} />
    <RootStack.Screen name="LostPets"       component={LostPetsScreen} />
    <RootStack.Screen name="CreateLostPet"  component={CreateLostPetScreen} />
    <RootStack.Screen name="LostPetDetail"  component={LostPetDetailScreen} />
    <RootStack.Screen name="HealthRecord"   component={HealthRecordScreen} />
    <RootStack.Screen name="Pros"           component={ProsScreen} />
    <RootStack.Screen name="ProDetail"      component={ProDetailScreen} />
    <RootStack.Screen name="Insurance"      component={InsuranceScreen} />
    <RootStack.Screen name="AuthStack"      component={AuthNavigatorStack} />
  </RootStack.Navigator>
);

const styles = StyleSheet.create({
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 18,
    paddingVertical: 6,
    borderRadius: 20,
    position: 'relative',
  },
  tabItemActive: {
    backgroundColor: colors.primary + '12',
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: '#B8C4BC',
    letterSpacing: 0.3,
  },
  tabLabelActive: {
    color: colors.primary,
    fontWeight: '800',
  },
  activeDot: {
    position: 'absolute',
    bottom: 1,
    width: 18,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: colors.primary,
  },
});

export default TabNavigator;
