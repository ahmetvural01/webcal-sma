# SOMEN Web Application

Full-featured web application for inventory, purchasing, and personnel management with role-based access control (RBAC).

## 🔒 Security Updates

This repository has been updated to implement secure backend architecture:

- ✅ Removed hard-coded credentials and backdoor access
- ✅ Implemented server-side password hashing with bcrypt
- ✅ Added JWT-based authentication
- ✅ Moved all database operations to secure backend API
- ✅ Standardized on `sifre_hash` column for password storage

## 📋 Prerequisites

- Node.js (v14 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

## 🚀 Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/ahmetvural01/webcal-sma.git
cd webcal-sma
```

### 2. Database Setup

Create a PostgreSQL database:

```bash
createdb webcal
```

Run the migration script to create tables and initial data:

```bash
psql -d webcal -f server/migrations/init.sql
```

**Important**: The migration creates a default admin user with password `admin123`. You should change this immediately after setup.

### 3. Backend Setup

```bash
cd server
npm install
```

Copy the environment example file and configure it:

```bash
cp .env.example .env
```

Edit `.env` with your database credentials:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=webcal
DB_USER=your_db_username
DB_PASSWORD=your_db_password
JWT_SECRET=your-super-secret-jwt-key-change-this
```

Start the backend server:

```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

The backend API will run on `http://localhost:5000`

### 4. Frontend Setup

Open a new terminal in the project root:

```bash
npm install
```

Copy the client environment example:

```bash
cp .env.example .env
```

The default configuration should work if your backend is running on port 5000:

```env
REACT_APP_API_URL=http://localhost:5000/api
```

Start the frontend:

```bash
npm start
```

The application will open in your browser at `http://localhost:3000`

## 👥 Default Login

After running the migrations, you can login with:

- **Username**: `admin`
- **Password**: `admin123`

**⚠️ IMPORTANT**: Change this password immediately after first login!

### Creating Additional Users

1. Login as admin
2. Go to "Ayarlar" (Settings) menu
3. Click "Yeni Kullanıcı" (New User)
4. Fill in the form with username, password, and role
5. Passwords are automatically hashed on the server side

## 🏗️ Architecture

### Backend (server/)

- **Express.js** REST API
- **PostgreSQL** database
- **JWT** authentication
- **bcrypt** password hashing
- Organized route handlers for different modules

### Frontend (React)

- Material-UI components
- Axios for API communication
- Role-based access control
- Modern, responsive design

### Database Schema

Main tables:
- `kullanicilar` - Users with hashed passwords
- `roller` - Roles and permissions
- `olculler` - Measurements
- `siparisler` - Orders
- `tedarikciler` - Suppliers
- `stok_takip` - Stock tracking

## 🔐 Security Notes

### Password Handling

- All passwords are hashed using bcrypt with 10 rounds
- Passwords are NEVER stored in plain text
- Password hashing happens server-side only
- The database uses `sifre_hash` column for storing hashed passwords

### Authentication Flow

1. User submits credentials to `/api/auth/login`
2. Backend verifies password against hashed value
3. JWT token is issued on successful login
4. Token must be included in all subsequent API requests
5. Token expires after 24 hours

### API Security

- All API endpoints require authentication (except login)
- JWT tokens are verified on every request
- Role-based permissions are enforced server-side
- Database credentials are never exposed to client

## 📚 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `GET /api/auth/verify` - Verify JWT token

### Users
- `GET /api/kullanicilar` - Get all users
- `POST /api/kullanicilar` - Create user (password will be hashed)
- `PUT /api/kullanicilar/:id` - Update user
- `DELETE /api/kullanicilar/:id` - Delete user

### Roles
- `GET /api/roles` - Get all roles
- `POST /api/roles` - Create role (root only)
- `PUT /api/roles/:id` - Update role (root only)
- `DELETE /api/roles/:id` - Delete role (root only)

### Measurements
- `GET /api/olculler` - Get all measurements
- `POST /api/olculler` - Create measurement
- `PUT /api/olculler/:id` - Update measurement
- `DELETE /api/olculler/:id` - Delete measurement

### Orders
- `GET /api/siparisler` - Get all orders (with filters)
- `POST /api/siparisler` - Create order
- `PUT /api/siparisler/:id` - Update order
- `DELETE /api/siparisler/:id` - Delete order

### Suppliers
- `GET /api/siparisler/tedarikciler/list` - Get all suppliers
- `POST /api/siparisler/tedarikciler` - Create supplier

## 🧪 Testing

### Test User Creation

```bash
curl -X POST http://localhost:5000/api/kullanicilar \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "kullanici_adi": "testuser",
    "sifre": "testpassword123",
    "rol": "user",
    "extra_permissions": [],
    "removed_permissions": []
  }'
```

### Test Login

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123"
  }'
```

## 🛠️ Development

### Running in Development Mode

Backend with auto-reload:
```bash
cd server
npm run dev
```

Frontend with auto-reload:
```bash
npm start
```

### Environment Variables

**Server (.env)**:
- `PORT` - Server port (default: 5000)
- `DB_HOST` - Database host
- `DB_PORT` - Database port
- `DB_NAME` - Database name
- `DB_USER` - Database user
- `DB_PASSWORD` - Database password
- `JWT_SECRET` - Secret key for JWT tokens
- `CLIENT_URL` - Frontend URL for CORS

**Client (.env)**:
- `REACT_APP_API_URL` - Backend API URL

## 📝 Migration Notes

If you have an existing database with `sifre` column instead of `sifre_hash`:

```sql
-- Rename the column
ALTER TABLE kullanicilar RENAME COLUMN sifre TO sifre_hash;

-- Note: Existing passwords will need to be rehashed
-- Users will need to reset their passwords or
-- you'll need to manually hash and update each password
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📄 License

This project is proprietary software. All rights reserved.

## 🆘 Support

For issues or questions:
1. Check existing GitHub issues
2. Create a new issue with detailed description
3. Include error messages and steps to reproduce

## 🔄 Updates & Changelog

### v2.0.0 - Security Overhaul
- Removed backdoor access and hard-coded credentials
- Implemented secure backend API with JWT authentication
- Server-side password hashing with bcrypt
- Standardized database schema with `sifre_hash` column
- Added comprehensive API documentation
- Improved error handling and logging
