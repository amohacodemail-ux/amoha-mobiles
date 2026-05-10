# 2. Architecture

## System Design Overview

AMOHA Mobiles follows a **three-tier architecture** with clear separation of concerns:

1. **Presentation Layer** - Two Next.js applications (Frontend + Admin)
2. **Application Layer** - Express.js REST API
3. **Data Layer** - PostgreSQL database (Supabase)

---

## High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     CLIENT APPLICATIONS                      │
├──────────────────────────┬──────────────────────────────────┤
│   Frontend (Next.js)     │     Admin Panel (Next.js)        │
│   Port: 3002             │     Port: 3003                   │
│   - Customer UI          │     - Admin Dashboard            │
│   - Product Catalog      │     - Product Management         │
│   - Cart & Checkout      │     - Order Management           │
│   - User Profile         │     - Analytics                  │
└──────────────────────────┴──────────────────────────────────┘
                           │
                           │ HTTP/REST (Axios)
                           │ JSON Payloads
                           │ JWT Authentication
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND API (Express.js)                  │
│                         Port: 5001                           │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Routes → Middleware → Controllers → Services        │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  Middleware:                                                 │
│  - Authentication (JWT)                                      │
│  - Authorization (Role-based)                                │
│  - Validation (Zod)                                          │
│  - Error Handling                                            │
│  - Rate Limiting                                             │
│  - Logging (Winston)                                         │
│                                                              │
│  Services:                                                   │
│  - Business Logic                                            │
│  - Database Queries (Supabase Client)                        │
│  - External API Calls (Razorpay, Cloudinary)                 │
└─────────────────────────────────────────────────────────────┘
                           │
                           │ Supabase Client
                           │ PostgreSQL Protocol
                           ▼
┌─────────────────────────────────────────────────────────────┐
│              DATABASE (PostgreSQL - Supabase)                │
├─────────────────────────────────────────────────────────────┤
│  Tables:                                                     │
│  - users, products, orders, order_items                      │
│  - categories, brands, banners, coupons                      │
│  - carts, wishlists, reviews                                 │
│  - inventory, suppliers, wallets                             │
│  - service_requests, return_requests                         │
│  - activity_logs, notifications                              │
│                                                              │
│  Features:                                                   │
│  - Indexes for performance                                   │
│  - Foreign key constraints                                   │
│  - Triggers for auto-updates                                 │
│  - Row-level security (RLS)                                  │
└─────────────────────────────────────────────────────────────┘
```

---

## Component Breakdown

### 1. Frontend Application (Customer Storefront)

**Technology:** Next.js 14 (App Router), TypeScript, Tailwind CSS

**Key Components:**

```
Frontend Architecture
├── App Router Pages (src/app/)
│   ├── Homepage (/)
│   ├── Product Catalog (/products)
│   ├── Product Detail (/product/[slug])
│   ├── Cart (/cart)
│   ├── Checkout (/checkout)
│   ├── Orders (/orders)
│   ├── Profile (/profile)
│   ├── Wishlist (/wishlist)
│   ├── Compare (/compare)
│   └── Auth (login, register, forgot-password)
│
├── Components (src/components/)
│   ├── Layout (Header, Footer, Sidebar)
│   ├── Product (ProductCard, ProductGrid, ProductFilters)
│   ├── Cart (CartItem, CartSummary)
│   ├── UI (Button, Input, Modal, Toast)
│   └── Shared (LoadingSpinner, ErrorBoundary)
│
├── State Management (Zustand)
│   ├── authStore - User authentication state
│   ├── cartStore - Shopping cart state
│   ├── wishlistStore - Wishlist state
│   └── compareStore - Product comparison state
│
├── Services (API Calls)
│   ├── authService - Login, register, profile
│   ├── productService - Fetch products, search
│   ├── cartService - Cart operations
│   ├── orderService - Order placement, tracking
│   └── userService - Profile management
│
└── Utilities
    ├── API client (Axios with interceptors)
    ├── Token management
    ├── Form validation (Zod)
    └── Date/currency formatters
```

**Data Flow:**
1. User interacts with UI components
2. Component dispatches action to Zustand store
3. Store calls API service function
4. Service makes HTTP request to backend
5. Response updates store state
6. UI re-renders with new data

---

### 2. Admin Panel Application

**Technology:** Next.js 14 (App Router), TypeScript, Tailwind CSS

**Key Components:**

```
Admin Architecture
├── App Router Pages (src/app/(admin)/)
│   ├── Dashboard (/dashboard)
│   ├── Products (/products)
│   ├── Orders (/orders)
│   ├── Customers (/users)
│   ├── Categories (/categories)
│   ├── Brands (/brands)
│   ├── Banners (/banners)
│   ├── Coupons (/coupons)
│   ├── Inventory (/inventory)
│   ├── Suppliers (/suppliers)
│   ├── Reports (/reports)
│   └── Settings (/settings)
│
├── Components (src/components/)
│   ├── Layout (Sidebar, Header, Breadcrumbs)
│   ├── Charts (RevenueChart, OrdersChart)
│   ├── Tables (DataTable with sorting/filtering)
│   ├── Forms (ProductForm, OrderForm)
│   └── UI (Radix UI primitives)
│
├── Services (API Calls)
│   ├── adminService - Dashboard stats
│   ├── productService - Product CRUD
│   ├── orderService - Order management
│   ├── userService - User management
│   └── reportService - Analytics
│
└── State Management
    └── authStore - Admin authentication
```

---

### 3. Backend API (Express.js)

**Technology:** Node.js, Express.js, TypeScript, PostgreSQL (Supabase)

**Layered Architecture:**

```
Backend Architecture (Layered)

┌─────────────────────────────────────────────────────────┐
│                    HTTP REQUEST                          │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│                   ROUTES LAYER                           │
│  - Define API endpoints                                  │
│  - Map HTTP methods to controllers                       │
│  - Apply middleware                                      │
│                                                          │
│  Files: src/routes/*.routes.ts                           │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│                 MIDDLEWARE LAYER                         │
│  - Authentication (JWT verification)                     │
│  - Authorization (Role check)                            │
│  - Validation (Zod schemas)                              │
│  - Error handling                                        │
│  - Logging                                               │
│                                                          │
│  Files: src/middleware/*.middleware.ts                   │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│                CONTROLLERS LAYER                         │
│  - Handle HTTP requests/responses                        │
│  - Extract request data                                  │
│  - Call service layer                                    │
│  - Format responses                                      │
│  - Handle errors                                         │
│                                                          │
│  Files: src/controllers/*.controller.ts                  │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│                 SERVICES LAYER                           │
│  - Business logic                                        │
│  - Database operations (via Supabase client)             │
│  - Data transformation                                   │
│  - External API calls                                    │
│  - Transaction management                                │
│                                                          │
│  Files: src/services/*.service.ts                        │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│                  MODELS LAYER                            │
│  - TypeScript interfaces                                 │
│  - Data validation                                       │
│  - Table/column definitions                              │
│                                                          │
│  Files: src/models/*.model.ts                            │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│              DATABASE (PostgreSQL)                       │
│  - Supabase client connection                            │
│  - SQL queries                                           │
│  - Data persistence                                      │
└─────────────────────────────────────────────────────────┘
```

**Request Flow Example (Create Order):**

```
1. POST /api/orders
   ↓
2. Routes: orderRoutes.post('/', authenticate, validate(orderSchema), createOrder)
   ↓
3. Middleware: 
   - authenticate → Verify JWT token
   - validate → Check request body against Zod schema
   ↓
4. Controller: orderController.createOrder()
   - Extract userId from req.user
   - Extract order data from req.body
   - Call orderService.createOrder(userId, orderData)
   ↓
5. Service: orderService.createOrder()
   - Validate cart items
   - Check product stock
   - Calculate totals
   - Create order in database
   - Update product stock
   - Clear user's cart
   - Return order object
   ↓
6. Controller: Format response
   - res.status(201).json({ success: true, data: order })
   ↓
7. Response sent to client
```

---

## Data Flow Diagrams

### Authentication Flow

```
┌──────────┐                                    ┌──────────┐
│  Client  │                                    │  Server  │
└────┬─────┘                                    └────┬─────┘
     │                                               │
     │  POST /api/auth/login                         │
     │  { email, password }                          │
     ├──────────────────────────────────────────────►│
     │                                               │
     │                                    Validate credentials
     │                                    Generate JWT tokens
     │                                    (access + refresh)
     │                                               │
     │  200 OK                                       │
     │  { accessToken, user }                        │
     │◄──────────────────────────────────────────────┤
     │                                               │
Store token in cookie                                │
Update auth store                                    │
     │                                               │
     │  GET /api/products (with token)               │
     │  Authorization: Bearer <token>                │
     ├──────────────────────────────────────────────►│
     │                                               │
     │                                    Verify JWT token
     │                                    Extract user info
     │                                    Fetch products
     │                                               │
     │  200 OK                                       │
     │  { products: [...] }                          │
     │◄──────────────────────────────────────────────┤
     │                                               │
```

### Order Placement Flow

```
Customer                Cart Store              Backend API              Database
   │                        │                        │                      │
   │ Add to Cart            │                        │                      │
   ├───────────────────────►│                        │                      │
   │                        │ POST /api/cart/items   │                      │
   │                        ├───────────────────────►│                      │
   │                        │                        │ INSERT cart_items    │
   │                        │                        ├─────────────────────►│
   │                        │                        │◄─────────────────────┤
   │                        │◄───────────────────────┤                      │
   │◄───────────────────────┤                        │                      │
   │                        │                        │                      │
   │ Apply Coupon           │                        │                      │
   ├───────────────────────►│                        │                      │
   │                        │ POST /api/cart/coupon  │                      │
   │                        ├───────────────────────►│                      │
   │                        │                        │ Validate coupon      │
   │                        │                        ├─────────────────────►│
   │                        │                        │◄─────────────────────┤
   │                        │                        │ Update cart totals   │
   │                        │◄───────────────────────┤                      │
   │◄───────────────────────┤                        │                      │
   │                        │                        │                      │
   │ Checkout               │                        │                      │
   ├───────────────────────►│                        │                      │
   │                        │ POST /api/orders       │                      │
   │                        ├───────────────────────►│                      │
   │                        │                        │ BEGIN TRANSACTION    │
   │                        │                        ├─────────────────────►│
   │                        │                        │ INSERT order         │
   │                        │                        ├─────────────────────►│
   │                        │                        │ INSERT order_items   │
   │                        │                        ├─────────────────────►│
   │                        │                        │ UPDATE product stock │
   │                        │                        ├─────────────────────►│
   │                        │                        │ DELETE cart          │
   │                        │                        ├─────────────────────►│
   │                        │                        │ COMMIT               │
   │                        │                        ├─────────────────────►│
   │                        │                        │◄─────────────────────┤
   │                        │◄───────────────────────┤                      │
   │◄───────────────────────┤                        │                      │
   │                        │                        │                      │
   │ Redirect to success    │                        │                      │
   │                        │                        │                      │
```

---

## Database Schema Relationships

```
┌──────────────┐
│    users     │
└──────┬───────┘
       │ 1
       │
       │ *
┌──────┴───────┐     ┌──────────────┐
│    orders    │────►│ order_items  │
└──────┬───────┘  *  └──────┬───────┘
       │                     │
       │ *                   │ *
       │              ┌──────┴───────┐
       │              │   products   │
       │              └──────┬───────┘
       │                     │ *
       │              ┌──────┴───────┐
       │              │   reviews    │
       │              └──────────────┘
       │
       │ 1
┌──────┴───────┐
│    carts     │
└──────┬───────┘
       │ *
┌──────┴───────┐
│  cart_items  │
└──────────────┘

┌──────────────┐
│  categories  │
└──────┬───────┘
       │ 1
       │
       │ *
┌──────┴───────┐
│   products   │
└──────┬───────┘
       │ *
       │
┌──────┴───────┐
│    brands    │
└──────────────┘

┌──────────────┐
│   suppliers  │
└──────┬───────┘
       │ 1
       │
       │ *
┌──────┴────────────┐
│ supplier_entries  │
└───────────────────┘
```

---

## State Management Architecture

### Frontend State (Zustand)

```typescript
// Auth Store
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => Promise<void>;
}

// Cart Store
interface CartState {
  items: CartItem[];
  subtotal: number;
  discount: number;
  deliveryCharge: number;
  total: number;
  coupon: Coupon | null;
  addItem: (productId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  applyCoupon: (code: string) => Promise<void>;
  clearCart: () => Promise<void>;
}

// Wishlist Store
interface WishlistState {
  items: Product[];
  addToWishlist: (productId: string) => Promise<void>;
  removeFromWishlist: (productId: string) => Promise<void>;
  isInWishlist: (productId: string) => boolean;
}

// Compare Store
interface CompareState {
  products: Product[];
  addToCompare: (product: Product) => void;
  removeFromCompare: (productId: string) => void;
  clearCompare: () => void;
}
```

---

## Security Architecture

### Multi-Layer Security

```
┌─────────────────────────────────────────────────────────┐
│                    SECURITY LAYERS                       │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  1. Network Layer                                        │
│     - HTTPS/TLS encryption                               │
│     - CORS whitelisting                                  │
│     - Rate limiting (1500 req/15min)                     │
│                                                          │
│  2. Application Layer                                    │
│     - Helmet security headers                            │
│     - XSS protection (input sanitization)                │
│     - CSRF protection                                    │
│     - Content Security Policy                            │
│                                                          │
│  3. Authentication Layer                                 │
│     - JWT tokens (access + refresh)                      │
│     - httpOnly cookies                                   │
│     - Token expiry (7d access, 30d refresh)              │
│     - Secure password hashing (bcrypt, 12 rounds)        │
│                                                          │
│  4. Authorization Layer                                  │
│     - Role-based access control (user/admin)             │
│     - Resource-level permissions                         │
│     - Blocked user check                                 │
│                                                          │
│  5. Data Layer                                           │
│     - Input validation (Zod schemas)                     │
│     - SQL injection prevention (parameterized queries)   │
│     - Database encryption at rest                        │
│     - Row-level security (Supabase RLS)                  │
│                                                          │
│  6. Logging & Monitoring                                 │
│     - Winston logging (info, warn, error)                │
│     - Activity logs for admin actions                    │
│     - Error tracking                                     │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## Deployment Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   PRODUCTION SETUP                       │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Frontend (Vercel)                                       │
│  - amohamobiles.com                                      │
│  - Next.js SSR/SSG                                       │
│  - Edge caching                                          │
│  - Auto-scaling                                          │
│                                                          │
│  Admin Panel (Vercel)                                    │
│  - admin.amohamobiles.com                                │
│  - Next.js SSR                                           │
│  - Protected routes                                      │
│                                                          │
│  Backend API (Render)                                    │
│  - amoha-backend-v2.onrender.com                         │
│  - Node.js server                                        │
│  - Auto-deploy from Git                                  │
│  - Health check endpoint                                 │
│  - Keep-alive cron (14min ping)                          │
│                                                          │
│  Database (Supabase)                                     │
│  - PostgreSQL managed instance                           │
│  - Automatic backups                                     │
│  - Connection pooling                                    │
│  - SSL connections                                       │
│                                                          │
│  CDN (Cloudinary)                                        │
│  - Image storage and optimization                        │
│  - Automatic format conversion (WebP)                    │
│  - Responsive images                                     │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## Performance Optimization

### Backend Optimizations
- Database indexing on frequently queried columns
- Connection pooling for database
- Response compression (gzip)
- Query result caching (future enhancement)
- Pagination for large datasets
- Lazy loading of related data

### Frontend Optimizations
- Next.js automatic code splitting
- Image optimization (next/image)
- Lazy loading components
- Debounced search
- Optimistic UI updates
- Service worker caching (future)

---

## Scalability Considerations

The architecture supports horizontal scaling:

1. **Stateless API** - No session storage, uses JWT tokens
2. **Database Connection Pooling** - Handles multiple concurrent connections
3. **CDN for Static Assets** - Offloads image serving
4. **Microservices Ready** - Services can be extracted into separate apps
5. **Load Balancer Ready** - Can run multiple API instances behind load balancer

---

## Error Handling Strategy

```
Error Handling Flow

Application Error
       │
       ▼
Custom Error Class
(AppError, ValidationError, etc.)
       │
       ▼
Error Middleware
       │
       ├─── Log error (Winston)
       │
       ├─── Determine error type
       │
       ├─── Format error response
       │    {
       │      success: false,
       │      message: "User-friendly message",
       │      error: "Error details" (dev only)
       │    }
       │
       └─── Send HTTP response
            (400, 401, 403, 404, 500, etc.)
```

---

## Technology Integration Points

### External Services

1. **Supabase (PostgreSQL)**
   - Database hosting
   - Connection via @supabase/supabase-js client
   - SSL encrypted connections

2. **Cloudinary**
   - Image upload and storage
   - Automatic optimization
   - CDN delivery

3. **Razorpay**
   - Payment processing
   - Order creation
   - Payment verification

4. **Nodemailer** (Configured)
   - Email notifications
   - Password reset emails
   - Order confirmations

---

This architecture provides a solid foundation for a scalable, maintainable, and secure e-commerce platform.
