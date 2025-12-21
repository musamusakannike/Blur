import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from './firebase';
import api from './api';

export interface User {
  id: string;
  username: string;
  email: string;
  displayName: string;
  avatar?: string;
  isVerified: boolean;
}

export const loginWithGoogle = async (): Promise<{ user: User; token: string }> => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const idToken = await result.user.getIdToken();

    const response = await api.post('/auth/google', { idToken });

    if (response.data.success) {
      const { token, user } = response.data;
      localStorage.setItem('blur_token', token);
      localStorage.setItem('blur_user', JSON.stringify(user));
      return { user, token };
    }

    throw new Error('Google login failed');
  } catch (error) {
    console.error('Google login error:', error);
    throw error;
  }
};

export const getStoredUser = (): User | null => {
  if (typeof window === 'undefined') return null;
  const userStr = localStorage.getItem('blur_user');
  return userStr ? JSON.parse(userStr) : null;
};

export const getStoredToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('blur_token');
};

export const logout = () => {
  localStorage.removeItem('blur_token');
  localStorage.removeItem('blur_user');
  auth.signOut();
};

export const isAuthenticated = (): boolean => {
  return !!getStoredToken();
};
