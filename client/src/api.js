import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('AUTH_TOKEN');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle responses and errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('AUTH_TOKEN');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

// Auth APIs
export const login = async (username, password) => {
  const response = await api.post('/auth/login', { username, password });
  return response.data;
};

// Roles APIs
export const getRoles = async () => {
  const response = await api.get('/roles');
  return response.data;
};

// Kullanicilar APIs
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

// Olculler APIs
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

// Siparisler APIs
export const getSiparisler = async (filters = {}) => {
  const response = await api.get('/siparisler', { params: filters });
  return response.data;
};

export const getLastSiparisNumber = async () => {
  const response = await api.get('/siparisler/last-number');
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

// Tedarikciler APIs
export const getTedarikciler = async () => {
  const response = await api.get('/tedarikciler');
  return response.data;
};

export const createTedarikci = async (tedarikciData) => {
  const response = await api.post('/tedarikciler', tedarikciData);
  return response.data;
};

// Stok APIs
export const getStokKayitlari = async () => {
  const response = await api.get('/stok');
  return response.data;
};

export const getStokLimits = async () => {
  const response = await api.get('/stok/limits');
  return response.data;
};

export const createStokEntry = async (stokData) => {
  const response = await api.post('/stok', stokData);
  return response.data;
};

export const setStokLimit = async (limitData) => {
  const response = await api.post('/stok/limits', limitData);
  return response.data;
};

export const deleteStokEntry = async (id) => {
  const response = await api.delete(`/stok/${id}`);
  return response.data;
};

export default api;
