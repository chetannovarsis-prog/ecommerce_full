import html2pdf from 'html2pdf.js';

export const generateInvoice = (order) => {
  if (!order) return;

  const totalQuantity = order.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
  const INR = '\u20B9';
  const shippingCharge = order.paymentMethod === 'cod' ? 70 : 0;
  const originalItemsSubtotal =
    order.items?.reduce(
      (sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0),
      0
    ) || 0;
  const paidTotal = Number(order.totalAmount || 0);
  const paidItemsSubtotal = Math.max(0, paidTotal - shippingCharge);
  const discountAmount = Math.max(0, originalItemsSubtotal - paidItemsSubtotal);
  const hasDiscount = discountAmount > 0.01;

  const invoiceContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: 'Segoe UI', Arial, sans-serif;
          color: #2c3e50;
          line-height: 1.5;
          background: white;
        }
        .invoice-container {
          width: 100%;
          max-width: 900px;
          margin: 0 auto;
          padding: 40px;
          background: white;
        }
        /* Header */
        .invoice-header {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 40px;
          margin-bottom: 40px;
          padding-bottom: 30px;
          border-bottom: 3px solid #000;
        }
        .company-section h2 {
          font-size: 32px;
          font-weight: 900;
          margin-bottom: 10px;
          letter-spacing: -1px;
        }
        .company-section p {
          font-size: 12px;
          color: #666;
          margin: 4px 0;
          font-weight: 500;
        }
        .invoice-info {
          text-align: right;
        }
        .invoice-number {
          font-size: 18px;
          font-weight: 700;
          color: #000;
          margin-bottom: 8px;
        }
        .invoice-meta-row {
          display: flex;
          justify-content: flex-end;
          margin: 5px 0;
          font-size: 12px;
          color: #555;
        }
        .invoice-meta-label {
          font-weight: 600;
          margin-right: 8px;
          min-width: 50px;
        }
        .status-badge {
          display: inline-block;
          margin-top: 10px;
          padding: 6px 14px;
          background: #10b981;
          color: white;
          border-radius: 3px;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        /* Address Grid */
        .addresses-section {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 30px;
          margin-bottom: 40px;
          padding-bottom: 30px;
          border-bottom: 1px solid #e5e7eb;
        }
        .address-block h4 {
          font-size: 11px;
          font-weight: 900;
          text-transform: uppercase;
          color: #666;
          margin-bottom: 12px;
          letter-spacing: 1px;
        }
        .address-block p {
          font-size: 12px;
          margin: 4px 0;
          line-height: 1.6;
        }
        .address-block strong {
          font-weight: 700;
          display: block;
          margin-bottom: 3px;
        }
        /* Items Table */
        .items-section {
          margin-bottom: 30px;
        }
        .items-header {
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          color: #666;
          margin-bottom: 15px;
          letter-spacing: 0.5px;
        }
        .items-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
        }
        .items-table thead {
          background: #f8f9fa;
          border-top: 2px solid #000;
          border-bottom: 2px solid #000;
        }
        .items-table th {
          padding: 14px 12px;
          text-align: left;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          color: #2c3e50;
          letter-spacing: 0.5px;
        }
        .items-table td {
          padding: 14px 12px;
          font-size: 12px;
          border-bottom: 1px solid #e5e7eb;
        }
        .items-table tbody tr:last-child td {
          border-bottom: 2px solid #000;
        }
        .product-name {
          font-weight: 700;
          color: #000;
          margin-bottom: 4px;
        }
        .product-variant {
          font-size: 11px;
          color: #999;
          font-style: italic;
        }
        .qty-cell {
          text-align: center;
          font-weight: 600;
        }
        .price-cell {
          text-align: right;
        }
        .total-cell {
          text-align: right;
          font-weight: 700;
          color: #000;
        }
        /* Summary */
        .summary-grid {
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 40px;
          margin: 30px 0;
        }
        .summary-left {
          font-size: 12px;
          color: #666;
        }
        .summary-left p {
          margin: 8px 0;
        }
        .summary-box {
          width: 280px;
        }
        .summary-row {
          display: flex;
          justify-content: space-between;
          padding: 10px 0;
          font-size: 12px;
          border-bottom: 1px solid #e5e7eb;
        }
        .summary-row.total-row {
          border-top: 2px solid #000;
          border-bottom: 2px solid #000;
          padding: 14px 0;
          font-size: 16px;
          font-weight: 900;
          margin: 15px 0;
          color: #000;
        }
        .summary-label {
          color: #666;
          font-weight: 500;
        }
        .summary-amount {
          font-weight: 700;
          color: #2c3e50;
        }
        /* Payment Info */
        .payment-section {
          background: #f8f9fa;
          padding: 20px;
          border-radius: 4px;
          margin: 30px 0;
          font-size: 12px;
        }
        .payment-section h4 {
          font-size: 11px;
          font-weight: 900;
          text-transform: uppercase;
          color: #000;
          margin-bottom: 12px;
          letter-spacing: 0.5px;
        }
        .payment-row {
          margin: 8px 0;
          display: flex;
          justify-content: space-between;
        }
        .payment-label {
          color: #666;
          font-weight: 500;
        }
        .payment-value {
          font-weight: 700;
          color: #2c3e50;
        }
        /* Footer */
        .footer {
          margin-top: 50px;
          padding-top: 30px;
          border-top: 1px solid #e5e7eb;
          text-align: center;
          font-size: 11px;
          color: #999;
        }
        .footer p {
          margin: 6px 0;
        }
        .thank-you {
          font-size: 13px;
          color: #2c3e50;
          font-weight: 600;
          margin-bottom: 12px;
        }
      </style>
    </head>
    <body>
      <div class="invoice-container">
        <!-- Header -->
        <div class="invoice-header">
          <div class="company-section">
            <h2>INVOICE</h2>
            <p><strong>Ghar Of Ethnics</strong></p>
            <p>support@gharofethnics.com</p>
          </div>
          <div class="invoice-info">
            <div class="invoice-number">Invoice #${order.id.slice(-8).toUpperCase()}</div>
            <div class="invoice-meta-row">
              <span class="invoice-meta-label">Date:</span>
              <span>${new Date(order.createdAt).toLocaleDateString('en-IN', { 
                day: '2-digit', 
                month: 'long', 
                year: 'numeric' 
              })}</span>
            </div>
            <div class="invoice-meta-row">
              <span class="invoice-meta-label">Status:</span>
              <span>${order.status}</span>
            </div>
            <div class="status-badge">${order.status}</div>
          </div>
        </div>

        <!-- Addresses -->
        <div class="addresses-section">
          <div class="address-block">
            <h4>Bill To</h4>
            <strong>${order.customer?.name || 'N/A'}</strong>
            <p>${order.customer?.email || ''}</p>
            ${order.customer?.mobile ? `<p>${order.customer.mobile}</p>` : ''}
          </div>
          <div class="address-block">
            <h4>Ship To</h4>
            ${order.shippingAddress ? `
              <strong>${order.shippingAddress.firstName} ${order.shippingAddress.lastName}</strong>
              <p>${order.shippingAddress.address}</p>
              ${order.shippingAddress.apartment ? `<p>${order.shippingAddress.apartment}</p>` : ''}
              <p>${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.pinCode}</p>
              <p>${order.shippingAddress.phone || ''}</p>
            ` : '<p>N/A</p>'}
          </div>
        </div>

        <!-- Items -->
        <div class="items-section">
          <div class="items-header">Order Items (${order.items?.length || 0} product${order.items?.length !== 1 ? 's' : ''} • ${totalQuantity} unit${totalQuantity !== 1 ? 's' : ''})</div>
          <table class="items-table">
            <thead>
              <tr>
                <th style="width: 50%;">Product Details</th>
                <th style="width: 12%; text-align: center;">Qty</th>
                <th style="width: 18%; text-align: right;">Unit Price</th>
                <th style="width: 20%; text-align: right;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${order.items?.map((item, idx) => `
                <tr>
                  <td>
                    <div class="product-name">${item.product?.name || 'Product'}</div>
                    ${item.variantTitle ? `<div class="product-variant">${item.variantTitle}</div>` : ''}
                  </td>
                  <td class="qty-cell">${item.quantity}</td>
                  <td class="price-cell">₹${item.price.toLocaleString('en-IN')}</td>
                  <td class="total-cell">₹${(item.price * item.quantity).toLocaleString('en-IN')}</td>
                </tr>
              `).join('') || ''}
            </tbody>
          </table>
        </div>

        <!-- Summary -->
        <div class="summary-section">
          <div class="summary-left">
            <p><strong>Payment Method:</strong> ${order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Razorpay (UPI / Card / Netbanking)'}</p>
            ${order.razorpayPaymentId ? `<p><strong>Payment ID:</strong> ${order.razorpayPaymentId}</p>` : ''}
            <p><strong>Order Status:</strong> ${order.status}</p>
          </div>
          <div class="summary-box">
            ${
              hasDiscount
                ? `
            <div class="summary-row">
              <span class="summary-label">Items Total:</span>
              <span class="summary-amount" style="text-decoration: line-through; opacity: 0.7;">${INR}${originalItemsSubtotal.toLocaleString('en-IN')}</span>
            </div>
            <div class="summary-row">
              <span class="summary-label">Discount:</span>
              <span class="summary-amount" style="color:#059669;font-weight:700;">-${INR}${discountAmount.toLocaleString('en-IN')}</span>
            </div>
            <div class="summary-row">
              <span class="summary-label">Subtotal (After Discount):</span>
              <span class="summary-amount">${INR}${paidItemsSubtotal.toLocaleString('en-IN')}</span>
            </div>
            `
                : `
            <div class="summary-row">
              <span class="summary-label">Subtotal:</span>
              <span class="summary-amount">${INR}${paidItemsSubtotal.toLocaleString('en-IN')}</span>
            </div>
            `
            }
            <div class="summary-row">
              <span class="summary-label">Shipping:</span>
              <span class="summary-amount">${shippingCharge ? `${INR}${shippingCharge}` : 'Free'}</span>
            </div>
            <div class="summary-row">
              <span class="summary-label">Taxes:</span>
              <span class="summary-amount">—</span>
            </div>
            <div class="summary-row total-row">
              <span>TOTAL</span>
              <span>${INR}${paidTotal.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="footer">
          <p class="thank-you">Thank you for your purchase!</p>
          <p>If you have any questions about your order, please contact our support team at support@gharofethnics.com</p>
          <p style="margin-top: 15px; font-size: 10px;">Generated on ${new Date().toLocaleString('en-IN')}</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const opt = {
    margin: 10,
    filename: `Invoice_${order.id.slice(-8).toUpperCase()}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };

  html2pdf().set(opt).from(invoiceContent).save();
};
