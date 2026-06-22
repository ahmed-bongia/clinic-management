import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const getExpoHostApiUrl = () => {
  const constants = Constants as any;
  const hostUri =
    constants.expoConfig?.hostUri ||
    constants.manifest?.debuggerHost ||
    constants.manifest2?.extra?.expoClient?.hostUri;

  if (!hostUri || typeof hostUri !== 'string') return null;

  const host = hostUri.split(':')[0];
  if (!host || host.includes('exp.direct')) return null;

  return `http://${host}:5000/api`;
};

// In Expo Go, prefer the current Metro host so Wi-Fi IP changes do not break API calls.
export const API_URL = (__DEV__ && getExpoHostApiUrl()) || process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000/api';

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

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response) {
      console.error('[API Service] Network request failed:', {
        baseURL: error.config?.baseURL,
        url: error.config?.url,
        method: error.config?.method,
        message: error.message,
      });
    }
    return Promise.reject(error);
  }
);

export default api;
