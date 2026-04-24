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
      const doc = new PDFDocument({ margin: 50 });
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

      // Header
      doc.fontSize(24).font('Helvetica-Bold').text('INVOICE', 50, 50);
      
      // Invoice details
      doc.fontSize(10).font('Helvetica');
      doc.text(`Invoice #: ${order.id}`, 400, 50);
      doc.text(`Date: ${new Date(order.createdAt).toLocaleDateString('en-IN')}`, 400, 65);
      doc.text(`Status: ${order.status}`, 400, 80);

      // Customer details
      doc.fontSize(12).font('Helvetica-Bold').text('Bill To:', 50, 130);
      doc.fontSize(10).font('Helvetica');
      doc.text(order.customer?.name || 'N/A', 50, 150);
      doc.text(order.customer?.email || 'N/A', 50, 165);
      
      if (order.shippingAddress) {
        doc.text(`${order.shippingAddress.address || ''} ${order.shippingAddress.apartment || ''}`, 50, 180);
        doc.text(`${order.shippingAddress.city || ''}, ${order.shippingAddress.state || ''} ${order.shippingAddress.pinCode || ''}`, 50, 195);
        doc.text(`Phone: ${order.shippingAddress.phone || 'N/A'}`, 50, 210);
      }

      // Table headers
      const tableTop = 250;
      const col1 = 50;
      const col2 = 280;
      const col3 = 380;
      const col4 = 480;

      doc.fontSize(11).font('Helvetica-Bold');
      doc.text('Product', col1, tableTop);
      doc.text('Quantity', col2, tableTop);
      doc.text('Price', col3, tableTop);
      doc.text('Amount', col4, tableTop);

      // Draw line
      doc.moveTo(col1, tableTop + 15).lineTo(550, tableTop + 15).stroke();

      // Table content
      doc.fontSize(10).font('Helvetica');
      let yPosition = tableTop + 30;
      let subtotal = 0;

      order.items.forEach((item) => {
        const amount = item.quantity * item.price;
        subtotal += amount;

        doc.text(item.product.name.substring(0, 30), col1, yPosition, { width: 200 });
        doc.text(String(item.quantity), col2, yPosition);
        doc.text(`₹${item.price.toFixed(2)}`, col3, yPosition);
        doc.text(`₹${amount.toFixed(2)}`, col4, yPosition);

        yPosition += 25;
      });

      // Summary
      const summaryY = yPosition + 20;
      doc.moveTo(col1, summaryY - 10).lineTo(550, summaryY - 10).stroke();

      doc.fontSize(10).font('Helvetica');
      doc.text('Subtotal:', col3, summaryY);
      doc.text(`₹${subtotal.toFixed(2)}`, col4, summaryY);

      doc.text('Shipping:', col3, summaryY + 20);
      doc.text('Free', col4, summaryY + 20);

      doc.fontSize(12).font('Helvetica-Bold');
      doc.text('Total:', col3, summaryY + 50);
      doc.text(`₹${order.totalAmount.toFixed(2)}`, col4, summaryY + 50);

      // Footer
      doc.fontSize(9).font('Helvetica');
      doc.text('Thank you for your purchase!', 50, 700);
      doc.text('Ghar of Ethnics - Your trusted ethnic wear store', 50, 715);

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};
