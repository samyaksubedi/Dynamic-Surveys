'use client';

import { ArrowRight, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState, type FormEvent } from 'react';
import { AuthShell } from '@/components/auth-shell';
import { useAuth } from '@/components/auth-provider';
import { ApiRequestError } from '@/lib/api';

export default function SignUpPage() {
  const { signUp } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [complete, setComplete] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault(); setError(''); setSubmitting(true);
    try { await signUp(form); setComplete(true); }
    catch (requestError) { setError(requestError instanceof ApiRequestError ? requestError.message : 'Unable to create your account.'); }
    finally { setSubmitting(false); }
  };

  return (
    <AuthShell eyebrow="Creator access" title="Start with a better question." description="Create adaptive surveys, share them in seconds, and read every response in context.">
      {complete ? (
        <div className="auth-success"><CheckCircle2 size={28} /><h2>Check your inbox</h2><p>We sent a verification link to <strong>{form.email}</strong>. Verify your address before signing in.</p><Link to="/sign-in" className="button button-dark">Go to sign in <ArrowRight size={16} /></Link></div>
      ) : (
        <form className="auth-form" onSubmit={(event) => void submit(event)}>
          <div className="form-heading"><h2>Create your account</h2><p>For survey creators and research teams.</p></div>
          {error && <div className="form-error" role="alert">{error}</div>}
          <label className="field"><span>Your name</span><input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} autoComplete="name" placeholder="Alex Morgan" minLength={2} maxLength={100} required /></label>
          <label className="field"><span>Email address</span><input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} autoComplete="email" placeholder="you@company.com" required /></label>
          <label className="field"><span>Password</span><div className="password-field"><input type={showPassword ? 'text' : 'password'} value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} autoComplete="new-password" minLength={8} maxLength={128} required /><button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></div><small>At least 8 characters.</small></label>
          <button className="button button-accent auth-submit" disabled={submitting}>{submitting ? 'Creating account…' : <>Create account <ArrowRight size={16} /></>}</button>
          <p className="auth-switch">Already have an account? <Link to="/sign-in">Sign in</Link></p>
        </form>
      )}
    </AuthShell>
  );
}
