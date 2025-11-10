# 🍽️ Cafeteria Management System

A full-stack cafeteria management system built with Next.js, Express.js, and MongoDB. This system supports user management, food menu management, order tracking, and real-time notifications with a multi-database fragmentation architecture for scalability.

---

## 📋 Table of Contents

1. [Project Overview](#-project-overview)
2. [Project Folder Structure](#-project-folder-structure)
3. [System Requirements](#-system-requirements)
4. [Installation Guide](#-installation-guide)
5. [Backend Setup](#-backend-setup)
6. [Frontend Setup](#-frontend-setup)
7. [Running the Application](#-running-frontend--backend-together)
8. [Common Errors & Fixes](#-common-errors--fixes)
9. [Technologies Used](#-technologies-used)
10. [License](#-license)

---

## 🎯 Project Overview

### Purpose
This is a comprehensive **Cafeteria Management System** designed for managing food orders, user accounts, and administrative tasks in a cafeteria environment. The system supports Bengali food items with time-based categories (Morning, Lunch, Evening) and implements a sophisticated multi-database architecture for horizontal scaling.

### Key Features

- 👥 **User Management**
  - User registration with role-based access (Student, Teacher, Staff, Admin)
  - Student auto-approval system
  - Admin approval workflow for Teachers and Staff
  - Profile management and password updates

- 🍛 **Food Menu Management**
  - Bengali food items with time categories (🌅 Morning, 🍛 Lunch, 🌆 Evening)
  - Image upload functionality
  - Price and availability management
  - Category and description fields

- 📦 **Order Management**
  - Order placement with quantity selection
  - Table/Room number input
  - Order status tracking (Pending → Preparing → Ready → Completed)
  - Order history for users
  - Cross-database order queries

- 🔔 **Notifications**
  - Real-time order status notifications
  - Admin notifications for new orders
  - User notifications for order updates

- 📊 **Admin Dashboard**
  - User approval/rejection
  - Food item CRUD operations
  - Order management
  - Statistics and analytics

- 🗄️ **Multi-Database Architecture**
  - Horizontal database fragmentation (sharding)
  - 3 separate MongoDB databases for scalability
  - Role-based data distribution

---

## 📁 Project Folder Structure

```
finalv3/
├── app/                          # Next.js App Router (Frontend)
│   ├── admin/                    # Admin-only pages
│   │   ├── food-items/          # Food management page
│   │   ├── notifications/       # Admin notifications
│   │   ├── orders/              # Order management
│   │   └── users/               # User management
│   ├── api/                      # Next.js API routes (proxies to Express)
│   │   ├── admin/               # Admin API routes
│   │   ├── auth/                # Authentication routes
│   │   ├── dashboard/           # Dashboard stats
│   │   ├── orders/              # Order API routes
│   │   ├── products/            # Product API routes
│   │   └── users/               # User API routes
│   ├── dashboard/               # User dashboard
│   ├── login/                   # Login page
│   ├── orders/                  # User orders page
│   ├── products/                 # Food browsing page
│   ├── profile/                 # User profile page
│   ├── signup/                  # Registration page
│   ├── globals.css              # Global styles
│   └── layout.tsx               # Root layout
│
├── backend/                      # Express.js Backend
│   ├── config/                  # Configuration files
│   │   ├── db.js                # Database connection (legacy)
│   │   └── dbManager.js         # Multi-database manager
│   ├── middleware/              # Express middleware
│   │   └── authMiddleware.js    # JWT authentication
│   ├── models/                  # Mongoose models
│   │   ├── Order.js             # Order model
│   │   ├── Product.js           # Product model
│   │   ├── schemas.js           # Shared schemas
│   │   └── User.js              # User model
│   ├── routes/                  # API routes
│   │   ├── authRoutes.js        # Authentication routes
│   │   ├── dashboardRoutes.js   # Dashboard routes
│   │   ├── notificationRoutes.js # Notification routes
│   │   ├── orderRoutes.js       # Order routes
│   │   ├── productRoutes.js     # Product routes
│   │   └── userRoutes.js        # User routes
│   ├── scripts/                 # Utility scripts
│   │   ├── createAdmin.js       # Create admin user
│   │   └── seedBengaliFoods.js  # Seed food items
│   ├── server/                  # Server files
│   │   └── uploads/             # Uploaded images (created at runtime)
│   ├── utils/                   # Utility functions
│   │   └── modelFactory.js      # Model factory for multi-DB
│   ├── package.json             # Backend dependencies
│   └── server.js                # Express server entry point
│
├── components/                   # React components
│   ├── ui/                      # UI components (shadcn/ui)
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   ├── toast.tsx
│   │   └── toaster.tsx
│   ├── navbar.tsx               # Navigation bar
│   ├── sidebar.tsx              # Sidebar navigation
│   ├── topbar.tsx               # Top bar
│   ├── status-badge.tsx         # Status badge component
│   └── search-input.tsx         # Search input component
│
├── hooks/                       # Custom React hooks
│   ├── use-debounce.ts         # Debounce hook
│   └── use-toast.ts            # Toast notification hook
│
├── lib/                         # Utility libraries
│   ├── api.ts                   # API fetch utility
│   └── utils.ts                 # General utilities
│
├── public/                      # Static assets
│   ├── placeholder-logo.png
│   ├── placeholder-logo.svg
│   └── placeholder.svg
│
├── styles/                      # Additional styles
│   └── globals.css
│
├── frontend/                    # Legacy frontend (not used in Next.js)
│   └── src/                     # React source files
│
├── .gitignore                   # Git ignore file
├── components.json               # shadcn/ui config
├── next.config.mjs              # Next.js configuration
├── package.json                 # Root package.json (frontend)
├── pnpm-lock.yaml               # PNPM lock file
├── postcss.config.mjs           # PostCSS config
├── tsconfig.json                # TypeScript config
└── README.md                    # This file
```

### Folder Explanations

- **`app/`**: Next.js 16 App Router directory containing all pages and API routes
- **`backend/`**: Express.js backend server with routes, models, and middleware
- **`components/`**: Reusable React components (UI components from shadcn/ui)
- **`hooks/`**: Custom React hooks for shared functionality
- **`lib/`**: Utility functions and API helpers
- **`public/`**: Static files served by Next.js
- **`backend/server/uploads/`**: Directory for uploaded food images (created automatically)

---

## 💻 System Requirements

Before you begin, ensure you have the following installed:

- **Node.js**: Version 18.x or higher ([Download](https://nodejs.org/))
- **PNPM**: Package manager (install via `npm install -g pnpm`)
- **MongoDB**: 
  - Local MongoDB installation ([Download](https://www.mongodb.com/try/download/community)) OR
  - MongoDB Atlas account ([Sign up](https://www.mongodb.com/cloud/atlas))
- **Git**: For cloning the repository ([Download](https://git-scm.com/))
- **Operating System**: Windows 10+, macOS 10.15+, or Linux (Ubuntu 20.04+)

### Verify Installation

```bash
# Check Node.js version
node --version  # Should be v18.x or higher

# Check PNPM installation
pnpm --version  # Should show version number

# Check MongoDB (if installed locally)
mongod --version  # Should show MongoDB version

# Check Git
git --version  # Should show Git version
```

---

## 🚀 Installation Guide

Follow these steps to set up and run the project:

### Step 1: Clone the Repository

```bash
git clone <repository-url>
cd finalv3
```

### Step 2: Open Terminal in Root Directory

Make sure you're in the project root directory (`finalv3/`).

### Step 3: Install Dependencies

Install all dependencies for both frontend and backend:

```bash
pnpm install
```

This command will:
- Install Next.js frontend dependencies
- Install Express.js backend dependencies
- Set up all required packages

**Note**: If you encounter errors, try:
```bash
# Clear cache and reinstall
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

### Step 4: Setup Backend Environment Variables

Create a `.env` file in the `backend/` directory:

```bash
cd backend
touch .env  # On Windows: type nul > .env
```

Add the following environment variables to `backend/.env`:

```env
# MongoDB Connection
# For Local MongoDB:
MONGODB_URI=mongodb://localhost:27017/cafeteria

# For MongoDB Atlas (replace with your connection string):
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/cafeteria?retryWrites=true&w=majority

# Optional: Separate database URIs for multi-DB setup
# MONGODB_URI_DB1=mongodb://localhost:27017/cafeteria-db1
# MONGODB_URI_DB2=mongodb://localhost:27017/cafeteria-db2
# MONGODB_URI_DB3=mongodb://localhost:27017/cafeteria-db3

# JWT Secret (change this to a random string in production)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Server Port (default: 5000)
PORT=5000
```

**Important**: 
- Replace `your-super-secret-jwt-key-change-this-in-production` with a secure random string
- For MongoDB Atlas, replace the connection string with your actual credentials
- The default port is `5000`, but you can change it to `5001` if needed

### Step 5: Setup Frontend Environment Variables

Create a `.env.local` file in the **root directory** (not in `backend/`):

```bash
# From root directory
touch .env.local  # On Windows: type nul > .env.local
```

Add the following to `.env.local`:

```env
# Backend API URL
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000
```

**Note**: If you changed the backend port in Step 4, update this URL accordingly (e.g., `http://localhost:5001`).

### Step 6: Start MongoDB (If Using Local MongoDB)

**Windows:**
```bash
# Start MongoDB service (if installed as service)
net start MongoDB

# Or run MongoDB manually
mongod --dbpath "C:\data\db"
```

**macOS/Linux:**
```bash
# Start MongoDB service
sudo systemctl start mongod  # Linux
brew services start mongodb-community  # macOS (if installed via Homebrew)

# Or run MongoDB manually
mongod --dbpath /usr/local/var/mongodb
```

**MongoDB Atlas Users**: Skip this step - your database is cloud-hosted.

### Step 7: Start the Application

From the **root directory**, run:

```bash
pnpm run dev:all
```

This command will:
- Start the Express.js backend server (port 5000)
- Start the Next.js frontend development server (port 3000)
- Run both concurrently

You should see output like:
```
[backend] Server running on port 5000
[frontend] ▲ Next.js 16.0.0
[frontend] - Local:        http://localhost:3000
```

### Step 8: Verify Both Servers Are Running

1. **Backend**: Open [http://localhost:5000/api/health](http://localhost:5000/api/health)
   - Should return: `{"message":"Server is running"}`

2. **Frontend**: Open [http://localhost:3000](http://localhost:3000)
   - Should show the application homepage

---

## 🔧 Backend Setup

### Backend Directory Structure

```
backend/
├── config/          # Database configuration
├── middleware/      # Authentication middleware
├── models/          # Mongoose models
├── routes/          # API routes
├── scripts/         # Utility scripts
├── server/          # Server files (uploads directory)
├── utils/           # Utility functions
├── .env             # Environment variables (create this)
├── package.json     # Dependencies
└── server.js        # Entry point
```

### Backend Dependencies

The backend uses the following key packages:
- `express`: Web framework
- `mongoose`: MongoDB ODM
- `bcryptjs`: Password hashing
- `jsonwebtoken`: JWT authentication
- `cors`: Cross-origin resource sharing
- `multer`: File upload handling
- `dotenv`: Environment variable management
- `nodemon`: Development server (dev dependency)

### Backend Environment Variables

Required variables in `backend/.env`:

| Variable | Description | Example |
|----------|-------------|---------|
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/cafeteria` |
| `JWT_SECRET` | Secret key for JWT tokens | `your-secret-key-here` |
| `PORT` | Server port (optional) | `5000` |

### Backend Default Port

The backend runs on **port 5000** by default. You can change it by setting `PORT` in `backend/.env`.

### MongoDB Connection Guide

#### Option 1: Local MongoDB

1. Install MongoDB Community Edition from [mongodb.com](https://www.mongodb.com/try/download/community)
2. Start MongoDB service
3. Use connection string: `mongodb://localhost:27017/cafeteria`

#### Option 2: MongoDB Atlas (Cloud)

1. Sign up at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster
3. Create a database user
4. Whitelist your IP address (or use `0.0.0.0/0` for development)
5. Get connection string: `mongodb+srv://username:password@cluster.mongodb.net/cafeteria`
6. Replace `username` and `password` with your credentials

### Create Admin User

After starting the backend, create an admin user:

```bash
cd backend
node scripts/createAdmin.js
```

This will prompt you for:
- Admin email
- Admin password
- Admin name

### Seed Food Items (Optional)

To populate the database with sample Bengali food items:

```bash
cd backend
node scripts/seedBengaliFoods.js
```

---

## 🎨 Frontend Setup

### Frontend Directory Structure

```
app/                 # Next.js App Router
├── admin/          # Admin pages
├── api/            # API routes (proxies)
├── dashboard/     # User dashboard
├── login/          # Login page
├── orders/         # Orders page
├── products/       # Products page
├── profile/        # Profile page
└── signup/         # Signup page
```

### Frontend Dependencies

The frontend uses:
- **Next.js 16**: React framework with App Router
- **TypeScript**: Type safety
- **Tailwind CSS**: Styling
- **Radix UI**: Accessible UI components
- **shadcn/ui**: Component library
- **React Hook Form**: Form management
- **Zod**: Schema validation

### Frontend Environment Variables

Required variable in `.env.local` (root directory):

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_BASE_URL` | Backend API URL | `http://localhost:5000` |

**Important**: 
- File must be named `.env.local` (not `.env`)
- Must be in the **root directory** (not in `backend/`)
- Variable must start with `NEXT_PUBLIC_` to be accessible in the browser

### Frontend Default Port

The frontend runs on **port 3000** by default (Next.js standard).

---

## 🚀 Running Frontend + Backend Together

You have **3 methods** to run both servers:

### ✅ Method 1: Root Folder (Recommended)

This is the **recommended method** for this project:

```bash
# From root directory
pnpm install
pnpm run dev:all
```

This automatically runs both frontend and backend concurrently using the `concurrently` package.

**What happens:**
- Backend starts on `http://localhost:5000`
- Frontend starts on `http://localhost:3000`
- Both run in the same terminal with color-coded output

### ✅ Method 2: Run Manually in Two Terminals

If you prefer separate terminals:

**Terminal 1 (Backend):**
```bash
cd backend
pnpm install  # If not already installed
pnpm start    # Production mode
# OR
pnpm run dev  # Development mode (with nodemon)
```

**Terminal 2 (Frontend):**
```bash
# From root directory
pnpm dev      # Next.js development server
```

### ✅ Method 3: PM2 (For Production)

For production deployment with PM2:

```bash
# Install PM2 globally
npm install -g pm2

# Start backend
cd backend
pm2 start server.js --name "cafeteria-backend"

# Start frontend (from root)
cd ..
pm2 start "pnpm dev" --name "cafeteria-frontend"

# View running processes
pm2 list

# View logs
pm2 logs

# Stop processes
pm2 stop all
```

---

## ⚠️ Common Errors & Fixes

### 1. "Cannot connect to server (5000)" or "Cannot connect to server (5001)"

**Problem**: Frontend cannot reach the backend.

**Solutions**:
- ✅ Check if backend is running: Visit `http://localhost:5000/api/health`
- ✅ Verify `.env.local` has correct `NEXT_PUBLIC_API_BASE_URL`
- ✅ Ensure backend port matches frontend configuration
- ✅ Check for firewall blocking the connection

### 2. Backend Not Running

**Problem**: Backend server fails to start.

**Solutions**:
- ✅ Check MongoDB is running (if using local MongoDB)
- ✅ Verify `backend/.env` file exists and has correct values
- ✅ Check if port 5000 is already in use:
  ```bash
  # Windows
  netstat -ano | findstr :5000
  
  # macOS/Linux
  lsof -i :5000
  ```
- ✅ Kill the process using the port or change `PORT` in `.env`

### 3. MongoDB Connection Errors

**Problem**: `MongooseError: connect ECONNREFUSED` or similar.

**Solutions**:
- ✅ **Local MongoDB**: Ensure MongoDB service is running
  ```bash
  # Windows
  net start MongoDB
  
  # macOS/Linux
  sudo systemctl start mongod
  ```
- ✅ **MongoDB Atlas**: 
  - Verify connection string is correct
  - Check IP whitelist includes your IP (or `0.0.0.0/0` for development)
  - Verify database user credentials
- ✅ Test connection string in MongoDB Compass or `mongosh`

### 4. Missing Environment Variables

**Problem**: `process.env.MONGODB_URI is undefined` or similar.

**Solutions**:
- ✅ Ensure `.env` file exists in `backend/` directory
- ✅ Ensure `.env.local` exists in root directory
- ✅ Restart the server after creating/modifying `.env` files
- ✅ Check for typos in variable names (case-sensitive)

### 5. CORS Issues

**Problem**: `Access to fetch at 'http://localhost:5000' from origin 'http://localhost:3000' has been blocked by CORS policy`.

**Solutions**:
- ✅ Backend already has CORS enabled in `backend/server.js`
- ✅ Verify `cors` package is installed: `cd backend && pnpm install`
- ✅ Check backend is running on the correct port

### 6. Port Already in Use

**Problem**: `Error: listen EADDRINUSE: address already in use :5000`

**Solutions**:
```bash
# Find process using port 5000
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# macOS/Linux
lsof -i :5000
kill -9 <PID>

# Or change port in backend/.env
PORT=5001
```

### 7. PNPM Command Not Found

**Problem**: `pnpm: command not found`

**Solutions**:
```bash
# Install PNPM globally
npm install -g pnpm

# Verify installation
pnpm --version
```

### 8. Module Not Found Errors

**Problem**: `Cannot find module 'xyz'` or similar.

**Solutions**:
```bash
# Reinstall dependencies
rm -rf node_modules pnpm-lock.yaml
pnpm install

# For backend specifically
cd backend
rm -rf node_modules package-lock.json
pnpm install
```

### 9. Image Upload Not Working

**Problem**: Images not uploading or not displaying.

**Solutions**:
- ✅ Ensure `backend/server/uploads/` directory exists (created automatically)
- ✅ Check file size (max 5MB)
- ✅ Verify file is an image (jpg, png, gif, etc.)
- ✅ Check backend logs for upload errors
- ✅ Verify `multer` package is installed in backend

### 10. Authentication Errors

**Problem**: `Unauthorized` or `Invalid token` errors.

**Solutions**:
- ✅ Clear browser localStorage: `localStorage.clear()`
- ✅ Log out and log back in
- ✅ Verify `JWT_SECRET` in `backend/.env` is set
- ✅ Check token expiration (default: 7 days)

---

## 🛠️ Technologies Used

### Frontend
- **Next.js 16.0.0** - React framework with App Router
- **React 19.2.0** - UI library
- **TypeScript 5.x** - Type safety
- **Tailwind CSS 4.1.9** - Utility-first CSS framework
- **Radix UI** - Accessible component primitives
- **shadcn/ui** - Component library built on Radix UI
- **React Hook Form** - Form state management
- **Zod** - Schema validation
- **Axios** - HTTP client
- **Lucide React** - Icon library

### Backend
- **Node.js 18+** - JavaScript runtime
- **Express.js 4.18.2** - Web framework
- **MongoDB** - NoSQL database
- **Mongoose 7.0.0** - MongoDB ODM
- **JWT (jsonwebtoken)** - Authentication
- **bcryptjs** - Password hashing
- **Multer** - File upload handling
- **CORS** - Cross-origin resource sharing
- **dotenv** - Environment variable management

### Development Tools
- **PNPM** - Package manager
- **Nodemon** - Development server auto-reload
- **Concurrently** - Run multiple commands
- **TypeScript** - Type checking
- **ESLint** - Code linting

### Database Architecture
- **MongoDB** with multi-database fragmentation (sharding)
- **3 separate databases** for horizontal scaling:
  - `cafeteria-db1`: Admin users and products
  - `cafeteria-db2`: 50% of regular users
  - `cafeteria-db3`: 50% of regular users

---

## 📄 License

This project is licensed under the **MIT License**.

---

## 📞 Support

If you encounter any issues not covered in this README:

1. Check the [Common Errors & Fixes](#-common-errors--fixes) section
2. Review the `PROJECT_REPORT.md` for detailed architecture information
3. Check backend logs for error messages
4. Verify all environment variables are set correctly

---

## 🎉 Getting Started Checklist

- [ ] Node.js 18+ installed
- [ ] PNPM installed globally
- [ ] MongoDB running (local or Atlas)
- [ ] Repository cloned
- [ ] Dependencies installed (`pnpm install`)
- [ ] Backend `.env` file created and configured
- [ ] Frontend `.env.local` file created and configured
- [ ] Backend server running on port 5000
- [ ] Frontend server running on port 3000
- [ ] Admin user created (`node backend/scripts/createAdmin.js`)
- [ ] Application accessible at `http://localhost:3000`

---

**Happy Coding! 🚀**
