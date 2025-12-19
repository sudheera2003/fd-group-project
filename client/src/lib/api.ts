import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api', // Matches your backend URL
});

// 1. Request Interceptor: Add Token to every outgoing request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// 2. Response Interceptor: Handle Session Expiry globally
api.interceptors.response.use(
  (response) => response, // Return successful responses directly
  (error) => {
    // Check if the error is a 401 (Unauthorized)
    if (error.response && error.response.status === 401) {
      
      // Prevent redirect loops if already on login page
      if (window.location.pathname !== '/login') {
        console.warn("Session expired. Logging out...");
        
        // A. Clear any stale data
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        // B. Force redirect to login
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;