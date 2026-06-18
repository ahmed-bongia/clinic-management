import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Read API URL from environment configuration
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000/api';

console.log(`[API Service] Initializing API client with baseURL: ${API_URL}`);

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10s timeout
});

// Request interceptor to attach JWT token to headers if it exists
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.warn('[API Service] Error reading token from AsyncStorage:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
