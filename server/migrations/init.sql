-- Initial database schema for SOMEN Web Application
-- This migration creates the necessary tables for the application

-- Create roles table (replaces roller)
CREATE TABLE IF NOT EXISTS roles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  label VARCHAR(200) NOT NULL,
  color VARCHAR(50) DEFAULT '#00b7b7',
  permissions JSONB DEFAULT '[]',
  fixed BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create kullanicilar table with sifre_hash (replaces sifre)
CREATE TABLE IF NOT EXISTS kullanicilar (
  id SERIAL PRIMARY KEY,
  kullanici_adi VARCHAR(100) UNIQUE NOT NULL,
  sifre_hash VARCHAR(255) NOT NULL,
  rol VARCHAR(100) NOT NULL,
  extra_permissions JSONB DEFAULT '[]',
  removed_permissions JSONB DEFAULT '[]',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create olculler table (measurements)
CREATE TABLE IF NOT EXISTS olculler (
  id SERIAL PRIMARY KEY,
  marka VARCHAR(200) NOT NULL,
  model VARCHAR(200) NOT NULL,
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

-- Create stok_hareketleri table (stock movements)
CREATE TABLE IF NOT EXISTS stok_hareketleri (
  id SERIAL PRIMARY KEY,
  urun_kodu VARCHAR(200) NOT NULL,
  urun_aciklama TEXT,
  islem_turu VARCHAR(50) NOT NULL,
  giris_miktari NUMERIC DEFAULT 0,
  cikis_miktari NUMERIC DEFAULT 0,
  ek_aciklama TEXT,
  tarih TIMESTAMP DEFAULT NOW(),
  kullanici_adi VARCHAR(100)
);

-- Create stok_alt_limitler table (stock minimum limits)
CREATE TABLE IF NOT EXISTS stok_alt_limitler (
  id SERIAL PRIMARY KEY,
  urun_kodu VARCHAR(200) UNIQUE NOT NULL,
  alt_limit NUMERIC NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create siparisler table (orders)
CREATE TABLE IF NOT EXISTS siparisler (
  id SERIAL PRIMARY KEY,
  siparis_no VARCHAR(100) UNIQUE NOT NULL,
  tedarikci_adi VARCHAR(200) NOT NULL,
  aciklama TEXT,
  urunler JSONB DEFAULT '[]',
  durum VARCHAR(100) DEFAULT 'Beklemede',
  otomatik_stoga_aktar BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create tedarikciler table (suppliers)
CREATE TABLE IF NOT EXISTS tedarikciler (
  id SERIAL PRIMARY KEY,
  adi VARCHAR(200) NOT NULL,
  email VARCHAR(200),
  telefon VARCHAR(50),
  adres TEXT,
  vergi_no VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_kullanicilar_username ON kullanicilar(kullanici_adi);
CREATE INDEX IF NOT EXISTS idx_kullanicilar_rol ON kullanicilar(rol);
CREATE INDEX IF NOT EXISTS idx_stok_urun_kodu ON stok_hareketleri(urun_kodu);
CREATE INDEX IF NOT EXISTS idx_stok_tarih ON stok_hareketleri(tarih);
CREATE INDEX IF NOT EXISTS idx_siparisler_no ON siparisler(siparis_no);
CREATE INDEX IF NOT EXISTS idx_siparisler_tedarikci ON siparisler(tedarikci_adi);

-- Insert default root role if not exists
INSERT INTO roles (name, label, color, permissions, fixed)
VALUES ('root', 'Root Admin', '#156176', '[]', true)
ON CONFLICT (name) DO NOTHING;

-- Insert default admin role if not exists
INSERT INTO roles (name, label, color, permissions, fixed)
VALUES ('admin', 'Admin', '#00b7b7', '[]', true)
ON CONFLICT (name) DO NOTHING;

-- Notes:
-- 1. After running this migration, you need to create at least one root user:
--    Example: INSERT INTO kullanicilar (kullanici_adi, sifre_hash, rol) 
--             VALUES ('admin', '$2a$10$...hashed-password...', 'root');
-- 2. Use bcrypt to hash passwords with 10 rounds before inserting
-- 3. Additional tables may be referenced in code but not listed here (e.g., personel tracking tables)
-- 4. Adjust table schemas as needed based on actual database structure
