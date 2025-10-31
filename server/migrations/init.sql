-- Database Migration Script for SOMEN Application
-- This script creates the necessary tables for the application

-- Create roles table
CREATE TABLE IF NOT EXISTS roles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL,
  label VARCHAR(100) NOT NULL,
  permissions JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create kullanicilar (users) table
CREATE TABLE IF NOT EXISTS kullanicilar (
  id SERIAL PRIMARY KEY,
  kullanici_adi VARCHAR(100) UNIQUE NOT NULL,
  sifre_hash VARCHAR(255) NOT NULL,
  rol VARCHAR(50) NOT NULL DEFAULT 'user',
  extra_permissions JSONB DEFAULT '[]'::jsonb,
  removed_permissions JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index on kullanici_adi for faster lookups
CREATE INDEX IF NOT EXISTS idx_kullanicilar_kullanici_adi ON kullanicilar(kullanici_adi);

-- Create olculler (measurements) table
CREATE TABLE IF NOT EXISTS olculler (
  id SERIAL PRIMARY KEY,
  marka VARCHAR(100),
  model VARCHAR(100),
  a NUMERIC,
  b NUMERIC,
  c NUMERIC,
  d NUMERIC,
  e NUMERIC,
  f NUMERIC,
  g NUMERIC,
  h NUMERIC,
  j NUMERIC,
  k NUMERIC,
  l NUMERIC,
  m NUMERIC,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create tedarikciler (suppliers) table
CREATE TABLE IF NOT EXISTS tedarikciler (
  id SERIAL PRIMARY KEY,
  adi VARCHAR(200) NOT NULL,
  email VARCHAR(200),
  telefon VARCHAR(50),
  adres TEXT,
  vergi_no VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create siparisler (orders) table
CREATE TABLE IF NOT EXISTS siparisler (
  id SERIAL PRIMARY KEY,
  siparis_no VARCHAR(50) UNIQUE NOT NULL,
  tedarikci_adi VARCHAR(200),
  aciklama TEXT,
  urunler JSONB DEFAULT '[]'::jsonb,
  durum VARCHAR(50) DEFAULT 'beklemede',
  olusturan_kullanici VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create stok_kayitlari (stock records) table
CREATE TABLE IF NOT EXISTS stok_kayitlari (
  id SERIAL PRIMARY KEY,
  urun_kodu VARCHAR(100) NOT NULL,
  urun_aciklama TEXT,
  islem_turu VARCHAR(50),
  giris_miktari NUMERIC DEFAULT 0,
  cikis_miktari NUMERIC DEFAULT 0,
  ek_aciklama TEXT,
  kullanici VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create stok_alt_limitler (stock lower limits) table
CREATE TABLE IF NOT EXISTS stok_alt_limitler (
  id SERIAL PRIMARY KEY,
  urun_kodu VARCHAR(100) UNIQUE NOT NULL,
  urun_aciklama TEXT,
  alt_limit NUMERIC NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default roles
INSERT INTO roles (name, label, permissions) VALUES
  ('root', 'Root Admin', '[]'::jsonb),
  ('admin', 'Administrator', '[]'::jsonb),
  ('user', 'User', '[]'::jsonb)
ON CONFLICT (name) DO NOTHING;

-- Notes for manual setup:
-- 1. After running this migration, you need to create at least one admin user manually
-- 2. Use bcrypt to hash the password before inserting (10 rounds)
-- 3. Example: INSERT INTO kullanicilar (kullanici_adi, sifre_hash, rol) 
--            VALUES ('admin', '<bcrypt_hashed_password>', 'root');
-- 4. You can use this Node.js script to hash a password:
--    const bcrypt = require('bcryptjs');
--    const hash = await bcrypt.hash('your_password', 10);
--    console.log(hash);
