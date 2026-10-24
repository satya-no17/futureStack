'use client';

import React, { useState } from 'react';
import { useAuth, DEMO_ACCOUNTS } from '../lib/authContext';
import {
  Shield,
  Layers,
  CheckCircle,
  FileText,
  BarChart3,
  History,
  Eye,
  Sparkles,
  ChevronDown,
  Building,
  User,
  LogOut
} from 'lucide-react';

export type ActiveTab = 'studio' | 'approvals' | 'governance' | 'analytics' | 'audit' | 'a11y' | 'multitenant';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  pendingApprovalsCount?: number;
}

export function Header({
  activeTab,
  setActiveTab,
  pendingApprovalsCount = 0
}: HeaderProps) {
  const { user, organization, switchAccount, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const navItems: { id: ActiveTab; label: string; icon: any; count?: number; minRole?: string }[] = [
    { id: 'studio', label: 'Drafts & Studio', icon: FileText },
    { id: 'approvals', label: 'Approval Queue', icon: CheckCircle, count: pendingApprovalsCount },
    { id: 'governance', label: 'Guidelines & Facts', icon: Shield },
    { id: 'analytics', label: 'Analytics & Insights', icon: BarChart3 },
    { id: 'audit', label: 'Audit Trail', icon: History },
    { id: 'a11y', label: 'Accessibility Tools', icon: Eye },
    { id: 'multitenant', label: 'Multi-Tenant Compare', icon: Building }
  ];

  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-white/10 px-6 py-3.5">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Brand identity */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 shadow-md shadow-indigo-500/20 text-white font-black text-xl">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg tracking-tight text-white">Inkloom AI</span>
              <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Pre-Publication Governance
              </span>
            </div>
            <div className="text-xs text-gray-400 flex items-center gap-1.5 mt-0.5">
              <Building className="w-3 h-3 text-gray-500" />
              <span className="font-semibold text-gray-300">{organization?.name || 'Enterprise'}</span>
              <span className="text-gray-600">•</span>
              <span className="capitalize">{organization?.type || 'Enterprise'} Workspace</span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 bg-black/40 p-1.5 rounded-2xl border border-white/5 overflow-x-auto max-w-full">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-bold'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
                {item.count !== undefined && item.count > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-500 text-white font-bold animate-pulse">
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* User Profile & Demo Switcher */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition text-left"
          >
            <div className="w-7 h-7 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-xs font-bold text-indigo-300">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div className="hidden sm:block">
              <div className="text-xs font-bold text-white leading-tight">{user?.name}</div>
              <div className="text-[10px] text-gray-400 uppercase font-semibold tracking-wider">
                Role: <span className="text-indigo-400">{user?.role}</span>
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-gray-400 ml-1" />
          </button>

          {/* Quick Switcher Dropdown */}
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-slate-900 border border-white/10 shadow-2xl p-2 z-50">
              <div className="px-3 py-2 border-b border-white/5 text-[11px] font-bold uppercase tracking-wider text-gray-400">
                1-Click Demo Account Switcher
              </div>
              <div className="space-y-1 py-1">
                {DEMO_ACCOUNTS.map((acc) => {
                  const isCurrent = user?.email === acc.email;
                  return (
                    <button
                      key={acc.email}
                      onClick={() => {
                        switchAccount(acc.email);
                        setDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-xs transition ${
                        isCurrent
                          ? 'bg-indigo-600/30 text-white font-bold border border-indigo-500/40'
                          : 'text-gray-300 hover:bg-white/5'
                      }`}
                    >
                      <div>
                        <div className="font-semibold text-white">{acc.label}</div>
                        <div className="text-[10px] text-gray-400">{acc.orgName} • {acc.email}</div>
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border ${acc.badgeColor}`}>
                        {acc.role}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="pt-2 border-t border-white/5">
                <button
                  onClick={() => {
                    logout();
                    setDropdownOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-rose-400 hover:bg-rose-500/10 transition"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </header>
  );
}
