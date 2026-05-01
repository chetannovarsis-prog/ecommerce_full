import React from 'react';
import html2pdf from 'html2pdf.js';
import { Download } from 'lucide-react';

const InvoiceGenerator = ({ order, customer, responsive = false }) => {
  const getInvoiceHTML = (order, customer) => {
    const assetBase = typeof window !== 'undefined' ? window.location.origin : '';
    const shippingCharge = order?.paymentMethod === 'cod' ? 70 : 0;
    const orderDate = new Date(order.createdAt);
    const dateStr = orderDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

    const itemsSubtotal = order?.items?.reduce(
      (sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0),
      0
    ) || 0;
    
    const paidTotal = Number(order?.totalAmount || 0);
    const isCancelled = order?.status === 'CANCELLED';
    
    // Payment status mapping
    const paymentStatusMap = {
      'PAID': 'PAID',
      'COD_CONFIRMED': 'PAID',
      'COD_PENDING': 'PENDING',
      'PAYMENT_PENDING': 'PENDING',
      'CANCELLED': 'CANCELLED'
    };
    const paymentStatus = paymentStatusMap[order.status] || order.status;

    return `
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Inter:wght@400;700&display=swap" rel="stylesheet">
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: 'Inter', sans-serif;
            background: #f5f2e9;
            color: #4a4a4a;
          }
          .invoice-container {
            width: 794px; /* A4 width */
            height: 1122px; /* Strict A4 height to prevent 2nd page */
            margin: 0 auto;
            padding: 40px 50px; /* Adjusted top padding */
            background: #f5f2e9;
            position: relative;
            overflow: hidden;
            display: flex;
            flex-direction: column;
          }
          .content {
            position: relative;
            z-index: 1;
            height: 100%;
            display: flex;
            flex-direction: column;
          }
          /* Header */
          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 30px;
          }
          .title-section {
            display: flex;
            flex-direction: column;
            align-items: flex-end;
          }
          .logo {
            width: 120px;
          }
          .invoice-title {
            font-family: 'Playfair Display', serif;
            font-size: 64px;
            color: #e08d4a;
            line-height: 1;
            margin-bottom: 6px;
            text-decoration: none !important;
            border: 0 !important;
            position: relative;
            z-index: 2;
          }
          .title-divider {
            width: 260px;
            height: 1px;
            background: #9a9cd8;
            margin-left: auto;
            margin-top: 14px;
            position: relative;
            z-index: 1;
          }
          /* Info Section */
          .info-section {
            display: flex;
            justify-content: space-between;
            margin-top: 45px;
            margin-bottom: 40px;
          }
          .invoice-to {
            max-width: 300px;
          }
          .label {
            color: #e08d4a;
            font-weight: 800;
            font-size: 14px;
            margin-bottom: 15px;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          .customer-name {
            font-weight: 700;
            font-size: 16px;
            margin-bottom: 5px;
            color: #2c2c2c;
          }
          .customer-address {
            font-size: 14px;
            line-height: 1.6;
          }
          .invoice-meta {
            text-align: right;
            margin-top: 32px;
          }
          .meta-row {
            font-weight: 700;
            font-size: 14px;
            margin-bottom: 5px;
            color: #2c2c2c;
          }
          /* Table */
          .table-container {
            background: rgba(255, 255, 255, 0.94);
            border-radius: 4px;
            padding: 20px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.02);
            margin-bottom: 40px;
            min-height: 430px;
            position: relative;
            overflow: hidden;
          }
          .table-motif {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 340px;
            opacity: 0.12;
            z-index: 0;
            pointer-events: none;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            position: relative;
            z-index: 1;
          }
          th {
            text-align: left;
            color: #e08d4a;
            font-weight: 800;
            font-size: 12px;
            padding: 15px 10px;
            border-bottom: 1px solid #9a9cd8;
            text-transform: uppercase;
          }
          td {
            padding: 15px 10px;
            font-size: 14px;
            font-weight: 700;
            color: #2c2c2c;
            vertical-align: top;
          }
          .col-no { width: 50px; text-align: center; }
          .col-desc { width: auto; word-break: break-word; white-space: normal; line-height: 1.5; }
          .col-price { width: 100px; text-align: right; }
          .col-qty { width: 80px; text-align: center; }
          .col-total { width: 120px; text-align: right; }
          .table-footer-divider {
            border-top: 1px solid #9a9cd8;
            margin: 20px 10px;
            position: relative;
            z-index: 1;
          }
          /* Summary */
          .summary-section {
            display: flex;
            justify-content: space-between;
            padding: 0 10px;
            position: relative;
            z-index: 1;
          }
          .payment-status-box .status-value {
            font-weight: 800;
            font-size: 18px;
            color: #2c2c2c;
            margin-top: 5px;
          }
          .payment-status-box .status-value.cancelled {
            color: #dc2626;
          }
          .totals-table {
            width: 300px;
          }
          .total-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
            font-size: 14px;
          }
          .total-label {
            color: #e08d4a;
            font-weight: 800;
          }
          .total-value {
            font-weight: 800;
            color: #2c2c2c;
          }
          .grand-total {
            border-top: 1px solid #9a9cd8;
            margin-top: 10px;
            padding-top: 10px;
            font-size: 16px;
          }
          /* Footer */
          .invoice-footer {
            margin-top: auto;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            padding-bottom: 10px;
          }
          .thank-you-image {
            width: 170px;
            display: block;
          }
          .company-info {
            text-align: right;
          }
          .company-info .name {
            color: #e08d4a;
            font-weight: 800;
            font-size: 18px;
            margin-bottom: 5px;
          }
          .company-info .phone {
            color: #e08d4a;
            font-weight: 800;
            font-size: 16px;
            margin-bottom: 15px;
          }
          .company-info .web, .company-info .email {
            font-size: 12px;
            color: #2c2c2c;
            margin-bottom: 3px;
          }
          @page {
            size: A4;
            margin: 0;
          }
        </style>

        <div class="invoice-container">
          <div class="content">
            <div class="header">
              <img src="${assetBase}/images/logo3.png" class="logo" />
              <div class="title-section">
                <div class="invoice-title">INVOICE</div>
                <div class="title-divider"></div>
              </div>
            </div>

            <div class="info-section">
              <div class="invoice-to">
                <div class="label">Invoice To :</div>
                <div class="customer-name">${order.shippingAddress?.fullName || customer?.name || 'Customer'}</div>
                <div class="customer-address">
                  ${order.shippingAddress?.address || ''}<br>
                  ${order.shippingAddress?.city || ''}, ${order.shippingAddress?.state || ''} ${order.shippingAddress?.pinCode || ''}
                </div>
              </div>
              <div class="invoice-meta">
                <div class="meta-row">Invoice No.${order.invoiceNumber || order.id.slice(-6).toUpperCase()}</div>
                <div class="meta-row">${dateStr}</div>
              </div>
            </div>

            <div class="table-container">
              <img src="${assetBase}/images/mandala_motif.png" class="table-motif" />
              <table>
                <thead>
                  <tr>
                    <th class="col-no">No.</th>
                    <th class="col-desc">Product Description</th>
                    <th class="col-price">Price</th>
                    <th class="col-qty">Qty</th>
                    <th class="col-total">Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${order.items?.map((item, index) => `
                    <tr>
                      <td class="col-no">${index + 1}</td>
                      <td class="col-desc">${item.product?.name || 'Product'}</td>
                      <td class="col-price">Rs.${Number(item.price).toFixed(2)}</td>
                      <td class="col-qty">${item.quantity}</td>
                      <td class="col-total">Rs.${(Number(item.price) * Number(item.quantity)).toFixed(2)}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
              <div class="table-footer-divider"></div>
              
              <div class="summary-section">
                <div class="payment-status-box">
                  <div class="label">Payment Status :</div>
                  <div class="status-value ${isCancelled ? 'cancelled' : ''}">${isCancelled ? 'CANCELLED' : paymentStatus}</div>
                </div>
                <div class="totals-table">
                  <div class="total-row">
                    <span class="total-label">Subtotal</span>
                    <span class="total-value">Rs.${itemsSubtotal.toFixed(2)}</span>
                  </div>
                  <div class="total-row">
                    <span class="total-label">Shipping</span>
                    <span class="total-value">${shippingCharge ? `Rs.${shippingCharge.toFixed(2)}` : 'Free'}</span>
                  </div>
                  <div class="total-row grand-total">
                    <span class="total-label">Total</span>
                    <span class="total-value">Rs.${paidTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="invoice-footer">
              <img src="${assetBase}/images/thankyou.png" class="thank-you-image" alt="Thank You" />
              <div class="company-info">
                <div class="name">Ghar of Ethnics</div>
                <div class="phone">+ 91 9845634734</div>
                <div class="web">www.gharofethnics.com</div>
                <div class="email">support@gharofethnics.com</div>
              </div>
            </div>
          </div>
        </div>
    `;
  };

  const waitForImages = async (root) => {
    const images = Array.from(root.querySelectorAll('img'));
    await Promise.all(
      images.map((img) => {
        if (img.complete) return Promise.resolve();
        return new Promise((resolve) => {
          img.onload = () => resolve();
          img.onerror = () => resolve();
        });
      })
    );
  };

  const generateAndDownloadPDF = async () => {
    if (!order) return;

    const htmlString = getInvoiceHTML(order, customer);
    const host = document.createElement('div');
    host.style.position = 'fixed';
    host.style.left = '-99999px';
    host.style.top = '0';
    host.style.width = '794px';
    host.innerHTML = htmlString;
    document.body.appendChild(host);

    const invoiceElement = host.querySelector('.invoice-container');
    if (!invoiceElement) {
      document.body.removeChild(host);
      return;
    }

    await waitForImages(invoiceElement);

    const opt = {
      margin: 0,
      filename: `Invoice_${order.invoiceNumber || order.id}.pdf`,
      image: { type: 'jpeg', quality: 1 },
      html2canvas: { 
        scale: 2, 
        useCORS: true,
        letterRendering: true,
        backgroundColor: '#f5f2e9',
        scrollY: 0,
        windowWidth: 794
      },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
      jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' },
    };

    try {
      await html2pdf().set(opt).from(invoiceElement).save();
    } finally {
      if (host.parentNode) {
        host.parentNode.removeChild(host);
      }
    }
  };

  const baseClasses = "flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-all active:scale-95";

  if (!responsive) {
    return (
      <button
        onClick={generateAndDownloadPDF}
        className={`${baseClasses} text-xs font-black uppercase tracking-widest`}
      >
        <Download size={14} />
        Download Invoice
      </button>
    );
  }

  return (
    <>
      <button
        onClick={generateAndDownloadPDF}
        className={`${baseClasses} hidden md:flex text-sm`}
      >
        <Download size={16} />
        Download Invoice
      </button>

      <button
        onClick={generateAndDownloadPDF}
        className={`${baseClasses} md:hidden px-2`}
        title="Download Invoice"
      >
        <Download size={16} />
      </button>
    </>
  );
};

export default InvoiceGenerator;
