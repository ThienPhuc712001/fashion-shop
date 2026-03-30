import axios from 'axios';
const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});
// Request interceptor to add auth token
api.interceptors.request.use((config) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => Promise.reject(error));
// Response interceptor for error handling
api.interceptors.response.use((response) => response, (error) => {
    // Just pass through errors - components will handle them
    return Promise.reject(error);
});
export default api;
