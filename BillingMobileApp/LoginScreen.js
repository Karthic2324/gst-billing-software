import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import axios from 'axios';

const API_BASE_URL = 'https://om-muruga-auto-electrical-works.onrender.com';

const LoginScreen = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      setError('Please fill in all fields.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/login`, {
        username: username.trim(),
        password: password.trim(),
      });

      if (response.data) {
        Alert.alert('Success', 'Login successful!');
        if (onLoginSuccess) {
          onLoginSuccess(response.data);
        }
      }
    } catch (err) {
      const message = err.response?.data?.message || 'Invalid username or password.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0f172a" />
      <View style={styles.card}>
        <Text style={styles.title}>GST Billing Studio</Text>
        <Text style={styles.subtitle}>Om Muruga Auto Electrical Works</Text>

        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Username</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter username"
            placeholderTextColor="#64748b"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter password"
            placeholderTextColor="#64748b"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </View>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.buttonText}>Sign In</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a', justifyContent: 'center', alignItems: 'center', padding: 16 },
  card: { width: '100%', maxWidth: 380, padding: 24, borderRadius: 12, backgroundColor: '#1e293b', borderWidth: 1, borderColor: '#334155' },
  title: { fontSize: 22, fontWeight: 'bold', color: '#f8fafc', textAlign: 'center', marginBottom: 4 },
  subtitle: { fontSize: 13, color: '#94a3b8', textAlign: 'center', marginBottom: 20 },
  errorContainer: { backgroundColor: 'rgba(239, 68, 68, 0.15)', borderWidth: 1, borderColor: '#ef4444', padding: 10, borderRadius: 6, marginBottom: 16 },
  errorText: { color: '#ef4444', fontSize: 13, textAlign: 'center' },
  inputGroup: { marginBottom: 16 },
  label: { color: '#cbd5e1', fontSize: 13, marginBottom: 6, fontWeight: '500' },
  input: { backgroundColor: '#0f172a', color: '#fff', padding: 10, borderRadius: 6, borderWidth: 1, borderColor: '#334155', fontSize: 15 },
  button: { backgroundColor: '#2563eb', paddingVertical: 12, borderRadius: 6, alignItems: 'center', marginTop: 8 },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: '#ffffff', fontWeight: '600', fontSize: 15 },
});

export default LoginScreen;