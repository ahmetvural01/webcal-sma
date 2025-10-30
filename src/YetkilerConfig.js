// src/sprs/YetkilerConfig.js

const YETKI_KATEGORILERI = [
  {
    key: "stok",
    label: "Stok",
    permissions: [
      { key: "stok_gor", label: "Ürün Detayları (Stok hareketleri) Görüntüle", icon: "📄" },
      { key: "stok_detay_indir", label: "Ürün Detaylarını PDF/Excel İndir", icon: "⬇️" },
      { key: "stok_genel_indir", label: "Mevcut Stok PDF/Excel İndir", icon: "🗂️" },
      { key: "stok_alt_limit", label: "Stok Alt Limit Belirle", icon: "⬇️" },
      { key: "stok_ekle", label: "Yeni Stok Kaydı Ekle", icon: "➕" },
      { key: "stok_giris", label: "Stok Giriş", icon: "➕" },
      { key: "stok_cikis", label: "Stok Çıkış", icon: "➖" },
      { key: "stok_sil_duzenle", label: "Stok Kaydı Sil/Düzenle", icon: "✏️" },
      { key: "stok_istatistik", label: "Stok İstatistik & Grafik Paneli Görüntüle", icon: "📊" },
      { key: "stok_duzenle", label: "Stok Kartı Düzenleme Yetkisi", icon: "🛠️" }
    ]
  },
  {
    key: "siparis",
    label: "Sipariş",
    permissions: [
      { key: "siparis_gor", label: "Siparişleri Görüntüle", icon: "📋" },
      { key: "siparis_ekle", label: "Sipariş Oluştur", icon: "➕" },
      { key: "siparis_duzenle", label: "Sipariş Düzenle", icon: "✏️" },
      { key: "siparis_sil", label: "Sipariş Sil", icon: "🗑️" },
      { key: "siparis_iptal", label: "Sipariş İptal Et", icon: "🚫" },
      { key: "siparis_pdf_indir", label: "Siparişi PDF Olarak İndir", icon: "📄" },
      { key: "siparis_excel_indir", label: "Siparişi Excel Olarak İndir", icon: "📊" },
      { key: "siparis_mail_gonder", label: "Siparişi Mail ile Gönder", icon: "✉️" },
      { key: "siparis_log_gor", label: "Sipariş Loglarını Görüntüle", icon: "🕒" },
      { key: "siparis_hizli_stoga_aktar", label: "Hızlıca Stoğa Aktar", icon: "⚡" },
      { key: "siparis_barkod_gor", label: "Sipariş Barkod/Karekod Görüntüle", icon: "🔳" },
      { key: "siparis_firma_bazli_gor", label: "Firma Bazlı Siparişleri Görüntüle", icon: "🏢" },
      { key: "siparis_urun_bazli_gor", label: "Ürün Bazlı Siparişleri Görüntüle", icon: "📦" },
      { key: "siparis_toplu_gor", label: "Toplu Siparişleri Görüntüle", icon: "📁" }
    ]
  }
];

export default YETKI_KATEGORILERI;