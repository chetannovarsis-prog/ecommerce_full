import prisma from '../utils/prisma.js';
import { appendProductImageVersions } from '../utils/imageUrl.js';
import csv from 'csv-parser';
import { Readable } from 'stream';

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

const trimValue = (value) => (typeof value === 'string' ? value.trim() : value);

const isEmptyRow = (row = {}) => Object.values(row).every((value) => trimValue(value) === '' || trimValue(value) === null || trimValue(value) === undefined);

const parseImages = (value) =>
  String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

const generateProductHandle = (name = '') => name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

const parseVariantsField = (value = '') => {
  const raw = String(value || '').trim();
  if (!raw) {
    return [];
  }

  const groups = raw
    .split('|')
    .map((segment) => segment.trim())
    .filter(Boolean)
    .map((segment) => {
      const [leftPart, rightPart] = segment.split('>');

      if (!leftPart || !rightPart) {
        throw new Error(`Invalid variant group format: ${segment}`);
      }

      const leftSeparator = leftPart.indexOf(':');
      if (leftSeparator === -1) {
        throw new Error(`Invalid variant group format: ${segment}`);
      }

      const color = leftPart.slice(0, leftSeparator).trim();
      const images = parseImages(leftPart.slice(leftSeparator + 1));

      if (!color) {
        throw new Error(`Invalid variant group format: ${segment}`);
      }

      if (images.length === 0) {
        throw new Error(`Variant images are required for ${color}`);
      }

      const sizes = rightPart
        .split(',')
        .map((sizeSegment) => sizeSegment.trim())
        .filter(Boolean)
        .map((sizeSegment) => {
          const sizeSeparator = sizeSegment.lastIndexOf(':');
          if (sizeSeparator === -1) {
            throw new Error(`Invalid size format: ${sizeSegment}`);
          }

          const size = sizeSegment.slice(0, sizeSeparator).trim();
          const stockValue = sizeSegment.slice(sizeSeparator + 1).trim();
          const stock = parseInt(stockValue, 10);

          if (!size) {
            throw new Error(`Invalid size format: ${sizeSegment}`);
          }

          if (Number.isNaN(stock)) {
            throw new Error(`Invalid stock for ${color} / ${size}`);
          }

          return { size, stock };
        });

      if (sizes.length === 0) {
        throw new Error(`Sizes are required for ${color}`);
      }

      return { color, images, sizes };
    });

  if (groups.length === 0) {
    throw new Error('variants are required');
  }

  return groups;
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

export const importProducts = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'CSV file is required' });
    }

    const rows = [];
    await new Promise((resolve, reject) => {
      Readable.from([req.file.buffer])
        .pipe(csv())
        .on('data', (row) => rows.push(row))
        .on('end', resolve)
        .on('error', reject);
    });

    let successCount = 0;
    const failedRows = [];

    for (const [index, rawRow] of rows.entries()) {
      const rowNumber = index + 2;

      if (isEmptyRow(rawRow)) {
        continue;
      }

      try {
        const name = trimValue(rawRow.name);
        const subtitle = trimValue(rawRow.subtitle) || null;
        const handle = trimValue(rawRow.handle) || generateProductHandle(name);
        const description = trimValue(rawRow.description) || null;
        const price = parseOptionalFloat(rawRow.price);
        const isDiscountable = String(rawRow.isDiscountable ?? '').trim().toLowerCase() === 'true';
        const discountPrice = parseOptionalFloat(rawRow.discountPrice);
        const thumbnailUrl = trimValue(rawRow.thumbnailUrl) || null;
        const hoverThumbnailUrl = trimValue(rawRow.hoverThumbnailUrl) || null;
        const variantGroups = parseVariantsField(rawRow.variants);

        if (!name || price === null || !variantGroups.length || String(rawRow.isDiscountable ?? '').trim() === '') {
          throw new Error('name, price, variants, and isDiscountable are required');
        }

        if (isDiscountable && discountPrice === null) {
          throw new Error('discountPrice is required when isDiscountable is true');
        }

        const existingProduct = await prisma.product.findFirst({
          where: {
            OR: [
              { name: { equals: name, mode: 'insensitive' } },
              { handle: { equals: handle, mode: 'insensitive' } },
            ],
          },
          select: { id: true },
        });

        if (existingProduct) {
          throw new Error('Duplicate product name or handle');
        }

        const allImages = Array.from(new Set(variantGroups.flatMap((group) => group.images)));
        const resolvedThumbnail = thumbnailUrl || allImages[0] || null;
        const resolvedHoverThumbnail = hoverThumbnailUrl || allImages[1] || allImages[0] || null;

        await prisma.$transaction(async (tx) => {
          const product = await tx.product.create({
            data: {
              name,
              subtitle,
              handle,
              description,
              price,
              isDiscountable,
              discountPrice: isDiscountable ? discountPrice : null,
              images: allImages,
              thumbnailUrl: resolvedThumbnail,
              hoverThumbnailUrl: resolvedHoverThumbnail,
              stock: 0,
            },
          });

          // Create one variant per color+size combination so admin UI shows each size separately
          const variantsToCreate = variantGroups.flatMap((group) =>
            group.sizes.map((sz) => ({
              title: `${group.color} / ${sz.size}`,
              price,
              stock: sz.stock,
              images: group.images,
              thumbnailUrl: group.images[0] || null,
              hoverThumbnailUrl: group.images[1] || group.images[0] || null,
              productId: product.id,
            }))
          );

          if (variantsToCreate.length === 0) {
            throw new Error('No variants could be created from the CSV row');
          }

          await tx.productVariant.createMany({
            data: variantsToCreate,
          });
        });

        successCount += 1;
      } catch (error) {
        failedRows.push({
          row: rowNumber,
          error: error.message,
        });
      }
    }

    return res.json({
      successCount,
      failedCount: failedRows.length,
      failedRows,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to import products', error: error.message });
  }
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

    const sanitizedPrice = isNaN(parseFloat(price)) ? 0 : parseFloat(price);
    const sanitizedStock = isNaN(parseInt(stock)) ? 0 : parseInt(stock);
    const sanitizedDiscountPrice = isDiscountable ? (isNaN(parseFloat(discountPrice)) ? 0 : parseFloat(discountPrice)) : null;
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

    const sanitizedPrice = isNaN(parseFloat(price)) ? undefined : parseFloat(price);
    const sanitizedStock = isNaN(parseInt(stock)) ? undefined : parseInt(stock);
    const sanitizedDiscountPrice = isDiscountable ? (isNaN(parseFloat(discountPrice)) ? 0 : parseFloat(discountPrice)) : null;
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

    // Convert numeric fields if present, handling 0 correctly
    if (data.price !== undefined) data.price = parseFloat(data.price);
    if (data.stock !== undefined) data.stock = parseInt(data.stock);
    if (data.weight !== undefined) data.weight = parseOptionalFloat(data.weight);
    if (data.length !== undefined) data.length = parseOptionalFloat(data.length);
    if (data.breadth !== undefined) data.breadth = parseOptionalFloat(data.breadth);
    if (data.height !== undefined) data.height = parseOptionalFloat(data.height);
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
