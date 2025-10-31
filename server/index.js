require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const rolesRoutes = require('./routes/roles');
const kullanicilarRoutes = require('./routes/kullanicilar');
const olcullerRoutes = require('./routes/olculler');
const siparislerRoutes = require('./routes/siparisler');
const tedarikcilerRoutes = require('./routes/tedarikciler');
const stokRoutes = require('./routes/stok');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'SOMEN Server is running' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/roles', rolesRoutes);
app.use('/api/kullanicilar', kullanicilarRoutes);
app.use('/api/olculler', olcullerRoutes);
app.use('/api/siparisler', siparislerRoutes);
app.use('/api/tedarikciler', tedarikcilerRoutes);
app.use('/api/stok', stokRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Sunucu hatası' });
});

// Start server
app.listen(PORT, () => {
  console.log(`SOMEN Server running on port ${PORT}`);
});
