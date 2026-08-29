import { CheckCircle2, CircleAlert, LoaderCircle } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { useState } from 'react';
import { Brand } from '@/components/brand';
import { apiRequest, ApiRequestError } from '@/lib/api';

export default function VerifyPage() {
  const params = useParams<{ token: string }>();
  const [state, setState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('Verify your email to unlock your survey workspace.');

  const verify = async () => {
    if (!params.token || state === 'loading' || state === 'success') return;
    setState('loading');
    try {
      const response = await apiRequest(`/api/v1/auth/verify/${params.token}`, {}, { auth: false });
      setState('success');
      setMessage(response.message);
    } catch (error: unknown) {
      setState('error');
      setMessage(error instanceof ApiRequestError ? error.message : 'This verification link could not be used.');
    }
  };

  return (
    <main className="verification-page">
      <Brand />
      <section className="verification-card" aria-live="polite">
        <span className={`verification-icon ${state}`}>
          {state === 'loading' ? <LoaderCircle className="spin" size={27} /> : state === 'error' ? <CircleAlert size={27} /> : <CheckCircle2 size={27} />}
        </span>
        <p className="section-kicker">Email verification</p>
        <h1>{state === 'success' ? 'You’re verified.' : state === 'error' ? 'This link needs attention.' : 'Confirm your account.'}</h1>
        <p>{message}</p>
        {state === 'success' ? (
          <Link to="/sign-in" className="button button-dark">Continue to sign in</Link>
        ) : (
          <button type="button" className="button button-accent" onClick={() => void verify()} disabled={state === 'loading' || !params.token}>
            {state === 'loading' ? <><LoaderCircle className="spin" size={16} /> Verifying…</> : 'Verify email'}
          </button>
        )}
      </section>
    </main>
  );
}
