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
    }}
  >
    <Stack.Screen name="ScannerMain" component={ScannerScreen} options={{ headerShown: false }} />
    <Stack.Screen name="ProductResult" component={ProductResultScreen} options={{ headerShown: false }} />
    <Stack.Screen name="ScanHistory" component={ScanHistoryScreen} options={{ headerShown: false }} />
  </Stack.Navigator>
);

export default ScannerNavigator;
