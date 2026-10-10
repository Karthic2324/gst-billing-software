import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  ScrollView,
  Alert,
} from 'react-native';
import axios from 'axios';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import API from './api';

export default function InvoiceHistoryScreen({ navigation }) {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch past invoices from Spring Boot
  const fetchInvoiceHistory = async () => {
    try {
      setLoading(true);
      const response = await API.get('/invoices');
      setInvoices(response.data);
    } catch (error) {
      console.error('Error loading invoice history:', error.response?.data || error.message);
      Alert.alert('Error', 'Failed to fetch invoice history from server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoiceHistory();
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, padding: 16, backgroundColor: '#fff' }}>
      <Text style={{ fontSize: 22, fontWeight: 'bold', marginBottom: 15 }}>
        Invoice History
      </Text>

      <FlatList
        data={invoices}
        keyExtractor={(item) => item.id.toString()}
        onRefresh={fetchInvoiceHistory}
        refreshing={loading}
        renderItem={({ item }) => (
          <View
            style={{
              padding: 15,
              borderWidth: 1,
              borderColor: '#e0e0e0',
              borderRadius: 8,
              marginBottom: 10,
              backgroundColor: '#f9f9f9',
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: 'bold' }}>
              Invoice #{item.id} - {item.customerName || 'Walk-in Customer'}
            </Text>
            <Text style={{ color: '#555', marginTop: 4 }}>
              Phone: {item.customerPhone || 'N/A'}
            </Text>
            <Text
              style={{
                fontSize: 15,
                fontWeight: '600',
                color: '#2e7d32',
                marginTop: 6,
              }}
            >
              Total: ₹{item.totalAmount}
            </Text>
          </View>
        )}
      />
    </View>
  );
}