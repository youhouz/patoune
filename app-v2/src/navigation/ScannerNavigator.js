import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { COLORS } from '../utils/colors';
import ScannerScreen from '../screens/scanner/ScannerScreen';
import ProductResultScreen from '../screens/scanner/ProductResultScreen';
import ScanHistoryScreen from '../screens/scanner/ScanHistoryScreen';
import FavoritesScreen from '../screens/scanner/FavoritesScreen';

const Stack = createStackNavigator();

const ScannerNavigator = () => (
  <Stack.Navigator
    screenOptions={{
      headerStyle: {
        backgroundColor: COLORS.white,
        elevation: 0,
        shadowOpacity: 0,
        borderBottomWidth: 0,
      },
      headerTintColor: COLORS.primary,
      headerTitleStyle: {
        fontWeight: '700',
        fontSize: 17,
        color: COLORS.text,
      },
      headerBackTitleVisible: false,
      cardStyle: { backgroundColor: COLORS.background },
    }}
  >
    <Stack.Screen name="ScannerMain" component={ScannerScreen} options={{ headerShown: false }} />
    <Stack.Screen name="ProductResult" component={ProductResultScreen} options={{ headerShown: false }} />
    <Stack.Screen name="ScanHistory" component={ScanHistoryScreen} options={{ headerShown: false }} />
    <Stack.Screen name="Favorites" component={FavoritesScreen} options={{ headerShown: false }} />
  </Stack.Navigator>
);

export default ScannerNavigator;
