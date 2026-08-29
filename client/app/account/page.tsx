'use client';

import { Laptop, LogOut, ShieldCheck } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAuth } from '@/components/auth-provider';
import { useToast } from '@/components/toast';
import { apiRequest, ApiRequestError, setAccessToken } from '@/lib/api';
import { formatDate } from '@/lib/format';

type Session = { id: string; deviceInfo: { userAgent?: string } | string | null; ipAddress: string; createdAt: string; lastUsedAt: string; isCurrent: boolean };

const sessionDevice = (deviceInfo: Session['deviceInfo']) => {
  if (typeof deviceInfo === 'string') return deviceInfo;
  return deviceInfo?.userAgent || 'Unknown browser';
};

export default function AccountPage() {
  const { user, signOut } = useAuth(); const { notify } = useToast(); const [sessions, setSessions] = useState<Session[]>([]);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      void apiRequest<{ sessions: Session[] }>('/api/v1/auth/sessions').then((result) => setSessions(result.data.sessions));
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);
  const logoutAll = async () => {
    if (!window.confirm('Sign out every active device, including this one?')) return;
    try { await apiRequest('/api/v1/auth/logout-all', { method: 'POST' }); setAccessToken(null); window.location.href = '/sign-in'; }
    catch (error) { notify(error instanceof ApiRequestError ? error.message : 'Could not sign out all devices.', 'error'); }
  };
  return <div className="workspace-page narrow-page"><header className="workspace-header"><div><p className="section-kicker">Account</p><h1>Your creator profile</h1><p>Identity and active sign-ins for this workspace.</p></div></header>
    <section className="settings-card"><div className="settings-icon"><ShieldCheck size={20} /></div><div><h2>{user?.name}</h2><p>{user?.email}</p><span className={`verification-badge ${user?.isVerified ? 'verified' : ''}`}>{user?.isVerified ? 'Email verified' : 'Verification pending'}</span></div></section>
    <section className="settings-section"><div className="section-heading"><div><h2>Active sessions</h2><p>Devices currently signed in to your account.</p></div></div><div className="session-list">{sessions.map((session) => <article key={session.id}><span><Laptop size={18} /></span><div><strong>{sessionDevice(session.deviceInfo)} {session.isCurrent && <em>Current</em>}</strong><small>{session.ipAddress} · Last active {formatDate(session.lastUsedAt)}</small></div></article>)}</div></section>
    <section className="danger-zone"><div><h2>Session controls</h2><p>End this session, or revoke access from every device.</p></div><div><button type="button" className="button button-quiet bordered" onClick={() => void signOut()}><LogOut size={16} /> Sign out</button><button type="button" className="button danger-button" onClick={() => void logoutAll()}>Sign out everywhere</button></div></section>
  </div>;
}
