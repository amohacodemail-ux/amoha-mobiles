
<p align="center">
  <h1 align="center">📱 AMOHA Mobiles</h1>
  <p align="center">
    A full-stack e-commerce platform for smartphones — built with Next.js, Node.js, Express, and MongoDB.
  </p>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-14-black?logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/Node.js-Express-green?logo=node.js" alt="Node.js" />
  <img src="https://img.shields.io/badge/MongoDB-Mongoose-47A248?logo=mongodb" alt="MongoDB" />
  <img src="https://img.shields.io/badge/TypeScript-5-blue?logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/TailwindCSS-3-06B6D4?logo=tailwindcss" alt="Tailwind" />
</p>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Prerequisites](#-prerequisites)
- [Getting Started](#-getting-started)
  - [1. Clone the Repository](#1-clone-the-repository)
  - [2. Backend Setup](#2-backend-setup)
  - [3. Frontend Setup](#3-frontend-setup)
  - [4. Admin Panel Setup](#4-admin-panel-setup)
- [Environment Variables](#-environment-variables)
- [Database Seeding](#-database-seeding)
- [API Documentation](#-api-documentation)
- [Architecture](#-architecture)
- [Screenshots](#-screenshots)
- [Default Credentials](#-default-credentials)
- [Available Scripts](#-available-scripts)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🌟 Overview

**AMOHA Mobiles** is a production-ready, full-stack e-commerce web application designed for selling smartphones and mobile accessories. It consists of three main applications:

| App | Port | Description |
|-----|------|-------------|
| **Frontend** (Customer) | `3000` | Next.js storefront for browsing, searching, purchasing phones |
| **Admin Panel** | `3001` | Next.js admin dashboard for managing products, orders, users |
| **Backend API** | `5000` | Express.js REST API powering both frontends |

---

## ✨ Features

### 🛍️ Customer Storefront (Frontend)
- **Home Page** — Hero banners (auto-rotating), featured deals, trending products, new arrivals, shop by category
- **Product Catalog** — Advanced filtering (brand, price range, RAM, storage, battery, ratings), sorting (newest, price low/high, popular), pagination
- **Product Detail** — Full specs, image gallery, color selection, reviews & ratings, related products
- **Search** — Real-time search suggestions with instant results
- **Shopping Cart** — Add/remove items, quantity management, coupon codes, auto-calculated delivery charges (free above ₹500)
- **Wishlist** — Save favorite products for later
- **Product Comparison** — Compare multiple phone specs side-by-side
- **Checkout** — Address management (home/work/other), order placement with COD
- **Order Tracking** — Full order lifecycle tracking with status history
- **User Profile** — Edit profile, manage addresses, view order history
- **Authentication** — Register, Login, Logout, Password change, Forgot/Reset password
- **Dark Theme UI** — Beautiful dark-mode glassmorphism design with gradient accents
- **Responsive** — Fully mobile-first responsive design

### 🔧 Admin Dashboard
- **Dashboard Analytics** — Revenue stats, order counts, top-selling products, monthly revenue charts
- **Product Management** — Full CRUD for products with detailed specifications
- **Category Management** — Create/edit/delete product categories
- **Brand Management** — Create/edit/delete brands
- **Order Management** — View all orders, update order status (placed → confirmed → processing → shipped → delivered), process refunds
- **User Management** — View all users, block/unblock users, delete accounts
- **Banner Management** — Manage homepage hero banners with toggle active/inactive
- **Coupon Management** — Create/edit/delete discount coupons (percentage or fixed)
- **Review Management** — View and moderate product reviews
- **Sales Reports** — Detailed sales analytics and reporting

### 🔒 Backend API
- **RESTful API** — Clean, well-structured REST endpoints
- **JWT Authentication** — Access + Refresh token strategy with secure cookie handling
- **Role-Based Access** — `user` and `admin` roles with middleware protection
- **Input Validation** — Zod schema validation on all endpoints
- **Error Handling** — Centralized error handling with custom error classes
- **Database Indexing** — Compound indexes for optimal query performance
- **Text Search** — Full-text search on product name, description, and tags
- **Logging** — Winston logger with file rotation (combined.log + error.log)
- **Security** — Helmet, CORS, rate limiting ready
- **Graceful Shutdown** — Clean server shutdown handling

---

## 🛠️ Tech Stack

### Frontend & Admin
| Technology | Purpose |
|------------|---------|
| [Next.js 14](https://nextjs.org/) | React framework (App Router, Turbopack) |
| [TypeScript](https://www.typescriptlang.org/) | Type safety |
| [Tailwind CSS 3](https://tailwindcss.com/) | Utility-first styling |
| [Zustand](https://zustand-demo.pmnd.rs/) | Lightweight state management |
| [Axios](https://axios-http.com/) | HTTP client with interceptors |
| [React Hook Form](https://react-hook-form.com/) | Form management |
| [Zod](https://zod.dev/) | Schema validation |
| [Radix UI](https://www.radix-ui.com/) | Accessible UI primitives (Dialog, Select, Tabs, Toast, etc.) |
| [Recharts](https://recharts.org/) | Dashboard charts |
| [Lucide React](https://lucide.dev/) | Icon library |
| [React Icons](https://react-icons.github.io/react-icons/) | Additional icons |
| [Swiper](https://swiperjs.com/) | Touch-friendly carousels |
| [react-hot-toast](https://react-hot-toast.com/) | Toast notifications |
| [date-fns](https://date-fns.org/) | Date formatting |
| [jose](https://github.com/panva/jose) | JWT handling (frontend) |

### Backend
| Technology | Purpose |
|------------|---------|
| [Node.js](https://nodejs.org/) | JavaScript runtime |
| [Express.js](https://expressjs.com/) | Web framework |
| [TypeScript](https://www.typescriptlang.org/) | Type safety |
| [MongoDB](https://www.mongodb.com/) | NoSQL database |
| [Mongoose](https://mongoosejs.com/) | MongoDB ODM |
| [JWT](https://jwt.io/) | JSON Web Token authentication |
| [bcryptjs](https://github.com/dcodeIO/bcrypt.js) | Password hashing |
| [Zod](https://zod.dev/) | Request validation |
| [Winston](https://github.com/winstonjs/winston) | Logging |
| [Helmet](https://helmetjs.github.io/) | HTTP security headers |
| [Morgan](https://github.com/expressjs/morgan) | HTTP request logging |
| [slugify](https://github.com/simov/slugify) | URL slug generation |

---

## 📁 Project Structure

```
AMOHA-MOBILES/
├── backend/                    # Express.js REST API
│   ├── src/
│   │   ├── config/             # DB connection, CORS, environment config
│   │   │   ├── cors.ts
│   │   │   ├── db.ts
│   │   │   └── env.ts
│   │   ├── controllers/        # Route handlers
│   │   │   ├── admin.controller.ts
│   │   │   ├── auth.controller.ts
│   │   │   ├── banner.controller.ts
│   │   │   ├── brand.controller.ts
│   │   │   ├── cart.controller.ts
│   │   │   ├── category.controller.ts
│   │   │   ├── order.controller.ts
│   │   │   ├── product.controller.ts
│   │   │   ├── user.controller.ts
│   │   │   └── wishlist.controller.ts
│   │   ├── errors/             # Custom error classes
│   │   │   └── app-error.ts
│   │   ├── middleware/         # Express middleware
│   │   │   ├── auth.middleware.ts      # JWT authentication
│   │   │   ├── error.middleware.ts     # Centralized error handler
│   │   │   ├── role.middleware.ts      # Admin role check
│   │   │   └── validate.middleware.ts  # Zod validation
│   │   ├── models/             # Mongoose schemas
│   │   │   ├── banner.model.ts
│   │   │   ├── brand.model.ts
│   │   │   ├── cart.model.ts
│   │   │   ├── category.model.ts
│   │   │   ├── coupon.model.ts
│   │   │   ├── order.model.ts
│   │   │   ├── product.model.ts
│   │   │   ├── user.model.ts
│   │   │   └── wishlist.model.ts
│   │   ├── routes/             # API route definitions
│   │   ├── seeds/              # Database seed script
│   │   │   └── seed.ts
│   │   ├── services/           # Business logic layer
│   │   ├── types/              # TypeScript type definitions
│   │   ├── utils/              # Helper utilities (JWT, password, logger, response)
│   │   ├── validators/         # Zod validation schemas
│   │   ├── app.ts              # Express app configuration
│   │   └── server.ts           # Server entry point
│   ├── logs/                   # Log files (gitignored)
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/                   # Next.js Customer Storefront
│   ├── src/
│   │   ├── app/                # Next.js App Router pages
│   │   │   ├── cart/           # Shopping cart page
│   │   │   ├── categories/     # Categories listing
│   │   │   ├── category/       # Category detail
│   │   │   ├── checkout/       # Checkout flow
│   │   │   ├── compare/        # Product comparison
│   │   │   ├── login/          # Login page
│   │   │   ├── register/       # Registration page
│   │   │   ├── order-success/  # Order confirmation
│   │   │   ├── orders/         # Order history & tracking
│   │   │   ├── product/        # Product detail page
│   │   │   ├── products/       # Product catalog with filters
│   │   │   ├── profile/        # User profile management
│   │   │   ├── search/         # Search results
│   │   │   ├── shop/           # Shop page
│   │   │   ├── wishlist/       # Wishlist page
│   │   │   ├── layout.tsx      # Root layout
│   │   │   └── page.tsx        # Homepage
│   │   ├── components/         # Reusable React components
│   │   ├── hooks/              # Custom React hooks
│   │   ├── lib/                # API client, utilities
│   │   ├── services/           # API service functions
│   │   ├── store/              # Zustand state stores
│   │   │   ├── auth.store.ts
│   │   │   ├── cart.store.ts
│   │   │   ├── compare.store.ts
│   │   │   └── wishlist.store.ts
│   │   └── types/              # TypeScript type definitions
│   ├── package.json
│   └── tailwind.config.ts
│
├── admin/                      # Next.js Admin Dashboard
│   ├── src/
│   │   ├── app/
│   │   │   ├── (auth)/         # Auth layout (login page)
│   │   │   └── (admin)/        # Admin layout (protected)
│   │   │       ├── dashboard/  # Analytics dashboard
│   │   │       ├── products/   # Product CRUD
│   │   │       ├── categories/ # Category management
│   │   │       ├── brands/     # Brand management
│   │   │       ├── orders/     # Order management
│   │   │       ├── users/      # User management
│   │   │       ├── banners/    # Banner management
│   │   │       ├── coupons/    # Coupon management
│   │   │       ├── reviews/    # Review moderation
│   │   │       └── settings/   # Admin settings
│   │   ├── components/         # Admin UI components
│   │   │   ├── charts/         # Dashboard chart components
│   │   │   ├── layout/         # Sidebar, Header, etc.
│   │   │   ├── shared/         # Shared components
│   │   │   └── ui/             # UI primitives
│   │   ├── hooks/              # Custom hooks
│   │   ├── lib/                # API client, utilities
│   │   ├── services/           # Admin API service functions
│   │   ├── store/              # Auth store
│   │   └── types/              # TypeScript types
│   ├── package.json
│   └── tailwind.config.ts
│
├── .gitignore
└── README.md
```

---

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

| Tool | Version | Download |
|------|---------|----------|
| **Node.js** | >= 18.0.0 | [nodejs.org](https://nodejs.org/) |
| **npm** | >= 9.0.0 | Comes with Node.js |
| **MongoDB** | >= 6.0 | [mongodb.com](https://www.mongodb.com/try/download/community) or use [MongoDB Atlas](https://www.mongodb.com/atlas) (free cloud) |
| **Git** | Latest | [git-scm.com](https://git-scm.com/) |

---

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/AMOHA-MOBILES.git
cd AMOHA-MOBILES
```

### 2. Backend Setup

```bash
# Navigate to backend
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env
# (or create .env manually — see Environment Variables section below)

# Seed the database with sample data
npm run seed

# Start the development server
npm run dev
```

The backend API will start at **http://localhost:5000**

✅ Verify it's running: visit **http://localhost:5000/health**

### 3. Frontend Setup

```bash
# Open a new terminal, navigate to frontend
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

The customer storefront will start at **http://localhost:3000**

### 4. Admin Panel Setup

```bash
# Open a new terminal, navigate to admin
cd admin

# Install dependencies
npm install

# Start the development server
npm run dev
```

The admin dashboard will start at **http://localhost:3001**

### 🎉 All Three Apps Running

| Service | URL | Description |
|---------|-----|-------------|
| Backend API | http://localhost:5000 | REST API + Health check |
| Frontend | http://localhost:3000 | Customer storefront |
| Admin Panel | http://localhost:3001 | Admin dashboard |

---

## 🔐 Environment Variables

### Backend (`backend/.env`)

Create a `.env` file in the `backend/` directory with these variables:

```env
# Server
NODE_ENV=development
PORT=5000

# MongoDB
MONGODB_URI=mongodb://localhost:27017/amoha-mobiles

# JWT Secrets (must be at least 32 characters each)
JWT_ACCESS_SECRET=your-super-secret-access-key-minimum-32-chars
JWT_REFRESH_SECRET=your-super-secret-refresh-key-minimum-32-chars
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# CORS (comma-separated origins)
CORS_ORIGIN=http://localhost:3000,http://localhost:3001

# Security
BCRYPT_SALT_ROUNDS=12

# Logging
LOG_LEVEL=info
```

> **💡 Tip:** If using MongoDB Atlas (cloud), replace `MONGODB_URI` with your Atlas connection string:
> ```
> MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/amoha-mobiles?retryWrites=true&w=majority
> ```

### Frontend (`frontend/.env.local`)

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

### Admin (`admin/.env.local`)

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

---

## 🌱 Database Seeding

The seed script populates your database with sample data so you can immediately start exploring the app:

```bash
cd backend
npm run seed
```

### What Gets Seeded

| Data | Count | Details |
|------|-------|---------|
| **Users** | 2 | 1 Admin + 1 Test User |
| **Products** | 8 | Samsung, Apple, OnePlus, Xiaomi, Nothing, Realme, Vivo phones |
| **Categories** | 4 | Smartphones, Feature Phones, Accessories, Tablets |
| **Brands** | 8 | Samsung, Apple, OnePlus, Xiaomi, Vivo, Realme, OPPO, Nothing |
| **Banners** | 3 | Hero carousel banners |
| **Coupons** | 3 | WELCOME10, FLAT500, AMOHA20 |

> ⚠️ **Warning:** Running the seed script **clears all existing data** before inserting fresh records.

---

## 🔑 Default Credentials

After seeding, use these credentials to log in:

### Admin Account
| Field | Value |
|-------|-------|
| Email | `admin@amoha.com` |
| Password | `admin123` |
| Access | Admin Dashboard (port 3001) + Customer Storefront |

### Test User Account
| Field | Value |
|-------|-------|
| Email | `user@amoha.com` |
| Password | `user123` |
| Access | Customer Storefront (port 3000) |

### Coupon Codes
| Code | Type | Discount | Min Order |
|------|------|----------|-----------|
| `WELCOME10` | Percentage | 10% off (max ₹2,000) | ₹1,000 |
| `FLAT500` | Fixed | ₹500 off | ₹5,000 |
| `AMOHA20` | Percentage | 20% off (max ₹5,000) | ₹10,000 |

---

## 📡 API Documentation

### Base URL
```
http://localhost:5000/api
```

### Health Check
```
GET http://localhost:5000/health
```

### Authentication Endpoints
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `POST` | `/api/auth/register` | Register a new user | ❌ |
| `POST` | `/api/auth/login` | Login and get JWT tokens | ❌ |
| `POST` | `/api/auth/refresh-token` | Refresh access token | ❌ |
| `POST` | `/api/auth/forgot-password` | Request password reset | ❌ |
| `POST` | `/api/auth/reset-password` | Reset password with token | ❌ |
| `POST` | `/api/auth/logout` | Logout (invalidate token) | ✅ |
| `GET` | `/api/auth/profile` | Get current user profile | ✅ |
| `PUT` | `/api/auth/profile` | Update profile | ✅ |
| `PUT` | `/api/auth/change-password` | Change password | ✅ |

### Product Endpoints
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/api/products` | Get all products (with filters & pagination) | ❌ |
| `GET` | `/api/products/featured` | Get featured products | ❌ |
| `GET` | `/api/products/trending` | Get trending products | ❌ |
| `GET` | `/api/products/search/suggestions` | Search suggestions | ❌ |
| `GET` | `/api/products/category/:slug` | Get products by category | ❌ |
| `GET` | `/api/products/:slug` | Get product by slug | ❌ |
| `GET` | `/api/products/:id/related` | Get related products | ❌ |
| `POST` | `/api/products/:id/reviews` | Add a review | ✅ User |
| `DELETE` | `/api/products/:id/reviews/:reviewId` | Delete own review | ✅ User |
| `POST` | `/api/products` | Create product | ✅ Admin |
| `PUT` | `/api/products/:id` | Update product | ✅ Admin |
| `DELETE` | `/api/products/:id` | Delete product | ✅ Admin |
| `PATCH` | `/api/products/:id/stock` | Update stock | ✅ Admin |

### Cart Endpoints
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/api/cart` | Get user's cart | ✅ |
| `POST` | `/api/cart/items` | Add item to cart | ✅ |
| `PUT` | `/api/cart/items/:itemId` | Update item quantity | ✅ |
| `DELETE` | `/api/cart/items/:itemId` | Remove item from cart | ✅ |
| `DELETE` | `/api/cart` | Clear entire cart | ✅ |
| `POST` | `/api/cart/coupon` | Apply coupon code | ✅ |
| `DELETE` | `/api/cart/coupon` | Remove applied coupon | ✅ |

### Order Endpoints
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `POST` | `/api/orders` | Place a new order | ✅ User |
| `GET` | `/api/orders` | Get user's orders | ✅ User |
| `GET` | `/api/orders/:id` | Get order details | ✅ User |
| `PUT` | `/api/orders/:id/cancel` | Cancel an order | ✅ User |
| `GET` | `/api/orders/:id/track` | Track order status | ✅ User |
| `GET` | `/api/orders/admin/all` | Get all orders | ✅ Admin |
| `PUT` | `/api/orders/admin/:id/status` | Update order status | ✅ Admin |

### Wishlist Endpoints
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/api/wishlist` | Get wishlist | ✅ |
| `POST` | `/api/wishlist` | Add to wishlist | ✅ |
| `DELETE` | `/api/wishlist/:productId` | Remove from wishlist | ✅ |

### Category, Brand, Banner, Coupon Endpoints
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/api/categories` | Get all categories | ❌ |
| `GET` | `/api/brands` | Get all brands | ❌ |
| `GET` | `/api/banners` | Get active banners | ❌ |
| `POST` | `/api/coupons/validate` | Validate a coupon code | ✅ |

### Admin Dashboard Endpoints
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/api/admin/dashboard/stats` | Dashboard statistics | ✅ Admin |
| `GET` | `/api/admin/dashboard/revenue` | Monthly revenue data | ✅ Admin |
| `GET` | `/api/admin/dashboard/top-products` | Top-selling products | ✅ Admin |
| `GET` | `/api/admin/dashboard/recent-orders` | Recent orders | ✅ Admin |
| `GET` | `/api/admin/sales-report` | Sales report | ✅ Admin |
| `GET` | `/api/admin/products` | List all products | ✅ Admin |
| `GET` | `/api/admin/categories` | List all categories | ✅ Admin |
| `GET` | `/api/admin/brands` | List all brands | ✅ Admin |
| `GET` | `/api/admin/orders` | List all orders | ✅ Admin |
| `GET` | `/api/admin/users` | List all users | ✅ Admin |
| `GET` | `/api/admin/banners` | List all banners | ✅ Admin |
| `GET` | `/api/admin/coupons` | List all coupons | ✅ Admin |
| `GET` | `/api/admin/reviews` | List all reviews | ✅ Admin |
| ... | `/api/admin/*` | Full CRUD on all resources | ✅ Admin |

### Query Parameters (Products)
```
GET /api/products?brand=Samsung,Apple&priceMin=10000&priceMax=50000&ram=8GB&storage=128GB&rating=4&sort=price_low&page=1&limit=12&search=galaxy&category=smartphones
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `brand` | string | Comma-separated brand names |
| `category` | string | Category slug |
| `priceMin` | number | Minimum price |
| `priceMax` | number | Maximum price |
| `ram` | string | RAM filter (e.g., "8 GB") |
| `storage` | string | Storage filter (e.g., "256 GB") |
| `rating` | number | Minimum rating (1-5) |
| `search` | string | Text search query |
| `sort` | string | `newest`, `price_low`, `price_high`, `popular`, `rating` |
| `page` | number | Page number (default: 1) |
| `limit` | number | Items per page (default: 12) |

---

## 🏗️ Architecture

### High-Level Architecture

```
┌─────────────┐     ┌─────────────┐
│   Frontend   │     │  Admin Panel │
│  (Next.js)   │     │  (Next.js)   │
│  Port: 3000  │     │  Port: 3001  │
└──────┬───────┘     └──────┬───────┘
       │   HTTP/REST (Axios) │
       └──────────┬──────────┘
                  │
          ┌───────▼────────┐
          │  Backend API   │
          │  (Express.js)  │
          │  Port: 5000    │
          └───────┬────────┘
                  │  Mongoose ODM
          ┌───────▼────────┐
          │    MongoDB      │
          │   Database      │
          └─────────────────┘
```

### Backend Architecture (Layered)

```
Request → Routes → Middleware (Auth/Validate) → Controllers → Services → Models → MongoDB
                                                     ↑
                                              Validators (Zod)
                                              Error Handlers
                                              Utilities (JWT, Password, Logger)
```

### Authentication Flow

```
1. User logs in → POST /api/auth/login
2. Server validates credentials → returns { accessToken, user }
3. Frontend stores token in cookie (js-cookie)
4. Axios interceptor attaches "Bearer <token>" to every request
5. Backend middleware verifies JWT on protected routes
6. If token expires (401) → frontend redirects to login (protected pages only)
```

### State Management (Frontend)

```
Zustand Stores:
├── auth.store.ts     → User authentication state, login/logout
├── cart.store.ts     → Shopping cart items, totals, coupon
├── wishlist.store.ts → Wishlist products
└── compare.store.ts  → Product comparison list
```

### Database Models

```
MongoDB Collections:
├── users       → User accounts, addresses, roles
├── products    → Products with specs, reviews (embedded), tags
├── categories  → Product categories with slug
├── brands      → Brand info with logo
├── carts       → User shopping carts (1 per user)
├── orders      → Orders with items, status history, payments
├── wishlists   → User wishlists
├── banners     → Homepage hero banners
└── coupons     → Discount coupon codes
```

---

## 📸 Screenshots

> Add your screenshots here after running the project!

| Page | Description |
|------|-------------|
| Homepage | Hero banners, featured deals, trending products, categories |
| Product Catalog | Filter sidebar, product grid with pagination |
| Product Detail | Image gallery, specifications, reviews, related products |
| Shopping Cart | Cart items, coupon code, price breakdown |
| Checkout | Address selection, order summary |
| Admin Dashboard | Revenue charts, order stats, top products |
| Admin Products | Product list with CRUD operations |
| Admin Orders | Order management with status updates |

---

## 📜 Available Scripts

### Backend (`cd backend`)
| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot-reload (ts-node-dev) |
| `npm run seed` | Seed database with sample data |

### Frontend (`cd frontend`)
| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server with Turbopack (port 3000) |
| `npm run build` | Create production build |
| `npm start` | Start production server |
| `npm run clean` | Remove .next build cache |

### Admin (`cd admin`)
| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server with Turbopack (port 3001) |

---

## 🔄 Order Lifecycle

```
placed → confirmed → processing → shipped → out_for_delivery → delivered
   │
   └──→ cancelled (user can cancel before shipping)
              │
              └──→ returned → refunded (admin processes refund)
```

---

## 💰 Cart & Pricing Logic

- **Delivery Charge:** ₹49 for orders below ₹500, **FREE** for orders ≥ ₹500
- **Coupon Types:**
  - `percentage` — Applies % discount with optional max cap
  - `fixed` — Flat amount off
- **Auto-calculations:** Cart totals (subtotal, discount, delivery, grand total) are calculated in Mongoose pre-save hooks

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the **ISC License**.

---

## 🙏 Acknowledgements

- [Next.js](https://nextjs.org/) — The React Framework
- [Tailwind CSS](https://tailwindcss.com/) — Utility-first CSS
- [Radix UI](https://www.radix-ui.com/) — Accessible components
- [MongoDB](https://www.mongodb.com/) — NoSQL database
- [Express.js](https://expressjs.com/) — Node.js web framework

---

<p align="center">
  Made with ❤️ by <strong>AMOHA</strong>
</p>
