import prisma from '../utils/prisma.js';
import { appendProductImageVersions } from '../utils/imageUrl.js';

export const getSales = async (req, res) => {
  try {
    const sales = await prisma.sale.findMany({
      include: {
        product: {
          select: { name: true, thumbnailUrl: true, images: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const formattedSales = sales.map(s => ({
      id: s.id,
      productName: s.product.name,
      thumbnail: appendProductImageVersions(s.product).thumbnailUrl || appendProductImageVersions(s.product).images?.[0],
      quantity: s.quantity,
      price: s.price,
      source: s.source,
      date: s.createdAt,
      customerName: s.customerName,
      customerEmail: s.customerEmail,
      customerPhone: s.customerPhone,
      paymentMode: s.paymentMode,
      paymentId: s.paymentId,
      notes: s.notes
    }));

    res.json(formattedSales);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const registerStoreSale = async (req, res) => {
  const { productId, quantity, price, customerName, customerEmail, customerPhone, paymentMode, paymentId, notes, source } = req.body;

  try {
    // 1. Create Sale record
    const sale = await prisma.sale.create({
      data: {
        productId,
        quantity: parseInt(quantity),
        price: parseFloat(price),
        source: source || 'Store',
        customerName,
        customerEmail,
        customerPhone,
        paymentMode,
        paymentId,
        notes
      }
    });

    // 2. Update Product Stock
    await prisma.product.update({
      where: { id: productId },
      data: {
        stock: { decrement: parseInt(quantity) }
      }
    });

    res.json(sale);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
