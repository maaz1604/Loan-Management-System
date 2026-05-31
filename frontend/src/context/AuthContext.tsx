'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '@/lib/api';
import { User, AuthResponse, EmploymentMode } from '@/types';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string, monthlySalary: number, employmentMode: EmploymentMode) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      setToken(storedToken);
      fetchUser(storedToken);
    } else {
      setIsLoading(false);
    }
  }, []);

  async function fetchUser(t?: string) {
    try {
      if (t) localStorage.setItem('token', t);
      const data = await api.get<{ user: User }>('/api/auth/me');
      setUser(data.user);
    } catch {
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }

  async function login(email: string, password: string) {
    const data = await api.post<AuthResponse>('/api/auth/login', { email, password });
    localStorage.setItem('token', data.token);
    setToken(data.token);
    setUser(data.user);
    // Route based on role
    if (data.user.role === 'Borrower') {
      router.push('/apply/personal');
    } else {
      router.push('/dashboard');
    }
  }

  async function signup(name: string, email: string, password: string, monthlySalary: number, employmentMode: EmploymentMode) {
    const data = await api.post<AuthResponse>('/api/auth/register', {
      name,
      email,
      password,
      role: 'Borrower',
      monthlySalary,
      employmentMode,
    });
    localStorage.setItem('token', data.token);
    setToken(data.token);
    setUser(data.user);
    router.push('/apply/personal');
  }

  function logout() {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    router.push('/login');
  }

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
