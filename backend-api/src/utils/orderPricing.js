export const normalizeCountry = (country = '') => String(country || '').trim().toLowerCase();

export const isIndia = (country) => {
  const c = normalizeCountry(country);
  return c === 'india' || c === 'in' || c === 'bharat';
};

export const getShippingCharge = (country) => (isIndia(country) ? 0 : 300);

export const getCodCharge = (paymentMethod) => (paymentMethod === 'cod' ? 70 : 0);

export const calculateItemsSubtotal = (items = []) => {
  if (!Array.isArray(items)) return 0;
  return Math.round(
    items.reduce((sum, item) => {
      const qty = Math.max(0, Number(item?.quantity) || 0);
      const price = Number(item?.price) || 0;
      return sum + price * qty;
    }, 0)
  );
};

export const calculateCouponDiscount = (subtotal = 0, coupon = null) => {
  const base = Math.round(Number(subtotal) || 0);
  if (!coupon || !coupon.isActive) return 0;

  const rawValue = Number(coupon.value ?? coupon.percentage) || 0;
  const type = String(coupon.type || 'PERCENTAGE').toUpperCase();

  if (type === 'FLAT') return Math.max(0, Math.round(rawValue));
  const pct = Math.max(0, Math.min(100, rawValue));
  return Math.max(0, Math.round((base * pct) / 100));
};

export const calculateOrderTotals = ({
  items = [],
  coupon = null,
  country = 'India',
  paymentMethod = 'razorpay',
}) => {
  const subtotal = calculateItemsSubtotal(items);
  const couponDiscount = calculateCouponDiscount(subtotal, coupon);
  const discountedSubtotal = Math.max(0, subtotal - couponDiscount);

  const shippingCharge = getShippingCharge(country);
  const codCharge = getCodCharge(paymentMethod);
  const finalTotal = Math.max(0, discountedSubtotal + shippingCharge + codCharge);

  return { subtotal, couponDiscount, discountedSubtotal, shippingCharge, codCharge, finalTotal };
};

