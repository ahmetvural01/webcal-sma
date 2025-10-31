-- Migration Script for SOMEN Web Application
-- This script creates the database schema and initial data

-- Create roller (roles) table
CREATE TABLE IF NOT EXISTS roller (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  label VARCHAR(200) NOT NULL,
  color VARCHAR(50) DEFAULT '#00b7b7',
  permissions TEXT[] DEFAULT '{}',
  fixed BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create kullanicilar (users) table with sifre_hash column
CREATE TABLE IF NOT EXISTS kullanicilar (
  id SERIAL PRIMARY KEY,
  kullanici_adi VARCHAR(100) UNIQUE NOT NULL,
  sifre_hash VARCHAR(255) NOT NULL,
  rol VARCHAR(100) NOT NULL,
  extra_permissions TEXT[] DEFAULT '{}',
  removed_permissions TEXT[] DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);

-- If you have an existing kullanicilar table with 'sifre' column, rename it to 'sifre_hash'
-- ALTER TABLE kullanicilar RENAME COLUMN sifre TO sifre_hash;

-- Create olculler (measurements) table
CREATE TABLE IF NOT EXISTS olculler (
  id SERIAL PRIMARY KEY,
  marka VARCHAR(200),
  model VARCHAR(200),
  a NUMERIC,
  b NUMERIC,
  c NUMERIC,
  j NUMERIC,
  k NUMERIC,
  l NUMERIC,
  m NUMERIC,
  d NUMERIC,
  e NUMERIC,
  f NUMERIC,
  g NUMERIC,
  h NUMERIC,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create tedarikciler (suppliers) table
CREATE TABLE IF NOT EXISTS tedarikciler (
  id SERIAL PRIMARY KEY,
  adi VARCHAR(200) NOT NULL,
  email VARCHAR(200),
  telefon VARCHAR(50),
  adres TEXT,
  vergi_no VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create siparisler (orders) table
CREATE TABLE IF NOT EXISTS siparisler (
  id SERIAL PRIMARY KEY,
  siparis_no VARCHAR(100) UNIQUE NOT NULL,
  tedarikci_adi VARCHAR(200) NOT NULL,
  aciklama TEXT,
  urunler JSONB DEFAULT '[]',
  durum VARCHAR(50) DEFAULT 'beklemede',
  otomatik_stoga_aktar BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create stok_takip table (for stock management)
CREATE TABLE IF NOT EXISTS stok_takip (
  id SERIAL PRIMARY KEY,
  urun_kodu VARCHAR(200) NOT NULL,
  urun_aciklama TEXT,
  islem_turu VARCHAR(50),
  giris_miktari NUMERIC DEFAULT 0,
  cikis_miktari NUMERIC DEFAULT 0,
  mevcut_stok NUMERIC DEFAULT 0,
  ek_aciklama TEXT,
  islem_tarihi TIMESTAMP DEFAULT NOW(),
  kullanici VARCHAR(100)
);

-- Create stok_limits table (for stock alert limits)
CREATE TABLE IF NOT EXISTS stok_limits (
  urun_kodu VARCHAR(200) PRIMARY KEY,
  alt_limit NUMERIC DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Insert default roles
INSERT INTO roller (name, label, color, permissions, fixed) VALUES
  ('root', 'Root Admin', '#ff0000', '{}', true),
  ('admin', 'Admin', '#156176', '{}', true),
  ('user', 'Kullanıcı', '#00b7b7', '{}', false)
ON CONFLICT (name) DO NOTHING;

-- Create an admin user with hashed password (password: admin123)
-- This is a placeholder - you should change the password immediately
INSERT INTO kullanicilar (kullanici_adi, sifre_hash, rol, extra_permissions, removed_permissions) VALUES
  ('admin', '$2a$10$rK8Y8YqN0xPmLxZvZqYZLO8jZ8K7J8K7J8K7J8K7J8K7J8K7J8K7J.', 'admin', '{}', '{}')
ON CONFLICT (kullanici_adi) DO NOTHING;

-- Note: The above password hash is for demonstration. You should create a proper admin user with:
-- bcryptjs.hash('your_secure_password', 10)

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_kullanicilar_kullanici_adi ON kullanicilar(kullanici_adi);
CREATE INDEX IF NOT EXISTS idx_kullanicilar_rol ON kullanicilar(rol);
CREATE INDEX IF NOT EXISTS idx_roller_name ON roller(name);
CREATE INDEX IF NOT EXISTS idx_olculler_marka ON olculler(marka);
CREATE INDEX IF NOT EXISTS idx_olculler_model ON olculler(model);
CREATE INDEX IF NOT EXISTS idx_siparisler_siparis_no ON siparisler(siparis_no);
CREATE INDEX IF NOT EXISTS idx_siparisler_durum ON siparisler(durum);
CREATE INDEX IF NOT EXISTS idx_stok_takip_urun_kodu ON stok_takip(urun_kodu);

-- Grant necessary permissions (adjust based on your PostgreSQL setup)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO your_db_user;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO your_db_user;
