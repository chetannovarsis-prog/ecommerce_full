# Ecommerce Storefront

The user-facing storefront providing a premium, high-performance shopping experience. Built for speed, aesthetics, and fluid interaction.

## ✨ Premium Features
- **Dynamic Product Detail**: Advanced variant selection, image galleries with fullscreen view, and native sharing.
- **Smart Shopping Bag**: Side drawer for quick access and a full cart page for detailed management.
- **Wishlist Logic**: Save favorite items for later with persistent state.
- **Sophisticated Search**: Live search with ranked suggestions and product previews.
- **Mobile First**: Tailored experiences for mobile users, including sticky navigations and optimized tap targets.
- **Aesthetic Excellence**: Vibrant colors, glassmorphism, and smooth Framer Motion animations.

## 🛠 Tech Stack
- **Framework**: React 18 + Vite
- **State Management**: Zustand
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **HTTP Client**: Axios

## 📂 Project Structure
- `src/pages/store/`: Main customer views (Home, Shop, ProductDetail, CartPage, Checkout).
- `src/components/store/`: Reusable UI components (Navbar, Footer, ProductCard, FilterSidebar).
- `src/services/`: State management and API service layer (`useStore.js`).

## 🚀 Getting Started

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure Environment Variables**:
   Create a `.env` file:
   ```env
   VITE_API_BASE_URL="http://localhost:5000/api"
   ```

3. **Run Development Server**:
   ```bash
   npm run dev
   ```

---

## 🎨 Design Philosophy
- **Wow Factor**: Every interaction is designed to feel premium and intentional.
- **Performance**: Optimized asset loading and component memoization.
- **Accessibility**: Semantic HTML and clear interactive states.

## 🔒 Security & Flow
- **Authentication**: Certain features like "Add to Cart" and "Wishlist" require user login to maintain cross-session consistency.
- **Sync Logic**: The store automatically synchronizes with the product catalog to handle updates or removals in real-time.
