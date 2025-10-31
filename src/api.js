import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('auth_token');
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
      localStorage.setItem('auth_token', response.data.token);
    }
    return response.data;
  },
  
  verify: async () => {
    const response = await api.get('/auth/verify');
    return response.data;
  },
  
  logout: () => {
    localStorage.removeItem('auth_token');
  }
};

// Roles API
export const rolesAPI = {
  getAll: async () => {
    const response = await api.get('/roles');
    return response.data;
  },
  
  getByName: async (name) => {
    const response = await api.get(`/roles/${name}`);
    return response.data;
  },
  
  create: async (roleData) => {
    const response = await api.post('/roles', roleData);
    return response.data;
  },
  
  update: async (id, roleData) => {
    const response = await api.put(`/roles/${id}`, roleData);
    return response.data;
  },
  
  delete: async (id) => {
    const response = await api.delete(`/roles/${id}`);
    return response.data;
  }
};

// Users API
export const usersAPI = {
  getAll: async () => {
    const response = await api.get('/kullanicilar');
    return response.data;
  },
  
  getById: async (id) => {
    const response = await api.get(`/kullanicilar/${id}`);
    return response.data;
  },
  
  getByUsername: async (username) => {
    const response = await api.get(`/kullanicilar/by-username/${username}`);
    return response.data;
  },
  
  create: async (userData) => {
    const response = await api.post('/kullanicilar', userData);
    return response.data;
  },
  
  update: async (id, userData) => {
    const response = await api.put(`/kullanicilar/${id}`, userData);
    return response.data;
  },
  
  delete: async (id) => {
    const response = await api.delete(`/kullanicilar/${id}`);
    return response.data;
  }
};

// Olculler API
export const olcullerAPI = {
  getAll: async () => {
    const response = await api.get('/olculler');
    return response.data;
  },
  
  getById: async (id) => {
    const response = await api.get(`/olculler/${id}`);
    return response.data;
  },
  
  create: async (olcuData) => {
    const response = await api.post('/olculler', olcuData);
    return response.data;
  },
  
  update: async (id, olcuData) => {
    const response = await api.put(`/olculler/${id}`, olcuData);
    return response.data;
  },
  
  delete: async (id) => {
    const response = await api.delete(`/olculler/${id}`);
    return response.data;
  }
};

// Siparisler API
export const siparislerAPI = {
  getAll: async (filters = {}) => {
    const params = new URLSearchParams(filters);
    const response = await api.get(`/siparisler?${params.toString()}`);
    return response.data;
  },
  
  getById: async (id) => {
    const response = await api.get(`/siparisler/${id}`);
    return response.data;
  },
  
  create: async (siparisData) => {
    const response = await api.post('/siparisler', siparisData);
    return response.data;
  },
  
  update: async (id, siparisData) => {
    const response = await api.put(`/siparisler/${id}`, siparisData);
    return response.data;
  },
  
  delete: async (id) => {
    const response = await api.delete(`/siparisler/${id}`);
    return response.data;
  },
  
  getTedarikciler: async () => {
    const response = await api.get('/siparisler/tedarikciler/list');
    return response.data;
  },
  
  createTedarikci: async (tedarikciData) => {
    const response = await api.post('/siparisler/tedarikciler', tedarikciData);
    return response.data;
  }
};

// Generic table API (for backward compatibility with supabase-like calls)
export const createTableAPI = (tableName) => {
  return {
    select: async (columns = '*') => {
      const response = await api.get(`/${tableName}`);
      return { data: response.data, error: null };
    },
    
    insert: async (data) => {
      try {
        const response = await api.post(`/${tableName}`, Array.isArray(data) ? data[0] : data);
        return { data: response.data, error: null };
      } catch (error) {
        return { data: null, error: error.response?.data || error.message };
      }
    },
    
    update: async (id, data) => {
      try {
        const response = await api.put(`/${tableName}/${id}`, data);
        return { data: response.data, error: null };
      } catch (error) {
        return { data: null, error: error.response?.data || error.message };
      }
    },
    
    delete: async (id) => {
      try {
        const response = await api.delete(`/${tableName}/${id}`);
        return { data: response.data, error: null };
      } catch (error) {
        return { data: null, error: error.response?.data || error.message };
      }
    }
  };
};

export default api;
