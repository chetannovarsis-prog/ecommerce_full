import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function backfillSales() {
  console.log('Starting backfill of website sales...');
  
  try {
    const websiteSales = await prisma.sale.findMany({
      where: { source: 'Website', customerName: null }
    });

    console.log(`Found ${websiteSales.length} website sales to backfill.`);

    for (const sale of websiteSales) {
      // Find matching order
      // We look for an order created around the same time (+/- 1 hour to be safe)
      const startDate = new Date(sale.createdAt.getTime() - 60 * 60 * 1000);
      const endDate = new Date(sale.createdAt.getTime() + 60 * 60 * 1000);

      const matchingOrder = await prisma.order.findFirst({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate
          },
          items: {
            some: {
              productId: sale.productId,
              quantity: sale.quantity,
              price: sale.price
            }
          }
        },
        include: {
          items: true
        }
      });

      if (matchingOrder) {
        console.log(`Matching sale ${sale.id} with order ${matchingOrder.id}`);
        
        const addr = matchingOrder.shippingAddress || {};
        const customerName = `${addr.firstName || ''} ${addr.lastName || ''}`.trim() || null;
        
        await prisma.sale.update({
          where: { id: sale.id },
          data: {
            orderId: matchingOrder.id,
            customerName: customerName,
            customerEmail: addr.email || null,
            customerPhone: addr.phone || null,
            paymentMode: matchingOrder.paymentMethod || 'Website',
            paymentId: matchingOrder.razorpayPaymentId || null
          }
        });
      } else {
        console.log(`No match found for sale ${sale.id} (Product: ${sale.productId}, Date: ${sale.createdAt})`);
      }
    }

    console.log('Backfill completed.');
  } catch (error) {
    console.error('Error during backfill:', error);
  } finally {
    await prisma.$disconnect();
  }
}

backfillSales();
