import axios from 'axios'
import useAuthStore from '../store/authStore'

// API base URL - geliştirme ortamı için
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

// Axios instance oluştur
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
})

// Request interceptor - her istekte token ekle
api.interceptors.request.use(
    (config) => {
        const token = useAuthStore.getState().token
        if (token) {
            config.headers.Authorization = `Bearer ${token}`
        }
        return config
    },
    (error) => {
        return Promise.reject(error)
    }
)

// Response interceptor - 401 durumunda logout yap
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            useAuthStore.getState().logout()
            window.location.href = '/login'
        }
        return Promise.reject(error)
    }
)

// Auth API fonksiyonları
export const authAPI = {
    register: (userData) => api.post('/api/v1/auth/register', userData),
    login: (credentials) => api.post('/api/v1/auth/login', credentials),
    getMe: () => api.get('/api/v1/auth/me'),
}

// API Key API fonksiyonları
export const apiKeyAPI = {
    create: (data) => api.post('/api/v1/api-keys/', data),
    getMe: () => api.get('/api/v1/api-keys/me'),
    delete: () => api.delete('/api/v1/api-keys/me'),
    deleteMe: () => api.delete('/api/v1/api-keys/me'),
    getBalance: () => api.get('/api/v1/api-keys/balance'),
}

// Bot Config API fonksiyonları
export const botConfigAPI = {
    create: (botData) => api.post('/api/v1/bot-configs/', botData),
    getAll: () => api.get('/api/v1/bot-configs/'),
    getById: (id) => api.get(`/api/v1/bot-configs/${id}`),
    update: (id, botData) => api.put(`/api/v1/bot-configs/${id}`, botData),
    delete: (id) => api.delete(`/api/v1/bot-configs/${id}`),
}

// Bot State API fonksiyonları
export const botStateAPI = {
    getById: (id) => api.get(`/api/v1/bot-states/${id}`),
    update: (id, stateData) => api.put(`/api/v1/bot-states/${id}`, stateData),
}

// Bot Runner API fonksiyonları
export const botRunnerAPI = {
    start: (id) => api.post(`/api/v1/bots/${id}/start`),
    stop: (id) => api.post(`/api/v1/bots/${id}/stop`),
}

// Symbols API fonksiyonları
export const symbolsAPI = {
    getSpotSymbols: () => api.get('/api/v1/symbols/spot'),
    getFuturesSymbols: () => api.get('/api/v1/symbols/futures'),
}

export default api
