'use client';

import { ArrowUpRight, Copy, FileText, MoreHorizontal, Plus, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCallback, useEffect, useState } from 'react';
import { EmptyState } from '@/components/empty-state';
import { useToast } from '@/components/toast';
import { apiRequest, ApiRequestError } from '@/lib/api';
import { formatDate } from '@/lib/format';
import type { Survey } from '@/lib/types';

export default function DashboardPage() {
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [loading, setLoading] = useState(true);
  const [menu, setMenu] = useState<string | null>(null);
  const { notify } = useToast();

  const load = useCallback(async () => {
    try {
      const response = await apiRequest<{ surveys: Survey[] }>('/api/v1/surveys');
      setSurveys(response.data.surveys);
    } catch (error) {
      notify(error instanceof ApiRequestError ? error.message : 'Could not load surveys.', 'error');
    } finally { setLoading(false); }
  }, [notify]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const toggle = async (survey: Survey) => {
    try {
      const response = await apiRequest<{ survey: Survey }>(`/api/v1/surveys/${survey.id}/accepting-responses`, { method: 'PATCH', body: JSON.stringify({ acceptingResponses: !survey.acceptingResponses }) });
      setSurveys((items) => items.map((item) => item.id === survey.id ? { ...item, acceptingResponses: response.data.survey.acceptingResponses } : item));
      notify(response.data.survey.acceptingResponses ? 'Survey reopened.' : 'Survey closed.');
    } catch (error) { notify(error instanceof ApiRequestError ? error.message : 'Could not update survey.', 'error'); }
  };

  const remove = async (survey: Survey) => {
    if (!window.confirm(`Delete “${survey.title}” and all of its responses? This cannot be undone.`)) return;
    try {
      await apiRequest(`/api/v1/surveys/${survey.id}`, { method: 'DELETE' });
      setSurveys((items) => items.filter((item) => item.id !== survey.id));
      notify('Survey deleted.');
    } catch (error) { notify(error instanceof ApiRequestError ? error.message : 'Could not delete survey.', 'error'); }
  };

  const copyLink = async (survey: Survey) => {
    await navigator.clipboard.writeText(`${window.location.origin}/s/${survey.id}`);
    notify('Public link copied.'); setMenu(null);
  };

  return <div className="workspace-page">
    <header className="workspace-header"><div><p className="section-kicker">Workspace</p><h1>Your surveys</h1><p>Create focused surveys and follow each response from one place.</p></div><Link className="button button-accent" to="/surveys/new"><Plus size={16} /> New survey</Link></header>
    <div className="workspace-toolbar"><span>{surveys.length} {surveys.length === 1 ? 'survey' : 'surveys'}</span><span className="toolbar-note">Newest first</span></div>
    {loading ? <div className="survey-grid">{[1,2,3].map((item) => <div className="survey-card skeleton" key={item} />)}</div> : surveys.length === 0 ? <EmptyState icon={FileText} title="Begin with one good question" description="Your surveys will live here. Create one, shape its logic, then share a quiet public form." action={<Link className="button button-dark" to="/surveys/new"><Plus size={16} /> Create a survey</Link>} /> : <div className="survey-grid">
      {surveys.map((survey) => <article className="survey-card" key={survey.id}>
        <div className="survey-card-top"><span className={`status-pill ${survey.acceptingResponses ? 'is-live' : ''}`}><i />{survey.acceptingResponses ? 'Accepting' : 'Closed'}</span><div className="card-menu"><button type="button" onClick={() => setMenu(menu === survey.id ? null : survey.id)} aria-label="Survey actions"><MoreHorizontal size={18} /></button>{menu === survey.id && <div className="card-menu-popover"><button type="button" onClick={() => void copyLink(survey)}><Copy size={15} /> Copy public link</button><button type="button" onClick={() => void toggle(survey)}>{survey.acceptingResponses ? 'Close responses' : 'Reopen responses'}</button><button type="button" className="danger" onClick={() => void remove(survey)}><Trash2 size={15} /> Delete</button></div>}</div></div>
        <Link to={`/surveys/${survey.id}`} className="survey-card-body"><h2>{survey.title}</h2><p>{survey.description || 'No description yet.'}</p></Link>
        <div className="survey-card-meta"><span><strong>{survey.schema.questions.length}</strong> questions</span><span><strong>{survey.submittedResponseCount ?? 0}</strong> responses</span></div>
        <div className="survey-card-footer"><small>Updated {formatDate(survey.updatedAt)}</small><Link to={`/surveys/${survey.id}`} aria-label={`Open ${survey.title}`}><ArrowUpRight size={17} /></Link></div>
      </article>)}
    </div>}
  </div>;
}
