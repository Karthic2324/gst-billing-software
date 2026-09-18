import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './InvoiceApp.css';

const InvoiceApp = () => {
  const [sameAsBilling, setSameAsBilling] = useState(false);
  const [activeSuggestionRow, setActiveSuggestionRow] = useState(null);
  const [suggestions, setSuggestions] = useState([]);

  const [invoice, setInvoice] = useState({
    invoiceNo: 'MB/SL/26-27/1001',
    invoiceDate: new Date().toISOString().split('T')[0],
    sellerName: ' Om Muruga Auto Electrical Works 🦚',
    sellerAddress: '6/1 , Siddhi Vinayagar Colony, Linganoor, Siruvani Road, Veerakeralam, Coimbatore - 641 007.',
    sellerGstin: '33DSSPS7678B1Z2',
    sellerContact: '9976765151 / 8098986464',
    buyerName: '',
    buyerAddress: '',
    buyerGstin: '',
    buyerPan: '',
    placeOfSupply: 'Tamil Nadu',
    shippingAddress: '',
    bankName: 'ICICI Bank, COIMBATORE GANAPATHY',
    bankIfsc: 'ICIC0004179',
    bankAccountNo: '417905500050',
    receivedAmount: 0,
    items: [
      {
        sNo: 1,
        itemDescription: '',
        hsnSac: '',
        qty: 1,
        unit: 'NOS',
        rate: 0
      }
    ]
  });

  // Fetch the next invoice number when app opens
  useEffect(() => {
    fetchNextInvoiceNumber();
  }, []);

  const fetchNextInvoiceNumber = async () => {
    try {
      const res = await axios.get('http://localhost:8080/api/invoices/next-number');
      if (res.data && res.data.nextInvoiceNo) {
        setInvoice((prev) => ({ ...prev, invoiceNo: res.data.nextInvoiceNo }));
      }
    } catch (error) {
      console.error('Could not fetch next invoice number:', error);
    }
  };

  // Reset form for the next bill
  const resetFormForNextInvoice = (nextInvoiceNo) => {
    setInvoice({
      invoiceNo: nextInvoiceNo,
      invoiceDate: new Date().toISOString().split('T')[0],
      sellerName: ' Om Muruga Auto Electrical Works 🦚 ',
      sellerAddress: '6/1 , Siddhi Vinayagar Colony, Linganoor, Siruvani Road, Veerakeralam, Coimbatore - 641 007.',
      sellerGstin: '33DSSPS7678B1Z2',
      sellerContact: '9976765151 / 8098986464',
      buyerName: '',
      buyerAddress: '',
      buyerGstin: '',
      buyerPan: '',
      placeOfSupply: 'Tamil Nadu',
      shippingAddress: '',
      bankName: 'ICICI Bank, COIMBATORE GANAPATHY',
      bankIfsc: 'ICIC0004179',
      bankAccountNo: '417905500050',
      receivedAmount: 0,
      items: [
        {
          sNo: 1,
          itemDescription: '',
          hsnSac: '',
          qty: 1,
          unit: 'NOS',
          rate: 0
        }
      ]
    });
    setSameAsBilling(false);
  };

  // Handle general field changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    const updatedInvoice = { ...invoice, [name]: value };

    if (sameAsBilling && (name === 'buyerAddress' || name === 'buyerName')) {
      const updatedName = name === 'buyerName' ? value : invoice.buyerName;
      const updatedAddr = name === 'buyerAddress' ? value : invoice.buyerAddress;
      updatedInvoice.shippingAddress = `${updatedName}\n${updatedAddr}`.trim();
    }

    setInvoice(updatedInvoice);
  };

  // Toggle "Same as Billing Address"
  const handleCheckboxChange = (e) => {
    const isChecked = e.target.checked;
    setSameAsBilling(isChecked);

    if (isChecked) {
      setInvoice({
        ...invoice,
        shippingAddress: `${invoice.buyerName}\n${invoice.buyerAddress}`.trim()
      });
    } else {
      setInvoice({
        ...invoice,
        shippingAddress: ''
      });
    }
  };

  // Handle item input & fetch database search suggestions
  const handleItemChange = async (index, e) => {
    const { name, value } = e.target;
    const updatedItems = [...invoice.items];
    updatedItems[index][name] = value;
    setInvoice({ ...invoice, items: updatedItems });

    if (name === 'itemDescription') {
      setActiveSuggestionRow(index);
      if (value.trim().length > 0) {
        try {
          const res = await axios.get(`http://localhost:8080/api/products/search?query=${encodeURIComponent(value)}`);
          setSuggestions(res.data);
        } catch (err) {
          console.error('Error fetching product suggestions:', err);
        }
      } else {
        setSuggestions([]);
      }
    }
  };

  // Select item from suggestion list
  const handleSelectSuggestion = (index, product) => {
    const updatedItems = [...invoice.items];
    updatedItems[index].itemDescription = product.itemDescription;
    updatedItems[index].hsnSac = product.hsnSac || '';
    updatedItems[index].rate = product.rate || 0;

    setInvoice({ ...invoice, items: updatedItems });
    setActiveSuggestionRow(null);
    setSuggestions([]);
  };

  // Add new item row
  const addItemRow = () => {
    setInvoice({
      ...invoice,
      items: [
        ...invoice.items,
        {
          sNo: invoice.items.length + 1,
          itemDescription: '',
          hsnSac: '',
          qty: 1,
          unit: 'NOS',
          rate: 0
        }
      ]
    });
  };

  // Remove item row
  const removeItemRow = (index) => {
    const updatedItems = invoice.items.filter((_, i) => i !== index);
    const reindexed = updatedItems.map((item, idx) => ({ ...item, sNo: idx + 1 }));
    setInvoice({ ...invoice, items: reindexed });
  };

  // Calculations
  const calculateItemValues = (item) => {
    const qty = Number(item.qty) || 0;
    const rate = Number(item.rate) || 0;
    const taxableValue = qty * rate;
    const taxAmount = taxableValue * 0.18; // 18% GST (9% CGST + 9% SGST)
    const totalAmount = taxableValue + taxAmount;
    return { taxableValue, taxAmount, totalAmount };
  };

  const getSummary = () => {
    let totalQty = 0;
    let totalTax = 0;
    let totalAmount = 0;

    invoice.items.forEach((item) => {
      const vals = calculateItemValues(item);
      totalQty += Number(item.qty) || 0;
      totalTax += vals.taxAmount;
      totalAmount += vals.totalAmount;
    });

    return { totalQty, totalTax, totalAmount };
  };

  const summary = getSummary();

  // Save Invoice to Database
  const handleSaveBackend = async () => {
    const payload = {
      ...invoice,
      totalQty: summary.totalQty,
      totalTax: summary.totalTax,
      totalAmount: summary.totalAmount,
      taxBreakdowns: invoice.items.map((item) => {
        const vals = calculateItemValues(item);
        return {
          hsnSac: item.hsnSac,
          taxableValue: vals.taxableValue.toFixed(2),
          cgstRate: 9,
          cgstAmount: (vals.taxAmount / 2).toFixed(2),
          sgstRate: 9,
          sgstAmount: (vals.taxAmount / 2).toFixed(2)
        };
      }),
      items: invoice.items.map((item) => {
        const vals = calculateItemValues(item);
        return {
          ...item,
          taxAmount: Number(vals.taxAmount.toFixed(2)),
          amount: Number(vals.totalAmount.toFixed(2))
        };
      })
    };

    try {
      await axios.post('http://localhost:8080/api/invoices', payload);
      alert(`Invoice ${invoice.invoiceNo} saved & products stored in database! Form ready for next bill.`);

      // Fetch auto-incremented invoice number for the next bill
      const nextRes = await axios.get('http://localhost:8080/api/invoices/next-number');
      resetFormForNextInvoice(nextRes.data.nextInvoiceNo);

    } catch (error) {
      console.error('Error saving invoice:', error);
      alert('Failed to save invoice. Make sure Spring Boot server is running.');
    }
  };

  return (
    <div className="billing-container">
      {/* Control Panel Header */}
      <div className="no-print control-panel">
        <h2>GST Billing Software</h2>
        <p>Current Invoice No: <strong>{invoice.invoiceNo}</strong>. Products typed here are permanently stored in the database for future suggestions.</p>
        <div className="control-buttons">
          <button className="btn btn-save" onClick={handleSaveBackend}>Save & Next Invoice</button>
          <button className="btn btn-print" onClick={() => window.print()}>Print / Save PDF</button>
        </div>
      </div>

      {/* Main Invoice Box */}
      <div className="invoice-box" id="printable-invoice">
        <div className="invoice-header">
          <span>TAX INVOICE</span>
          <span>ORIGINAL FOR RECIPIENT</span>
        </div>

        {/* Seller Info & Invoice Metadata */}
        <div className="grid-2">
          <div className="box">
            <h3>{invoice.sellerName}</h3>
            <p>{invoice.sellerAddress}</p>
            <p><strong>GSTIN:</strong> {invoice.sellerGstin}</p>
            <h3><strong>Contact:</strong> {invoice.sellerContact}</h3>
          </div>
          <div className="box meta-box">
            <div>
              <strong>Invoice No.</strong><br />
              <input
                type="text"
                name="invoiceNo"
                value={invoice.invoiceNo}
                onChange={handleChange}
                className="editable-input"
              />
            </div>
            <div>
              <strong>Invoice Date</strong><br />
              <input
                type="date"
                name="invoiceDate"
                value={invoice.invoiceDate}
                onChange={handleChange}
                className="editable-input"
              />
            </div>
          </div>
        </div>

        {/* Bill To & Ship To Details */}
        <div className="grid-2">
          <div className="box">
            <strong>BILL TO:</strong>
            <div className="form-group">
              <input
                type="text"
                name="buyerName"
                placeholder="Buyer / Company Name"
                value={invoice.buyerName}
                onChange={handleChange}
                className="editable-input full-width"
              />
            </div>
            <div className="form-group">
              <textarea
                name="buyerAddress"
                placeholder="Billing Address"
                value={invoice.buyerAddress}
                onChange={handleChange}
                className="editable-textarea full-width"
                rows="2"
              />
            </div>
            <div className="form-row">
              <input
                type="text"
                name="buyerGstin"
                placeholder="Buyer GSTIN"
                value={invoice.buyerGstin}
                onChange={handleChange}
                className="editable-input"
              />
              <input
                type="text"
                name="placeOfSupply"
                placeholder="Place of Supply"
                value={invoice.placeOfSupply}
                onChange={handleChange}
                className="editable-input"
              />
            </div>
          </div>

          <div className="box">
            <div className="ship-to-header">
              <strong>SHIP TO:</strong>
              <label className="checkbox-label no-print">
                <input
                  type="checkbox"
                  checked={sameAsBilling}
                  onChange={handleCheckboxChange}
                />
                Same as Bill To
              </label>
            </div>
            <div className="form-group" style={{ marginTop: '5px' }}>
              <textarea
                name="shippingAddress"
                placeholder="Shipping Address"
                value={invoice.shippingAddress}
                onChange={handleChange}
                disabled={sameAsBilling}
                className={`editable-textarea full-width ${sameAsBilling ? 'disabled-textarea' : ''}`}
                rows="4"
              />
            </div>
          </div>
        </div>

        {/* Items Table */}
        <table className="main-table">
          <thead>
            <tr>
              <th>S.NO.</th>
              <th>ITEMS DESCRIPTION</th>
              <th>HSN/SAC</th>
              <th>QTY.</th>
              <th>RATE (₹)</th>
              <th>TAX (18%)</th>
              <th>AMOUNT (₹)</th>
              <th className="no-print">ACTION</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((item, idx) => {
              const vals = calculateItemValues(item);

              return (
                <tr key={idx}>
                  <td>{item.sNo}</td>
                  <td className="suggestion-cell">
                    <input
                      type="text"
                      name="itemDescription"
                      placeholder="Type product name ..."
                      value={item.itemDescription}
                      onChange={(e) => handleItemChange(idx, e)}
                      onFocus={() => setActiveSuggestionRow(idx)}
                      onBlur={() => setTimeout(() => setActiveSuggestionRow(null), 200)}
                      className="editable-input full-width"
                      autoComplete="off"
                    />
                    {/* Live Database Search Suggestions Dropdown */}
                    {activeSuggestionRow === idx && suggestions.length > 0 && (
                      <ul className="suggestions-dropdown no-print">
                        {suggestions.map((product, sIdx) => (
                          <li
                            key={sIdx}
                            onMouseDown={() => handleSelectSuggestion(idx, product)}
                          >
                            <strong>{product.itemDescription}</strong>
                            <span>HSN: {product.hsnSac || 'N/A'} | Rate: ₹{product.rate}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </td>
                  <td>
                    <input
                      type="text"
                      name="hsnSac"
                      placeholder="HSN"
                      value={item.hsnSac}
                      onChange={(e) => handleItemChange(idx, e)}
                      className="editable-input text-center"
                      style={{ width: '80px' }}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      name="qty"
                      value={item.qty}
                      onChange={(e) => handleItemChange(idx, e)}
                      className="editable-input text-center"
                      style={{ width: '60px' }}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      name="rate"
                      value={item.rate}
                      onChange={(e) => handleItemChange(idx, e)}
                      className="editable-input text-right"
                      style={{ width: '90px' }}
                    />
                  </td>
                  <td>{vals.taxAmount.toFixed(2)}</td>
                  <td><strong>{vals.totalAmount.toFixed(2)}</strong></td>
                  <td className="no-print text-center">
                    {invoice.items.length > 1 && (
                      <button className="btn-remove" onClick={() => removeItemRow(idx)}>X</button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan="8" className="no-print text-left">
                <button className="btn-add" onClick={addItemRow}>+ Add Item Row</button>
              </td>
            </tr>
            <tr>
              <td colSpan="3" className="text-right"><strong>TOTAL</strong></td>
              <td><strong>{summary.totalQty}</strong></td>
              <td></td>
              <td><strong>₹ {summary.totalTax.toFixed(2)}</strong></td>
              <td colSpan="2"><strong>₹ {summary.totalAmount.toFixed(2)}</strong></td>
            </tr>
            <tr>
              <td colSpan="6" className="text-right"><strong>RECEIVED AMOUNT</strong></td>
              <td colSpan="2">
                <input
                  type="number"
                  name="receivedAmount"
                  value={invoice.receivedAmount}
                  onChange={handleChange}
                  className="editable-input text-right"
                  style={{ width: '100px', fontWeight: 'bold' }}
                />
              </td>
            </tr>
          </tfoot>
        </table>

        {/* Tax Breakdown Table */}
        <table className="tax-table">
          <thead>
            <tr>
              <th rowSpan="2">HSN/SAC</th>
              <th rowSpan="2">Taxable Value (₹)</th>
              <th colSpan="2">CGST</th>
              <th colSpan="2">SGST</th>
              <th rowSpan="2">Total Tax Amount (₹)</th>
            </tr>
            <tr>
              <th>Rate</th><th>Amount (₹)</th>
              <th>Rate</th><th>Amount (₹)</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((item, idx) => {
              const vals = calculateItemValues(item);
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

        {/* Bank & Signature Details */}
        <div className="grid-2 footer-section">
          <div className="box">
            <p><strong>Bank Details</strong></p>
            <p>Name: {invoice.sellerName}</p>
            <p>IFSC Code: {invoice.bankIfsc}</p>
            <p>Account No: {invoice.bankAccountNo}</p>
            <p>Bank: {invoice.bankName}</p>
          </div>
          <div className="box sign-box">
            <p>Authorised Signatory For</p>
            <br />
            <strong>{invoice.sellerName}</strong>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceApp;