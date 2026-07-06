# AMOHA Mobiles - Complete Documentation

**Version:** 1.0.0  
**Last Updated:** July 6, 2026  
**Tech Stack:** PostgreSQL (Supabase) / Express.js / Next.js 14 / Node.js  

---

## 📚 Documentation Index

### Barcode system (July 2026)

| Document | Description |
|----------|-------------|
| **[Barcode User Guide](./features/BARCODE_USER_GUIDE.md)** | Types, test values, check digits, daily usage |
| **[Barcode Fixes Changelog](./features/BARCODE_FIXES_CHANGELOG.md)** | All July 2026 fixes (`d3c259b` → `8cf1e87`) |
| **[Barcode System Implementation](./features/BARCODE_SYSTEM_IMPLEMENTATION.md)** | Technical architecture and API |

### Deployment

| Document | Description |
|----------|-------------|
| **[Deployment Index](./deployment/DEPLOYMENT_INDEX.md)** | Central deploy hub |
| **[Fast Deploy Runbook](./deployment/FAST_DEPLOY_RUNBOOK.md)** | Quick commands and troubleshooting |
| **[Barcode Deploy Report](./deployment/BARCODE_TYPE_FIX_DEPLOYMENT_REPORT.md)** | Jul 5–6 deploy incident write-up |

### Core Documentation

1. **[Project Overview](./01-PROJECT-OVERVIEW.md)** - What the project does, features, and use cases
2. **[Architecture](./02-ARCHITECTURE.md)** - System design, components, data flow, and diagrams
3. **[Tech Stack](./03-TECH-STACK.md)** - Technologies used and why
4. **[Project Structure](./04-PROJECT-STRUCTURE.md)** - Folder/file organization
5. **[Installation Guide](./05-INSTALLATION.md)** - Prerequisites and setup instructions
6. **[Configuration](./06-CONFIGURATION.md)** - Environment variables and config files
7. **[Usage Guide](./07-USAGE.md)** - How to run and use the project
8. **[API Documentation](./08-API-DOCUMENTATION.md)** - Complete API reference
9. **[Database Schema](./09-DATABASE-SCHEMA.md)** - PostgreSQL tables and relationships
10. **[Core Features](./10-CORE-FEATURES.md)** - Detailed feature explanations
11. **[Error Handling](./11-ERROR-HANDLING.md)** - Common errors and debugging
12. **[Testing](./12-TESTING.md)** - Test structure and coverage
13. **[Deployment](./13-DEPLOYMENT.md)** - Production deployment guide
14. **[Security](./14-SECURITY.md)** - Security considerations and best practices
15. **[Performance](./15-PERFORMANCE.md)** - Performance optimization strategies
16. **[Contributing](./16-CONTRIBUTING.md)** - How to contribute
17. **[FAQ](./17-FAQ.md)** - Frequently asked questions

---

## Production URLs

- **Store:** https://www.amohamobiles.com
- **Admin Panel:** https://admin.amohamobiles.com
- **API Base URL:** https://amoha-backend-v2.onrender.com/api
- **Repository:** https://github.com/amohacodemail-ux/amoha-mobiles

---

## Quick Links (legacy section)

## Quick Start

```bash
# Clone the repository
git clone <repository-url>
cd amoha-mobiles-main

# Backend setup
cd backend
npm install
npm run seed
npm run dev

# Frontend setup (new terminal)
cd frontend
npm install
npm run dev

# Admin setup (new terminal)
cd admin
npm install
npm run dev
```

**Access URLs:**
- Frontend: http://localhost:3002
- Admin: http://localhost:3003
- Backend API: http://localhost:5001

---

## Project Summary

**AMOHA Mobiles** is a production-ready, full-stack e-commerce platform for selling smartphones and mobile accessories. Built with modern technologies and best practices, it features:

- **3 Applications:** Customer storefront, Admin dashboard, REST API
- **Database:** PostgreSQL (Supabase) with proper indexing and relationships
- **Authentication:** JWT-based with access/refresh tokens
- **Payment Integration:** Razorpay for online payments
- **Image Management:** Cloudinary for image uploads
- **Real-time Features:** Order tracking, inventory management
- **Advanced Features:** Product comparison, wishlist, coupon system, wallet, RFQ system

---

## Technology Highlights

- **Frontend:** Next.js 14 (App Router), TypeScript, Tailwind CSS, Zustand
- **Backend:** Node.js, Express.js, TypeScript, PostgreSQL (Supabase)
- **Authentication:** JWT with httpOnly cookies
- **Validation:** Zod schemas on both frontend and backend
- **Security:** Helmet, CORS, rate limiting, XSS protection
- **Logging:** Winston with file rotation
- **Testing:** Playwright E2E tests

---

## Default Credentials

### Admin Account
- **Email:** admin@amoha.com
- **Password:** admin123
- **Access:** Admin Dashboard + Customer Storefront

### Test User Account
- **Email:** user@amoha.com
- **Password:** user123
- **Access:** Customer Storefront

---

## Support

For questions or issues:
- **Email:** support@amohamobiles.com
- **Phone:** +91-6380123183
- **Address:** Therveethi, Idikarai, Coimbatore, Tamil Nadu, India

---

## License

This project is licensed under the **ISC License**.

---

<p align="center">
  <strong>Made with ❤️ by AMOHA Team</strong>
</p>
