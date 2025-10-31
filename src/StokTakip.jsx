import React, { useState, useMemo, useRef, useEffect } from "react";
import { saveAs } from "file-saver";
import { utils, write } from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Bar, Line } from "react-chartjs-2";
import { Chart, registerables } from "chart.js";
import { stokHareketleriAPI, stokAltLimitlerAPI } from "./api";

Chart.register(...registerables);

// RBAC yardımcı fonksiyonları
const getAllPermissionKeys = () => [
  "stok_gor", "stok_detay_indir", "stok_genel_indir", "stok_alt_limit", 
  "stok_ekle", "stok_giris", "stok_cikis", "stok_sil_duzenle", 
  "stok_istatistik", "stok_duzenle"
];

// Kullanıcı yetkilerini veritabanından al
const getUserEffectivePermissions = async (username, isRootAdmin) => {
  if (isRootAdmin) return getAllPermissionKeys();
  if (!username) return [];
  
  try {
    // Kullanıcı bilgilerini al
    const { data: userData, error: userError } = await supabase
      .from('kullanicilar')
      .select('rol, extra_permissions, removed_permissions')
      .eq('kullanici_adi', username)
      .single();

    if (userError) throw userError;
    if (!userData) return [];

    // Rol bilgilerini al
    const { data: roleData, error: roleError } = await supabase
      .from('roller')
      .select('permissions')
      .eq('name', userData.rol)
      .single();

    if (roleError) throw roleError;

    const permsFromRole = roleData ? roleData.permissions : [];
    const extraPerms = userData.extra_permissions || [];
    const removedPerms = userData.removed_permissions || [];

    return Array.from(new Set([
      ...permsFromRole,
      ...extraPerms
    ])).filter(p => !removedPerms.includes(p));
    
  } catch (error) {
    console.error("Yetki yükleme hatası:", error);
    return [];
  }
};

function formatDateTR(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("tr-TR") + " " + d.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
}

function StokTakipBirebir({ currentUser, isRootAdmin = false }) {
  // State'ler
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [kayitlar, setKayitlar] = useState([]);
  const [limits, setLimits] = useState({});
  
  const [form, setForm] = useState({
    urunKodu: "",
    urunAciklama: "",
    islemTuru: "",
    girisMiktari: "",
    cikisMiktari: "",
    ekAciklama: ""
  });
  
  const [uyari, setUyari] = useState("");
  const [bildirim, setBildirim] = useState("");
  const [yeniUrun, setYeniUrun] = useState(false);
  const [detayAcik, setDetayAcik] = useState(false);
  const [sorguAcik, setSorguAcik] = useState(false);
  const [filtre, setFiltre] = useState("");
  const [kodSecModal, setKodSecModal] = useState(false);
  const [secenekKodlar, setSecenekKodlar] = useState([]);
  const [yeniUrunOnayAcik, setYeniUrunOnayAcik] = useState(false);
  const [geciciUrunKodu, setGeciciUrunKodu] = useState("");
  const [grafikPanelAcik, setGrafikPanelAcik] = useState(false);
  const [tarihBas, setTarihBas] = useState("");
  const [tarihBit, setTarihBit] = useState("");
  const [aktifStokKod, setAktifStokKod] = useState("");
  const [limitModal, setLimitModal] = useState({ open: false, kod: "", aciklama: "", value: "" });
  const [detayLimitModal, setDetayLimitModal] = useState({ open: false, kod: "", aciklama: "", value: "" });
  const [notifyShow, setNotifyShow] = useState(false);
  const [notifyMsg, setNotifyMsg] = useState("");
  const [notifyType, setNotifyType] = useState("");
  const [istatistikUrun, setIstatistikUrun] = useState("TUMU");
  const [istatistikPeriyot, setIstatistikPeriyot] = useState("gunluk");
  const [grafikTab, setGrafikTab] = useState("stoktrend");
  const [blokYeniUrunOnayi, setBlokYeniUrunOnayi] = useState(false);
  
  // Düzenleme modalı state'leri
  const [duzenleModal, setDuzenleModal] = useState({
    open: false,
    urun: null,
    yeniKod: "",
    yeniAciklama: "",
    yeniLimit: "",
    hareketler: [],
    seciliHareket: null,
    hareketDetay: {
      tarih: "",
      islemTuru: "",
      girisMiktari: "",
      cikisMiktari: "",
      ekAciklama: ""
    }
  });

  // Refs
  const kodRef = useRef();
  const aciklamaRef = useRef();
  const islemRef = useRef();
  const girisRef = useRef();
  const cikisRef = useRef();
  const ekAciklamaRef = useRef();

  // Yetki kontrolleri
  const hasPermission = (permKey) => isRootAdmin || permissions.includes(permKey);
  const canViewDetails = hasPermission("stok_gor");
  const canDownloadDetails = hasPermission("stok_detay_indir");
  const canDownloadSummary = hasPermission("stok_genel_indir");
  const canSetLimits = hasPermission("stok_alt_limit");
  const canAddProducts = hasPermission("stok_ekle");
  const canDoStockIn = hasPermission("stok_giris");
  const canDoStockOut = hasPermission("stok_cikis");
  const canEditDelete = hasPermission("stok_sil_duzenle");
  const canViewStats = hasPermission("stok_istatistik");
  
  // Verileri yükle
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      
      try {
        // Yetkileri yükle
        const perms = await getUserEffectivePermissions(currentUser, isRootAdmin);
        setPermissions(perms);
        
        // Stok hareketlerini yükle
        const stokData = await stokHareketleriAPI.getAll();
        setKayitlar(stokData || []);
        
        // Alt limitleri yükle
        const limitData = await stokAltLimitlerAPI.getAll();
        
        const limitObj = {};
        (limitData || []).forEach(limit => {
          limitObj[limit.urun_kodu] = limit.alt_limit;
        });
        setLimits(limitObj);
        
      } catch (error) {
        console.error("Veri yükleme hatası:", error);
        setUyari("Veriler yüklenirken hata oluştu");
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [currentUser, isRootAdmin]);

  // Koddan açıklama ve açıklamadan kod eşleştirme
  const koddanAciklama = useMemo(() => {
    const obj = {};
    kayitlar.forEach(s => {
      if (!obj[s.urun_kodu]) obj[s.urun_kodu] = new Set();
      obj[s.urun_kodu].add(s.urun_aciklama);
    });
    Object.keys(obj).forEach(k => obj[k] = Array.from(obj[k]));
    return obj;
  }, [kayitlar]);
  
  const aciklamadanKod = useMemo(() => {
    const obj = {};
    kayitlar.forEach(s => {
      if (!obj[s.urun_aciklama]) obj[s.urun_aciklama] = new Set();
      obj[s.urun_aciklama].add(s.urun_kodu);
    });
    Object.keys(obj).forEach(a => obj[a] = Array.from(obj[a]));
    return obj;
  }, [kayitlar]);

  // Ürün kodu değişiklikleri
  function handleUrunKoduChange(e) {
    const kod = e.target.value.toUpperCase();
    setForm(f => ({
      ...f,
      urunKodu: kod,
      urunAciklama: koddanAciklama[kod] ? (koddanAciklama[kod][0] || "") : ""
    }));
    setUyari("");
    setYeniUrun(false);
    setYeniUrunOnayAcik(false);
    setBlokYeniUrunOnayi(false);
  }

  function handleUrunKoduBlur(e) {
    const kod = e.target.value.toUpperCase();
    const mevcut = koddanAciklama[kod] !== undefined;
    
    if (!mevcut && kod) {
      if (!isRootAdmin && !canAddProducts) {
        setUyari("Yeni ürün ekleme yetkiniz yok!");
        clearForm();
        return;
      }
      setGeciciUrunKodu(kod);
      setYeniUrunOnayAcik(true);
      setBlokYeniUrunOnayi(true);
    }
  }

  function handleYeniUrunEvet() {
    setForm(f => ({
      ...f,
      urunKodu: geciciUrunKodu,
      urunAciklama: ""
    }));
    setYeniUrun(true);
    setYeniUrunOnayAcik(false);
    setBlokYeniUrunOnayi(false);
    setTimeout(() => aciklamaRef.current?.focus(), 100);
  }
  
  function handleYeniUrunHayir() {
    clearForm();
    setYeniUrun(false);
    setYeniUrunOnayAcik(false);
    setBlokYeniUrunOnayi(false);
  }

  function handleUrunAciklamaChange(e) {
    const aciklama = e.target.value;
    if (yeniUrun) {
      setForm(f => ({ ...f, urunAciklama: aciklama }));
      return;
    }
    
    let kodlar = aciklamadanKod[aciklama] || [];
    if (kodlar.length > 1) {
      setSecenekKodlar(kodlar);
      setKodSecModal(true);
      setForm(f => ({ ...f, urunAciklama: aciklama, urunKodu: "" }));
    } else if (kodlar.length === 1) {
      setForm(f => ({ ...f, urunAciklama: aciklama, urunKodu: kodlar[0] }));
    } else {
      setForm(f => ({ ...f, urunAciklama: aciklama, urunKodu: "" }));
    }
    setUyari("");
  }

  function kodSec(kod) {
    setForm(f => ({
      ...f,
      urunKodu: kod,
      urunAciklama: form.urunAciklama
    }));
    setKodSecModal(false);
    setTimeout(() => islemRef.current?.focus(), 100);
  }

  // Yetki kontrollü UI durumları
  const girisDisabled = form.islemTuru !== "Giriş" || (!isRootAdmin && !canDoStockIn);
  const cikisDisabled = form.islemTuru !== "Çıkış" || (!isRootAdmin && !canDoStockOut);
  const islemTuruDisabled = !isRootAdmin && !canDoStockIn && !canDoStockOut;

  // Stok adet hesaplama
  const stokAdet = useMemo(() => {
    if (!form.urunKodu) return "";
    const hareketler = kayitlar.filter(s => s.urun_kodu === form.urunKodu);
    return (
      hareketler.reduce((t, s) => t + (Number(s.giris_miktari) || 0), 0) -
      hareketler.reduce((t, s) => t + (Number(s.cikis_miktari) || 0), 0)
    );
  }, [form.urunKodu, kayitlar]);

  const altLimit = form.urunKodu && limits[form.urunKodu] !== undefined ? limits[form.urunKodu] : null;
  const altLimitDurum = altLimit !== null && stokAdet !== "" && stokAdet <= altLimit;

  // Form gönderimi
  async function handleSubmit(e) {
    e.preventDefault();
    
    // Yetki kontrolleri
    if (blokYeniUrunOnayi) {
      setUyari("Lütfen yeni ürün kodu için seçim yapınız!");
      return;
    }
    
    if (form.islemTuru === "Giriş" && !isRootAdmin && !canDoStockIn) {
      setUyari("Stok girişi yapma yetkiniz yok!");
      return;
    }
    
    if (form.islemTuru === "Çıkış" && !isRootAdmin && !canDoStockOut) {
      setUyari("Stok çıkışı yapma yetkiniz yok!");
      return;
    }
    
    // Yeni ürün için yetki kontrolü
    const isNewProduct = !koddanAciklama[form.urunKodu];
    if (isNewProduct && !isRootAdmin && !canAddProducts) {
      setUyari("Yeni ürün ekleme yetkiniz yok!");
      return;
    }
    
    if (form.islemTuru === "Çıkış" && Number(form.cikisMiktari) > Number(stokAdet)) {
      setUyari("Stok yetersiz! Çıkış miktarı mevcut stoktan fazla olamaz.");
      return;
    }
    
    if (
      !form.urunKodu ||
      !form.urunAciklama ||
      !form.islemTuru ||
      (form.islemTuru === "Giriş" && !form.girisMiktari) ||
      (form.islemTuru === "Çıkış" && !form.cikisMiktari)
    ) {
      setUyari("Lütfen tüm zorunlu alanları doldurun!");
      return;
    }
    
    try {
      // Kayıt işlemi
      const newMovement = {
        urun_kodu: form.urunKodu,
        urun_aciklama: form.urunAciklama,
        islem_turu: form.islemTuru,
        giris_miktari: Number(form.girisMiktari) || 0,
        cikis_miktari: Number(form.cikisMiktari) || 0,
        ek_aciklama: form.ekAciklama,
        kullanici_adi: currentUser
      };
      
      const data = await stokHareketleriAPI.create(newMovement);
      
      // State güncelleme
      setKayitlar([...kayitlar, data]);
      
      setBildirim("Başarıyla kaydedildi!");
      setTimeout(() => setBildirim(""), 2000);

      // Stok uyarı hesaplama
      let yeniStok =
        (kayitlar
          .filter(s => s.urun_kodu === form.urunKodu)
          .reduce((t, s) => t + (Number(s.giris_miktari) || 0), 0)
        - kayitlar
          .filter(s => s.urun_kodu === form.urunKodu)
          .reduce((t, s) => t + (Number(s.cikis_miktari) || 0), 0)
        + (form.islemTuru === "Giriş" ? Number(form.girisMiktari) : 0)
        - (form.islemTuru === "Çıkış" ? Number(form.cikisMiktari) : 0)
        );

      if (limits[form.urunKodu] !== undefined && limits[form.urunKodu] !== "" && yeniStok <= limits[form.urunKodu]) {
        setNotifyMsg(
          `Merhaba\n${form.urunKodu} kodlu ürünün stok seviyesi kritik seviyeye düştü, yeniden sipariş oluşturmamız gerekebilir. Ürün için belirlenen alt limit "${limits[form.urunKodu]}", stokta kalan adet "${yeniStok}".`
        );
        setNotifyShow(true);
        setNotifyType("");
      }
      
      clearForm();
      
    } catch (error) {
      console.error("Kayıt hatası:", error);
      setUyari(`Kayıt sırasında hata oluştu: ${error.message}`);
    }
  }

  function clearForm() {
    setForm({
      urunKodu: "",
      urunAciklama: "",
      islemTuru: "",
      girisMiktari: "",
      cikisMiktari: "",
      ekAciklama: ""
    });
    setUyari("");
    setYeniUrun(false);
    setYeniUrunOnayAcik(false);
    setBlokYeniUrunOnayi(false);
    setTimeout(() => kodRef.current?.focus(), 100);
  }

  // Ürün detayları
  const urunDetay = useMemo(() => {
    if ((!detayAcik && !aktifStokKod) || !(form.urunKodu || aktifStokKod)) return [];
    const kod = detayAcik ? form.urunKodu : aktifStokKod;
    return kayitlar
      .filter(s => s.urun_kodu === kod)
      .map((s, i) => ({ ...s, sira: i + 1 }));
  }, [detayAcik, aktifStokKod, form.urunKodu, kayitlar]);

  // Stok özeti
  const stokOzet = useMemo(() => {
    const obj = {};
    kayitlar.forEach(s => {
      if (!obj[s.urun_kodu])
        obj[s.urun_kodu] = {
          urunKodu: s.urun_kodu,
          urunAciklama: s.urun_aciklama,
          stokAdet: 0
        };
      obj[s.urun_kodu].stokAdet += (Number(s.giris_miktari) || 0) - (Number(s.cikis_miktari) || 0);
    });
    return Object.values(obj).filter(
      s =>
        s.urunKodu.toLowerCase().includes(filtre.toLowerCase()) ||
        (s.urunAciklama || "").toLowerCase().includes(filtre.toLowerCase())
    );
  }, [kayitlar, filtre]);

  // UI işlevleri
  function handleListeSec(s) {
    setForm(f => ({
      ...f,
      urunKodu: s.urunKodu,
      urunAciklama: s.urunAciklama,
      islemTuru: "",
      girisMiktari: "",
      cikisMiktari: "",
      ekAciklama: ""
    }));
    setSorguAcik(false);
    setUyari("");
    setYeniUrun(false);
  }
  
  function handleRowDoubleClick(s) {
    if (!isRootAdmin && !canViewDetails) return;
    setAktifStokKod(s.urunKodu);
    setDetayAcik(true);
  }

  function handleForm(e) {
    const { name, value } = e.target;
    if (name === "ekAciklama" && value.length > 120) return;
    setForm(f => ({
      ...f,
      [name]:
        (name === "girisMiktari" || name === "cikisMiktari") && value
          ? value.replace(/[^0-9]/g, "")
          : value
    }));
    setUyari("");
  }

  // GELİŞMİŞ DÜZENLEME FONKSİYONLARI
  const handleDuzenleAc = (urun) => {
    if (!isRootAdmin && !canEditDelete) return;
    
    const hareketler = kayitlar.filter(k => k.urun_kodu === urun.urunKodu);
    
    setDuzenleModal({
      open: true,
      urun: urun,
      yeniKod: urun.urunKodu,
      yeniAciklama: urun.urunAciklama,
      yeniLimit: limits[urun.urunKodu] || "",
      hareketler: hareketler,
      seciliHareket: null,
      hareketDetay: {
        tarih: "",
        islemTuru: "",
        girisMiktari: "",
        cikisMiktari: "",
        ekAciklama: ""
      }
    });
  };

  const handleHareketSec = (hareket) => {
    setDuzenleModal(modal => ({
      ...modal,
      seciliHareket: hareket,
      hareketDetay: {
        tarih: hareket.tarih,
        islemTuru: hareket.islem_turu,
        girisMiktari: hareket.giris_miktari,
        cikisMiktari: hareket.cikis_miktari,
        ekAciklama: hareket.ek_aciklama
      }
    }));
  };

  const handleHareketDetayChange = (e) => {
    const { name, value } = e.target;
    setDuzenleModal(modal => ({
      ...modal,
      hareketDetay: {
        ...modal.hareketDetay,
        [name]: value
      }
    }));
  };

  const handleHareketGuncelle = async () => {
    if (!duzenleModal.seciliHareket) return;
    
    try {
      const { error } = await supabase
        .from('stok_hareketleri')
        .update({
          tarih: duzenleModal.hareketDetay.tarih,
          islem_turu: duzenleModal.hareketDetay.islemTuru,
          giris_miktari: Number(duzenleModal.hareketDetay.girisMiktari) || 0,
          cikis_miktari: Number(duzenleModal.hareketDetay.cikisMiktari) || 0,
          ek_aciklama: duzenleModal.hareketDetay.ekAciklama
        })
        .eq('id', duzenleModal.seciliHareket.id);
      
      if (error) throw error;
      
      // State güncelleme
      const guncellenmisKayitlar = kayitlar.map(kayit => {
        if (kayit.id === duzenleModal.seciliHareket.id) {
          return {
            ...kayit,
            ...duzenleModal.hareketDetay,
            giris_miktari: Number(duzenleModal.hareketDetay.girisMiktari) || 0,
            cikis_miktari: Number(duzenleModal.hareketDetay.cikisMiktari) || 0
          };
        }
        return kayit;
      });
      
      setKayitlar(guncellenmisKayitlar);
      
      // Hareket listesini güncelle
      const guncellenmisHareketler = duzenleModal.hareketler.map(h => {
        if (h.id === duzenleModal.seciliHareket.id) {
          return {
            ...h,
            ...duzenleModal.hareketDetay,
            giris_miktari: Number(duzenleModal.hareketDetay.girisMiktari) || 0,
            cikis_miktari: Number(duzenleModal.hareketDetay.cikisMiktari) || 0
          };
        }
        return h;
      });
      
      setDuzenleModal(modal => ({
        ...modal,
        hareketler: guncellenmisHareketler,
        seciliHareket: null,
        hareketDetay: {
          tarih: "",
          islemTuru: "",
          girisMiktari: "",
          cikisMiktari: "",
          ekAciklama: ""
        }
      }));
      
      setBildirim("Hareket başarıyla güncellendi!");
      setTimeout(() => setBildirim(""), 2000);
      
    } catch (error) {
      console.error("Güncelleme hatası:", error);
      setUyari("Hareket güncellenirken hata oluştu");
    }
  };

  const handleHareketSil = async () => {
    if (!duzenleModal.seciliHareket) return;
    
    try {
      const { error } = await supabase
        .from('stok_hareketleri')
        .delete()
        .eq('id', duzenleModal.seciliHareket.id);
      
      if (error) throw error;
      
      // State güncelleme
      const filtrelenmisKayitlar = kayitlar.filter(
        kayit => kayit.id !== duzenleModal.seciliHareket.id
      );
      
      setKayitlar(filtrelenmisKayitlar);
      
      // Hareket listesinden kaldır
      const filtrelenmisHareketler = duzenleModal.hareketler.filter(
        h => h.id !== duzenleModal.seciliHareket.id
      );
      
      setDuzenleModal(modal => ({
        ...modal,
        hareketler: filtrelenmisHareketler,
        seciliHareket: null,
        hareketDetay: {
          tarih: "",
          islemTuru: "",
          girisMiktari: "",
          cikisMiktari: "",
          ekAciklama: ""
        }
      }));
      
      setBildirim("Hareket başarıyla silindi!");
      setTimeout(() => setBildirim(""), 2000);
      
    } catch (error) {
      console.error("Silme hatası:", error);
      setUyari("Hareket silinirken hata oluştu");
    }
  };

  const handleDuzenleKaydet = async () => {
    const { urun, yeniKod, yeniAciklama, yeniLimit } = duzenleModal;
    
    try {
      // Tüm kayıtlarda güncelleme yap
      const { error: updateError } = await supabase
        .from('stok_hareketleri')
        .update({
          urun_kodu: yeniKod,
          urun_aciklama: yeniAciklama
        })
        .eq('urun_kodu', urun.urunKodu);
      
      if (updateError) throw updateError;
      
      // State güncelleme
      const guncellenmisKayitlar = kayitlar.map(kayit => {
        if (kayit.urun_kodu === urun.urunKodu) {
          return {
            ...kayit,
            urun_kodu: yeniKod,
            urun_aciklama: yeniAciklama
          };
        }
        return kayit;
      });
      
      setKayitlar(guncellenmisKayitlar);
      
      // Limitleri güncelle
      if (yeniLimit !== "") {
        // Upsert işlemi: Varsa güncelle, yoksa ekle
        await stokAltLimitlerAPI.upsert({
          urun_kodu: yeniKod,
          urun_aciklama: yeniAciklama,
          alt_limit: Number(yeniLimit)
        });
      } else {
        // Limit silme
        try {
          await stokAltLimitlerAPI.delete(yeniKod);
        } catch (err) {
          // Ignore if not found
        }
      }
      
      // Eski limiti sil
      if (urun.urunKodu !== yeniKod) {
        try {
          await stokAltLimitlerAPI.delete(urun.urunKodu);
        } catch (err) {
          console.warn("Eski limit silinemedi:", err);
        }
      }
      
      // State güncelleme
      const yeniLimits = { ...limits };
      if (yeniLimit !== "") {
        yeniLimits[yeniKod] = Number(yeniLimit);
      } else {
        delete yeniLimits[yeniKod];
      }
      
      if (urun.urunKodu !== yeniKod && yeniLimits[urun.urunKodu]) {
        delete yeniLimits[urun.urunKodu];
      }
      
      setLimits(yeniLimits);
      
      setDuzenleModal({ open: false, urun: null, yeniKod: "", yeniAciklama: "" });
      setBildirim("Ürün başarıyla güncellendi!");
      setTimeout(() => setBildirim(""), 2000);
      
    } catch (error) {
      console.error("Güncelleme hatası:", error);
      setUyari("Ürün güncellenirken hata oluştu");
    }
  };

  const handleUrunSil = async () => {
    const { urun } = duzenleModal;
    
    try {
      // Tüm hareketleri sil - need to delete each movement individually
      const productMovements = kayitlar.filter(k => k.urun_kodu === urun.urunKodu);
      for (const movement of productMovements) {
        try {
          await stokHareketleriAPI.delete(movement.id);
        } catch (err) {
          console.warn("Error deleting movement:", err);
        }
      }
      
      // State güncelleme
      const filtrelenmisKayitlar = kayitlar.filter(
        kayit => kayit.urun_kodu !== urun.urunKodu
      );
      
      setKayitlar(filtrelenmisKayitlar);
      
      // Limit silme
      try {
        await stokAltLimitlerAPI.delete(urun.urunKodu);
      } catch (err) {
        console.warn("Error deleting limit:", err);
      }
      
      // State güncelleme
      const yeniLimits = { ...limits };
      delete yeniLimits[urun.urunKodu];
      setLimits(yeniLimits);
      
      setDuzenleModal({ open: false, urun: null, yeniKod: "", yeniAciklama: "" });
      setBildirim("Ürün başarıyla silindi!");
      setTimeout(() => setBildirim(""), 2000);
      
    } catch (error) {
      console.error("Silme hatası:", error);
      setUyari("Ürün silinirken hata oluştu");
    }
  };

  async function handleDetayExcel() {
    if (!isRootAdmin && !canDownloadDetails) return;
    const kod = detayAcik ? form.urunKodu : aktifStokKod;
    if (!kod) return;
    
    const veri = kayitlar
      .filter(s => s.urun_kodu === kod)
      .map((s, i) => ({
        Sıra: i + 1,
        Tarih: formatDateTR(s.tarih),
        Kullanıcı: s.kullanici_adi || "Belirsiz",
        "İşlem Türü": s.islem_turu,
        Giriş: s.giris_miktari,
        Çıkış: s.cikis_miktari,
        "Ek Açıklama": s.ek_aciklama
      }));
    
    const ws = utils.json_to_sheet(veri);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, "Stok Detay");
    const buf = write(wb, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([buf]), `${kod}_StokDetay.xlsx`);
  }

  async function handleDetayPdf() {
    if (!isRootAdmin && !canDownloadDetails) return;
    const kod = detayAcik ? form.urunKodu : aktifStokKod;
    if (!kod) return;
    
    const doc = new jsPDF({ orientation: "landscape" });
    doc.setFont("courier");
    doc.setFontSize(14);
    doc.text(`${kod} Stok Hareket Detayı`, 14, 15);
    
    autoTable(doc, {
      head: [["Sıra", "Tarih", "Kullanıcı", "İşlem Türü", "Giriş", "Çıkış", "Ek Açıklama"]],
      body: kayitlar
        .filter(s => s.urun_kodu === kod)
        .map((s, i) => [
          i + 1,
          formatDateTR(s.tarih),
          s.kullanici_adi || "Belirsiz",
          s.islem_turu,
          s.giris_miktari,
          s.cikis_miktari,
          s.ek_aciklama
        ]),
      startY: 25,
      styles: { 
        font: "courier",
        fontStyle: "normal",
        fontSize: 10,
        halign: "left",
        cellPadding: 3
      },
      headStyles: {
        fillColor: [22, 74, 87],
        textColor: 255,
        fontStyle: "bold"
      },
      theme: "grid"
    });
    
    doc.save(`${kod}_StokDetay.pdf`);
  }

  async function handleStokSorguExcel() {
    if (!isRootAdmin && !canDownloadSummary) return;
    
    const ws = utils.json_to_sheet(
      stokOzet.map(s => ({
        "Ürün Kodu": s.urunKodu,
        "Ürün Açıklaması": s.urunAciklama,
        "Stok Adedi": s.stokAdet,
        "Alt Limit": limits[s.urunKodu] !== undefined ? limits[s.urunKodu] : "-"
      }))
    );
    
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, "Stok Sorgu");
    const buf = write(wb, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([buf]), "Stok_Sorgu_Sonuclari.xlsx");
  }

  async function handleStokSorguPdf() {
    if (!isRootAdmin && !canDownloadSummary) return;
    
    const doc = new jsPDF({ orientation: "landscape" });
    doc.setFont("courier");
    doc.setFontSize(14);
    doc.text("Stok Sorgulama Sonuçları", 14, 15);
    
    autoTable(doc, {
      head: [["Ürün Kodu", "Ürün Açıklaması", "Stok Adedi", "Alt Limit"]],
      body: stokOzet.map(s => [
        s.urunKodu,
        s.urunAciklama,
        s.stokAdet,
        limits[s.urunKodu] !== undefined ? limits[s.urunKodu] : "-"
      ]),
      startY: 25,
      styles: { 
        font: "courier",
        fontStyle: "normal",
        fontSize: 10,
        halign: "left",
        cellPadding: 3
      },
      headStyles: {
        fillColor: [22, 74, 87],
        textColor: 255,
        fontStyle: "bold"
      },
      theme: "grid"
    });
    
    doc.save("Stok_Sorgu_Sonuclari.pdf");
  }

  const istatistikDataKaynak = useMemo(() => {
    if (istatistikUrun === "TUMU") return kayitlar;
    return kayitlar.filter(s => s.urun_kodu === istatistikUrun);
  }, [kayitlar, istatistikUrun]);

  function groupByPeriyot(data, periyot) {
    const periyotlar = {};
    data.forEach(s => {
      const d = new Date(s.tarih);
      let key = "";
      if (periyot === "gunluk") key = d.toLocaleDateString("tr-TR");
      else if (periyot === "haftalik") key = `${d.getFullYear()}-W${String(Math.ceil((d.getDate() + ((d.getDay() + 6) % 7)) / 7)).padStart(2, "0")}`;
      else if (periyot === "aylik") key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      else if (periyot === "yillik") key = `${d.getFullYear()}`;
      if (!periyotlar[key]) periyotlar[key] = { giris: 0, cikis: 0 };
      periyotlar[key].giris += Number(s.giris_miktari) || 0;
      periyotlar[key].cikis += Number(s.cikis_miktari) || 0;
    });
    return Object.entries(periyotlar).sort();
  }

  const stokTrendData = useMemo(() => {
    if (istatistikUrun === "TUMU") {
      const urunler = [...new Set(kayitlar.map(k => k.urun_kodu))];
      const uniqueDates = new Set(kayitlar.map(k => formatDateTR(k.tarih)));
      const labels = Array.from(uniqueDates).sort();
      const datasets = urunler.map(kod => {
        let toplam = 0;
        let data = [];
        kayitlar
          .filter(s => s.urun_kodu === kod)
          .sort((a, b) => new Date(a.tarih) - new Date(b.tarih))
          .forEach(s => {
            toplam += (Number(s.giris_miktari) || 0) - (Number(s.cikis_miktari) || 0);
            data.push({ tarih: formatDateTR(s.tarih), stok: toplam });
          });
        const stokData = labels.map(lbl => {
          const d = data.find(x => x.tarih === lbl);
          return d ? d.stok : 0;
        });
        return {
          label: kod,
          data: stokData,
          borderColor: "#" + Math.floor(Math.random()*16777215).toString(16),
          backgroundColor: "rgba(200,200,200,0.08)"
        };
      });
      return { labels, datasets };
    } else {
      let toplam = 0;
      let data = [];
      kayitlar
        .filter(s => s.urun_kodu === istatistikUrun)
        .sort((a, b) => new Date(a.tarih) - new Date(b.tarih))
        .forEach(s => {
          toplam += (Number(s.giris_miktari) || 0) - (Number(s.cikis_miktari) || 0);
          data.push({ tarih: formatDateTR(s.tarih), stok: toplam });
        });
      return {
        labels: data.map(d => d.tarih),
        datasets: [
          {
            label: `${istatistikUrun} kodlu ürün stok trendi`,
            data: data.map(d => d.stok),
            borderColor: "#00b7b7",
            backgroundColor: "#c7f0f0"
          }
        ]
      };
    }
  }, [kayitlar, istatistikUrun]);

  const periyotData = useMemo(() => {
    const gruplar = groupByPeriyot(istatistikDataKaynak, istatistikPeriyot);
    return {
      labels: gruplar.map(([k]) => k),
      datasets: [
        { label: "Giriş", data: gruplar.map(([_, v]) => v.giris), backgroundColor: "#00b7b7" },
        { label: "Çıkış", data: gruplar.map(([_, v]) => v.cikis), backgroundColor: "#f26e6e" }
      ]
    };
  }, [istatistikDataKaynak, istatistikPeriyot]);

  const hareketData = useMemo(() => {
    const obj = {};
    (istatistikUrun === "TUMU" ? kayitlar : istatistikDataKaynak).forEach(s => {
      if (!obj[s.urun_kodu]) obj[s.urun_kodu] = 0;
      obj[s.urun_kodu] += (Number(s.giris_miktari) || 0) + (Number(s.cikis_miktari) || 0);
    });
    const sorted = Object.entries(obj).sort((a, b) => b[1] - a[1]).slice(0, 7);
    return {
      labels: sorted.map(([kod]) => kod),
      datasets: [
        { label: "Toplam Hareket", data: sorted.map(([_, v]) => v), backgroundColor: "#ffb800" }
      ]
    };
  }, [istatistikUrun, kayitlar, istatistikDataKaynak]);

  async function handleIstatistikPdf() {
    if (!isRootAdmin && !canViewStats) return;
    
    const doc = new jsPDF({ orientation: "landscape" });
    doc.setFont("courier");
    doc.setFontSize(14);
    doc.text("Stok İstatistik Raporu", 14, 15);

    let currentY = 25;

    // Tablo ekleme yardımcı fonksiyonu
    const addTable = (head, body, startY) => {
      if (body.length > 0) {
        autoTable(doc, {
          head: [head],
          body: body,
          startY: startY,
          styles: { 
            font: "courier",
            fontStyle: "normal",
            fontSize: 10,
            halign: "left",
            cellPadding: 3
          },
          headStyles: {
            fillColor: [22, 74, 87],
            textColor: 255,
            fontStyle: "bold"
          },
          theme: "grid"
        });
        
        // Yeni Y pozisyonunu döndür
        return doc.autoTable.previous.finalY + 10;
      }
      return startY;
    };

    // Table 1: Period data
    if (periyotData.labels.length > 0) {
      const head = [
        istatistikPeriyot === "gunluk" ? "Gün" :
        istatistikPeriyot === "haftalik" ? "Hafta" :
        istatistikPeriyot === "aylik" ? "Ay" :
        "Yıl", 
        "Toplam Giriş", 
        "Toplam Çıkış"
      ];
      
      const body = periyotData.labels.map((pr, i) => [
        pr,
        periyotData.datasets[0].data[i],
        periyotData.datasets[1].data[i]
      ]);
      
      currentY = addTable(head, body, currentY);
    }

    // Table 2: Movement data
    if (hareketData.labels.length > 0) {
      const head = ["Ürün Kodu", "Toplam Hareket"];
      const body = hareketData.labels.map((kod, i) => [
        kod,
        hareketData.datasets[0].data[i]
      ]);
      
      currentY = addTable(head, body, currentY);
    }

    // Table 3: Stock trend for specific product
    if (istatistikUrun !== "TUMU") {
      const hareketler = kayitlar
        .filter(s => s.urun_kodu === istatistikUrun)
        .sort((a, b) => new Date(a.tarih) - new Date(b.tarih));
      
      let toplam = 0;
      const tablo = hareketler.map(s => {
        toplam += (Number(s.giris_miktari) || 0) - (Number(s.cikis_miktari) || 0);
        return [formatDateTR(s.tarih), toplam];
      });
      
      if (tablo.length > 0) {
        const head = ["Tarih", "Toplam Stok"];
        currentY = addTable(head, tablo, currentY);
      }
    }
    
    doc.save("Stok_Istatistik_Raporu.pdf");
  }

  function handleNotifyChannel(type) {
    setNotifyType(type);
    let msg = notifyMsg;
    if (type === "whatsapp") {
      window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
    } else if (type === "mail") {
      window.open(`mailto:?subject=Kritik Stok Uyarısı&body=${encodeURIComponent(msg)}`, "_blank");
    }
  }

  function handleKeyDown(e, nextRef) {
    if (e.key === "Enter") {
      e.preventDefault();
      nextRef?.current?.focus();
    }
  }

  const ekAcikKalan = 120 - (form.ekAciklama.length || 0);

  async function handleLimitChangeSave() {
    try {
      // Upsert işlemi: Varsa güncelle, yoksa ekle
      await stokAltLimitlerAPI.upsert({
        urun_kodu: limitModal.kod,
        urun_aciklama: limitModal.aciklama,
        alt_limit: Number(limitModal.value) || 0
      });
      
      // State güncelleme
      setLimits(l => {
        const yeni = { ...l, [limitModal.kod]: Number(limitModal.value) || 0 };
        return yeni;
      });
      
      setLimitModal({ open: false, kod: "", aciklama: "", value: "" });
      
    } catch (error) {
      console.error("Limit kaydetme hatası:", error);
      setUyari("Limit kaydedilirken hata oluştu");
    }
  }

  async function handleDetayLimitChangeSave() {
    try {
      // Upsert işlemi: Varsa güncelle, yoksa ekle
      await stokAltLimitlerAPI.upsert({
        urun_kodu: detayLimitModal.kod,
        urun_aciklama: detayLimitModal.aciklama,
        alt_limit: Number(detayLimitModal.value) || 0
      });
      
      // State güncelleme
      setLimits(l => {
        const yeni = { ...l, [detayLimitModal.kod]: Number(detayLimitModal.value) || 0 };
        return yeni;
      });
      
      setDetayLimitModal({ open: false, kod: "", aciklama: "", value: "" });
      
    } catch (error) {
      console.error("Limit kaydetme hatası:", error);
      setUyari("Limit kaydedilirken hata oluştu");
    }
  }

  if (loading) {
    return (
      <div style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0,0,0,0.7)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 2000,
        fontSize: 24,
        color: "#fff"
      }}>
        Veriler yükleniyor...
      </div>
    );
  }

  return (
    <div style={{ background: "#124A57", minHeight: "100vh", color: "#fff", padding: 8, fontSize: 16 }}>
      <h1 style={{ textAlign: "center", color: "#00b7b7", letterSpacing: 2, fontSize: 28 }}>STOK TAKİP</h1>
      
      {bildirim && (
        <div style={{ background: "#00d734", color: "#fff", textAlign: "center", fontWeight: "bold", padding: 8, borderRadius: 8, margin: "8px auto 0", maxWidth: 400 }}>
          {bildirim}
        </div>
      )}

      {/* Yeni ürün onay modalı */}
      {yeniUrunOnayAcik && (
        <div style={{
          position: "fixed", left: 0, top: 0, width: "100vw", height: "100vh", background: "rgba(0,0,0,0.5)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 3000
        }}>
          <div style={{ background: "#fff", color: "#111", borderRadius: 12, padding: 32, minWidth: 340, maxWidth: 400 }}>
            <div style={{ fontWeight: "bold", marginBottom: 12, whiteSpace: "pre-line" }}>
              Ürün kodu bulunamadı. Yeni ürün olarak eklemek ister misiniz?
            </div>
            <div style={{ marginTop: 15, marginBottom: 10, display: "flex", gap: 12, justifyContent: "center" }}>
              <button onClick={handleYeniUrunEvet} style={{ background: "#00b7b7", color: "#fff", borderRadius: 8, padding: "8px 18px", fontWeight: "bold", border: "none" }}>Evet</button>
              <button onClick={handleYeniUrunHayir} style={{ background: "#f26e6e", color: "#fff", borderRadius: 8, padding: "8px 18px", fontWeight: "bold", border: "none" }}>Hayır</button>
            </div>
          </div>
        </div>
      )}

      {/* Ana form */}
      <div style={{
        maxWidth: 600,
        margin: "0 auto",
        background: "#156176",
        padding: 24,
        borderRadius: 16,
        boxShadow: "0 4px 24px 0 rgba(0,0,0,0.09)",
        minWidth: 290
      }}>
        <form onSubmit={handleSubmit}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {/* Ürün Kodu */}
            <label>
              Ürün Kodu *
              <input
                ref={kodRef}
                type="text"
                name="urunKodu"
                value={form.urunKodu}
                onChange={handleUrunKoduChange}
                onBlur={handleUrunKoduBlur}
                onKeyDown={e => handleKeyDown(e, aciklamaRef)}
                list="urunKoduList"
                required
                style={{ width: "100%", padding: 8, borderRadius: 6, border: "none", textTransform: "uppercase" }}
                tabIndex={1}
                autoComplete="off"
                disabled={yeniUrunOnayAcik}
              />
              <datalist id="urunKoduList">
                {Object.keys(koddanAciklama).map(kod => (
                  <option key={kod} value={kod}>{koddanAciklama[kod][0]}</option>
                ))}
              </datalist>
            </label>
            
            {/* Ürün Açıklaması */}
            <label>
              Ürün Açıklaması ile ara / gir
              <input
                ref={aciklamaRef}
                type="text"
                name="urunAciklama"
                value={form.urunAciklama}
                onChange={handleUrunAciklamaChange}
                onKeyDown={e => handleKeyDown(e, islemRef)}
                list="urunAciklamaList"
                required
                disabled={!yeniUrun ? (form.urunKodu && koddanAciklama[form.urunKodu]) : false}
                style={{ width: "100%", padding: 8, borderRadius: 6, border: "none", background: yeniUrun ? "#fff" : "#eee", color: yeniUrun ? "#222" : "#888" }}
                tabIndex={2}
                autoComplete="off"
              />
              <datalist id="urunAciklamaList">
                {Object.keys(aciklamadanKod).map(aciklama => (
                  <option key={aciklama} value={aciklama}>{aciklama}</option>
                ))}
              </datalist>
            </label>
            
            {/* Stok Adet */}
            <label>
              STOKTAKİ ADET{" "}
              {altLimit !== null && (
                <span style={{ fontSize: 14, color: altLimitDurum ? "#f26e6e" : "#ffb800", fontWeight: "bold" }}>
                  (Alt limit: {altLimit})
                </span>
              )}
              <input
                type="text"
                value={stokAdet}
                readOnly
                style={{
                  width: "100%", padding: 8, borderRadius: 6, border: "none",
                  background: "#eee",
                  color: altLimitDurum ? "#f26e6e" : "#222",
                  fontWeight: altLimitDurum ? "bold" : "normal"
                }}
              />
              {altLimitDurum && <span style={{ color: "#f26e6e", fontWeight: "bold" }}>Stok kritik seviyede!</span>}
            </label>
            
            {/* İşlem Türü */}
            <label>
              İŞLEM TÜRÜ *
              <select
                ref={islemRef}
                name="islemTuru"
                value={form.islemTuru}
                onChange={handleForm}
                onKeyDown={e => handleKeyDown(e, form.islemTuru === "Giriş" ? girisRef : cikisRef)}
                required
                style={{ width: "100%", padding: 8, borderRadius: 6, border: "none" }}
                tabIndex={3}
                disabled={yeniUrunOnayAcik || islemTuruDisabled}
              >
                <option value="">-- Seçiniz --</option>
                <option value="Giriş" disabled={!isRootAdmin && !canDoStockIn}>Giriş</option>
                <option value="Çıkış" disabled={!isRootAdmin && !canDoStockOut}>Çıkış</option>
              </select>
            </label>
            
            {/* Giriş Miktarı */}
            <label>
              GİRİŞ MİKTARI
              <input
                ref={girisRef}
                type="text"
                name="girisMiktari"
                value={form.girisMiktari}
                onChange={handleForm}
                disabled={girisDisabled || yeniUrunOnayAcik}
                style={{ width: "100%", padding: 8, borderRadius: 6, border: "none", background: girisDisabled ? "#eee" : "#fff" }}
                required={form.islemTuru === "Giriş"}
                tabIndex={4}
                onKeyDown={e => handleKeyDown(e, ekAciklamaRef)}
                autoComplete="off"
              />
            </label>
            
            {/* Çıkış Miktarı */}
            <label>
              ÇIKIŞ MİKTARI
              <input
                ref={cikisRef}
                type="text"
                name="cikisMiktari"
                value={form.cikisMiktari}
                onChange={handleForm}
                disabled={cikisDisabled || yeniUrunOnayAcik}
                style={{ width: "100%", padding: 8, borderRadius: 6, border: "none", background: cikisDisabled ? "#eee" : "#fff" }}
                required={form.islemTuru === "Çıkış"}
                tabIndex={5}
                onKeyDown={e => handleKeyDown(e, ekAciklamaRef)}
                autoComplete="off"
              />
            </label>
            
            {/* Ek Açıklama */}
            <label>
              EK AÇIKLAMA <span style={{ fontSize: 13, color: ekAcikKalan < 15 ? "#f26e6e" : "#ffb800" }}>({ekAcikKalan} karakter)</span>
              <input
                ref={ekAciklamaRef}
                type="text"
                name="ekAciklama"
                value={form.ekAciklama}
                onChange={handleForm}
                maxLength={120}
                style={{ width: "100%", padding: 8, borderRadius: 6, border: "none" }}
                tabIndex={6}
                autoComplete="off"
                disabled={yeniUrunOnayAcik}
              />
            </label>
            
            {uyari && (
              <div style={{ color: "#ffb800", background: "#222", padding: 8, borderRadius: 6 }}>
                {uyari}
              </div>
            )}
            
            {/* Butonlar */}
            <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap", justifyContent: "center" }}>
              <button
                type="button"
                onClick={() => setDetayAcik(true)}
                style={{
                  background: "#156176",
                  color: "#fff",
                  border: "1px solid #00b7b7",
                  borderRadius: 6,
                  padding: "10px 18px",
                  fontWeight: "bold",
                  opacity: (!form.urunKodu || (!isRootAdmin && !canViewDetails)) ? 0.5 : 1,
                  cursor: (!form.urunKodu || (!isRootAdmin && !canViewDetails)) ? "not-allowed" : "pointer"
                }}
                tabIndex={7}
                disabled={!form.urunKodu || yeniUrunOnayAcik || (!isRootAdmin && !canViewDetails)}
              >
                Ürün Detayları
              </button>
              
              <button
                type="button"
                onClick={() => setSorguAcik(true)}
                style={{ 
                  background: "#156176", 
                  color: "#fff", 
                  border: "1px solid #00b7b7", 
                  borderRadius: 6, 
                  padding: "10px 18px", 
                  fontWeight: "bold",
                  opacity: (!isRootAdmin && !canViewDetails) ? 0.5 : 1,
                  cursor: (!isRootAdmin && !canViewDetails) ? "not-allowed" : "pointer"
                }}
                tabIndex={8}
                disabled={yeniUrunOnayAcik || (!isRootAdmin && !canViewDetails)}
              >
                Stok Sorgula
              </button>
              
              <button
                type="submit"
                style={{ 
                  background: "#00b7b7", 
                  color: "#fff", 
                  border: "none", 
                  padding: "10px 24px", 
                  borderRadius: 6, 
                  fontWeight: "bold",
                  opacity: yeniUrunOnayAcik ? 0.5 : 1
                }}
                tabIndex={9}
                disabled={yeniUrunOnayAcik}
              >
                KAYDET
              </button>
              
              <button
                type="button"
                onClick={clearForm}
                style={{ 
                  background: "#f26e6e", 
                  color: "#fff", 
                  border: "none", 
                  padding: "10px 18px", 
                  borderRadius: 6, 
                  fontWeight: "bold" 
                }}
                tabIndex={10}
                disabled={yeniUrunOnayAcik}
              >
                Temizle
              </button>
              
              <button
                type="button"
                onClick={() => setGrafikPanelAcik(true)}
                style={{ 
                  background: "#ffb800", 
                  color: "#222", 
                  border: "none", 
                  borderRadius: 6, 
                  padding: "10px 18px", 
                  fontWeight: "bold",
                  opacity: (!isRootAdmin && !canViewStats) ? 0.5 : 1,
                  cursor: (!isRootAdmin && !canViewStats) ? "not-allowed" : "pointer"
                }}
                tabIndex={11}
                disabled={yeniUrunOnayAcik || (!isRootAdmin && !canViewStats)}
              >
                İstatistik & Grafik Paneli
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Kod seçme modalı (açıklamadan kod arandığında birden çok kod varsa) */}
      {kodSecModal && (
        <div style={{
          position: "fixed", left: 0, top: 0, width: "100vw", height: "100vh",
          background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1100
        }}>
          <div style={{
            background: "#fff", color: "#111", borderRadius: 12, padding: 28, minWidth: 300, minHeight: 100, position: "relative"
          }}>
            <h4>Bir ürün kodu seçin</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {secenekKodlar.map(kod => (
                <button key={kod} onClick={() => kodSec(kod)} style={{ background: "#00b7b7", color: "#fff", border: "none", borderRadius: 6, padding: "8px 16px", fontWeight: "bold" }}>{kod}</button>
              ))}
            </div>
            <button onClick={() => setKodSecModal(false)} style={{ background: "#f26e6e", color: "#fff", border: "none", borderRadius: 6, padding: "8px 16px", fontWeight: "bold", marginTop: 12 }}>İptal</button>
          </div>
        </div>
      )}

      {/* Alt limit güncelle modalı */}
      {limitModal.open && (
        <div style={{
          position: "fixed", left: 0, top: 0, width: "100vw", height: "100vh",
          background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 1100
        }}>
          <div style={{
            background: "#fff", color: "#111", borderRadius: 12, padding: 28, minWidth: 300, minHeight: 100, position: "relative"
          }}>
            <h4>Alt Limiti Güncelle</h4>
            <div>
              <b>{limitModal.kod} - {limitModal.aciklama}</b>
            </div>
            <input
              type="number"
              value={limitModal.value}
              onChange={e => setLimitModal(modal => ({ ...modal, value: e.target.value }))}
              style={{ margin: "16px 0", padding: 8, width: "100%", borderRadius: 6, border: "1px solid #aaa" }}
              autoFocus
            />
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={handleLimitChangeSave} style={{ background: "#00b7b7", color: "#fff", border: "none", borderRadius: 6, padding: "8px 16px", fontWeight: "bold" }}>Kaydet</button>
              <button onClick={() => setLimitModal({ open: false, kod: "", aciklama: "", value: "" })} style={{ background: "#f26e6e", color: "#fff", border: "none", borderRadius: 6, padding: "8px 16px", fontWeight: "bold" }}>İptal</button>
            </div>
          </div>
        </div>
      )}

      {/* Detay limit güncelle modalı */}
      {detayLimitModal.open && (
        <div style={{
          position: "fixed", left: 0, top: 0, width: "100vw", height: "100vh",
          background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 1100
        }}>
          <div style={{
            background: "#fff", color: "#111", borderRadius: 12, padding: 28, minWidth: 300, minHeight: 100, position: "relative"
          }}>
            <h4>Alt Limiti Güncelle</h4>
            <div>
              <b>{detayLimitModal.kod} - {detayLimitModal.aciklama}</b>
            </div>
            <input
              type="number"
              value={detayLimitModal.value}
              onChange={e => setDetayLimitModal(modal => ({ ...modal, value: e.target.value }))}
              style={{ margin: "16px 0", padding: 8, width: "100%", borderRadius: 6, border: "1px solid #aaa" }}
              autoFocus
            />
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={handleDetayLimitChangeSave} style={{ background: "#00b7b7", color: "#fff", border: "none", borderRadius: 6, padding: "8px 16px", fontWeight: "bold" }}>Kaydet</button>
              <button onClick={() => setDetayLimitModal({ open: false, kod: "", aciklama: "", value: "" })} style={{ background: "#f26e6e", color: "#fff", border: "none", borderRadius: 6, padding: "8px 16px", fontWeight: "bold" }}>İptal</button>
            </div>
          </div>
        </div>
      )}

      {/* GELİŞMİŞ DÜZENLEME MODALI */}
      {duzenleModal.open && (
        <div style={{
          position: "fixed", left: 0, top: 0, width: "100vw", height: "100vh",
          background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 1100
        }}>
          <div style={{
            background: "#fff", color: "#111", borderRadius: 12, padding: 28, minWidth: 400, maxWidth: 900, minHeight: 500, position: "relative", overflow: "auto"
          }}>
            <h4>Ürün Kartı Detaylı Düzenleme - {duzenleModal.urun.urunKodu}</h4>
            
            <div style={{ display: "flex", gap: 20, marginBottom: 20 }}>
              <div style={{ flex: 1 }}>
                <h5>Ürün Bilgileri</h5>
                <div style={{ marginBottom: 16 }}>
                  <label>
                    Ürün Kodu
                    <input
                      type="text"
                      value={duzenleModal.yeniKod}
                      onChange={e => setDuzenleModal({...duzenleModal, yeniKod: e.target.value.toUpperCase()})}
                      style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #aaa" }}
                    />
                  </label>
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label>
                    Ürün Açıklaması
                    <input
                      type="text"
                      value={duzenleModal.yeniAciklama}
                      onChange={e => setDuzenleModal({...duzenleModal, yeniAciklama: e.target.value})}
                      style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #aaa" }}
                    />
                  </label>
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label>
                    Alt Limit
                    <input
                      type="number"
                      value={duzenleModal.yeniLimit}
                      onChange={e => setDuzenleModal({...duzenleModal, yeniLimit: e.target.value})}
                      style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #aaa" }}
                    />
                  </label>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button 
                    onClick={handleDuzenleKaydet}
                    style={{ background: "#00b7b7", color: "#fff", border: "none", borderRadius: 6, padding: "8px 16px", fontWeight: "bold" }}
                  >
                    Ürün Bilgilerini Kaydet
                  </button>
                  <button 
                    onClick={handleUrunSil}
                    style={{ background: "#f26e6e", color: "#fff", border: "none", borderRadius: 6, padding: "8px 16px", fontWeight: "bold" }}
                  >
                    Ürünü Tamamen Sil
                  </button>
                </div>
              </div>
              
              <div style={{ flex: 1, borderLeft: "1px solid #eee", paddingLeft: 20 }}>
                <h5>Stok Hareketleri</h5>
                <div style={{ maxHeight: 300, overflowY: "auto" }}>
                  <table style={{ width: "100%", fontSize: 14, borderCollapse: "collapse" }}>
                    <thead>
                      <tr>
                        <th style={{ border: "1px solid #ddd", padding: 8 }}>Tarih</th>
                        <th style={{ border: "1px solid #ddd", padding: 8 }}>İşlem</th>
                        <th style={{ border: "1px solid #ddd", padding: 8 }}>Giriş</th>
                        <th style={{ border: "1px solid #ddd", padding: 8 }}>Çıkış</th>
                        <th style={{ border: "1px solid #ddd", padding: 8 }}>Kullanıcı</th>
                        <th style={{ border: "1px solid #ddd", padding: 8 }}>Açıklama</th>
                      </tr>
                    </thead>
                    <tbody>
                      {duzenleModal.hareketler.map((h, i) => (
                        <tr 
                          key={i} 
                          onClick={() => handleHareketSec(h)}
                          style={{ 
                            cursor: "pointer", 
                            backgroundColor: duzenleModal.seciliHareket === h ? "#e6f7ff" : "transparent" 
                          }}
                        >
                          <td style={{ border: "1px solid #ddd", padding: 8 }}>{formatDateTR(h.tarih)}</td>
                          <td style={{ border: "1px solid #ddd", padding: 8 }}>{h.islem_turu}</td>
                          <td style={{ border: "1px solid #ddd", padding: 8 }}>{h.giris_miktari}</td>
                          <td style={{ border: "1px solid #ddd", padding: 8 }}>{h.cikis_miktari}</td>
                          <td style={{ border: "1px solid #ddd", padding: 8 }}>{h.kullanici_adi || "Belirsiz"}</td>
                          <td style={{ border: "1px solid #ddd", padding: 8 }}>{h.ek_aciklama}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {duzenleModal.seciliHareket && (
                  <div style={{ marginTop: 20 }}>
                    <h5>Seçili Hareketi Düzenle</h5>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                      <label>
                        Tarih
                        <input
                          type="datetime-local"
                          name="tarih"
                          value={duzenleModal.hareketDetay.tarih.substring(0, 16)}
                          onChange={handleHareketDetayChange}
                          style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #aaa" }}
                        />
                      </label>
                      <label>
                        İşlem Türü
                        <select
                          name="islemTuru"
                          value={duzenleModal.hareketDetay.islemTuru}
                          onChange={handleHareketDetayChange}
                          style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #aaa" }}
                        >
                          <option value="">Seçiniz</option>
                          <option value="Giriş">Giriş</option>
                          <option value="Çıkış">Çıkış</option>
                        </select>
                      </label>
                      <label>
                        Giriş Miktarı
                        <input
                          type="number"
                          name="girisMiktari"
                          value={duzenleModal.hareketDetay.girisMiktari}
                          onChange={handleHareketDetayChange}
                          style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #aaa" }}
                        />
                      </label>
                      <label>
                        Çıkış Miktarı
                        <input
                          type="number"
                          name="cikisMiktari"
                          value={duzenleModal.hareketDetay.cikisMiktari}
                          onChange={handleHareketDetayChange}
                          style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #aaa" }}
                        />
                      </label>
                    </div>
                    <label>
                      Ek Açıklama
                      <input
                        type="text"
                        name="ekAciklama"
                        value={duzenleModal.hareketDetay.ekAciklama}
                        onChange={handleHareketDetayChange}
                        style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #aaa", marginTop: 10 }}
                      />
                    </label>
                    <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                      <button 
                        onClick={handleHareketGuncelle}
                        style={{ background: "#00b7b7", color: "#fff", border: "none", borderRadius: 6, padding: "8px 16px", fontWeight: "bold" }}
                      >
                        Hareketi Güncelle
                      </button>
                      <button 
                        onClick={handleHareketSil}
                        style={{ background: "#f26e6e", color: "#fff", border: "none", borderRadius: 6, padding: "8px 16px", fontWeight: "bold" }}
                      >
                        Hareketi Sil
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button 
                onClick={() => setDuzenleModal({ open: false, urun: null, yeniKod: "", yeniAciklama: "" })}
                style={{ background: "#888", color: "#fff", border: "none", borderRadius: 6, padding: "8px 16px", fontWeight: "bold" }}
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bildirim paneli: kritik stok seviyesi */}
      {notifyShow && (
        <div style={{
          position: "fixed", left: 0, top: 0, width: "100vw", height: "100vh", background: "rgba(0,0,0,0.4)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000
        }}>
          <div style={{ background: "#fff", color: "#111", borderRadius: 12, padding: 32, minWidth: 340, maxWidth: 400 }}>
            <div style={{ fontWeight: "bold", marginBottom: 12, whiteSpace: "pre-line" }}>{notifyMsg}</div>
            <div style={{ marginTop: 15, marginBottom: 10 }}>Bildirim göndermek istediğiniz kanalı seçin:</div>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", marginBottom: 18 }}>
              <button onClick={() => handleNotifyChannel("whatsapp")} style={{ background: "#25D366", color: "#fff", borderRadius: 8, padding: "8px 18px", fontWeight: "bold", border: "none" }}>WhatsApp</button>
              <button onClick={() => handleNotifyChannel("mail")} style={{ background: "#0072c6", color: "#fff", borderRadius: 8, padding: "8px 18px", fontWeight: "bold", border: "none" }}>Mail</button>
            </div>
            <button onClick={() => setNotifyShow(false)} style={{ background: "#888", color: "#fff", padding: "6px 18px", borderRadius: 8, border: "none" }}>Kapat</button>
          </div>
        </div>
      )}

      {/* Ürün detay modalı */}
      {(detayAcik || aktifStokKod) && (
        <div style={{
          position: "fixed", left: 0, top: 0, width: "100vw", height: "100vh",
          background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 1000
        }}>
          <div style={{
            background: "#fff", color: "#111", borderRadius: 12, padding: 32, minWidth: 350, minHeight: 150, position: "relative", maxHeight: 600, overflow: "auto"
          }}>
            <h3>Stok Haraketleri - {detayAcik ? form.urunKodu : aktifStokKod}</h3>
            <table style={{ width: "100%", marginTop: 16, fontSize: 15 }}>
              <thead>
                <tr>
                  <th>Sıra</th>
                  <th>Tarih</th>
                  <th>Kullanıcı</th>
                  <th>İşlem Türü</th>
                  <th>Giriş Miktarı</th>
                  <th>Çıkış Miktarı</th>
                  <th>Ek Açıklama</th>
                </tr>
              </thead>
              <tbody>
                {urunDetay.map(s => (
                  <tr key={s.sira}>
                    <td>{s.sira}</td>
                    <td>{formatDateTR(s.tarih)}</td>
                    <td>{s.kullanici_adi || "Belirsiz"}</td>
                    <td>{s.islem_turu}</td>
                    <td>{s.giris_miktari}</td>
                    <td>{s.cikis_miktari}</td>
                    <td>{s.ek_aciklama}</td>
                  </tr>
                ))}
                {urunDetay.length === 0 && (
                  <tr>
                    <td colSpan={7} style={{ textAlign: "center" }}>Hareket yok.</td>
                  </tr>
                )}
              </tbody>
            </table>
            <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
              {(isRootAdmin || canDownloadDetails) && (
                <>
                  <button
                    onClick={handleDetayPdf}
                    style={{ background: "#156176", color: "#fff", border: "1px solid #00b7b7", borderRadius: 6, padding: "8px 18px", fontWeight: "bold" }}
                  >
                    PDF Olarak İndir
                  </button>
                  <button
                    onClick={handleDetayExcel}
                    style={{ background: "#156176", color: "#fff", border: "1px solid #00b7b7", borderRadius: 6, padding: "8px 18px", fontWeight: "bold" }}
                  >
                    Excel Olarak İndir
                  </button>
                </>
              )}
              <button
                style={{
                  marginLeft: "auto", background: "#00b7b7", color: "#fff", border: "none", borderRadius: 6, padding: "4px 12px", fontWeight: "bold"
                }}
                onClick={() => { setDetayAcik(false); setAktifStokKod(""); }}
              >
                Kapat
              </button>
            </div>
            <div style={{ marginTop: 16 }}>
              <b>Alt Limit:</b>{" "}
              {limits[detayAcik ? form.urunKodu : aktifStokKod] !== undefined
                ? <span style={{ color: "#00b7b7" }}>{limits[detayAcik ? form.urunKodu : aktifStokKod]}</span>
                : "-"}
              {(isRootAdmin || canSetLimits) && (
                <button
                  style={{ marginLeft: 8, fontSize: 14, background: "#eee", border: "1px solid #888", borderRadius: 5, padding: "1px 7px" }}
                  onClick={() => setDetayLimitModal({
                    open: true,
                    kod: detayAcik ? form.urunKodu : aktifStokKod,
                    aciklama: detayAcik ? form.urunAciklama : "",
                    value: limits[detayAcik ? form.urunKodu : aktifStokKod] ?? ""
                  })}
                >
                  Alt Limiti Değiştir
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Stok sorgulama modalı */}
      {sorguAcik && (
        <div style={{
          position: "fixed", left: 0, top: 0, width: "100vw", height: "100vh",
          background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 1000
        }}>
          <div style={{
            background: "#fff", color: "#111", borderRadius: 12, padding: 32, minWidth: 350, minHeight: 150, position: "relative", maxHeight: 600, overflow: "auto"
          }}>
            <h3>Stok Sorgula</h3>
            <input
              type="text"
              placeholder="Filtrele (Ürün Kodu veya Açıklaması)..."
              value={filtre}
              onChange={e => setFiltre(e.target.value)}
              style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #aaa", marginBottom: 10, fontSize: 15 }}
            />
            <table style={{ width: "100%", marginTop: 8, fontSize: 15 }}>
              <thead>
                <tr>
                  <th>Ürün Kodu</th>
                  <th>Ürün Açıklaması</th>
                  <th>Stok Adet</th>
                  <th>Alt Limit</th>
                  <th>İşlem</th>
                </tr>
              </thead>
              <tbody>
                {stokOzet.map((s, i) => (
                  <tr key={i}
                    onDoubleClick={() => handleRowDoubleClick(s)}
                    style={{ cursor: (isRootAdmin || canViewDetails) ? "pointer" : "default" }}
                  >
                    <td>{s.urunKodu}</td>
                    <td>{s.urunAciklama}</td>
                    <td style={{
                      fontWeight: "bold",
                      color: limits[s.urunKodu] && s.stokAdet <= limits[s.urunKodu] ? "#f26e6e" : "#222"
                    }}>{s.stokAdet}</td>
                    <td>
                      {limits[s.urunKodu] !== undefined ? (
                        <b style={{ color: s.stokAdet <= limits[s.urunKodu] ? "#f26e6e" : "#00b7b7" }}>{limits[s.urunKodu]}</b>
                      ) : "-"}
                    </td>
                    <td>
                      {(isRootAdmin || canEditDelete) && (
                        <button
                          style={{
                            background: "#ffb800",
                            color: "#222",
                            border: "none",
                            borderRadius: 6,
                            padding: "4px 8px",
                            fontWeight: "bold",
                            cursor: "pointer"
                          }}
                          onClick={() => handleDuzenleAc(s)}
                        >
                          Düzenle
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {stokOzet.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ textAlign: "center", padding: 16 }}>
                      Sonuç bulunamadı.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              {(isRootAdmin || canDownloadSummary) && (
                <>
                  <button
                    style={{
                      background: "#156176", color: "#fff", border: "1px solid #00b7b7", borderRadius: 6, padding: "8px 18px", fontWeight: "bold"
                    }}
                    onClick={handleStokSorguPdf}
                  >
                    PDF Olarak İndir
                  </button>
                  <button
                    style={{
                      background: "#156176", color: "#fff", border: "1px solid #00b7b7", borderRadius: 6, padding: "8px 18px", fontWeight: "bold"
                    }}
                    onClick={handleStokSorguExcel}
                  >
                    Excel Olarak İndir
                  </button>
                </>
              )}
            </div>
            <div style={{ color: "#999", fontSize: 13, marginTop: 6 }}>
              Bir ürüne <b>çift tıklayarak</b> hareket detayını görebilirsiniz.
            </div>
            <button
              style={{
                position: "absolute", top: 12, right: 12, background: "#00b7b7", color: "#fff", border: "none", borderRadius: 6, padding: "4px 12px", fontWeight: "bold"
              }}
              onClick={() => setSorguAcik(false)}
            >
              Kapat
            </button>
          </div>
        </div>
      )}

      {/* İstatistik Paneli */}
      {grafikPanelAcik && (
        <div style={{
          position: "fixed", left: 0, top: 0, width: "100vw", height: "100vh",
          background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 1001
        }}>
          <div style={{
            background: "#fff", color: "#222", borderRadius: 14, padding: 24, minWidth: 350, maxWidth: 820, minHeight: 350, maxHeight: 680, position: "relative", overflow: "auto"
          }}>
            <h2 style={{ color: "#00b7b7" }}>İstatistik & Grafik Paneli</h2>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 15, color: "#444", fontWeight: "bold" }}>
                Ürün Seçimi:{" "}
                <input
                  type="text"
                  list="istatistik-urun-list"
                  value={istatistikUrun}
                  onChange={e => setIstatistikUrun(e.target.value)}
                  style={{ marginRight: 8 }}
                  placeholder="Ürün kodu yazın veya seçin"
                />
                <datalist id="istatistik-urun-list">
                  <option value="TUMU">Tüm Ürünler</option>
                  {Object.keys(koddanAciklama).map(kod => (
                    <option key={kod} value={kod}>{kod} - {koddanAciklama[kod][0]}</option>
                  ))}
                </datalist>
              </label>
              <label style={{ fontSize: 15, color: "#444", fontWeight: "bold", marginLeft: 18 }}>
                Periyot:{" "}
                <select value={istatistikPeriyot} onChange={e => setIstatistikPeriyot(e.target.value)}>
                  <option value="gunluk">Günlük</option>
                  <option value="haftalik">Haftalık</option>
                  <option value="aylik">Aylık</option>
                  <option value="yillik">Yıllık</option>
                </select>
              </label>
            </div>
            <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
              <button onClick={() => setGrafikTab("stoktrend")} style={{ background: grafikTab === "stoktrend" ? "#00b7b7" : "#eee", color: grafikTab === "stoktrend" ? "#fff" : "#111", border: "none", borderRadius: 6, padding: "6px 16px", fontWeight: "bold" }}>Stok Trend</button>
              <button onClick={() => setGrafikTab("periyot")} style={{ background: grafikTab === "periyot" ? "#00b7b7" : "#eee", color: grafikTab === "periyot" ? "#fff" : "#111", border: "none", borderRadius: 6, padding: "6px 16px", fontWeight: "bold" }}>Giriş/Çıkış</button>
              <button onClick={() => setGrafikTab("enpopuler")} style={{ background: grafikTab === "enpopuler" ? "#00b7b7" : "#eee", color: grafikTab === "enpopuler" ? "#fff" : "#111", border: "none", borderRadius: 6, padding: "6px 16px", fontWeight: "bold" }}>En Çok Hareket Görenler</button>
              {(isRootAdmin || canViewStats) && (
                <button onClick={handleIstatistikPdf} style={{ background: "#156176", color: "#fff", border: "1px solid #00b7b7", borderRadius: 6, padding: "6px 16px", fontWeight: "bold", marginLeft: 10 }}>PDF Olarak İndir</button>
              )}
            </div>
            <div style={{ width: "100%", maxWidth: 740, minHeight: 312 }}>
              {grafikTab === "stoktrend" && stokTrendData && stokTrendData.labels.length > 0 && (
                <Line data={stokTrendData} />
              )}
              {grafikTab === "periyot" && periyotData.labels.length > 0 && (
                <Bar data={periyotData} />
              )}
              {grafikTab === "enpopuler" && hareketData.labels.length > 0 && (
                <Bar data={hareketData} />
              )}
              {((grafikTab === "stoktrend" && (!stokTrendData || stokTrendData.labels.length === 0)) ||
                (grafikTab === "periyot" && periyotData.labels.length === 0) ||
                (grafikTab === "enpopuler" && hareketData.labels.length === 0)) && (
                <div style={{ color: "#f26e6e", textAlign: "center", marginTop: 28 }}>Veri bulunamadı.</div>
              )}
            </div>
            <button
              style={{
                position: "absolute", top: 12, right: 12, background: "#00b7b7", color: "#fff", border: "none", borderRadius: 6, padding: "4px 12px", fontWeight: "bold"
              }}
              onClick={() => setGrafikPanelAcik(false)}
            >
              Kapat
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default StokTakipBirebir;