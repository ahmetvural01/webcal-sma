import React, { useRef, useState, useEffect } from "react";
import {
  Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, 
  Typography, Paper, Tooltip, Pagination, InputAdornment, Snackbar, Alert,
  LinearProgress, FormControl, InputLabel, Select, MenuItem
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import AddIcon from "@mui/icons-material/Add";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import ClearAllIcon from "@mui/icons-material/ClearAll";
import SearchIcon from "@mui/icons-material/Search";
import FilterListIcon from "@mui/icons-material/FilterList";
import SaveIcon from "@mui/icons-material/Save";
import PrintIcon from '@mui/icons-material/Print';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import * as XLSX from 'xlsx';
import { supabase } from './supabaseClient';

const DRAWING_SRC = "/olcu_cizim.png";
const KOLONLAR = [
  { key: "marka", label: "MARKA", width: "10%", type: "text" },
  { key: "model", label: "MODEL", width: "10%", type: "text" },
  { key: "a", label: "A", width: "6%", type: "number" }, 
  { key: "b", label: "B", width: "6%", type: "number" }, 
  { key: "c", label: "C", width: "6%", type: "number" }, 
  { key: "j", label: "J", width: "6%", type: "number" },
  { key: "k", label: "K", width: "6%", type: "number" }, 
  { key: "l", label: "L", width: "6%", type: "number" }, 
  { key: "m", label: "M", width: "6%", type: "number" }, 
  { key: "d", label: "D", width: "6%", type: "number" },
  { key: "e", label: "E", width: "6%", type: "number" }, 
  { key: "f", label: "F", width: "6%", type: "number" }, 
  { key: "g", label: "G", width: "6%", type: "number" }, 
  { key: "h", label: "H", width: "6%", type: "number" }
];

function emptyOlcu() {
  const row = {};
  KOLONLAR.forEach(col => row[col.key] = "");
  return row;
}

export default function OlcullerForm() {
  const [olculler, setOlculler] = useState([]);
  const [filtre, setFiltre] = useState({});
  const [globalFiltre, setGlobalFiltre] = useState("");
  const [sortCol, setSortCol] = useState("marka");
  const [sortDir, setSortDir] = useState("asc");
  const [dialog, setDialog] = useState({ open: false, mode: "new", row: emptyOlcu(), index: null });
  const [detay, setDetay] = useState({ open: false, row: emptyOlcu() });
  const [selectedRow, setSelectedRow] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const [loading, setLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const yeniInputRefs = useRef([]);

  useEffect(() => { fetchOlculler(); }, []);

  async function fetchOlculler() {
    setLoading(true);
    const { data, error } = await supabase.from("olculler").select("*").order("id", { ascending: true });
    if (!error) setOlculler(data || []);
    setLoading(false);
  }

  function filterRows(row) {
    if (globalFiltre) {
      const lowerGlobal = globalFiltre.toLowerCase();
      const hasMatch = Object.values(row).some(val =>
        val && val.toString().toLowerCase().includes(lowerGlobal)
      );
      if (!hasMatch) return false;
    }
    return KOLONLAR.every(col => {
      const filterValue = filtre[col.key];
      if (!filterValue) return true;
      const rowValue = row[col.key];
      if (rowValue === undefined || rowValue === null) return false;
      return rowValue.toString().toLowerCase().includes(filterValue.toLowerCase());
    });
  }

  function sortRows(a, b) {
    const aVal = a[sortCol];
    const bVal = b[sortCol];
    if (aVal === undefined || bVal === undefined) return 0;
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return sortDir === "asc" ? aVal - bVal : bVal - aVal;
    }
    const aStr = (aVal ?? "").toString();
    const bStr = (bVal ?? "").toString();
    return sortDir === "asc"
      ? aStr.localeCompare(bStr, undefined, { numeric: true })
      : bStr.localeCompare(aStr, undefined, { numeric: true });
  }

  function handleDialogOpen(mode, row = emptyOlcu(), index = null) {
    setDialog({ open: true, mode, row: { ...row }, index });
    setTimeout(() => {
      if (yeniInputRefs.current[0]) yeniInputRefs.current[0].focus();
    }, 200);
  }

  function handleDialogClose() {
    setDialog({ open: false, mode: "new", row: emptyOlcu(), index: null });
  }

  function handleDialogChange(e, i) {
    let value = e.target.value;
    const col = KOLONLAR[i];
    if (col && col.type === "number") {
      value = value === "" ? "" : Number(value);
    }
    setDialog(d => ({
      ...d,
      row: { ...d.row, [e.target.name]: value }
    }));
    if (e.key === "Enter" && yeniInputRefs.current[i + 1]) {
      yeniInputRefs.current[i + 1].focus();
    }
  }

  async function handleDialogSave() {
    if (!dialog.row.marka || !dialog.row.model) {
      showSnackbar("Lütfen MARKA ve MODEL giriniz!", "error");
      return;
    }
    setLoading(true);
    const yeniKayit = {};
    KOLONLAR.forEach(col => {
      let val = dialog.row[col.key];
      if (col.type === "number") {
        const num = Number(val);
        yeniKayit[col.key] = isNaN(num) ? null : num;
      } else {
        yeniKayit[col.key] = val;
      }
    });

    if (dialog.mode === "edit" && dialog.row.id) {
      const { error } = await supabase
        .from("olculler")
        .update(yeniKayit)
        .eq("id", dialog.row.id);
      if (!error) {
        showSnackbar("Ölçü başarıyla güncellendi!", "success");
        fetchOlculler();
        handleDialogClose();
      } else {
        console.log("Supabase güncelleme hatası:", error);
        showSnackbar("Güncelleme hatası!", "error");
      }
    } else {
      const kayit = { 
        ...yeniKayit,
        created_at: new Date().toISOString()
      };
      const { error } = await supabase
        .from("olculler")
        .insert([kayit]);
      if (!error) {
        showSnackbar("Yeni ölçü başarıyla eklendi!", "success");
        fetchOlculler();
        handleDialogClose();
      } else {
        console.log("Supabase ekleme hatası:", error);
        showSnackbar("Ekleme hatası!", "error");
      }
    }
    setLoading(false);
  }

  async function handleDelete(index) {
    const row = olculler[index];
    if (!row || !row.id) return;
    setLoading(true);
    const { error } = await supabase
      .from("olculler")
      .delete()
      .eq("id", row.id);
    if (!error) {
      showSnackbar("Ölçü başarıyla silindi!", "info");
      fetchOlculler();
      handleDialogClose();
      if (selectedRow === index) setSelectedRow(null);
    } else {
      console.log("Supabase silme hatası:", error);
      showSnackbar("Silme hatası!", "error");
    }
    setLoading(false);
  }

  function handleFiltreChange(e) {
    setFiltre(f => ({ ...f, [e.target.name]: e.target.value }));
  }

  function handleTemizle() {
    setFiltre({});
    setGlobalFiltre("");
  }

  function handleRowSelect(idx) {
    setSelectedRow(idx === selectedRow ? null : idx);
  }

  function showSnackbar(message, severity) {
    setSnackbar({ open: true, message, severity });
  }

  function handleCloseSnackbar() {
    setSnackbar({ ...snackbar, open: false });
  }

  async function handleExportPDF(row) {
    setPdfLoading(true);
    const pdfRow = row || (selectedRow != null ? olculler[selectedRow] : null);
    if (!pdfRow) {
      showSnackbar("PDF oluşturmak için bir ölçü seçiniz!", "warning");
      setPdfLoading(false);
      return;
    }
    try {
      const teknikResimUrl = window.location.origin + DRAWING_SRC;
      const printContents = `
        <div style="width:100vw;max-width:1300px;margin:0 auto;padding:0;">
          <div style="font-size:28px;font-weight:bold;color:#156176;text-align:center;margin-bottom:20px;">
            ${pdfRow.marka} ${pdfRow.model} Teknik Ölçüler
          </div>
          <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;">
            <img src="${teknikResimUrl}" style="height:450px;max-width:750px;object-fit:contain;display:block;margin:0 auto 30px auto;" alt="teknik"/>
            <table style="border-collapse:collapse;font-size:18px;min-width:800px;margin-top:10px;margin-left:auto;margin-right:auto;">
              <thead>
                <tr>
                  ${KOLONLAR.map(col => `<th style="border:2px solid #bce0ff;padding:10px 12px;color:#156176;background:#e8f3ff;font-size:16px;">${col.label}</th>`).join("")}
                </tr>
              </thead>
              <tbody>
                <tr>
                  ${KOLONLAR.map(col => `<td style="border:2px solid #bce0ff;padding:10px 12px;color:#156176;text-align:center;background:#fff;font-size:16px;">${pdfRow[col.key]}</td>`).join("")}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <style>
          @media print {
            @page { size: A4 landscape; margin: 1.2cm; }
            body { margin:0; padding:0; }
          }
        </style>
      `;
      const win = window.open("", "_blank");
      win.document.write(`
        <html>
          <head>
            <title>${pdfRow.marka} ${pdfRow.model} Teknik Ölçüler</title>
            <meta charset="utf-8"/>
          </head>
          <body style="margin:0;padding:0;">${printContents}</body>
        </html>
      `);
      setTimeout(() => {
        win.print();
        win.close();
        setPdfLoading(false);
        showSnackbar("PDF başarıyla oluşturuldu!", "success");
      }, 350);
    } catch (error) {
      setPdfLoading(false);
      showSnackbar("PDF oluşturulurken hata oluştu!", "error");
    }
  }

  function exportToExcel() {
    if (olculler.length === 0) {
      showSnackbar("Excel'e aktarılacak veri bulunamadı!", "warning");
      return;
    }
    const worksheet = XLSX.utils.json_to_sheet(olculler);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Ölçüler");
    XLSX.writeFile(workbook, "olculler.xlsx");
    showSnackbar("Excel dosyası başarıyla indirildi!", "success");
  }

  function printTable() {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Ölçüler Tablosu</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #156176; text-align: center; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: center; }
            th { background-color: #00b7b7; color: white; }
            tr:nth-child(even) { background-color: #f2f2f2; }
            .header { text-align: center; margin-bottom: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>ÖLÇÜLER TABLOSU</h1>
            <p>Oluşturulma Tarihi: ${new Date().toLocaleDateString()}</p>
          </div>
          <table>
            <thead>
              <tr>
                ${KOLONLAR.map(col => `<th>${col.label}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${olculler.map(row => `
                <tr>
                  ${KOLONLAR.map(col => `<td>${row[col.key]}</td>`).join('')}
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  }

  const filteredSortedRows = olculler.filter(filterRows).sort(sortRows);
  const pageCount = Math.ceil(filteredSortedRows.length / rowsPerPage);
  const paginatedRows = filteredSortedRows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Box sx={{
      bgcolor: "#f5f9ff",
      minHeight: "100vh",
      width: "100%",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      py: 4,
      background: "linear-gradient(135deg, #f5f9ff 0%, #e8f3ff 100%)",
    }}>
      {loading && <LinearProgress sx={{ width: '100%', position: 'fixed', top: 0, left: 0 }} />}

      <Box sx={{
        bgcolor: "#ffffff",
        borderRadius: 4,
        boxShadow: "0 8px 24px rgba(21, 97, 118, 0.12)",
        p: { xs: 2, md: 4 },
        width: "100%",
        maxWidth: "1380px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        position: "relative",
        overflow: "hidden",
        "&:before": {
          content: '""',
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "6px",
          background: "linear-gradient(90deg, #00b7b7, #156176)",
        }
      }}>
        {/* Başlık */}
        <Box sx={{ 
          display: "flex", alignItems: "center", justifyContent: "center", width: "100%", mb: 3, p: 2,
          bgcolor: "#f0f8ff", borderRadius: 3, boxShadow: "0 2px 8px rgba(21, 97, 118, 0.08)"
        }}>
          <Typography variant="h4" sx={{ 
            fontWeight: 800, letterSpacing: "-0.5px", background: "linear-gradient(90deg, #156176, #00b7b7)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", fontSize: { xs: "1.8rem", md: "2.2rem" }
          }}>
            ÖLÇÜLER YÖNETİM PANELİ
          </Typography>
        </Box>
        {/* Teknik Çizim */}
        <Box sx={{
          width: "100%", display: "flex", flexDirection: "column", alignItems: "center", mb: 3, p: 3,
          bgcolor: "#f8fcff", borderRadius: 3, border: "1px solid #d0e9ff"
        }}>
          <Typography variant="h6" sx={{ 
            color: "#156176", fontWeight: 700, mb: 2, textAlign: "center", display: "flex", alignItems: "center", gap: 1, fontSize: "1.4rem"
          }}>
            <FilterListIcon /> TEKNİK ÇİZİM
          </Typography>
          <img src={DRAWING_SRC} alt="Teknik çizim"
            style={{
              width: "560px", maxWidth: "95%", height: "auto", objectFit: "contain",
              margin: "0 auto", display: "block", border: "1px solid #bce0ff",
              borderRadius: 8, boxShadow: "0 4px 12px rgba(21, 97, 118, 0.1)"
            }}
          />
        </Box>
        {/* Kontroller */}
        <Box sx={{
          display: "flex", alignItems: "center", gap: 2, width: "100%", justifyContent: "space-between", mb: 3, flexWrap: "wrap"
        }}>
          <Box sx={{ display: "flex", gap: 2, alignItems: "center", flexWrap: "wrap" }}>
            <Typography variant="h6" sx={{ 
              color: "#156176", fontWeight: "bold", fontSize: "1.3rem",
              display: "flex", alignItems: "center", gap: 1
            }}>
              <FilterListIcon /> ÖLÇÜLER
            </Typography>
            <TextField
              variant="outlined"
              size="small"
              placeholder="Tüm alanlarda ara..."
              value={globalFiltre}
              onChange={(e) => setGlobalFiltre(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: "#156176" }} />
                  </InputAdornment>
                ),
                sx: { borderRadius: 2, bgcolor: "#ffffff", boxShadow: "0 2px 6px rgba(21, 97, 118, 0.08)", width: 280 }
              }}
            />
          </Box>
          <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
            <Button
              color="primary"
              variant="contained"
              sx={{ fontWeight: 600, borderRadius: 2, boxShadow: "0 4px 8px rgba(21, 97, 118, 0.2)", "&:hover": { boxShadow: "0 6px 12px rgba(21, 97, 118, 0.3)" } }}
              startIcon={<PictureAsPdfIcon />}
              onClick={() => handleExportPDF()}
              disabled={selectedRow == null || pdfLoading}
            >
              {pdfLoading ? "PDF HAZIRLANIYOR..." : "PDF OLUŞTUR"}
            </Button>
            <Button
              color="primary"
              variant="outlined"
              startIcon={<FileDownloadIcon />}
              onClick={exportToExcel}
              sx={{ fontWeight: 600, borderRadius: 2 }}
            >
              EXCEL
            </Button>
            <Button
              color="primary"
              variant="outlined"
              startIcon={<PrintIcon />}
              onClick={printTable}
              sx={{ fontWeight: 600, borderRadius: 2 }}
            >
              YAZDIR
            </Button>
            <Button
              color="secondary"
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleDialogOpen("new")}
              sx={{ fontWeight: 600, borderRadius: 2, boxShadow: "0 4px 8px rgba(21, 97, 118, 0.2)", "&:hover": { boxShadow: "0 6px 12px rgba(21, 97, 118, 0.3)" } }}
            >
              YENİ ÖLÇÜ
            </Button>
          </Box>
        </Box>
        {/* Tablo */}
        <TableContainer component={Paper} sx={{
          borderRadius: 3, boxShadow: "0 6px 16px rgba(21, 97, 118, 0.12)", border: "1px solid #d0e9ff",
          width: "100%", maxWidth: "1250px", mx: "auto", mb: 2, overflow: "hidden", position: "relative"
        }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                {KOLONLAR.map((col, i) => (
                  <TableCell
                    key={col.key}
                    sx={{
                      background: "linear-gradient(#00b7b7, #009999)", color: "#fff", fontWeight: 900, cursor: "pointer",
                      position: "relative", fontSize: "15px", padding: "2px 6px", width: col.width,
                      borderRight: "1px solid rgba(255,255,255,0.2)",
                      "&:last-child": { borderRight: "none" },
                      transition: "all 0.2s",
                      "&:hover": { background: "linear-gradient(#00c7c7, #00a5a5)" }
                    }}
                    onClick={() => {
                      if (sortCol === col.key) setSortDir(sortDir === "asc" ? "desc" : "asc");
                      else {
                        setSortCol(col.key);
                        setSortDir("asc");
                      }
                    }}
                    align="center"
                  >
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {col.label} 
                      {sortCol === col.key && (
                        <Box component="span" sx={{ ml: 0.5 }}>
                          {sortDir === "asc" ? "▲" : "▼"}
                        </Box>
                      )}
                    </Box>
                    <TextField
                      name={col.key}
                      value={filtre[col.key] || ""}
                      onChange={handleFiltreChange}
                      size="small"
                      variant="outlined"
                      placeholder={col.label}
                      sx={{
                        mt: 0.5, bgcolor: "#e8f7fa", borderRadius: 1, width: "100%",
                        input: { fontSize: 13, textAlign: "center", p: "6px 8px", height: "28px", boxSizing: "border-box" },
                        "& .MuiOutlinedInput-root": {
                          "& fieldset": { borderColor: "rgba(21, 97, 118, 0.3)" },
                          "&:hover fieldset": { borderColor: "rgba(21, 97, 118, 0.5)" },
                          "&.Mui-focused fieldset": { borderColor: "#156176", borderWidth: 1 }
                        }
                      }}
                      onClick={e => e.stopPropagation()}
                    />
                  </TableCell>
                ))}
                <TableCell sx={{ 
                  background: "linear-gradient(#00b7b7, #009999)", minWidth: 78, padding: "2px 5px",
                  borderLeft: "1px solid rgba(255,255,255,0.2)"
                }}>
                  <Button
                    size="small"
                    color="inherit"
                    startIcon={<ClearAllIcon />}
                    onClick={handleTemizle}
                    sx={{
                      fontWeight: "bold", py: 0.5, px: 1, minWidth: 42, fontSize: 12, bgcolor: "#fff", color: "#00b7b7",
                      borderRadius: 1, "&:hover": { bgcolor: "#e8f7fa" }
                    }}
                  >
                    Temizle
                  </Button>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedRows.map((row, idx) => {
                const absoluteIdx = page * rowsPerPage + idx;
                return (
                  <TableRow
                    key={row.id}
                    hover
                    selected={selectedRow === absoluteIdx}
                    sx={{
                      cursor: "pointer", transition: "0.2s", fontSize: "15px",
                      height: 42,
                      "&:hover": { bgcolor: selectedRow === absoluteIdx ? "#e0f7ff" : "#f8fdff" },
                      "&.Mui-selected": { bgcolor: "#e0f7ff", "&:hover": { bgcolor: "#d0f0ff" } }
                    }}
                    onClick={() => handleRowSelect(absoluteIdx)}
                  >
                    {KOLONLAR.map(col => (
                      <TableCell
                        key={col.key}
                        sx={{
                          textAlign: "center", fontWeight: 600, color: "#156176",
                          background: absoluteIdx % 2 === 0 ? "#f8fdff" : "#ffffff",
                          fontSize: "15px", padding: "6px 8px",
                          borderRight: "1px solid rgba(21, 97, 118, 0.08)",
                          "&:last-child": { borderRight: "none" }
                        }}
                      >
                        {row[col.key]}
                      </TableCell>
                    ))}
                    <TableCell align="center" sx={{ 
                      minWidth: 78, padding: "2px 5px",
                      background: absoluteIdx % 2 === 0 ? "#f8fdff" : "#ffffff",
                    }}>
                      <Box sx={{ display: "flex", justifyContent: "center", gap: 0.5 }}>
                        <Tooltip title="Detay">
                          <IconButton 
                            color="info" 
                            onClick={e => { e.stopPropagation(); setDetay({ open: true, row }); }}
                            sx={{ bgcolor: "#e8f7fa", "&:hover": { bgcolor: "#d0edf5" } }}
                          >
                            <InfoOutlinedIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Düzenle">
                          <IconButton 
                            color="primary" 
                            onClick={e => { e.stopPropagation(); handleDialogOpen("edit", row, absoluteIdx); }}
                            sx={{ bgcolor: "#e8f7fa", "&:hover": { bgcolor: "#d0edf5" } }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })}
              {paginatedRows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={KOLONLAR.length + 1} align="center" sx={{ 
                    color: "#156176", height: 100, fontSize: "1.1rem", fontWeight: 500
                  }}>
                    {globalFiltre || Object.values(filtre).some(Boolean) 
                      ? "Filtreleme kriterlerinize uygun kayıt bulunamadı." 
                      : "Henüz kayıt eklenmemiş. Yeni ölçü eklemek için 'YENİ ÖLÇÜ' butonuna tıklayın."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        {/* Pagination ve Bilgi */}
        <Box sx={{ 
          display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", mt: 1, px: 2
        }}>
          <Typography variant="body2" sx={{ color: "#156176", fontWeight: 500 }}>
            Toplam {filteredSortedRows.length} kayıt
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <FormControl size="small" sx={{ minWidth: 100 }}>
              <InputLabel>Sayfa Boyutu</InputLabel>
              <Select
                value={rowsPerPage}
                onChange={(e) => {
                  setRowsPerPage(e.target.value);
                  setPage(0);
                }}
                label="Sayfa Boyutu"
              >
                <MenuItem value={5}>5</MenuItem>
                <MenuItem value={10}>10</MenuItem>
                <MenuItem value={25}>25</MenuItem>
                <MenuItem value={50}>50</MenuItem>
              </Select>
            </FormControl>
            <Pagination
              count={pageCount}
              page={page + 1}
              onChange={(e, page) => setPage(page - 1)}
              color="primary"
              shape="rounded"
              sx={{
                "& .MuiPaginationItem-root": {
                  color: "#156176",
                  fontWeight: 600
                },
                "& .Mui-selected": {
                  background: "linear-gradient(90deg, #00b7b7, #156176)",
                  color: "#fff",
                  boxShadow: "0 2px 6px rgba(21, 97, 118, 0.3)"
                }
              }}
            />
          </Box>
        </Box>
      </Box>
      {/* Ekle/Düzenle Dialog */}
      <Dialog 
        open={dialog.open} 
        onClose={handleDialogClose} 
        maxWidth="md" 
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ 
          bgcolor: "#156176", color: "#fff", fontWeight: 700, fontSize: "1.3rem", py: 2
        }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>
              {dialog.mode === "edit" 
                ? `${dialog.row.marka} ${dialog.row.model} Düzenle` 
                : "Yeni Ölçü Ekle"}
            </span>
            {dialog.mode === "edit" && (
              <Button
                onClick={() => handleDelete(dialog.index)}
                color="error"
                startIcon={<DeleteIcon />}
                variant="contained"
                size="small"
                sx={{ bgcolor: "#ff4d4d", "&:hover": { bgcolor: "#ff3333" } }}
              >
                Sil
              </Button>
            )}
          </Box>
        </DialogTitle>
        <DialogContent sx={{ bgcolor: "#f8fcff", minWidth: 480, py: 3 }}>
          <Box sx={{
            display: "flex", flexDirection: "column", alignItems: "center", gap: 1, mb: 2
          }}>
            <img
              src={DRAWING_SRC}
              alt="Teknik çizim"
              style={{
                height: "380px", width: "auto", objectFit: "contain", background: "#fff",
                border: "1px solid #bce0ff", borderRadius: 8, boxShadow: "0 4px 12px rgba(21, 97, 118, 0.1)"
              }}
            />
          </Box>
          <Box sx={{
            display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 2, mt: 1,
          }}>
            {KOLONLAR.map((col, i) => (
              <TextField
                inputRef={el => yeniInputRefs.current[i] = el}
                key={col.key}
                name={col.key}
                label={col.label}
                value={dialog.row[col.key]}
                onChange={e => handleDialogChange(e, i)}
                onKeyDown={e => handleDialogChange(e, i)}
                sx={{
                  "& .MuiInputBase-root": { bgcolor: "#fff", borderRadius: 2, boxShadow: "0 2px 6px rgba(21, 97, 118, 0.08)" }
                }}
                required={col.key === "marka" || col.key === "model"}
                type={col.type}
                inputProps={{ style: { textAlign: "center" }, min: col.type === "number" ? 0 : undefined }}
                variant="outlined"
                size="small"
              />
            ))}
          </Box>
        </DialogContent>
        <DialogActions sx={{ justifyContent: "flex-end", px: 3, py: 2, bgcolor: "#f0f8ff", borderTop: "1px solid #d0e9ff" }}>
          <Button 
            onClick={handleDialogClose}
            variant="outlined"
            sx={{ fontWeight: 600, color: "#156176", borderColor: "#156176" }}
          >
            İptal
          </Button>
          <Button 
            variant="contained" 
            onClick={handleDialogSave}
            startIcon={<SaveIcon />}
            sx={{ fontWeight: 600, bgcolor: "#00b7b7", "&:hover": { bgcolor: "#009999" } }}
          >
            Kaydet
          </Button>
        </DialogActions>
      </Dialog>
      {/* Detay Dialog */}
      <Dialog 
        open={detay.open} 
        onClose={() => setDetay({ open: false, row: emptyOlcu() })} 
        maxWidth="md"
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ bgcolor: "#156176", color: "#fff", fontWeight: 700, fontSize: "1.3rem", py: 2 }}>
          {detay.row.marka} {detay.row.model} Detay
        </DialogTitle>
        <DialogContent sx={{ bgcolor: "#f8fcff", py: 3 }}>
          <Box sx={{
            display: "flex", flexDirection: "column", alignItems: "center", gap: 1, mb: 2
          }}>
            <img
              src={DRAWING_SRC}
              alt="Teknik çizim"
              style={{
                height: "380px", width: "auto", objectFit: "contain", background: "#fff",
                border: "1px solid #bce0ff", borderRadius: 8, boxShadow: "0 4px 12px rgba(21, 97, 118, 0.1)"
              }}
            />
          </Box>
          <Box sx={{
            display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 2, mt: 1,
          }}>
            {KOLONLAR.map(col => (
              <TextField
                key={col.key}
                label={col.label}
                value={detay.row[col.key]}
                InputProps={{ readOnly: true, style: { textAlign: "center", fontWeight: 600, color: "#156176" } }}
                variant="filled"
                size="small"
                sx={{
                  "& .MuiFilledInput-root": { bgcolor: "#e8f7fa", borderRadius: 2, "&:before": { border: "none" }, "&:hover:not(.Mui-disabled):before": { border: "none" } }
                }}
              />
            ))}
          </Box>
        </DialogContent>
        <DialogActions sx={{ justifyContent: "flex-end", px: 3, py: 2, bgcolor: "#f0f8ff", borderTop: "1px solid #d0e9ff" }}>
          <Button
            variant="contained"
            startIcon={<PictureAsPdfIcon />}
            onClick={() => handleExportPDF(detay.row)}
            disabled={pdfLoading}
            sx={{ mr: 1, bgcolor: "#ff4d4d", "&:hover": { bgcolor: "#ff3333" }, fontWeight: 600 }}
          >
            {pdfLoading ? "PDF HAZIRLANIYOR..." : "PDF OLUŞTUR"}
          </Button>
          <Button 
            onClick={() => setDetay({ open: false, row: emptyOlcu() })}
            variant="outlined"
            sx={{ fontWeight: 600, color: "#156176", borderColor: "#156176" }}
          >
            KAPAT
          </Button>
        </DialogActions>
      </Dialog>
      {/* Snackbar (Bildirim) */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity}
          sx={{ width: "100%", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", fontWeight: 500, borderRadius: 2 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}