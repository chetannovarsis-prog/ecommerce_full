import prisma from '../utils/prisma.js';

const normalizeCode = (value = '') => value.trim().toUpperCase();

export const getCoupons = async (_req, res) => {
  try {
    const coupons = await prisma.coupon.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(coupons);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createCoupon = async (req, res) => {
  try {
    const code = normalizeCode(req.body.code);
    const percentage = parseFloat(req.body.percentage);

    if (!code) {
      return res.status(400).json({ error: 'Coupon code is required.' });
    }

    if (Number.isNaN(percentage) || percentage <= 0 || percentage > 100) {
      return res.status(400).json({ error: 'Coupon percentage must be between 1 and 100.' });
    }

    const coupon = await prisma.coupon.create({
      data: {
        code,
        percentage,
        isActive: req.body.isActive !== false
      }
    });

    res.status(201).json(coupon);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'This coupon code already exists.' });
    }
    res.status(500).json({ error: error.message });
  }
};

export const updateCoupon = async (req, res) => {
  try {
    const data = {};

    if (req.body.code !== undefined) {
      const normalized = normalizeCode(req.body.code);
      if (!normalized) {
        return res.status(400).json({ error: 'Coupon code is required.' });
      }
      data.code = normalized;
    }

    if (req.body.percentage !== undefined) {
      const percentage = parseFloat(req.body.percentage);
      if (Number.isNaN(percentage) || percentage <= 0 || percentage > 100) {
        return res.status(400).json({ error: 'Coupon percentage must be between 1 and 100.' });
      }
      data.percentage = percentage;
    }

    if (req.body.isActive !== undefined) {
      data.isActive = Boolean(req.body.isActive);
    }

    const coupon = await prisma.coupon.update({
      where: { id: req.params.id },
      data
    });

    res.json(coupon);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'This coupon code already exists.' });
    }
    res.status(500).json({ error: error.message });
  }
};

export const deleteCoupon = async (req, res) => {
  try {
    await prisma.coupon.delete({
      where: { id: req.params.id }
    });
    res.json({ message: 'Coupon deleted successfully.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const validateCoupon = async (req, res) => {
  try {
    const code = normalizeCode(req.body.code);

    if (!code) {
      return res.status(400).json({ error: 'Coupon code is required.' });
    }

    const coupon = await prisma.coupon.findFirst({
      where: {
        code,
        isActive: true
      }
    });

    if (!coupon) {
      return res.status(404).json({ error: 'Invalid or inactive coupon code.' });
    }

    res.json({
      id: coupon.id,
      code: coupon.code,
      percentage: coupon.percentage
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
