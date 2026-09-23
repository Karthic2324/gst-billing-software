import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { getToken } from './auth';
import './InvoiceApp.css';

// Helper function to convert numeric numbers to words
const numberToWords = (num) => {
  if (!num || isNaN(num)) return 'Zero Rupees Only';
  const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  
  const inWords = (n) => {
    if ((n = n.toString()).length > 9) return 'overflow';
    let n_array = ('000000000' + n).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
    if (!n_array) return '';
    let str = '';
    str += (n_array[1] != 0) ? (a[Number(n_array[1])] || b[n_array[1][0]] + ' ' + a[n_array[1][1]]) + 'Crore ' : '';
    str += (n_array[2] != 0) ? (a[Number(n_array[2])] || b[n_array[2][0]] + ' ' + a[n_array[2][1]]) + 'Lakh ' : '';
    str += (n_array[3] != 0) ? (a[Number(n_array[3])] || b[n_array[3][0]] + ' ' + a[n_array[3][1]]) + 'Thousand ' : '';
    str += (n_array[4] != 0) ? (a[Number(n_array[4])] || b[n_array[4][0]] + ' ' + a[n_array[4][1]]) + 'Hundred ' : '';
    str += (n_array[5] != 0) ? ((str != '') ? 'and ' : '') + (a[Number(n_array[5])] || b[n_array[5][0]] + ' ' + a[n_array[5][1]]) : '';
    return str;
  };

  const whole = Math.floor(num);
  const words = inWords(whole);
  return `${words.trim()} Rupees Only`;
};

const InvoiceApp = ({ BASE_URL }) => {
  const [sameAsBilling, setSameAsBilling] = useState(false);
  const [activeSuggestionRow, setActiveSuggestionRow] = useState(null);
  const [suggestions, setSuggestions] = useState([]);

  const getAuthHeaders = () => {
    const token = getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const initialInvoiceState = {
    invoiceNo: 'MB/SL/26-27/1001',
    invoiceDate: new Date().toISOString().split('T')[0],
    sellerName: 'Om Muruga Auto Electrical Works 🦚',
    sellerAddress: '6/1 , Siddhi Vinayagar Colony, Linganoor, Siruvani Road, Veerakeralam, Coimbatore - 641 007.',
    sellerGstin: '33DSSPS7678B1Z2',
    sellerContact: '9976765151 / 8098986464',
    buyerName: '',
    buyerAddress: '',
    buyerGstin: '',
    buyerPan: '',
    placeOfSupply: 'Tamil Nadu',
    shippingAddress: '',
    Name:'',
    bankName: '',
    bankIfsc: '',
    bankAccountNo: '',
    receivedAmount: 0,
    items: [
      { sNo: 1, itemDescription: '', hsnSac: '', qty: 1, unit: 'NOS', rate: 0 }
    ]
  };

  const [invoice, setInvoice] = useState(initialInvoiceState);

  const fetchNextInvoiceNumber = useCallback(async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/invoices/next-number`, { headers: getAuthHeaders() });
      if (res.data && res.data.nextInvoiceNo) {
        setInvoice((prev) => ({ ...prev, invoiceNo: res.data.nextInvoiceNo }));
      }
    } catch (error) {
      console.error('Error fetching invoice number:', error);
    }
  }, [BASE_URL]);

  useEffect(() => {
    fetchNextInvoiceNumber();
  }, [fetchNextInvoiceNumber]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const updated = { ...invoice, [name]: value };

    if (sameAsBilling && (name === 'buyerAddress' || name === 'buyerName')) {
      const bName = name === 'buyerName' ? value : invoice.buyerName;
      const bAddr = name === 'buyerAddress' ? value : invoice.buyerAddress;
      updated.shippingAddress = `${bName}\n${bAddr}`.trim();
    }

    setInvoice(updated);
  };

  const handleCheckboxChange = (e) => {
    const isChecked = e.target.checked;
    setSameAsBilling(isChecked);
    if (isChecked) {
      setInvoice({
        ...invoice,
        shippingAddress: `${invoice.buyerName}\n${invoice.buyerAddress}`.trim()
      });
    }
  };

  const handleItemChange = async (index, e) => {
    const { name, value } = e.target;
    const updatedItems = [...invoice.items];
    updatedItems[index][name] = value;
    setInvoice({ ...invoice, items: updatedItems });

    if (name === 'itemDescription') {
      setActiveSuggestionRow(index);
      if (value.trim().length > 0) {
        try {
          const res = await axios.get(`${BASE_URL}/api/products/search?query=${encodeURIComponent(value)}`, { headers: getAuthHeaders() });
          setSuggestions(res.data);
        } catch (err) {
          console.error('Error fetching suggestions:', err);
        }
      } else {
        setSuggestions([]);
      }
    }
  };

  const selectSuggestion = (index, product) => {
    const updatedItems = [...invoice.items];
    updatedItems[index].itemDescription = product.itemDescription;
    updatedItems[index].hsnSac = product.hsnSac || '';
    updatedItems[index].rate = product.rate || 0;
    setInvoice({ ...invoice, items: updatedItems });
    setActiveSuggestionRow(null);
    setSuggestions([]);
  };

  const addItemRow = () => {
    setInvoice({
      ...invoice,
      items: [
        ...invoice.items,
        { sNo: invoice.items.length + 1, itemDescription: '', hsnSac: '', qty: 1, unit: 'NOS', rate: 0 }
      ]
    });
  };

  const removeItemRow = (index) => {
    const updatedItems = invoice.items.filter((_, i) => i !== index);
    const reindexed = updatedItems.map((item, idx) => ({ ...item, sNo: idx + 1 }));
    setInvoice({ ...invoice, items: reindexed });
  };

  const calculateRowValues = (item) => {
    const qty = Number(item.qty) || 0;
    const rate = Number(item.rate) || 0;
    const taxableValue = qty * rate;
    const taxAmount = taxableValue * 0.18;
    const totalAmount = taxableValue + taxAmount;
    return { taxableValue, taxAmount, totalAmount };
  };

  const totals = invoice.items.reduce((acc, item) => {
    const vals = calculateRowValues(item);
    acc.totalQty += Number(item.qty) || 0;
    acc.totalTax += vals.taxAmount;
    acc.grandTotal += vals.totalAmount;
    return acc;
  }, { totalQty: 0, totalTax: 0, grandTotal: 0 });

  const handleSaveAndNext = async () => {
    if (!invoice.buyerName.trim()) {
      alert('Please enter Buyer Name before saving.');
      return;
    }

    const payload = {
      ...invoice,
      totalQty: totals.totalQty,
      totalTax: totals.totalTax,
      totalAmount: totals.grandTotal,
      items: invoice.items.map((item) => {
        const vals = calculateRowValues(item);
        return {
          ...item,
          taxAmount: Number(vals.taxAmount.toFixed(2)),
          amount: Number(vals.totalAmount.toFixed(2))
        };
      })
    };

    try {
      await axios.post(`${BASE_URL}/api/invoices`, payload, { headers: getAuthHeaders() });
      alert(`Invoice ${invoice.invoiceNo} saved successfully!`);

      const res = await axios.get(`${BASE_URL}/api/invoices/next-number`, { headers: getAuthHeaders() });
      const nextNo = res.data?.nextInvoiceNo || 'MB/SL/26-27/1001';

      setInvoice({
        ...initialInvoiceState,
        invoiceNo: nextNo,
        buyerName: '',
        buyerAddress: '',
        buyerGstin: '',
        buyerPan: '',
        shippingAddress: '',
        items: [{ sNo: 1, itemDescription: '', hsnSac: '', qty: 1, unit: 'NOS', rate: 0 }]
      });
      setSameAsBilling(false);
    } catch (err) {
      alert('Failed to save invoice. Ensure Spring Boot backend is running.');
    }
  };

  return (
    <div className="billing-container">
      {/* Control Panel Header */}
      <div className="no-print control-panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, color: '#f8fafc' }}>Invoice Workstation</h3>
          <div className="control-buttons">
            <button className="btn-add-item" style={{ backgroundColor: '#10b981' }} onClick={handleSaveAndNext}>
              Save & Next Invoice
            </button>
            <button className="btn-add-item" onClick={() => window.print()}>
              Print / Save PDF
            </button>
          </div>
        </div>
      </div>

      {/* Main Invoice Printable Sheet (Structured Layout) */}
      <div className="invoice-box" id="printable-invoice">
        <div className="invoice-header">
          <span>TAX INVOICE</span>
          <span>ORIGINAL FOR RECIPIENT</span>
        </div>

        {/* Seller Info & Invoice Metadata */}
        <div className="grid-2">
          <div className="box">
            <h2 style={{ margin: '0 0 4px 0', fontSize: '15px' }}>{invoice.sellerName}</h2>
            <p style={{ margin: '0 0 4px 0' }}>{invoice.sellerAddress}</p>
            <p style={{ margin: '0 0 2px 0' }}><strong>GSTIN:</strong> {invoice.sellerGstin}</p>
            <p style={{ margin: 0 }}><strong>Contact:</strong> {invoice.sellerContact}</p>
          </div>
          <div className="box" style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
            <div>
              <strong>Invoice No.</strong><br />
              <input
                type="text"
                name="invoiceNo"
                value={invoice.invoiceNo}
                onChange={handleChange}
                className="form-control-input"
                style={{ width: '130px', fontWeight: 'bold' }}
              />
            </div>
            <div>
              <strong>Invoice Date</strong><br />
              <input
                type="date"
                name="invoiceDate"
                value={invoice.invoiceDate}
                onChange={handleChange}
                className="form-control-input"
                style={{ width: '130px' }}
              />
            </div>
          </div>
        </div>

        {/* Bill To & Ship To Details */}
        <div className="grid-2">
          <div className="box">
            <strong>BILL TO</strong><br />
            <input
              type="text"
              name="buyerName"
              placeholder="BUYER NAME"
              value={invoice.buyerName}
              onChange={handleChange}
              className="form-control-input"
              style={{ width: '100%', fontWeight: 'bold', margin: '2px 0' }}
            />
            <textarea
              name="buyerAddress"
              placeholder="Billing Address..."
              value={invoice.buyerAddress}
              onChange={handleChange}
              className="editable-textarea"
              rows="2"
            />
            <div style={{ display: 'flex', gap: '5px', marginTop: '4px' }}>
              <input
                type="text"
                name="buyerGstin"
                placeholder="Buyer GSTIN"
                value={invoice.buyerGstin}
                onChange={handleChange}
                className="form-control-input"
                style={{ flex: 1 }}
              />
              <input
                type="text"
                name="placeOfSupply"
                placeholder="Place of Supply"
                value={invoice.placeOfSupply}
                onChange={handleChange}
                className="form-control-input"
                style={{ flex: 1 }}
              />
            </div>
            <div style={{ marginTop: '2px' }}>
              <strong>PAN Number:</strong>{' '}
              <input
                type="text"
                name="buyerPan"
                placeholder="PAN"
                value={invoice.buyerPan}
                onChange={handleChange}
                className="form-control-input"
                style={{ width: '120px' }}
              />
            </div>
          </div>

          <div className="box">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong>SHIP TO</strong>
              <label style={{ fontSize: '10px', cursor: 'pointer' }} className="no-print">
                <input
                  type="checkbox"
                  checked={sameAsBilling}
                  onChange={handleCheckboxChange}
                  style={{ marginRight: '3px' }}
                />
                Same as Bill To
              </label>
            </div>
            <textarea
              name="shippingAddress"
              placeholder="Shipping Address..."
              value={invoice.shippingAddress}
              onChange={handleChange}
              disabled={sameAsBilling}
              className="editable-textarea"
              rows="4"
              style={{ marginTop: '4px' }}
            />
          </div>
        </div>

        {/* Items Table */}
        <table className="main-table">
          <thead>
            <tr>
              <th style={{ width: '6%' }}>S.NO.</th>
              <th style={{ width: '38%' }}>ITEMS</th>
              <th style={{ width: '12%' }}>HSN</th>
              <th style={{ width: '10%' }}>QTY.</th>
              <th style={{ width: '12%' }}>RATE</th>
              <th style={{ width: '10%' }}>TAX</th>
              <th style={{ width: '12%' }}>AMOUNT</th>
              <th style={{ width: '4%' }} className="no-print">ACTION</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((item, idx) => {
              const vals = calculateRowValues(item);
              return (
                <tr key={idx}>
                  <td className="text-center">{item.sNo}</td>
                  <td className="suggestion-cell text-left">
                    <input
                      type="text"
                      name="itemDescription"
                      placeholder="Item Description"
                      value={item.itemDescription}
                      onChange={(e) => handleItemChange(idx, e)}
                      onFocus={() => setActiveSuggestionRow(idx)}
                      onBlur={() => setTimeout(() => setActiveSuggestionRow(null), 200)}
                      className="form-control-input"
                      style={{ width: '100%', fontWeight: 'bold' }}
                      autoComplete="off"
                    />
                    {activeSuggestionRow === idx && suggestions.length > 0 && (
                      <ul className="suggestions-dropdown no-print">
                        {suggestions.map((p, sIdx) => (
                          <li key={sIdx} onMouseDown={() => selectSuggestion(idx, p)}>
                            <strong>{p.itemDescription}</strong>
                            <div style={{ fontSize: '10px', color: '#64748b' }}>HSN: {p.hsnSac} | Rate: ₹{p.rate}</div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </td>
                  <td>
                    <input
                      type="text"
                      name="hsnSac"
                      value={item.hsnSac}
                      onChange={(e) => handleItemChange(idx, e)}
                      className="form-control-input text-center"
                      style={{ width: '100%' }}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      name="qty"
                      value={item.qty}
                      onChange={(e) => handleItemChange(idx, e)}
                      className="form-control-input text-center"
                      style={{ width: '100%' }}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      name="rate"
                      value={item.rate}
                      onChange={(e) => handleItemChange(idx, e)}
                      className="form-control-input text-right"
                      style={{ width: '100%' }}
                    />
                  </td>
                  <td className="text-right">
                    {vals.taxAmount.toFixed(2)}<br />
                    <span style={{ fontSize: '9px', color: '#666' }}>(18%)</span>
                  </td>
                  <td className="text-right"><strong>₹ {vals.totalAmount.toFixed(2)}</strong></td>
                  <td className="no-print text-center">
                    {invoice.items.length > 1 && (
                      <button className="btn-delete-row" onClick={() => removeItemRow(idx)}>✕</button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan="3" className="text-right"><strong>TOTAL</strong></td>
              <td className="text-center"><strong>{totals.totalQty}</strong></td>
              <td></td>
              <td className="text-right"><strong>₹ {totals.totalTax.toFixed(2)}</strong></td>
              <td className="text-right"><strong>₹ {totals.grandTotal.toFixed(2)}</strong></td>
              <td className="no-print"></td>
            </tr>
            <tr>
              <td colSpan="6" className="text-right"><strong>RECEIVED AMOUNT</strong></td>
              <td className="text-right"><strong>₹ {Number(invoice.receivedAmount || 0).toFixed(2)}</strong></td>
              <td className="no-print"></td>
            </tr>
          </tfoot>
        </table>

        {/* Add Row Button */}
        <div style={{ margin: '8px 0' }} className="no-print">
          <button className="btn-add-item" onClick={addItemRow}>+ Add Item Row</button>
        </div>

        {/* Tax Breakdown Table */}
        <table className="tax-table">
          <thead>
            <tr>
              <th rowSpan="2">HSN/SAC</th>
              <th rowSpan="2">Taxable Value</th>
              <th colSpan="2">CGST</th>
              <th colSpan="2">SGST</th>
              <th rowSpan="2">Total Tax Amount</th>
            </tr>
            <tr>
              <th>Rate</th><th>Amount</th>
              <th>Rate</th><th>Amount</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((item, idx) => {
              const vals = calculateRowValues(item);
              return (
                <tr key={idx}>
                  <td>{item.hsnSac || 'N/A'}</td>
                  <td>{vals.taxableValue.toFixed(2)}</td>
                  <td>9%</td>
                  <td>{(vals.taxAmount / 2).toFixed(2)}</td>
                  <td>9%</td>
                  <td>{(vals.taxAmount / 2).toFixed(2)}</td>
                  <td>₹ {vals.taxAmount.toFixed(2)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Amount In Words Section */}
        <div style={{ border: '1px solid #000', padding: '6px', margin: '8px 0' }}>
          <strong>Total Amount (in words)</strong><br />
          <span>{numberToWords(totals.grandTotal)}</span>
        </div>

        {/* Bank & Signature Section */}
        <div className="grid-2 footer-section">
          <div className="box">
            <strong>Bank Details</strong><br />
            <strong>Name:</strong> {invoice.Name}<br />
            <strong>IFSC Code:</strong> {invoice.bankIfsc}<br />
            <strong>Account No:</strong> {invoice.bankAccountNo}<br />
            <strong>Bank:</strong> {invoice.bankName}
          </div>
          <div className="box sign-box">
            <div></div>
            <div>
              <p style={{ margin: '0 0 4px 0' }}>Authorised Signatory For</p>
              <strong>{invoice.sellerName}</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceApp;