import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import ScannerScreen from '../screens/scanner/ScannerScreen';
import ProductResultScreen from '../screens/scanner/ProductResultScreen';
import ScanHistoryScreen from '../screens/scanner/ScanHistoryScreen';
const colors = require('../utils/colors');

const Stack = createStackNavigator();

const ScannerNavigator = () => (
  <Stack.Navigator
    screenOptions={{
      headerStyle: { backgroundColor: colors.white, elevation: 0, shadowOpacity: 0 },
      headerTintColor: colors.textPrimary,
      headerTitleStyle: { fontWeight: '700' },
    }}
  >
    <Stack.Screen name="Scanner" component={ScannerScreen} options={{ headerShown: false }} />
    <Stack.Screen name="ProductResult" component={ProductResultScreen} options={{ title: 'Resultat' }} />
    <Stack.Screen name="ScanHistory" component={ScanHistoryScreen} options={{ title: 'Historique' }} />
  </Stack.Navigator>
);

export default ScannerNavigator;
