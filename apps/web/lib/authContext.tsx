'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, User, Organization } from './api';

interface AuthContextType {
  user: User | null;
  organization: Organization | null;
  loading: boolean;
  login: (email: string, password?: string) => Promise<void>;
  register: (orgName: string, orgType: string, name: string, email: string, password?: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  async function checkUser() {
    const token = typeof window !== 'undefined' ? localStorage.getItem('inkloom_token') : null;
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const res = await api.getMe();
      setUser(res.user);
      setOrganization(res.organization);
    } catch {
      localStorage.removeItem('inkloom_token');
      setUser(null);
      setOrganization(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    checkUser();
  }, []);

  async function login(email: string, password = 'password123') {
    setLoading(true);
    try {
      const res = await api.login(email, password);
      setUser(res.user);
      setOrganization(res.organization);
    } finally {
      setLoading(false);
    }
  }

  async function register(
    orgName: string,
    orgType: string,
    name: string,
    email: string,
    password = 'password123'
  ) {
    setLoading(true);
    try {
      const res = await api.register(orgName, orgType, name, email, password);
      setUser(res.user);
      setOrganization(res.organization);
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    localStorage.removeItem('inkloom_token');
    setUser(null);
    setOrganization(null);
  }

  return (
    <AuthContext.Provider value={{ user, organization, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
