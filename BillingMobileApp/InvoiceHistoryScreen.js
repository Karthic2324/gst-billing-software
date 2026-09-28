import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
} from 'react-native';
import axios from 'axios';

const API_BASE_URL = 'https://om-muruga-auto-electrical-works.onrender.com';

const InvoiceHistoryScreen = () => {
  const [invoices, setInvoices] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  // Fetch invoices on initial screen load
  useEffect(() => {
    fetchInvoices();
  }, []);

  // AUTO-RECTIFY: If user starts searching but invoices array is empty, re-fetch automatically
  useEffect(() => {
    if (searchQuery.trim() && invoices.length === 0 && !loading) {
      fetchInvoices();
    }
  }, [searchQuery]);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/api/invoices`);
      setInvoices(response.data || []);
    } catch (err) {
      console.log('Fetch history error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredInvoices = React.useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return [];

    return invoices.filter((inv) => {
      const name = (inv.buyerName || inv.customerName || '').toLowerCase();
      const invNo = (inv.invoiceNumber || inv.invoiceNo || '').toLowerCase();
      const date = (inv.invoiceDate || (inv.createdAt ? new Date(inv.createdAt).toLocaleDateString() : '')).toLowerCase();
      const phone = (inv.customerPhone || '').toLowerCase();
      const gstin = (inv.buyerGstin || inv.customerGstin || '').toLowerCase();

      return (
        name.includes(query) ||
        invNo.includes(query) ||
        date.includes(query) ||
        phone.includes(query) ||
        gstin.includes(query)
      );
    });
  }, [invoices, searchQuery]);

  const handleViewDetails = (invoice) => {
    setSelectedInvoice(invoice);
    setModalVisible(true);
  };

  const renderInvoiceItem = ({ item }) => {
    const invNo = item.invoiceNumber || item.invoiceNo || 'N/A';
    const name = item.buyerName || item.customerName || 'N/A';
    const total = item.totalAmount || item.grandTotal || 0;
    const date = item.invoiceDate || (item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'N/A');

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.invoiceNoText}>{invNo}</Text>
            <Text style={styles.buyerNameText}>{name}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.amountText}>₹{parseFloat(total).toFixed(2)}</Text>
            <Text style={styles.dateText}>{date}</Text>
          </View>
        </View>

        <View style={styles.cardDivider} />

        <View style={styles.cardFooter}>
          <Text style={styles.gstinText}>
            GSTIN: {item.buyerGstin || item.customerGstin || 'N/A'}
          </Text>
          <TouchableOpacity
            style={styles.viewBtn}
            onPress={() => handleViewDetails(item)}
          >
            <Text style={styles.viewBtnText}>View Workstation Invoice</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerBar}>
        <Text style={styles.headerTitle}>Invoice Search & Database</Text>
        <TouchableOpacity style={styles.refreshBtn} onPress={fetchInvoices}>
          <Text style={styles.refreshBtnText}>🔄 Refresh Data</Text>
        </TouchableOpacity>
      </View>

      <TextInput
        style={styles.searchInput}
        placeholder="Type Buyer Name, Bill No, Date (YYYY-MM-DD), or Phone..."
        placeholderTextColor="#64748b"
        value={searchQuery}
        onChangeText={setSearchQuery}
      />

      {loading ? (
        <View style={{ marginTop: 30, alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#ef4444" />
          <Text style={{ color: '#fff', marginTop: 10, fontSize: 12 }}>Connecting to database...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredInvoices}
          keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
          renderItem={renderInvoiceItem}
          refreshing={loading}
          onRefresh={fetchInvoices}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              {searchQuery.trim()
                ? 'No matching invoices found. Tap "Refresh Data" above if server was sleeping.'
                : 'Type in the search bar above to view invoice records.'}
            </Text>
          }
        />
      )}

      {selectedInvoice && (
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Tax Invoice View</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <Text style={styles.closeBtnText}>✕ Close</Text>
                </TouchableOpacity>
              </View>

              <ScrollView style={{ padding: 12 }}>
                <Text style={styles.companyTitle}>Om Muruga Auto Electrical Works 🦚</Text>
                <Text style={styles.companySubtext}>Invoice No: {selectedInvoice.invoiceNumber || selectedInvoice.invoiceNo}</Text>
                <Text style={styles.companySubtext}>Date: {selectedInvoice.invoiceDate}</Text>
                <Text style={styles.companySubtext}>Buyer: {selectedInvoice.buyerName || selectedInvoice.customerName}</Text>
                <Text style={styles.companySubtext}>Billing Address: {selectedInvoice.billingAddress || selectedInvoice.customerAddress || 'N/A'}</Text>
                <Text style={styles.companySubtext}>Buyer GSTIN: {selectedInvoice.buyerGstin || selectedInvoice.customerGstin || 'N/A'}</Text>

                <View style={styles.modalDivider} />

                <Text style={{ fontWeight: 'bold', fontSize: 12, marginBottom: 6, color: '#0f172a' }}>
                  Billed Items
                </Text>
                <View style={styles.tableHeader}>
                  <Text style={[styles.thText, { flex: 2 }]}>Item</Text>
                  <Text style={[styles.thText, { width: 40 }]}>HSN</Text>
                  <Text style={[styles.thText, { width: 35 }]}>Qty</Text>
                  <Text style={[styles.thText, { width: 50 }]}>Rate</Text>
                  <Text style={[styles.thText, { width: 60 }]}>Amount</Text>
                </View>

                {(selectedInvoice.items || []).map((it, idx) => {
                  const itemName = it.description || it.itemDescription || it.itemName || it.name || 'Service Item';
                  const itemHsn = it.hsn || 'N/A';
                  const itemQty = it.quantity || it.qty || 1;
                  const itemRate = it.price || it.rate || it.unitPrice || 0;
                  const itemAmount = it.amount || it.total || (itemQty * itemRate);

                  return (
                    <View key={idx} style={styles.tableRow}>
                      <Text style={[styles.tdText, { flex: 2, fontWeight: '500' }]}>{itemName}</Text>
                      <Text style={[styles.tdText, { width: 40 }]}>{itemHsn}</Text>
                      <Text style={[styles.tdText, { width: 35, textAlign: 'center' }]}>{itemQty}</Text>
                      <Text style={[styles.tdText, { width: 50, textAlign: 'right' }]}>₹{itemRate}</Text>
                      <Text style={[styles.tdText, { width: 60, textAlign: 'right', fontWeight: 'bold' }]}>
                        ₹{parseFloat(itemAmount).toFixed(2)}
                      </Text>
                    </View>
                  );
                })}

                <View style={styles.modalDivider} />

                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Taxable Value:</Text>
                  <Text style={styles.summaryValue}>₹{parseFloat(selectedInvoice.taxableValue || selectedInvoice.subtotal || 0).toFixed(2)}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>CGST (9%):</Text>
                  <Text style={styles.summaryValue}>₹{parseFloat(selectedInvoice.cgstAmount || 0).toFixed(2)}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>SGST (9%):</Text>
                  <Text style={styles.summaryValue}>₹{parseFloat(selectedInvoice.sgstAmount || 0).toFixed(2)}</Text>
                </View>
                <View style={[styles.summaryRow, { marginTop: 4 }]}>
                  <Text style={[styles.summaryLabel, { fontWeight: 'bold', color: '#0f172a' }]}>Grand Total:</Text>
                  <Text style={[styles.summaryValue, { fontWeight: 'bold', color: '#dc2626', fontSize: 16 }]}>
                    ₹{parseFloat(selectedInvoice.totalAmount || 0).toFixed(2)}
                  </Text>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#9ea8af', padding: 10 },
  headerBar: { backgroundColor: '#dc2626', padding: 10, borderRadius: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  headerTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  refreshBtn: { backgroundColor: '#10b981', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 4 },
  refreshBtnText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  searchInput: { backgroundColor: '#fff', color: '#000', padding: 10, borderRadius: 6, borderWidth: 1, borderColor: '#cbd5e1', marginBottom: 10, fontSize: 13 },
  card: { backgroundColor: '#fff', borderRadius: 6, borderWidth: 1, borderColor: '#000', padding: 12, marginBottom: 10 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  invoiceNoText: { fontSize: 14, fontWeight: 'bold', color: '#dc2626' },
  buyerNameText: { fontSize: 13, fontWeight: 'bold', color: '#0f172a', marginTop: 2 },
  amountText: { fontSize: 15, fontWeight: 'bold', color: '#059669' },
  dateText: { fontSize: 10, color: '#64748b', marginTop: 2 },
  cardDivider: { height: 1, backgroundColor: '#cbd5e1', marginVertical: 8 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  gstinText: { fontSize: 10, color: '#475569' },
  viewBtn: { backgroundColor: '#2563eb', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 4 },
  viewBtnText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  emptyText: { textAlign: 'center', color: '#fff', marginTop: 30, fontSize: 13, fontWeight: '500', paddingHorizontal: 20 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 14 },
  modalContent: { backgroundColor: '#fff', borderRadius: 8, maxHeight: '85%', borderWidth: 1, borderColor: '#000' },
  modalHeader: { backgroundColor: '#dc2626', padding: 12, borderTopLeftRadius: 7, borderTopRightRadius: 7, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalTitle: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  closeBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
  companyTitle: { fontSize: 13, fontWeight: 'bold', color: '#0f172a', marginBottom: 4 },
  companySubtext: { fontSize: 11, color: '#334155', marginBottom: 2 },
  modalDivider: { height: 1, backgroundColor: '#cbd5e1', marginVertical: 10 },
  tableHeader: { flexDirection: 'row', backgroundColor: '#e2e8f0', padding: 4, borderRadius: 2 },
  thText: { fontSize: 10, fontWeight: 'bold', color: '#0f172a' },
  tableRow: { flexDirection: 'row', paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  tdText: { fontSize: 10, color: '#334155' },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 2 },
  summaryLabel: { fontSize: 12, color: '#475569' },
  summaryValue: { fontSize: 12, color: '#0f172a', fontWeight: '600' },
});

export default InvoiceHistoryScreen;