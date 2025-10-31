# SOMEN Web Application - Setup Guide

This guide explains how to set up and run the SOMEN Web Application after the migration to Node/Express backend.

## Prerequisites

- Node.js 16+ and npm
- PostgreSQL 12+
- Git

## Installation Steps

### 1. Clone and Install Dependencies

```bash
# Clone the repository
git clone <repository-url>
cd webcal-sma

# Install client dependencies
npm install

# Install server dependencies
cd server
npm install
cd ..
```

### 2. Database Setup

**Create PostgreSQL Database:**

```bash
createdb somen_web
```

**Run Migrations:**

```bash
psql -d somen_web -f server/migrations/init.sql
```

This will create all necessary tables:
- roles (user roles with permissions)
- kullanicilar (users with hashed passwords)
- olculler (measurements)
- stok_hareketleri (stock movements)
- stok_alt_limitler (stock minimum limits)
- siparisler (orders)
- tedarikciler (suppliers)

### 3. Environment Configuration

**Server Environment (.env in project root or server/.env):**

```bash
# Copy example and edit
cp server/.env.example server/.env

# Edit server/.env with your values:
DATABASE_URL=postgresql://username:password@localhost:5432/somen_web
JWT_SECRET=<generate-a-long-random-string-here>
PORT=3001
```

**Client Environment (.env in project root):**

```bash
# Copy example and edit
cp .env.example .env

# Edit .env with your values:
REACT_APP_API_BASE=http://localhost:3001/api
```

### 4. Create Initial Admin User

Generate a bcrypt hash for your admin password:

```bash
cd server
node -e "const bcrypt = require('bcryptjs'); console.log(bcrypt.hashSync('your-password-here', 10));"
```

Insert the admin user:

```sql
INSERT INTO kullanicilar (kullanici_adi, sifre_hash, rol) 
VALUES ('admin', '$2a$10$...your-hashed-password...', 'root');
```

### 5. Running the Application

**Start the Backend Server:**

```bash
cd server
npm start
# Or for development with auto-reload:
npm run dev
```

The server will start on http://localhost:3001

**Start the Frontend (in a new terminal):**

```bash
# From project root
npm start
```

The app will open at http://localhost:3000

## Testing the Setup

1. Navigate to http://localhost:3000
2. Login with the admin credentials you created
3. Test creating a user
4. Test the various modules (Stok, Ölçüler, Personel, Satın Alma, Ayarlar)

## Architecture Overview

### Backend (Node/Express)
- **Port:** 3001
- **Authentication:** JWT tokens
- **Database:** PostgreSQL via pg driver
- **Password Hashing:** bcrypt (10 rounds)

### Frontend (React)
- **Port:** 3000 (development)
- **API Communication:** Axios
- **Token Storage:** localStorage

### Key Security Features
- ✅ No hard-coded secrets
- ✅ Server-side password hashing
- ✅ JWT-based authentication
- ✅ Role-based access control
- ✅ Environment-based configuration

## API Endpoints

### Authentication
- POST `/api/auth/login` - User login

### Users
- GET `/api/kullanicilar` - List users
- POST `/api/kullanicilar` - Create user
- PUT `/api/kullanicilar/:id` - Update user
- DELETE `/api/kullanicilar/:id` - Delete user

### Roles
- GET `/api/roles` - List roles
- POST `/api/roles` - Create role
- PUT `/api/roles/:id` - Update role
- DELETE `/api/roles/:id` - Delete role

### Stock Management
- GET `/api/stok/hareketler` - List stock movements
- POST `/api/stok/hareketler` - Create stock movement
- PUT `/api/stok/hareketler/:id` - Update stock movement
- DELETE `/api/stok/hareketler/:id` - Delete stock movement
- GET `/api/stok/alt-limitler` - List stock limits
- POST `/api/stok/alt-limitler` - Upsert stock limit

### Measurements
- GET `/api/olculler` - List measurements
- POST `/api/olculler` - Create measurement
- PUT `/api/olculler/:id` - Update measurement
- DELETE `/api/olculler/:id` - Delete measurement

### Orders
- GET `/api/siparisler` - List orders
- POST `/api/siparisler` - Create order
- PUT `/api/siparisler/:id` - Update order
- DELETE `/api/siparisler/:id` - Delete order

### Suppliers
- GET `/api/tedarikciler` - List suppliers
- POST `/api/tedarikciler` - Create supplier
- PUT `/api/tedarikciler/:id` - Update supplier
- DELETE `/api/tedarikciler/:id` - Delete supplier

## Troubleshooting

### Database Connection Issues
- Verify PostgreSQL is running: `pg_isready`
- Check DATABASE_URL in server/.env
- Ensure database exists: `psql -l | grep somen_web`

### Authentication Issues
- Clear browser localStorage
- Verify JWT_SECRET is set in server/.env
- Check server logs for token verification errors

### API Connection Issues
- Verify backend is running on port 3001
- Check REACT_APP_API_BASE in .env
- Open browser DevTools Network tab to see API requests

### Port Already in Use
```bash
# Find and kill process using port 3001
lsof -ti:3001 | xargs kill -9

# Or use a different port in server/.env
PORT=3002
```

## Production Deployment

### Security Checklist
- [ ] Change JWT_SECRET to a strong random value
- [ ] Use HTTPS in production
- [ ] Set NODE_ENV=production
- [ ] Configure CORS properly
- [ ] Use environment variables for all secrets
- [ ] Rotate Supabase keys (if previously used)
- [ ] Set up proper database backups
- [ ] Configure rate limiting
- [ ] Enable logging and monitoring

### Build for Production

```bash
# Build frontend
npm run build

# Serve frontend with a static server or configure your web server
# Run backend with PM2 or similar process manager
```

## Support

For issues or questions, please check:
1. This setup guide
2. SECURITY_NOTES.md for security-related information
3. Server logs in the console
4. Browser console for frontend errors
