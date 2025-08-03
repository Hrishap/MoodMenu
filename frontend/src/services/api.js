import axios from 'axios';
import toast from 'react-hot-toast';

// API base URL - FIXED TO USE PORT 4000
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

console.log('🔧 API Base URL:', API_BASE_URL);

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 second timeout
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false, // CHANGED: Set to false to avoid CORS issues
});

// Request interceptor - add auth token to requests
api.interceptors.request.use(
  (config) => {
    // Get token from localStorage
    const token = localStorage.getItem('token');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Log request details in development
    if (import.meta.env.MODE === 'development') {
      console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`);
      if (config.data) {
        console.log('📤 Request Data:', config.data);
      }
    }

    return config;
  },
  (error) => {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor - handle responses and errors
api.interceptors.response.use(
  (response) => {
    // Log successful responses in development
    if (import.meta.env.MODE === 'development') {
      console.log(`✅ API Response: ${response.config.method?.toUpperCase()} ${response.config.url}`, response.data);
    }
    
    return response;
  },
  (error) => {
    console.error('❌ API Error:', error);

    // Handle different error scenarios
    if (error.code === 'ERR_NETWORK' || error.code === 'ECONNREFUSED') {
      // Network/connection errors
      toast.error('Unable to connect to server. Please check if the backend is running on port 4000.');
      console.error('🔴 Backend connection failed. Is the server running on port 4000?');
    } else if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;
      
      switch (status) {
        case 401:
          // Unauthorized - token expired or invalid
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
          toast.error('Session expired. Please login again.');
          break;
          
        case 403:
          toast.error('Access denied. You do not have permission.');
          break;
          
        case 404:
          toast.error('Requested resource not found.');
          break;
          
        case 422:
          // Validation errors
          if (data.errors && Array.isArray(data.errors)) {
            data.errors.forEach(err => toast.error(err.msg || err.message));
          } else {
            toast.error(data.message || 'Validation error occurred.');
          }
          break;
          
        case 429:
          toast.error('Too many requests. Please try again later.');
          break;
          
        case 500:
          toast.error('Server error. Please try again later.');
          break;
          
        default:
          toast.error(data.message || `Error ${status}: Something went wrong.`);
      }

      // Log error details in development
      if (import.meta.env.MODE === 'development') {
        console.error(`🔴 API Error ${status}:`, data);
      }
    } else if (error.request) {
      // Request was made but no response received
      toast.error('No response from server. Please check your connection.');
      console.error('🔴 No response received:', error.request);
    } else {
      // Something else happened
      toast.error('An unexpected error occurred.');
      console.error('🔴 Unexpected error:', error.message);
    }

    return Promise.reject(error);
  }
);

// Health check function
export const checkApiHealth = async () => {
  try {
    const response = await api.get('/health');
    console.log('✅ API Health Check:', response.data);
    return true;
  } catch (error) {
    console.error('❌ API Health Check Failed:', error);
    return false;
  }
};

// Test backend connection - FIXED PORT
export const testBackendConnection = async () => {
  try {
    console.log('🔍 Testing backend connection on port 4000...');
    const response = await axios.get('http://localhost:4000/', {
      timeout: 5000
    });
    console.log('✅ Backend is running on port 4000:', response.data);
    return true;
  } catch (error) {
    console.error('❌ Backend connection test failed:', error);
    console.error('🔧 Make sure backend is running on port 4000 with: npm run dev');
    return false;
  }
};

// Initialize API health check on import
if (import.meta.env.MODE === 'development') {
  testBackendConnection();
}

export default api;