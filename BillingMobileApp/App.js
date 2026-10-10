import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import LoginScreen from './LoginScreen';
import InvoiceAppScreen from './InvoiceAppScreen';
import InvoiceHistoryScreen from './InvoiceHistoryScreen';

const Stack = createStackNavigator();

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [userToken, setUserToken] = useState(null);

  useEffect(() => {
    const checkToken = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        setUserToken(token);
      } catch (e) {
        console.error('Error reading token:', e);
      } finally {
        setIsLoading(false);
      }
    };
    checkToken();
  }, []);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName={userToken ? "InvoiceApp" : "Login"}>
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        <Stack.Screen name="InvoiceApp" component={InvoiceAppScreen} options={{ title: 'Billing Dashboard' }} />
        <Stack.Screen name="InvoiceHistory" component={InvoiceHistoryScreen} options={{ title: 'Invoice History' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}