import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { COLORS } from '../utils/colors';
import HomeScreen from '../screens/HomeScreen';
import ScannerNavigator from './ScannerNavigator';
import PetSittersListScreen from '../screens/petsitting/PetSittersListScreen';
import PetSitterDetailScreen from '../screens/petsitting/PetSitterDetailScreen';
import BookingScreen from '../screens/petsitting/BookingScreen';
import MessagesScreen from '../screens/petsitting/MessagesScreen';
import PetSitterProfileScreen from '../screens/petsitting/PetSitterProfileScreen';
import PetSitterBookingsScreen from '../screens/petsitting/PetSitterBookingsScreen';
import AIAssistantScreen from '../screens/ai/AIAssistantScreen';
import GuestGateScreen from '../screens/auth/GuestGateScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import MyPetsScreen from '../screens/profile/MyPetsScreen';
import AddPetScreen from '../screens/profile/AddPetScreen';
import SettingsScreen from '../screens/profile/SettingsScreen';
import InstallGuideScreen from '../screens/profile/InstallGuideScreen';
import AdminDashboardScreen from '../screens/admin/AdminDashboardScreen';
import AdminUsersScreen from '../screens/admin/AdminUsersScreen';

const Tab = createBottomTabNavigator();
const RootStack = createStackNavigator();
const PetSittingStack = createStackNavigator();
const ProfileStack = createStackNavigator();
const AuthStack = createStackNavigator();

const stackScreenOptions = {
  headerStyle: {
    backgroundColor: COLORS.white,
    elevation: 0,
    shadowOpacity: 0,
    borderBottomWidth: 0,
  },
  headerTintColor: COLORS.primary,
  headerTitleStyle: { fontWeight: '700', fontSize: 18, color: COLORS.text },
  headerBackTitleVisible: false,
  cardStyle: {
    backgroundColor: COLORS.background,
    ...(Platform.OS === 'web' ? { minHeight: 0, overflow: 'hidden' } : {}),
  },
};

const PetSittingNavigator = () => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <GuestGateScreen />;
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
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <GuestGateScreen />;
  return (
    <ProfileStack.Navigator screenOptions={stackScreenOptions}>
      <ProfileStack.Screen name="ProfileMain" component={ProfileScreen} options={{ headerShown: false }} />
      <ProfileStack.Screen name="MyPets" component={MyPetsScreen} options={{ title: 'Mes Animaux' }} />
      <ProfileStack.Screen name="AddPet" component={AddPetScreen} options={{ title: 'Nouvel Animal' }} />
      <ProfileStack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Réglages' }} />
      <ProfileStack.Screen name="PetSitterProfile" component={PetSitterProfileScreen} options={{ headerShown: false }} />
      <ProfileStack.Screen name="PetSitterBookings" component={PetSitterBookingsScreen} options={{ headerShown: false }} />
      <ProfileStack.Screen name="InstallGuide" component={InstallGuideScreen} options={{ headerShown: false }} />
    </ProfileStack.Navigator>
  );
};

const AuthNavigatorStack = () => (
  <AuthStack.Navigator screenOptions={{ headerShown: false }}>
    <AuthStack.Screen name="Login" component={LoginScreen} />
    <AuthStack.Screen name="Register" component={RegisterScreen} />
  </AuthStack.Navigator>
);

// ─── 3 tabs ──────────────────────────────────────────────
const VISIBLE_TABS = {
  Accueil: { icon: 'home', label: 'Accueil' },
  Scanner: { icon: 'maximize', label: 'Scanner' },
  Profil: { icon: 'user', label: 'Profil' },
};

const TabIcon = ({ routeName, focused }) => {
  const config = VISIBLE_TABS[routeName];
  if (!config) return null;
  return (
    <View style={[styles.tabItem, focused && styles.tabItemActive]}>
      <Feather name={config.icon} size={22} color={focused ? COLORS.primary : '#B8C4BC'} />
      <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>{config.label}</Text>
      {focused && <View style={styles.activeDot} />}
    </View>
  );
};

const ThreeTabs = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      headerShown: false,
      tabBarIcon: ({ focused }) => <TabIcon routeName={route.name} focused={focused} />,
      tabBarLabel: () => null,
      tabBarStyle: {
        height: Platform.OS === 'ios' ? 88 : 64,
        paddingBottom: Platform.OS === 'ios' ? 28 : 8,
        paddingTop: Platform.OS === 'ios' ? 10 : 6,
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

const TabNavigator = () => (
  <RootStack.Navigator screenOptions={{ headerShown: false, presentation: 'card' }}>
    <RootStack.Screen name="Tabs" component={ThreeTabs} />
    <RootStack.Screen name="Garde" component={PetSittingNavigator} />
    <RootStack.Screen name="Assistant" component={AIAssistantScreen} />
    <RootStack.Screen name="AuthStack" component={AuthNavigatorStack} />
    <RootStack.Screen name="AdminDashboard" component={AdminDashboardScreen} />
    <RootStack.Screen name="AdminUsers" component={AdminUsersScreen} />
  </RootStack.Navigator>
);

const styles = StyleSheet.create({
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 22,
    position: 'relative',
  },
  tabItemActive: {
    backgroundColor: COLORS.primary + '12',
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: '#B8C4BC',
    letterSpacing: 0.3,
  },
  tabLabelActive: {
    color: COLORS.primary,
    fontWeight: '800',
  },
  activeDot: {
    position: 'absolute',
    bottom: 2,
    width: 18,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: COLORS.primary,
  },
});

export default TabNavigator;
