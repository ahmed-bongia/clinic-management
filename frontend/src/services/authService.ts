import api from './api';
import {
  clearSession,
  getAccessToken,
  getSession,
  saveSession,
  updateSessionUser,
  UserRole,
} from './sessionStorage';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  email: string;
  is_active?: boolean;
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
      const session = await saveSession({ accessToken: token, user });
      if (!session) {
        return { success: false, message: 'Unable to store secure session.' };
      }
      return { success: true, token: session.accessToken, user: session.user };
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
    await clearSession();
  } catch (error) {
    console.error('[Auth Service] Error clearing session storage:', error);
  }
};

/**
 * Retrieves the currently active user profile from local storage
 */
export const getCurrentUser = async (): Promise<User | null> => {
  try {
    const session = await getSession();
    return session?.user ?? null;
  } catch (error) {
    return null;
  }
};

export const getCurrentUserProfile = async (): Promise<User | null> => {
  try {
    const response = await api.get('/auth/me');
    const user = response.data.data?.user;
    if (user) {
      const session = await updateSessionUser(user);
      return session?.user ?? null;
    }
    return null;
  } catch (error: any) {
    console.error('[Auth Service] Profile fetch error:', error.response?.data || error.message);
    return getCurrentUser();
  }
};

export const validateCurrentSession = async (): Promise<User | null> => {
  const session = await getSession();
  if (!session) return null;

  try {
    const response = await api.get('/auth/me');
    const user = response.data.data?.user;
    if (!user) {
      await clearSession();
      return null;
    }

    const updatedSession = await updateSessionUser(user);
    return updatedSession?.user ?? session.user;
  } catch (error: any) {
    if (error.response?.status === 401) {
      return null;
    }

    console.warn('[Auth Service] Session validation skipped:', error.response?.data || error.message);
    return session.user;
  }
};

export const changePassword = async (payload: {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await api.patch('/auth/change-password', payload);
    return { success: true, message: response.data.message || 'Password changed successfully.' };
  } catch (error: any) {
    console.error('[Auth Service] Change password error:', error.response?.data || error.message);
    return { success: false, message: error.response?.data?.message || 'Unable to change password.' };
  }
};

/**
 * Gets the token
 */
export const getToken = async (): Promise<string | null> => {
  try {
    return await getAccessToken();
  } catch {
    return null;
  }
};
export const isAuthenticated = async (): Promise<boolean> => {
  const token = await getToken();
  return !!token;
};
