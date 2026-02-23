// ---------------------------------------------------------------------------
// Patoune v2.0 - Tab Navigator
// 5 tabs with custom tab bar: Accueil, Scanner, Assistant (center), Garde, Profil
// Terracotta active state with filled background circle behind icon.
// ---------------------------------------------------------------------------

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';

// Screens
import HomeScreen from '../screens/HomeScreen';
import ScannerNavigator from './ScannerNavigator';
import AIAssistantScreen from '../screens/ai/AIAssistantScreen';
import PetSittersListScreen from '../screens/petsitting/PetSittersListScreen';
import PetSitterDetailScreen from '../screens/petsitting/PetSitterDetailScreen';
import BookingScreen from '../screens/petsitting/BookingScreen';
import MessagesScreen from '../screens/petsitting/MessagesScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import MyPetsScreen from '../screens/profile/MyPetsScreen';
import AddPetScreen from '../screens/profile/AddPetScreen';
import SettingsScreen from '../screens/profile/SettingsScreen';

// Design system
import Icon from '../components/Icon';
import { COLORS, RADIUS, SHADOWS, SPACING } from '../utils/colors';
import { FONTS } from '../utils/typography';


const Tab = createBottomTabNavigator();
const PetSittingStack = createStackNavigator();
const ProfileStack = createStackNavigator();


// ---------------------------------------------------------------------------
// Stack screen options (shared)
// ---------------------------------------------------------------------------
const stackScreenOptions = {
  headerStyle: {
    backgroundColor: COLORS.white,
    elevation: 0,
    shadowOpacity: 0,
    borderBottomWidth: 0,
  },
  headerTintColor: COLORS.primary,
  headerTitleStyle: {
    fontFamily: FONTS.heading,
    fontSize: 17,
    color: COLORS.text,
  },
  headerBackTitleVisible: false,
  cardStyle: { backgroundColor: COLORS.background },
};


// ---------------------------------------------------------------------------
// Sub-navigators
// ---------------------------------------------------------------------------
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


// ---------------------------------------------------------------------------
// Tab configuration
// ---------------------------------------------------------------------------
const TAB_CONFIG = [
  { name: 'Accueil', icon: 'home', label: 'Accueil' },
  { name: 'Scanner', icon: 'camera', label: 'Scanner' },
  { name: 'Assistant', icon: 'message-circle', label: 'Assistant' },
  { name: 'Garde', icon: 'heart', label: 'Garde' },
  { name: 'Profil', icon: 'user', label: 'Profil' },
];


// ---------------------------------------------------------------------------
// Custom Tab Bar
// ---------------------------------------------------------------------------
const CustomTabBar = ({ state, descriptors, navigation }) => {
  return (
    <View style={tabStyles.container}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const config = TAB_CONFIG[index];
        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name, route.params);
          }
        };

        const onLongPress = () => {
          navigation.emit({
            type: 'tabLongPress',
            target: route.key,
          });
        };

        return (
          <TouchableOpacity
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel || config.label}
            onPress={onPress}
            onLongPress={onLongPress}
            style={tabStyles.tab}
            activeOpacity={0.7}
          >
            {/* Icon with active circle background */}
            <View style={[tabStyles.iconWrap, isFocused && tabStyles.iconWrapActive]}>
              <Icon
                name={config.icon}
                size={20}
                color={isFocused ? COLORS.primary : COLORS.pebble}
              />
            </View>

            {/* Label */}
            <Text
              style={[
                tabStyles.label,
                isFocused ? tabStyles.labelActive : tabStyles.labelInactive,
              ]}
              numberOfLines={1}
            >
              {config.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};


// ---------------------------------------------------------------------------
// Tab bar styles
// ---------------------------------------------------------------------------
const tabStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingBottom: Platform.OS === 'ios' ? 28 : 10,
    paddingTop: 8,
    height: Platform.OS === 'ios' ? 84 : 64,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  iconWrap: {
    width: 40,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapActive: {
    backgroundColor: COLORS.primarySoft,
  },
  label: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 11,
    textAlign: 'center',
  },
  labelActive: {
    color: COLORS.primary,
  },
  labelInactive: {
    color: COLORS.pebble,
  },
});


// ---------------------------------------------------------------------------
// Main Tab Navigator
// ---------------------------------------------------------------------------
const TabNavigator = () => (
  <Tab.Navigator
    tabBar={(props) => <CustomTabBar {...props} />}
    screenOptions={{ headerShown: false }}
  >
    <Tab.Screen name="Accueil" component={HomeScreen} />
    <Tab.Screen name="Scanner" component={ScannerNavigator} />
    <Tab.Screen name="Assistant" component={AIAssistantScreen} />
    <Tab.Screen name="Garde" component={PetSittingNavigator} />
    <Tab.Screen name="Profil" component={ProfileNavigator} />
  </Tab.Navigator>
);

export default TabNavigator;
