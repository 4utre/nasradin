// Custom API Client
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

class APIClient {
  constructor(baseURL) {
    this.baseURL = baseURL;
    this.token = localStorage.getItem('auth_token');
  }

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_token');
    }
  }

  async request(endpoint, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const config = {
      ...options,
      headers,
    };

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, config);
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  async get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  }

  async post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async put(endpoint, data) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }

  // Entity methods
  createEntityMethods(entityName) {
    return {
      list: (sortBy) => this.get(`/${entityName.toLowerCase()}s${sortBy ? `?sort=${sortBy}` : ''}`),
      get: (id) => this.get(`/${entityName.toLowerCase()}s/${id}`),
      create: (data) => this.post(`/${entityName.toLowerCase()}s`, data),
      update: (id, data) => this.put(`/${entityName.toLowerCase()}s/${id}`, data),
      delete: (id) => this.delete(`/${entityName.toLowerCase()}s/${id}`),
    };
  }

  // Auth methods
  auth = {
    login: async (email, password) => {
      const response = await this.post('/auth/login', { email, password });
      if (response.token) {
        this.setToken(response.token);
      }
      return response;
    },
    register: async (userData) => {
      const response = await this.post('/auth/register', userData);
      if (response.token) {
        this.setToken(response.token);
      }
      return response;
    },
    logout: () => {
      this.setToken(null);
    },
    me: () => this.get('/auth/me'),
  };

  // Entities
  entities = {
    Driver: this.createEntityMethods('Driver'),
    Employee: this.createEntityMethods('Employee'),
    Expense: this.createEntityMethods('Expense'),
    ExpenseType: this.createEntityMethods('ExpenseType'),
  };
}

export const apiClient = new APIClient(API_URL);

// For backward compatibility
export const base44 = apiClient;
