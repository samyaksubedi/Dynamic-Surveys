'use client';

import { CheckCircle2, CircleAlert } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Brand } from '@/components/brand';
import { apiRequest, ApiRequestError } from '@/lib/api';

export default function VerifyPage() {
  const params = useParams<{ token: string }>();
  const [state, setState] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verifying your email address…');

  useEffect(() => {
    void apiRequest(`/api/v1/auth/verify/${params.token ?? ''}`, {}, { auth: false })
      .then(() => { setState('success'); setMessage('Your email is verified. You can now sign in and start building.'); })
      .catch((error: unknown) => { setState('error'); setMessage(error instanceof ApiRequestError ? error.message : 'This verification link could not be used.'); });
  }, [params.token]);

  return (
    <main className="centered-state"><Brand /><div className="state-card">{state === 'loading' && <span className="state-spinner" />}{state === 'success' && <CheckCircle2 size={32} />}{state === 'error' && <CircleAlert size={32} />}<h1>{state === 'loading' ? 'One moment' : state === 'success' ? 'Email verified' : 'Verification failed'}</h1><p>{message}</p>{state !== 'loading' && <Link to="/sign-in" className="button button-dark">Continue to sign in</Link>}</div></main>
  );
}
