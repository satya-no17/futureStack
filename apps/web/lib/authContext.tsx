'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, User, Organization } from './api';

export interface DemoAccount {
  label: string;
  email: string;
  orgName: string;
  role: string;
  badgeColor: string;
}

export const DEMO_ACCOUNTS: DemoAccount[] = [
  { label: 'Acme Creator (Junior)', email: 'creator@acme.com', orgName: 'Acme Enterprise', role: 'creator', badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' },
  { label: 'Acme Reviewer (Senior)', email: 'reviewer@acme.com', orgName: 'Acme Enterprise', role: 'reviewer', badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
  { label: 'Acme Admin (Manager)', email: 'admin@acme.com', orgName: 'Acme Enterprise', role: 'admin', badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30' },
  { label: 'Zest Creator (Casual)', email: 'creator@zest.io', orgName: 'Zest Social', role: 'creator', badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
  { label: 'Zest Admin (Manager)', email: 'admin@zest.io', orgName: 'Zest Social', role: 'admin', badgeColor: 'bg-orange-500/20 text-orange-300 border-orange-500/30' },
  { label: 'Solo Studio Creator', email: 'solo@creator.dev', orgName: 'Solo Studio', role: 'solo', badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' },
];

interface AuthContextType {
  user: User | null;
  organization: Organization | null;
  loading: boolean;
  login: (email: string, password?: string) => Promise<void>;
  switchAccount: (email: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  async function checkUser() {
    try {
      const res = await api.getMe();
      setUser(res.user);
      setOrganization(res.organization);
    } catch {
      // If no valid session, auto-login with Acme Creator for seamless first-load demo experience
      try {
        const loginRes = await api.login('creator@acme.com', 'password123');
        setUser(loginRes.user);
        setOrganization(loginRes.organization);
      } catch (err) {
        console.error('Failed to auto-login demo user:', err);
      }
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

  async function switchAccount(email: string) {
    await login(email, 'password123');
  }

  function logout() {
    localStorage.removeItem('inkloom_token');
    setUser(null);
    setOrganization(null);
  }

  return (
    <AuthContext.Provider value={{ user, organization, loading, login, switchAccount, logout }}>
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
