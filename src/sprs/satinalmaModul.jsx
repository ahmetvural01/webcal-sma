import React, { useState, useEffect, useRef } from "react";
import * as api from "../api";
import { QRCodeCanvas } from "qrcode.react";
import JsBarcode from "jsbarcode";

// YETKİ KONTROLÜ (ROOT ADMIN HER ZAMAN TAM YETKİLİ)
function kullaniciYetkisiVarMi(user, yetki) {
  if (!user) return false;
  if (user.rol === "root" || user.isRootAdmin) return true;
  if (user.extra_permissions && Array.isArray(user.extra_permissions) && user.extra_permissions.includes(yetki)) return true;
  if (user.removed_permissions && Array.isArray(user.removed_permissions) && user.removed_permissions.includes(yetki)) return false;
  if (user.rol && user.rol.permissions && Array.isArray(user.rol.permissions)) {
    return user.rol.permissions.includes(yetki);
  }
  return false;
}

// Sipariş No üretici
function generateSiparisNo(lastNumber = "0000") {
  const year = new Date().getFullYear().toString().slice(-2);
  const nextNumber = (parseInt(lastNumber, 10) + 1).toString().padStart(4, '0');
  return `SMN-${year}${nextNumber}`;
}

export default function SatinalmaModul({ user }) {
  // Sipariş formu
  const [siparisNo, setSiparisNo] = useState("");
  const [tedarikciler, setTedarikciler] = useState([]);
  const [tedarikci, setTedarikci] = useState("");
  const [aciklama, setAciklama] = useState("");
  const [urunler, setUrunler] = useState([]);
  const [otomatikStogaAktar, setOtomatikStogaAktar] = useState(false);
  const [barkodUrl, setBarkodUrl] = useState("");
  const [excelFile, setExcelFile] = useState(null);
  const barcodeRef = useRef(null);

  // Liste
  const [siparisler, setSiparisler] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtre, setFiltre] = useState({ firma: "", durum: "" });

  // Tedarikçi popup
  const [showTedarikciPopup, setShowTedarikciPopup] = useState(false);
  const [yeniTedarikci, setYeniTedarikci] = useState({ adi: "", email: "", telefon: "", adres: "", vergi_no: "" });

  // --- Tedarikçi Listesi Yükle ---
  useEffect(() => {
    async function fetchTedarikciler() {
      try {
        const data = await api.getTedarikciler();
        setTedarikciler(data || []);
      } catch (error) {
        console.error('Error fetching tedarikciler:', error);
      }
    }
    fetchTedarikciler();
  }, []);

  // --- Sipariş No Otomatik Yarat ---
  useEffect(() => {
    async function yeniNo() {
      try {
        const data = await api.getSiparisler();
        const lastOrder = data && data.length > 0 ? data[0] : null;
        setSiparisNo(generateSiparisNo(!lastOrder ? "0000" : lastOrder.siparis_no?.substring(5)));
      } catch (error) {
        console.error('Error generating order number:', error);
        setSiparisNo(generateSiparisNo("0000"));
      }
    }
    yeniNo();
  }, []);

  // --- Barkod Oluştur ---
  useEffect(() => {
    if (barcodeRef.current && siparisNo) {
      JsBarcode(barcodeRef.current, siparisNo, { format: "CODE128" });
      setBarkodUrl(barcodeRef.current.toDataURL("image/png"));
    }
  }, [siparisNo]);

  // --- Siparişleri Listele (Filtreli) ---
  useEffect(() => {
    fetchSiparisler();
    // eslint-disable-next-line
  }, [filtre]);

  async function fetchSiparisler() {
    setLoading(true);
    try {
      const filters = {};
      if (filtre.firma) filters.tedarikci_adi = filtre.firma;
      if (filtre.durum) filters.durum = filtre.durum;
      
      const data = await api.getSiparisler(filters);
      setSiparisler(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
    setLoading(false);
  }

  // --- Excel Dosyası Okuyucu (SheetJS ile) ---
  async function handleExcel(e) {
    const file = e.target.files[0];
    setExcelFile(file);
    const XLSX = await import("xlsx");
    let reader = new FileReader();
    reader.onload = (evt) => {
      const data = evt.target.result;
      const workbook = XLSX.read(data, { type: "binary" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      let startRow = 0;
      if (json[0].some(cell => typeof cell === "string" && cell.toLowerCase().includes("kod"))) startRow++;
      const parsed = json.slice(startRow).map(row => ({
        urun_kodu: row[0] || "",
        urun_adi: row[1] || "",
        miktar: row[2] || 0,
        birim: row[3] || "",
        fiyat: row[4] || 0,
        toplam: (parseFloat(row[2]) || 0) * (parseFloat(row[4]) || 0)
      })).filter(u => u.urun_kodu && u.urun_adi);
      setUrunler(prev => [...prev, ...parsed]);
    };
    reader.readAsBinaryString(file);
  }

  // Ürün satırı ekle/sil/güncelle
  function addEmptyUrun() {
    setUrunler([...urunler, { urun_kodu: "", urun_adi: "", miktar: 0, birim: "", fiyat: 0, toplam: 0 }]);
  }
  function updateUrun(i, key, value) {
    const up = [...urunler];
    up[i][key] = value;
    if(key === "miktar" || key === "fiyat") {
      up[i].toplam = (parseFloat(up[i].miktar) || 0) * (parseFloat(up[i].fiyat) || 0);
    }
    setUrunler(up);
  }
  function removeUrun(i) {
    setUrunler(urunler.filter((_,idx) => idx !== i));
  }

  // --- Tedarikçi Ekleme ---
  async function handleTedarikciEkle() {
    if (!yeniTedarikci.adi) return alert("Tedarikçi adı zorunlu!");
    
    try {
      const data = await api.createTedarikci(yeniTedarikci);
      setTedarikciler([...tedarikciler, data]);
      setTedarikci(data.id);
      setYeniTedarikci({ adi: "", email: "", telefon: "", adres: "", vergi_no: "" });
      setShowTedarikciPopup(false);
    } catch (error) {
      console.error('Error creating supplier:', error);
      alert("Kayıt başarısız!");
    }
  }

  // --- SİPARİŞ KAYDET ---
  async function handleSiparisKaydet() {
    if (!kullaniciYetkisiVarMi(user, "siparis_ekle")) {
      alert("Sipariş ekleme yetkiniz yok!");
      return;
    }
    if (!tedarikci) return alert("Tedarikçi seçmelisiniz!");
    if (urunler.length === 0) return alert("En az bir ürün ekleyin!");
    
    try {
      const tedarikciObj = tedarikciler.find(t => t.id === tedarikci);
      
      // Create order with urunler array in the order data
      const data = await api.createSiparis({
        siparis_no: siparisNo,
        tedarikci_adi: tedarikciObj ? tedarikciObj.adi : "",
        durum: "Beklemede",
        aciklama,
        urunler: urunler,
        otomatik_stoga_aktar: otomatikStogaAktar
      });

      // If automatic stock transfer is enabled, create stock movements
      if (otomatikStogaAktar) {
        for (const u of urunler) {
          await api.createStokHareket({
            urun_kodu: u.urun_kodu,
            urun_aciklama: u.urun_adi,
            islem_turu: "Giriş",
            giris_miktari: u.miktar,
            cikis_miktari: 0,
            ek_aciklama: `Sipariş: ${siparisNo}`
          });
        }
      }

      alert("Sipariş başarıyla kaydedildi!");
      setUrunler([]);
      setAciklama("");
      setTedarikci("");
      setOtomatikStogaAktar(false);
      setExcelFile(null);
      fetchSiparisler();
      
      // Generate new order number
      const orders = await api.getSiparisler();
      const lastOrder = orders && orders.length > 0 ? orders[0] : null;
      setSiparisNo(generateSiparisNo(!lastOrder ? "0000" : lastOrder.siparis_no?.substring(5)));
    } catch (error) {
      console.error('Error saving order:', error);
      alert("Sipariş kaydedilemedi!");
    }
  }

  return (
    <div style={{ maxWidth: 1100, margin: "40px auto", background: "#fff", borderRadius: 18, boxShadow: "0 2px 28px #0002", padding: 28 }}>
      <h1 style={{ fontWeight: 900, fontSize: 32, letterSpacing: 1, marginBottom: 20 }}>
        SATINALMA / SİPARİŞ YÖNETİMİ
      </h1>
      <div style={{ border: "2px solid #e8f3ff", borderRadius: 14, padding: 18, marginBottom: 44, background: "#fafdff" }}>
        <h2 style={{ fontWeight: 800, fontSize: 23, marginBottom: 15 }}>Yeni Sipariş</h2>
        <div style={{ display: "flex", gap: 32, marginBottom: 16, alignItems: "flex-end" }}>
          <div>
            <label>Sipariş No: <b>{siparisNo}</b></label>
            <div style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 4 }}>
              <canvas ref={barcodeRef} style={{ display: "none" }} />
              {barkodUrl && <img src={barkodUrl} alt="Barkod" style={{ height: 48 }} />}
              <QRCodeCanvas value={siparisNo} size={56} />
            </div>
          </div>
          <div>
            <label>Tedarikçi:</label>
            <select value={tedarikci} onChange={e => setTedarikci(e.target.value)} style={{ width: 220, marginLeft: 7, padding: 7 }}>
              <option value="">Seçiniz</option>
              {tedarikciler.map(t => <option key={t.id} value={t.id}>{t.adi}</option>)}
            </select>
            <div style={{ marginTop: 5 }}>
              <button
                style={{ fontSize: 14, color: "#099", border: "none", background: "none", cursor: "pointer" }}
                onClick={() => setShowTedarikciPopup(true)}
              >+ Yeni Tedarikçi</button>
            </div>
          </div>
          <div>
            <label>Açıklama:</label>
            <input value={aciklama} onChange={e => setAciklama(e.target.value)} style={{ width: 220, marginLeft: 7, padding: 7 }} />
          </div>
        </div>
        <div style={{ marginBottom: 10 }}>
          <label>
            <input type="checkbox" checked={otomatikStogaAktar} onChange={e => setOtomatikStogaAktar(e.target.checked)} />
            Sipariş stoğa otomatik aktarılsın
          </label>
        </div>
        <div style={{ marginBottom: 16 }}>
          <b>Ürünleri Excel'den yükle:</b>
          <input type="file" accept=".xls,.xlsx"
            onChange={handleExcel}
            style={{ padding: 7, marginLeft: 12, fontSize: 15 }} />
          <span style={{ fontSize: 13, color: "#888", marginLeft: 8 }}>(İlk 5 sütun: kod, ad, miktar, birim, fiyat)</span>
          {excelFile && <span style={{ color: "#099", marginLeft: 8 }}>Yüklendi: {excelFile.name}</span>}
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 20 }}>
          <thead>
            <tr style={{ background: "#e8f3ff" }}>
              <th style={{ border: "1px solid #eee", padding: 6 }}>Ürün Kodu</th>
              <th style={{ border: "1px solid #eee", padding: 6 }}>Ürün Adı</th>
              <th style={{ border: "1px solid #eee", padding: 6 }}>Miktar</th>
              <th style={{ border: "1px solid #eee", padding: 6 }}>Birim</th>
              <th style={{ border: "1px solid #eee", padding: 6 }}>Fiyat</th>
              <th style={{ border: "1px solid #eee", padding: 6 }}>Toplam</th>
              <th style={{ border: "1px solid #eee", padding: 6 }}></th>
            </tr>
          </thead>
          <tbody>
            {urunler.map((u, i) => (
              <tr key={i}>
                <td style={{ border: "1px solid #eee", padding: 5 }}>
                  <input value={u.urun_kodu} style={{ width: 90 }}
                    onChange={e => updateUrun(i, "urun_kodu", e.target.value)} />
                </td>
                <td style={{ border: "1px solid #eee", padding: 5 }}>
                  <input value={u.urun_adi} style={{ width: 130 }}
                    onChange={e => updateUrun(i, "urun_adi", e.target.value)} />
                </td>
                <td style={{ border: "1px solid #eee", padding: 5 }}>
                  <input type="number" value={u.miktar} style={{ width: 62 }}
                    onChange={e => updateUrun(i, "miktar", e.target.value)} />
                </td>
                <td style={{ border: "1px solid #eee", padding: 5 }}>
                  <input value={u.birim} style={{ width: 60 }}
                    onChange={e => updateUrun(i, "birim", e.target.value)} />
                </td>
                <td style={{ border: "1px solid #eee", padding: 5 }}>
                  <input type="number" value={u.fiyat} style={{ width: 70 }}
                    onChange={e => updateUrun(i, "fiyat", e.target.value)} />
                </td>
                <td style={{ border: "1px solid #eee", padding: 5 }}>
                  {(parseFloat(u.toplam) || 0).toLocaleString("tr-TR", { maximumFractionDigits: 2 })}
                </td>
                <td style={{ border: "1px solid #eee", padding: 5 }}>
                  <button style={{ color: "#e35", fontSize: 18, border: "none", background: "none", cursor: "pointer" }}
                    title="Ürünü sil" onClick={() => removeUrun(i)}>×</button>
                </td>
              </tr>
            ))}
            {urunler.length === 0 && (
              <tr><td colSpan={7} style={{ textAlign: "center", color: "#aaa" }}>Ürün yok</td></tr>
            )}
          </tbody>
        </table>
        <button onClick={addEmptyUrun}
          style={{
            background: "#e8f3ff", color: "#156176", fontWeight: 700, borderRadius: 8,
            padding: "9px 26px", border: "none", fontSize: 17, cursor: "pointer", marginBottom: 22
          }}>
          + Yeni Ürün Satırı Ekle
        </button>
        <div style={{ textAlign: "right", marginTop: 20, marginBottom: 10 }}>
          <b>Toplam Tutar: </b>
          {(urunler.reduce((sum, u) => sum + (parseFloat(u.toplam) || 0), 0)).toLocaleString("tr-TR", { maximumFractionDigits: 2 })} ₺
        </div>
        <div style={{ textAlign: "right" }}>
          <button
            onClick={handleSiparisKaydet}
            style={{
              background: "linear-gradient(120deg,#00c7c7 0%,#156176 100%)", color: "#fff",
              fontWeight: 900, borderRadius: 8, padding: "13px 38px", border: "none", fontSize: 20, cursor: "pointer"
            }}>
            Siparişi Kaydet
          </button>
        </div>
      </div>
      <h2 style={{ fontWeight: 800, fontSize: 23, margin: "8px 0 15px 0" }}>Sipariş Listesi</h2>
      <div style={{ display: "flex", gap: 16, marginBottom: 12 }}>
        <input placeholder="Firma"
          value={filtre.firma}
          onChange={e => setFiltre(f => ({ ...f, firma: e.target.value }))}
          style={{ padding: 7, borderRadius: 6, border: "1px solid #bbc" }} />
        <select value={filtre.durum} onChange={e => setFiltre(f => ({ ...f, durum: e.target.value }))}
          style={{ padding: 7, borderRadius: 6, border: "1px solid #bbc" }}>
          <option value="">Tüm Durumlar</option>
          <option value="Bekliyor">Bekliyor</option>
          <option value="Onaylandı">Onaylandı</option>
          <option value="İptal">İptal</option>
        </select>
        <button onClick={fetchSiparisler} style={{ marginLeft: 10, padding: "7px 18px", borderRadius: 6, background: "#00b7b7", color: "#fff", border: "none", fontWeight: 700 }}>Filtrele</button>
      </div>
      {loading ? (
        <div style={{ padding: 30, fontWeight: 700, color: "#156176" }}>Siparişler yükleniyor...</div>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ border: "1px solid #eee", padding: 8 }}>Sipariş No</th>
              <th style={{ border: "1px solid #eee", padding: 8 }}>Tedarikçi</th>
              <th style={{ border: "1px solid #eee", padding: 8 }}>Toplam Tutar</th>
              <th style={{ border: "1px solid #eee", padding: 8 }}>Durum</th>
              <th style={{ border: "1px solid #eee", padding: 8 }}>Oluşturan</th>
              <th style={{ border: "1px solid #eee", padding: 8 }}>Tarih</th>
              <th style={{ border: "1px solid #eee", padding: 8 }}>QR</th>
              <th style={{ border: "1px solid #eee", padding: 8 }}>Barkod</th>
            </tr>
          </thead>
          <tbody>
            {siparisler.map(siparis => (
              <tr key={siparis.id}>
                <td style={{ border: "1px solid #eee", padding: 8 }}>{siparis.siparis_no}</td>
                <td style={{ border: "1px solid #eee", padding: 8 }}>{siparis.tedarikci_adi}</td>
                <td style={{ border: "1px solid #eee", padding: 8 }}>{(siparis.toplam_tutar || 0).toLocaleString("tr-TR", { maximumFractionDigits: 2 })}</td>
                <td style={{ border: "1px solid #eee", padding: 8 }}>{siparis.durum}</td>
                <td style={{ border: "1px solid #eee", padding: 8 }}>{siparis.olusturan_adi}</td>
                <td style={{ border: "1px solid #eee", padding: 8 }}>{siparis.created_at && siparis.created_at.split("T")[0]}</td>
                <td style={{ border: "1px solid #eee", padding: 8 }}>
                  {siparis.siparis_no && <QRCodeCanvas value={siparis.siparis_no} size={32} />}
                </td>
                <td style={{ border: "1px solid #eee", padding: 8 }}>
                  {siparis.siparis_no && (
                    <img src={`https://barcode.tec-it.com/barcode.ashx?data=${encodeURIComponent(siparis.siparis_no)}&code=Code128&dpi=96`} alt="Barkod" style={{ height: 34 }} />
                  )}
                </td>
              </tr>
            ))}
            {siparisler.length === 0 && (
              <tr>
                <td colSpan={8} style={{ textAlign: "center", color: "#aaa", padding: 18 }}>Kayıt bulunamadı</td>
              </tr>
            )}
          </tbody>
        </table>
      )}
      {showTedarikciPopup && (
        <div style={{
          position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", background: "rgba(0,0,0,0.28)", zIndex: 1001,
          display: "flex", alignItems: "center", justifyContent: "center"
        }}>
          <div style={{ background: "#fff", borderRadius: 12, padding: 28, minWidth: 320, boxShadow: "0 2px 18px #0003" }}>
            <h3>Yeni Tedarikçi Ekle</h3>
            <input placeholder="Adı *" style={{ width: "100%", marginBottom: 8 }} value={yeniTedarikci.adi} onChange={e => setYeniTedarikci(y => ({ ...y, adi: e.target.value }))} />
            <input placeholder="Email" style={{ width: "100%", marginBottom: 8 }} value={yeniTedarikci.email} onChange={e => setYeniTedarikci(y => ({ ...y, email: e.target.value }))} />
            <input placeholder="Telefon" style={{ width: "100%", marginBottom: 8 }} value={yeniTedarikci.telefon} onChange={e => setYeniTedarikci(y => ({ ...y, telefon: e.target.value }))} />
            <input placeholder="Adres" style={{ width: "100%", marginBottom: 8 }} value={yeniTedarikci.adres} onChange={e => setYeniTedarikci(y => ({ ...y, adres: e.target.value }))} />
            <input placeholder="Vergi No" style={{ width: "100%", marginBottom: 8 }} value={yeniTedarikci.vergi_no} onChange={e => setYeniTedarikci(y => ({ ...y, vergi_no: e.target.value }))} />
            <div style={{ textAlign: "right", marginTop: 10 }}>
              <button
                onClick={() => setShowTedarikciPopup(false)}
                style={{ marginRight: 14, padding: "8px 20px", borderRadius: 7, border: "none" }}>
                Vazgeç
              </button>
              <button
                onClick={handleTedarikciEkle}
                style={{ background: "#00b7b7", color: "#fff", border: "none", borderRadius: 7, padding: "8px 20px" }}>
                Kaydet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}