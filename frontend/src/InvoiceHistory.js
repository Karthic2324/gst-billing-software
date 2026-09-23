import React, { useState } from 'react';
import axios from 'axios';
import { getToken } from './auth';

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

const InvoiceHistory = ({ BASE_URL, onBack }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchTerm.trim()) {
      alert('Please enter an Invoice No, Buyer Name, or Date to search.');
      return;
    }

    setLoading(true);
    setHasSearched(true);

    try {
      const token = getToken();
      const res = await axios.get(`${BASE_URL}/api/invoices`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });

      const query = searchTerm.trim().toLowerCase();
      const matches = res.data.filter((inv) =>
        inv.invoiceNo?.toLowerCase().includes(query) ||
        inv.buyerName?.toLowerCase().includes(query) ||
        inv.invoiceDate?.includes(query)
      );

      setSearchResults(matches);
    } catch (err) {
      alert('Failed to search database. Check backend connection.');
    } finally {
      setLoading(false);
    }
  };

  const calculateRowValues = (item) => {
    const qty = Number(item.qty) || 0;
    const rate = Number(item.rate) || 0;
    const taxableValue = qty * rate;
    const taxAmount = item.taxAmount ?? (taxableValue * 0.18);
    const totalAmount = item.amount ?? (taxableValue + taxAmount);
    return { taxableValue, taxAmount, totalAmount };
  };

  return (
    <div className="billing-container">
      {/* Search Toolbar */}
      <div className="no-print control-panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button
            onClick={selectedInvoice ? () => setSelectedInvoice(null) : onBack}
            className="btn-add-item"
            style={{ backgroundColor: '#475569' }}
          >
            {selectedInvoice ? '← Back to Search Results' : '← Back to Workstation'}
          </button>

          {!selectedInvoice ? (
            <form onSubmit={handleSearch} style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                placeholder="Type Invoice No, Buyer, or Date..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="form-control-input"
                style={{ width: '280px', backgroundColor: '#0f172a', color: '#fff', borderColor: '#334155' }}
              />
              <button type="submit" className="btn-add-item">
                Search
              </button>
            </form>
          ) : (
            <h3 style={{ margin: 0, color: '#f8fafc' }}>Viewing Invoice: {selectedInvoice.invoiceNo}</h3>
          )}

          {selectedInvoice && (
            <button className="btn-add-item" style={{ backgroundColor: '#10b981' }} onClick={() => window.print()}>
              Print / Save PDF
            </button>
          )}
        </div>
      </div>

      {!selectedInvoice ? (
        <div className="control-panel" style={{ padding: 0, overflow: 'hidden' }}>
          {!hasSearched ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: '#94a3b8' }}>
              <h4>Search Invoice History</h4>
              <p style={{ fontSize: '13px' }}>Type a Customer Name, Invoice Number, or Date in the search bar above to view bills.</p>
            </div>
          ) : loading ? (
            <p style={{ padding: '20px', textAlign: 'center', color: '#94a3b8' }}>Searching database...</p>
          ) : searchResults.length === 0 ? (
            <p style={{ padding: '20px', textAlign: 'center', color: '#ef4444' }}>No invoices found matching "{searchTerm}".</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', backgroundColor: '#1e293b' }}>
              <thead>
                <tr style={{ background: '#0f172a', color: '#f8fafc', borderBottom: '1px solid #334155' }}>
                  <th style={{ padding: '12px 16px' }}>Invoice No</th>
                  <th style={{ padding: '12px 16px' }}>Date</th>
                  <th style={{ padding: '12px 16px' }}>Buyer Name</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>Grand Total</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {searchResults.map((inv, idx) => (
                  <tr key={inv.id || idx} style={{ borderBottom: '1px solid #334155', backgroundColor: idx % 2 === 0 ? '#1e293b' : '#0f172a' }}>
                    <td style={{ padding: '12px 16px', color: '#38bdf8', fontWeight: 'bold' }}>{inv.invoiceNo}</td>
                    <td style={{ padding: '12px 16px', color: '#94a3b8' }}>{inv.invoiceDate}</td>
                    <td style={{ padding: '12px 16px', color: '#f8fafc', fontWeight: '600' }}>{inv.buyerName || 'Cash Sale'}</td>
                    <td style={{ padding: '12px 16px', color: '#10b981', fontWeight: 'bold', textAlign: 'right' }}>
                      ₹{inv.totalAmount ? inv.totalAmount.toFixed(2) : '0.00'}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      <button className="btn-add-item" style={{ padding: '4px 12px', fontSize: '11px' }} onClick={() => setSelectedInvoice(inv)}>
                        View Invoice
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      ) : (
        /* Printable Sheet matching structured format */
        <div className="invoice-box" id="printable-invoice">
          <div className="invoice-header">
            <span>TAX INVOICE</span>
            <span>ORIGINAL FOR RECIPIENT</span>
          </div>

          <div className="grid-2">
            <div className="box">
              <h2 style={{ margin: '0 0 4px 0', fontSize: '15px' }}>{selectedInvoice.sellerName || 'Om Muruga Auto Electrical Works 🦚'}</h2>
              <p style={{ margin: '0 0 4px 0' }}>{selectedInvoice.sellerAddress || '6/1 , Siddhi Vinayagar Colony, Linganoor, Siruvani Road, Veerakeralam, Coimbatore - 641 007.'}</p>
              <p style={{ margin: '0 0 2px 0' }}><strong>GSTIN:</strong> {selectedInvoice.sellerGstin || '33DSSPS7678B1Z2'}</p>
              <p style={{ margin: 0 }}><strong>Contact:</strong> {selectedInvoice.sellerContact || '9976765151 / 8098986464'}</p>
            </div>
            <div className="box" style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
              <div>
                <strong>Invoice No.</strong><br />
                <strong>{selectedInvoice.invoiceNo}</strong>
              </div>
              <div>
                <strong>Invoice Date</strong><br />
                <span>{selectedInvoice.invoiceDate}</span>
              </div>
            </div>
          </div>

          <div className="grid-2">
            <div className="box">
              <strong>BILL TO</strong><br />
              <strong>{selectedInvoice.buyerName || 'Cash Sale'}</strong>
              <p style={{ margin: '2px 0' }}>{selectedInvoice.buyerAddress || 'N/A'}</p>
              <p style={{ margin: '2px 0' }}><strong>GSTIN:</strong> {selectedInvoice.buyerGstin || 'URP'} | <strong>Place of Supply:</strong> {selectedInvoice.placeOfSupply || 'Tamil Nadu'}</p>
              <p style={{ margin: 0 }}><strong>PAN Number:</strong> {selectedInvoice.buyerPan || 'N/A'}</p>
            </div>
            <div className="box">
              <strong>SHIP TO</strong><br />
              <strong>{selectedInvoice.buyerName || 'Cash Sale'}</strong>
              <p style={{ margin: '2px 0', whitespace: 'pre-line' }}>{selectedInvoice.shippingAddress || selectedInvoice.buyerAddress || 'N/A'}</p>
            </div>
          </div>

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
              </tr>
            </thead>
            <tbody>
              {selectedInvoice.items?.map((item, idx) => {
                const vals = calculateRowValues(item);
                return (
                  <tr key={idx}>
                    <td className="text-center">{item.sNo || idx + 1}</td>
                    <td className="text-left"><strong>{item.itemDescription}</strong></td>
                    <td className="text-center">{item.hsnSac || 'N/A'}</td>
                    <td className="text-center">{item.qty} {item.unit || 'NOS'}</td>
                    <td className="text-right">{Number(item.rate).toFixed(2)}</td>
                    <td className="text-right">
                      {vals.taxAmount.toFixed(2)}<br />
                      <span style={{ fontSize: '9px', color: '#666' }}>(18%)</span>
                    </td>
                    <td className="text-right"><strong>₹ {vals.totalAmount.toFixed(2)}</strong></td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan="3" className="text-right"><strong>TOTAL</strong></td>
                <td className="text-center"><strong>{selectedInvoice.totalQty}</strong></td>
                <td></td>
                <td className="text-right"><strong>₹ {selectedInvoice.totalTax?.toFixed(2)}</strong></td>
                <td className="text-right"><strong>₹ {selectedInvoice.totalAmount?.toFixed(2)}</strong></td>
              </tr>
              <tr>
                <td colSpan="6" className="text-right"><strong>RECEIVED AMOUNT</strong></td>
                <td className="text-right"><strong>₹ {Number(selectedInvoice.receivedAmount || 0).toFixed(2)}</strong></td>
              </tr>
            </tfoot>
          </table>

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
              {selectedInvoice.items?.map((item, idx) => {
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

          <div style={{ border: '1px solid #000', padding: '6px', margin: '8px 0' }}>
            <strong>Total Amount (in words)</strong><br />
            <span>{numberToWords(selectedInvoice.totalAmount)}</span>
          </div>

          <div className="grid-2 footer-section">
            <div className="box">
              <strong>Bank Details</strong><br />
              <strong>Name:</strong> {selectedInvoice.sellerName || 'Om Muruga Auto Electrical Works'}<br />
              <strong>IFSC Code:</strong> {selectedInvoice.bankIfsc || 'ICIC0004179'}<br />
              <strong>Account No:</strong> {selectedInvoice.bankAccountNo || '417905500050'}<br />
              <strong>Bank:</strong> {selectedInvoice.bankName || 'ICICI Bank, COIMBATORE GANAPATHY'}
            </div>
            <div className="box sign-box">
              <div></div>
              <div>
                <p style={{ margin: '0 0 4px 0' }}>Authorised Signatory For</p>
                <strong>{selectedInvoice.sellerName || 'Om Muruga Auto Electrical Works'}</strong>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoiceHistory;