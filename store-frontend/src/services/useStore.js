import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useStore = create(
  persist(
    (set, get) => ({
      cart: [],
      wishlist: [],
      toast: null,
      appliedCoupon: null,
      productsCache: null, // Cache for product listings
      productsCacheTimestamp: null,

      showToast: (message, type = 'success') => {
        set({ toast: { message, type, id: Date.now() } });
        setTimeout(() => {
          const { toast } = get();
          if (toast) set({ toast: null });
        }, 3000);
      },

      getAvailableStock: (product, variant = null) => {
        const raw =
          variant?.stock ??
          variant?.quantity ??
          product?.stock ??
          product?.quantity ??
          product?.maxQuantity ??
          0;
        const val = Number(raw);
        return Number.isFinite(val) ? val : 0;
      },

      getStockMessage: (availableStock) => {
        const n = Number(availableStock);
        if (!Number.isFinite(n) || n <= 0) return 'This product is out of stock';
        if (n === 1) return 'Only 1 product left';
        return `Only ${n} products left`;
      },

      addToCart: (product, variant = null, quantity = 1) => {
        const availableStock = get().getAvailableStock(product, variant);

        if (Number(availableStock) <= 0) {
          get().showToast('This product is out of stock', 'error');
          return;
        }

        const customer = localStorage.getItem('customer');
        if (!customer) {
          get().showToast('Please login to add to cart', 'error');
          return;
        }
        const { cart } = get();
        const existingItem = cart.find(
          (item) => String(item.id) === String(product.id) && String(item.variantId || '') === String(variant?.id || '')
        );

        if (existingItem) {
          const currentQty = Number(existingItem.quantity || 0);
          const cap = Number(availableStock);

          if (currentQty >= cap) {
            get().showToast(get().getStockMessage(cap), 'error');
            return;
          }

          const addQty = Math.max(0, Math.min(Number(quantity) || 1, cap - currentQty));
          if (addQty <= 0) {
            get().showToast(get().getStockMessage(cap), 'error');
            return;
          }

          if (addQty < (Number(quantity) || 1)) {
            get().showToast(get().getStockMessage(cap), 'error');
          } else {
            get().showToast('Product added to cart');
          }

          set({
            cart: cart.map((item) =>
              String(item.id) === String(product.id) && String(item.variantId || '') === String(variant?.id || '')
                ? {
                    ...item,
                    quantity: item.quantity + addQty,
                    maxQuantity: cap,
                  }
                : item
            ),
          });
        } else {
          const cap = Number(availableStock);
          const addQty = Math.max(0, Math.min(Number(quantity) || 1, cap));

          if (addQty <= 0) {
            get().showToast(get().getStockMessage(cap), 'error');
            return;
          }

          if (addQty < (Number(quantity) || 1)) {
            get().showToast(get().getStockMessage(cap), 'error');
          } else {
            get().showToast('Product added to cart');
          }

          set({
            cart: [
              ...cart,
              {
                ...product,
                variantId: variant?.id || null,
                variantTitle: variant?.title || null,
                selectedPrice: variant?.price !== null && variant?.price !== undefined ? variant.price : product.price,
                selectedImage: variant?.images?.[0] || product.thumbnailUrl || product.images?.[0],
                hoverImage: variant?.images?.[1] || product.hoverThumbnailUrl || product.images?.[1] || null,
                quantity: addQty,
                maxQuantity: cap,
              },
            ],
          });
        }
      },

      removeFromCart: (productId, variantId = null) => {
        const { cart } = get();
        set({
          cart: cart.filter(
            (item) => !(String(item.id) === String(productId) && String(item.variantId || '') === String(variantId || ''))
          ),
        });
      },

      updateCartQuantity: (productId, variantId, quantity) => {
        const { cart } = get();
        if (quantity < 1) return;

        const item = cart.find(
          (i) =>
            String(i.id) === String(productId) &&
            String(i.variantId || '') === String(variantId || '')
        );

        if (item) {
          const cap = Number(item.maxQuantity);
          if (Number.isFinite(cap) && cap > 0 && quantity > cap) {
            get().showToast(get().getStockMessage(cap), 'error');
            quantity = cap;
          }
        }

        set({
          cart: cart.map((item) =>
            String(item.id) === String(productId) && String(item.variantId || '') === String(variantId || '')
              ? { ...item, quantity }
              : item
          ),
        });
      },

      toggleWishlist: (product) => {
        const customer = localStorage.getItem('customer');
        if (!customer) {
          get().showToast('Please login to add to wishlist', 'error');
          return;
        }
        const { wishlist } = get();
        const isInWishlist = wishlist.find((p) => p.id === product.id);

        if (isInWishlist) {
          set({ wishlist: wishlist.filter((p) => p.id !== product.id) });
        } else {
          set({ wishlist: [...wishlist, product] });
        }
      },

      applyCoupon: (coupon) => set({ appliedCoupon: coupon }),

      clearCoupon: () => set({ appliedCoupon: null }),

      clearCart: () => set({ cart: [], appliedCoupon: null }),

      // Product caching methods
      cacheProducts: (products) => set({ 
        productsCache: products, 
        productsCacheTimestamp: Date.now() 
      }),

      getCachedProducts: () => {
        const { productsCache, productsCacheTimestamp } = get();
        const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes
        if (productsCache && productsCacheTimestamp && (Date.now() - productsCacheTimestamp) < CACHE_DURATION) {
          return productsCache;
        }
        return null;
      },

      syncStore: (allProducts) => {
        const { cart, wishlist } = get();
        const products = Array.isArray(allProducts)
          ? allProducts
          : Array.isArray(allProducts?.data)
          ? allProducts.data
          : [];

        const productMap = new Map(products.map((p) => [String(p.id), p]));
        let changed = false;

        // Sync Cart Items
        const newCart = cart.map((item) => {
          const latestProduct = productMap.get(String(item.id));
          if (!latestProduct) {
            changed = true;
            return null; // Product no longer exists
          }

          let updatedItem = { ...item };
          let itemChanged = false;

          // Sync Name
          if (item.name !== latestProduct.name) {
            updatedItem.name = latestProduct.name;
            itemChanged = true;
          }

          // Sync Variant and Price
          const variants = latestProduct.variants || [];
          let currentVariant = variants.find(v => String(v.id) === String(item.variantId));

          // If variant ID not found, try matching by title (handles backend ID changes)
          if (!currentVariant && item.variantTitle) {
            const val = item.variantTitle;
            currentVariant = variants.find(v => v.title === val);
            if (currentVariant) {
              updatedItem.variantId = currentVariant.id;
              itemChanged = true;
            }
          }

          const newPrice = currentVariant && currentVariant.price !== null && currentVariant.price !== undefined
            ? currentVariant.price
            : latestProduct.price;

          const newMaxQuantity = get().getAvailableStock(latestProduct, currentVariant);
          if (Number(item.maxQuantity || 0) !== Number(newMaxQuantity || 0)) {
            updatedItem.maxQuantity = newMaxQuantity;
            itemChanged = true;
          }

          if (Number(item.selectedPrice) !== Number(newPrice)) {
            updatedItem.selectedPrice = newPrice;
            itemChanged = true;
          }

          // Sync Images
          const newSelectedImage = (currentVariant?.images?.[0]) || latestProduct.thumbnailUrl || latestProduct.images?.[0];
          if (item.selectedImage !== newSelectedImage) {
            updatedItem.selectedImage = newSelectedImage;
            itemChanged = true;
          }

          if (itemChanged) {
            changed = true;
            return updatedItem;
          }
          return item;
        }).filter(Boolean);

        // Sync Wishlist (simplified, just check if product exists)
        const newWishlist = wishlist.filter((item) => productMap.has(String(item.id)));
        if (newWishlist.length !== wishlist.length) changed = true;

        if (changed || newCart.length !== cart.length) {
          set({ cart: newCart, wishlist: newWishlist });
        }
      },
    }),
    {
      name: 'gharofethnics-store-storage',
    }
  )
);
