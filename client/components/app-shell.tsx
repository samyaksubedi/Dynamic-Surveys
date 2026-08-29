'use client';

import { BarChart3, FileText, HelpCircle, LogOut, Menu, Plus, Settings, X } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState, type ReactNode } from 'react';
import { useAuth } from './auth-provider';
import { Brand } from './brand';

const navigation = [
  { href: '/dashboard', label: 'Surveys', icon: FileText },
  { href: '/dashboard/analytics', label: 'Overview', icon: BarChart3 },
  { href: '/account', label: 'Account', icon: Settings },
];

export function AppShell({ children }: { children: ReactNode }) {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate(`/sign-in?returnTo=${encodeURIComponent(pathname)}`, { replace: true });
  }, [loading, user, navigate, pathname]);

  if (loading || !user) {
    return <div className="page-loading"><span className="loading-mark">D</span><p>Loading your workspace…</p></div>;
  }

  return (
    <div className="app-layout">
      <button type="button" className="mobile-nav-toggle" onClick={() => setMobileOpen(true)} aria-label="Open navigation"><Menu size={20} /></button>
      {mobileOpen && <button className="nav-backdrop" aria-label="Close navigation" onClick={() => setMobileOpen(false)} />}
      <aside className={`app-sidebar ${mobileOpen ? 'is-open' : ''}`}>
        <div className="sidebar-head"><Brand href="/dashboard" /><button type="button" onClick={() => setMobileOpen(false)} aria-label="Close navigation"><X size={18} /></button></div>
        <Link to="/surveys/new" className="new-survey-button"><Plus size={16} /> New survey</Link>
        <nav className="app-nav" aria-label="Workspace navigation">
          <span className="nav-label">Workspace</span>
          {navigation.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
            return <Link key={href} to={href} className={active ? 'active' : ''} onClick={() => setMobileOpen(false)}><Icon size={17} />{label}</Link>;
          })}
        </nav>
        <div className="sidebar-spacer" />
        <a className="sidebar-help" href="mailto:support@example.com"><HelpCircle size={16} /> Help & feedback</a>
        <div className="account-chip">
          <span className="account-avatar">{user.name.slice(0, 1).toUpperCase()}</span>
          <div><strong>{user.name}</strong><small>{user.email}</small></div>
          <button type="button" onClick={() => void signOut()} aria-label="Sign out"><LogOut size={16} /></button>
        </div>
      </aside>
      <main className="app-main">{children}</main>
    </div>
  );
}
