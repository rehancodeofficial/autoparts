import React, { createContext, useContext, useState, useEffect } from 'react';
import { CartItem } from '../types';

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string | null;
  role: string;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string, guestCart?: CartItem[]) => Promise<{ success: boolean; error?: string; cartItems?: any[] }>;
  register: (data: { name: string; email: string; password: string; confirmPassword: string; phone?: string; guestCart?: CartItem[] }) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user on mount
  useEffect(() => {
    refreshUser();
  }, []);

  const refreshUser = async () => {
    try {
      const res = await fetch('/api/auth/me', {
        headers: { 'Accept': 'application/json' },
        credentials: 'include'
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch (e) {
      // In offline / preview fallback: Check localStorage cached session if API is not hosted
      const cached = localStorage.getItem('autopart_auth_user');
      if (cached) {
        try {
          setUser(JSON.parse(cached));
        } catch {}
      } else {
        setUser(null);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string, guestCart?: CartItem[]) => {
    try {
      const formattedGuestCart = guestCart?.map(it => ({
        productId: it.part.id,
        quantity: it.quantity
      }));

      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password, guestCart: formattedGuestCart })
      });

      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Login failed. Please check your credentials.' };
      }

      setUser(data.user);
      localStorage.setItem('autopart_auth_user', JSON.stringify(data.user));
      return { success: true, cartItems: data.cartItems };
    } catch (err: any) {
      return { success: false, error: 'Connection error with authentication server.' };
    }
  };

  const register = async (formData: {
    name: string;
    email: string;
    password: string;
    confirmPassword: string;
    phone?: string;
    guestCart?: CartItem[];
  }) => {
    try {
      const formattedGuestCart = formData.guestCart?.map(it => ({
        productId: it.part.id,
        quantity: it.quantity
      }));

      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ ...formData, guestCart: formattedGuestCart })
      });

      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Registration failed.' };
      }

      setUser(data.user);
      localStorage.setItem('autopart_auth_user', JSON.stringify(data.user));
      return { success: true };
    } catch (err: any) {
      return { success: false, error: 'Connection error during registration.' };
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    } catch {}
    setUser(null);
    localStorage.removeItem('autopart_auth_user');
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
