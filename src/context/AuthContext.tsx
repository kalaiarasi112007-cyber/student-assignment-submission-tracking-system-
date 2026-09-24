import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Role } from '../types.ts';
import { apiFetch, safeJson } from '../lib/api.ts';

interface AuthContextType {
  user: User | null;
  token: string | null;
  demoUsers: User[];
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  register: (userData: {
    name: string;
    email: string;
    password: string;
    confirmPassword?: string;
    role: Role;
    department?: string;
    year_class?: string;
  }) => Promise<{ success: boolean; message?: string }>;
  changePassword: (
    currentPassword: string,
    newPassword: string,
    confirmPassword: string
  ) => Promise<{ success: boolean; message?: string }>;
  updateProfile: (
    name: string,
    department?: string,
    year_class?: string
  ) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  fetchDemoUsers: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = typeof window !== 'undefined' ? localStorage.getItem('assignment_user') : null;
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState<string | null>(() => {
    try {
      return typeof window !== 'undefined' ? localStorage.getItem('assignment_token') : null;
    } catch {
      return null;
    }
  });
  const [demoUsers, setDemoUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDemoUsers = async () => {
    try {
      const res = await apiFetch('/api/auth/demo-users');
      const data = await safeJson(res);
      if (data && data.success && Array.isArray(data.users)) {
        setDemoUsers(data.users);
      }
    } catch (err) {
      console.error('Failed to load registered accounts:', err);
    }
  };

  const refreshUser = async () => {
    try {
      const res = await apiFetch('/api/profile');
      const data = await safeJson(res);
      if (data && data.success && data.profile) {
        setUser(data.profile);
        localStorage.setItem('assignment_user', JSON.stringify(data.profile));
      }
    } catch {
      // Ignored
    }
  };

  useEffect(() => {
    let active = true;
    async function init() {
      try {
        await Promise.race([
          Promise.allSettled([
            fetchDemoUsers(),
            token ? refreshUser() : Promise.resolve()
          ]),
          new Promise((resolve) => setTimeout(resolve, 2500))
        ]);
      } catch (e) {
        console.error('Init error:', e);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }
    init();
    return () => {
      active = false;
    };
  }, [token]);

  const login = async (email: string, password: string) => {
    try {
      const res = await apiFetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await safeJson(res);

      if (data.success && data.user && data.token) {
        setUser(data.user);
        setToken(data.token);
        localStorage.setItem('assignment_token', data.token);
        localStorage.setItem('assignment_user', JSON.stringify(data.user));
        return { success: true, message: data.message };
      }

      return { success: false, message: data.message || 'Invalid email or password' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Server connection error' };
    }
  };

  const register = async (userData: {
    name: string;
    email: string;
    password: string;
    confirmPassword?: string;
    role: Role;
    department?: string;
    year_class?: string;
  }) => {
    try {
      const res = await apiFetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });
      const data = await safeJson(res);

      if (data.success) {
        await fetchDemoUsers();
        return { success: true, message: data.message };
      }
      return { success: false, message: data.message || 'Registration failed' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Registration error' };
    }
  };

  const changePassword = async (
    currentPassword: string,
    newPassword: string,
    confirmPassword: string
  ) => {
    try {
      const res = await apiFetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
      });
      const data = await safeJson(res);
      return { success: data.success, message: data.message };
    } catch (err: any) {
      return { success: false, message: err.message || 'Password update failed' };
    }
  };

  const updateProfile = async (
    name: string,
    department?: string,
    year_class?: string
  ) => {
    try {
      const res = await apiFetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, department, year_class }),
      });
      const data = await safeJson(res);
      if (data.success && data.profile) {
        setUser(data.profile);
        localStorage.setItem('assignment_user', JSON.stringify(data.profile));
        await fetchDemoUsers();
        return { success: true, message: data.message };
      }
      return { success: false, message: data.message || 'Profile update failed' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Profile update error' };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('assignment_token');
    localStorage.removeItem('assignment_user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        demoUsers,
        loading,
        login,
        register,
        changePassword,
        updateProfile,
        logout,
        refreshUser,
        fetchDemoUsers,
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
