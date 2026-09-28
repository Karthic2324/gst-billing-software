import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Switch,
} from 'react-native';
import axios from 'axios';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';

const API_BASE_URL = 'https://om-muruga-auto-electrical-works.onrender.com';

const numberToWords = (num) => {
  if (!num || isNaN(num) || num === 0) return 'Zero Rupees Only';
  const a = [
    '', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ',
    'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '
  ];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const inWords = (n) => {
    if ((n = n.toString()).length > 9) return 'overflow';
    let n_array = ('000000000' + n).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
    if (!n_array) return '';
    let str = '';
    str += n_array[1] != 0 ? (a[Number(n_array[1])] || b[n_array[1][0]] + ' ' + a[n_array[1][1]]) + 'Crore ' : '';
    str += n_array[2] != 0 ? (a[Number(n_array[2])] || b[n_array[2][0]] + ' ' + a[n_array[2][1]]) + 'Lakh ' : '';
    str += n_array[3] != 0 ? (a[Number(n_array[3])] || b[n_array[3][0]] + ' ' + a[n_array[3][1]]) + 'Thousand ' : '';
    str += n_array[4] != 0 ? (a[Number(n_array[4])] || b[n_array[4][0]] + ' ' + a[n_array[4][1]]) + 'Hundred ' : '';
    str += n_array[5] != 0 ? ((str != '') ? 'and ' : '') + (a[Number(n_array[5])] || b[n_array[5][0]] + ' ' + a[n_array[5][1]]) : '';
    return str;
  };

  const integerPart = Math.floor(num);
  return `${inWords(integerPart).trim()} Rupees Only`;
};

const InvoiceAppScreen = () => {
  const [invoiceSeqNumber, setInvoiceSeqNumber] = useState(1004);
  const [invoiceNo, setInvoiceNo] = useState('MB/SL/26-27/1004');
  const [invoiceDate, setInvoiceDate] = useState('24 - 09 - 2026');
  
  const [buyerName, setBuyerName] = useState('');
  const [billingAddress, setBillingAddress] = useState('');
  const [buyerGstin, setBuyerGstin] = useState('');
  const [stateName, setStateName] = useState('Tamil Nadu');

  const [sameAsBillTo, setSameAsBillTo] = useState(false);
  const [shippingAddress, setShippingAddress] = useState('');

  const [items, setItems] = useState([
    { description: '', hsn: '', qty: '1', rate: '0', taxRate: 18 }
  ]);
  const [itemHistory, setItemHistory] = useState([]);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(null);

  const [receivedAmount, setReceivedAmount] = useState('0.00');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/invoices`);
      const data = res.data || [];

      if (data.length > 0) {
        const nextSeq = 1000 + data.length + 1;
        setInvoiceSeqNumber(nextSeq);
        setInvoiceNo(`OM/AEW/26-27/${nextSeq}`);
      }

      const historyMap = {};
      data.forEach((inv) => {
        (inv.items || []).forEach((it) => {
          const desc = it.description || it.itemDescription || it.itemName || it.name;
          if (desc && desc.trim()) {
            const key = desc.trim().toLowerCase();
            historyMap[key] = {
              description: desc.trim(),
              hsn: it.hsn || '',
              rate: String(it.price || it.rate || it.unitPrice || '0'),
            };
          }
        });
      });
      setItemHistory(Object.values(historyMap));
    } catch (err) {
      console.log('Error fetching initial data:', err.message);
    }
  };

  useEffect(() => {
    if (sameAsBillTo) {
      setShippingAddress(billingAddress);
    }
  }, [sameAsBillTo, billingAddress]);

  const handleAddItem = () => {
    setItems([...items, { description: '', hsn: '', qty: '1', rate: '0', taxRate: 18 }]);
  };

  const handleItemChange = (index, field, value) => {
    const updated = [...items];
    updated[index][field] = value;
    setItems(updated);

    if (field === 'description') {
      setActiveSuggestionIndex(value.trim() ? index : null);
    }
  };

  const handleSelectSuggestion = (index, suggestedItem) => {
    const updated = [...items];
    updated[index].description = suggestedItem.description;
    if (suggestedItem.hsn) updated[index].hsn = suggestedItem.hsn;
    if (suggestedItem.rate) updated[index].rate = suggestedItem.rate;
    setItems(updated);
    setActiveSuggestionIndex(null);
  };

  const totalQty = items.reduce((sum, item) => sum + (parseFloat(item.qty) || 0), 0);

  const calculateSubtotal = () => {
    return items.reduce((sum, item) => {
      const q = parseFloat(item.qty) || 0;
      const r = parseFloat(item.rate) || 0;
      return sum + (q * r);
    }, 0);
  };

  const taxableValue = calculateSubtotal();
  const cgstAmount = (taxableValue * 0.09);
  const sgstAmount = (taxableValue * 0.09);
  const totalTaxAmount = cgstAmount + sgstAmount;
  const grandTotal = taxableValue + totalTaxAmount;

  const createPdfHtml = () => {
    const itemRowsHtml = items.map((it, idx) => {
      const q = parseFloat(it.qty) || 0;
      const r = parseFloat(it.rate) || 0;
      const rowAmt = q * r;
      const rowTax = rowAmt * 0.18;
      return `
        <tr>
          <td style="text-align:center; padding: 4px; border: 1px solid #000;">${idx + 1}</td>
          <td style="padding: 4px; border: 1px solid #000;">${it.description || 'N/A'}</td>
          <td style="text-align:center; padding: 4px; border: 1px solid #000;">${it.hsn || 'N/A'}</td>
          <td style="text-align:center; padding: 4px; border: 1px solid #000;">${q}</td>
          <td style="text-align:right; padding: 4px; border: 1px solid #000;">₹${r.toFixed(2)}</td>
          <td style="text-align:center; padding: 4px; border: 1px solid #000;">₹${rowTax.toFixed(2)}<br/><small>(18%)</small></td>
          <td style="text-align:right; padding: 4px; border: 1px solid #000; font-weight:bold;">₹${rowAmt.toFixed(2)}</td>
        </tr>
      `;
    }).join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; font-size: 12px; color: #000; }
          .sheet { border: 1px solid #000; padding: 12px; }
          .header-title { font-size: 16px; font-weight: bold; margin-bottom: 4px; }
          .subtext { font-size: 10px; color: #333; margin: 2px 0; }
          .flex-row { display: flex; justify-content: space-between; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th { background-color: #e2e8f0; border: 1px solid #000; padding: 5px; font-size: 10px; }
          .summary-box { border: 1px solid #000; padding: 8px; margin-top: 10px; background-color: #f8fafc; }
        </style>
      </head>
      <body>
        <div class="sheet">
          <div class="flex-row" style="border-bottom: 1px solid #000; padding-bottom: 6px;">
            <span style="font-weight:bold;">TAX INVOICE</span>
            <span style="font-weight:bold;">ORIGINAL FOR RECIPIENT</span>
          </div>

          <div class="flex-row" style="margin-top: 10px; border-bottom: 1px solid #000; padding-bottom: 10px;">
            <div style="width: 60%;">
              <div class="header-title">Om Muruga Auto Electrical Works 🦚</div>
              <div class="subtext">6/1 , Siddhi Vinayagar Colony, Linganoor, Siruvani Road, Veerakeralam, Coimbatore - 641 007.</div>
              <div class="subtext"><strong>GSTIN:</strong> 33DSSPS7678B1Z2</div>
              <div class="subtext"><strong>Contact:</strong> 9976765151 / 8098986464</div>
            </div>
            <div style="width: 35%; border-left: 1px solid #000; padding-left: 10px;">
              <div><strong>Invoice No:</strong> ${invoiceNo}</div>
              <div style="margin-top: 6px;"><strong>Invoice Date:</strong> ${invoiceDate}</div>
            </div>
          </div>

          <div class="flex-row" style="border-bottom: 1px solid #000; padding: 8px 0;">
            <div style="width: 48%;">
              <strong>BILL TO:</strong><br/>
              ${buyerName || 'N/A'}<br/>
              ${billingAddress || 'N/A'}<br/>
              GSTIN: ${buyerGstin || 'N/A'} | State: ${stateName}
            </div>
            <div style="width: 48%; border-left: 1px solid #000; padding-left: 10px;">
              <strong>SHIP TO:</strong><br/>
              ${sameAsBillTo ? (billingAddress || 'N/A') : (shippingAddress || 'N/A')}
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 30px;">#</th>
                <th>ITEMS</th>
                <th style="width: 50px;">HSN</th>
                <th style="width: 40px;">QTY</th>
                <th style="width: 60px;">RATE</th>
                <th style="width: 60px;">TAX</th>
                <th style="width: 70px;">AMOUNT</th>
              </tr>
            </thead>
            <tbody>
              ${itemRowsHtml}
            </tbody>
          </table>

          <div class="flex-row" style="margin-top: 10px; text-align: right; font-weight: bold;">
            <div style="width: 100%;">Taxable Value: ₹${taxableValue.toFixed(2)}</div>
          </div>

          <table style="margin-top: 10px;">
            <thead>
              <tr>
                <th>HSN/SAC</th>
                <th>Taxable Value</th>
                <th>CGST (9%)</th>
                <th>SGST (9%)</th>
                <th>Total Tax</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="text-align:center; border: 1px solid #000;">N/A</td>
                <td style="text-align:center; border: 1px solid #000;">₹${taxableValue.toFixed(2)}</td>
                <td style="text-align:center; border: 1px solid #000;">₹${cgstAmount.toFixed(2)}</td>
                <td style="text-align:center; border: 1px solid #000;">₹${sgstAmount.toFixed(2)}</td>
                <td style="text-align:center; border: 1px solid #000; font-weight: bold;">₹${totalTaxAmount.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>

          <div class="summary-box">
            <strong>Total Amount (in words):</strong><br/>
            ${numberToWords(grandTotal)}
            <div style="font-size: 14px; font-weight: bold; margin-top: 6px; text-align: right; color: #dc2626;">
              Grand Total: ₹${grandTotal.toFixed(2)}
            </div>
          </div>

          <div class="flex-row" style="margin-top: 20px; min-height: 60px;">
            <div>
              <strong>Bank Details:</strong><br/>
              Name: Om Muruga Auto Electrical Works
            </div>
            <div style="text-align: right;">
              <strong>Authorised Signatory For</strong><br/>
              <span style="font-weight: bold;">Om Muruga Auto Electrical Works 🦚</span>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  };

  const handleSaveInvoice = async () => {
    if (!buyerName.trim()) {
      Alert.alert('Validation Error', 'Please enter BUYER NAME.');
      return;
    }

    setLoading(true);
    try {
      const isoDate = new Date().toISOString().split('T')[0];

      const payload = {
        invoiceNumber: invoiceNo,
        invoiceNo: invoiceNo,
        invoiceDate: isoDate,
        customerName: buyerName.trim(),
        buyerName: buyerName.trim(),
        customerAddress: billingAddress || "N/A",
        billingAddress: billingAddress || "N/A",
        customerGstin: buyerGstin || "",
        buyerGstin: buyerGstin || "",
        customerPhone: "0000000000",
        stateName: stateName || "Tamil Nadu",
        shippingAddress: sameAsBillTo ? (billingAddress || "N/A") : (shippingAddress || "N/A"),
        totalQty: parseInt(totalQty) || 0,
        taxableValue: parseFloat(taxableValue) || 0,
        cgstAmount: parseFloat(cgstAmount) || 0,
        sgstAmount: parseFloat(sgstAmount) || 0,
        totalTaxAmount: parseFloat(totalTaxAmount) || 0,
        totalAmount: parseFloat(grandTotal) || 0,
        receivedAmount: parseFloat(receivedAmount) || 0,
        items: items.map((it) => ({
          description: it.description || "Service/Item",
          itemDescription: it.description || "Service/Item",
          itemName: it.description || "Service/Item",
          name: it.description || "Service/Item",
          hsn: it.hsn || "N/A",
          quantity: parseInt(it.qty) || 1,
          qty: parseInt(it.qty) || 1,
          price: parseFloat(it.rate) || 0,
          unitPrice: parseFloat(it.rate) || 0,
          rate: parseFloat(it.rate) || 0,
          total: (parseInt(it.qty) || 1) * (parseFloat(it.rate) || 0),
          amount: (parseInt(it.qty) || 1) * (parseFloat(it.rate) || 0),
        })),
      };

      // 1. Post to Spring Boot Backend
      await axios.post(`${API_BASE_URL}/api/invoices`, payload);

      // 2. Generate PDF file using expo-print
      const htmlContent = createPdfHtml();
      const pdfFile = await Print.printToFileAsync({ html: htmlContent });

      // 3. Move file into FileSystem.documentDirectory to fix Android read permissions
      const fileName = `Invoice_${invoiceNo.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
      const destinationUri = `${FileSystem.documentDirectory}${fileName}`;

      await FileSystem.copyAsync({
        from: pdfFile.uri,
        to: destinationUri,
      });

      // 4. Open share dialog using destinationUri
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(destinationUri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Save / Download Invoice PDF',
          UTI: 'com.adobe.pdf',
        });
      }

      Alert.alert('Success', 'Invoice saved & PDF generated successfully!');

      // Update memory pool for suggestions
      const updatedHistory = [...itemHistory];
      items.forEach((it) => {
        if (it.description && it.description.trim()) {
          const desc = it.description.trim();
          const existingIdx = updatedHistory.findIndex((h) => h.description.toLowerCase() === desc.toLowerCase());
          if (existingIdx >= 0) {
            updatedHistory[existingIdx] = { description: desc, hsn: it.hsn || '', rate: String(it.rate || '0') };
          } else {
            updatedHistory.push({ description: desc, hsn: it.hsn || '', rate: String(it.rate || '0') });
          }
        }
      });
      setItemHistory(updatedHistory);

      // Increment sequence number
      const nextSeq = invoiceSeqNumber + 1;
      setInvoiceSeqNumber(nextSeq);
      setInvoiceNo(`MB/SL/26-27/${nextSeq}`);

      // Reset form
      setBuyerName('');
      setBillingAddress('');
      setBuyerGstin('');
      setShippingAddress('');
      setItems([{ description: '', hsn: '', qty: '1', rate: '0', taxRate: 18 }]);
      setReceivedAmount('0.00');
    } catch (err) {
      console.log('Error details:', err.response?.data || err.message);
      const serverMsg = err.response?.data?.message || JSON.stringify(err.response?.data) || err.message;
      Alert.alert('Connection / Save Error', `Backend details: ${serverMsg}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.outerContainer} keyboardShouldPersistTaps="handled">
      <View style={styles.redHeaderBar}>
        <Text style={styles.redHeaderTitle}>Invoice Workstation</Text>
        <View style={styles.headerBtnGroup}>
          <TouchableOpacity style={styles.saveHeaderBtn} onPress={handleSaveInvoice} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.headerBtnText}>Save & Download PDF</Text>}
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.sheetContainer}>
        <View style={styles.bannerRow}>
          <Text style={styles.bannerTextLeft}>TAX INVOICE</Text>
          <Text style={styles.bannerTextRight}>ORIGINAL FOR RECIPIENT</Text>
        </View>

        <View style={styles.grid2Col}>
          <View style={[styles.gridCell, { flex: 1.2 }]}>
            <Text style={styles.companyTitle}>Om Muruga Auto Electrical Works 🦚</Text>
            <Text style={styles.companySubtext}>6/1 , Siddhi Vinayagar Colony, Linganoor, Siruvani Road, Veerakeralam, Coimbatore - 641 007.</Text>
            <Text style={styles.companySubtext}><Text style={styles.boldText}>GSTIN:</Text> 33DSSPS7678B1Z2</Text>
            <Text style={styles.companySubtext}><Text style={styles.boldText}>Contact:</Text> 9976765151 / 8098986464</Text>
          </View>

          <View style={[styles.gridCell, { flex: 0.8, borderLeftWidth: 1, borderColor: '#000' }]}>
            <Text style={styles.fieldLabel}>Invoice No. (Auto)</Text>
            <TextInput style={styles.readOnlyInput} value={invoiceNo} editable={false} />
            <Text style={[styles.fieldLabel, { marginTop: 6 }]}>Invoice Date</Text>
            <TextInput style={styles.readOnlyInput} value={invoiceDate} onChangeText={setInvoiceDate} />
          </View>
        </View>

        <View style={[styles.grid2Col, { borderTopWidth: 1, borderColor: '#000' }]}>
          <View style={[styles.gridCell, { flex: 1 }]}>
            <Text style={styles.sectionHeader}>BILL TO</Text>
            <TextInput style={styles.textInput} placeholder="BUYER NAME" placeholderTextColor="#888" value={buyerName} onChangeText={setBuyerName} />
            <TextInput style={[styles.textInput, { height: 50 }]} placeholder="Billing Address..." placeholderTextColor="#888" multiline value={billingAddress} onChangeText={setBillingAddress} />
            <View style={{ flexDirection: 'row', gap: 4 }}>
              <TextInput style={[styles.textInput, { flex: 1 }]} placeholder="Buyer GSTIN" placeholderTextColor="#888" value={buyerGstin} onChangeText={setBuyerGstin} />
              <TextInput style={[styles.textInput, { flex: 1 }]} value={stateName} onChangeText={setStateName} />
            </View>
          </View>

          <View style={[styles.gridCell, { flex: 1, borderLeftWidth: 1, borderColor: '#000' }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={styles.sectionHeader}>SHIP TO</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ fontSize: 10, marginRight: 2 }}>Same as Bill To</Text>
                <Switch value={sameAsBillTo} onValueChange={setSameAsBillTo} style={{ transform: [{ scaleX: 0.7 }, { scaleY: 0.7 }] }} />
              </View>
            </View>
            <TextInput style={[styles.textInput, { height: 80 }]} placeholder="Shipping Address..." placeholderTextColor="#888" multiline value={shippingAddress} onChangeText={setShippingAddress} editable={!sameAsBillTo} />
          </View>
        </View>

        <View style={styles.tableHeaderRow}>
          <Text style={[styles.th, { width: 25 }]}>#</Text>
          <Text style={[styles.th, { flex: 2 }]}>ITEMS</Text>
          <Text style={[styles.th, { width: 40 }]}>HSN</Text>
          <Text style={[styles.th, { width: 35 }]}>QTY.</Text>
          <Text style={[styles.th, { width: 45 }]}>RATE</Text>
          <Text style={[styles.th, { width: 50 }]}>TAX</Text>
          <Text style={[styles.th, { width: 55 }]}>AMOUNT</Text>
        </View>

        {items.map((item, idx) => {
          const q = parseFloat(item.qty) || 0;
          const r = parseFloat(item.rate) || 0;
          const rowAmt = q * r;
          const rowTax = rowAmt * 0.18;

          const query = (item.description || '').toLowerCase().trim();
          const matchingSuggestions = query
            ? itemHistory.filter((h) => h.description.toLowerCase().includes(query))
            : [];

          return (
            <View key={idx} style={{ zIndex: 100 - idx }}>
              <View style={styles.tableBodyRow}>
                <Text style={[styles.tdText, { width: 25, textAlign: 'center' }]}>{idx + 1}</Text>
                <TextInput
                  style={[styles.tableInput, { flex: 2 }]}
                  placeholder="Item Description"
                  placeholderTextColor="#888"
                  value={item.description}
                  onChangeText={(v) => handleItemChange(idx, 'description', v)}
                  onFocus={() => setActiveSuggestionIndex(idx)}
                />
                <TextInput style={[styles.tableInput, { width: 40 }]} placeholder="HSN" placeholderTextColor="#888" value={item.hsn} onChangeText={(v) => handleItemChange(idx, 'hsn', v)} />
                <TextInput style={[styles.tableInput, { width: 35, textAlign: 'center' }]} keyboardType="numeric" value={item.qty} onChangeText={(v) => handleItemChange(idx, 'qty', v)} />
                <TextInput style={[styles.tableInput, { width: 45, textAlign: 'right' }]} keyboardType="numeric" value={item.rate} onChangeText={(v) => handleItemChange(idx, 'rate', v)} />
                <View style={{ width: 50, alignItems: 'center' }}>
                  <Text style={{ fontSize: 10 }}>{(rowTax).toFixed(2)}</Text>
                  <Text style={{ fontSize: 8, color: '#666' }}>(18%)</Text>
                </View>
                <Text style={[styles.tdText, { width: 55, textAlign: 'right', fontWeight: 'bold' }]}>₹{rowAmt.toFixed(2)}</Text>
              </View>

              {activeSuggestionIndex === idx && matchingSuggestions.length > 0 && (
                <View style={styles.suggestionContainer}>
                  {matchingSuggestions.map((sug, sIdx) => (
                    <TouchableOpacity
                      key={sIdx}
                      style={styles.suggestionItem}
                      onPress={() => handleSelectSuggestion(idx, sug)}
                    >
                      <Text style={styles.suggestionText}>
                        💡 {sug.description} — <Text style={styles.boldText}>₹{sug.rate}</Text>
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          );
        })}

        <View style={styles.tableTotalRow}>
          <Text style={{ flex: 1, textAlign: 'right', fontWeight: 'bold', fontSize: 11, paddingRight: 8 }}>TOTAL</Text>
          <Text style={{ width: 35, textAlign: 'center', fontWeight: 'bold', fontSize: 11 }}>{totalQty}</Text>
          <Text style={{ width: 150, textAlign: 'right', fontWeight: 'bold', fontSize: 11 }}>₹{taxableValue.toFixed(2)}</Text>
        </View>

        <View style={styles.receivedRow}>
          <Text style={{ fontWeight: 'bold', fontSize: 11 }}>RECEIVED AMOUNT</Text>
          <TextInput style={styles.receivedInput} keyboardType="numeric" value={receivedAmount} onChangeText={setReceivedAmount} />
        </View>

        <TouchableOpacity style={styles.addRowBtn} onPress={handleAddItem}>
          <Text style={styles.addRowBtnText}>+ Add Item Row</Text>
        </TouchableOpacity>

        <View style={[styles.taxTable, { marginTop: 10 }]}>
          <View style={styles.taxHeaderRow}>
            <Text style={[styles.th, { flex: 1 }]}>HSN/SAC</Text>
            <Text style={[styles.th, { flex: 1 }]}>Taxable Value</Text>
            <Text style={[styles.th, { flex: 1 }]}>CGST (9%)</Text>
            <Text style={[styles.th, { flex: 1 }]}>SGST (9%)</Text>
            <Text style={[styles.th, { flex: 1 }]}>Total Tax</Text>
          </View>
          <View style={styles.taxBodyRow}>
            <Text style={[styles.tdText, { flex: 1, textAlign: 'center' }]}>N/A</Text>
            <Text style={[styles.tdText, { flex: 1, textAlign: 'center' }]}>{taxableValue.toFixed(2)}</Text>
            <Text style={[styles.tdText, { flex: 1, textAlign: 'center' }]}>{cgstAmount.toFixed(2)}</Text>
            <Text style={[styles.tdText, { flex: 1, textAlign: 'center' }]}>{sgstAmount.toFixed(2)}</Text>
            <Text style={[styles.tdText, { flex: 1, textAlign: 'center', fontWeight: 'bold' }]}>₹{totalTaxAmount.toFixed(2)}</Text>
          </View>
        </View>

        <View style={styles.wordsBox}>
          <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#333' }}>Total Amount (in words)</Text>
          <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#000', marginTop: 2 }}>{numberToWords(grandTotal)}</Text>
        </View>

        <View style={[styles.grid2Col, { borderTopWidth: 1, borderColor: '#000', marginTop: 8, minHeight: 80 }]}>
          <View style={[styles.gridCell, { flex: 1 }]}>
            <Text style={{ fontSize: 11, fontWeight: 'bold' }}>Bank Details</Text>
            <Text style={{ fontSize: 10 }}>Name: Om Muruga Auto Electrical Works</Text>
            <Text style={{ fontSize: 10 }}>IFSC Code: [Bank IFSC]</Text>
            <Text style={{ fontSize: 10 }}>Account No: [Account Number]</Text>
          </View>

          <View style={[styles.gridCell, { flex: 1, justifyContent: 'flex-end', alignItems: 'flex-end' }]}>
            <Text style={{ fontSize: 10, fontWeight: 'bold' }}>Authorised Signatory For</Text>
            <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#0f172a', marginTop: 2 }}>Om Muruga Auto Electrical Works 🦚</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  outerContainer: { flex: 1, backgroundColor: '#9ea8af' },
  redHeaderBar: { backgroundColor: '#dc2626', padding: 12, borderRadius: 10, margin: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  redHeaderTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  headerBtnGroup: { flexDirection: 'row', gap: 6 },
  saveHeaderBtn: { backgroundColor: '#10b981', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  headerBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
  sheetContainer: { backgroundColor: '#fff', margin: 10, borderRadius: 4, borderWidth: 1, borderColor: '#000', padding: 10 },
  bannerRow: { flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 1, borderColor: '#000', paddingBottom: 4, marginBottom: 6 },
  bannerTextLeft: { fontSize: 12, fontWeight: 'bold' },
  bannerTextRight: { fontSize: 12, fontWeight: 'bold' },
  grid2Col: { flexDirection: 'row' },
  gridCell: { padding: 6 },
  companyTitle: { fontSize: 13, fontWeight: 'bold', color: '#000' },
  companySubtext: { fontSize: 9, color: '#333' },
  boldText: { fontWeight: 'bold' },
  fieldLabel: { fontSize: 10, fontWeight: 'bold' },
  readOnlyInput: { backgroundColor: '#f1f5f9', borderWidth: 1, borderColor: '#cbd5e1', padding: 4, borderRadius: 4, fontSize: 11, fontWeight: 'bold', color: '#dc2626' },
  sectionHeader: { fontSize: 11, fontWeight: 'bold', marginBottom: 4 },
  textInput: { borderWidth: 1, borderColor: '#cbd5e1', padding: 4, borderRadius: 4, fontSize: 10, marginBottom: 4, backgroundColor: '#fff' },
  tableHeaderRow: { flexDirection: 'row', backgroundColor: '#e2e8f0', borderWidth: 1, borderColor: '#000', paddingVertical: 4 },
  th: { fontSize: 9, fontWeight: 'bold', textAlign: 'center' },
  tableBodyRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#cbd5e1', borderTopWidth: 0, paddingVertical: 2 },
  tdText: { fontSize: 10 },
  tableInput: { borderWidth: 1, borderColor: '#cbd5e1', padding: 2, borderRadius: 2, fontSize: 10, backgroundColor: '#fff' },
  suggestionContainer: { backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#2563eb', borderRadius: 4, marginTop: 2, marginHorizontal: 2, elevation: 3, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 3 },
  suggestionItem: { padding: 8, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  suggestionText: { fontSize: 11, color: '#0f172a' },
  tableTotalRow: { flexDirection: 'row', borderBottomWidth: 1, borderColor: '#000', paddingVertical: 4, backgroundColor: '#f8fafc' },
  receivedRow: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', paddingVertical: 4, gap: 8 },
  receivedInput: { borderWidth: 1, borderColor: '#cbd5e1', width: 80, padding: 2, textAlign: 'right', fontSize: 10 },
  addRowBtn: { backgroundColor: '#2563eb', padding: 6, borderRadius: 4, alignSelf: 'flex-start', marginVertical: 6 },
  addRowBtnText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  taxTable: { borderWidth: 1, borderColor: '#000' },
  taxHeaderRow: { flexDirection: 'row', backgroundColor: '#e2e8f0', borderBottomWidth: 1, borderColor: '#000', paddingVertical: 4 },
  taxBodyRow: { flexDirection: 'row', paddingVertical: 4 },
  wordsBox: { borderWidth: 1, borderColor: '#000', marginTop: 8, padding: 6, backgroundColor: '#f8fafc' },
});

export default InvoiceAppScreen;