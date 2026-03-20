import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useStore = create(
  persist(
    (set, get) => ({
      cart: [],
      wishlist: [],
      toast: null,

      showToast: (message, type = 'success') => {
        set({ toast: { message, type, id: Date.now() } });
        setTimeout(() => {
          const { toast } = get();
          if (toast) set({ toast: null });
        }, 3000);
      },

      addToCart: (product, variant = null, quantity = 1) => {
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
          set({
            cart: cart.map((item) =>
              String(item.id) === String(product.id) && String(item.variantId || '') === String(variant?.id || '')
                ? { ...item, quantity: item.quantity + quantity }
                : item
            ),
          });
        } else {
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
                quantity,
              },
            ],
          });
        }
        get().showToast(`${product.name} added to cart`);
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

      clearCart: () => set({ cart: [] }),

      syncStore: (allProducts) => {
        const { cart, wishlist } = get();
        const products = Array.isArray(allProducts)
          ? allProducts
          : Array.isArray(allProducts?.data)
          ? allProducts.data
          : [];

        const validIds = new Set(products.map((p) => String(p.id)));

        const newCart = cart.filter((item) => validIds.has(String(item.id)));
        const newWishlist = wishlist.filter((item) => validIds.has(String(item.id)));

        if (newCart.length !== cart.length || newWishlist.length !== wishlist.length) {
          set({ cart: newCart, wishlist: newWishlist });
        }
      },
    }),
    {
      name: 'vogue-store-storage',
    }
  )
);
