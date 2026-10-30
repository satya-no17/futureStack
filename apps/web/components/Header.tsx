'use client';

import React, { useEffect, useState } from 'react';
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
  Menu,
  X,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';

export type ActiveTab = 'studio' | 'slides' | 'approvals' | 'governance' | 'analytics' | 'audit' | 'a11y' | 'multitenant';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  pendingApprovalsCount?: number;
  onOpenQuickStart?: () => void;
  sidebarCollapsed: boolean;
  onToggleSidebar: () => void;
}

export function Header({
  activeTab,
  setActiveTab,
  pendingApprovalsCount = 0,
  onOpenQuickStart,
  sidebarCollapsed,
  onToggleSidebar,
}: HeaderProps) {
  const { user, organization, logout } = useAuth();
  const [confirmSignOut, setConfirmSignOut] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  useEffect(() => {
    if (!confirmSignOut) return;
    const onKeyDown = (event: KeyboardEvent) => event.key === 'Escape' && setConfirmSignOut(false);
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [confirmSignOut]);
  const isSolo = user?.role === 'solo' || organization?.type === 'solo';

  const allNavItems: { id: ActiveTab; label: string; icon: React.ComponentType<{ className?: string }>; count?: number }[] = [
    { id: 'studio', label: 'Drafts', icon: FileText },
    { id: 'slides', label: 'Slides', icon: Layers },
    { id: 'approvals', label: 'Approvals', icon: CheckCircle, count: pendingApprovalsCount },
    { id: 'governance', label: 'Brand setup', icon: Shield },
    { id: 'analytics', label: 'Reports', icon: BarChart3 },
    { id: 'audit', label: 'History', icon: History },
    { id: 'a11y', label: 'Accessibility', icon: Eye },
    { id: 'multitenant', label: 'Brand compare', icon: Building }
  ];

  const navItems = isSolo ? allNavItems.filter(item => item.id !== 'approvals') : allNavItems;

  const roleLabels: Record<string, string> = {
    creator: 'Writer',
    reviewer: 'Reviewer',
    admin: 'Brand Lead',
    solo: 'Solo Creator'
  };

  const navigation = (compact = false) => <nav aria-label="Workspace" className="space-y-1">
    {navItems.map((item) => {
      const Icon = item.icon;
      const isActive = activeTab === item.id;
      return <button key={item.id} type="button" aria-label={item.label} title={compact ? item.label : undefined} aria-current={isActive ? 'page' : undefined} onClick={() => { setActiveTab(item.id); setMobileOpen(false); }} className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${compact ? 'justify-center px-2' : ''} ${isActive ? 'bg-violet-50 text-violet-800' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}>
        <Icon className="h-4 w-4 shrink-0" />{!compact && <span className="flex-1 text-left">{item.label}</span>}
        {!!item.count && <span className="rounded-full bg-rose-500 px-2 py-0.5 text-[10px] font-bold text-white">{item.count}</span>}
      </button>;
    })}
  </nav>;

  const profile = (compact = false) => <div className="border-t border-gray-100 pt-4">
    <div className="mb-3 flex items-center gap-3 px-1">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-violet-100 bg-violet-50 text-sm font-bold text-violet-700">{user?.name?.charAt(0) || 'U'}</div>
      {!compact && <div className="min-w-0"><p className="truncate text-sm font-semibold text-gray-900">{user?.name}</p><p className="text-xs text-gray-500">{roleLabels[user?.role || ''] || user?.role}</p></div>}
    </div>
    {onOpenQuickStart && <button type="button" aria-label="Quick start" title={compact ? 'Quick start' : undefined} onClick={onOpenQuickStart} className={`mb-2 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-violet-700 hover:bg-violet-50 ${compact ? 'justify-center px-2' : ''}`}><Compass className="h-4 w-4 shrink-0" />{!compact && 'Quick start'}</button>}
    <button type="button" aria-label="Sign out" title={compact ? 'Sign out' : undefined} onClick={() => setConfirmSignOut(true)} className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 ${compact ? 'justify-center px-2' : ''}`}><LogOut className="h-4 w-4 shrink-0" />{!compact && 'Sign out'}</button>
  </div>;

  return (
    <>
      <header className={`fixed inset-y-0 left-0 z-40 hidden flex-col border-r border-gray-200 bg-white py-5 transition-[width] duration-200 md:flex ${sidebarCollapsed ? 'w-20 px-3' : 'w-64 px-4'}`}>
        
        {/* Brand identity */}
        <div className={`mb-5 flex items-center gap-3 px-1 ${sidebarCollapsed ? 'justify-center' : ''}`}>
          <div className="w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center text-white shadow-sm">
            <ShieldCheck className="w-4.5 h-4.5" />
          </div>
          {!sidebarCollapsed && <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-bold text-base tracking-tight text-gray-900">Inkloom</span>
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-violet-50 text-violet-700 border border-violet-100">Brand review</span>
            </div>
            <div className="text-[11px] text-gray-500 flex items-center gap-1.5">
              <span className="font-medium text-gray-600">{organization?.name || 'Workspace'}</span>
              <span>•</span>
              <span className="capitalize">{organization?.type || 'Team'}</span>
            </div>
          </div>}
        </div>

        <button type="button" aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'} aria-expanded={!sidebarCollapsed} title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'} onClick={onToggleSidebar} className={`mb-5 flex h-9 items-center rounded-lg text-gray-500 transition hover:bg-gray-100 hover:text-gray-900 ${sidebarCollapsed ? 'w-full justify-center' : 'ml-auto w-9 justify-center'}`}>
          {sidebarCollapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
        </button>

        {/* Simplified Navigation Bar */}
        {!sidebarCollapsed && <div className="mb-5 text-[11px] font-semibold uppercase tracking-wider text-gray-400">Workspace</div>}
        {navigation(sidebarCollapsed)}

        {/* User Profile & Sign Out */}
        <div className="mt-auto pt-8">{profile(sidebarCollapsed)}</div>
      </header>
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white px-4 py-3 md:hidden">
      <div className="flex min-w-0 items-center justify-between gap-3">
        <div className="flex items-center gap-2"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-900 text-white"><ShieldCheck className="h-4 w-4" /></span><div><p className="text-sm font-bold text-gray-900">Inkloom</p><p className="text-[10px] text-gray-500">{organization?.name || 'Workspace'}</p></div></div>
        <button type="button" aria-label={mobileOpen ? 'Close navigation' : 'Open navigation'} aria-expanded={mobileOpen} onClick={() => setMobileOpen(!mobileOpen)} className="rounded-lg border border-gray-200 p-2 text-gray-700">{mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}</button>
      </div>
      {mobileOpen && <div className="max-h-[calc(100dvh-5rem)] space-y-4 overflow-y-auto overscroll-contain pt-4">{navigation()}{profile()}</div>}
    </header>
    {confirmSignOut && <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-950/40 p-4" onMouseDown={(event) => event.target === event.currentTarget && setConfirmSignOut(false)}>
      <section role="alertdialog" aria-modal="true" aria-labelledby="signout-title" aria-describedby="signout-description" className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl">
        <h2 id="signout-title" className="text-lg font-semibold text-gray-950">Sign out of Inkloom?</h2><p id="signout-description" className="mt-2 text-sm leading-6 text-gray-600">You’ll need to sign in again to return to this workspace.</p>
        <div className="mt-6 flex justify-end gap-2"><button autoFocus type="button" onClick={() => setConfirmSignOut(false)} className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Stay signed in</button><button type="button" onClick={logout} className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800">Sign out</button></div>
      </section>
    </div>}
    </>
  );
}
