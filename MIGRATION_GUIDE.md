# Migration Guide: Supabase to Self-Hosted Backend

This guide helps you migrate from the Supabase-based version to the new self-hosted backend.

## Overview

This migration involves:
1. Setting up a local/hosted PostgreSQL database
2. Running database migrations
3. Migrating existing data (if any)
4. Configuring and starting the new backend
5. Testing the application

## Step-by-Step Migration

### Step 1: Backup Existing Data (If Applicable)

If you have existing data in Supabase, export it first:

1. Go to your Supabase dashboard
2. Navigate to SQL Editor
3. Export each table:

```sql
-- Export users (passwords will need to be reset)
COPY (SELECT * FROM kullanicilar) TO STDOUT WITH CSV HEADER;

-- Export roles
COPY (SELECT * FROM roller) TO STDOUT WITH CSV HEADER;

-- Export measurements
COPY (SELECT * FROM olculler) TO STDOUT WITH CSV HEADER;

-- Export stock movements
COPY (SELECT * FROM stok_hareketleri) TO STDOUT WITH CSV HEADER;

-- Export stock limits
COPY (SELECT * FROM stok_alt_limitler) TO STDOUT WITH CSV HEADER;

-- Export suppliers
COPY (SELECT * FROM tedarikciler) TO STDOUT WITH CSV HEADER;

-- Export orders
COPY (SELECT * FROM siparisler) TO STDOUT WITH CSV HEADER;

-- Export order products
COPY (SELECT * FROM siparis_urunleri) TO STDOUT WITH CSV HEADER;

-- Export order logs
COPY (SELECT * FROM siparis_log) TO STDOUT WITH CSV HEADER;
```

Save each export to a CSV file.

### Step 2: Set Up PostgreSQL

#### Option A: Local PostgreSQL

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install postgresql postgresql-contrib

# macOS (with Homebrew)
brew install postgresql
brew services start postgresql

# Create database
sudo -u postgres psql -c "CREATE DATABASE somen_db;"
```

#### Option B: Cloud PostgreSQL

Use any PostgreSQL hosting service:
- AWS RDS
- Google Cloud SQL
- Azure Database for PostgreSQL
- DigitalOcean Managed Databases
- Heroku Postgres

Get the connection string and skip to Step 3.

### Step 3: Run Database Migrations

```bash
# Clone the repository
cd /path/to/webcal-sma

# Run the init script
psql -U postgres -d somen_db -f server/migrations/init.sql
```

### Step 4: Import Existing Data

If you have data from Supabase:

```bash
# Import roles first (due to foreign key constraints)
psql -U postgres -d somen_db -c "\COPY roller FROM 'roles.csv' CSV HEADER"

# Import suppliers (has no dependencies)
psql -U postgres -d somen_db -c "\COPY tedarikciler FROM 'suppliers.csv' CSV HEADER"

# Import measurements (has no dependencies)
psql -U postgres -d somen_db -c "\COPY olculler FROM 'measurements.csv' CSV HEADER"

# Import stock limits (has no dependencies)
psql -U postgres -d somen_db -c "\COPY stok_alt_limitler FROM 'limits.csv' CSV HEADER"

# Import stock movements (has no dependencies)
psql -U postgres -d somen_db -c "\COPY stok_hareketleri FROM 'movements.csv' CSV HEADER"

# Note: Users need to be re-created due to password format changes
# Use the seed script or add users through the UI after starting the app

# Import orders (depends on users and suppliers)
psql -U postgres -d somen_db -c "\COPY siparisler FROM 'orders.csv' CSV HEADER"

# Import order products (depends on orders)
psql -U postgres -d somen_db -c "\COPY siparis_urunleri FROM 'order_products.csv' CSV HEADER"

# Import order logs (depends on orders)
psql -U postgres -d somen_db -c "\COPY siparis_log FROM 'order_logs.csv' CSV HEADER"
```

### Step 5: Create Admin User

```bash
cd server
npm install
node migrations/seed-admin.js admin YourSecurePassword123
```

### Step 6: Configure Environment

#### Backend Configuration

Create `server/.env`:

```env
DATABASE_URL=postgresql://username:password@localhost:5432/somen_db
JWT_SECRET=$(openssl rand -base64 32)
PORT=5000
NODE_ENV=production
```

#### Frontend Configuration

Create `.env`:

```env
REACT_APP_API_URL=https://your-api-domain.com/api
# Or for local development:
# REACT_APP_API_URL=http://localhost:5000/api
```

### Step 7: Start the Services

#### Development

```bash
# Terminal 1 - Backend
cd server
npm run dev

# Terminal 2 - Frontend
npm start
```

#### Production

```bash
# Build frontend
npm run build

# Start backend (you may want to use PM2 or similar)
cd server
npm start

# Or with PM2:
pm2 start server/index.js --name somen-api
```

### Step 8: Recreate Users

Since password hashing format has changed, all users need to be recreated:

1. Login as admin
2. Go to Settings (Ayarlar)
3. Recreate each user with a new temporary password
4. Ask users to change their password on first login

## Password Migration Notes

The old system used client-side bcrypt hashing. The new system uses server-side bcrypt hashing with the `sifre_hash` column.

**Users cannot login with old passwords** because:
- Old: Client hashed password, stored in `sifre` column
- New: Server hashes password, stored in `sifre_hash` column

**Resolution**: All users must be recreated or have their passwords reset.

## Removed Features

### BACKDOOR_USER

The hard-coded backdoor user has been **completely removed** for security reasons.

**What this means:**
- No more hard-coded admin credentials in the code
- You must create users through the seed script or admin interface
- If you lose admin access, you'll need database access to reset

**Emergency Admin Access:**

If you lose admin access, create a new admin user via database:

```bash
cd server
node migrations/seed-admin.js emergency_admin TempPassword123
```

### Supabase Client

All Supabase client code has been removed and replaced with:
- Custom REST API endpoints
- Axios HTTP client
- JWT token authentication

## Testing the Migration

### Test Checklist

- [ ] Backend starts without errors
- [ ] Frontend starts and connects to backend
- [ ] Login works with admin credentials
- [ ] Can create new users
- [ ] Can view existing data (measurements, stock, etc.)
- [ ] Can create new records
- [ ] Can edit existing records
- [ ] Can delete records
- [ ] Role-based access control works
- [ ] Stock tracking works
- [ ] Procurement module works
- [ ] PDF exports work
- [ ] Excel exports work

### Common Issues

#### "Cannot connect to database"
- Check PostgreSQL is running
- Verify DATABASE_URL is correct
- Check database exists

#### "401 Unauthorized" errors
- Clear browser localStorage
- Login again to get new JWT token
- Check JWT_SECRET is set in server/.env

#### "User not found" on login
- Verify user exists in database
- Recreate user if migrated from Supabase
- Check username spelling

#### Frontend shows blank page
- Check browser console for errors
- Verify REACT_APP_API_URL is correct
- Check backend is running and accessible

## Rollback Plan

If migration fails and you need to rollback:

1. Keep the old Supabase-based branch/commit
2. Switch back to old code:
   ```bash
   git checkout <old-commit-sha>
   ```
3. Supabase data remains unchanged
4. Can retry migration later

## Production Deployment Recommendations

### Backend Hosting Options

- **AWS**: EC2 + RDS PostgreSQL
- **Heroku**: Heroku + Heroku Postgres
- **DigitalOcean**: App Platform + Managed Database
- **Google Cloud**: Cloud Run + Cloud SQL

### Frontend Hosting Options

- **Netlify**: Easy deployment, free tier
- **Vercel**: Zero config, excellent performance
- **AWS S3 + CloudFront**: Scalable, cost-effective
- **GitHub Pages**: Free, good for simple deployments

### Security Hardening

1. **Enable HTTPS**: Use Let's Encrypt or cloud provider SSL
2. **Set secure JWT_SECRET**: Use strong random string
3. **Enable CORS properly**: Restrict to your domain
4. **Set up monitoring**: Use logging service
5. **Regular backups**: Automate database backups
6. **Update dependencies**: Keep packages up to date
7. **Rate limiting**: Add rate limiting middleware
8. **Input validation**: Ensure all inputs are validated

### Performance Optimization

1. **Connection pooling**: Configure pg pool size
2. **Caching**: Add Redis for session caching
3. **CDN**: Use CDN for static assets
4. **Compression**: Enable gzip compression
5. **Database indexes**: Ensure proper indexing (already in migration)

## Support

If you encounter issues during migration:

1. Check this guide thoroughly
2. Review error logs (backend console, browser console)
3. Verify all configuration files
4. Test with a minimal setup first
5. Open an issue on GitHub with:
   - Error messages
   - Steps to reproduce
   - Environment details

## Next Steps After Migration

1. **Train users**: Inform them of password resets
2. **Monitor logs**: Watch for errors in first few days
3. **Set up backups**: Automate regular backups
4. **Document changes**: Keep track of any customizations
5. **Plan updates**: Schedule regular dependency updates

## Security Incident Response

If the old Supabase keys or BACKDOOR_USER were exposed:

1. **Immediate Actions**:
   - Change all database passwords
   - Rotate JWT_SECRET
   - Force all users to change passwords
   - Review access logs

2. **Audit**:
   - Check for unauthorized access
   - Review data modifications
   - Identify affected users/data

3. **Communication**:
   - Inform affected users
   - Document the incident
   - Implement additional security measures

4. **Prevention**:
   - Enable 2FA (if adding this feature)
   - Implement IP whitelisting (if applicable)
   - Add security monitoring
   - Regular security audits
