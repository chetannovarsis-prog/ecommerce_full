import React from 'react';
import html2pdf from 'html2pdf.js';
import { Download } from 'lucide-react';

const InvoiceGenerator = ({ order, customer, responsive = false }) => {
  const getInvoiceHTML = (order, customer) => {
    const shippingCharge = order?.paymentMethod === 'cod' ? 70 : 0;
    const originalItemsSubtotal =
      order?.items?.reduce(
        (sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0),
        0
      ) || 0;
    const paidTotal = Number(order?.totalAmount || 0);
    const paidItemsSubtotal = Math.max(0, paidTotal - shippingCharge);
    const discountAmount = Math.max(0, originalItemsSubtotal - paidItemsSubtotal);
    const hasDiscount = discountAmount > 0.01;

    return `
      <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">
        <!-- Header -->
        <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #000; padding-bottom: 20px;">
          <h1 style="margin: 0; font-size: 28px; font-weight: bold;">INVOICE</h1>
          <p style="margin: 10px 0 0 0; font-size: 12px; color: #666;">Ghar of Ethnics</p>
        </div>

        <!-- Invoice Details -->
        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; margin-bottom: 30px;">
          <div style="word-break: break-word;">
            <p style="margin: 0; font-weight: bold; font-size: 12px;">Invoice #</p>
            <p style="margin: 5px 0 0 0; font-size: 14px; word-break: break-all;">${order.invoiceNumber || order.id}</p>
          </div>
          <div>
            <p style="margin: 0; font-weight: bold; font-size: 12px;">Date</p>
            <p style="margin: 5px 0 0 0; font-size: 14px;">${new Date(order.createdAt).toLocaleDateString('en-IN')}</p>
          </div>
          <div>
            <p style="margin: 0; font-weight: bold; font-size: 12px;">Status</p>
            <p style="margin: 5px 0 0 0; font-size: 14px;">${order.status}</p>
          </div>
        </div>

        <!-- Bill To -->
        <div style="margin-bottom: 30px;">
          <p style="margin: 0 0 10px 0; font-weight: bold; font-size: 12px;">BILL TO:</p>
          <p style="margin: 0; font-size: 14px; font-weight: bold;">${customer?.name || 'N/A'}</p>
          <p style="margin: 5px 0 0 0; font-size: 12px; color: #666;">${customer?.email || 'N/A'}</p>
          ${
            order.shippingAddress
              ? `
              <p style="margin: 5px 0 0 0; font-size: 12px;">
                ${order.shippingAddress.address || ''} ${order.shippingAddress.apartment || ''}
              </p>
              <p style="margin: 5px 0 0 0; font-size: 12px;">
                ${order.shippingAddress.city || ''}, ${order.shippingAddress.state || ''} ${order.shippingAddress.pinCode || ''}
              </p>
              <p style="margin: 5px 0 0 0; font-size: 12px;">Phone: ${order.shippingAddress.phone || 'N/A'}</p>
              `
              : ''
          }
        </div>

        <!-- Items Table -->
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <thead>
            <tr style="border-bottom: 2px solid #000;">
              <th style="text-align: left; padding: 10px; font-size: 12px; font-weight: bold;">Product</th>
              <th style="text-align: center; padding: 10px; font-size: 12px; font-weight: bold;">Quantity</th>
              <th style="text-align: right; padding: 10px; font-size: 12px; font-weight: bold;">Price</th>
              <th style="text-align: right; padding: 10px; font-size: 12px; font-weight: bold;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${order.items
              ?.map(
                (item) => `
              <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 10px; font-size: 12px;">${item.product?.name?.substring(0, 50) || 'Product'}</td>
                <td style="text-align: center; padding: 10px; font-size: 12px;">${item.quantity}</td>
                <td style="text-align: right; padding: 10px; font-size: 12px;">₹${item.price?.toFixed(2) || '0.00'}</td>
                <td style="text-align: right; padding: 10px; font-size: 12px;">₹${(item.quantity * item.price)?.toFixed(2) || '0.00'}</td>
              </tr>
            `
              )
              .join('')}
          </tbody>
        </table>

        <!-- Summary -->
        <div style="text-align: right; margin-bottom: 20px;">
          ${
            hasDiscount
              ? `
            <div style="margin-bottom: 10px; display: flex; justify-content: flex-end; gap: 20px;">
              <span style="font-size: 12px;">Items Total:</span>
              <span style="font-size: 12px; text-decoration: line-through; color: #999;">₹${originalItemsSubtotal?.toLocaleString('en-IN')}</span>
            </div>
            <div style="margin-bottom: 10px; display: flex; justify-content: flex-end; gap: 20px;">
              <span style="font-size: 12px;">Discount:</span>
              <span style="font-size: 12px; color: #22c55e;">-₹${discountAmount?.toLocaleString('en-IN')}</span>
            </div>
            `
              : ''
          }
          <div style="margin-bottom: 10px; display: flex; justify-content: flex-end; gap: 20px; padding-bottom: 10px; border-bottom: 1px solid #eee;">
            <span style="font-size: 12px; font-weight: bold;">Subtotal:</span>
            <span style="font-size: 12px; font-weight: bold;">₹${paidItemsSubtotal?.toLocaleString('en-IN')}</span>
          </div>
          <div style="margin-bottom: 10px; display: flex; justify-content: flex-end; gap: 20px;">
            <span style="font-size: 12px;">Shipping:</span>
            <span style="font-size: 12px;">${shippingCharge ? `₹${shippingCharge}` : 'Free'}</span>
          </div>
          <div style="margin-bottom: 10px; display: flex; justify-content: flex-end; gap: 20px;">
            <span style="font-size: 12px;">Taxes:</span>
            <span style="font-size: 12px;">—</span>
          </div>
          <div style="display: flex; justify-content: flex-end; gap: 20px; padding-top: 10px; border-top: 2px solid #000;">
            <span style="font-size: 14px; font-weight: bold;">TOTAL:</span>
            <span style="font-size: 14px; font-weight: bold;">₹${paidTotal?.toLocaleString('en-IN')}</span>
          </div>
        </div>

        <!-- Footer -->
        <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666;">
          <p style="margin: 0;">Thank you for your purchase!</p>
          <p style="margin: 5px 0 0 0;">Ghar of Ethnics - Your trusted ethnic wear store</p>
        </div>
      </div>
    `;
  };

  const generateAndDownloadPDF = () => {
    if (!order) return;

    const element = document.createElement('div');
    element.innerHTML = getInvoiceHTML(order, customer);

    const opt = {
      margin: 10,
      filename: `Invoice_${order.invoiceNumber || order.id}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' },
    };

    html2pdf().set(opt).from(element).save();
  };

  const baseClasses = "flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-all active:scale-95";

  if (!responsive) {
    // Non-responsive version (for OrderDetail)
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

  // Responsive version (for OrderSuccess)
  return (
    <>
      {/* Desktop version with text */}
      <button
        onClick={generateAndDownloadPDF}
        className={`${baseClasses} hidden md:flex text-sm`}
      >
        <Download size={16} />
        Download Invoice
      </button>

      {/* Mobile version with icon only */}
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
