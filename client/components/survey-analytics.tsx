'use client';

import { ArrowLeft, BarChart3, FileText, MessageSquareText, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCallback, useEffect, useState } from 'react';
import { useToast } from './toast';
import { apiRequest, ApiRequestError } from '@/lib/api';
import type { Survey, SurveyAnalytics as Analytics } from '@/lib/types';

export function SurveyAnalytics({ surveyId }: { surveyId: string }) {
  const [survey, setSurvey] = useState<Survey | null>(null); const [analytics, setAnalytics] = useState<Analytics | null>(null); const [loading, setLoading] = useState(true); const { notify } = useToast();
  const load = useCallback(async () => {
    try { const [surveyResult, analyticsResult] = await Promise.all([apiRequest<{ survey: Survey }>(`/api/v1/surveys/${surveyId}`), apiRequest<{ analytics: Analytics }>(`/api/v1/surveys/${surveyId}/analytics`)]); setSurvey(surveyResult.data.survey); setAnalytics(analyticsResult.data.analytics); }
    catch (error) { notify(error instanceof ApiRequestError ? error.message : 'Could not load analytics.', 'error'); }
    finally { setLoading(false); }
  }, [surveyId, notify]);
  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);
  if (loading) return <div className="page-loading"><span className="loading-mark">D</span><p>Reading the signal…</p></div>;
  if (!survey || !analytics) return <div className="page-loading"><p>Analytics unavailable.</p></div>;
  return <div className="workspace-page analytics-page"><header className="workspace-header analytics-header"><div><Link to={`/surveys/${surveyId}`} className="back-link"><ArrowLeft size={15} /> Back to builder</Link><p className="section-kicker">Analytics</p><h1>{survey.title}</h1><p>Only complete submissions are included in these results.</p></div></header>
    <div className="analytics-summary"><article><span><BarChart3 size={19} /></span><div><strong>{analytics.totalSubmittedResponses}</strong><p>Total submitted responses</p></div></article><article><span><FileText size={19} /></span><div><strong>{analytics.questions.length}</strong><p>Questions in this survey</p></div></article></div>
    <div className="analytics-list">{analytics.questions.map((question, index) => <section className="analytics-card" key={question.id}><header><span>{String(index + 1).padStart(2, '0')}</span><div><h2>{question.label}</h2><p>{question.type === 'text' ? 'Text responses' : question.type === 'rating' ? 'Average rating' : 'Answer distribution'}</p></div></header>
      {question.type === 'text' ? question.answers.length ? <div className="text-responses">{question.answers.map((answer, answerIndex) => <blockquote key={`${question.id}-${answerIndex}`}><MessageSquareText size={15} /><p>{answer}</p></blockquote>)}</div> : <div className="no-data">No written responses yet.</div> : question.type === 'rating' ? <div className="rating-result"><div><Star size={24} /><strong>{question.average === null ? '—' : question.average.toFixed(1)}</strong><span>/ 5</span></div><p>Based on {question.responseCount} {question.responseCount === 1 ? 'rating' : 'ratings'}</p></div> : <div className="distribution-list">{question.options.map((option) => { const max = Math.max(1, ...question.options.map((item) => item.count)); return <div key={option.id}><div><span>{option.label}</span><strong>{option.count}</strong></div><i><b style={{ width: `${(option.count / max) * 100}%` }} /></i></div>; })}</div>}
    </section>)}</div>
  </div>;
}
