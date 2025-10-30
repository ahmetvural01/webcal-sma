import React, { useState, useEffect } from "react";
import somenLogo from "./somenlogo svg.svg";

const MAZERET_MAX_GUN = 5;
const IZIN_TURLERI = [
  { value: "yillik", label: "Yıllık İzin", color: "#27ae60", maxGun: null },
  { value: "mazeret", label: "Mazeret İzni", color: "#f39c12", maxGun: 5 },
  { value: "hastalik", label: "Hastalık İzni", color: "#e74c3c", maxGun: null },
  { value: "ucretsiz", label: "Ücretsiz İzin", color: "#8e44ad", maxGun: null },
  { value: "dogum", label: "Doğum/Babalık", color: "#3498db", maxGun: null },
  { 
    value: "engelli-cocuk", 
    label: "Engelli Çocuk İzni", 
    color: "#9b59b6", 
    maxGun: 10,
    description: "4857 sayılı İş Kanunu gereği çocuğun %70 oranında engelli olması kaydıyla, engelli çocuğun anne ve babasında bir yıl içerisinde 10 günlük mazeret izni hakkı"
  }
];

// Başlangıç verileri
const DEMO_PERSONELS = [
  { 
    sicilNo: 1, 
    tcNo: "12345678901", 
    adSoyad: "MEHMET DEMİR", 
    gorevi: "İNSAN KAYNAKLARI", 
    departman: "İK", 
    iseGiris: "2020-03-15", 
    dogumTarihi: "1996-03-27", 
    ayrilis: "",
    engelliCocuk: true
  },
  { 
    sicilNo: 2, 
    tcNo: "23456789012", 
    adSoyad: "AHMET KAYA", 
    gorevi: "MUHASEBE SORUMLUSU", 
    departman: "Muhasebe", 
    iseGiris: "2018-04-12", 
    dogumTarihi: "1990-03-07", 
    ayrilis: "",
    engelliCocuk: false
  },
  { 
    sicilNo: 3, 
    tcNo: "34567890123", 
    adSoyad: "AYŞE YILDIZ", 
    gorevi: "PERSONEL", 
    departman: "Muhasebe", 
    iseGiris: "2021-01-02", 
    dogumTarihi: "1998-10-12", 
    ayrilis: "",
    engelliCocuk: true
  },
  { 
    sicilNo: 4, 
    tcNo: "45678901234", 
    adSoyad: "VELİ KAPTAN", 
    gorevi: "PERSONEL", 
    departman: "İK", 
    iseGiris: "2017-09-10", 
    dogumTarihi: "1988-09-21", 
    ayrilis: "2024-06-20",
    engelliCocuk: false
  }
];

const DEMO_IZINLER = [
  { izinNo: 1, sicilNo: 1, adSoyad: "MEHMET DEMİR", tur: "yillik", baslangic: "2023-07-01", bitis: "2023-07-08", toplamGun: 8, not: "", onay: true },
  { izinNo: 2, sicilNo: 2, adSoyad: "AHMET KAYA", tur: "yillik", baslangic: "2024-06-01", bitis: "2024-06-10", toplamGun: 10, not: "", onay: true },
  { izinNo: 3, sicilNo: 3, adSoyad: "AYŞE YILDIZ", tur: "hastalik", baslangic: "2024-05-20", bitis: "2024-05-22", toplamGun: 3, not: "Raporlu", onay: true },
  { izinNo: 4, sicilNo: 1, adSoyad: "MEHMET DEMİR", tur: "mazeret", baslangic: "2024-04-15", bitis: "2024-04-16", toplamGun: 2, not: "Düğün", onay: true },
  { izinNo: 5, sicilNo: 4, adSoyad: "VELİ KAPTAN", tur: "yillik", baslangic: "2024-06-15", bitis: "2024-06-20", toplamGun: 6, not: "", onay: true },
  { izinNo: 6, sicilNo: 1, adSoyad: "MEHMET DEMİR", tur: "yillik", baslangic: "2024-06-01", bitis: "2024-06-10", toplamGun: 10, not: "", onay: true },
  { izinNo: 7, sicilNo: 2, adSoyad: "AHMET KAYA", tur: "ucretsiz", baslangic: "2023-08-01", bitis: "2023-08-10", toplamGun: 10, not: "Yurtdışı", onay: true },
  { izinNo: 8, sicilNo: 3, adSoyad: "AYŞE YILDIZ", tur: "engelli-cocuk", baslangic: "2024-03-01", bitis: "2024-03-05", toplamGun: 5, not: "Engelli çocuk izni", onay: true }
];

// Yardımcı fonksiyonlar
function getYear(date) {
  if (!date) return null;
  return typeof date === "string" ? new Date(date).getFullYear() : date.getFullYear();
}

function izinYillari(personel, izinler) {
  const iseYil = getYear(personel.iseGiris);
  const ayrilisYil = personel.ayrilis ? getYear(personel.ayrilis) : null;
  const nowYil = ayrilisYil || new Date().getFullYear();
  
  let result = [];
  for (let yil = iseYil; yil <= nowYil; yil++) {
    let kidem = yil - iseYil;
    let hak = 14;
    if (kidem >= 15) hak = 26;
    else if (kidem >= 5) hak = 20;
    
    const bas = new Date(`${yil}-01-01`);
    const son = new Date(`${yil}-12-31`);
    
    const kullanilan = izinler
      .filter(i => i.sicilNo === personel.sicilNo && i.tur === "yillik")
      .filter(i => {
        const ibas = new Date(i.baslangic);
        return ibas >= bas && ibas <= son;
      })
      .reduce((a, b) => a + (b.toplamGun || 0), 0);
    
    const kalan = hak - kullanilan;
    result.push({ yil, hak, kullanilan, kalan: kalan > 0 ? kalan : 0 });
  }
  return result;
}

function yasHesap(dogumTarihi) {
  const today = new Date();
  const dob = new Date(dogumTarihi);
  let yas = today.getFullYear() - dob.getFullYear();
  if (today.getMonth() < dob.getMonth() || 
      (today.getMonth() === dob.getMonth() && today.getDate() < dob.getDate())) {
    yas--;
  }
  return yas;
}

function tarihFarkiGun(bas, bit) {
  const b = new Date(bas);
  const t = new Date(bit);
  return Math.round((t - b) / (1000 * 60 * 60 * 24)) + 1;
}

function getIzinTurLabel(tur) {
  const o = IZIN_TURLERI.find(t => t.value === tur);
  return o ? o.label : tur;
}

function getIzinTurColor(tur) {
  const o = IZIN_TURLERI.find(t => t.value === tur);
  return o ? o.color : "#999";
}

function sonIzinler(izinler, n = 7) {
  return [...izinler]
    .sort((a, b) => new Date(b.baslangic) - new Date(a.baslangic))
    .slice(0, n);
}

// PDF fonksiyonları
function izinBelgesiPDF(personel, izin, somenLogoData, baslik = "İzin Belgesi") {
  function fmt(d) {
    if (!d) return "";
    const date = typeof d === "string" ? new Date(d) : d;
    return `${date.getDate().toString().padStart(2, '0')}.${(date.getMonth() + 1).toString().padStart(2, '0')}.${date.getFullYear()}`;
  }
  
  const turLabel = getIzinTurLabel(izin.tur);
  const formatted = {
    baslangic: fmt(izin.baslangic),
    bitis: fmt(izin.bitis),
    today: fmt(new Date())
  };

  // Tek form HTML'i
  const generateOneForm = () => `
    <div class="form-page">
      <div class="header">
        <img src="${somenLogoData}" class="logo" alt="Company Logo" />
        <div class="title">İZİN BELGESİ</div>
      </div>
      
      <table class="info-table">
        <tr>
          <td class="label">Personel Adı Soyadı:</td>
          <td>${personel.adSoyad}</td>
        </tr>
        <tr>
          <td class="label">Sicil No:</td>
          <td>${personel.sicilNo}</td>
        </tr>
        <tr>
          <td class="label">Departman:</td>
          <td>${personel.departman}</td>
        </tr>
        <tr>
          <td class="label">Görev:</td>
          <td>${personel.gorevi}</td>
        </tr>
        <tr>
          <td class="label">İzin Türü:</td>
          <td>${turLabel}</td>
        </tr>
        <tr>
          <td class="label">İzin Başlangıç Tarihi:</td>
          <td>${formatted.baslangic}</td>
        </tr>
        <tr>
          <td class="label">İzin Bitiş Tarihi:</td>
          <td>${formatted.bitis}</td>
        </tr>
        <tr>
          <td class="label">Toplam İzin Süresi:</td>
          <td>${izin.toplamGun} gün</td>
        </tr>
        <tr>
          <td class="label">Açıklama:</td>
          <td>${izin.not || "-"}</td>
        </tr>
      </table>
      
      <div class="signature">
        <div>Personel</div>
        <div>Yönetici</div>
      </div>
    </div>
  `;

  // Tek sayfada iki form
  return `
  <html>
  <head>
    <title>${personel.adSoyad} - ${baslik}</title>
    <style>
      body { 
        font-family: Arial, sans-serif; 
        margin: 0; 
        padding: 0;
        background: #f0f0f0;
      }
      
      .page-container {
        width: 210mm;
        min-height: 297mm;
        margin: 0 auto;
        padding: 5mm 10mm;
        box-sizing: border-box;
        background: white;
        display: flex;
        flex-direction: column;
        gap: 5mm;
      }
      
      .form-page {
        border: 1px solid #ccc;
        padding: 10px;
        position: relative;
        box-sizing: border-box;
        min-height: 120mm;
        display: flex;
        flex-direction: column;
      }
      
      .header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 10px;
        padding-bottom: 10px;
        border-bottom: 1px solid #333;
      }
      
      .logo { 
        height: 50px; 
      }
      
      .title { 
        text-align: right; 
        font-size: 16px; 
        font-weight: bold; 
        flex-grow: 1;
      }
      
      .info-table { 
        width: 100%; 
        border-collapse: collapse; 
        margin-bottom: 10px;
        font-size: 12px;
        flex-grow: 1;
      }
      
      .info-table td { 
        padding: 6px; 
        border-bottom: 1px solid #eee; 
      }
      
      .info-table .label { 
        font-weight: bold; 
        width: 40%; 
      }
      
      .signature { 
        margin-top: auto;
        display: flex; 
        justify-content: space-between; 
      }
      
      .signature div { 
        width: 45%; 
        border-top: 1px solid #000; 
        padding-top: 5px; 
        text-align: center; 
        font-size: 11px;
      }
    </style>
  </head>
  <body>
    <div class="page-container">
      ${generateOneForm()}
      ${generateOneForm()}
    </div>
  </body>
  </html>
  `;
}

function tumKullanilanIzinlerPDF(personel, izinler, somenLogoData, baslik = "Kullanılmış Tüm İzinler") {
  function fmt(d) {
    if (!d) return "";
    const date = typeof d === "string" ? new Date(d) : d;
    return `${date.getDate().toString().padStart(2, '0')}.${(date.getMonth() + 1).toString().padStart(2, '0')}.${date.getFullYear()}`;
  }
  
  return `
  <html>
  <head>
    <title>${personel.adSoyad} - ${baslik}</title>
    <style>
      body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
      .header { display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #333; padding-bottom: 15px; margin-bottom: 20px; }
      .logo { height: 90px; }
      .title { text-align: center; font-size: 22px; font-weight: bold; margin-bottom: 20px; }
      .personel-info { margin-bottom: 20px; }
      .personel-info div { margin-bottom: 5px; }
      table { width: 100%; border-collapse: collapse; margin-top: 10px; }
      th, td { border: 1px solid #ddd; padding: 10px; text-align: center; }
      th { background-color: #f5f5f5; font-weight: bold; }
    </style>
  </head>
  <body>
    <div class="header">
      <img src="${somenLogoData}" class="logo" alt="Company Logo" />
      <div style="text-align: right;">
        <div>${new Date().toLocaleDateString('tr-TR')}</div>
      </div>
    </div>
    
    <div class="title">${baslik}</div>
    
    <div class="personel-info">
      <div><strong>Personel:</strong> ${personel.adSoyad}</div>
      <div><strong>Sicil No:</strong> ${personel.sicilNo}</div>
      <div><strong>Departman:</strong> ${personel.departman}</div>
    </div>
    
    <table>
      <thead>
        <tr>
          <th>İzin No</th>
          <th>Başlangıç</th>
          <th>Bitiş</th>
          <th>Gün</th>
          <th>Tür</th>
          <th>Not</th>
        </tr>
      </thead>
      <tbody>
        ${izinler.length ? izinler.map(i => `
          <tr>
            <td>${i.izinNo}</td>
            <td>${fmt(i.baslangic)}</td>
            <td>${fmt(i.bitis)}</td>
            <td>${i.toplamGun}</td>
            <td>${getIzinTurLabel(i.tur)}</td>
            <td>${i.not || ""}</td>
          </tr>
        `).join("") : "<tr><td colspan='6'>Kayıt yok</td></tr>"}
      </tbody>
    </table>
  </body>
  </html>
  `;
}

export default function PersonelTakip() {
  const [personeller, setPersoneller] = useState([...DEMO_PERSONELS]);
  const [izinler, setIzinler] = useState([...DEMO_IZINLER]);
  const [modal, setModal] = useState("");
  const [activeP, setActiveP] = useState(null);
  const [editFields, setEditFields] = useState({});
  const [iForm, setIForm] = useState({ 
    baslangic: "", 
    bitis: "", 
    not: "", 
    tur: "yillik",
    toplamGun: 0
  });
  const [tab, setTab] = useState("aktif");
  const [yilIzin, setYilIzin] = useState(undefined);
  const [searchTerm, setSearchTerm] = useState("");
  const [formErrors, setFormErrors] = useState({});
  const [isCalculating, setIsCalculating] = useState(false);

  const colors = {
    ana: "#1565c0",
    ikincil: "#2196f3",
    acik: "#e3f2fd",
    hata: "#f44336",
    basarili: "#4caf50",
    gri: "#f5f5f5",
    baslik: "#212121"
  };

  // Personel zenginleştirme
  function enrich(p) {
    const yillar = izinYillari(p, izinler);
    const yearNow = new Date().getFullYear();
    const yThis = yillar.find(y => y.yil === yearNow) || yillar[yillar.length-1];
    const toplamKalan = yillar.slice(0, -1).reduce((a, y) => a + y.kalan, 0);
    const kalan = yThis?.kalan || 0;
    
    let ayrilisHesap = null;
    if (p.ayrilis) {
      ayrilisHesap = {
        toplamKalan: toplamKalan + kalan,
        metin: `Çıkışta ödenecek toplam hak edilmiş ve kullanılmamış yıllık izin: ${toplamKalan + kalan} gün`
      };
    }
    
    // Mazeret ve engelli çocuk izni hesaplama
    const yil = yearNow;
    
    // Mazeret izni
    const mazeretKull = izinler
      .filter(i => i.sicilNo === p.sicilNo && i.tur === "mazeret" && getYear(i.baslangic) === yil)
      .reduce((a, b) => a + (b.toplamGun || 0), 0);
    
    const mazeretKalan = MAZERET_MAX_GUN - mazeretKull;
    
    // Engelli çocuk izni
    const engelliKull = izinler
      .filter(i => i.sicilNo === p.sicilNo && i.tur === "engelli-cocuk" && getYear(i.baslangic) === yil)
      .reduce((a, b) => a + (b.toplamGun || 0), 0);
    
    const engelliKalan = p.engelliCocuk ? 10 - engelliKull : 0;
    
    return {
      ...p,
      yillar,
      hak: yThis?.hak || 0,
      kalan,
      kullanilan: yThis?.kullanilan || 0,
      toplamKalan,
      yas: yasHesap(p.dogumTarihi),
      ayrilisHesap,
      mazeretKalan,
      mazeretKull,
      engelliKalan,
      engelliKull
    };
  }

  // İzin süresi hesaplama
  useEffect(() => {
    if (iForm.baslangic && iForm.bitis) {
      setIsCalculating(true);
      
      const timer = setTimeout(() => {
        const gunSayisi = tarihFarkiGun(iForm.baslangic, iForm.bitis);
        setIForm(prev => ({ ...prev, toplamGun: gunSayisi }));
        setIsCalculating(false);
      }, 500);
      
      return () => clearTimeout(timer);
    } else {
      setIForm(prev => ({ ...prev, toplamGun: 0 }));
    }
  }, [iForm.baslangic, iForm.bitis]);

  // Form değişiklikleri
  function handleEditChange(e) {
    const { name, value } = e.target;
    setEditFields(f => ({ ...f, [name]: value }));
  }
  
  // Personel kaydetme
  function handleEditSave() {
    // Hata kontrolü
    const errors = {};
    if (!editFields.adSoyad) errors.adSoyad = "Ad Soyad zorunlu";
    if (!editFields.tcNo || editFields.tcNo.length !== 11) errors.tcNo = "Geçerli TC No girin";
    if (!editFields.iseGiris) errors.iseGiris = "İşe giriş tarihi zorunlu";
    if (!editFields.dogumTarihi) errors.dogumTarihi = "Doğum tarihi zorunlu";
    
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    
    if (!editFields.sicilNo) {
      // Yeni personel
      const newSicilNo = Math.max(...personeller.map(p => p.sicilNo), 0) + 1;
      setPersoneller([...personeller, { ...editFields, sicilNo: newSicilNo }]);
    } else {
      // Güncelleme
      setPersoneller(personeller.map(p => p.sicilNo === editFields.sicilNo ? { ...editFields } : p));
    }
    
    setModal("");
    setFormErrors({});
  }

  // İzin ekleme modalı açma
  function openIzinModal(p) {
    setActiveP(p);
    setIForm({ 
      baslangic: "", 
      bitis: "", 
      not: "", 
      tur: "yillik",
      toplamGun: 0
    });
    setModal("izin");
  }
  
  // İzin kaydetme
  function handleIzinKaydet(e) {
    e.preventDefault();
    
    // Hata kontrolü
    const errors = {};
    if (!iForm.baslangic) errors.baslangic = "Başlangıç tarihi zorunlu";
    if (!iForm.bitis) errors.bitis = "Bitiş tarihi zorunlu";
    if (iForm.toplamGun <= 0) errors.gun = "Geçerli tarih aralığı seçin";
    
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    
    // İzin türüne göre sınır kontrolleri
    const izinTuru = IZIN_TURLERI.find(t => t.value === iForm.tur);
    
    if (izinTuru && izinTuru.maxGun) {
      const yil = getYear(iForm.baslangic);
      const kullanilan = izinler
        .filter(i => i.sicilNo === activeP.sicilNo && i.tur === iForm.tur && getYear(i.baslangic) === yil)
        .reduce((a, b) => a + (b.toplamGun || 0), 0);
      
      if (kullanilan + iForm.toplamGun > izinTuru.maxGun) {
        alert(`${izinTuru.label} hakkı aşılamaz! Kalan hakkınız: ${izinTuru.maxGun - kullanilan} gün`);
        return;
      }
    }
    
    // Engelli çocuk izni için ek kontrol
    if (iForm.tur === "engelli-cocuk" && !activeP.engelliCocuk) {
      alert("Bu personel engelli çocuk izni kullanma hakkına sahip değil!");
      return;
    }
    
    // Yeni izin oluştur
    const yeniIzin = {
      izinNo: izinler.length ? Math.max(...izinler.map(i => i.izinNo)) + 1 : 1,
      sicilNo: activeP.sicilNo,
      adSoyad: activeP.adSoyad,
      tur: iForm.tur,
      baslangic: iForm.baslangic,
      bitis: iForm.bitis,
      toplamGun: iForm.toplamGun,
      not: iForm.not,
      departman: activeP.departman,
      onay: true
    };
    
    setIzinler([...izinler, yeniIzin]);
    setModal("");
    setFormErrors({});
  }

  // PDF oluşturma fonksiyonları
  async function handleIzinBelgesiPDF(personel, izin) {
    try {
      const response = await fetch(somenLogo);
      const svgText = await response.text();
      const svgBase64 = "data:image/svg+xml;base64," + btoa(svgText);
      const html = izinBelgesiPDF(personel, izin, svgBase64);
      
      const w = window.open("", "_blank");
      w.document.write(html);
      w.document.close();
      
      setTimeout(() => {
        w.document.title = `${personel.adSoyad} - İzin Belgesi`;
      }, 100);
    } catch (error) {
      console.error("PDF oluşturma hatası:", error);
      alert("PDF oluşturulurken bir hata oluştu");
    }
  }

  async function handleTumKullanilanIzinlerPDF(personel, izinlerForPDF = undefined, baslik = "Kullanılmış Tüm İzinler") {
    try {
      const response = await fetch(somenLogo);
      const svgText = await response.text();
      const svgBase64 = "data:image/svg+xml;base64," + btoa(svgText);
      const izinlerim = izinlerForPDF || izinler.filter(i => i.sicilNo === personel.sicilNo);
      const html = tumKullanilanIzinlerPDF(personel, izinlerim, svgBase64, baslik);
      
      const w = window.open("", "_blank");
      w.document.write(html);
      w.document.close();
      
      setTimeout(() => {
        w.document.title = `${personel.adSoyad} - ${baslik}`;
      }, 100);
    } catch (error) {
      console.error("PDF oluşturma hatası:", error);
      alert("PDF oluşturulurken bir hata oluştu");
    }
  }

  // Filtrelenmiş personeller
  const filteredPersoneller = personeller.filter(p => {
    if (tab === "aktif" && p.ayrilis) return false;
    if (tab === "ayrilan" && !p.ayrilis) return false;
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        p.adSoyad.toLowerCase().includes(term) ||
        p.sicilNo.toString().includes(term) ||
        p.tcNo.includes(term) ||
        p.departman.toLowerCase().includes(term)
      );
    }
    
    return true;
  });

  return (
    <div style={{ 
      background: "#f8fbff", 
      minHeight: "100vh", 
      padding: "20px 0",
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      overflowX: "hidden"
    }}>
      <div style={{ 
        maxWidth: 1200, 
        margin: "0 auto",
        padding: "0 15px"
      }}>
        {/* Başlık ve Arama */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 25,
          flexWrap: "wrap",
          gap: 15
        }}>
          <div>
            <h1 style={{ 
              color: colors.ana, 
              fontWeight: 700, 
              fontSize: 28, 
              margin: 0
            }}>
              Personel Takip Sistemi
            </h1>
          </div>
          
          <div style={{ display: "flex", gap: 15, flexWrap: "wrap" }}>
            <div style={{ position: "relative" }}>
              <input
                type="text"
                placeholder="Personel ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  padding: "10px 15px 10px 35px",
                  borderRadius: 25,
                  border: "1px solid #ddd",
                  width: 250,
                  fontSize: 14,
                  boxShadow: "0 2px 5px rgba(0,0,0,0.05)"
                }}
              />
            </div>
            
            <button 
              onClick={() => { 
                setEditFields({}); 
                setModal("duzenle"); 
              }}
              style={{
                background: colors.ana,
                color: "#fff",
                border: 0,
                borderRadius: 25,
                padding: "10px 25px",
                fontWeight: 600,
                fontSize: 15,
                cursor: "pointer"
              }}
            >
              Yeni Personel
            </button>
          </div>
        </div>
        
        {/* Tablar ve Filtreler */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 20,
          flexWrap: "wrap",
          gap: 15
        }}>
          <div style={{ display: "flex", gap: 10 }}>
            <button 
              onClick={() => setTab("aktif")}
              style={{
                background: tab === "aktif" ? colors.ana : "#fff",
                color: tab === "aktif" ? "#fff" : colors.ana,
                border: `1px solid ${colors.ana}`,
                borderRadius: 25,
                padding: "8px 20px",
                fontWeight: 600,
                fontSize: 14,
                cursor: "pointer"
              }}
            >
              Aktif Personeller
            </button>
            <button 
              onClick={() => setTab("ayrilan")}
              style={{
                background: tab === "ayrilan" ? colors.ana : "#fff",
                color: tab === "ayrilan" ? "#fff" : colors.ana,
                border: `1px solid ${colors.ana}`,
                borderRadius: 25,
                padding: "8px 20px",
                fontWeight: 600,
                fontSize: 14,
                cursor: "pointer"
              }}
            >
              Ayrılan Personeller
            </button>
          </div>
          
          <div style={{ color: "#666", fontSize: 14 }}>
            Toplam: {filteredPersoneller.length} personel
          </div>
        </div>
        
        {/* Personel Listesi */}
        <div style={{
          background: "#fff",
          borderRadius: 12,
          boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
          marginBottom: 30,
          overflow: "hidden"
        }}>
          <div style={{ 
            background: colors.acik, 
            padding: "15px 20px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderBottom: `1px solid ${colors.gri}`
          }}>
            <span style={{ 
              color: colors.baslik, 
              fontWeight: 700, 
              fontSize: 18 
            }}>
              Personel Listesi
            </span>
          </div>
          
          <div style={{ overflowX: "auto" }}>
            <table style={{ 
              width: "100%", 
              borderCollapse: "collapse"
            }}>
              <thead>
                <tr style={{ background: colors.gri }}>
                  <th style={{ padding: "12px 15px", textAlign: "left" }}>Sicil</th>
                  <th style={{ padding: "12px 15px", textAlign: "left" }}>Ad Soyad</th>
                  <th style={{ padding: "12px 15px", textAlign: "left" }}>Departman</th>
                  <th style={{ padding: "12px 15px", textAlign: "left" }}>Görev</th>
                  <th style={{ padding: "12px 15px", textAlign: "left" }}>İşe Giriş</th>
                  <th style={{ padding: "12px 15px", textAlign: "center" }}>Yaş</th>
                  <th style={{ padding: "12px 15px", textAlign: "center" }}>Kalan İzin</th>
                  <th style={{ padding: "12px 15px", textAlign: "center" }}>Detay</th>
                  <th style={{ padding: "12px 15px", textAlign: "center" }}>İşlem</th>
                </tr>
              </thead>
              <tbody>
                {filteredPersoneller.map(p0 => {
                  const p = enrich(p0);
                  return (
                    <tr key={p.sicilNo} style={{ borderBottom: "1px solid #f0f0f0" }}>
                      <td style={{ padding: "12px 15px" }}>{p.sicilNo}</td>
                      <td style={{ padding: "12px 15px", fontWeight: 500 }}>{p.adSoyad}</td>
                      <td style={{ padding: "12px 15px" }}>{p.departman}</td>
                      <td style={{ padding: "12px 15px" }}>{p.gorevi}</td>
                      <td style={{ padding: "12px 15px" }}>{p.iseGiris}</td>
                      <td style={{ padding: "12px 15px", textAlign: "center" }}>{p.yas}</td>
                      <td style={{ 
                        padding: "12px 15px", 
                        textAlign: "center",
                        color: p.kalan < 0 ? colors.hata : colors.ana,
                        fontWeight: 600
                      }}>
                        {p.kalan} gün
                      </td>
                      <td style={{ padding: "12px 15px", textAlign: "center" }}>
                        <button 
                          onClick={() => { setActiveP(p); setModal("detay"); }}
                          style={{ 
                            background: colors.ikincil, 
                            color: "#fff", 
                            border: 0, 
                            borderRadius: 6, 
                            padding: "6px 12px", 
                            fontWeight: 600,
                            fontSize: 13,
                            cursor: "pointer",
                            margin: "0 auto"
                          }}
                        >
                          Detay
                        </button>
                      </td>
                      <td style={{ padding: "12px 15px", textAlign: "center" }}>
                        <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                          <button 
                            onClick={() => { setActiveP(p); setEditFields({ ...p }); setModal("duzenle"); }}
                            style={{ 
                              background: "#f0f0f0", 
                              color: colors.baslik, 
                              border: 0, 
                              borderRadius: 6, 
                              padding: "6px 12px", 
                              fontWeight: 600,
                              fontSize: 13,
                              cursor: "pointer"
                            }}
                          >
                            Düzenle
                          </button>
                          
                          <button 
                            onClick={() => openIzinModal(p)}
                            disabled={!!p.ayrilis}
                            style={{ 
                              background: !!p.ayrilis ? "#ddd" : colors.basarili, 
                              color: "#fff", 
                              border: 0, 
                              borderRadius: 6, 
                              padding: "6px 12px", 
                              fontWeight: 600,
                              fontSize: 13,
                              cursor: !!p.ayrilis ? "not-allowed" : "pointer"
                            }}
                            title={!!p.ayrilis ? "Ayrılan personele izin kullandırılamaz" : "İzin ekle"}
                          >
                            İzin Ekle
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          {filteredPersoneller.length === 0 && (
            <div style={{ 
              padding: 40, 
              textAlign: "center", 
              color: "#999",
              fontSize: 16
            }}>
              Kayıtlı personel bulunamadı
            </div>
          )}
        </div>
        
        {/* Son İzinler */}
        <div style={{
          background: "#fff",
          borderRadius: 12,
          boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
          marginBottom: 30,
          overflow: "hidden"
        }}>
          <div style={{ 
            background: colors.acik, 
            padding: "15px 20px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderBottom: `1px solid ${colors.gri}`
          }}>
            <span style={{ 
              color: colors.baslik, 
              fontWeight: 700, 
              fontSize: 18 
            }}>
              Son Kullandırılan İzinler
            </span>
          </div>
          
          <div style={{ overflowX: "auto" }}>
            <table style={{ 
              width: "100%", 
              borderCollapse: "collapse"
            }}>
              <thead>
                <tr style={{ background: colors.gri }}>
                  <th style={{ padding: "12px 15px", textAlign: "center" }}>İzin No</th>
                  <th style={{ padding: "12px 15px", textAlign: "left" }}>Personel</th>
                  <th style={{ padding: "12px 15px", textAlign: "left" }}>Tür</th>
                  <th style={{ padding: "12px 15px", textAlign: "left" }}>Başlangıç</th>
                  <th style={{ padding: "12px 15px", textAlign: "left" }}>Bitiş</th>
                  <th style={{ padding: "12px 15px", textAlign: "center" }}>Gün</th>
                  <th style={{ padding: "12px 15px", textAlign: "center" }}>Belge</th>
                  <th style={{ padding: "12px 15px", textAlign: "center" }}>Detay</th>
                </tr>
              </thead>
              <tbody>
                {sonIzinler(izinler, 7).map(i => {
                  const person = personeller.find(p => p.sicilNo === i.sicilNo);
                  return (
                    <tr key={i.izinNo} style={{ borderBottom: "1px solid #f0f0f0" }}>
                      <td style={{ padding: "12px 15px", textAlign: "center" }}>{i.izinNo}</td>
                      <td style={{ padding: "12px 15px", fontWeight: 500 }}>{i.adSoyad}</td>
                      <td style={{ padding: "12px 15px" }}>
                        <span style={{
                          background: getIzinTurColor(i.tur), 
                          color: "#fff",
                          fontWeight: 600, 
                          fontSize: 12, 
                          borderRadius: 4, 
                          padding: "4px 10px",
                          display: "inline-block"
                        }}>
                          {getIzinTurLabel(i.tur)}
                        </span>
                      </td>
                      <td style={{ padding: "12px 15px" }}>{i.baslangic}</td>
                      <td style={{ padding: "12px 15px" }}>{i.bitis}</td>
                      <td style={{ padding: "12px 15px", textAlign: "center", fontWeight: 600 }}>{i.toplamGun}</td>
                      <td style={{ padding: "12px 15px", textAlign: "center" }}>
                        <button 
                          onClick={() => person && handleIzinBelgesiPDF(person, i)}
                          style={{ 
                            background: colors.ikincil, 
                            color: "#fff", 
                            border: 0, 
                            borderRadius: 4, 
                            padding: "6px 12px", 
                            fontWeight: 600,
                            fontSize: 12,
                            cursor: "pointer",
                            margin: "0 auto"
                          }}
                        >
                          PDF
                        </button>
                      </td>
                      <td style={{ padding: "12px 15px", textAlign: "center" }}>
                        <button 
                          onClick={() => {
                            if (person) {
                              setActiveP(person);
                              const yil = getYear(i.baslangic);
                              setYilIzin({
                                yil,
                                izinler: izinler.filter(iz => 
                                  iz.sicilNo === i.sicilNo && 
                                  getYear(iz.baslangic) === yil
                                )
                              });
                              setModal("yilizin");
                            }
                          }}
                          style={{ 
                            background: colors.ana, 
                            color: "#fff", 
                            border: 0, 
                            borderRadius: 4, 
                            padding: "6px 12px", 
                            fontWeight: 600,
                            fontSize: 12,
                            cursor: "pointer",
                            margin: "0 auto"
                          }}
                        >
                          Detay
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* MODALLAR */}
        
        {/* Personel Detay Modal */}
        {modal === "detay" && activeP && (
          <Modal onClose={() => setModal("")}>
            <div style={{
              background: "#fff", 
              borderRadius: 16, 
              boxShadow: "0 5px 30px rgba(0,0,0,0.2)",
              padding: 30, 
              maxWidth: 900, // Genişlik artırıldı
              margin: "0 auto",
              position: "relative",
              maxHeight: "90vh",
              overflowY: "auto"
            }}>
              <h3 style={{ 
                color: colors.ana, 
                fontWeight: 700, 
                fontSize: 22, 
                marginBottom: 15
              }}>
                {activeP.adSoyad} - {activeP.departman}
              </h3>
              
              <div style={{ 
                display: "grid", 
                gridTemplateColumns: "1fr 1fr", 
                gap: 15,
                marginBottom: 25
              }}>
                <InfoCard label="Sicil No" value={activeP.sicilNo} />
                <InfoCard label="TC Kimlik No" value={activeP.tcNo} />
                <InfoCard label="Görev" value={activeP.gorevi} />
                <InfoCard label="İşe Giriş" value={activeP.iseGiris} />
                <InfoCard label="Doğum Tarihi" value={activeP.dogumTarihi} />
                <InfoCard label="Yaş" value={enrich(activeP).yas} />
                <InfoCard 
                  label="Bu Yıl Kalan İzin" 
                  value={`${enrich(activeP).kalan} gün`} 
                  highlight={enrich(activeP).kalan < 5}
                />
                <InfoCard 
                  label="Mazeret İzni Kalan" 
                  value={`${enrich(activeP).mazeretKalan} gün`} 
                  highlight={enrich(activeP).mazeretKalan < 2}
                />
                <InfoCard 
                  label="Engelli Çocuk İzni Kalan" 
                  value={activeP.engelliCocuk ? `${enrich(activeP).engelliKalan} gün` : "Yok"} 
                  highlight={activeP.engelliCocuk && enrich(activeP).engelliKalan < 3}
                />
                <InfoCard 
                  label="Ayrılış Tarihi" 
                  value={activeP.ayrilis || "-"} 
                  highlight={!!activeP.ayrilis}
                />
              </div>
              
              {enrich(activeP).ayrilisHesap && (
                <div style={{ 
                  background: "#fff8e1", 
                  padding: 15,
                  borderRadius: 8,
                  marginBottom: 20,
                  borderLeft: `4px solid ${colors.hata}`
                }}>
                  <div style={{ 
                    color: colors.hata, 
                    fontWeight: 700, 
                    fontSize: 15
                  }}>
                    {enrich(activeP).ayrilisHesap.metin}
                  </div>
                </div>
              )}
              
              <div style={{ 
                display: "flex", 
                justifyContent: "center", 
                gap: 15,
                flexWrap: "wrap",
                marginBottom: 20
              }}>
                <button 
                  onClick={() => handleTumKullanilanIzinlerPDF(activeP)}
                  style={{
                    background: colors.ikincil, 
                    color: "#fff", 
                    fontWeight: 600, 
                    fontSize: 15, 
                    padding: "10px 25px", 
                    border: 0,
                    borderRadius: 8, 
                    cursor: "pointer",
                    minWidth: 250
                  }}
                >
                  Tüm İzinleri PDF Olarak İndir
                </button>
                
                <button
                  onClick={() => openIzinModal(activeP)}
                  disabled={!!activeP.ayrilis}
                  style={{
                    background: !!activeP.ayrilis ? "#ddd" : colors.basarili,
                    color: "#fff", 
                    fontWeight: 600, 
                    fontSize: 15, 
                    padding: "10px 25px", 
                    border: 0,
                    borderRadius: 8, 
                    cursor: !!activeP.ayrilis ? "not-allowed" : "pointer",
                    minWidth: 250
                  }}
                  title={!!activeP.ayrilis ? "Ayrılan personele izin kullandırılamaz" : ""}
                >
                  Yeni İzin Ekle
                </button>
                
                <button
                  onClick={() => { setEditFields({ ...activeP }); setModal("duzenle"); }}
                  style={{
                    background: colors.ikincil, 
                    color: "#fff", 
                    fontWeight: 600, 
                    fontSize: 15, 
                    padding: "10px 25px", 
                    border: 0,
                    borderRadius: 8, 
                    cursor: "pointer",
                    minWidth: 250
                  }}
                >
                  Bilgileri Düzenle
                </button>
              </div>
              
              <h4 style={{ 
                color: colors.ikincil, 
                fontWeight: 700, 
                fontSize: 18, 
                margin: "20px 0 10px 0",
                paddingBottom: 10,
                borderBottom: `1px solid ${colors.gri}`
              }}>
                Geçmiş Yıllar Yıllık İzin Hakları
              </h4>
              
              <div style={{ 
                maxHeight: 300, 
                overflowY: "auto",
                border: "1px solid #f0f0f0",
                borderRadius: 8
              }}>
                <table style={{ 
                  width: "100%", 
                  borderCollapse: "collapse"
                }}>
                  <thead>
                    <tr style={{ background: colors.gri }}>
                      <th style={{ padding: "10px 15px", textAlign: "center" }}>Yıl</th>
                      <th style={{ padding: "10px 15px", textAlign: "center" }}>Hak Edilen</th>
                      <th style={{ padding: "10px 15px", textAlign: "center" }}>Kullanılan</th>
                      <th style={{ padding: "10px 15px", textAlign: "center" }}>Kalan</th>
                      <th style={{ padding: "10px 15px", textAlign: "center" }}>İşlem</th>
                    </tr>
                  </thead>
                  <tbody>
                    {enrich(activeP).yillar.map(y => (
                      <tr key={y.yil} style={{ borderBottom: "1px solid #f0f0f0" }}>
                        <td style={{ padding: "10px 15px", textAlign: "center", fontWeight: 600 }}>{y.yil}</td>
                        <td style={{ padding: "10px 15px", textAlign: "center" }}>{y.hak} gün</td>
                        <td style={{ padding: "10px 15px", textAlign: "center" }}>{y.kullanilan} gün</td>
                        <td style={{ 
                          padding: "10px 15px", 
                          textAlign: "center",
                          color: y.kalan < 5 ? colors.hata : colors.basarili,
                          fontWeight: 600
                        }}>
                          {y.kalan} gün
                        </td>
                        <td style={{ padding: "10px 15px", textAlign: "center" }}>
                          <button 
                            onClick={() => {
                              const bas = new Date(`${y.yil}-01-01`);
                              const son = new Date(`${y.yil}-12-31`);
                              setYilIzin({
                                yil: y.yil,
                                izinler: izinler.filter(i =>
                                  i.sicilNo === activeP.sicilNo &&
                                  new Date(i.baslangic) >= bas &&
                                  new Date(i.baslangic) <= son
                                )
                              });
                              setModal("yilizin");
                            }}
                            style={{
                              background: colors.acik, 
                              color: colors.ikincil, 
                              border: 0, 
                              borderRadius: 6, 
                              padding: "6px 12px", 
                              fontWeight: 600,
                              cursor: "pointer"
                            }}
                          >
                            İzinleri Gör
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </Modal>
        )}
        
        {/* Yıl İzin Detay Modal */}
        {modal === "yilizin" && yilIzin && activeP && (
          <Modal onClose={() => setModal("")}>
            <div style={{
              background: "#fff", 
              borderRadius: 16, 
              boxShadow: "0 5px 30px rgba(0,0,0,0.2)",
              padding: 30, 
              maxWidth: 900, // Genişlik artırıldı
              margin: "0 auto",
              maxHeight: "90vh",
              overflowY: "auto"
            }}>
              <h3 style={{ 
                color: colors.ana, 
                fontWeight: 700, 
                fontSize: 22, 
                marginBottom: 15
              }}>
                {activeP.adSoyad} - {yilIzin.yil} Yılı İzin Detayları
              </h3>
              
              <div style={{ overflowX: "auto", marginBottom: 20 }}>
                <table style={{ 
                  width: "100%", 
                  borderCollapse: "collapse"
                }}>
                  <thead>
                    <tr style={{ background: colors.gri }}>
                      <th style={{ padding: "10px 15px", textAlign: "center" }}>İzin No</th>
                      <th style={{ padding: "10px 15px", textAlign: "left" }}>Tür</th>
                      <th style={{ padding: "10px 15px", textAlign: "left" }}>Başlangıç</th>
                      <th style={{ padding: "10px 15px", textAlign: "left" }}>Bitiş</th>
                      <th style={{ padding: "10px 15px", textAlign: "center" }}>Gün</th>
                      <th style={{ padding: "10px 15px", textAlign: "left" }}>Not</th>
                      <th style={{ padding: "10px 15px", textAlign: "center" }}>Belge</th>
                    </tr>
                  </thead>
                  <tbody>
                    {yilIzin.izinler.length ? yilIzin.izinler.map(i => (
                      <tr key={i.izinNo} style={{ borderBottom: "1px solid #f0f0f0" }}>
                        <td style={{ padding: "10px 15px", textAlign: "center" }}>{i.izinNo}</td>
                        <td style={{ padding: "10px 15px" }}>
                          <span style={{
                            background: getIzinTurColor(i.tur), 
                            color: "#fff",
                            fontWeight: 600, 
                            fontSize: 12, 
                            borderRadius: 4, 
                            padding: "4px 10px",
                            display: "inline-block"
                          }}>
                            {getIzinTurLabel(i.tur)}
                          </span>
                        </td>
                        <td style={{ padding: "10px 15px" }}>{i.baslangic}</td>
                        <td style={{ padding: "10px 15px" }}>{i.bitis}</td>
                        <td style={{ padding: "10px 15px", textAlign: "center", fontWeight: 600 }}>{i.toplamGun}</td>
                        <td style={{ padding: "10px 15px" }}>{i.not || "-"}</td>
                        <td style={{ padding: "10px 15px", textAlign: "center" }}>
                          <button 
                            onClick={() => handleIzinBelgesiPDF(activeP, i)}
                            style={{ 
                              background: colors.ikincil, 
                              color: "#fff", 
                              border: 0, 
                              borderRadius: 4, 
                              padding: "6px 12px", 
                              fontWeight: 600,
                              fontSize: 12,
                              cursor: "pointer"
                            }}
                          >
                            PDF
                          </button>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={7} style={{ padding: "20px", textAlign: "center", color: "#999" }}>
                          Bu yıla ait izin kaydı bulunamadı
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              
              <button 
                onClick={() => handleTumKullanilanIzinlerPDF(activeP, yilIzin.izinler, `${yilIzin.yil} Yılı Kullanılmış Tüm İzinler`)}
                style={{
                  background: colors.ana, 
                  color: "#fff", 
                  fontWeight: 600, 
                  fontSize: 15, 
                  padding: "10px 25px", 
                  border: 0,
                  borderRadius: 8, 
                  cursor: "pointer",
                  display: "block",
                  margin: "0 auto"
                }}
              >
                Bu Yıla Ait Tüm İzinleri PDF Olarak İndir
              </button>
            </div>
          </Modal>
        )}
        
        {/* Personel Düzenle Modal */}
        {modal === "duzenle" && (
          <Modal onClose={() => setModal("")}>
            <div style={{
              background: "#fff", 
              borderRadius: 16, 
              boxShadow: "0 5px 30px rgba(0,0,0,0.2)",
              padding: 30, 
              maxWidth: 900, // Genişlik artırıldı
              margin: "0 auto",
              maxHeight: "90vh",
              overflowY: "auto",
              overflowX: "hidden"
            }}>
              <h3 style={{ 
                color: colors.ana, 
                fontWeight: 700, 
                fontSize: 22, 
                marginBottom: 20
              }}>
                {editFields.sicilNo ? "Personel Bilgilerini Düzenle" : "Yeni Personel Ekle"}
              </h3>
              
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 25 }}>
                {editFields.sicilNo ? (
                  <>
                    <div style={{ gridColumn: "span 2" }}>
                      <label style={{ display: "block", marginBottom: 8, fontWeight: 600 }}>Sicil No</label>
                      <input 
                        disabled 
                        value={editFields.sicilNo} 
                        style={{ 
                          width: "100%", 
                          padding: "10px 15px", 
                          borderRadius: 8, 
                          border: "1px solid #ddd",
                          fontSize: 15
                        }} 
                      />
                    </div>
                    
                    <div style={{ gridColumn: "span 2" }}>
                      <label style={{ display: "block", marginBottom: 8, fontWeight: 600 }}>TC Kimlik No</label>
                      <input 
                        name="tcNo" 
                        maxLength={11} 
                        value={editFields.tcNo || ""} 
                        onChange={handleEditChange} 
                        style={{ 
                          width: "100%", 
                          padding: "10px 15px", 
                          borderRadius: 8, 
                          border: "1px solid #ddd",
                          fontSize: 15
                        }} 
                      />
                      {formErrors.tcNo && <div style={{ color: colors.hata, marginTop: 5 }}>{formErrors.tcNo}</div>}
                    </div>
                  </>
                ) : (
                  <div style={{ gridColumn: "span 2" }}>
                    <label style={{ display: "block", marginBottom: 8, fontWeight: 600 }}>TC Kimlik No</label>
                    <input 
                      required 
                      name="tcNo" 
                      maxLength={11} 
                      value={editFields.tcNo || ""} 
                      onChange={handleEditChange} 
                      style={{ 
                        width: "100%", 
                        padding: "10px 15px", 
                        borderRadius: 8, 
                        border: "1px solid #ddd",
                        fontSize: 15
                      }} 
                    />
                    {formErrors.tcNo && <div style={{ color: colors.hata, marginTop: 5 }}>{formErrors.tcNo}</div>}
                  </div>
                )}
                
                <div style={{ gridColumn: "span 2" }}>
                  <label style={{ display: "block", marginBottom: 8, fontWeight: 600 }}>Ad Soyad</label>
                  <input 
                    required 
                    name="adSoyad" 
                    value={editFields.adSoyad || ""} 
                    onChange={handleEditChange} 
                    style={{ 
                      width: "100%", 
                      padding: "10px 15px", 
                      borderRadius: 8, 
                      border: "1px solid #ddd",
                      fontSize: 15
                    }} 
                  />
                  {formErrors.adSoyad && <div style={{ color: colors.hata, marginTop: 5 }}>{formErrors.adSoyad}</div>}
                </div>
                
                <div style={{ gridColumn: "span 2" }}>
                  <label style={{ display: "block", marginBottom: 8, fontWeight: 600 }}>Görev</label>
                  <input 
                    required 
                    name="gorevi" 
                    value={editFields.gorevi || ""} 
                    onChange={handleEditChange} 
                    style={{ 
                      width: "100%", 
                      padding: "10px 15px", 
                      borderRadius: 8, 
                      border: "1px solid #ddd",
                      fontSize: 15
                    }} 
                  />
                </div>
                
                <div style={{ gridColumn: "span 2" }}>
                  <label style={{ display: "block", marginBottom: 8, fontWeight: 600 }}>Departman</label>
                  <input 
                    required 
                    name="departman" 
                    value={editFields.departman || ""} 
                    onChange={handleEditChange} 
                    style={{ 
                      width: "100%", 
                      padding: "10px 15px", 
                      borderRadius: 8, 
                      border: "1px solid #ddd",
                      fontSize: 15
                    }} 
                  />
                </div>
                
                <div style={{ gridColumn: "span 2" }}>
                  <label style={{ display: "block", marginBottom: 8, fontWeight: 600 }}>İşe Giriş Tarihi</label>
                  <input 
                    required 
                    name="iseGiris" 
                    type="date" 
                    value={editFields.iseGiris || ""} 
                    onChange={handleEditChange} 
                    style={{ 
                      width: "100%", 
                      padding: "10px 15px", 
                      borderRadius: 8, 
                      border: "1px solid #ddd",
                      fontSize: 15
                    }} 
                  />
                  {formErrors.iseGiris && <div style={{ color: colors.hata, marginTop: 5 }}>{formErrors.iseGiris}</div>}
                </div>
                
                <div style={{ gridColumn: "span 2" }}>
                  <label style={{ display: "block", marginBottom: 8, fontWeight: 600 }}>Doğum Tarihi</label>
                  <input 
                    required 
                    name="dogumTarihi" 
                    type="date" 
                    value={editFields.dogumTarihi || ""} 
                    onChange={handleEditChange} 
                    style={{ 
                      width: "100%", 
                      padding: "10px 15px", 
                      borderRadius: 8, 
                      border: "1px solid #ddd",
                      fontSize: 15
                    }} 
                  />
                  {formErrors.dogumTarihi && <div style={{ color: colors.hata, marginTop: 5 }}>{formErrors.dogumTarihi}</div>}
                </div>
                
                <div style={{ gridColumn: "span 2" }}>
                  <label style={{ display: "block", marginBottom: 8, fontWeight: 600 }}>Ayrılış Tarihi</label>
                  <input 
                    name="ayrilis" 
                    type="date" 
                    value={editFields.ayrilis || ""} 
                    onChange={handleEditChange} 
                    style={{ 
                      width: "100%", 
                      padding: "10px 15px", 
                      borderRadius: 8, 
                      border: "1px solid #ddd",
                      fontSize: 15
                    }} 
                  />
                </div>
                
                <div style={{ gridColumn: "span 2" }}>
                  <label style={{ display: "block", marginBottom: 8, fontWeight: 600 }}>
                    Engelli Çocuğu Var mı?
                  </label>
                  <div style={{ display: "flex", gap: 15, marginTop: 5 }}>
                    <label style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      <input 
                        type="radio" 
                        name="engelliCocuk" 
                        checked={editFields.engelliCocuk === true} 
                        onChange={() => setEditFields({ ...editFields, engelliCocuk: true })} 
                      />
                      Evet
                    </label>
                    <label style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      <input 
                        type="radio" 
                        name="engelliCocuk" 
                        checked={editFields.englliCocuk === false || editFields.engelliCocuk === undefined} 
                        onChange={() => setEditFields({ ...editFields, engelliCocuk: false })} 
                      />
                      Hayır
                    </label>
                  </div>
                </div>
              </div>
              
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 15, marginTop: 20 }}>
                {editFields.sicilNo && (
                  <button 
                    onClick={() => { 
                      if (window.confirm("Bu personeli silmek istediğinize emin misiniz?")) {
                        setPersoneller(personeller.filter(p => p.sicilNo !== editFields.sicilNo)); 
                        setModal(""); 
                      }
                    }}
                    style={{
                      background: colors.hata, 
                      color: "#fff", 
                      fontWeight: 600, 
                      fontSize: 15, 
                      padding: "10px 25px", 
                      border: 0,
                      borderRadius: 8, 
                      cursor: "pointer"
                    }}
                  >
                    Personeli Sil
                  </button>
                )}
                <button 
                  onClick={handleEditSave}
                  style={{
                    background: colors.basarili, 
                    color: "#fff", 
                    fontWeight: 600, 
                    fontSize: 15, 
                    padding: "10px 25px", 
                    border: 0,
                    borderRadius: 8, 
                    cursor: "pointer"
                  }}
                >
                  Kaydet
                </button>
              </div>
            </div>
          </Modal>
        )}
        
        {/* İzin Ekleme Modalı */}
        {modal === "izin" && activeP && (
          <Modal onClose={() => setModal("")}>
            <div style={{
              background: "#fff", 
              borderRadius: 16, 
              boxShadow: "0 5px 30px rgba(0,0,0,0.2)",
              padding: 30, 
              maxWidth: 900, // Genişlik artırıldı
              margin: "0 auto",
              maxHeight: "90vh",
              overflowY: "auto",
              overflowX: "hidden"
            }}>
              <h3 style={{ 
                color: colors.ana, 
                fontWeight: 700, 
                fontSize: 22, 
                marginBottom: 20
              }}>
                Yeni İzin Ekle - {activeP.adSoyad}
              </h3>
              
              <form onSubmit={handleIzinKaydet} style={{ display: "grid", gap: 20 }}>
                <div style={{ gridColumn: "1 / span 2" }}>
                  <label style={{ display: "block", marginBottom: 8, fontWeight: 600 }}>İzin Türü</label>
                  <select 
                    required 
                    value={iForm.tur} 
                    onChange={e => setIForm(f => ({ ...f, tur: e.target.value }))} 
                    style={{ 
                      width: "100%", 
                      padding: "10px 15px", 
                      borderRadius: 8, 
                      border: "1px solid #ddd",
                      fontSize: 15
                    }}
                  >
                    {IZIN_TURLERI.map(t => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                  
                  {iForm.tur === "mazeret" && (
                    <div style={{ marginTop: 10, color: "#e67e22", fontWeight: 600 }}>
                      Bu yıl kalan mazeret izni: <b>{enrich(activeP).mazeretKalan}</b> gün
                    </div>
                  )}
                  
                  {iForm.tur === "engelli-cocuk" && (
                    <div style={{ marginTop: 10, color: "#9b59b6", fontWeight: 600 }}>
                      {activeP.engelliCocuk ? (
                        <>Bu yıl kalan engelli çocuk izni: <b>{enrich(activeP).engelliKalan}</b> gün</>
                      ) : (
                        <span style={{ color: colors.hata }}>
                          Bu personel engelli çocuk izni kullanma hakkına sahip değil!
                        </span>
                      )}
                    </div>
                  )}
                </div>
                
                <div style={{ gridColumn: "1 / span 2", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                  <div>
                    <label style={{ display: "block", marginBottom: 8, fontWeight: 600 }}>Başlangıç Tarihi</label>
                    <input 
                      required 
                      type="date" 
                      value={iForm.baslangic} 
                      onChange={e => setIForm(f => ({ ...f, baslangic: e.target.value }))} 
                      style={{ 
                        width: "100%", 
                        padding: "10px 15px", 
                        borderRadius: 8, 
                        border: "1px solid #ddd",
                        fontSize: 15
                      }} 
                    />
                    {formErrors.baslangic && <div style={{ color: colors.hata, marginTop: 5 }}>{formErrors.baslangic}</div>}
                  </div>
                  
                  <div>
                    <label style={{ display: "block", marginBottom: 8, fontWeight: 600 }}>Bitiş Tarihi</label>
                    <input 
                      required 
                      type="date" 
                      value={iForm.bitis} 
                      onChange={e => setIForm(f => ({ ...f, bitis: e.target.value }))} 
                      style={{ 
                        width: "100%", 
                        padding: "10px 15px", 
                        borderRadius: 8, 
                        border: "1px solid #ddd",
                        fontSize: 15
                      }} 
                    />
                    {formErrors.bitis && <div style={{ color: colors.hata, marginTop: 5 }}>{formErrors.bitis}</div>}
                  </div>
                </div>
                
                <div style={{ gridColumn: "1 / span 2" }}>
                  <label style={{ display: "block", marginBottom: 8, fontWeight: 600 }}>
                    Toplam İzin Süresi: 
                    <span style={{ marginLeft: 10, color: colors.ana, fontWeight: 700 }}>
                      {iForm.toplamGun} gün
                    </span>
                  </label>
                  {formErrors.gun && <div style={{ color: colors.hata, marginTop: 5 }}>{formErrors.gun}</div>}
                </div>
                
                <div style={{ gridColumn: "1 / span 2" }}>
                  <label style={{ display: "block", marginBottom: 8, fontWeight: 600 }}>Açıklama / Not</label>
                  <textarea 
                    value={iForm.not} 
                    onChange={e => setIForm(f => ({ ...f, not: e.target.value }))} 
                    style={{ 
                      width: "100%", 
                      minHeight: 80,
                      padding: "10px 15px", 
                      borderRadius: 8, 
                      border: "1px solid #ddd",
                      fontSize: 15
                    }} 
                  />
                </div>
                
                <button 
                  type="submit"
                  style={{
                    background: colors.basarili, 
                    color: "#fff", 
                    fontWeight: 600, 
                    fontSize: 16, 
                    padding: "12px 25px", 
                    border: 0,
                    borderRadius: 8, 
                    cursor: "pointer",
                    gridColumn: "1 / span 2"
                  }}
                >
                  İzni Kaydet
                </button>
              </form>
            </div>
          </Modal>
        )}
      </div>
    </div>
  );
}

function Modal({ onClose, children }) {
  return (
    <div style={{
      position: "fixed", 
      left: 0, 
      top: 0, 
      width: "100vw", 
      height: "100vh",
      background: "rgba(0,0,0,0.7)", 
      zIndex: 10000, 
      display: "flex", 
      alignItems: "center", 
      justifyContent: "center",
      backdropFilter: "blur(3px)"
    }}>
      <div style={{
        background: "#fff", 
        padding: 0, 
        borderRadius: 16, 
        minWidth: 320, 
        minHeight: 100,
        maxWidth: "90vw", 
        width: "auto",
        boxShadow: "0 10px 50px rgba(0,0,0,0.3)", 
        position: "relative", 
        maxHeight: "90vh", 
        overflow: "auto"
      }}>
        <button onClick={onClose} style={{
          position: "absolute", 
          top: 15, 
          right: 20, 
          background: "none", 
          border: "none",
          fontSize: 28, 
          fontWeight: 900, 
          color: "#777", 
          cursor: "pointer", 
          zIndex: 10,
          width: 40,
          height: 40,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "50%",
          background: "#f0f0f0"
        }}>×</button>
        {children}
      </div>
    </div>
  );
}

function InfoCard({ label, value, highlight = false }) {
  return (
    <div style={{ 
      background: "#f9f9f9", 
      borderRadius: 8, 
      padding: 15,
      borderLeft: `4px solid ${highlight ? "#1565c0" : "#e0e0e0"}`
    }}>
      <div style={{ 
        fontSize: 13, 
        color: "#666", 
        marginBottom: 5,
        fontWeight: 600
      }}>
        {label}
      </div>
      <div style={{ 
        fontSize: 16, 
        fontWeight: 600,
        color: highlight ? "#1565c0" : "#333"
      }}>
        {value}
      </div>
    </div>
  );
}