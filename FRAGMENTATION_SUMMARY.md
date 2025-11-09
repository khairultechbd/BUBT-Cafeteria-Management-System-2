# Database Fragmentation Summary

## Quick Reference

### Database Distribution

| Collection | db1 (cafeteria-db1) | db2 (cafeteria-db2) | db3 (cafeteria-db3) |
|-----------|---------------------|---------------------|---------------------|
| **Users (admin)** | ✅ 100% | ❌ | ❌ |
| **Users (regular)** | ❌ | ✅ 50% | ✅ 50% |
| **Products** | ✅ 100% | ❌ | ❌ |
| **Orders** | ✅ (referenced) | ✅ (user's orders) | ✅ (user's orders) |
| **Notifications** | ✅ (referenced) | ✅ (user's notifications) | ✅ (user's notifications) |

### Fragmentation Rules

1. **Admin Users** → Always go to `db1`
   - All admin accounts stored in db1
   - Easier management and access control

2. **Regular Users** → Split between `db2` and `db3`
   - Distribution: 50% in db2, 50% in db3
   - Algorithm: `email hash % 2`
   - Ensures even load distribution

3. **Products** → Always in `db1`
   - Centralized product catalog
   - All orders reference products in db1
   - Ensures consistency

4. **Orders** → Stored with user's database
   - User in db2 → Order in db2
   - User in db3 → Order in db3
   - But `productId` references db1

5. **Notifications** → Stored with user's database
   - User in db2 → Notification in db2
   - User in db3 → Notification in db3

### Code Implementation

**Fragmentation Logic**: `backend/config/dbManager.js`

```javascript
// Get database key based on user data
getDatabaseKey(userData) {
  if (role === "admin") return "db1"
  if (role === "user") {
    const hash = email.charCodeAt(0) + email.charCodeAt(1) + ...
    return (hash % 2 === 0) ? "db2" : "db3"
  }
}
```

**Usage**: `backend/routes/authRoutes.js`

```javascript
// During registration
const dbKey = getDatabaseForUser({ role, email })
const User = await getUserModel(dbKey)
const user = new User({ ...userData })
await user.save() // Saved to correct database
```

### Cross-Database Queries

**For Admin Operations**: `backend/utils/modelFactory.js`

```javascript
// Query all databases
const allUsers = await queryAllDatabases(
  "User",
  async (Model) => Model.find(),
  userSchema
)
```

**Used In**:
- Admin user list (`userRoutes.js`)
- Admin order list (`orderRoutes.js`)
- Admin notifications (`notificationRoutes.js`)
- Dashboard statistics (`dashboardRoutes.js`)

### Benefits

1. **Scalability**: Easy to add more databases (db4, db5, etc.)
2. **Load Distribution**: User load split between db2/db3
3. **Consistency**: Products centralized in db1
4. **Performance**: Reduced query load per database
5. **Flexibility**: Can adjust fragmentation strategy easily

---

**See**: `PROJECT_REPORT.md` for complete documentation

