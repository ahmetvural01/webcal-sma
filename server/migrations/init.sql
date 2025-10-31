-- SOMEN Web Application Database Schema
-- Production-ready PostgreSQL migration

-- Enable UUID extension if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Roles table
CREATE TABLE IF NOT EXISTS roller (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    label VARCHAR(255) NOT NULL,
    color VARCHAR(50) DEFAULT '#00b7b7',
    permissions TEXT[] DEFAULT '{}',
    fixed BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Users table
CREATE TABLE IF NOT EXISTS kullanicilar (
    id SERIAL PRIMARY KEY,
    kullanici_adi VARCHAR(255) UNIQUE NOT NULL,
    sifre_hash VARCHAR(255) NOT NULL, -- Using sifre_hash instead of sifre for clarity
    sifre VARCHAR(255), -- Legacy column, will be migrated to sifre_hash
    rol VARCHAR(255) NOT NULL REFERENCES roller(name) ON UPDATE CASCADE,
    extra_permissions TEXT[] DEFAULT '{}',
    removed_permissions TEXT[] DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Measurements table
CREATE TABLE IF NOT EXISTS olculler (
    id SERIAL PRIMARY KEY,
    marka VARCHAR(255),
    model VARCHAR(255),
    a NUMERIC(10, 2),
    b NUMERIC(10, 2),
    c NUMERIC(10, 2),
    j NUMERIC(10, 2),
    k NUMERIC(10, 2),
    l NUMERIC(10, 2),
    m NUMERIC(10, 2),
    d NUMERIC(10, 2),
    e NUMERIC(10, 2),
    f NUMERIC(10, 2),
    g NUMERIC(10, 2),
    h NUMERIC(10, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Stock movements table
CREATE TABLE IF NOT EXISTS stok_hareketleri (
    id SERIAL PRIMARY KEY,
    urun_kodu VARCHAR(255) NOT NULL,
    urun_aciklama TEXT,
    islem_turu VARCHAR(50) NOT NULL, -- 'Giriş' or 'Çıkış'
    giris_miktari INTEGER DEFAULT 0,
    cikis_miktari INTEGER DEFAULT 0,
    ek_aciklama TEXT,
    tarih TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    kullanici_adi VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Stock lower limits table
CREATE TABLE IF NOT EXISTS stok_alt_limitler (
    id SERIAL PRIMARY KEY,
    urun_kodu VARCHAR(255) UNIQUE NOT NULL,
    urun_aciklama TEXT,
    alt_limit INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Suppliers table
CREATE TABLE IF NOT EXISTS tedarikciler (
    id SERIAL PRIMARY KEY,
    adi VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    telefon VARCHAR(50),
    adres TEXT,
    vergi_no VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Orders table
CREATE TABLE IF NOT EXISTS siparisler (
    id SERIAL PRIMARY KEY,
    siparis_no VARCHAR(255) UNIQUE NOT NULL,
    tedarikci_id INTEGER REFERENCES tedarikciler(id) ON DELETE SET NULL,
    tedarikci_adi VARCHAR(255),
    olusturan_id INTEGER REFERENCES kullanicilar(id) ON DELETE SET NULL,
    olusturan_adi VARCHAR(255),
    durum VARCHAR(50) DEFAULT 'Bekliyor', -- 'Bekliyor', 'Onaylandı', 'Teslim Edildi', 'İptal'
    toplam_tutar NUMERIC(12, 2) DEFAULT 0,
    aciklama TEXT,
    qr_url VARCHAR(500),
    barcode_url VARCHAR(500),
    otomatik_stoga_aktar BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Order products table
CREATE TABLE IF NOT EXISTS siparis_urunleri (
    id SERIAL PRIMARY KEY,
    siparis_id INTEGER NOT NULL REFERENCES siparisler(id) ON DELETE CASCADE,
    urun_kodu VARCHAR(255),
    urun_adi TEXT,
    miktar INTEGER DEFAULT 0,
    birim_fiyat NUMERIC(10, 2) DEFAULT 0,
    toplam NUMERIC(12, 2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Order logs table
CREATE TABLE IF NOT EXISTS siparis_log (
    id SERIAL PRIMARY KEY,
    siparis_id INTEGER NOT NULL REFERENCES siparisler(id) ON DELETE CASCADE,
    durum VARCHAR(50) NOT NULL,
    aciklama TEXT,
    kullanici_adi VARCHAR(255),
    tarih TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_kullanicilar_username ON kullanicilar(kullanici_adi);
CREATE INDEX IF NOT EXISTS idx_kullanicilar_rol ON kullanicilar(rol);
CREATE INDEX IF NOT EXISTS idx_stok_hareketleri_kod ON stok_hareketleri(urun_kodu);
CREATE INDEX IF NOT EXISTS idx_stok_hareketleri_tarih ON stok_hareketleri(tarih);
CREATE INDEX IF NOT EXISTS idx_stok_alt_limitler_kod ON stok_alt_limitler(urun_kodu);
CREATE INDEX IF NOT EXISTS idx_siparisler_no ON siparisler(siparis_no);
CREATE INDEX IF NOT EXISTS idx_siparisler_durum ON siparisler(durum);
CREATE INDEX IF NOT EXISTS idx_siparis_urunleri_siparis ON siparis_urunleri(siparis_id);
CREATE INDEX IF NOT EXISTS idx_siparis_log_siparis ON siparis_log(siparis_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at columns
DROP TRIGGER IF EXISTS update_kullanicilar_updated_at ON kullanicilar;
CREATE TRIGGER update_kullanicilar_updated_at BEFORE UPDATE ON kullanicilar FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_stok_alt_limitler_updated_at ON stok_alt_limitler;
CREATE TRIGGER update_stok_alt_limitler_updated_at BEFORE UPDATE ON stok_alt_limitler FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_tedarikciler_updated_at ON tedarikciler;
CREATE TRIGGER update_tedarikciler_updated_at BEFORE UPDATE ON tedarikciler FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_siparisler_updated_at ON siparisler;
CREATE TRIGGER update_siparisler_updated_at BEFORE UPDATE ON siparisler FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default root role
INSERT INTO roller (name, label, color, permissions, fixed) VALUES 
('root', 'Root Admin', '#ff6b6b', ARRAY['stok_gor', 'stok_detay_indir', 'stok_genel_indir', 'stok_alt_limit', 'stok_ekle', 'stok_giris', 'stok_cikis', 'stok_sil_duzenle', 'stok_istatistik', 'stok_duzenle'], true)
ON CONFLICT (name) DO NOTHING;

INSERT INTO roller (name, label, color, permissions, fixed) VALUES 
('admin', 'Admin', '#00b7b7', ARRAY['stok_gor', 'stok_detay_indir', 'stok_genel_indir', 'stok_alt_limit', 'stok_ekle', 'stok_giris', 'stok_cikis', 'stok_duzenle', 'stok_istatistik'], true)
ON CONFLICT (name) DO NOTHING;

-- Note: Admin user should be created via the seed script with proper password hashing
-- To create an admin user, run the seed script after this migration
