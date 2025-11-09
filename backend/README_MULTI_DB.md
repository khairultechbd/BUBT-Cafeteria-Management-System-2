# Multi-Database Fragmentation System

This system implements database fragmentation across 3+ MongoDB databases.

## Architecture

- **3 Databases**: `db1`, `db2`, `db3`
- **Same Schema**: All databases have identical collections (users, products, orders)
- **Data Fragmentation**: Users and data are distributed across databases based on:
  - Department (primary strategy)
  - Role (admin → db1)
  - Email hash (fallback for even distribution)

## Configuration

### Environment Variables

Update `backend/.env`:

```env
# Option 1: Same cluster, different database names (Recommended for MongoDB Atlas)
MONGODB_URI_DB1=mongodb+srv://user:pass@cluster.mongodb.net/cafeteria-db1?retryWrites=true&w=majority
MONGODB_URI_DB2=mongodb+srv://user:pass@cluster.mongodb.net/cafeteria-db2?retryWrites=true&w=majority
MONGODB_URI_DB3=mongodb+srv://user:pass@cluster.mongodb.net/cafeteria-db3?retryWrites=true&w=majority

# Option 2: Fallback (uses same URI for all databases)
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/cafeteria?retryWrites=true&w=majority

JWT_SECRET=your-secret-key
PORT=5001
NODE_ENV=development
```

### Database Fragmentation Rules (ROLE-BASED)

1. **By User Role** (Primary Strategy):
   - **Admin users** → `db1` (All administrators in one database)
   - **Regular users** → `db2` or `db3` (Distributed evenly by email hash)
     - Email hash % 2 === 0 → `db2`
     - Email hash % 2 === 1 → `db3`

2. **By Email Hash** (Fallback for unknown roles):
   - Hash email → modulo 3 → distribute across db1, db2, db3

## Usage

### Creating Users

Users are automatically assigned to a database based on their role:

```javascript
// Admin user → db1
{
  name: "Admin User",
  email: "admin@example.com",
  role: "admin" // → Goes to db1
}

// Regular user → db2 or db3 (distributed by email)
{
  name: "Regular User",
  email: "user@example.com",
  role: "user" // → Goes to db2 or db3 (evenly distributed)
}
```

### Finding Users

Login/search automatically searches across **all databases**:

- Login: Searches db1 → db2 → db3 until user found
- User lookup: Searches all databases
- Admin queries: Can query across all databases

## Database Structure

Each database (`db1`, `db2`, `db3`) contains:

- `users` collection
- `products` collection
- `orders` collection

All with identical schemas.

## Setup Instructions

1. **Update `.env` file** with your MongoDB Atlas URIs:

```bash
# For same cluster, different databases:
MONGODB_URI_DB1=mongodb+srv://...@cluster.net/cafeteria-db1?...
MONGODB_URI_DB2=mongodb+srv://...@cluster.net/cafeteria-db2?...
MONGODB_URI_DB3=mongodb+srv://...@cluster.net/cafeteria-db3?...
```

2. **Create databases in MongoDB Atlas**:
   - Go to MongoDB Atlas
   - Create 3 databases: `cafeteria-db1`, `cafeteria-db2`, `cafeteria-db3`
   - Collections will be created automatically on first use

3. **Restart backend**:
   ```bash
   cd backend
   npm run dev
   ```

## How It Works

1. **Registration**: 
   - Determines target database based on user department/email
   - Checks all databases for duplicate email
   - Saves to selected database

2. **Login**:
   - Searches all 3 databases to find user
   - Returns user with their `dbKey` in JWT token

3. **Data Queries**:
   - User-specific queries use their `dbKey` from JWT
   - Admin queries can search across all databases

## Customization

To change fragmentation strategy, edit `backend/config/dbManager.js`:

```javascript
const getDatabaseKey = (userData) => {
  // Your custom logic here
  if (userData?.customField === "value1") {
    return "db1"
  }
  // ...
}
```

