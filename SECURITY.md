# Security Policy

## Overview

This document outlines the security improvements made in this version and provides recommendations for maintaining security.

## Security Issues Addressed

### 1. Hard-Coded Backdoor Credentials (CRITICAL - FIXED)

**Issue**: Previous version contained hard-coded backdoor user credentials in source code:
```javascript
const BACKDOOR_USER = {
  username: "Agulden2",
  password: "10711453",
  rol: "root"
};
```

**Impact**: Anyone with access to the source code (including public GitHub repositories) could gain root admin access.

**Resolution**: 
- ✅ Completely removed BACKDOOR_USER constant
- ✅ All users must be created through proper channels (seed script or admin interface)
- ✅ No bypass mechanisms exist in the codebase

**Action Required**: If this code was ever public or shared:
1. Assume the credentials were compromised
2. Review database access logs for the username "Agulden2"
3. Check for any unauthorized data access or modifications
4. Implement additional security monitoring

### 2. Exposed Supabase API Keys (HIGH - FIXED)

**Issue**: Supabase anon key was hard-coded in source:
```javascript
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...";
```

**Impact**: Anyone with this key could access the Supabase database with anon-level permissions.

**Resolution**:
- ✅ Removed all Supabase client code
- ✅ Migrated to self-hosted backend with proper authentication
- ✅ No API keys in source code

**Action Required** if keys were exposed:
1. Revoke the old Supabase anon key in Supabase dashboard
2. If using Supabase, create new keys
3. Review Supabase access logs for suspicious activity
4. Rotate any other API keys that were in the same repository

### 3. Client-Side Password Hashing (MEDIUM - FIXED)

**Issue**: Passwords were hashed on the client side before transmission:
```javascript
const hashedPassword = await bcrypt.hash(password, 10);
// Then sent to Supabase
```

**Impact**: 
- Password hashes could be intercepted and used directly
- No additional server-side validation
- Vulnerable to replay attacks

**Resolution**:
- ✅ Moved to server-side bcrypt hashing
- ✅ Plain passwords transmitted over HTTPS only
- ✅ Server validates and hashes before storage
- ✅ Separate `sifre_hash` column for new secure hashes

**Note**: All users must reset passwords due to hash format change.

### 4. Missing Authentication on Data Access (HIGH - FIXED)

**Issue**: Direct Supabase client access from browser:
```javascript
await supabase.from("kullanicilar").select("*")
```

**Impact**: Client had direct database access, relying solely on Supabase RLS policies.

**Resolution**:
- ✅ All database access through authenticated REST API
- ✅ JWT token authentication required
- ✅ Server-side authorization checks
- ✅ No direct database access from client

## Current Security Features

### Authentication & Authorization

1. **JWT Token Authentication**
   - Tokens expire after 24 hours
   - Tokens include user ID, username, and role
   - Invalid/expired tokens rejected with 401/403

2. **Role-Based Access Control (RBAC)**
   - Multiple roles with different permission sets
   - Permissions checked server-side
   - Fine-grained access control

3. **Password Security**
   - Server-side bcrypt hashing (cost factor: 10)
   - Passwords never stored in plain text
   - Separate hash column (sifre_hash)

### Data Protection

1. **Environment Variables**
   - Sensitive config in .env files
   - .env files excluded from git (.gitignore)
   - Different configs for dev/prod

2. **SQL Injection Prevention**
   - Parameterized queries throughout
   - pg library handles escaping
   - No string concatenation in queries

3. **Input Validation**
   - Required field validation
   - Type checking on inputs
   - Error handling on invalid data

### Network Security

1. **CORS Configuration**
   - Configurable allowed origins
   - Can be restricted to specific domains

2. **HTTPS Recommended**
   - All production deployments should use HTTPS
   - Protects passwords in transit
   - Prevents man-in-the-middle attacks

## Security Recommendations

### Critical (Implement Immediately)

1. **Generate Secure JWT Secret**
   ```bash
   openssl rand -base64 32
   ```
   - Use a cryptographically secure random string
   - At least 32 characters
   - Never commit to version control

2. **Enable HTTPS**
   - Use Let's Encrypt for free SSL certificates
   - Configure reverse proxy (nginx/Apache)
   - Or use cloud provider SSL (AWS ALB, etc.)

3. **Restrict CORS**
   ```javascript
   // In server/index.js
   app.use(cors({
     origin: 'https://yourdomain.com'
   }));
   ```

4. **Secure Database Connection**
   - Use strong PostgreSQL password
   - Enable SSL for database connections in production
   - Restrict database access to application servers only

### High Priority

1. **Implement Rate Limiting**
   ```bash
   npm install express-rate-limit
   ```
   ```javascript
   const rateLimit = require('express-rate-limit');
   const limiter = rateLimit({
     windowMs: 15 * 60 * 1000, // 15 minutes
     max: 100 // limit each IP to 100 requests per windowMs
   });
   app.use('/api/', limiter);
   ```

2. **Add Request Logging**
   ```bash
   npm install morgan
   ```
   ```javascript
   const morgan = require('morgan');
   app.use(morgan('combined'));
   ```

3. **Implement Password Policies**
   - Minimum 8 characters
   - Require uppercase, lowercase, number
   - Add password strength meter in UI

4. **Enable Database Audit Logging**
   - Log all data modifications
   - Track who changed what and when
   - Retain logs for compliance

### Medium Priority

1. **Add 2FA (Two-Factor Authentication)**
   - Use TOTP (Google Authenticator compatible)
   - Required for admin accounts
   - Optional for regular users

2. **Implement Session Management**
   - Track active sessions
   - Allow users to view/revoke sessions
   - Automatic session cleanup

3. **Add Security Headers**
   ```bash
   npm install helmet
   ```
   ```javascript
   const helmet = require('helmet');
   app.use(helmet());
   ```

4. **Input Sanitization**
   ```bash
   npm install express-validator
   ```
   - Validate all inputs
   - Sanitize user-provided data
   - Prevent XSS attacks

### Best Practices

1. **Regular Updates**
   - Keep dependencies up to date
   - Monitor for security advisories
   - Use `npm audit` regularly

2. **Backup Strategy**
   - Automated daily backups
   - Test restore procedures
   - Off-site backup storage

3. **Error Handling**
   - Don't expose stack traces to clients
   - Log errors server-side
   - Generic error messages to users

4. **Monitoring & Alerts**
   - Monitor failed login attempts
   - Alert on unusual activity
   - Track API usage patterns

5. **Code Reviews**
   - Review all code changes
   - Check for security issues
   - Use automated security scanning

## Vulnerability Disclosure

If you discover a security vulnerability in this application:

1. **Do Not** open a public issue
2. Email security concerns to: [your-security-email]
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

We will:
- Acknowledge receipt within 48 hours
- Provide a fix timeline
- Keep you informed of progress
- Credit you in the security advisory (if desired)

## Security Audit Checklist

Use this checklist for regular security audits:

### Configuration
- [ ] JWT_SECRET is strong and unique
- [ ] DATABASE_URL is secure and not exposed
- [ ] HTTPS is enabled in production
- [ ] CORS is properly configured
- [ ] Environment variables are not committed

### Authentication
- [ ] Passwords are hashed server-side
- [ ] JWT tokens expire appropriately
- [ ] Failed login attempts are rate-limited
- [ ] Sessions are properly managed

### Authorization
- [ ] RBAC is working correctly
- [ ] Users can only access authorized resources
- [ ] Admin-only features are protected
- [ ] Permission checks are server-side

### Data Protection
- [ ] All queries use parameterization
- [ ] User inputs are validated
- [ ] Sensitive data is encrypted at rest
- [ ] Database backups are secure

### Network
- [ ] API endpoints are rate-limited
- [ ] HTTPS is enforced
- [ ] Security headers are set
- [ ] CORS is restrictive

### Monitoring
- [ ] Logs are being collected
- [ ] Failed logins are monitored
- [ ] Unusual activity triggers alerts
- [ ] Regular log reviews performed

### Updates
- [ ] Dependencies are up to date
- [ ] Security patches are applied
- [ ] npm audit shows no vulnerabilities
- [ ] Database is on supported version

## Compliance Considerations

### Data Protection

If handling EU citizens' data (GDPR):
- [ ] User consent for data collection
- [ ] Right to access data
- [ ] Right to delete data
- [ ] Data breach notification procedures

If handling health data (HIPAA):
- [ ] Audit logging implemented
- [ ] Encryption at rest and in transit
- [ ] Access controls documented
- [ ] Business associate agreements

### Industry Standards

Consider implementing:
- **OWASP Top 10** mitigation strategies
- **CIS Benchmarks** for PostgreSQL
- **NIST Cybersecurity Framework**

## Incident Response Plan

### Detection
1. Monitor logs for suspicious activity
2. Set up alerts for failed logins
3. Track unusual data access patterns

### Response
1. **Isolate**: Disconnect affected systems if needed
2. **Investigate**: Determine scope and impact
3. **Contain**: Prevent further damage
4. **Eradicate**: Remove threat
5. **Recover**: Restore normal operations
6. **Learn**: Document lessons learned

### Communication
1. Notify affected users
2. Inform stakeholders
3. Report to authorities if required
4. Public disclosure if appropriate

## Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [PostgreSQL Security](https://www.postgresql.org/docs/current/security.html)
- [JWT Security Best Practices](https://tools.ietf.org/html/rfc8725)

## Version History

- **v2.0.0** (Current): Removed Supabase, added JWT auth, removed backdoor
- **v1.0.0**: Initial version with Supabase (DEPRECATED - INSECURE)

---

Last Updated: 2025-10-31
