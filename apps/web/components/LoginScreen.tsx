'use client';

import React, { useState } from 'react';
import { useAuth } from '../lib/authContext';
import {
  ShieldCheck,
  AlertCircle,
  Key,
  Lock,
  Mail,
  ArrowRight,
  ArrowLeft,
  Loader2,
} from 'lucide-react';

interface LoginScreenProps {
  onBack: () => void;
}

interface DefaultAccount {
  name: string;
  email: string;
  role: string;
  company: string;
}

const DEFAULT_ACCOUNTS: DefaultAccount[] = [
  {
    name: 'Leo Writer',
    email: 'creator@acme.com',
    role: 'Writer',
    company: 'Acme Enterprise',
  },
  {
    name: 'Sarah Approver',
    email: 'reviewer@acme.com',
    role: 'Reviewer',
    company: 'Acme Enterprise',
  },
  {
    name: 'Victoria Brand',
    email: 'admin@acme.com',
    role: 'Brand Lead',
    company: 'Acme Enterprise',
  },
  {
    name: 'Alex Social',
    email: 'creator@zest.io',
    role: 'Writer',
    company: 'Zest Social',
  },
  {
    name: 'Sam Solo',
    email: 'solo@creator.dev',
    role: 'Solo Writer',
    company: 'Solo Studio',
  },
];

export function LoginScreen({ onBack }: LoginScreenProps) {
  const { login } = useAuth();
  const [email, setEmail] = useState('creator@acme.com');
  const [password, setPassword] = useState('password123');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setIsLoading(true);

    try {
      await login(email.trim(), password);
    } catch (err: any) {
      setErrorMsg(
        err.message?.includes('Failed to fetch')
          ? 'Unable to reach the backend. The server might be waking up from sleep — please wait 30 seconds and try again.'
          : err.message || 'Invalid email or password'
      );
    } finally {
      setIsLoading(false);
    }
  }

  function handleSelectAccount(acc: DefaultAccount) {
    setEmail(acc.email);
    setPassword('password123');
    setErrorMsg(null);
  }

  return (
    <div className="landing-page min-h-screen bg-white flex flex-col selection:bg-violet-200">
      {/* Top bar */}
      <div className="border-b border-gray-100 bg-white">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </button>
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-gray-900 flex items-center justify-center">
              <ShieldCheck className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-sm font-bold text-gray-900">Inkloom</span>
          </div>
        </div>
      </div>

      {/* Login body */}
      <div className="flex-1 flex items-center justify-center py-12 px-4">
        <div className="max-w-sm w-full space-y-6">
          {/* Header */}
          <div className="text-center space-y-1.5">
            <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">Welcome back</h1>
            <p className="text-sm text-gray-500">Sign in to check and review your team&apos;s drafts.</p>
          </div>

          {/* Render notice */}
          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 flex gap-3">
            <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-amber-700 leading-relaxed">
              <strong className="font-semibold">Render Free Tier:</strong> If the backend was sleeping, the first sign-in may take <strong>30–50 seconds</strong>. Please be patient.
            </div>
          </div>

          {/* Login form */}
          <div className="p-6 rounded-2xl border border-gray-200 bg-white shadow-sm space-y-5">
            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs leading-relaxed">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-white border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-400 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-white border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-400 transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-gray-900 text-white text-sm font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Connecting...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Demo accounts */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-700">
                <Key className="w-3.5 h-3.5 text-gray-400" />
                Demo Accounts
              </div>
              <span className="font-mono text-[11px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                password123
              </span>
            </div>

            <div className="space-y-1.5">
              {DEFAULT_ACCOUNTS.map((acc) => (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => handleSelectAccount(acc)}
                  className={`w-full p-2.5 rounded-lg border text-left transition-all text-xs flex items-center justify-between ${
                    email === acc.email
                      ? 'bg-gray-50 border-gray-300 text-gray-900'
                      : 'bg-white border-gray-100 hover:border-gray-200 text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <div>
                    <div className="font-semibold">
                      {acc.name}
                      <span className="text-gray-400 font-normal ml-1.5">({acc.company})</span>
                    </div>
                    <div className="text-[11px] text-gray-400 mt-0.5">{acc.email}</div>
                  </div>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                    email === acc.email
                      ? 'bg-gray-900 text-white border-gray-900'
                      : 'bg-gray-50 text-gray-500 border-gray-200'
                  }`}>
                    {acc.role}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
