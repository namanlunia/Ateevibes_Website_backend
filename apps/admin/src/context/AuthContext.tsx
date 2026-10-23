import React, { createContext, useContext, useState, useEffect } from 'react';
import { AdminUser } from '../types';
import { apiClient } from '../api/client';

interface AuthContextType {
  user: AdminUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AdminUser | null>(() => {
    try {
      const stored = localStorage.getItem('atv_admin_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('atv_admin_access_token');
    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    apiClient<AdminUser>('auth/me')
      .then((profile) => {
        setUser(profile);
        localStorage.setItem('atv_admin_user', JSON.stringify(profile));
      })
      .catch(() => {
        // Token invalid
        localStorage.removeItem('atv_admin_access_token');
        localStorage.removeItem('atv_admin_user');
        setUser(null);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const login = async (email: string, password: string) => {
    const res = await apiClient<{ accessToken: string; refreshToken: string; user: AdminUser }>(
      'auth/admin/login',
      {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      },
    );

    localStorage.setItem('atv_admin_access_token', res.accessToken);
    localStorage.setItem('atv_admin_refresh_token', res.refreshToken);
    localStorage.setItem('atv_admin_user', JSON.stringify(res.user));
    setUser(res.user);
  };

  const logout = () => {
    localStorage.removeItem('atv_admin_access_token');
    localStorage.removeItem('atv_admin_refresh_token');
    localStorage.removeItem('atv_admin_user');
    setUser(null);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
