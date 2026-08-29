'use client';

import { useNavigate } from 'react-router-dom';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { apiRequest, setAccessToken } from '@/lib/api';
import type { User } from '@/lib/types';

type SignInInput = { email: string; password: string };
type SignUpInput = SignInInput & { name: string };
type AuthContextValue = {
  user: User | null;
  loading: boolean;
  signIn: (input: SignInInput) => Promise<void>;
  signUp: (input: SignUpInput) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const refreshUser = useCallback(async () => {
    try {
      const response = await apiRequest<{ user: User }>('/api/v1/auth/me');
      setUser(response.data.user);
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void refreshUser().finally(() => setLoading(false));
    }, 0);
    return () => window.clearTimeout(timer);
  }, [refreshUser]);

  const signIn = useCallback(async (input: SignInInput) => {
    const response = await apiRequest<{ accessToken: string; user: User }>(
      '/api/v1/auth/sign-in',
      { method: 'POST', body: JSON.stringify(input) },
      { auth: false },
    );
    setAccessToken(response.data.accessToken);
    setUser(response.data.user);
  }, []);

  const signUp = useCallback(async (input: SignUpInput) => {
    await apiRequest('/api/v1/auth/sign-up', { method: 'POST', body: JSON.stringify(input) }, { auth: false });
  }, []);

  const signOut = useCallback(async () => {
    try { await apiRequest('/api/v1/auth/logout', { method: 'POST' }); } catch { /* local cleanup still applies */ }
    setAccessToken(null);
    setUser(null);
    navigate('/sign-in');
  }, [navigate]);

  const value = useMemo(() => ({ user, loading, signIn, signUp, signOut, refreshUser }), [user, loading, signIn, signUp, signOut, refreshUser]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
