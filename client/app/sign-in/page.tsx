'use client';

import { ArrowRight, Eye, EyeOff } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useState, type FormEvent } from 'react';
import { AuthShell } from '@/components/auth-shell';
import { useAuth } from '@/components/auth-provider';
import { ApiRequestError } from '@/lib/api';

export default function SignInPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError(''); setSubmitting(true);
    try {
      await signIn({ email, password });
      const returnTo = searchParams.get('returnTo');
      navigate(returnTo?.startsWith('/') ? returnTo : '/dashboard', { replace: true });
    } catch (requestError) {
      setError(requestError instanceof ApiRequestError ? requestError.message : 'Unable to sign in.');
    } finally { setSubmitting(false); }
  };

  return (
    <AuthShell eyebrow="Welcome back" title="Return to the questions that matter." description="Sign in to build surveys, review responses, and keep your research moving.">
      <form className="auth-form" onSubmit={(event) => void submit(event)}>
        <div className="form-heading"><h2>Sign in</h2><p>Use your creator account to continue.</p></div>
        {error && <div className="form-error" role="alert">{error}</div>}
        <label className="field"><span>Email address</span><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" placeholder="you@company.com" required /></label>
        <label className="field"><span>Password</span><div className="password-field"><input type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" minLength={8} required /><button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></div></label>
        <button className="button button-accent auth-submit" disabled={submitting}>{submitting ? 'Signing in…' : <>Sign in <ArrowRight size={16} /></>}</button>
        <p className="auth-switch">New to Dynamic? <Link to="/sign-up">Create an account</Link></p>
      </form>
    </AuthShell>
  );
}
