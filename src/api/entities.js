import { apiClient } from './base44Client';

// Entity query helper
export const Query = {
  list: (entityName, sortBy) => apiClient.entities[entityName].list(sortBy),
  get: (entityName, id) => apiClient.entities[entityName].get(id),
  create: (entityName, data) => apiClient.entities[entityName].create(data),
  update: (entityName, id, data) => apiClient.entities[entityName].update(id, data),
  delete: (entityName, id) => apiClient.entities[entityName].delete(id),
};

// Auth SDK
export const User = apiClient.auth;