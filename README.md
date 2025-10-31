# SOMEN Web Application

Production-ready web application for inventory management, procurement, and measurements with secure authentication and role-based access control.

## Architecture

This application consists of two main parts:
- **Frontend**: React application (Create React App)
- **Backend**: Node.js/Express REST API with PostgreSQL database

## Prerequisites

- Node.js (v14 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn package manager

## Setup Instructions

### 1. Database Setup

First, create a PostgreSQL database:

```bash
# Login to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE somen_db;
```

### 2. Run Database Migrations

Run the initialization SQL script to create all necessary tables:

```bash
psql -U postgres -d somen_db -f server/migrations/init.sql
```

### 3. Create Admin User

Use the seed script to create an initial admin user:

```bash
cd server
npm install
node migrations/seed-admin.js <username> <password>

# Example:
node migrations/seed-admin.js admin SecurePassword123
```

### 4. Backend Configuration

Create a `.env` file in the `server/` directory:

```bash
cd server
cp .env.example .env
```

Edit the `.env` file and configure:

```env
DATABASE_URL=postgresql://username:password@localhost:5432/somen_db
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
PORT=5000
NODE_ENV=development
```

**Important**: Generate a secure random string for `JWT_SECRET` in production!

```bash
# Generate a secure JWT secret (Linux/Mac):
openssl rand -base64 32
```

### 5. Frontend Configuration

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit the `.env` file:

```env
REACT_APP_API_URL=http://localhost:5000/api
```

### 6. Install Dependencies

```bash
# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ..
npm install
```

### 7. Start the Application

**Development Mode:**

Terminal 1 - Backend:
```bash
cd server
npm run dev
```

Terminal 2 - Frontend:
```bash
npm start
```

The frontend will open at `http://localhost:3000` and proxy API requests to `http://localhost:5000`.

**Production Mode:**

```bash
# Build frontend
npm run build

# Start backend (serves both API and static frontend)
cd server
npm start
```

## Testing the Application

### Test Login

1. Navigate to `http://localhost:3000`
2. Use the admin credentials you created with the seed script
3. You should successfully login and see the main dashboard

### Test User Creation

1. Login as admin
2. Go to "Ayarlar" (Settings) menu
3. Click "Yeni Kullanıcı Ekle" (Add New User)
4. Fill in username, password, and select a role
5. Save the user
6. Logout and try logging in with the new user

### Test CRUD Operations

1. **Stock Tracking**: Go to "Stok Takip" menu
   - Add a new product entry
   - Check stock levels
   - Test filters and exports

2. **Measurements**: Go to "Ölçüler" menu
   - Add a new measurement
   - Edit existing measurements
   - Delete measurements
   - Test PDF export

3. **Procurement**: Go to "Satın Alma" menu
   - Add a supplier
   - Create a new order
   - Test order filters

## API Endpoints

All API endpoints require authentication via JWT token (except `/auth/login`).

Include the token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

### Authentication
- `POST /api/auth/login` - Login and get JWT token

### Users
- `GET /api/kullanicilar` - Get all users
- `POST /api/kullanicilar` - Create user
- `PUT /api/kullanicilar/:id` - Update user
- `DELETE /api/kullanicilar/:id` - Delete user

### Roles
- `GET /api/roles` - Get all roles
- `POST /api/roles` - Create role
- `PUT /api/roles/:name` - Update role
- `DELETE /api/roles/:name` - Delete role

### Measurements
- `GET /api/olculler` - Get all measurements
- `POST /api/olculler` - Create measurement
- `PUT /api/olculler/:id` - Update measurement
- `DELETE /api/olculler/:id` - Delete measurement

### Stock Movements
- `GET /api/stok_hareketleri` - Get all stock movements
- `POST /api/stok_hareketleri` - Create stock movement
- `DELETE /api/stok_hareketleri/:id` - Delete stock movement

### Stock Limits
- `GET /api/stok_alt_limitler` - Get all stock limits
- `POST /api/stok_alt_limitler` - Create/update stock limit
- `DELETE /api/stok_alt_limitler/:kod` - Delete stock limit

### Suppliers
- `GET /api/tedarikciler` - Get all suppliers
- `POST /api/tedarikciler` - Create supplier
- `PUT /api/tedarikciler/:id` - Update supplier
- `DELETE /api/tedarikciler/:id` - Delete supplier

### Orders
- `GET /api/siparisler` - Get all orders (with filters)
- `POST /api/siparisler` - Create order
- `PUT /api/siparisler/:id` - Update order
- `DELETE /api/siparisler/:id` - Delete order

### Order Products
- `GET /api/siparis_urunleri` - Get order products
- `POST /api/siparis_urunleri` - Create order product

### Order Logs
- `GET /api/siparis_log` - Get order logs
- `POST /api/siparis_log` - Create order log

## Security Considerations

### Removed Security Issues

This version has removed the following security vulnerabilities:

1. ✅ **BACKDOOR_USER removed**: Hard-coded backdoor credentials have been completely removed
2. ✅ **Supabase keys removed**: All hard-coded Supabase anon keys have been removed
3. ✅ **Server-side password hashing**: Passwords are now hashed on the server using bcrypt
4. ✅ **JWT authentication**: Proper token-based authentication implemented
5. ✅ **Environment variables**: Sensitive configuration moved to .env files

### Key Rotation Recommendations

**If Supabase keys or backdoor credentials were previously exposed:**

1. **Rotate Database Credentials**:
   - Change your PostgreSQL database password
   - Update `DATABASE_URL` in `.env`
   - Restart the backend server

2. **Generate New JWT Secret**:
   ```bash
   openssl rand -base64 32
   ```
   - Update `JWT_SECRET` in server/.env
   - All users will need to login again

3. **Reset User Passwords**:
   - Force all users to change their passwords
   - Or reset passwords manually:
   ```bash
   cd server
   node migrations/seed-admin.js <username> <new-password>
   ```

4. **Audit Access Logs**:
   - Review application logs for suspicious activity
   - Check database access logs
   - Look for unauthorized data access

5. **Update API Keys**:
   - If you had API keys in the old Supabase setup, they are no longer used
   - Ensure no old keys are active in Supabase dashboard

### Best Practices

1. **Never commit .env files** to version control
2. **Use strong JWT secrets** (at least 32 characters)
3. **Enable HTTPS** in production
4. **Regular security updates**: Keep dependencies up to date
5. **Database backups**: Regular automated backups
6. **Monitor logs**: Set up logging and monitoring
7. **Rate limiting**: Consider adding rate limiting to API endpoints

## Database Schema

The database includes the following tables:

- `roller` - User roles and permissions
- `kullanicilar` - Users with hashed passwords
- `olculler` - Measurements data
- `stok_hareketleri` - Stock movements (in/out)
- `stok_alt_limitler` - Stock lower limits
- `tedarikciler` - Suppliers information
- `siparisler` - Orders/purchases
- `siparis_urunleri` - Order line items
- `siparis_log` - Order activity logs

See `server/migrations/init.sql` for the complete schema.

## Troubleshooting

### Backend won't start
- Check PostgreSQL is running: `pg_isready`
- Verify DATABASE_URL is correct in server/.env
- Check for port conflicts (default: 5000)

### Frontend can't connect to backend
- Verify backend is running on correct port
- Check REACT_APP_API_URL in .env
- Check browser console for errors

### Login fails
- Verify user exists in database
- Check JWT_SECRET is set in server/.env
- Clear browser localStorage and try again

### Database connection errors
- Verify PostgreSQL is running
- Check database credentials
- Ensure database exists: `psql -l`

## Support

For issues or questions, please open an issue on the GitHub repository.

## License

Proprietary - All rights reserved
