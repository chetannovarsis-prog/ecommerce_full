export const normalizeCountry = (country = '') => String(country || '').trim().toLowerCase();

export const isIndia = (country) => {
  const c = normalizeCountry(country);
  return c === 'india' || c === 'in' || c === 'bharat';
};

export const getShippingCharge = (country) => (isIndia(country) ? 0 : 300);

export const getCodCharge = (paymentMethod) => (paymentMethod === 'cod' ? 70 : 0);

export const calcOrderTotals = ({
  subtotal = 0,
  couponDiscount = 0,
  country = 'India',
  paymentMethod = 'razorpay',
}) => {
  const roundedSubtotal = Math.round(Number(subtotal) || 0);
  const roundedDiscount = Math.round(Number(couponDiscount) || 0);
  const discountedSubtotal = Math.max(0, roundedSubtotal - roundedDiscount);

  const shippingCharge = getShippingCharge(country);
  const codCharge = getCodCharge(paymentMethod);
  const finalTotal = Math.max(0, discountedSubtotal + shippingCharge + codCharge);

  return { discountedSubtotal, shippingCharge, codCharge, finalTotal };
};

