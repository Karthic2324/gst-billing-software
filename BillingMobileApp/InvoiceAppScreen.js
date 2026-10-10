import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import API from './api'; // Imports from BillingMobileApp/api.js

export default function InvoiceAppScreen() {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);

  // FETCH VENDOR CALL FROM SPRING BOOT
  const fetchVendors = async () => {
    try {
      const response = await API.get('/vendor/all');
      setVendors(response.data);
    } catch (error) {
      console.error('Error fetching vendors:', error.response?.data || error.message);
      Alert.alert('Error', 'Failed to load vendors from Spring Boot');
    } finally {
      setLoading(false);
    }
  };


   const handleLogout = async () => {
  await AsyncStorage.removeItem('userToken');
  navigation.replace('Login');
};

// Add inside your UI View layout:
<View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 }}>
  <TouchableOpacity 
    onPress={() => navigation.navigate('InvoiceHistory')}
    style={{ backgroundColor: '#007AFF', padding: 10, borderRadius: 5 }}
  >
    <Text style={{ color: '#fff', fontWeight: 'bold' }}>View History</Text>
  </TouchableOpacity>

  <TouchableOpacity 
    onPress={handleLogout}
    style={{ backgroundColor: '#dc3545', padding: 10, borderRadius: 5 }}
  >
    <Text style={{ color: '#fff', fontWeight: 'bold' }}>Logout</Text>
  </TouchableOpacity>
</View>
  // SAVE INVOICE TO SPRING BOOT BACKEND
  const saveInvoiceToBackend = async (customerName, customerPhone, items, subtotal, taxAmount, totalAmount) => {
    try {
      const payload = {
        customerName,
        customerPhone,
        subtotal,
        taxAmount,
        totalAmount,
        items: items.map(item => ({
          description: item.name,
          quantity: item.qty,
          price: item.price,
          total: item.qty * item.price,
        })),
      };

      const response = await API.post('/invoices', payload);
      Alert.alert('Success', `Invoice #${response.data.id} saved successfully!`);
    } catch (error) {
      console.error('Error saving invoice:', error.response?.data || error.message);
      Alert.alert('Error', 'Failed to save invoice to backend');
    }
  };

  useEffect(() => {
    fetchVendors();
  }, []);

  if (loading) {
    return <ActivityIndicator size="large" style={{ flex: 1, justifyContent: 'center' }} />;
  }

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 10 }}>Vendor List</Text>
      <FlatList
        data={vendors}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={{ padding: 12, borderBottomWidth: 1, borderColor: '#ccc' }}>
            <Text style={{ fontWeight: 'bold' }}>{item.businessName}</Text>
            <Text>{item.email} | {item.phone}</Text>
          </View>
        )}
      />
    </View>
    
  );
}