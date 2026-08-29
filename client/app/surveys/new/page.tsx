'use client';

import { LoaderCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import { useToast } from '@/components/toast';
import { apiRequest, ApiRequestError } from '@/lib/api';
import type { Survey } from '@/lib/types';

export default function NewSurveyPage() {
  const navigate = useNavigate(); const { notify } = useToast(); const started = useRef(false);
  useEffect(() => {
    if (started.current) return; started.current = true;
    void apiRequest<{ survey: Survey }>('/api/v1/surveys', { method: 'POST', body: JSON.stringify({ title: 'Untitled survey', description: '', schema: { questions: [] }, acceptingResponses: true }) })
      .then((response) => navigate(`/surveys/${response.data.survey.id}`, { replace: true }))
      .catch((error) => { notify(error instanceof ApiRequestError ? error.message : 'Could not create survey.', 'error'); navigate('/dashboard', { replace: true }); });
  }, [navigate, notify]);
  return <div className="page-loading"><LoaderCircle className="spin" size={24} /><p>Preparing a fresh survey…</p></div>;
}
