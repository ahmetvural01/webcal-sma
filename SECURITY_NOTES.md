# Security Notes

## Removed Hard-coded Secrets

This application previously used Supabase with hard-coded credentials. As part of the migration to a secure backend architecture, these credentials have been removed.

### Supabase Credentials Found and Removed

**File:** `src/supabaseClient.js` (now removed)

**URL:** https://hxptnnqmmroizubvhozo.supabase.co

**Anon Key:** eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh4cHRubnFtbXJvaXp1YnZob3pvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4NDU0MjEsImV4cCI6MjA2NjQyMTQyMX0.GFVQAMHjZR3bNhiNtUm9aNmTj6awHwOFBT7f7MMbRyw

### Recommendation

**CRITICAL:** Rotate the Supabase anon key immediately as it has been committed to version control history. Even though it has been removed from the current codebase, it remains in git history and should be considered compromised.

### Actions Required

1. ✅ Remove hard-coded credentials from codebase
2. ✅ Migrate to secure backend with environment variables
3. ⚠️ **TODO:** Rotate Supabase anon key in Supabase dashboard
4. ⚠️ **TODO:** Review Supabase project access logs for unauthorized access
5. ⚠️ **TODO:** Consider rewriting git history to remove credentials (use with caution)

### New Security Architecture

- JWT-based authentication with secure token management
- Environment variables for all secrets (DATABASE_URL, JWT_SECRET)
- Server-side password hashing with bcrypt (10 rounds)
- No client-side access to database credentials
- Token refresh and expiration handling

### Backend Environment Variables

Required in `server/.env`:
- DATABASE_URL - PostgreSQL connection string
- JWT_SECRET - Secret key for JWT signing (use a long random string)
- PORT - Server port (default: 3001)

Required in `.env`:
- REACT_APP_API_BASE - Backend API URL (default: http://localhost:3001/api)

