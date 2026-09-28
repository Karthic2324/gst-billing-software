import React, { useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, SafeAreaView, StatusBar } from 'react-native';
import { registerRootComponent } from 'expo';
import LoginScreen from './LoginScreen';
import InvoiceAppScreen from './InvoiceAppScreen';
import InvoiceHistoryScreen from './InvoiceHistoryScreen';

function App() {
  const [user, setUser] = useState(null);
  const [currentTab, setCurrentTab] = useState('CREATE');

  if (!user) {
    return <LoginScreen onLoginSuccess={(userData) => setUser(userData)} />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#001c2c" />
      
      {/* Top Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Om Muruga Auto Electrical Works</Text>
        <TouchableOpacity onPress={() => setUser(null)} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Navigation Tabs */}
      <View style={styles.navBar}>
        <TouchableOpacity
          style={[styles.navTab, currentTab === 'CREATE' && styles.activeTab]}
          onPress={() => setCurrentTab('CREATE')}
        >
          <Text style={[styles.navText, currentTab === 'CREATE' && styles.activeNavText]}>+ New Bill</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navTab, currentTab === 'HISTORY' && styles.activeTab]}
          onPress={() => setCurrentTab('HISTORY')}
        >
          <Text style={[styles.navText, currentTab === 'HISTORY' && styles.activeNavText]}>History</Text>
        </TouchableOpacity>
      </View>

      {/* Screen Content */}
      <View style={{ flex: 1 }}>
        {currentTab === 'CREATE' ? <InvoiceAppScreen /> : <InvoiceHistoryScreen />}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#001c2c', padding: 16, borderBottomWidth: 1, borderBottomColor: '#334155' },
  headerTitle: { color: '#f5f115', fontWeight: 'bold', fontSize: 16 },
  logoutBtn: { backgroundColor: '#ef4444', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 4 },
  logoutText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
  navBar: { flexDirection: 'row', backgroundColor: '#1e293b', borderBottomWidth: 1, borderBottomColor: '#334155' },
  navTab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  activeTab: { borderBottomWidth: 2, borderBottomColor: '#38bdf8', backgroundColor: '#0f172a' },
  navText: { color: '#94a3b8', fontWeight: '600', fontSize: 14 },
  activeNavText: { color: '#38bdf8' },
});

registerRootComponent(App);