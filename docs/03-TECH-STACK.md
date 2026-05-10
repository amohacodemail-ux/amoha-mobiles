# 3. Tech Stack

## Overview

AMOHA Mobiles is built with a modern, production-ready technology stack focused on **type safety**, **performance**, and **developer experience**.

---

## Frontend & Admin Panel

### Core Framework

#### **Next.js 14.2.29**
- **Purpose:** React framework for building server-side rendered and static web applications
- **Why:** 
  - App Router for modern routing
  - Server-side rendering (SSR) for better SEO
  - Automatic code splitting
  - Built-in image optimization
  - Fast refresh for development
  - Production-ready out of the box
- **Usage:** Both customer frontend and admin panel

#### **React 18.3.1**
- **Purpose:** UI library for building component-based interfaces
- **Why:**
  - Component reusability
  - Virtual DOM for performance
  - Large ecosystem
  - Concurrent features
- **Usage:** UI components across both applications

#### **TypeScript 5.7.3**
- **Purpose:** Typed superset of JavaScript
- **Why:**
  - Type safety catches errors at compile time
  - Better IDE autocomplete and IntelliSense
  - Self-documenting code
  - Easier refactoring
  - Improved maintainability
- **Usage:** 100% TypeScript codebase (frontend, admin, backend)

---

### Styling

#### **Tailwind CSS 3.4.17**
- **Purpose:** Utility-first CSS framework
- **Why:**
  - Rapid UI development
  - Consistent design system
  - Small bundle size (purges unused CSS)
  - Responsive design utilities
  - Dark mode support
  - Customizable theme
- **Usage:** All styling across frontend and admin
- **Custom Configuration:**
  - Custom color palette (primary, accent, glass effects)
  - Custom animations (shimmer, float, pulse-glow)
  - Glassmorphism utilities
  - Extended shadows and gradients

#### **PostCSS 8.5.1**
- **Purpose:** CSS transformation tool
- **Why:** Required for Tailwind CSS processing
- **Usage:** Build-time CSS processing

#### **Autoprefixer 10.4.20**
- **Purpose:** Adds vendor prefixes to CSS
- **Why:** Cross-browser compatibility
- **Usage:** Automatic vendor prefix addition

---

### State Management

#### **Zustand 5.0.3**
- **Purpose:** Lightweight state management library
- **Why:**
  - Simple API (easier than Redux)
  - No boilerplate code
  - TypeScript support
  - Small bundle size (~1KB)
  - React hooks-based
  - No context provider needed
- **Usage:**
  - `authStore` - User authentication state
  - `cartStore` - Shopping cart management
  - `wishlistStore` - Wishlist items
  - `compareStore` - Product comparison

---

### HTTP Client

#### **Axios 1.7.9**
- **Purpose:** Promise-based HTTP client
- **Why:**
  - Request/response interceptors (for JWT tokens)
  - Automatic JSON transformation
  - Request cancellation
  - Better error handling than fetch
  - TypeScript support
- **Usage:** All API calls to backend
- **Configuration:**
  - Base URL from environment variables
  - Automatic token attachment via interceptors
  - Global error handling

---

### Form Handling

#### **React Hook Form 7.71.1 / 7.54.2**
- **Purpose:** Performant form library
- **Why:**
  - Minimal re-renders
  - Built-in validation
  - Easy integration with UI libraries
  - TypeScript support
  - Small bundle size
- **Usage:** All forms (login, register, checkout, product forms)

#### **@hookform/resolvers 5.2.2 / 3.9.1**
- **Purpose:** Validation schema resolvers for React Hook Form
- **Why:** Integrates Zod validation with React Hook Form
- **Usage:** Form validation across all forms

---

### Validation

#### **Zod 4.3.6 / 3.24.1**
- **Purpose:** TypeScript-first schema validation
- **Why:**
  - Type inference (TypeScript types from schemas)
  - Composable schemas
  - Better error messages
  - Runtime validation
  - Works on both client and server
- **Usage:**
  - Frontend form validation
  - Backend request validation
  - API response validation

---

### UI Components

#### **Radix UI** (Multiple packages)
- **Purpose:** Unstyled, accessible UI primitives
- **Why:**
  - Accessibility built-in (ARIA, keyboard navigation)
  - Unstyled (full control over styling)
  - Composable components
  - TypeScript support
- **Packages Used:**
  - `@radix-ui/react-dialog` - Modals and dialogs
  - `@radix-ui/react-dropdown-menu` - Dropdown menus
  - `@radix-ui/react-select` - Select inputs
  - `@radix-ui/react-tabs` - Tab components
  - `@radix-ui/react-toast` - Toast notifications
  - `@radix-ui/react-tooltip` - Tooltips
  - `@radix-ui/react-checkbox` - Checkboxes
  - `@radix-ui/react-switch` - Toggle switches
  - `@radix-ui/react-label` - Form labels
  - `@radix-ui/react-avatar` - User avatars
  - `@radix-ui/react-popover` - Popovers
  - `@radix-ui/react-separator` - Dividers
  - `@radix-ui/react-slot` - Slot composition

#### **Lucide React 0.574.0 / 0.469.0**
- **Purpose:** Icon library
- **Why:**
  - Beautiful, consistent icons
  - Tree-shakeable (only import used icons)
  - TypeScript support
  - Customizable size and color
- **Usage:** Icons throughout the application

#### **React Icons 5.4.0**
- **Purpose:** Additional icon library
- **Why:** Access to multiple icon sets (Font Awesome, Material, etc.)
- **Usage:** Supplementary icons

---

### Charts & Visualization

#### **Recharts 3.7.0 / 2.15.0**
- **Purpose:** Charting library for React
- **Why:**
  - Built on React components
  - Responsive charts
  - Customizable
  - Good documentation
- **Usage:** Admin dashboard analytics (revenue charts, sales graphs)

---

### UI Enhancements

#### **Swiper 11.2.1**
- **Purpose:** Touch-friendly slider/carousel
- **Why:**
  - Mobile-first
  - Smooth animations
  - Lazy loading
  - Responsive
- **Usage:** Product image galleries, homepage banners

#### **react-hot-toast 2.5.2**
- **Purpose:** Toast notification library
- **Why:**
  - Lightweight
  - Customizable
  - Promise-based API
  - Accessible
- **Usage:** Success/error notifications

#### **next-themes 0.4.6**
- **Purpose:** Theme management for Next.js
- **Why:**
  - Dark mode support
  - No flash of unstyled content
  - System preference detection
- **Usage:** Light/dark theme toggle

---

### Utilities

#### **date-fns 4.1.0**
- **Purpose:** Date manipulation library
- **Why:**
  - Modular (tree-shakeable)
  - Immutable
  - TypeScript support
  - Better than Moment.js (smaller)
- **Usage:** Date formatting, relative time (order dates, etc.)

#### **jose 6.0.8**
- **Purpose:** JWT handling (frontend)
- **Why:**
  - Modern JWT library
  - Works in browser
  - TypeScript support
- **Usage:** JWT token parsing on frontend

#### **js-cookie 3.0.5**
- **Purpose:** Cookie management
- **Why:**
  - Simple API
  - Cross-browser support
  - Small size
- **Usage:** Storing JWT tokens in cookies

#### **class-variance-authority 0.7.1**
- **Purpose:** CSS class composition utility
- **Why:**
  - Type-safe variant props
  - Works well with Tailwind
- **Usage:** Component variant styling

#### **clsx 2.1.1**
- **Purpose:** Conditional className utility
- **Why:**
  - Tiny size
  - Fast
  - Handles conditional classes
- **Usage:** Dynamic className composition

#### **tailwind-merge 3.4.1 / 2.6.0**
- **Purpose:** Merge Tailwind CSS classes
- **Why:**
  - Prevents class conflicts
  - Intelligent merging
- **Usage:** Component className merging

---

### Testing

#### **Playwright 1.59.1**
- **Purpose:** End-to-end testing framework
- **Why:**
  - Cross-browser testing
  - Auto-wait for elements
  - Network interception
  - Screenshots and videos
  - TypeScript support
- **Usage:** E2E tests for critical user flows
- **Test Files:**
  - Frontend: `e2e/` directory
  - Admin: `e2e/` directory

---

## Backend

### Runtime & Framework

#### **Node.js 18.x / 20.x**
- **Purpose:** JavaScript runtime
- **Why:**
  - Non-blocking I/O
  - Large ecosystem (npm)
  - JavaScript everywhere (same language as frontend)
  - Good performance
- **Version:** 18.x for backend, 20.x for frontend/admin

#### **Express.js 4.22.1**
- **Purpose:** Web application framework
- **Why:**
  - Minimal and flexible
  - Large middleware ecosystem
  - Well-documented
  - Industry standard
  - Easy to learn
- **Usage:** REST API server

#### **TypeScript 5.9.3**
- **Purpose:** Type safety for backend
- **Why:** Same benefits as frontend (type safety, better tooling)
- **Usage:** 100% TypeScript backend

---

### Database

#### **PostgreSQL (via Supabase)**
- **Purpose:** Relational database
- **Why:**
  - ACID compliance
  - Complex queries support
  - Foreign key constraints
  - Triggers and functions
  - Better for e-commerce than NoSQL
  - Mature and reliable
- **Hosting:** Supabase (managed PostgreSQL)
- **Features Used:**
  - Indexes for performance
  - Foreign key relationships
  - Triggers for auto-updates
  - Row-level security

#### **@supabase/supabase-js 2.103.0**
- **Purpose:** Supabase client library
- **Why:**
  - Official Supabase SDK
  - TypeScript support
  - Connection pooling
  - Auto-generated types (future)
- **Usage:** All database operations

#### **pg 8.20.0**
- **Purpose:** PostgreSQL client for Node.js
- **Why:**
  - Direct PostgreSQL access
  - Used for migrations
  - Fallback for complex queries
- **Usage:** Database migrations, direct SQL queries

---

### Authentication & Security

#### **jsonwebtoken 9.0.2**
- **Purpose:** JWT token generation and verification
- **Why:**
  - Industry standard for API authentication
  - Stateless authentication
  - Secure token signing
- **Usage:** Access and refresh tokens

#### **bcryptjs 2.4.3**
- **Purpose:** Password hashing
- **Why:**
  - Secure password storage
  - Salt generation
  - Slow hashing (prevents brute force)
- **Usage:** User password hashing (12 rounds)

#### **helmet 8.0.0**
- **Purpose:** HTTP security headers
- **Why:**
  - Sets secure HTTP headers
  - Prevents common attacks
  - Content Security Policy
- **Usage:** Applied globally to all routes

#### **cors 2.8.5**
- **Purpose:** Cross-Origin Resource Sharing
- **Why:**
  - Allow frontend to call backend API
  - Whitelist specific origins
  - Credentials support
- **Usage:** Configured with allowed origins

#### **express-rate-limit 8.3.1**
- **Purpose:** Rate limiting middleware
- **Why:**
  - Prevent DDoS attacks
  - Limit API abuse
  - Configurable limits
- **Usage:** 1500 requests per 15 minutes globally

#### **xss 1.0.15**
- **Purpose:** XSS sanitization
- **Why:**
  - Prevent cross-site scripting attacks
  - Sanitize user input
- **Usage:** Input sanitization in services

---

### Middleware & Utilities

#### **cookie-parser 1.4.7**
- **Purpose:** Parse cookies from requests
- **Why:**
  - Easy cookie access
  - Works with httpOnly cookies
- **Usage:** JWT token extraction from cookies

#### **morgan 1.10.0**
- **Purpose:** HTTP request logger
- **Why:**
  - Log all incoming requests
  - Customizable format
  - Integrates with Winston
- **Usage:** Request logging to Winston

#### **winston 3.17.0**
- **Purpose:** Logging library
- **Why:**
  - Multiple transports (file, console)
  - Log levels (info, warn, error)
  - File rotation
  - Structured logging
- **Usage:** Application logging (combined.log, error.log)

#### **compression 1.8.1**
- **Purpose:** Response compression
- **Why:**
  - Reduce response size
  - Faster data transfer
  - Gzip compression
- **Usage:** Compress all API responses

#### **dotenv 16.4.7**
- **Purpose:** Environment variable management
- **Why:**
  - Load .env files
  - Keep secrets out of code
  - Different configs per environment
- **Usage:** Load environment variables

---

### File Handling

#### **multer 2.1.1**
- **Purpose:** File upload middleware
- **Why:**
  - Handle multipart/form-data
  - File size limits
  - File type validation
- **Usage:** Product image uploads

#### **cloudinary 2.9.0**
- **Purpose:** Image hosting and CDN
- **Why:**
  - Automatic image optimization
  - Responsive images
  - CDN delivery
  - Transformation API
- **Usage:** Product image storage

---

### Payment Integration

#### **razorpay 2.9.6**
- **Purpose:** Payment gateway integration
- **Why:**
  - Popular in India
  - Easy integration
  - Multiple payment methods
  - Webhook support
- **Usage:** Online payment processing

---

### PDF & Document Generation

#### **pdfkit 0.18.0**
- **Purpose:** PDF generation
- **Why:**
  - Create PDFs programmatically
  - Custom layouts
  - Node.js native
- **Usage:** Invoice generation

#### **@types/pdfkit 0.17.5**
- **Purpose:** TypeScript types for PDFKit
- **Why:** Type safety for PDF generation
- **Usage:** TypeScript definitions

---

### Other Utilities

#### **slugify 1.6.6**
- **Purpose:** Generate URL-friendly slugs
- **Why:**
  - SEO-friendly URLs
  - Automatic slug generation from product names
- **Usage:** Product slug generation

#### **uuid 11.1.0**
- **Purpose:** UUID generation
- **Why:**
  - Unique identifiers
  - Order numbers, tracking IDs
- **Usage:** Generate unique IDs

#### **nodemailer 8.0.3**
- **Purpose:** Email sending
- **Why:**
  - Send transactional emails
  - Password reset emails
  - Order confirmations
- **Usage:** Email notifications (configured, not actively used yet)

---

### Development Tools

#### **tsx 4.21.0**
- **Purpose:** TypeScript execution for Node.js
- **Why:**
  - Run TypeScript directly
  - Fast compilation
  - Watch mode for development
- **Usage:** `npm run dev` (development server)

#### **rimraf 6.1.3**
- **Purpose:** Cross-platform rm -rf
- **Why:**
  - Clean build directories
  - Works on Windows/Mac/Linux
- **Usage:** Clean `.next` build cache

---

## Build Tools

### **TypeScript Compiler (tsc)**
- **Purpose:** Compile TypeScript to JavaScript
- **Why:** Production builds
- **Usage:** Backend build process

### **Next.js Build System**
- **Purpose:** Build and optimize Next.js apps
- **Why:**
  - Automatic code splitting
  - Image optimization
  - CSS optimization
  - Bundle analysis
- **Usage:** Frontend and admin production builds

---

## Development Environment

### **ESLint 8.57.1**
- **Purpose:** JavaScript/TypeScript linter
- **Why:**
  - Code quality
  - Catch errors
  - Enforce coding standards
- **Configuration:** `eslint-config-next` for Next.js best practices

---

## Deployment Stack

### **Vercel** (Frontend & Admin)
- **Purpose:** Hosting platform for Next.js
- **Why:**
  - Built by Next.js creators
  - Automatic deployments
  - Edge network
  - Serverless functions
  - Free tier

### **Render** (Backend)
- **Purpose:** Cloud platform for backend services
- **Why:**
  - Easy deployment
  - Auto-deploy from Git
  - Free tier
  - Environment variables
  - Health checks

### **Supabase** (Database)
- **Purpose:** PostgreSQL hosting
- **Why:**
  - Managed PostgreSQL
  - Automatic backups
  - Connection pooling
  - Free tier
  - Real-time subscriptions (future)

### **Cloudinary** (CDN)
- **Purpose:** Image hosting and optimization
- **Why:**
  - Automatic image optimization
  - Responsive images
  - CDN delivery
  - Transformations
  - Free tier

---

## Why This Stack?

### Type Safety
- **TypeScript everywhere** - Catch errors at compile time, not runtime
- **Zod validation** - Runtime type checking with TypeScript inference

### Performance
- **Next.js SSR** - Fast initial page loads, better SEO
- **PostgreSQL** - Efficient queries with proper indexing
- **Cloudinary CDN** - Fast image delivery worldwide
- **Compression** - Smaller payloads, faster transfers

### Developer Experience
- **TypeScript** - Better autocomplete, refactoring, documentation
- **Hot reload** - Fast development feedback
- **Zustand** - Simple state management, no boilerplate
- **Tailwind CSS** - Rapid UI development

### Production Ready
- **Security** - JWT, bcrypt, helmet, CORS, rate limiting
- **Logging** - Winston for debugging production issues
- **Error Handling** - Centralized error handling
- **Testing** - Playwright E2E tests

### Scalability
- **Stateless API** - Easy horizontal scaling
- **PostgreSQL** - Handles complex queries, relationships
- **Vercel Edge** - Global CDN for frontend
- **Supabase** - Managed database with connection pooling

### Cost Effective
- **Free tiers** - Vercel, Render, Supabase, Cloudinary all have generous free tiers
- **Open source** - No licensing costs for any technology

---

## Version Compatibility

All dependencies are pinned to specific versions for stability. The project uses:
- **Node.js 18.x** (backend) / **20.x** (frontend/admin)
- **npm** as package manager
- **CommonJS** modules for backend
- **ES Modules** for frontend/admin

---

This tech stack provides a solid foundation for building a modern, scalable, and maintainable e-commerce platform.
