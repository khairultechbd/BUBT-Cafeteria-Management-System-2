# Cafeteria Management System - Complete Project Report

## 📋 Table of Contents
1. [Project Overview](#project-overview)
2. [Database Fragmentation Strategy](#database-fragmentation-strategy)
3. [Architecture](#architecture)
4. [File Structure & Implementation](#file-structure--implementation)
5. [Features Implemented](#features-implemented)
6. [Backend Implementation](#backend-implementation)
7. [Frontend Implementation](#frontend-implementation)
8. [Environment Setup](#environment-setup)

---

## 🎯 Project Overview

This is a **full-stack cafeteria management system** built with:
- **Frontend**: Next.js 16 (App Router) with TypeScript
- **Backend**: Express.js with Node.js
- **Database**: MongoDB with **multi-database fragmentation (sharding)**
- **Authentication**: JWT-based authentication
- **UI Components**: Radix UI with Tailwind CSS

The system supports:
- User registration and approval workflow
- Bengali food menu management with time categories (Morning, Day, Evening)
- Order management with status tracking
- Real-time notifications
- Admin dashboard with statistics
- Multi-database architecture for scalability

---

## 🗄️ Database Fragmentation Strategy

### Fragmentation Overview

The system uses **3 separate MongoDB databases** for horizontal scaling and data distribution:

```
┌─────────────────────────────────────────────────────────┐
│                   FRAGMENTATION STRATEGY                  │
└─────────────────────────────────────────────────────────┘

Database 1 (db1 - cafeteria-db1)
├── All Admin Users
├── All Products/Food Items
└── Orders placed by users in db2/db3 (referenced)

Database 2 (db2 - cafeteria-db2)
├── Regular Users (50% - even email hash)
├── Orders (placed by users in db2)
└── Notifications (for users in db2)

Database 3 (db3 - cafeteria-db3)
├── Regular Users (50% - odd email hash)
├── Orders (placed by users in db3)
└── Notifications (for users in db3)
```

### Fragmentation Logic

**Location**: `backend/config/dbManager.js`

```javascript
getDatabaseKey(userData) {
  // 1. Admins → db1
  if (role === "admin") return "db1"
  
  // 2. Regular Users → db2 or db3 (based on email hash)
  if (role === "user") {
    hash = email.charCodeAt(0) + email.charCodeAt(1) + ...
    return (hash % 2 === 0) ? "db2" : "db3"
  }
}
```

### Key Benefits

1. **Load Distribution**: Users split between db2/db3 reduces load
2. **Scalability**: Easy to add more databases (db4, db5, etc.)
3. **Admin Centralization**: All admins in db1 for easier management
4. **Product Centralization**: All products in db1 for consistency
5. **Cross-Database Queries**: Admin can query across all databases

### Database Schema Distribution

| Collection | db1 | db2 | db3 |
|-----------|-----|-----|-----|
| Users (admin) | ✅ All | ❌ | ❌ |
| Users (regular) | ❌ | ✅ 50% | ✅ 50% |
| Products | ✅ All | ❌ | ❌ |
| Orders | ✅ (all referenced) | ✅ (user's orders) | ✅ (user's orders) |
| Notifications | ✅ (all referenced) | ✅ (user's notifications) | ✅ (user's notifications) |

---

## 🏗️ Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    CLIENT LAYER                          │
│  Next.js App Router (React + TypeScript)                │
│  - Pages (app/)                                          │
│  - Components (components/)                            │
│  - Hooks (hooks/)                                        │
│  - Utils (lib/)                                          │
└────────────────────┬────────────────────────────────────┘
                     │ HTTP/REST
┌────────────────────▼────────────────────────────────────┐
│                  API GATEWAY                             │
│  Express.js Server (Port 5001)                          │
│  - Authentication Middleware                             │
│  - Route Handlers                                        │
│  - Error Handling                                        │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│              DATABASE ABSTRACTION LAYER                  │
│  dbManager.js                                           │
│  - Connection Management                                 │
│  - Fragmentation Logic                                  │
│                                                           │
│  modelFactory.js                                         │
│  - Dynamic Model Creation                                │
│  - Cross-Database Queries                                │
└────────────────────┬────────────────────────────────────┘
                     │
        ┌────────────┼────────────┐
        │            │            │
┌───────▼─────┐ ┌────▼────┐ ┌─────▼──────┐
│   MongoDB   │ │ MongoDB │ │  MongoDB  │
│   db1       │ │   db2   │ │    db3    │
│ (cafeteria- │ │(cafeteria│ │(cafeteria │
│   -db1)     │ │  -db2)  │ │   -db3)   │
└─────────────┘ └─────────┘ └───────────┘
```

### Request Flow Example

```
User Login Request
    ↓
[Next.js Frontend] → POST /api/auth/login
    ↓
[Express Backend] → authRoutes.js
    ↓
[dbManager] → getDatabaseForUser(userData)
    ↓
[modelFactory] → getUserModel(dbKey)
    ↓
[Query db1/db2/db3] → Find user
    ↓
[Generate JWT] → Include dbKey in token
    ↓
[Response] → Return user + token
```

---

## 📁 File Structure & Implementation

### Backend Structure

```
backend/
├── config/
│   ├── dbManager.js          ⭐ Database connection & fragmentation
│   └── db.js                 (Legacy, not used)
│
├── middleware/
│   └── authMiddleware.js     ⭐ JWT authentication & authorization
│
├── models/
│   ├── schemas.js            ⭐ Shared Mongoose schemas (User, Product, Order, Notification)
│   ├── User.js               (Legacy, replaced by schemas.js)
│   ├── Product.js            (Legacy, replaced by schemas.js)
│   └── Order.js              (Legacy, replaced by schemas.js)
│
├── routes/
│   ├── authRoutes.js         ⭐ User registration & login
│   ├── userRoutes.js         ⭐ User management (CRUD, approve/reject)
│   ├── productRoutes.js      ⭐ Food items management (CRUD)
│   ├── orderRoutes.js        ⭐ Order management (create, status updates)
│   ├── notificationRoutes.js ⭐ Notification system
│   └── dashboardRoutes.js    ⭐ Dashboard statistics
│
├── utils/
│   └── modelFactory.js       ⭐ Dynamic model creation for multi-DB
│
├── scripts/
│   ├── createAdmin.js        ⭐ Script to create admin user
│   └── seedBengaliFoods.js   ⭐ Script to seed Bengali food items
│
├── server.js                 ⭐ Express server setup & routes
└── nodemon.json              ⭐ Development configuration
```

### Frontend Structure

```
app/
├── layout.tsx                ⭐ Root layout with Toaster
├── page.tsx                  ⭐ Home page (redirects)
│
├── login/                    ⭐ Authentication pages
│   └── page.tsx
├── signup/
│   └── page.tsx
│
├── dashboard/                ⭐ User dashboard
│   └── page.tsx
├── products/                 ⭐ Food items browsing & ordering
│   └── page.tsx
├── orders/                   ⭐ User order history
│   └── page.tsx
├── profile/                  ⭐ User profile management
│   └── page.tsx
│
├── admin/                    ⭐ Admin panels
│   ├── users/
│   │   └── page.tsx          ⭐ User approval/rejection
│   ├── orders/
│   │   └── page.tsx          ⭐ Order management
│   ├── food-items/
│   │   └── page.tsx          ⭐ Food items CRUD
│   └── notifications/
│       └── page.tsx          ⭐ Notification center
│
└── api/                      (Legacy Next.js API routes - not used, backend handles)

components/
├── ui/                       ⭐ Reusable UI components
│   ├── button.tsx
│   ├── card.tsx
│   ├── input.tsx
│   ├── toast.tsx             ⭐ Toast notification component
│   └── toaster.tsx           ⭐ Toast provider
│
├── sidebar.tsx               ⭐ Navigation sidebar
├── topbar.tsx                ⭐ Top navigation bar
├── stat-card.tsx             ⭐ Statistics card component
├── status-badge.tsx          ⭐ Status badge component
└── search-input.tsx          ⭐ Search input component

hooks/
├── use-debounce.ts           ⭐ Debounce hook for search
└── use-toast.ts              ⭐ Toast notification hook

lib/
├── api.ts                    ⭐ API fetch utility with auth
└── utils.ts                  ⭐ Utility functions (cn, etc.)
```

---

## ✨ Features Implemented

### 1. User Management
- ✅ User registration with role selection
- ✅ Admin approval workflow (pending → active)
- ✅ User fragmentation across db2/db3
- ✅ Profile management (update name, email, password)
- ✅ JWT-based authentication
- ✅ Role-based access control (user/admin)

**Files**:
- `backend/routes/authRoutes.js` - Registration & login
- `backend/routes/userRoutes.js` - User management
- `app/login/page.tsx` - Login UI
- `app/signup/page.tsx` - Registration UI
- `app/profile/page.tsx` - Profile management
- `app/admin/users/page.tsx` - Admin user approval

### 2. Food Items Management
- ✅ Bengali food items with time categories:
  - 🌅 Morning (breakfast items)
  - 🍛 Day (lunch items)
  - 🌆 Evening (dinner/snacks)
- ✅ CRUD operations for food items
- ✅ Product availability toggle
- ✅ Price management
- ✅ Category and description fields

**Files**:
- `backend/routes/productRoutes.js` - Product CRUD API
- `backend/scripts/seedBengaliFoods.js` - Seed script for Bengali foods
- `app/products/page.tsx` - User food browsing & ordering
- `app/admin/food-items/page.tsx` - Admin food management

**Time Categories**:
```javascript
timeCategory: {
  type: String,
  enum: ["morning", "day", "evening"],
  required: true
}
```

### 3. Order Management
- ✅ Order placement by users
- ✅ Order status workflow:
  ```
  pending → accepted → served → completed
            ↓
         rejected
  ```
- ✅ Order notifications for status changes
- ✅ Order history for users
- ✅ Admin order management with quick actions

**Files**:
- `backend/routes/orderRoutes.js` - Order CRUD & status updates
- `app/products/page.tsx` - Order placement UI
- `app/orders/page.tsx` - User order history
- `app/admin/orders/page.tsx` - Admin order management

### 4. Notification System
- ✅ Real-time notifications for order status changes
- ✅ Notification types:
  - `order_placed` - New order notification
  - `order_accepted` - Order accepted by admin
  - `order_rejected` - Order rejected by admin
  - `order_served` - Order marked as served
- ✅ Read/unread status tracking
- ✅ Admin notification center with full order details
- ✅ Mark as read / Mark all as read functionality

**Files**:
- `backend/routes/notificationRoutes.js` - Notification API
- `app/admin/notifications/page.tsx` - Admin notification center
- Notification creation in `backend/routes/orderRoutes.js`

### 5. Dashboard & Statistics
- ✅ User dashboard with personal stats:
  - Total orders
  - Pending orders
  - Completed orders
- ✅ Admin dashboard with system-wide stats:
  - Total users
  - Total products
  - Total orders (all users)
  - Pending orders (all users)
- ✅ Cross-database aggregation for admin

**Files**:
- `backend/routes/dashboardRoutes.js` - Dashboard stats API
- `app/dashboard/page.tsx` - Dashboard UI

### 6. Toast Notification System
- ✅ Replaced all browser `alert()` with toast notifications
- ✅ Three variants: success, destructive, default
- ✅ Auto-dismiss after 5 seconds
- ✅ Manual close option
- ✅ Used across all pages:
  - Order placement
  - Profile updates
  - Admin actions (accept/reject orders, update status)
  - Food item CRUD
  - User approval/rejection

**Files**:
- `components/ui/toast.tsx` - Toast component
- `components/ui/toaster.tsx` - Toast provider
- `hooks/use-toast.ts` - Toast hook
- `app/layout.tsx` - Toaster integration

---

## 🔧 Backend Implementation Details

### Database Connection Management

**File**: `backend/config/dbManager.js`

**Key Functions**:
1. `getDatabaseKey(userData)` - Determines which database to use
2. `getDatabaseURI(dbKey)` - Constructs MongoDB URI for specific database
3. `connectToDatabase(dbKey)` - Connects to a specific database
4. `connectAllDatabases()` - Connects to all 3 databases on startup
5. `getConnection(dbKey)` - Retrieves cached connection
6. `closeAllConnections()` - Graceful shutdown

**Connection Caching**:
- Connections are cached to avoid reconnection overhead
- Automatic reconnection if connection is lost
- Supports MongoDB Atlas and local MongoDB

### Dynamic Model Factory

**File**: `backend/utils/modelFactory.js`

**Key Functions**:
1. `getModel(modelName, schema, dbKey)` - Creates model for specific database
2. `getUserModel(dbKey)` - Get User model
3. `getProductModel(dbKey)` - Get Product model
4. `getOrderModel(dbKey)` - Get Order model
5. `getNotificationModel(dbKey)` - Get Notification model
6. `queryAllDatabases(modelName, queryFn, schema)` - Query across all databases (admin)

**Model Caching**:
- Models are cached per database to avoid recreation
- Automatically handles connection state

### Authentication & Authorization

**File**: `backend/middleware/authMiddleware.js`

**Middleware**:
- `protect` - Verifies JWT token, attaches user to `req.user`
- `adminOnly` - Ensures user has admin role

**JWT Payload**:
```javascript
{
  id: userId,
  email: userEmail,
  role: userRole,
  dbKey: userDatabaseKey  // Critical for multi-DB access
}
```

### Route Handlers

#### Authentication Routes (`authRoutes.js`)
- `POST /api/auth/register` - User registration with fragmentation
- `POST /api/auth/login` - User login with cross-database search

#### User Routes (`userRoutes.js`)
- `GET /api/users` - Get all users (admin, cross-database)
- `GET /api/users/profile` - Get current user profile
- `PUT /api/users/profile` - Update profile
- `PUT /api/users/:id/approve` - Approve user (admin)
- `PUT /api/users/:id/reject` - Reject user (admin)

#### Product Routes (`productRoutes.js`)
- `GET /api/products` - Get all products (from db1)
- `GET /api/products/time/:category` - Get products by time category
- `POST /api/products` - Create product (admin, db1)
- `PUT /api/products/:id` - Update product (admin, db1)
- `DELETE /api/products/:id` - Delete product (admin, db1)

#### Order Routes (`orderRoutes.js`)
- `POST /api/orders` - Create order (user)
- `GET /api/orders/my-orders` - Get user's orders
- `GET /api/orders` - Get all orders (admin, cross-database)
- `GET /api/orders/pending` - Get pending orders (admin)
- `PUT /api/orders/:id/accept` - Accept order (admin)
- `PUT /api/orders/:id/reject` - Reject order (admin)
- `PUT /api/orders/:id/status` - Update order status (admin)

#### Notification Routes (`notificationRoutes.js`)
- `GET /api/notifications` - Get user's notifications
- `GET /api/notifications/admin/all` - Get all notifications (admin, cross-database)
- `GET /api/notifications/unread-count` - Get unread count
- `PUT /api/notifications/:id/read` - Mark as read
- `PUT /api/notifications/read-all` - Mark all as read

#### Dashboard Routes (`dashboardRoutes.js`)
- `GET /api/dashboard/stats` - Get dashboard statistics
  - User stats (personal orders)
  - Admin stats (system-wide, cross-database)

### Manual Population Strategy

**Problem**: Mongoose `populate()` doesn't work across different database connections.

**Solution**: Manual population in route handlers:
1. Extract ObjectId from reference
2. Query the source database directly
3. Attach populated data to response object

**Example** (from `orderRoutes.js`):
```javascript
// Manually populate product from db1
const ProductDb1 = await getProductModel("db1")
const product = await ProductDb1.findById(productId)
order.productId = product.toObject()

// Manually populate user from db1/db2/db3
let user = await UserDb1.findById(userId)
if (!user) user = await UserDb2.findById(userId)
if (!user) user = await UserDb3.findById(userId)
order.userId = user.toObject()
```

---

## 🎨 Frontend Implementation Details

### API Integration

**File**: `lib/api.ts`

**Functions**:
- `getApiBaseUrl()` - Gets API base URL from environment
- `apiFetch(url, options)` - Fetch wrapper with automatic:
  - Authorization header (JWT token from localStorage)
  - Content-Type header
  - Error handling

**Usage**:
```typescript
const response = await apiFetch("/api/orders", {
  method: "POST",
  body: JSON.stringify({ productId, quantity })
})
```

### Component Structure

#### Layout Components
- `components/sidebar.tsx` - Navigation sidebar with role-based menu
- `components/topbar.tsx` - Top bar with user info and logout
- `app/layout.tsx` - Root layout with Toaster integration

#### UI Components
- `components/ui/button.tsx` - Button component (Radix UI)
- `components/ui/card.tsx` - Card component
- `components/ui/input.tsx` - Input component
- `components/ui/toast.tsx` - Toast notification component
- `components/ui/toaster.tsx` - Toast provider

#### Feature Components
- `components/stat-card.tsx` - Statistics card display
- `components/status-badge.tsx` - Status badge (pending, accepted, etc.)
- `components/search-input.tsx` - Search input with icon

### Page Components

#### User Pages
- `app/products/page.tsx` - Food items browsing with time category filters
- `app/orders/page.tsx` - User order history
- `app/profile/page.tsx` - Profile management with toast notifications
- `app/dashboard/page.tsx` - Dashboard with statistics

#### Admin Pages
- `app/admin/users/page.tsx` - User approval interface
- `app/admin/orders/page.tsx` - Order management with quick actions
- `app/admin/food-items/page.tsx` - Food items CRUD interface
- `app/admin/notifications/page.tsx` - Notification center with filtering

### State Management

- **Local Storage**: Used for JWT token and user data
- **React State**: Component-level state management
- **No Global State**: No Redux/Context needed for current scope

### Toast Notifications

**Implementation**:
- Toast component using Radix UI
- Custom hook `useToast()` for easy access
- Three variants: `success`, `destructive`, `default`
- Auto-dismiss: 5 seconds
- Position: Top-right corner

**Usage**:
```typescript
const { toast } = useToast()

toast({
  variant: "success",
  title: "Success",
  description: "Order placed successfully!"
})
```

---

## 🔐 Environment Setup

### Backend Environment Variables

**File**: `backend/.env`

```env
PORT=5001
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your-secret-key-here
```

**Database URIs**: Automatically derived from `MONGODB_URI`:
- `cafeteria-db1` - Admin database
- `cafeteria-db2` - User database (50%)
- `cafeteria-db3` - User database (50%)

### Frontend Environment Variables

**File**: `.env.local`

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:5001
```

### Running the Application

**Start Backend**:
```bash
cd backend
npm run dev
```

**Start Frontend**:
```bash
npm run dev
```

**Start Both**:
```bash
npm run dev:all
```

**Stop All Servers**:
```bash
npm run stop
```

### Database Scripts

**Create Admin User**:
```bash
cd backend
node scripts/createAdmin.js
```

**Seed Bengali Foods**:
```bash
cd backend
node scripts/seedBengaliFoods.js
```

---

## 📊 Data Models

### User Schema

```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  role: String (enum: ["admin", "user"]),
  status: String (enum: ["pending", "active", "inactive"]),
  department: String,
  createdAt: Date,
  updatedAt: Date
}
```

**Distribution**: Admins → db1, Users → db2/db3

### Product Schema

```javascript
{
  name: String,
  price: Number,
  description: String,
  category: String,
  timeCategory: String (enum: ["morning", "day", "evening"]),
  available: Boolean,
  image: String,
  createdAt: Date,
  updatedAt: Date
}
```

**Distribution**: All products → db1

### Order Schema

```javascript
{
  userId: ObjectId (ref: User),
  productId: ObjectId (ref: Product),
  quantity: Number,
  totalPrice: Number,
  status: String (enum: ["pending", "accepted", "rejected", "served", "completed"]),
  orderDate: Date,
  createdAt: Date,
  updatedAt: Date
}
```

**Distribution**: Orders → db2/db3 (where user is), but productId references db1

### Notification Schema

```javascript
{
  userId: ObjectId (ref: User),
  orderId: ObjectId (ref: Order),
  type: String (enum: ["order_placed", "order_accepted", "order_rejected", "order_served"]),
  title: String,
  message: String,
  read: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

**Distribution**: Notifications → db2/db3 (where user is)

---

## 🚀 Key Features Summary

### ✅ Implemented Features

1. **Multi-Database Fragmentation**
   - Role-based user distribution
   - Email hash-based user sharding
   - Centralized products and admin users
   - Cross-database query support for admin

2. **User Management**
   - Registration with approval workflow
   - Profile management
   - Admin user approval/rejection

3. **Food Management**
   - Bengali food items with time categories
   - CRUD operations
   - Availability toggle

4. **Order Management**
   - Order placement
   - Status workflow (pending → accepted → served → completed)
   - Order history
   - Admin order management

5. **Notification System**
   - Real-time order notifications
   - Read/unread tracking
   - Admin notification center
   - Cross-database notification aggregation

6. **Dashboard**
   - User statistics
   - Admin system-wide statistics
   - Cross-database aggregation

7. **UI/UX**
   - Toast notifications (replaced alerts)
   - Responsive design
   - Modern UI components
   - Search and filtering

### 🔄 Future Enhancements (Not Implemented)

- Real-time WebSocket notifications
- Order cancellation by users
- Payment integration
- Order tracking map
- Email notifications
- Analytics dashboard
- Inventory management
- Multi-language support (Bengali/English)

---

## 📝 Notes

### Cross-Database Considerations

1. **Populate Limitation**: Mongoose `populate()` doesn't work across databases, so manual population is used.

2. **JWT Token**: Includes `dbKey` to quickly identify user's database.

3. **Admin Queries**: Admin operations use `queryAllDatabases()` to aggregate data from all databases.

4. **Order References**: Orders reference products in db1, but are stored in db2/db3.

5. **Notification References**: Notifications reference orders in the same database as the user.

### Best Practices Implemented

1. **Connection Pooling**: Database connections are cached and reused.
2. **Error Handling**: Graceful error handling with try-catch blocks.
3. **Security**: JWT tokens, password hashing (bcrypt), input validation.
4. **Code Organization**: Separation of concerns (routes, models, utils).
5. **Type Safety**: TypeScript for frontend, JSDoc for backend.
6. **Responsive Design**: Mobile-friendly UI components.

---

## 📞 Support & Documentation

- **Database Fragmentation**: See `backend/config/dbManager.js`
- **Model Factory**: See `backend/utils/modelFactory.js`
- **API Documentation**: See individual route files in `backend/routes/`
- **Frontend Components**: See `components/` directory

---

**Last Updated**: 2025-01-01
**Version**: 1.0.0
**Status**: Production Ready ✅

