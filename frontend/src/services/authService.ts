import api from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface User {
  id: string;
  name: string;
  role: 'Admin' | 'Doctor' | 'Patient' | 'Receptionist' | 'Pharmacist' | 'Laboratory Staff';
  email: string;
}

export interface LoginResponse {
  success: boolean;
  message?: string;
  token?: string;
  user?: User;
}

/**
 * Performs login call to backend
 */
export const login = async (email: string, password: string): Promise<LoginResponse> => {
  try {
    const response = await api.post('/auth/login', { email, password });
    const responseData = response.data;

    if (responseData.success && responseData.data?.token) {
      const { token, user } = responseData.data;
      await AsyncStorage.setItem('auth_token', token);
      await AsyncStorage.setItem('user_info', JSON.stringify(user));
      return { success: true, token, user };
    }
    
    return { success: false, message: responseData.message || 'Verification failed.' };
  } catch (error: any) {
    console.error('[Auth Service] Login call error:', error.response?.data || error.message);
    const errorMessage = error.response?.data?.message || 'Connection failed. Ensure backend server is running.';
    return { success: false, message: errorMessage };
  }
};

/**
 * Clears stored credentials and logs out user
 */
export const logout = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem('auth_token');
    await AsyncStorage.removeItem('user_info');
  } catch (error) {
    console.error('[Auth Service] Error clearing session storage:', error);
  }
};

/**
 * Retrieves the currently active user profile from local storage
 */
export const getCurrentUser = async (): Promise<User | null> => {
  try {
    const userStr = await AsyncStorage.getItem('user_info');
    return userStr ? JSON.parse(userStr) : null;
  } catch (error) {
    return null;
  }
};

/**
 * Gets the token
 */
export const getToken = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem('auth_token');
  } catch {
    return null;
  }
};
export const isAuthenticated = async (): Promise<boolean> => {
  const token = await getToken();
  return !!token;
};
