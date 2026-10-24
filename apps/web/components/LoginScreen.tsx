'use client';

import React, { useState } from 'react';
import { useAuth } from '../lib/authContext';
import { ShieldCheck, AlertCircle, Key, Lock, Mail, Sparkles, Building2, User, ArrowRight } from 'lucide-react';

interface DefaultAccount {
  name: string;
  email: string;
  role: string;
  company: string;
  description: string;
}

const DEFAULT_ACCOUNTS: DefaultAccount[] = [
  {
    name: 'Leo Writer',
    email: 'creator@acme.com',
    role: 'Creator',
    company: 'Acme Enterprise',
    description: 'Drafts copy, runs AI reviews, accepts fixes'
  },
  {
    name: 'Sarah Approver',
    email: 'reviewer@acme.com',
    role: 'Reviewer',
    company: 'Acme Enterprise',
    description: 'Inspects approval queue, diff viewer, signs off'
  },
  {
    name: 'Victoria Brand',
    email: 'admin@acme.com',
    role: 'Brand Manager',
    company: 'Acme Enterprise',
    description: 'Manages guidelines, facts, banned terms, analytics'
  },
  {
    name: 'Alex Social',
    email: 'creator@zest.io',
    role: 'Creator',
    company: 'Zest Social (Consumer)',
    description: 'Casual mobile copy tested against consumer brand voice'
  },
  {
    name: 'Sam Solo',
    email: 'solo@creator.dev',
    role: 'Solo Creator',
    company: 'Solo Studio',
    description: 'Direct publishing without approval workflows'
  }
];

export function LoginScreen() {
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
          ? 'Unable to reach backend API. The Render server might still be waking up from sleep. Please wait 15 seconds and try again.'
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
    <div className="min-h-screen flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 bg-[#141210] selection:bg-amber-500/30">
      <div className="max-w-md w-full mx-auto space-y-6">
        
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-600 via-amber-500 to-orange-500 text-white shadow-xl shadow-amber-600/20 mb-2">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">Inkloom AI</h1>
          <p className="text-xs text-stone-400 max-w-xs mx-auto">
            Pre-Publication Brand Governance & Claim Verification Platform
          </p>
        </div>

        {/* Render Free-Tier Wake-Up Alert */}
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-amber-400" />
            <span>Notice: Render Free-Tier Server Wake-Up</span>
          </div>
          <p className="text-xs text-amber-200/80 leading-relaxed pl-6">
            If the backend was idle, Render puts free-tier instances to sleep. The initial sign in may take <strong>30 to 50 seconds</strong> to spin up. Please allow a moment on first connection.
          </p>
        </div>

        {/* Main Login Card */}
        <div className="glass-panel p-7 rounded-3xl border border-stone-800 shadow-2xl space-y-5">
          <div className="border-b border-stone-800 pb-3">
            <h2 className="text-base font-bold text-white">Sign In to Your Workspace</h2>
            <p className="text-xs text-stone-400 mt-0.5">Enter your work credentials to access the governance console.</p>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs leading-relaxed">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-stone-300 mb-1.5">
                Work Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-stone-500 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-stone-900 border border-stone-700/60 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-stone-500 absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-stone-900 border border-stone-700/60 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white text-xs font-bold transition shadow-lg shadow-amber-600/20 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Sparkles className="w-4 h-4 animate-spin" />
                  <span>Signing In (connecting to backend)...</span>
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

        {/* Default Demo Accounts Note */}
        <div className="p-5 rounded-2xl glass-panel border border-stone-800 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 font-bold text-stone-200">
              <Key className="w-3.5 h-3.5 text-amber-400" />
              <span>Default Demo Accounts</span>
            </div>
            <span className="font-mono text-[11px] text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
              Password: password123
            </span>
          </div>

          <p className="text-[11px] text-stone-400">
            Click any demo role below to fill credentials:
          </p>

          <div className="grid grid-cols-1 gap-2 pt-1">
            {DEFAULT_ACCOUNTS.map((acc) => (
              <button
                key={acc.email}
                type="button"
                onClick={() => handleSelectAccount(acc)}
                className={`p-2.5 rounded-xl border text-left transition flex items-center justify-between text-xs ${
                  email === acc.email
                    ? 'bg-amber-500/15 border-amber-500/40 text-amber-200'
                    : 'bg-stone-900/60 border-stone-800 hover:border-stone-700 text-stone-300'
                }`}
              >
                <div>
                  <div className="font-bold flex items-center gap-1.5">
                    <span>{acc.name}</span>
                    <span className="text-[10px] text-stone-400 font-normal">({acc.company})</span>
                  </div>
                  <div className="text-[10px] text-stone-400">{acc.email}</div>
                </div>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-stone-800 text-stone-300 border border-stone-700">
                  {acc.role}
                </span>
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
