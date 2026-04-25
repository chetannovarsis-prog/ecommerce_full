import PDFDocument from 'pdfkit';
import prisma from './prisma.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const generateInvoice = async (orderId) => {
  // Fetch order details from database
  const order = await prisma.order.findUnique({
    where: { id: orderId },
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
        white: '#ffffff'
      };

      const pageWidth = 595.28; // A4 width in points
      const pageHeight = 841.89; // A4 height in points
      const margin = 50;

      // --- BACKGROUND & WATERMARK ---
      // Fill background
      doc.rect(0, 0, pageWidth, pageHeight).fill(colors.background);

      // Add Watermark (Mandala)
      try {
        const mandalaPath = path.join(__dirname, '../assets/images/mandala_motif.png');
        doc.image(mandalaPath, pageWidth / 2 - 150, pageHeight / 2 - 150, {
          width: 300,
          opacity: 0.08
        });
      } catch (err) {
        console.warn('Mandala motif not found, skipping watermark');
      }

      // --- HEADER ---
      // Logo (Top Left)
      try {
        const logoPath = path.join(__dirname, '../assets/images/logo.png');
        doc.image(logoPath, margin, 40, { width: 100 });
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
        .fontSize(48)
        .font('Helvetica-Bold')
        .fillColor(colors.headerText)
        .text('INVOICE', margin, 70, { align: 'right', width: pageWidth - 2 * margin });

      // Divider below title
      doc
        .moveTo(350, 130)
        .lineTo(pageWidth - margin, 130)
        .lineWidth(1)
        .strokeColor(colors.divider)
        .stroke();

      // --- INVOICE INFO ---
      const infoY = 180;
      doc
        .fontSize(12)
        .font('Helvetica-Bold')
        .fillColor(colors.headerText)
        .text('INVOICE TO :', margin, infoY);

      const customerName = order.shippingAddress?.fullName || order.customer?.name || 'Customer';
      doc
        .fontSize(11)
        .font('Helvetica')
        .fillColor(colors.text)
        .text(customerName, margin, infoY + 25)
        .text(customerName, margin, infoY + 40); // Double name as per reference image

      if (order.shippingAddress?.address) {
        doc.text(order.shippingAddress.address, margin, infoY + 55, { width: 250 });
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
      const tableTop = 320;
      const colWidths = {
        no: 40,
        desc: 260,
        price: 60,
        qty: 40,
        total: 80
      };

      // Table Container
      doc
        .rect(margin, tableTop, pageWidth - 2 * margin, 350)
        .fill(colors.white);

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
      currentX += colWidths.price + 10;
      doc.text('QTY', currentX, headerY, { align: 'center', width: colWidths.qty });
      currentX += colWidths.qty + 10;
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
        currentX = margin + 15;
        doc.text(String(index + 1), currentX, rowY, { align: 'center', width: colWidths.no - 20 });
        currentX += colWidths.no;
        doc.text(item.product?.name || 'Product', currentX, rowY, { width: colWidths.desc - 10 });
        currentX += colWidths.desc;
        doc.text(`Rs.${Number(item.price).toFixed(2)}`, currentX, rowY, { align: 'right', width: colWidths.price });
        currentX += colWidths.price + 10;
        doc.text(String(item.quantity), currentX, rowY, { align: 'center', width: colWidths.qty });
        currentX += colWidths.qty + 10;
        doc.text(`Rs.${(Number(item.price) * Number(item.quantity)).toFixed(2)}`, currentX, rowY, { align: 'right', width: colWidths.total });

        rowY += 25;
      });

      // Bottom Table Divider
      doc
        .moveTo(margin + 15, 600)
        .lineTo(pageWidth - margin - 15, 600)
        .lineWidth(1)
        .strokeColor(colors.divider)
        .stroke();

      // --- TOTALS ---
      const totalY = 640;
      doc
        .fontSize(10)
        .font('Helvetica-Bold')
        .fillColor(colors.headerText);

      // Payment Status (Left)
      doc.text('Payment Status :', margin + 15, totalY);
      doc
        .fontSize(11)
        .fillColor(colors.darkText)
        .text(order.status === 'PAID' || order.status === 'COD_CONFIRMED' ? 'PAID' : 'PENDING', margin + 15, totalY + 15);

      // Amounts (Right)
      const subtotal = order.items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
      const shipping = order.paymentMethod === 'cod' ? 70 : 0;

      const labelX = pageWidth - margin - 180;
      const valueX = pageWidth - margin - 80;

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
      const thankYouY = 750;
      doc
        .fontSize(40)
        .font('Helvetica-Bold') // Ideally a script font if available
        .fillColor('#1a2d5a') // Blue part
        .text('Thank', margin, thankYouY);
      doc
        .fontSize(50)
        .fillColor(colors.headerText)
        .text('You', margin + 80, thankYouY - 10);

      // Footer Details (Bottom Right)
      const footerX = pageWidth - margin - 250;
      doc
        .fontSize(11)
        .font('Helvetica-Bold')
        .fillColor(colors.headerText)
        .text('Ghar of Ethnics', footerX, thankYouY + 10, { align: 'right', width: 250 })
        .text('+ 91 9845634734', footerX, thankYouY + 25, { align: 'right', width: 250 });

      doc
        .fontSize(9)
        .font('Helvetica')
        .fillColor(colors.darkText)
        .text('www.gharofethnics.com', footerX, thankYouY + 45, { align: 'right', width: 250 })
        .text('support@gharofethnics.com', footerX, thankYouY + 55, { align: 'right', width: 250 });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};
