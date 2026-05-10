# 4. Project Structure

## Root Directory Structure

```
amoha-mobiles-main/
├── backend/                    # Express.js REST API
├── frontend/                   # Next.js Customer Storefront
├── admin/                      # Next.js Admin Dashboard
├── docs/                       # Documentation (this folder)
├── .gitignore                  # Git ignore rules
├── README.md                   # Project README
├── render.yaml                 # Render deployment configuration
├── deploy.ps1                  # PowerShell deployment script
├── site-audit.ps1              # Site audit script
├── _fix_render.js              # Render deployment fix script
├── AUDIT_REPORT.md             # Code audit report
├── AUDIT_REPORT_V2.md          # Updated audit report
├── CART_FIXES_REPORT.md        # Cart bug fixes report
├── CART_TESTING_REPORT.md      # Cart testing report
├── QA_REPORT.md                # Quality assurance report
└── WISHLIST_QA_REPORT.md       # Wishlist QA report
```

---

## Backend Structure (`backend/`)

```
backend/
├── src/                        # Source code
│   ├── app.ts                  # Express app configuration
│   ├── server.ts               # Server entry point
│   │
│   ├── config/                 # Configuration files
│   │   ├── cors.ts             # CORS configuration
│   │   ├── db.ts               # Database connection
│   │   ├── env.ts              # Environment variable validation
│   │   └── supabase.ts         # Supabase client setup
│   │
│   ├── controllers/            # Route handlers (28 files)
│   │   ├── admin.controller.ts         # Admin dashboard operations
│   │   ├── auth.controller.ts          # Authentication
│   │   ├── banner.controller.ts        # Banner management
│   │   ├── brand.controller.ts         # Brand CRUD
│   │   ├── cart.controller.ts          # Shopping cart
│   │   ├── category.controller.ts      # Category CRUD
│   │   ├── contact.controller.ts       # Contact form
│   │   ├── coupon.controller.ts        # Coupon management
│   │   ├── customer-mgmt.controller.ts # Customer management
│   │   ├── inventory.controller.ts     # Inventory operations
│   │   ├── order.controller.ts         # Order management
│   │   ├── payment.controller.ts       # Payment processing
│   │   ├── product.controller.ts       # Product CRUD
│   │   ├── qa.controller.ts            # Product Q&A
│   │   ├── return.controller.ts        # Return requests
│   │   ├── rfq.controller.ts           # Request for quotation
│   │   ├── service-request.controller.ts # Service requests
│   │   ├── settings.controller.ts      # Site settings
│   │   ├── supplier.controller.ts      # Supplier management
│   │   ├── upload.controller.ts        # File uploads
│   │   ├── user.controller.ts          # User management
│   │   ├── wallet.controller.ts        # Wallet operations
│   │   └── wishlist.controller.ts      # Wishlist
│   │
│   ├── errors/                 # Custom error classes
│   │   └── app-error.ts        # Base error class
│   │
│   ├── middleware/             # Express middleware
│   │   ├── auth.middleware.ts          # JWT authentication
│   │   ├── error.middleware.ts         # Error handling
│   │   ├── role.middleware.ts          # Role-based access
│   │   └── validate.middleware.ts      # Request validation
│   │
│   ├── migrations/             # Database migrations
│   │   └── v4-order-items-nullable-product.ts
│   │
│   ├── models/                 # TypeScript interfaces (24 files)
│   │   ├── activity-log.model.ts
│   │   ├── banner.model.ts
│   │   ├── brand.model.ts
│   │   ├── cart.model.ts
│   │   ├── category.model.ts
│   │   ├── contact-message.model.ts
│   │   ├── coupon.model.ts
│   │   ├── crm-note.model.ts
│   │   ├── customer-mgmt.model.ts
│   │   ├── image.model.ts
│   │   ├── inventory.model.ts
│   │   ├── notification.model.ts
│   │   ├── order.model.ts
│   │   ├── product-qa.model.ts
│   │   ├── product-view.model.ts
│   │   ├── product.model.ts
│   │   ├── return-request.model.ts
│   │   ├── service-request.model.ts
│   │   ├── settings.model.ts
│   │   ├── supplier-entry.model.ts
│   │   ├── supplier.model.ts
│   │   ├── user.model.ts
│   │   ├── wallet.model.ts
│   │   └── wishlist.model.ts
│   │
│   ├── routes/                 # API route definitions (28 files)
│   │   ├── index.ts            # Main router (combines all routes)
│   │   ├── activity-log.routes.ts
│   │   ├── admin.routes.ts     # Admin-specific routes
│   │   ├── auth.routes.ts
│   │   ├── banner.routes.ts
│   │   ├── brand.routes.ts
│   │   ├── cart.routes.ts
│   │   ├── category.routes.ts
│   │   ├── contact.routes.ts
│   │   ├── coupon.routes.ts
│   │   ├── customer-mgmt.routes.ts
│   │   ├── inventory.routes.ts
│   │   ├── inventory-ledger.routes.ts
│   │   ├── order.routes.ts
│   │   ├── payment.routes.ts
│   │   ├── product.routes.ts
│   │   ├── purchase-request.routes.ts
│   │   ├── qa.routes.ts
│   │   ├── return.routes.ts
│   │   ├── rfq.routes.ts
│   │   ├── service-request.routes.ts
│   │   ├── settings.routes.ts
│   │   ├── supplier.routes.ts
│   │   ├── supplier-entry.routes.ts
│   │   ├── upload.routes.ts
│   │   ├── user.routes.ts
│   │   ├── wallet.routes.ts
│   │   └── wishlist.routes.ts
│   │
│   ├── seeds/                  # Database seeding
│   │   └── seed.ts             # Seed script with sample data
│   │
│   ├── services/               # Business logic layer (32 files)
│   │   ├── activity-log.service.ts
│   │   ├── admin.service.ts
│   │   ├── auth.service.ts
│   │   ├── banner.service.ts
│   │   ├── brand.service.ts
│   │   ├── cart.service.ts
│   │   ├── category.service.ts
│   │   ├── contact.service.ts
│   │   ├── coupon.service.ts
│   │   ├── customer-mgmt.service.ts
│   │   ├── inventory.service.ts
│   │   ├── inventory-ledger.service.ts
│   │   ├── order.service.ts
│   │   ├── payment.service.ts
│   │   ├── product.service.ts
│   │   ├── purchase-request.service.ts
│   │   ├── qa.service.ts
│   │   ├── return.service.ts
│   │   ├── rfq.service.ts
│   │   ├── service-request.service.ts
│   │   ├── settings.service.ts
│   │   ├── supplier.service.ts
│   │   ├── supplier-entry.service.ts
│   │   ├── upload.service.ts
│   │   ├── user.service.ts
│   │   ├── wallet.service.ts
│   │   └── wishlist.service.ts
│   │
│   ├── tests/                  # Test files
│   │   └── (test files)
│   │
│   ├── types/                  # TypeScript type definitions
│   │   └── index.ts
│   │
│   ├── utils/                  # Utility functions (10 files)
│   │   ├── jwt.util.ts         # JWT token generation/verification
│   │   ├── logger.util.ts      # Winston logger setup
│   │   ├── password.util.ts    # Password hashing/verification
│   │   ├── rate-limit.util.ts  # Rate limiting helpers
│   │   ├── response.util.ts    # Response formatting
│   │   └── (other utilities)
│   │
│   └── validators/             # Zod validation schemas (14 files)
│       ├── auth.validator.ts
│       ├── cart.validator.ts
│       ├── order.validator.ts
│       ├── product.validator.ts
│       └── (other validators)
│
├── dist/                       # Compiled JavaScript (gitignored)
├── logs/                       # Log files (gitignored)
│   ├── combined.log            # All logs
│   └── error.log               # Error logs only
│
├── node_modules/               # Dependencies (gitignored)
├── .env                        # Environment variables (gitignored)
├── .gitignore                  # Git ignore rules
├── package.json                # Dependencies and scripts
├── package-lock.json           # Locked dependency versions
├── tsconfig.json               # TypeScript configuration
├── start.js                    # Production startup script
├── render-create.json          # Render service creation config
├── run-migration.js            # Migration runner
├── run-migration-v4.js         # V4 migration runner
├── supabase-migration.sql      # Main database schema
├── supabase-migration-v2.sql   # Schema updates v2
├── supabase-migration-v3.sql   # Schema updates v3
├── supabase-migration-v4.sql   # Schema updates v4
├── supabase-migration-v5.sql   # Schema updates v5
├── supabase-alter-columns.sql  # Column alterations
├── test-api.ps1                # API testing script
├── test-cart-api.ps1           # Cart API testing
├── test-cart-simple.ps1        # Simple cart tests
├── test-cart.ps1               # Cart testing
├── test-e2e.js                 # E2E test runner
├── test-e2e.ps1                # E2E test script
└── test-new-features.ps1       # New features testing
```

### Backend Key Files Explained

- **`src/app.ts`** - Express app setup with middleware (CORS, helmet, compression, etc.)
- **`src/server.ts`** - Server startup, database connection, graceful shutdown
- **`src/config/env.ts`** - Environment variable validation with Zod
- **`src/routes/index.ts`** - Main router that combines all route modules
- **Controllers** - Handle HTTP requests, call services, format responses
- **Services** - Business logic, database queries, external API calls
- **Models** - TypeScript interfaces for database entities
- **Validators** - Zod schemas for request validation
- **Middleware** - Authentication, authorization, validation, error handling

---

## Frontend Structure (`frontend/`)

```
frontend/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── layout.tsx          # Root layout with providers
│   │   ├── page.tsx            # Homepage
│   │   ├── globals.css         # Global styles
│   │   ├── error.tsx           # Error boundary
│   │   ├── not-found.tsx       # 404 page
│   │   ├── global-error.tsx    # Global error handler
│   │   │
│   │   ├── about/              # About page
│   │   ├── cart/               # Shopping cart
│   │   │   ├── page.tsx
│   │   │   └── loading.tsx
│   │   │
│   │   ├── categories/         # Categories listing
│   │   ├── category/           # Category detail
│   │   │   └── [slug]/
│   │   │
│   │   ├── checkout/           # Checkout flow
│   │   │   ├── page.tsx
│   │   │   └── loading.tsx
│   │   │
│   │   ├── compare/            # Product comparison
│   │   ├── contact/            # Contact page
│   │   ├── forgot-password/    # Password reset request
│   │   ├── login/              # Login page
│   │   ├── register/           # Registration page
│   │   ├── reset-password/     # Password reset
│   │   │
│   │   ├── order-success/      # Order confirmation
│   │   │   └── page.tsx
│   │   │
│   │   ├── orders/             # Order history
│   │   │   ├── page.tsx
│   │   │   └── [id]/           # Order detail
│   │   │
│   │   ├── product/            # Product detail
│   │   │   └── [slug]/
│   │   │       └── page.tsx
│   │   │
│   │   ├── products/           # Product catalog
│   │   │   ├── page.tsx
│   │   │   ├── loading.tsx
│   │   │   └── [category]/
│   │   │
│   │   ├── profile/            # User profile
│   │   │   └── page.tsx
│   │   │
│   │   ├── returns/            # Return requests
│   │   ├── search/             # Search results
│   │   ├── services/           # Service requests
│   │   ├── shop/               # Shop page
│   │   ├── supplier/           # Supplier pages
│   │   ├── track-order/        # Order tracking
│   │   ├── wallet/             # Digital wallet
│   │   ├── wishlist/           # Wishlist
│   │   │
│   │   └── (policy pages)
│   │       ├── privacy-policy/
│   │       ├── return-policy/
│   │       ├── shipping-info/
│   │       └── terms/
│   │
│   ├── components/             # React components
│   │   ├── layout/             # Layout components
│   │   │   ├── Header.tsx
│   │   │   ├── Footer.tsx
│   │   │   ├── Navbar.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── ClientAuthGuard.tsx
│   │   │   └── ThemeProvider.tsx
│   │   │
│   │   ├── product/            # Product components
│   │   │   ├── ProductCard.tsx
│   │   │   ├── ProductGrid.tsx
│   │   │   ├── ProductFilters.tsx
│   │   │   ├── ProductSort.tsx
│   │   │   └── ProductDetail.tsx
│   │   │
│   │   ├── cart/               # Cart components
│   │   │   ├── CartItem.tsx
│   │   │   ├── CartSummary.tsx
│   │   │   └── CouponInput.tsx
│   │   │
│   │   ├── ui/                 # UI primitives
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── LoadingBar.tsx
│   │   │   └── (Radix UI wrappers)
│   │   │
│   │   └── shared/             # Shared components
│   │       ├── LoadingSpinner.tsx
│   │       ├── ErrorMessage.tsx
│   │       └── Pagination.tsx
│   │
│   ├── hooks/                  # Custom React hooks
│   │   ├── useAuth.ts
│   │   └── useDebounce.ts
│   │
│   ├── lib/                    # Libraries and utilities
│   │   ├── api.ts              # Axios instance
│   │   └── utils.ts            # Utility functions
│   │
│   ├── services/               # API service functions (12 files)
│   │   ├── authService.ts
│   │   ├── productService.ts
│   │   ├── cartService.ts
│   │   ├── orderService.ts
│   │   ├── userService.ts
│   │   ├── wishlistService.ts
│   │   ├── categoryService.ts
│   │   ├── brandService.ts
│   │   ├── bannerService.ts
│   │   ├── couponService.ts
│   │   ├── returnService.ts
│   │   └── walletService.ts
│   │
│   ├── store/                  # Zustand state stores
│   │   ├── auth.store.ts       # Authentication state
│   │   ├── cart.store.ts       # Shopping cart state
│   │   ├── wishlist.store.ts   # Wishlist state
│   │   ├── compare.store.ts    # Product comparison state
│   │   └── ui.store.ts         # UI state (modals, etc.)
│   │
│   ├── types/                  # TypeScript types
│   │   ├── index.ts
│   │   └── api.ts
│   │
│   └── middleware.ts           # Next.js middleware (auth guards)
│
├── public/                     # Static assets
│   ├── images/
│   │   ├── logo.png
│   │   ├── no-image.svg
│   │   └── (other images)
│   └── favicon.ico
│
├── e2e/                        # Playwright E2E tests
│   └── (test files)
│
├── .next/                      # Next.js build output (gitignored)
├── node_modules/               # Dependencies (gitignored)
├── .env.local                  # Environment variables (gitignored)
├── .gitignore
├── next.config.js              # Next.js configuration
├── next-env.d.ts               # Next.js TypeScript declarations
├── package.json
├── package-lock.json
├── playwright.config.ts        # Playwright configuration
├── postcss.config.js           # PostCSS configuration
├── tailwind.config.ts          # Tailwind CSS configuration
├── tsconfig.json               # TypeScript configuration
├── tsconfig.tsbuildinfo        # TypeScript build info (gitignored)
└── vercel.json                 # Vercel deployment config
```

### Frontend Key Files Explained

- **`src/app/layout.tsx`** - Root layout with theme provider, toast notifications, auth guard
- **`src/app/page.tsx`** - Homepage with hero banners, featured products, categories
- **`src/middleware.ts`** - Next.js middleware for protected routes
- **`src/store/*.store.ts`** - Zustand stores for global state management
- **`src/services/*.ts`** - API service functions that call backend endpoints
- **`src/components/`** - Reusable React components
- **`tailwind.config.ts`** - Custom Tailwind theme (colors, animations, shadows)

---

## Admin Structure (`admin/`)

```
admin/
├── src/
│   ├── app/
│   │   ├── layout.tsx          # Root layout
│   │   ├── page.tsx            # Redirect to dashboard
│   │   ├── globals.css         # Global styles
│   │   │
│   │   ├── (auth)/             # Auth layout group
│   │   │   ├── layout.tsx
│   │   │   └── login/
│   │   │       └── page.tsx
│   │   │
│   │   └── (admin)/            # Admin layout group (protected)
│   │       ├── layout.tsx      # Admin layout with sidebar
│   │       │
│   │       ├── dashboard/      # Analytics dashboard
│   │       │   └── page.tsx
│   │       │
│   │       ├── products/       # Product management
│   │       │   ├── page.tsx            # Product list
│   │       │   ├── new/                # Create product
│   │       │   ├── [id]/               # Edit product
│   │       │   └── bulk-upload/        # Bulk upload
│   │       │
│   │       ├── orders/         # Order management
│   │       │   ├── page.tsx
│   │       │   └── [id]/       # Order detail
│   │       │
│   │       ├── users/          # User management
│   │       ├── customers/      # Customer management
│   │       ├── categories/     # Category CRUD
│   │       ├── brands/         # Brand CRUD
│   │       ├── banners/        # Banner management
│   │       ├── coupons/        # Coupon management
│   │       ├── reviews/        # Review moderation
│   │       ├── inventory/      # Inventory management
│   │       │   ├── page.tsx
│   │       │   └── ledger/     # Inventory ledger
│   │       │
│   │       ├── suppliers/      # Supplier management
│   │       ├── supplier-entries/ # Supplier entries
│   │       ├── purchase-requests/ # Purchase requests
│   │       ├── rfq/            # Request for quotation
│   │       ├── returns/        # Return requests
│   │       ├── service-requests/ # Service requests
│   │       ├── wallets/        # Wallet management
│   │       ├── contact-messages/ # Contact inquiries
│   │       ├── activity-logs/  # Activity logs
│   │       ├── notifications/  # Notifications
│   │       ├── product-views/  # Product analytics
│   │       ├── abandoned-carts/ # Abandoned cart recovery
│   │       ├── crm/            # Customer relationship management
│   │       ├── barcode/        # Barcode generation
│   │       ├── reports/        # Sales reports
│   │       ├── policies/       # Policy management
│   │       └── settings/       # Site settings
│   │
│   ├── components/             # React components
│   │   ├── layout/             # Layout components
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Header.tsx
│   │   │   ├── Breadcrumbs.tsx
│   │   │   └── theme-provider.tsx
│   │   │
│   │   ├── charts/             # Dashboard charts
│   │   │   ├── RevenueChart.tsx
│   │   │   ├── OrdersChart.tsx
│   │   │   └── TopProductsChart.tsx
│   │   │
│   │   ├── shared/             # Shared components
│   │   │   ├── DataTable.tsx
│   │   │   ├── loading-bar.tsx
│   │   │   └── StatusBadge.tsx
│   │   │
│   │   └── ui/                 # UI primitives (Radix UI)
│   │
│   ├── lib/                    # Libraries
│   │   ├── api.ts              # Axios instance
│   │   └── utils.ts
│   │
│   ├── services/               # API services (27 files)
│   │   ├── adminService.ts
│   │   ├── productService.ts
│   │   ├── orderService.ts
│   │   ├── userService.ts
│   │   ├── categoryService.ts
│   │   ├── brandService.ts
│   │   ├── bannerService.ts
│   │   ├── couponService.ts
│   │   ├── inventoryService.ts
│   │   ├── supplierService.ts
│   │   └── (other services)
│   │
│   ├── store/                  # Zustand stores
│   │   └── auth.store.ts
│   │
│   └── types/                  # TypeScript types
│       └── index.ts
│
├── public/
│   └── images/
│
├── e2e/                        # Playwright tests
├── .next/                      # Build output (gitignored)
├── node_modules/
├── .env.local                  # Environment variables (gitignored)
├── next.config.js
├── package.json
├── playwright.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── vercel.json
```

### Admin Key Files Explained

- **`src/app/(admin)/layout.tsx`** - Admin layout with sidebar navigation
- **`src/app/(admin)/dashboard/page.tsx`** - Analytics dashboard with charts
- **`src/components/charts/`** - Recharts components for data visualization
- **`src/services/*.ts`** - API calls to backend admin endpoints

---

## Configuration Files

### Backend (`backend/tsconfig.json`)
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "CommonJS",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "baseUrl": "./src",
    "paths": {
      "@config/*": ["config/*"],
      "@controllers/*": ["controllers/*"],
      "@models/*": ["models/*"],
      "@routes/*": ["routes/*"],
      "@services/*": ["services/*"],
      "@middleware/*": ["middleware/*"],
      "@utils/*": ["utils/*"],
      "@validators/*": ["validators/*"],
      "@errors/*": ["errors/*"],
      "@types/*": ["types/*"]
    }
  }
}
```

### Frontend/Admin (`tsconfig.json`)
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

---

## Important Directories

### Gitignored Directories
- `node_modules/` - Dependencies (all three apps)
- `dist/` - Compiled backend code
- `.next/` - Next.js build output
- `logs/` - Backend log files
- `.vercel/` - Vercel deployment cache

### Version Controlled
- `src/` - All source code
- `public/` - Static assets
- `e2e/` - Test files
- `docs/` - Documentation

---

## File Naming Conventions

### Backend
- **Controllers:** `*.controller.ts` (e.g., `product.controller.ts`)
- **Services:** `*.service.ts` (e.g., `product.service.ts`)
- **Routes:** `*.routes.ts` (e.g., `product.routes.ts`)
- **Models:** `*.model.ts` (e.g., `product.model.ts`)
- **Validators:** `*.validator.ts` (e.g., `product.validator.ts`)
- **Middleware:** `*.middleware.ts` (e.g., `auth.middleware.ts`)
- **Utils:** `*.util.ts` (e.g., `jwt.util.ts`)

### Frontend/Admin
- **Pages:** `page.tsx` (Next.js App Router convention)
- **Layouts:** `layout.tsx` (Next.js App Router convention)
- **Components:** PascalCase (e.g., `ProductCard.tsx`)
- **Services:** camelCase (e.g., `productService.ts`)
- **Stores:** `*.store.ts` (e.g., `auth.store.ts`)
- **Hooks:** `use*.ts` (e.g., `useAuth.ts`)

---

## Path Aliases

### Backend
- `@config/*` → `src/config/*`
- `@controllers/*` → `src/controllers/*`
- `@services/*` → `src/services/*`
- `@models/*` → `src/models/*`
- `@routes/*` → `src/routes/*`
- `@middleware/*` → `src/middleware/*`
- `@utils/*` → `src/utils/*`
- `@validators/*` → `src/validators/*`
- `@errors/*` → `src/errors/*`
- `@types/*` → `src/types/*`

### Frontend/Admin
- `@/*` → `src/*`

---

This structure provides clear separation of concerns, making the codebase easy to navigate and maintain.
