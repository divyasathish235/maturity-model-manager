import axios, { AxiosRequestConfig } from 'axios';
import { LoginRequest, LoginResponse, RegisterRequest, User } from '../models/types';

// Create axios instance
const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Authentication API
export const authAPI = {
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>('/auth/login', data);
    return response.data;
  },
  
  register: async (data: RegisterRequest): Promise<User> => {
    const response = await api.post<User>('/auth/register', data);
    return response.data;
  },
  
  getProfile: async (): Promise<User> => {
    const response = await api.get<User>('/auth/profile');
    return response.data;
  },
  
  updateProfile: async (data: Partial<User>): Promise<User> => {
    const response = await api.put<User>('/auth/profile', data);
    return response.data;
  },
};

// Teams API
export const teamsAPI = {
  getAll: async () => {
    const response = await api.get('/teams');
    return response.data;
  },
  
  getById: async (id: number) => {
    const response = await api.get(`/teams/${id}`);
    return response.data;
  },
  
  create: async (data: any) => {
    const response = await api.post('/teams', data);
    return response.data;
  },
  
  update: async (id: number, data: any) => {
    const response = await api.put(`/teams/${id}`, data);
    return response.data;
  },
  
  delete: async (id: number) => {
    const response = await api.delete(`/teams/${id}`);
    return response.data;
  },
};

// Services API
export const servicesAPI = {
  getAll: async () => {
    const response = await api.get('/services');
    return response.data;
  },
  
  getById: async (id: number) => {
    const response = await api.get(`/services/${id}`);
    return response.data;
  },
  
  create: async (data: any) => {
    const response = await api.post('/services', data);
    return response.data;
  },
  
  update: async (id: number, data: any) => {
    const response = await api.put(`/services/${id}`, data);
    return response.data;
  },
  
  delete: async (id: number) => {
    const response = await api.delete(`/services/${id}`);
    return response.data;
  },
};

// Maturity Models API
export const maturityModelsAPI = {
  getAll: async () => {
    const response = await api.get('/maturity-models');
    return response.data;
  },
  
  getById: async (id: number) => {
    const response = await api.get(`/maturity-models/${id}`);
    return response.data;
  },
  
  create: async (data: any) => {
    const response = await api.post('/maturity-models', data);
    return response.data;
  },
  
  update: async (id: number, data: any) => {
    const response = await api.put(`/maturity-models/${id}`, data);
    return response.data;
  },
  
  delete: async (id: number) => {
    const response = await api.delete(`/maturity-models/${id}`);
    return response.data;
  },
};

// Campaigns API
export const campaignsAPI = {
  getAll: async () => {
    const response = await api.get('/campaigns');
    return response.data;
  },
  
  getById: async (id: number) => {
    const response = await api.get(`/campaigns/${id}`);
    return response.data;
  },
  
  create: async (data: any) => {
    const response = await api.post('/campaigns', data);
    return response.data;
  },
  
  update: async (id: number, data: any) => {
    const response = await api.put(`/campaigns/${id}`, data);
    return response.data;
  },
  
  delete: async (id: number) => {
    const response = await api.delete(`/campaigns/${id}`);
    return response.data;
  },
  
  getParticipants: async (id: number) => {
    const response = await api.get(`/campaigns/${id}/participants`);
    return response.data;
  },
  
  addParticipant: async (id: number, serviceId: number) => {
    const response = await api.post(`/campaigns/${id}/participants`, { service_id: serviceId });
    return response.data;
  },
  
  removeParticipant: async (id: number, serviceId: number) => {
    const response = await api.delete(`/campaigns/${id}/participants/${serviceId}`);
    return response.data;
  },
};

// Measurement Evaluations API
export const evaluationsAPI = {
  getByCampaignAndService: async (campaignId: number, serviceId: number) => {
    const response = await api.get(`/evaluations/campaign/${campaignId}/service/${serviceId}`);
    return response.data;
  },
  
  updateEvaluation: async (id: number, data: any) => {
    const response = await api.put(`/evaluations/${id}`, data);
    return response.data;
  },
  
  getHistory: async (id: number) => {
    const response = await api.get(`/evaluations/${id}/history`);
    return response.data;
  },
};

export default api;