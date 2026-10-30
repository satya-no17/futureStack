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
  Layers,
  Compass,
} from 'lucide-react';

export type ActiveTab = 'studio' | 'slides' | 'approvals' | 'governance' | 'analytics' | 'audit' | 'a11y' | 'multitenant';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  pendingApprovalsCount?: number;
  onOpenQuickStart?: () => void;
}

export function Header({
  activeTab,
  setActiveTab,
  pendingApprovalsCount = 0,
  onOpenQuickStart
}: HeaderProps) {
  const { user, organization, logout } = useAuth();
  const isSolo = user?.role === 'solo' || organization?.type === 'solo';

  const allNavItems: { id: ActiveTab; label: string; icon: React.ComponentType<{ className?: string }>; count?: number }[] = [
    { id: 'studio', label: 'Drafts & Scanner', icon: FileText },
    { id: 'slides', label: 'Slide Deck Scanner', icon: Layers },
    { id: 'approvals', label: 'Needs Review', icon: CheckCircle, count: pendingApprovalsCount },
    { id: 'governance', label: 'Brand Rules & Facts', icon: Shield },
    { id: 'analytics', label: 'Score & Reports', icon: BarChart3 },
    { id: 'audit', label: 'Activity History', icon: History },
    { id: 'a11y', label: 'Colors & Readability', icon: Eye },
    { id: 'multitenant', label: 'Compare Brands', icon: Building }
  ];

  const navItems = isSolo ? allNavItems.filter(item => item.id !== 'approvals') : allNavItems;

  const roleLabels: Record<string, string> = {
    creator: 'Writer',
    reviewer: 'Reviewer',
    admin: 'Brand Lead',
    solo: 'Solo Creator'
  };

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-gray-100 px-6 py-3.5 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Brand identity */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center text-white shadow-sm">
            <ShieldCheck className="w-4.5 h-4.5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base tracking-tight text-gray-900">Inkloom AI</span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-violet-50 text-violet-700 border border-violet-100">
                Brand Safety
              </span>
            </div>
            <div className="text-[11px] text-gray-500 flex items-center gap-1.5">
              <span className="font-medium text-gray-600">{organization?.name || 'Workspace'}</span>
              <span>•</span>
              <span className="capitalize">{organization?.type || 'Team'}</span>
            </div>
          </div>
        </div>

        {/* Simplified Navigation Bar */}
        <nav className="flex items-center gap-1 bg-gray-100/90 p-1 rounded-xl border border-gray-200/60 overflow-x-auto max-w-full">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-gray-900 text-white font-bold shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white/80'
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

        {/* User Profile & Sign Out */}
        <div className="flex items-center gap-3">
          {onOpenQuickStart && (
            <button
              type="button"
              onClick={onOpenQuickStart}
              title="Open Quick-Start Guide"
              aria-label="Open Quick-Start Guide"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-50 hover:bg-violet-100 border border-violet-200 text-violet-700 hover:text-violet-800 text-xs font-bold transition shadow-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
            >
              <Compass className="w-3.5 h-3.5 text-violet-600" />
              <span className="hidden sm:inline">Quick-Start Guide</span>
            </button>
          )}

          <div className="text-right hidden sm:block">
            <div className="text-xs font-bold text-gray-900 leading-tight">{user?.name}</div>
            <div className="text-[11px] text-gray-500">
              {roleLabels[user?.role || ''] || user?.role}
            </div>
          </div>

          <div className="w-8 h-8 rounded-lg bg-violet-50 border border-violet-100 flex items-center justify-center text-xs font-bold text-violet-700">
            {user?.name?.charAt(0) || 'U'}
          </div>

          <button
            onClick={logout}
            title="Sign out to return to home"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-gray-50 border border-gray-200 text-gray-600 hover:text-gray-900 text-xs font-medium transition shadow-sm"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>

      </div>
    </header>
  );
}
