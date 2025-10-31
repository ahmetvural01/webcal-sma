import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:3001/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('AUTH_TOKEN');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 errors (token expired) by redirecting to login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('AUTH_TOKEN');
      localStorage.removeItem('CURRENT_USER');
      localStorage.removeItem('IS_ROOT_ADMIN');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const login = async (username, password) => {
  const response = await api.post('/auth/login', { username, password });
  if (response.data.token) {
    localStorage.setItem('AUTH_TOKEN', response.data.token);
  }
  return response.data;
};

export const logout = () => {
  localStorage.removeItem('AUTH_TOKEN');
  localStorage.removeItem('CURRENT_USER');
  localStorage.removeItem('IS_ROOT_ADMIN');
};

// Roles API
export const getRoles = async () => {
  const response = await api.get('/roles');
  return response.data;
};

export const createRole = async (roleData) => {
  const response = await api.post('/roles', roleData);
  return response.data;
};

export const updateRole = async (id, roleData) => {
  const response = await api.put(`/roles/${id}`, roleData);
  return response.data;
};

export const deleteRole = async (id) => {
  const response = await api.delete(`/roles/${id}`);
  return response.data;
};

// Kullanicilar API
export const getKullanicilar = async () => {
  const response = await api.get('/kullanicilar');
  return response.data;
};

export const createKullanici = async (userData) => {
  const response = await api.post('/kullanicilar', userData);
  return response.data;
};

export const updateKullanici = async (id, userData) => {
  const response = await api.put(`/kullanicilar/${id}`, userData);
  return response.data;
};

export const deleteKullanici = async (id) => {
  const response = await api.delete(`/kullanicilar/${id}`);
  return response.data;
};

// Olculler API
export const getOlculler = async () => {
  const response = await api.get('/olculler');
  return response.data;
};

export const createOlcu = async (olcuData) => {
  const response = await api.post('/olculler', olcuData);
  return response.data;
};

export const updateOlcu = async (id, olcuData) => {
  const response = await api.put(`/olculler/${id}`, olcuData);
  return response.data;
};

export const deleteOlcu = async (id) => {
  const response = await api.delete(`/olculler/${id}`);
  return response.data;
};

// Stok API
export const getStokHareketleri = async () => {
  const response = await api.get('/stok/hareketler');
  return response.data;
};

export const createStokHareket = async (hareketData) => {
  const response = await api.post('/stok/hareketler', hareketData);
  return response.data;
};

export const updateStokHareket = async (id, hareketData) => {
  const response = await api.put(`/stok/hareketler/${id}`, hareketData);
  return response.data;
};

export const deleteStokHareket = async (id) => {
  const response = await api.delete(`/stok/hareketler/${id}`);
  return response.data;
};

export const deleteStokHareketlerByProduct = async (urun_kodu) => {
  const response = await api.delete(`/stok/hareketler/by-product/${urun_kodu}`);
  return response.data;
};

export const updateStokProduct = async (old_urun_kodu, new_urun_kodu, new_urun_aciklama) => {
  const response = await api.put('/stok/hareketler/update-product', {
    old_urun_kodu,
    new_urun_kodu,
    new_urun_aciklama
  });
  return response.data;
};

export const getStokAltLimitler = async () => {
  const response = await api.get('/stok/alt-limitler');
  return response.data;
};

export const upsertStokAltLimit = async (urun_kodu, alt_limit) => {
  const response = await api.post('/stok/alt-limitler', { urun_kodu, alt_limit });
  return response.data;
};

export const deleteStokAltLimit = async (urun_kodu) => {
  const response = await api.delete(`/stok/alt-limitler/${urun_kodu}`);
  return response.data;
};

// Siparisler API
export const getSiparisler = async (filters = {}) => {
  const response = await api.get('/siparisler', { params: filters });
  return response.data;
};

export const createSiparis = async (siparisData) => {
  const response = await api.post('/siparisler', siparisData);
  return response.data;
};

export const updateSiparis = async (id, siparisData) => {
  const response = await api.put(`/siparisler/${id}`, siparisData);
  return response.data;
};

export const deleteSiparis = async (id) => {
  const response = await api.delete(`/siparisler/${id}`);
  return response.data;
};

// Tedarikciler API
export const getTedarikciler = async () => {
  const response = await api.get('/tedarikciler');
  return response.data;
};

export const createTedarikci = async (tedarikciData) => {
  const response = await api.post('/tedarikciler', tedarikciData);
  return response.data;
};

export const updateTedarikci = async (id, tedarikciData) => {
  const response = await api.put(`/tedarikciler/${id}`, tedarikciData);
  return response.data;
};

export const deleteTedarikci = async (id) => {
  const response = await api.delete(`/tedarikciler/${id}`);
  return response.data;
};

export default api;
