import type { ReactNode } from 'react';
import { Brand } from './brand';

export function AuthShell({ eyebrow, title, description, children }: { eyebrow: string; title: string; description: string; children: ReactNode }) {
  return (
    <main className="auth-page">
      <header className="auth-header"><Brand /></header>
      <section className="auth-grid">
        <div className="auth-copy">
          <p className="eyebrow">{eyebrow}</p>
          <h1>{title}</h1>
          <p>{description}</p>
          <div className="auth-quote"><blockquote>“The questions feel intentional, and the answers are finally easy to read.”</blockquote><span>— Product research team</span></div>
        </div>
        <div className="auth-card">{children}</div>
      </section>
    </main>
  );
}
