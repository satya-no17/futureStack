'use client';

import React, { useState } from 'react';
import { useAuth } from '../lib/authContext';
import {
  ShieldCheck,
  AlertCircle,
  Key,
  Lock,
  Mail,
  User,
  Building,
  ArrowRight,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  UserCheck,
  Users
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
  const { login, register } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');

  // Login form state
  const [email, setEmail] = useState('creator@acme.com');
  const [password, setPassword] = useState('password123');

  // Register form state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regOrgName, setRegOrgName] = useState('');
  const [regOrgType, setRegOrgType] = useState<'solo' | 'enterprise'>('solo');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleLoginSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isLoading) return;
    setErrorMsg(null);
    setIsLoading(true);

    try {
      await login(email.trim(), password);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Invalid email or password';
      setErrorMsg(
        msg.includes('Failed to fetch')
          ? 'Unable to reach the backend. The server might be waking up from sleep — please wait 30 seconds and try again.'
          : msg
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function handleRegisterSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isLoading) return;
    setErrorMsg(null);

    if (!regName.trim() || !regEmail.trim() || !regPassword.trim() || !regOrgName.trim()) {
      setErrorMsg('Please fill in all registration fields');
      return;
    }

    if (regPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);

    try {
      await register(
        regOrgName.trim(),
        regOrgType,
        regName.trim(),
        regEmail.trim().toLowerCase(),
        regPassword
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Registration failed';
      setErrorMsg(
        msg.includes('Failed to fetch')
          ? 'Unable to reach the backend. Please check your network and try again.'
          : msg
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
            <span className="text-sm font-bold text-gray-900">Inkloom AI</span>
          </div>
        </div>
      </div>

      {/* Main body */}
      <div className="flex-1 flex items-center justify-center py-10 px-4">
        <div className="max-w-md w-full space-y-6">
          {/* Header */}
          <div className="text-center space-y-1.5">
            <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">
              {mode === 'login' ? 'Welcome to Inkloom AI' : 'Create Your Account'}
            </h1>
            <p className="text-xs text-gray-500">
              {mode === 'login'
                ? 'Sign in to check copy, verify claims, and align brand tone.'
                : 'Set up your brand governance workspace in seconds.'}
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex p-1 rounded-xl bg-gray-100 border border-gray-200 text-xs font-semibold">
            <button
              type="button"
              disabled={isLoading}
              onClick={() => {
                setMode('login');
                setErrorMsg(null);
              }}
              className={`flex-1 py-2 rounded-lg transition-all ${
                mode === 'login'
                  ? 'bg-white text-gray-900 shadow-sm font-bold'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              disabled={isLoading}
              onClick={() => {
                setMode('register');
                setErrorMsg(null);
              }}
              className={`flex-1 py-2 rounded-lg transition-all ${
                mode === 'register'
                  ? 'bg-white text-gray-900 shadow-sm font-bold'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Form Card */}
          <div className="p-6 rounded-2xl border border-gray-200 bg-white shadow-sm space-y-4">
            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs leading-relaxed flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {mode === 'login' ? (
              /* LOGIN FORM */
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                    <input
                      type="email"
                      required
                      disabled={isLoading}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@company.com"
                      className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-white border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-400 transition-colors disabled:bg-gray-50"
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
                      disabled={isLoading}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-white border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-400 transition-colors disabled:bg-gray-50"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-gray-900 text-white text-xs font-bold hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Signing In...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            ) : (
              /* REGISTER FORM */
              <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Your Full Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      required
                      disabled={isLoading}
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      placeholder="e.g. Maya Lin"
                      className="w-full pl-9 pr-3 py-2 rounded-lg bg-white border border-gray-200 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-400 transition-colors disabled:bg-gray-50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                    <input
                      type="email"
                      required
                      disabled={isLoading}
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="maya@company.com"
                      className="w-full pl-9 pr-3 py-2 rounded-lg bg-white border border-gray-200 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-400 transition-colors disabled:bg-gray-50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Password <span className="text-gray-400 font-normal">(min 6 characters)</span>
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                    <input
                      type="password"
                      required
                      minLength={6}
                      disabled={isLoading}
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-3 py-2 rounded-lg bg-white border border-gray-200 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-400 transition-colors disabled:bg-gray-50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Workspace / Brand Name
                  </label>
                  <div className="relative">
                    <Building className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      required
                      disabled={isLoading}
                      value={regOrgName}
                      onChange={(e) => setRegOrgName(e.target.value)}
                      placeholder="e.g. Lin Media or Acme Labs"
                      className="w-full pl-9 pr-3 py-2 rounded-lg bg-white border border-gray-200 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-400 transition-colors disabled:bg-gray-50"
                    />
                  </div>
                </div>

                {/* Workspace Mode Selection */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Workspace Workflow Mode
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      disabled={isLoading}
                      onClick={() => setRegOrgType('solo')}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        regOrgType === 'solo'
                          ? 'bg-violet-50/70 border-violet-400 ring-1 ring-violet-400/30'
                          : 'bg-white border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        <UserCheck className={`w-3.5 h-3.5 ${regOrgType === 'solo' ? 'text-violet-600' : 'text-gray-400'}`} />
                        <span className={`text-xs font-bold ${regOrgType === 'solo' ? 'text-violet-900' : 'text-gray-800'}`}>
                          Solo Creator
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-500 leading-tight">
                        Single author. No approval bottleneck. Direct publish.
                      </p>
                    </button>

                    <button
                      type="button"
                      disabled={isLoading}
                      onClick={() => setRegOrgType('enterprise')}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        regOrgType === 'enterprise'
                          ? 'bg-violet-50/70 border-violet-400 ring-1 ring-violet-400/30'
                          : 'bg-white border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        <Users className={`w-3.5 h-3.5 ${regOrgType === 'enterprise' ? 'text-violet-600' : 'text-gray-400'}`} />
                        <span className={`text-xs font-bold ${regOrgType === 'enterprise' ? 'text-violet-900' : 'text-gray-800'}`}>
                          Team / Enterprise
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-500 leading-tight">
                        Multi-user teams. Review queue and approval gates.
                      </p>
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-gray-900 text-white text-xs font-bold hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm mt-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Creating Account...</span>
                    </>
                  ) : (
                    <>
                      <span>Create Account & Get Started</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>

          {/* Demo accounts selector (Only in Login mode) */}
          {mode === 'login' && (
            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-700">
                  <Key className="w-3.5 h-3.5 text-gray-400" />
                  Or Try a Demo Account
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
                    disabled={isLoading}
                    onClick={() => handleSelectAccount(acc)}
                    className={`w-full p-2.5 rounded-lg border text-left transition-all text-xs flex items-center justify-between disabled:opacity-50 ${
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
          )}
        </div>
      </div>
    </div>
  );
}
