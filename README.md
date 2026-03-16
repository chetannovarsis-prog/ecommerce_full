# Full-Stack E-commerce Ecosystem

A comprehensive, modular e-commerce solution featuring a modern storefront, a robust administrative dashboard, and a scalable RESTful API. This ecosystem is designed for performance, aesthetic excellence, and ease of management.

## 🏗 System Architecture

The project is organized into three primary decoupled modules:

### 1. [Storefront](store-frontend/) (Customer-Facing)
- **Tech**: React 18, Vite, Tailwind CSS, Zustand, Framer Motion.
- **Features**: Dynamic product catalog, sophisticated cart & wishlist logic, seamless checkout flow, and mobile-first responsive design.

### 2. [Admin Dashboard](admin-dashboard/) (Management)
- **Tech**: React 19, Vite, Tailwind CSS, Lucide Icons.
- **Features**: Product & Variant management, Category/Collection organization, Sales analytics, and Review moderation.

### 3. [Backend API](backend-api/) (Engine)
- **Tech**: Node.js, Express 5, Prisma ORM, Supabase Storage.
- **Features**: RESTful architecture, JWT authentication, automated mailers (Nodemailer), and PostgreSQL database integration.

---

## 🚀 Quick Start

### Prerequisites
- Node.js (v18+)
- PostgreSQL Database
- Supabase Account (for image storage)

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/chetannovarsis-prog/ecommerce_full.git
   cd ecommerce
   ```

2. **Setup Backend**:
   ```bash
   cd backend-api
   npm install
   # Create .env based on backend-api/prisma/schema.prisma requirements
   npx prisma migrate dev
   npm run dev
   ```

3. **Setup Admin Dashboard**:
   ```bash
   cd ../admin-dashboard
   npm install
   npm run dev
   ```

4. **Setup Storefront**:
   ```bash
   cd ../store-frontend
   npm install
   # Configure VITE_API_BASE_URL in .env
   npm run dev
   ```

---

## 🛠 Features
- **Modern Aesthetic**: Glassmorphism, smooth gradients, and premium micro-animations.
- **Robust State Management**: Powered by Zustand for the store and React Context for admin themes.
- **Advanced Variants**: Support for complex product variants (Size, Color, etc.) with stock tracking.
- **Data Persistence**: Prisma ORM with PostgreSQL ensures reliable data integrity.

---

## 📝 License
This project is licensed under the ISC License.
