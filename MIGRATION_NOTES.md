# Migration Notes

This document describes the changes made to secure the application and any manual adjustments that may be needed.

## ✅ Completed Changes

### 1. Backend Security Implementation
- ✅ Created secure Node.js/Express backend in `server/` directory
- ✅ Implemented JWT-based authentication
- ✅ Server-side password hashing with bcrypt (10 rounds)
- ✅ Database connection through secure .env configuration
- ✅ Standardized on `sifre_hash` column for password storage

### 2. Removed Security Vulnerabilities
- ✅ **BACKDOOR_USER removed** from `src/App.js` (lines 13-18 deleted)
- ✅ **Hard-coded Supabase credentials removed** from `src/supabaseClient.js`
- ✅ Client-side password hashing removed (now handled server-side)
- ✅ Direct database access from client disabled

### 3. API Implementation
- ✅ Authentication endpoints (`/api/auth/login`, `/api/auth/verify`)
- ✅ User management endpoints (`/api/kullanicilar`)
- ✅ Role management endpoints (`/api/roles`)
- ✅ Measurements endpoints (`/api/olculler`)
- ✅ Orders/Suppliers endpoints (`/api/siparisler`)
- ✅ Stock tracking endpoints (`/api/stok`)

### 4. Client Updates
All major modules updated to use secure backend API:
- ✅ `src/App.js` - Login flow now uses API
- ✅ `src/AyarlarStokRBAC.jsx` - User and role management via API
- ✅ `src/OlcullerForm.jsx` - Measurements CRUD via API
- ✅ `src/sprs/satinalmaModul.jsx` - Orders and suppliers via API
- ✅ `src/StokTakip.jsx` - Stock tracking via API

### 5. Documentation
- ✅ Comprehensive README.md with setup instructions
- ✅ API endpoint documentation
- ✅ Migration SQL script (`server/migrations/init.sql`)
- ✅ Environment configuration examples (.env.example files)

## ⚠️ Known Limitations / TODO Items

### Stock Management Bulk Operations
In `src/StokTakip.jsx`, two bulk operations are not yet fully implemented via API:

1. **Bulk Update by Product Code** (line ~612)
   - Currently updates are applied only in local state
   - Backend API would need endpoint: `PUT /api/stok/takip/bulk-update`
   - Parameters: `oldProductCode`, `newProductCode`, `newDescription`

2. **Bulk Delete by Product Code** (line ~688)
   - Currently deletes are applied only in local state
   - Backend API would need endpoint: `DELETE /api/stok/takip/bulk-delete/:productCode`

These operations are rare and can be handled manually in the database if needed, or the backend can be extended to support them.

## 📋 Manual Steps Required

### 1. Database Setup
```bash
# Create database
createdb webcal

# Run migrations
psql -d webcal -f server/migrations/init.sql
```

### 2. Change Default Admin Password
The migration creates an admin user with password `admin123`. **Change this immediately:**

```sql
-- After first login, update the password
-- The frontend will hash it and the backend will re-hash
```

Or use the application's "Ayarlar" page to change the password.

### 3. Environment Configuration

**Server (.env)**:
```bash
cp server/.env.example server/.env
# Edit server/.env with your database credentials
```

**Client (.env)**:
```bash
cp .env.example .env
# Usually default values work for local development
```

### 4. Install Dependencies
```bash
# Backend
cd server
npm install

# Client (from root)
cd ..
npm install
```

### 5. Database Column Migration
If you have an existing database with `sifre` column instead of `sifre_hash`:

```sql
ALTER TABLE kullanicilar RENAME COLUMN sifre TO sifre_hash;
```

**Note:** Existing passwords will need to be reset/rehashed after this change.

## 🔍 Testing Checklist

- [ ] Backend starts successfully (`cd server && npm start`)
- [ ] Client starts successfully (`npm start`)
- [ ] Login works with admin/admin123
- [ ] Can create new users
- [ ] Passwords are hashed in database
- [ ] Role management works
- [ ] Measurements CRUD works
- [ ] Orders CRUD works
- [ ] Stock tracking works

## 🔒 Security Verification

Verify these security improvements:
- [ ] No hard-coded credentials in source code
- [ ] Database credentials only in .env (gitignored)
- [ ] JWT tokens expire after 24 hours
- [ ] All passwords stored as bcrypt hashes
- [ ] Direct database access from client disabled
- [ ] All API endpoints require authentication

## 📝 Additional Notes

### API Base URL
The client expects the backend at `http://localhost:5000/api` by default. If deploying to production, update `REACT_APP_API_URL` in the client's `.env` file.

### JWT Secret
The default JWT secret in `server/.env.example` is for development only. Generate a secure random secret for production:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Database SSL
For production databases (like Heroku Postgres), set `DB_SSL=true` in server/.env

### CORS Configuration
The backend allows requests from `http://localhost:3000` by default. Update `CLIENT_URL` in server/.env for production deployment.

## 🚀 Deployment Recommendations

1. **Backend**: Deploy to Heroku, Railway, or similar Node.js hosting
2. **Frontend**: Deploy to Netlify, Vercel, or similar static hosting
3. **Database**: Use managed PostgreSQL (e.g., Heroku Postgres, AWS RDS)
4. **Environment Variables**: Set all required environment variables in hosting platform
5. **HTTPS**: Ensure both frontend and backend use HTTPS in production

## 📞 Support

For issues or questions:
1. Check the README.md for detailed setup instructions
2. Review this migration notes document
3. Check server logs for backend errors
4. Check browser console for frontend errors
