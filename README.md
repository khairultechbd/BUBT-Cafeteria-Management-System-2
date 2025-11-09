# BUBT Cafeteria Management System (CMS)

A simple and minimal cafeteria management system built with Next.js, featuring user authentication, role-based access control, and order management.

## Features

### Authentication
- User registration and login with JWT
- Two roles: Admin and User
- User approval workflow (pending → active)
- Secure password handling

### User Features
- Dashboard with quick stats
- Browse available food products
- Place and track orders
- View order history and status
- Manage personal profile
- View department information

### Admin Features
- User management (approve/reject pending users)
- Order notifications and management
- Update order status (pending → accepted → served → completed)
- Dashboard with system statistics

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript
- **Styling**: Tailwind CSS v4, shadcn/ui components
- **Authentication**: JWT (jsonwebtoken)
- **UI Components**: Radix UI, shadcn/ui

## Project Structure

\`\`\`
app/
├── page.tsx                          # Home page
├── login/page.tsx                    # Login page
├── signup/page.tsx                   # Signup page
├── dashboard/page.tsx                # User dashboard
├── products/page.tsx                 # Products listing
├── orders/page.tsx                   # Order history
├── profile/page.tsx                  # User profile
├── department/page.tsx               # Department info
├── admin/
│   ├── users/page.tsx               # User management
│   └── notifications/page.tsx        # Order notifications
└── api/
    ├── auth/
    │   ├── login/route.ts
    │   └── signup/route.ts
    ├── products/route.ts
    ├── orders/route.ts
    ├── dashboard/stats/route.ts
    ├── users/profile/route.ts
    └── admin/
        ├── users/route.ts
        ├── users/[id]/approve/route.ts
        ├── users/[id]/reject/route.ts
        ├── notifications/route.ts
        └── orders/[id]/route.ts

components/
├── navbar.tsx                        # Top navigation bar
└── sidebar.tsx                       # Side navigation
\`\`\`

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository
\`\`\`bash
git clone <repository-url>
cd bubt-cms
\`\`\`

2. Install dependencies
\`\`\`bash
npm install
\`\`\`

3. Run the development server
\`\`\`bash
npm run dev
\`\`\`

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Default Credentials

For testing purposes, the following credentials are pre-configured:

**Admin Account:**
- Email: `admin@bubt.edu.bd`
- Password: `admin123`

**User Account:**
- Email: `user@bubt.edu.bd`
- Password: `user123`

**Pending User (for approval testing):**
- Email: `pending@bubt.edu.bd`
- Password: `pending123`

## Usage

### User Flow
1. Sign up with your details (status: pending)
2. Wait for admin approval
3. Login once approved
4. Browse products and place orders
5. Track order status in real-time

### Admin Flow
1. Login with admin credentials
2. Go to "User Management" to approve/reject pending users
3. Go to "Notifications" to manage orders
4. Update order status as needed

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - Login user

### Products
- `GET /api/products` - Get all products

### Orders
- `GET /api/orders` - Get user's orders
- `POST /api/orders` - Create new order
- `PUT /api/admin/orders/[id]` - Update order status

### Users
- `PUT /api/users/profile` - Update user profile
- `GET /api/admin/users` - Get all users (admin only)
- `PUT /api/admin/users/[id]/approve` - Approve user (admin only)
- `PUT /api/admin/users/[id]/reject` - Reject user (admin only)

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics

## Features Implemented

✅ JWT-based authentication
✅ Role-based access control (Admin/User)
✅ User approval workflow
✅ Product browsing and ordering
✅ Order status tracking
✅ User profile management
✅ Admin dashboard
✅ Order notifications
✅ Department information
✅ Responsive UI with Tailwind CSS
✅ Clean, modular code structure

## Future Enhancements

- MongoDB integration for persistent data storage
- Email notifications for order updates
- Payment integration
- Advanced analytics and reporting
- User ratings and reviews
- Inventory management
- Multiple language support
- Mobile app version

## Notes

- This is a demonstration version using mock data stored in memory
- For production use, integrate with MongoDB or another database
- Implement proper password hashing (bcryptjs is already in dependencies)
- Add environment variables for JWT secret and database URLs
- Implement proper error handling and validation
- Add comprehensive logging

## License

MIT

## Support

For issues or questions, please open an issue in the repository.
