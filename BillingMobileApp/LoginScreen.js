import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import API from './api'; // Imports from BillingMobileApp/api.js

export default function LoginScreen({ navigation }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // AUTHENTICATION CALL TO SPRING BOOT
  const handleLogin = async () => {
    // 1. Trim leading/trailing whitespace
    const cleanUsername = username.trim();
    const cleanPassword = password.trim();

    if (!cleanUsername || !cleanPassword) {
      Alert.alert('Error', 'Please enter username and password');
      return;
    }

    try {
      console.log('Attempting login for:', cleanUsername);
      
      const response = await API.post('/auth/login', { 
        username: cleanUsername, 
        password: cleanPassword 
      });
      
      console.log('Login Response:', response.data);

      // Save JWT token locally
      const token = response.data.token;
      await AsyncStorage.setItem('userToken', token);

      Alert.alert('Success', 'Logged in successfully!');
      
      // Navigate to main application screen
      navigation.navigate('InvoiceApp'); 
    } catch (error) {
      console.error('Login error status:', error.response?.status);
      console.error('Login error details:', error.response?.data);

      // Extract exact message returned by Spring Boot
      const serverMessage = typeof error.response?.data === 'string' 
        ? error.response.data 
        : error.response?.data?.message || error.message;

      Alert.alert('Login Failed', serverMessage || 'Invalid credentials or server unavailable');
    }
  };

  return (
    <View style={{ padding: 20, justifyContent: 'center', flex: 1 }}>
      <TextInput
        placeholder="Username"
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
        style={{ borderWidth: 1, padding: 10, marginBottom: 10, borderRadius: 5 }}
      />
      <TextInput
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        autoCapitalize="none"
        style={{ borderWidth: 1, padding: 10, marginBottom: 15, borderRadius: 5 }}
      />
      <TouchableOpacity 
        onPress={handleLogin}
        style={{ backgroundColor: '#007AFF', padding: 12, borderRadius: 5, alignItems: 'center' }}
      >
        <Text style={{ color: '#fff', fontWeight: 'bold' }}>Login</Text>
      </TouchableOpacity>
    </View>
  );
}