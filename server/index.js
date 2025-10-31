require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
const authRoutes = require('./routes/auth');
const rolesRoutes = require('./routes/roles');
const kullanicilarRoutes = require('./routes/kullanicilar');
const olcullerRoutes = require('./routes/olculler');
const stokHareketleriRoutes = require('./routes/stok_hareketleri');
const stokAltLimitlerRoutes = require('./routes/stok_alt_limitler');
const tedarikcilerRoutes = require('./routes/tedarikciler');
const siparislerRoutes = require('./routes/siparisler');
const siparisUrunleriRoutes = require('./routes/siparis_urunleri');
const siparisLogRoutes = require('./routes/siparis_log');

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/roles', rolesRoutes);
app.use('/api/kullanicilar', kullanicilarRoutes);
app.use('/api/olculler', olcullerRoutes);
app.use('/api/stok_hareketleri', stokHareketleriRoutes);
app.use('/api/stok_alt_limitler', stokAltLimitlerRoutes);
app.use('/api/tedarikciler', tedarikcilerRoutes);
app.use('/api/siparisler', siparislerRoutes);
app.use('/api/siparis_urunleri', siparisUrunleriRoutes);
app.use('/api/siparis_log', siparisLogRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
