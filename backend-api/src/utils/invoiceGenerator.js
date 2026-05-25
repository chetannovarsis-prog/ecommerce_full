import PDFDocument from 'pdfkit';
import prisma from './prisma.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { getShippingCharge, getCodCharge } from './orderPricing.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const generateInvoice = async (orderOrId) => {
  let order;
  if (typeof orderOrId === 'string') {
    // Fetch order details from database if ID is provided
    order = await prisma.order.findUnique({
      where: { id: orderOrId },
      include: {
        customer: {
          select: { name: true, email: true }
        },
        items: {
          include: {
            product: {
              select: { id: true, name: true, price: true }
            }
          }
        }
      }
    });
  } else {
    order = orderOrId;
  }

  if (!order) {
    throw new Error('Order not found');
  }

  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ 
        margin: 0, // We'll manage margins manually
        size: 'A4' 
      });
      let buffers = [];

      doc.on('data', (data) => {
        buffers.push(data);
      });

      doc.on('end', () => {
        resolve(Buffer.concat(buffers));
      });

      doc.on('error', (err) => {
        reject(err);
      });

      // --- CONFIGURATION ---
      const colors = {
        background: '#f5f2e9',
        headerText: '#e08d4a', // Copper
        divider: '#9a9cd8',    // Light Purple/Blue
        text: '#4a4a4a',
        darkText: '#2c2c2c',
        white: '#ffffff',
        cancelled: '#dc2626'
      };

      const pageWidth = 595.28; // A4 width in points
      const pageHeight = 841.89; // A4 height in points
      const margin = 50;

      // --- BACKGROUND & WATERMARK ---
      // Fill background
      doc.rect(0, 0, pageWidth, pageHeight).fill(colors.background);

      // --- HEADER ---
      // Logo (Top Left)
      try {
        const logoPath = path.join(__dirname, '../assets/images/logo.png');
        doc.image(logoPath, margin, 40, { width: 95 });
      } catch (err) {
        // Fallback text logo
        doc
          .fontSize(20)
          .font('Helvetica-Bold')
          .fillColor(colors.headerText)
          .text('Ghar of Ethnics', margin, 40);
      }

      // "INVOICE" Title (Top Right)
      doc
        .fontSize(46)
        .font('Helvetica-Bold')
        .fillColor(colors.headerText)
        .text('INVOICE', margin, 72, { align: 'right', width: pageWidth - 2 * margin });

      // Divider below title
      doc
        .moveTo(pageWidth - 210, 132)
        .lineTo(pageWidth - margin, 132)
        .lineWidth(1)
        .strokeColor(colors.divider)
        .stroke();

      // --- INVOICE INFO ---
      const infoY = 175;
      doc
        .fontSize(12)
        .font('Helvetica-Bold')
        .fillColor(colors.headerText)
        .text('INVOICE TO :', margin, infoY);

      const customerName = order.shippingAddress?.fullName || order.customer?.name || 'Customer';
      const customerAddressLines = [
        order.shippingAddress?.address || '',
        order.shippingAddress?.apartment || '',
        `${order.shippingAddress?.city || ''}, ${order.shippingAddress?.state || ''} ${order.shippingAddress?.pinCode || ''}`.trim()
      ].filter(Boolean);

      const customerAddress = customerAddressLines.join('\n');

      doc
        .fontSize(11)
        .font('Helvetica')
        .fillColor(colors.text)
        .text(customerName, margin, infoY + 25);

      let addressEndY = infoY + 41;
      if (customerAddress) {
        doc
          .fontSize(10.5)
          .font('Helvetica')
          .fillColor(colors.text)
          .text(customerAddress, margin, infoY + 58, { width: 250, lineGap: 2 });
        addressEndY = doc.y + 2;
      }

      // Invoice Number & Date (Right Side)
      const rightX = pageWidth - margin - 150;
      doc
        .fontSize(11)
        .font('Helvetica-Bold')
        .fillColor(colors.darkText)
        .text(`Invoice No.${order.invoiceNumber || order.id.slice(-6).toUpperCase()}`, rightX, infoY + 50, { align: 'right', width: 150 });

      const orderDate = new Date(order.createdAt);
      const dateStr = orderDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
      doc.text(dateStr, rightX, infoY + 65, { align: 'right', width: 150 });

      // --- TABLE SECTION ---
      const tableTop = Math.max(300, Math.ceil(addressEndY) + 25);
      const gap = 8;
      const colWidths = {
        no: 36,
        desc: 206,
        price: 70,
        qty: 36,
        total: 72
      };

      const descWidth = colWidths.desc - 10;
      doc.fontSize(10).font('Helvetica-Bold');
      const rowHeights = (order.items || []).map((item) => {
        const description = `${item.product?.name || 'Product'}${item.variantTitle ? ` (${item.variantTitle})` : ''}`;
        const descHeight = doc.heightOfString(description, { width: descWidth, lineGap: 1 });
        return Math.max(22, Math.ceil(descHeight) + 6);
      });
      const rowsHeight = rowHeights.reduce((sum, h) => sum + h, 0);
      const extraRowsHeight = Math.max(0, rowsHeight - 22);
      const tableHeight = 285 + extraRowsHeight;

      // Table Container
      doc
        .rect(margin, tableTop, pageWidth - 2 * margin, tableHeight)
        .fill(colors.white);

      // Draw mandala inside the white table area so it stays visible like the reference.
      try {
        const tableMandalaPath = path.join(__dirname, '../assets/images/mandala_motif.png');
        const motifSize = Math.min(340, Math.max(220, tableHeight - 70));
        const motifX = margin + (pageWidth - 2 * margin - motifSize) / 2;
        const motifY = tableTop + (tableHeight - motifSize) / 2;
        doc.save();
        doc.opacity(0.1).image(tableMandalaPath, motifX, motifY, { width: motifSize });
        doc.restore();
      } catch {
        try {
          const tableMandalaFallbackPath = path.join(__dirname, '../assets/images/mandala_motif1.png');
          const motifSize = Math.min(340, Math.max(220, tableHeight - 70));
          const motifX = margin + (pageWidth - 2 * margin - motifSize) / 2;
          const motifY = tableTop + (tableHeight - motifSize) / 2;
          doc.save();
          doc.opacity(0.1).image(tableMandalaFallbackPath, motifX, motifY, { width: motifSize });
          doc.restore();
        } catch {
          // keep invoice generation resilient if motif assets are missing
        }
      }

      // Re-draw background on top of white box if needed? No, let's keep it white for readability as per reference.
      
      // Table Header
      const headerY = tableTop + 15;
      doc
        .fontSize(10)
        .font('Helvetica-Bold')
        .fillColor(colors.headerText);

      let currentX = margin + 15;
      doc.text('NO.', currentX, headerY);
      currentX += colWidths.no;
      doc.text('PRODUCT DESCRIPTION', currentX, headerY);
      currentX += colWidths.desc;
      doc.text('PRICE', currentX, headerY, { align: 'right', width: colWidths.price });
      currentX += colWidths.price + gap;
      doc.text('QTY', currentX, headerY, { align: 'center', width: colWidths.qty });
      currentX += colWidths.qty + gap;
      doc.text('TOTAL', currentX, headerY, { align: 'right', width: colWidths.total });

      // Header Divider
      doc
        .moveTo(margin + 15, headerY + 15)
        .lineTo(pageWidth - margin - 15, headerY + 15)
        .lineWidth(1)
        .strokeColor(colors.divider)
        .stroke();

      // Table Rows
      let rowY = headerY + 30;
      doc
        .fontSize(10)
        .font('Helvetica-Bold')
        .fillColor(colors.darkText);

      order.items.forEach((item, index) => {
        const currentRowHeight = rowHeights[index] || 24;
        currentX = margin + 15;
        doc.text(String(index + 1), currentX, rowY, { align: 'center', width: colWidths.no - 20 });
        currentX += colWidths.no;
        const productName = item.productName || item.product?.name || 'Product';
        const description = `${productName}`;
        doc.text(description, currentX, rowY, { width: descWidth, lineGap: 1 });
        currentX += colWidths.desc;
        doc.text(`Rs.${Number(item.price).toFixed(2)}`, currentX, rowY, { align: 'right', width: colWidths.price });
        currentX += colWidths.price + gap;
        doc.text(String(item.quantity), currentX, rowY, { align: 'center', width: colWidths.qty });
        currentX += colWidths.qty + gap;
        doc.text(`Rs.${(Number(item.price) * Number(item.quantity)).toFixed(2)}`, currentX, rowY, { align: 'right', width: colWidths.total });

        rowY += currentRowHeight;
      });

      const dividerY = Math.min(tableTop + tableHeight - 70, rowY + 8);

      // Bottom Table Divider
      doc
        .moveTo(margin + 15, dividerY)
        .lineTo(pageWidth - margin - 15, dividerY)
        .lineWidth(1)
        .strokeColor(colors.divider)
        .stroke();

      // --- TOTALS ---
      const totalY = dividerY + 18;
      doc
        .fontSize(10)
        .font('Helvetica-Bold')
        .fillColor(colors.headerText);

      // Payment Status (Left)
      doc.text('Payment Status :', margin + 15, totalY);
      doc
        .fontSize(11)
        .fillColor(order.status === 'CANCELLED' ? colors.cancelled : colors.darkText)
        .text(
          order.status === 'CANCELLED'
            ? 'CANCELLED'
            : order.status === 'PAID' || order.status === 'COD_CONFIRMED'
              ? 'PAID'
              : 'PENDING',
          margin + 15,
          totalY + 15
        );

      // Amounts (Right)
      const subtotal = order.items.reduce((acc, item) => acc + (item.price * item.quantity), 0);

      const pricing = order.shippingAddress?.pricing || {};
      const parsedShippingCharge = Number(pricing.shippingCharge);
      const parsedCodCharge = Number(pricing.codCharge);

      const pin = String(order.shippingAddress?.pinCode || '').trim();
      const isIndianPin = /^[1-9][0-9]{5}$/.test(pin);
      const countryGuess = order.shippingAddress?.country || (isIndianPin ? 'India' : 'International');

      const shippingCharge = Number.isFinite(parsedShippingCharge)
        ? parsedShippingCharge
        : getShippingCharge(countryGuess);

      const codCharge = Number.isFinite(parsedCodCharge)
        ? parsedCodCharge
        : getCodCharge(order.paymentMethod);

      const shipping = Math.max(0, Math.round(shippingCharge + codCharge));

      const rightMargin = 30; // Add space from right edge
      const labelX = pageWidth - margin - 180 - rightMargin;
      const valueX = pageWidth - margin - 80 - rightMargin;

      doc.fontSize(10).fillColor(colors.headerText);
      doc.text('Subtotal', labelX, totalY, { width: 100, align: 'right' });
      doc.text('Shipping', labelX, totalY + 20, { width: 100, align: 'right' });
      doc.text('Total', labelX, totalY + 40, { width: 100, align: 'right' });

      doc.fillColor(colors.darkText);
      doc.text(`Rs.${subtotal.toFixed(2)}`, valueX, totalY, { width: 80, align: 'right' });
      doc.text(shipping ? `Rs.${shipping.toFixed(2)}` : 'Free', valueX, totalY + 20, { width: 80, align: 'right' });
      doc.text(`Rs.${order.totalAmount.toFixed(2)}`, valueX, totalY + 40, { width: 80, align: 'right' });

      // --- FOOTER ---
      // Thank You Graphic (Bottom Left)
      const thankYouY = Math.max(700, totalY + 105);
      let usedThankYouImage = false;
      try {
        const thankYouPath = path.join(__dirname, '../assets/images/thankyou.png');
        doc.image(thankYouPath, margin, thankYouY + 2, { width: 150 });
        usedThankYouImage = true;
      } catch {
        usedThankYouImage = false;
      }

      if (!usedThankYouImage) {
        doc
          .fontSize(36)
          .font('Helvetica-Bold')
          .fillColor('#1a2d5a') // Blue part
          .text('Thank', margin, thankYouY);
        doc
          .fontSize(40)
          .fillColor(colors.headerText)
          .text('You', margin + 102, thankYouY);
      }

      // Footer Details (Bottom Right)
      const footerX = pageWidth - margin - 250;
      doc
        .fontSize(11)
        .font('Helvetica-Bold')
        .fillColor(colors.headerText)
        .text('Ghar of Ethnics', footerX, thankYouY + 10, { align: 'right', width: 250 });

      // Phone number - Clickable
      const phoneY = thankYouY + 25;
      const phoneText = '+ 91 9845634734';
      const phoneWidth = doc.widthOfString(phoneText);
      doc.text(phoneText, footerX, phoneY, { align: 'right', width: 250 });
      doc.link(footerX + 250 - phoneWidth - 5, phoneY, phoneWidth + 10, 15, { uri: 'tel:+919845634734' });

      // Website - Clickable
      doc.fontSize(9).font('Helvetica').fillColor(colors.darkText);
      const websiteY = thankYouY + 45;
      const websiteText = 'www.gharofethnics.com';
      const websiteWidth = doc.widthOfString(websiteText);
      doc.text(websiteText, footerX, websiteY, { align: 'right', width: 250 });
      doc.link(footerX + 250 - websiteWidth - 5, websiteY, websiteWidth + 10, 13, { uri: 'https://www.gharofethnics.com' });

      // Email - Clickable
      const emailY = thankYouY + 55;
      const emailText = 'support@gharofethnics.com';
      const emailWidth = doc.widthOfString(emailText);
      doc.text(emailText, footerX, emailY, { align: 'right', width: 250 });
      doc.link(footerX + 250 - emailWidth - 5, emailY, emailWidth + 10, 13, { uri: 'mailto:support@gharofethnics.com' });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};
