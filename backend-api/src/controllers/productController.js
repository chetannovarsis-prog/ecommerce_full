import prisma from '../utils/prisma.js';
import { appendProductImageVersions } from '../utils/imageUrl.js';

// Returns the effective stock for a product:
// - If product has variants → sum of all variant stocks
// - Otherwise → product.stock (global)
const computeStock = (product) => {
  if (product.variants && product.variants.length > 0) {
    return product.variants.reduce((sum, v) => sum + (v.stock || 0), 0);
  }
  return product.stock || 0;
};

// Attach computed totalStock to product
const withTotalStock = (product) => ({
  ...product,
  totalStock: computeStock(product),
});

const isUuid = (value) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
const slugify = (value = '') => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

const parseOptionalFloat = (value) => {
  if (value === undefined || value === null || value === '') return null;
  const parsed = parseFloat(value);
  return Number.isNaN(parsed) ? null : parsed;
};

const parsePatchNumber = (value) => {
  if (value === undefined || value === null || value === '') return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const buildProductSaveError = (error, action = 'save') => {
  const response = {
    message: `Failed to ${action} product.`,
    detail: error?.message || 'Unknown error'
  };

  if (error?.code === 'P2002') {
    const target = Array.isArray(error?.meta?.target) ? error.meta.target.join(', ') : 'unique field';
    response.message = `Failed to ${action} product: duplicate value.`;
    response.detail = `A record with the same ${target} already exists.`;
  }

  if (error?.code === 'P2025') {
    response.message = `Failed to ${action} product: record not found.`;
    response.detail = 'The product no longer exists or was removed by another user.';
  }

  return response;
};

export const getAllProducts = async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(5, parseInt(req.query.limit, 10) || 20));
  const skip = (page - 1) * limit;
  const { collectionId, categoryId, search } = req.query;

  try {
    const where = {};
    if (collectionId) {
      if (isUuid(collectionId)) {
        where.collections = { some: { id: collectionId } };
      } else {
        const collections = await prisma.collection.findMany({
          select: { id: true, name: true }
        });
        const matchedCollection = collections.find((item) => slugify(item.name) === slugify(collectionId));
        where.collections = { some: matchedCollection ? { id: matchedCollection.id } : { id: '__no_collection_match__' } };
      }
    }
    if (categoryId) {
      where.categories = { some: { id: categoryId } };
    }
    if (search?.trim()) {
      const query = search.trim();
      where.OR = [
        { name: { contains: query, mode: 'insensitive' } },
        { subtitle: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
        { handle: { contains: query.toLowerCase(), mode: 'insensitive' } }
      ];
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          categories: true,
          collections: true,
          variants: true
        }
      }),
      prisma.product.count({ where })
    ]);

    res.json({
      data: products.map(p => withTotalStock(appendProductImageVersions(p))),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    // Check if it's a UUID or a handle
    const productIsUuid = isUuid(id);
    
    const product = await prisma.product.findUnique({
      where: productIsUuid ? { id } : { handle: id },
      include: {
        categories: true,
        collections: true,
        variants: true,
        reviews: true
      }
    });
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(withTotalStock(appendProductImageVersions(product)));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createProduct = async (req, res) => {
  try {
    const {
      name, subtitle, handle, description, price, images,
      categoryId, categoryIds, collectionId, collectionIds, stock, isDiscountable,
      discountPrice, thumbnailUrl, hoverThumbnailUrl, variants,
      weight, length, breadth, height
    } = req.body;

    // Ensure unique name
    if (name) {
      const existingProduct = await prisma.product.findFirst({
        where: { name: { equals: name, mode: 'insensitive' } }
      });
      if (existingProduct) {
        return res.status(400).json({ message: 'A product with this name already exists' });
      }
    }

    const sanitizedPrice = parsePatchNumber(price) ?? 0;
    const sanitizedStock = parsePatchNumber(stock) ?? 0;
    const sanitizedDiscountPrice = isDiscountable ? (parsePatchNumber(discountPrice) ?? 0) : null;
    const sanitizedWeight = parseOptionalFloat(weight);
    const sanitizedLength = parseOptionalFloat(length);
    const sanitizedBreadth = parseOptionalFloat(breadth);
    const sanitizedHeight = parseOptionalFloat(height);

    const productHandle = handle || name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

    const product = await prisma.product.create({
      data: {
        name,
        subtitle,
        handle: productHandle,
        description,
        price: sanitizedPrice,
        images,
        thumbnailUrl,
        hoverThumbnailUrl,
        weight: sanitizedWeight,
        length: sanitizedLength,
        breadth: sanitizedBreadth,
        height: sanitizedHeight,
        categories: (categoryIds || (categoryId ? [categoryId] : null)) ? {
          connect: (categoryIds || [categoryId]).filter(id => id && id !== 'none' && id !== '').map(id => ({ id }))
        } : undefined,
        collections: (collectionIds || (collectionId ? [collectionId] : null)) ? {
          connect: (collectionIds || [collectionId]).filter(id => id && id !== 'none' && id !== '').map(id => ({ id }))
        } : undefined,
        stock: sanitizedStock,
        isDiscountable: !!isDiscountable,
        discountPrice: sanitizedDiscountPrice,
        variants: {
          create: (variants || []).map(v => ({
            title: v.title,
            price: (v.price === null || v.price === undefined || v.price === '') ? null : parseFloat(v.price),
            stock: parseInt(v.stock) || 0,
            images: v.images || []
          }))
        }
      },
      include: { variants: true }
    });
    res.status(201).json(product);
  } catch (error) {
    console.error('Create product error:', error);
    const payload = buildProductSaveError(error, 'create');
    res.status(500).json(payload);
  }
};

export const updateProduct = async (req, res) => {
  try {
    const {
      name, subtitle, handle, description, price, images,
      categoryId, categoryIds, collectionId, collectionIds, stock, isDiscountable,
      discountPrice, thumbnailUrl, hoverThumbnailUrl, variants,
      weight, length, breadth, height
    } = req.body;

    if (name) {
      const existingProduct = await prisma.product.findFirst({
        where: { 
          name: { equals: name, mode: 'insensitive' },
          id: { not: req.params.id }
        }
      });
      if (existingProduct) {
        return res.status(400).json({ message: 'A product with this name already exists' });
      }
    }

    const sanitizedPrice = parsePatchNumber(price);
    const sanitizedStock = parsePatchNumber(stock);
    const sanitizedDiscountPrice = isDiscountable ? (parsePatchNumber(discountPrice) ?? 0) : null;
    const sanitizedWeight = weight === undefined ? undefined : parseOptionalFloat(weight);
    const sanitizedLength = length === undefined ? undefined : parseOptionalFloat(length);
    const sanitizedBreadth = breadth === undefined ? undefined : parseOptionalFloat(breadth);
    const sanitizedHeight = height === undefined ? undefined : parseOptionalFloat(height);

    // Resolve handle
    let productHandle = handle;
    if (!productHandle && name) {
      productHandle = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    }

    const product = await prisma.product.update({
      where: { id: req.params.id },
      data: {
        name,
        subtitle,
        handle: productHandle,
        description,
        price: sanitizedPrice,
        images,
        thumbnailUrl,
        hoverThumbnailUrl,
        weight: sanitizedWeight,
        length: sanitizedLength,
        breadth: sanitizedBreadth,
        height: sanitizedHeight,
        stock: sanitizedStock,
        isDiscountable: !!isDiscountable,
        discountPrice: sanitizedDiscountPrice,
        categories: (categoryIds || (categoryId ? [categoryId] : null)) ? {
          set: (categoryIds || [categoryId]).filter(id => id && id !== 'none' && id !== '').map(id => ({ id }))
        } : undefined,
        collections: (collectionIds || (collectionId ? [collectionId] : null)) ? {
          set: (collectionIds || [collectionId]).filter(id => id && id !== 'none' && id !== '').map(id => ({ id }))
        } : undefined,
        variants: variants ? {
          deleteMany: {
            id: {
              notIn: variants.filter(v => v.id).map(v => v.id)
            },
            productId: req.params.id
          },
          update: variants.filter(v => v.id).map(v => ({
            where: { id: v.id },
            data: {
              title: v.title,
              price: (v.price === null || v.price === undefined || v.price === '') ? null : parseFloat(v.price),
              stock: parseInt(v.stock) || 0,
              images: v.images || []
            }
          })),
          create: variants.filter(v => !v.id).map(v => ({
            title: v.title,
            price: (v.price === null || v.price === undefined || v.price === '') ? null : parseFloat(v.price),
            stock: parseInt(v.stock) || 0,
            images: v.images || []
          }))
        } : undefined
      },
      include: { variants: true, reviews: true }
    });
    res.json(appendProductImageVersions(product));
  } catch (error) {
    console.error('Update product error:', error);
    const payload = buildProductSaveError(error, 'update');
    res.status(500).json(payload);
  }
};

export const patchProduct = async (req, res) => {
  try {
    const data = { ...req.body };
    const { id } = req.params;
    
    // Remove fields that should not be updated directly
    delete data.id;
    delete data.createdAt;
    delete data.updatedAt;
    delete data.categories;
    delete data.collections;

    // Convert numeric fields if present, handling blank inputs safely
    if (data.price !== undefined) {
      const parsedPrice = parsePatchNumber(data.price);
      if (parsedPrice !== undefined) data.price = parsedPrice;
      else delete data.price;
    }
    if (data.stock !== undefined) {
      const parsedStock = parsePatchNumber(data.stock);
      if (parsedStock !== undefined) data.stock = parsedStock;
      else delete data.stock;
    }
    if (data.weight !== undefined) {
      const parsedWeight = parseOptionalFloat(data.weight);
      if (parsedWeight !== null) data.weight = parsedWeight;
      else delete data.weight;
    }
    if (data.length !== undefined) {
      const parsedLength = parseOptionalFloat(data.length);
      if (parsedLength !== null) data.length = parsedLength;
      else delete data.length;
    }
    if (data.breadth !== undefined) {
      const parsedBreadth = parseOptionalFloat(data.breadth);
      if (parsedBreadth !== null) data.breadth = parsedBreadth;
      else delete data.breadth;
    }
    if (data.height !== undefined) {
      const parsedHeight = parseOptionalFloat(data.height);
      if (parsedHeight !== null) data.height = parsedHeight;
      else delete data.height;
    }
    if (data.name && !data.handle) {
      data.handle = data.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    }

    // Handle Variants Sync
    if (data.variants) {
      const variantsData = data.variants;
      delete data.variants; 

      data.variants = {
        deleteMany: {
          id: {
            notIn: variantsData.filter(v => v.id).map(v => v.id)
          },
          productId: id
        },
        update: variantsData.filter(v => v.id).map(v => ({
          where: { id: v.id },
          data: {
            title: v.title,
            price: (v.price === null || v.price === undefined || v.price === '') ? null : parseFloat(v.price),
            stock: parseInt(v.stock) || 0,
            images: v.images || []
          }
        })),
        create: variantsData.filter(v => !v.id).map(v => ({
          title: v.title,
          price: (v.price === null || v.price === undefined || v.price === '') ? null : parseFloat(v.price),
          stock: parseInt(v.stock) || 0,
          images: v.images || []
        }))
      };
    }

    // Handle many-to-many updates
    if (data.categoryIds) {
      data.categories = {
        set: data.categoryIds.filter(id => id && id !== 'none' && id !== '').map(id => ({ id }))
      };
      delete data.categoryIds;
    }
    if (data.collectionIds) {
      data.collections = {
        set: data.collectionIds.filter(id => id && id !== 'none' && id !== '').map(id => ({ id }))
      };
      delete data.collectionIds;
    }

    const product = await prisma.product.update({
      where: { id: id },
      data,
      include: {
        categories: true,
        collections: true,
        variants: true,
        reviews: true
      }
    });
    res.json(appendProductImageVersions(product));
  } catch (error) {
    console.error('Patch product error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const getBestSellers = async (req, res) => {
  try {
    const bestSellerSlugs = new Set([
      'best-sellers',
      'best-seller',
      'bestsellers',
      'bestseller'
    ]);

    const collections = await prisma.collection.findMany({
      select: {
        id: true,
        name: true
      }
    });

    const matchedCollection = collections.find((collection) => {
      const slug = slugify(collection.name);
      return bestSellerSlugs.has(slug) || slug.includes('best-seller') || slug.includes('bestseller');
    });

    if (!matchedCollection) {
      return res.json([]);
    }

    const bestSellersCollection = await prisma.collection.findUnique({
      where: { id: matchedCollection.id },
      include: {
        products: {
          take: 8,
          include: {
            categories: true,
            collections: true,
            variants: true
          }
        }
      }
    });

    if (!bestSellersCollection) {
      return res.json([]);
    }

    res.json(bestSellersCollection.products.map(appendProductImageVersions));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getNewArrivals = async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      orderBy: {
        createdAt: 'desc'
      },
      take: 8,
      include: {
        categories: true,
        collections: true,
        variants: true
      }
    });
    res.json(products.map(appendProductImageVersions));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.product.delete({
      where: { id: id },
    });
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
