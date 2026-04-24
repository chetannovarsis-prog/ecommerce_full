import PDFDocument from 'pdfkit';
import prisma from './prisma.js';

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
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
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

      // --- HEADER ---
      doc.fontSize(28).font('Helvetica-Bold').text('INVOICE', 50, 60);
      doc.fontSize(10).font('Helvetica').text('Ghar of Ethnics', 50, 95);
      
      doc.moveTo(50, 115).lineTo(550, 115).lineWidth(1).strokeColor('#000000').stroke();

      // --- INVOICE INFO ROW ---
      const infoY = 140;
      doc.fontSize(9).font('Helvetica-Bold').text('Invoice #', 50, infoY);
      doc.fontSize(10).font('Helvetica').text(order.id, 50, infoY + 15, { width: 250 });

      doc.fontSize(9).font('Helvetica-Bold').text('Date', 380, infoY);
      doc.fontSize(10).font('Helvetica').text(new Date(order.createdAt).toLocaleDateString('en-IN'), 380, infoY + 15);

      doc.fontSize(9).font('Helvetica-Bold').text('Status', 500, infoY);
      doc.fontSize(10).font('Helvetica').text(order.status || 'PAID', 500, infoY + 15);

      // --- BILL TO SECTION ---
      const billToY = 200;
      doc.fontSize(9).font('Helvetica-Bold').text('BILL TO:', 50, billToY);
      
      doc.fontSize(11).font('Helvetica-Bold').text(order.shippingAddress?.fullName || order.customer?.name || 'Customer', 50, billToY + 20);
      doc.fontSize(10).font('Helvetica').text(order.customer?.email || '', 50, billToY + 35);
      
      if (order.shippingAddress) {
        let currentY = billToY + 50;
        doc.text(`${order.shippingAddress.addressLine1 || order.shippingAddress.address || ''}`, 50, currentY);
        currentY += 15;
        if (order.shippingAddress.addressLine2 || order.shippingAddress.apartment) {
          doc.text(`${order.shippingAddress.addressLine2 || order.shippingAddress.apartment}`, 50, currentY);
          currentY += 15;
        }
        doc.text(`${order.shippingAddress.city || ''}, ${order.shippingAddress.state || ''} ${order.shippingAddress.pincode || order.shippingAddress.pinCode || ''}`, 50, currentY);
        currentY += 15;
        doc.text(`Phone: ${order.shippingAddress.phone || 'N/A'}`, 50, currentY);
      }

      // --- TABLE HEADERS ---
      const tableTop = 330;
      const col1 = 50;   // Product
      const col2 = 350;  // Quantity
      const col3 = 430;  // Price
      const col4 = 510;  // Amount

      doc.fontSize(9).font('Helvetica-Bold').fillColor('#000000');
      doc.text('Product', col1, tableTop);
      doc.text('Quantity', col2, tableTop);
      doc.text('Price', col3, tableTop);
      doc.text('Amount', col4, tableTop);

      doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).lineWidth(1).strokeColor('#000000').stroke();

      // --- TABLE CONTENT ---
      doc.fontSize(10).font('Helvetica').fillColor('#333333');
      let yPosition = tableTop + 30;
      let subtotal = 0;

      order.items.forEach((item) => {
        const itemPrice = item.price;
        const itemTotal = item.quantity * itemPrice;
        subtotal += itemTotal;

        // Product name and variant
        doc.fontSize(10).font('Helvetica').text(item.product.name, col1, yPosition, { width: 280 });
        if (item.variantTitle) {
          doc.fontSize(8).text(`(${item.variantTitle})`, col1, yPosition + 12, { width: 280 });
        }

        doc.fontSize(10).text(String(item.quantity), col2, yPosition);
        doc.text(`₹${itemPrice.toLocaleString('en-IN')}`, col3, yPosition);
        doc.text(`₹${itemTotal.toLocaleString('en-IN')}`, col4, yPosition);

        yPosition += 35; // Increased spacing for items
      });

      // --- SUMMARY ---
      doc.moveTo(50, yPosition).lineTo(550, yPosition).lineWidth(0.5).strokeColor('#EEEEEE').stroke();
      
      const summaryY = yPosition + 20;
      doc.fontSize(10).font('Helvetica').fillColor('#000000');
      
      doc.text('Subtotal:', 400, summaryY, { width: 80, align: 'right' });
      doc.text(`₹${subtotal.toLocaleString('en-IN')}`, col4, summaryY, { width: 80, align: 'left' });

      doc.text('Shipping:', 400, summaryY + 20, { width: 80, align: 'right' });
      doc.text('Free', col4, summaryY + 20, { width: 80, align: 'left' });

      doc.text('Taxes:', 400, summaryY + 40, { width: 80, align: 'right' });
      doc.text('—', col4, summaryY + 40, { width: 80, align: 'left' });

      doc.moveTo(350, summaryY + 65).lineTo(550, summaryY + 65).lineWidth(1).strokeColor('#000000').stroke();

      doc.fontSize(12).font('Helvetica-Bold');
      doc.text('TOTAL:', 400, summaryY + 80, { width: 80, align: 'right' });
      doc.text(`₹${order.totalAmount.toLocaleString('en-IN')}`, col4, summaryY + 80, { width: 80, align: 'left' });

      // --- FOOTER ---
      doc.fontSize(8).font('Helvetica').fillColor('#999999');
      doc.text('Thank you for your purchase!', 50, 780, { align: 'center', width: 500 });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

