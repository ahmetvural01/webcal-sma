const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user; // { userId, username, rol }
    next();
  });
}

function generateToken(user) {
  return jwt.sign(
    { 
      userId: user.id, 
      username: user.kullanici_adi, 
      rol: user.rol 
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
}

module.exports = { authenticateToken, generateToken, JWT_SECRET };
