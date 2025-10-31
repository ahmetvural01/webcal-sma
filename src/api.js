import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('CURRENT_USER');
      localStorage.removeItem('IS_ROOT_ADMIN');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: async (username, password) => {
    const response = await api.post('/auth/login', { username, password });
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
    }
    return response.data;
  }
};

// Roles API
export const rolesAPI = {
  getAll: async () => {
    const response = await api.get('/roles');
    return response.data;
  },
  create: async (role) => {
    const response = await api.post('/roles', role);
    return response.data;
  },
  update: async (name, role) => {
    const response = await api.put(`/roles/${name}`, role);
    return response.data;
  },
  delete: async (name) => {
    const response = await api.delete(`/roles/${name}`);
    return response.data;
  }
};

// Users API
export const kullanicilarAPI = {
  getAll: async () => {
    const response = await api.get('/kullanicilar');
    return response.data;
  },
  getOne: async (id) => {
    const response = await api.get(`/kullanicilar/${id}`);
    return response.data;
  },
  create: async (user) => {
    const response = await api.post('/kullanicilar', user);
    return response.data;
  },
  update: async (id, user) => {
    const response = await api.put(`/kullanicilar/${id}`, user);
    return response.data;
  },
  delete: async (id) => {
    const response = await api.delete(`/kullanicilar/${id}`);
    return response.data;
  }
};

// Measurements API
export const olcullerAPI = {
  getAll: async () => {
    const response = await api.get('/olculler');
    return response.data;
  },
  getOne: async (id) => {
    const response = await api.get(`/olculler/${id}`);
    return response.data;
  },
  create: async (measurement) => {
    const response = await api.post('/olculler', measurement);
    return response.data;
  },
  update: async (id, measurement) => {
    const response = await api.put(`/olculler/${id}`, measurement);
    return response.data;
  },
  delete: async (id) => {
    const response = await api.delete(`/olculler/${id}`);
    return response.data;
  }
};

// Stock movements API
export const stokHareketleriAPI = {
  getAll: async () => {
    const response = await api.get('/stok_hareketleri');
    return response.data;
  },
  getByProduct: async (kod) => {
    const response = await api.get(`/stok_hareketleri/product/${kod}`);
    return response.data;
  },
  create: async (movement) => {
    const response = await api.post('/stok_hareketleri', movement);
    return response.data;
  },
  update: async (id, movement) => {
    const response = await api.put(`/stok_hareketleri/${id}`, movement);
    return response.data;
  },
  delete: async (id) => {
    const response = await api.delete(`/stok_hareketleri/${id}`);
    return response.data;
  }
};

// Stock limits API
export const stokAltLimitlerAPI = {
  getAll: async () => {
    const response = await api.get('/stok_alt_limitler');
    return response.data;
  },
  getByCode: async (kod) => {
    const response = await api.get(`/stok_alt_limitler/${kod}`);
    return response.data;
  },
  upsert: async (limit) => {
    const response = await api.post('/stok_alt_limitler', limit);
    return response.data;
  },
  update: async (kod, limit) => {
    const response = await api.put(`/stok_alt_limitler/${kod}`, limit);
    return response.data;
  },
  delete: async (kod) => {
    const response = await api.delete(`/stok_alt_limitler/${kod}`);
    return response.data;
  }
};

// Suppliers API
export const tedarikcilerAPI = {
  getAll: async () => {
    const response = await api.get('/tedarikciler');
    return response.data;
  },
  getOne: async (id) => {
    const response = await api.get(`/tedarikciler/${id}`);
    return response.data;
  },
  create: async (supplier) => {
    const response = await api.post('/tedarikciler', supplier);
    return response.data;
  },
  update: async (id, supplier) => {
    const response = await api.put(`/tedarikciler/${id}`, supplier);
    return response.data;
  },
  delete: async (id) => {
    const response = await api.delete(`/tedarikciler/${id}`);
    return response.data;
  }
};

// Orders API
export const siparislerAPI = {
  getAll: async (filters = {}) => {
    const params = new URLSearchParams(filters).toString();
    const response = await api.get(`/siparisler${params ? `?${params}` : ''}`);
    return response.data;
  },
  getOne: async (id) => {
    const response = await api.get(`/siparisler/${id}`);
    return response.data;
  },
  create: async (order) => {
    const response = await api.post('/siparisler', order);
    return response.data;
  },
  update: async (id, order) => {
    const response = await api.put(`/siparisler/${id}`, order);
    return response.data;
  },
  delete: async (id) => {
    const response = await api.delete(`/siparisler/${id}`);
    return response.data;
  }
};

// Order products API
export const siparisUrunleriAPI = {
  getAll: async (filters = {}) => {
    const params = new URLSearchParams(filters).toString();
    const response = await api.get(`/siparis_urunleri${params ? `?${params}` : ''}`);
    return response.data;
  },
  getByOrder: async (siparis_id) => {
    const response = await api.get(`/siparis_urunleri/order/${siparis_id}`);
    return response.data;
  },
  create: async (product) => {
    const response = await api.post('/siparis_urunleri', product);
    return response.data;
  },
  update: async (id, product) => {
    const response = await api.put(`/siparis_urunleri/${id}`, product);
    return response.data;
  },
  delete: async (id) => {
    const response = await api.delete(`/siparis_urunleri/${id}`);
    return response.data;
  }
};

// Order logs API
export const siparisLogAPI = {
  getAll: async (filters = {}) => {
    const params = new URLSearchParams(filters).toString();
    const response = await api.get(`/siparis_log${params ? `?${params}` : ''}`);
    return response.data;
  },
  getByOrder: async (siparis_id) => {
    const response = await api.get(`/siparis_log/order/${siparis_id}`);
    return response.data;
  },
  create: async (log) => {
    const response = await api.post('/siparis_log', log);
    return response.data;
  },
  delete: async (id) => {
    const response = await api.delete(`/siparis_log/${id}`);
    return response.data;
  }
};

export default api;
