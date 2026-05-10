# 1. Project Overview

## What is AMOHA Mobiles?

**AMOHA Mobiles** is a production-ready, full-stack e-commerce web application designed for selling smartphones, mobile accessories, and related products. It provides a complete online shopping experience with separate interfaces for customers and administrators.

---

## Main Purpose

The platform serves three primary purposes:

1. **Customer Shopping Experience** - Browse, search, compare, and purchase mobile phones and accessories online
2. **Business Management** - Comprehensive admin dashboard for managing products, orders, inventory, and customers
3. **API Services** - RESTful API backend that powers both frontend applications and can be integrated with third-party systems

---

## Key Use Cases

### For Customers
- Browse and search smartphones by brand, price, specifications
- Compare multiple products side-by-side
- Add products to cart and wishlist
- Apply discount coupons
- Place orders with multiple payment options (COD, Razorpay)
- Track order status in real-time
- Manage profile and addresses
- View order history
- Submit product reviews and ratings
- Request returns and refunds
- Use digital wallet for payments

### For Administrators
- Manage product catalog (CRUD operations)
- Handle inventory and stock levels
- Process and track orders
- Manage customers and user accounts
- Create and manage discount coupons
- Upload and manage banners
- View sales analytics and reports
- Handle service requests
- Manage suppliers and purchase orders
- Generate invoices and barcodes
- Track product views and analytics
- Manage customer relationships (CRM)

### For Business Operations
- Walk-in customer sales (POS functionality)
- Supplier management and procurement
- Request for Quotation (RFQ) system
- Inventory ledger tracking
- Return and refund processing
- Customer wallet management
- Activity logging and audit trails

---

## Key Features

### 🛍️ Customer Storefront Features

#### Shopping Experience
- **Homepage**
  - Auto-rotating hero banners
  - Featured deals section
  - Trending products
  - New arrivals
  - Shop by category
  - Brand showcase

- **Product Catalog**
  - Advanced filtering (brand, price, RAM, storage, battery, ratings)
  - Multiple sorting options (newest, price, popularity, ratings)
  - Pagination with customizable items per page
  - Grid/list view toggle
  - Quick view functionality

- **Product Detail Page**
  - High-quality image gallery with zoom
  - Complete specifications table
  - Color selection
  - Stock availability indicator
  - Customer reviews and ratings
  - Related products suggestions
  - Add to cart/wishlist buttons
  - Share product functionality

- **Search & Discovery**
  - Real-time search with suggestions
  - Search by product name, brand, or specifications
  - Category-based browsing
  - Brand-based filtering

#### Shopping Cart & Checkout
- **Shopping Cart**
  - Add/remove items
  - Quantity management
  - Real-time price calculation
  - Coupon code application
  - Automatic delivery charge calculation (free above ₹500)
  - Cart persistence across sessions

- **Checkout Process**
  - Address management (home/work/other)
  - Multiple saved addresses
  - Order summary with breakdown
  - Payment method selection (COD, Razorpay)
  - Order confirmation

#### User Features
- **Wishlist**
  - Save favorite products
  - Move to cart functionality
  - Remove items
  - Wishlist persistence

- **Product Comparison**
  - Compare up to 4 products side-by-side
  - Specification comparison table
  - Price comparison
  - Quick add to cart

- **Order Management**
  - Order history with filters
  - Detailed order tracking
  - Status updates (placed → delivered)
  - Cancel orders (before shipping)
  - Download invoices
  - Request returns

- **User Profile**
  - Edit personal information
  - Manage multiple addresses
  - Change password
  - View order history
  - Wallet balance and transactions

- **Authentication**
  - User registration with email verification
  - Secure login with JWT tokens
  - Password reset via email
  - Remember me functionality
  - Auto-logout on token expiry

#### Additional Features
- **Wallet System**
  - Digital wallet for payments
  - Add money to wallet
  - Use wallet balance for orders
  - Transaction history

- **Return Requests**
  - Submit return requests
  - Upload images for proof
  - Track return status
  - Refund processing

- **Service Requests**
  - Submit service/repair requests
  - Track request status
  - Upload device images

- **Contact & Support**
  - Contact form
  - Live support information
  - FAQ section
  - Policy pages (privacy, returns, shipping, terms)

---

### 🔧 Admin Dashboard Features

#### Dashboard Analytics
- Revenue statistics (today, week, month, year)
- Order counts by status
- Top-selling products
- Monthly revenue charts
- Recent orders overview
- Low stock alerts
- Customer statistics

#### Product Management
- **CRUD Operations**
  - Create new products with full details
  - Edit existing products
  - Delete products
  - Bulk operations

- **Product Details**
  - Name, description, short description
  - Pricing (original price, sale price, discount)
  - Multiple images upload (Cloudinary)
  - Video links
  - Complete specifications (30+ fields)
  - Stock management
  - SKU and barcode generation
  - Tags for SEO
  - Featured/trending flags
  - Color variants
  - Warranty information
  - Condition (new/used/refurbished)
  - Related accessories

#### Inventory Management
- Stock level tracking
- Low stock alerts
- Inventory ledger with transaction history
- Supplier entry management
- Purchase request system
- Stock adjustments

#### Order Management
- View all orders with filters
- Order details with customer info
- Update order status (placed → confirmed → processing → shipped → delivered)
- Assign tracking numbers
- Logistics partner selection
- Print invoices
- Process refunds
- Handle cancellations
- Walk-in order creation (POS)

#### Customer Management
- View all customers
- Customer details and order history
- Block/unblock users
- Delete accounts
- Customer wallet management
- CRM notes and interactions
- Activity logs

#### Category & Brand Management
- Create/edit/delete categories
- Category images and descriptions
- Product count per category
- Create/edit/delete brands
- Brand logos and descriptions

#### Banner Management
- Upload hero banners
- Set banner order
- Toggle active/inactive
- Link banners to products/categories
- Schedule banners (future feature)

#### Coupon Management
- Create discount coupons
- Coupon types (percentage/fixed amount)
- Set minimum order value
- Maximum discount cap
- Expiry dates
- Usage limits
- Active/inactive toggle

#### Review Management
- View all product reviews
- Moderate reviews
- Delete inappropriate reviews
- Respond to reviews (future feature)

#### Reports & Analytics
- Sales reports by date range
- Product performance reports
- Customer analytics
- Revenue trends
- Export reports (CSV/PDF)

#### Supplier Management
- Supplier directory
- Contact information
- Product catalog per supplier
- Purchase history
- RFQ (Request for Quotation) system

#### Additional Admin Features
- **Settings Management**
  - Site settings
  - Payment gateway configuration
  - Email settings
  - Shipping settings

- **Barcode Generation**
  - Generate product barcodes
  - Print barcode labels

- **Activity Logs**
  - Track all admin actions
  - User activity monitoring
  - Audit trail

- **Notifications**
  - System notifications
  - Order alerts
  - Low stock alerts

- **Contact Messages**
  - View customer inquiries
  - Respond to messages
  - Mark as resolved

---

### 🔒 Backend API Features

#### Architecture
- **RESTful API Design** - Clean, well-structured endpoints
- **Layered Architecture** - Routes → Controllers → Services → Database
- **TypeScript** - Full type safety across the codebase
- **PostgreSQL (Supabase)** - Robust relational database with proper indexing

#### Authentication & Security
- **JWT Authentication** - Access + Refresh token strategy
- **Role-Based Access Control** - User and admin roles
- **Secure Cookie Handling** - httpOnly cookies for tokens
- **Password Security** - bcrypt hashing with salt rounds
- **Input Validation** - Zod schemas on all endpoints
- **XSS Protection** - Input sanitization
- **CORS Configuration** - Whitelist allowed origins
- **Rate Limiting** - Prevent DDoS attacks
- **Helmet Security Headers** - HTTP security headers

#### Data Management
- **Database Indexing** - Compound indexes for performance
- **Full-Text Search** - Product search on name, description, tags
- **Data Validation** - Server-side validation with Zod
- **Error Handling** - Centralized error handling with custom error classes
- **Logging** - Winston logger with file rotation
- **Graceful Shutdown** - Clean server shutdown handling

#### API Features
- **Pagination** - Efficient data loading
- **Filtering & Sorting** - Advanced query capabilities
- **Image Upload** - Cloudinary integration
- **Payment Processing** - Razorpay integration
- **Email Notifications** - Nodemailer integration (configured)
- **PDF Generation** - Invoice generation with PDFKit
- **Barcode Generation** - EAN-13 barcode generation

---

## Application Ports

| Application | Port | URL |
|------------|------|-----|
| **Backend API** | 5001 | http://localhost:5001 |
| **Frontend (Customer)** | 3002 | http://localhost:3002 |
| **Admin Panel** | 3003 | http://localhost:3003 |

---

## Target Audience

### Primary Users
- **Customers** - Individuals looking to purchase smartphones and accessories online
- **Business Owners** - Store managers and administrators managing the e-commerce operations
- **Suppliers** - Vendors providing products to the store

### Secondary Users
- **Developers** - Can extend or integrate with the API
- **Support Staff** - Customer service representatives handling inquiries

---

## Business Model

The platform supports multiple business models:

1. **B2C E-commerce** - Direct sales to consumers
2. **Retail POS** - Walk-in customer sales
3. **Supplier Management** - B2B procurement
4. **Service Center** - Device repair and service requests

---

## Competitive Advantages

1. **Modern Tech Stack** - Built with latest technologies (Next.js 14, TypeScript, PostgreSQL)
2. **Production-Ready** - Deployed and running in production
3. **Comprehensive Features** - Complete e-commerce functionality out of the box
4. **Scalable Architecture** - Designed for growth
5. **Mobile-First Design** - Responsive across all devices
6. **SEO Optimized** - Next.js SSR for better search rankings
7. **Type Safety** - TypeScript across entire stack
8. **Security First** - Multiple security layers implemented
9. **Performance Optimized** - Fast load times, efficient queries
10. **Well Documented** - Comprehensive documentation

---

## Success Metrics

The platform tracks:
- Total revenue and sales
- Order conversion rates
- Customer acquisition and retention
- Product performance
- Cart abandonment rates
- Customer satisfaction (reviews/ratings)
- Page views and user engagement
- Inventory turnover

---

## Future Roadmap

Potential enhancements:
- Mobile apps (React Native)
- Multi-language support
- Multi-currency support
- Advanced analytics dashboard
- AI-powered product recommendations
- Live chat support
- Social media integration
- Loyalty program
- Subscription model for accessories
- Augmented Reality (AR) product preview
