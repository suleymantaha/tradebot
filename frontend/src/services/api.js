import axios from 'axios'
import useAuthStore from '../store/authStore'

// API configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

class ApiService {
    constructor() {
        this.baseURL = API_BASE_URL
    }

    getToken() {
        // Try store first, then localStorage as fallback
        const storeToken = useAuthStore.getState().token
        const localToken = localStorage.getItem('token')
        return storeToken || localToken
    }

    async request(endpoint, options = {}) {
        console.log(`[ApiService] Requesting: ${endpoint}`, options);

        const url = `${this.baseURL}${endpoint}`
        const method = options.method || 'GET'
        const body = options.body ? JSON.stringify(options.body) : null

        const defaultHeaders = {
            'Content-Type': 'application/json',
        }

        const token = this.getToken()

        const debugInfo = {
            hasStoreToken: !!useAuthStore.getState().token,
            hasLocalToken: !!localStorage.getItem('token'),
            tokenUsed: !!token,
            tokenLength: token ? token.length : 0,
            endpoint,
            method
        };
        console.log('🔑 Auth Debug:', debugInfo);


        if (token) {
            defaultHeaders['Authorization'] = `Bearer ${token}`
        } else {
            console.warn('⚠️ No authentication token found for request to:', endpoint)
        }

        const config = {
            method,
            headers: {
                ...defaultHeaders,
                ...options.headers,
            },
            body,
        }

        // Log için config kopyası oluşturup Authorization başlığını düzenleyelim
        const configToLog = { ...config, headers: { ...config.headers } };
        if (configToLog.headers['Authorization']) {
            configToLog.headers['Authorization'] = 'Bearer [TOKEN_HIDDEN]'; // Token'ı gizle
        }
        console.log('📤 Request Config:', configToLog);


        try {
            const response = await fetch(url, config)

            if (!response.ok) {
                const errorText = await response.text()
                console.error('❌ Request failed:', { status: response.status, errorText })

                // Handle 401 errors
                if (response.status === 401) {
                    console.warn('🚪 401 Unauthorized - logging out')
                    useAuthStore.getState().logout()
                    window.location.href = '/login'
                }

                throw new Error(`HTTP ${response.status}: ${errorText}`)
            }

            return await response.json()
        } catch (error) {
            console.error('API Request failed:', error)
            throw error
        }
    }

    // Convenience methods
    async get(endpoint, options = {}) {
        return this.request(endpoint, { ...options, method: 'GET' })
    }

    async post(endpoint, data, options = {}) {
        return this.request(endpoint, {
            ...options,
            method: 'POST',
            body: data,
        })
    }

    async put(endpoint, data, options = {}) {
        return this.request(endpoint, {
            ...options,
            method: 'PUT',
            body: data,
        })
    }

    async delete(endpoint, options = {}) {
        return this.request(endpoint, { ...options, method: 'DELETE' })
    }

    // Backtest specific methods
    async runBacktest(data) {
        return this.post('/api/v1/backtest/run', data)
    }

    // Symbols
    async getSymbols(marketType = 'spot') {
        return this.get(`/api/v1/backtest/symbols/${marketType}`)
    }

    // Cache yönetimi
    async getCacheInfo() {
        return this.get('/api/v1/backtest/cache/info')
    }

    async clearCache() {
        return this.post('/api/v1/backtest/cache/clear')
    }

    // Backtest geçmişi
    async getBacktestList() {
        return this.get('/api/v1/backtest/list')
    }
}

// Main API service instance
const apiServiceInstance = new ApiService()

// Legacy axios instance for backward compatibility
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
    // 🆕 Şifre sıfırlama fonksiyonları - Özel handling
    forgotPassword: async (data) => {
        // Forgot password için token gerekmiyor, doğrudan fetch kullan
        const response = await fetch(`${API_BASE_URL}/api/v1/auth/forgot-password`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        })

        if (!response.ok) {
            const errorText = await response.text()
            throw {
                response: {
                    status: response.status,
                    data: { detail: errorText }
                }
            }
        }

        return { data: await response.json() }
    },
    resetPassword: async (data) => {
        // Reset password için de token gerekmiyor
        const response = await fetch(`${API_BASE_URL}/api/v1/auth/reset-password`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        })

        if (!response.ok) {
            const errorText = await response.text()
            throw {
                response: {
                    status: response.status,
                    data: { detail: errorText }
                }
            }
        }

        return { data: await response.json() }
    },
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

// Symbols API fonksiyonları - Direct fetch (no auth required)
export const symbolsAPI = {
    getSpotSymbols: async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/v1/symbols/spot`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            })

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`)
            }

            const data = await response.json()
            return { data }
        } catch (error) {
            console.error('Spot symbols fetch error:', error)
            throw error
        }
    },
    getFuturesSymbols: async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/v1/symbols/futures`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            })

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`)
            }

            const data = await response.json()
            return { data }
        } catch (error) {
            console.error('Futures symbols fetch error:', error)
            throw error
        }
    },
}

// Export both old and new APIs
export default apiServiceInstance
