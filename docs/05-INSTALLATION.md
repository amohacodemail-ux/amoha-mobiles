# 5. Installation Guide

## Prerequisites

Before you begin, ensure you have the following installed on your system:

### Required Software

| Software | Minimum Version | Recommended Version | Download Link |
|----------|----------------|---------------------|---------------|
| **Node.js** | 18.0.0 | 20.x | [nodejs.org](https://nodejs.org/) |
| **npm** | 9.0.0 | 10.x | Comes with Node.js |
| **Git** | 2.x | Latest | [git-scm.com](https://git-scm.com/) |

### Database

You need a **PostgreSQL database**. Choose one of these options:

#### Option 1: Supabase (Recommended - Free Tier Available)
1. Create account at [supabase.com](https://supabase.com)
2. Create a new project
3. Note down:
   - Project URL (e.g., `https://xxxxx.supabase.co`)
   - Service Role Key (from Settings → API)
   - Database Password (set during project creation)

#### Option 2: Local PostgreSQL
1. Install PostgreSQL 14+ from [postgresql.org](https://www.postgresql.org/download/)
2. Create a database: `createdb amoha_mobiles`
3. Note down connection details

---

## Installation Steps

### 1. Clone the Repository

```bash
git clone <repository-url>
cd amoha-mobiles-main
```

Replace `<repository-url>` with your actual repository URL.

---

### 2. Backend Setup

#### 2.1 Navigate to Backend Directory

```bash
cd backend
```

#### 2.2 Install Dependencies

```bash
npm install
```

This will install all required packages listed in `package.json`.

#### 2.3 Create Environment File

Create a `.env` file in the `backend/` directory:

```bash
# On Windows
copy .env.example .env

# On Mac/Linux
cp .env.example .env
```

If `.env.example` doesn't exist, create `.env` manually with the following content:

```env
# Server Configuration
NODE_ENV=development
PORT=5001

# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
SUPABASE_DB_PASSWORD=your-database-password

# JWT Configuration
JWT_ACCESS_SECRET=your-super-secret-access-key-minimum-32-characters-long
JWT_REFRESH_SECRET=your-super-secret-refresh-key-minimum-32-characters-long
JWT_ACCESS_EXPIRY=7d
JWT_REFRESH_EXPIRY=30d

# CORS Configuration
CORS_ORIGIN=http://localhost:3002,http://localhost:3003

# Security
BCRYPT_SALT_ROUNDS=12

# Logging
LOG_LEVEL=info

# Payment Gateway (Razorpay)
RAZORPAY_KEY_ID=your-razorpay-key-id
RAZORPAY_KEY_SECRET=your-razorpay-key-secret
```

**Important:**
- Replace `SUPABASE_URL` with your Supabase project URL
- Replace `SUPABASE_SERVICE_ROLE_KEY` with your service role key from Supabase
- Replace `SUPABASE_DB_PASSWORD` with your database password
- Generate strong random strings for `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` (at least 32 characters)
- For Razorpay, sign up at [razorpay.com](https://razorpay.com) and get your keys

**Generate Random Secrets:**

```bash
# On Mac/Linux
openssl rand -base64 32

# On Windows (PowerShell)
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | % {[char]$_})

# Or use an online generator
# https://www.random.org/strings/
```

#### 2.4 Set Up Database Schema

Run the database migration SQL script in your Supabase SQL Editor:

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Open `backend/supabase-migration.sql` file
4. Copy the entire content
5. Paste into Supabase SQL Editor
6. Click **Run**

This will create all necessary tables, indexes, and constraints.

#### 2.5 Seed the Database (Optional but Recommended)

Populate the database with sample data:

```bash
npm run seed
```

This will create:
- 2 users (1 admin, 1 regular user)
- 8 sample products
- 15 categories
- 8 brands
- 3 hero banners
- 3 coupon codes

**Default Credentials After Seeding:**

**Admin Account:**
- Email: `admin@amoha.com`
- Password: `admin123`

**Test User Account:**
- Email: `user@amoha.com`
- Password: `user123`

#### 2.6 Start the Backend Server

```bash
npm run dev
```

The backend API will start at **http://localhost:5001**

**Verify it's running:**
- Open browser and visit: http://localhost:5001/health
- You should see: `{"success":true,"message":"AMOHA Mobiles API is running","timestamp":"..."}`

---

### 3. Frontend Setup

Open a **new terminal window** (keep backend running).

#### 3.1 Navigate to Frontend Directory

```bash
cd frontend
```

#### 3.2 Install Dependencies

```bash
npm install
```

#### 3.3 Create Environment File

Create `.env.local` in the `frontend/` directory:

```bash
# On Windows
echo NEXT_PUBLIC_API_URL=http://localhost:5001/api > .env.local

# On Mac/Linux
echo "NEXT_PUBLIC_API_URL=http://localhost:5001/api" > .env.local
```

Or create `.env.local` manually:

```env
NEXT_PUBLIC_API_URL=http://localhost:5001/api
```

#### 3.4 Start the Frontend Server

```bash
npm run dev
```

The customer storefront will start at **http://localhost:3002**

**Verify it's running:**
- Open browser and visit: http://localhost:3002
- You should see the homepage with banners and products

---

### 4. Admin Panel Setup

Open **another new terminal window** (keep backend and frontend running).

#### 4.1 Navigate to Admin Directory

```bash
cd admin
```

#### 4.2 Install Dependencies

```bash
npm install
```

#### 4.3 Create Environment File

Create `.env.local` in the `admin/` directory:

```bash
# On Windows
echo NEXT_PUBLIC_API_URL=http://localhost:5001/api > .env.local

# On Mac/Linux
echo "NEXT_PUBLIC_API_URL=http://localhost:5001/api" > .env.local
```

Or create `.env.local` manually:

```env
NEXT_PUBLIC_API_URL=http://localhost:5001/api
```

#### 4.4 Start the Admin Server

```bash
npm run dev
```

The admin dashboard will start at **http://localhost:3003**

**Verify it's running:**
- Open browser and visit: http://localhost:3003
- You should see the admin login page
- Login with: `admin@amoha.com` / `admin123`

---

## Verification Checklist

After completing all steps, verify everything is working:

- [ ] Backend API is running at http://localhost:5001
- [ ] Health check returns success: http://localhost:5001/health
- [ ] Frontend is running at http://localhost:3002
- [ ] Homepage loads with products
- [ ] Admin panel is running at http://localhost:3003
- [ ] Can login to admin with default credentials
- [ ] Can login to frontend with test user credentials

---

## All Three Applications Running

You should now have **three terminal windows** running:

| Terminal | Directory | Command | URL |
|----------|-----------|---------|-----|
| Terminal 1 | `backend/` | `npm run dev` | http://localhost:5001 |
| Terminal 2 | `frontend/` | `npm run dev` | http://localhost:3002 |
| Terminal 3 | `admin/` | `npm run dev` | http://localhost:3003 |

---

## Troubleshooting

### Port Already in Use

If you get "port already in use" error:

**Backend (Port 5001):**
```bash
# Find process using port 5001
# Windows
netstat -ano | findstr :5001
taskkill /PID <PID> /F

# Mac/Linux
lsof -ti:5001 | xargs kill -9
```

**Frontend (Port 3002):**
```bash
# Windows
netstat -ano | findstr :3002
taskkill /PID <PID> /F

# Mac/Linux
lsof -ti:3002 | xargs kill -9
```

**Admin (Port 3003):**
```bash
# Windows
netstat -ano | findstr :3003
taskkill /PID <PID> /F

# Mac/Linux
lsof -ti:3003 | xargs kill -9
```

### Database Connection Failed

**Error:** `Supabase connection failed`

**Solutions:**
1. Verify `SUPABASE_URL` is correct in `.env`
2. Verify `SUPABASE_SERVICE_ROLE_KEY` is correct
3. Check if Supabase project is active
4. Verify database password is correct
5. Check internet connection

### JWT Secret Too Short

**Error:** `JWT_ACCESS_SECRET must be at least 32 characters`

**Solution:**
Generate a longer secret (at least 32 characters) and update `.env`

### Module Not Found

**Error:** `Cannot find module 'xxx'`

**Solution:**
```bash
# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### TypeScript Compilation Errors

**Error:** TypeScript errors during `npm run dev`

**Solution:**
```bash
# Backend
cd backend
npm run build

# Frontend/Admin
cd frontend  # or admin
rm -rf .next
npm run dev
```

### Seed Script Fails

**Error:** Seed script fails to run

**Solutions:**
1. Ensure database schema is created (run migration SQL first)
2. Check database connection in `.env`
3. Verify all required tables exist
4. Check for any existing data conflicts

---

## Optional: Cloudinary Setup (for Image Uploads)

If you want to test image upload functionality:

1. Create account at [cloudinary.com](https://cloudinary.com)
2. Get your Cloud Name, API Key, and API Secret
3. Add to `backend/.env`:

```env
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

---

## Optional: Email Setup (for Notifications)

If you want to test email functionality:

1. Get SMTP credentials (Gmail, SendGrid, etc.)
2. Add to `backend/.env`:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@amohamobiles.com
```

---

## Development Workflow

### Starting Development

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev

# Terminal 3 - Admin
cd admin
npm run dev
```

### Stopping Development

Press `Ctrl+C` in each terminal window to stop the servers.

---

## Next Steps

After successful installation:

1. **Explore the Frontend** - Browse products, add to cart, checkout
2. **Explore the Admin Panel** - Manage products, orders, users
3. **Test API Endpoints** - Use Postman or Thunder Client
4. **Read the Usage Guide** - Learn how to use all features
5. **Check API Documentation** - Understand available endpoints

---

## Production Build

To create production builds:

### Backend
```bash
cd backend
npm run build
npm start
```

### Frontend
```bash
cd frontend
npm run build
npm start
```

### Admin
```bash
cd admin
npm run build
npm start
```

---

## Docker Setup (Optional)

If you prefer Docker, create `docker-compose.yml` in the root:

```yaml
version: '3.8'

services:
  backend:
    build: ./backend
    ports:
      - "5001:5001"
    environment:
      - NODE_ENV=production
    env_file:
      - ./backend/.env

  frontend:
    build: ./frontend
    ports:
      - "3002:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://localhost:5001/api

  admin:
    build: ./admin
    ports:
      - "3003:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://localhost:5001/api
```

Then run:
```bash
docker-compose up
```

---

## System Requirements

### Minimum Requirements
- **CPU:** Dual-core processor
- **RAM:** 4 GB
- **Disk Space:** 2 GB free space
- **OS:** Windows 10, macOS 10.15+, Ubuntu 20.04+

### Recommended Requirements
- **CPU:** Quad-core processor
- **RAM:** 8 GB or more
- **Disk Space:** 5 GB free space
- **OS:** Latest stable version

---

## IDE Recommendations

### Visual Studio Code (Recommended)
**Extensions:**
- ESLint
- Prettier
- TypeScript and JavaScript Language Features
- Tailwind CSS IntelliSense
- GitLens
- Thunder Client (API testing)

### Other IDEs
- WebStorm
- Sublime Text
- Atom

---

## Getting Help

If you encounter issues:

1. Check the [Troubleshooting](#troubleshooting) section above
2. Review the [FAQ](./17-FAQ.md)
3. Check the [Error Handling](./11-ERROR-HANDLING.md) guide
4. Open an issue on GitHub
5. Contact support: support@amohamobiles.com

---

**Congratulations!** You have successfully installed AMOHA Mobiles. Proceed to the [Usage Guide](./07-USAGE.md) to learn how to use the platform.
