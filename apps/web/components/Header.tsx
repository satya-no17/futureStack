'use client';

import React from 'react';
import { useAuth } from '../lib/authContext';
import {
  ShieldCheck,
  FileText,
  CheckCircle,
  Shield,
  BarChart3,
  History,
  Eye,
  Building,
  LogOut,
  UserCheck
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
  const { user, organization, logout } = useAuth();

  const navItems: { id: ActiveTab; label: string; icon: any; count?: number }[] = [
    { id: 'studio', label: 'Content Studio', icon: FileText },
    { id: 'approvals', label: 'Approval Queue', icon: CheckCircle, count: pendingApprovalsCount },
    { id: 'governance', label: 'Brand Guidelines', icon: Shield },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'audit', label: 'Audit Trail', icon: History },
    { id: 'a11y', label: 'Accessibility', icon: Eye },
    { id: 'multitenant', label: 'Multi-Tenant Compare', icon: Building }
  ];

  return (
    <header className="sticky top-0 z-40 glass-panel border-b border-stone-800 px-6 py-3 bg-[#141210]/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Brand identity */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-600 via-amber-500 to-orange-500 text-white shadow-md shadow-amber-600/20 font-black">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base tracking-tight text-white">Inkloom AI</span>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-300 border border-amber-500/30">
                Governance
              </span>
            </div>
            <div className="text-[11px] text-stone-400 flex items-center gap-1.5">
              <span className="font-semibold text-stone-200">{organization?.name || 'Workspace'}</span>
              <span className="text-stone-600">•</span>
              <span className="capitalize">{organization?.type || 'Enterprise'}</span>
            </div>
          </div>
        </div>

        {/* Simplified Navigation Bar */}
        <nav className="flex items-center gap-1 bg-stone-900/80 p-1 rounded-xl border border-stone-800 overflow-x-auto max-w-full">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-amber-600 text-white font-bold shadow-sm shadow-amber-600/30'
                    : 'text-stone-400 hover:text-white hover:bg-stone-800/60'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
                {item.count !== undefined && item.count > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-500 text-white font-bold">
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* User Profile & Sign Out (Clean, no one-click dropdown) */}
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <div className="text-xs font-bold text-white leading-tight">{user?.name}</div>
            <div className="text-[10px] text-stone-400 capitalize">
              Role: <span className="text-amber-400 font-semibold">{user?.role}</span>
            </div>
          </div>

          <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-xs font-bold text-amber-300">
            {user?.name?.charAt(0) || 'U'}
          </div>

          <button
            onClick={logout}
            title="Sign out to return to login"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 border border-stone-700/60 text-stone-300 hover:text-white text-xs font-medium transition"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>

      </div>
    </header>
  );
}
