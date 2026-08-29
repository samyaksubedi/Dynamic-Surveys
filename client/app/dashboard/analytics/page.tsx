'use client';

import { BarChart3, FileText, Radio } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { apiRequest } from '@/lib/api';
import type { Survey } from '@/lib/types';

export default function AnalyticsOverviewPage() {
  const [surveys, setSurveys] = useState<Survey[]>([]);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      void apiRequest<{ surveys: Survey[] }>('/api/v1/surveys').then((result) => setSurveys(result.data.surveys));
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);
  const responses = surveys.reduce((sum, survey) => sum + (survey.submittedResponseCount ?? 0), 0);
  const live = surveys.filter((survey) => survey.acceptingResponses).length;
  return <div className="workspace-page"><header className="workspace-header"><div><p className="section-kicker">Overview</p><h1>Response pulse</h1><p>A calm overview across every survey in this workspace.</p></div></header>
    <div className="metric-grid"><article><span><FileText size={18} /></span><strong>{surveys.length}</strong><p>Total surveys</p></article><article><span><BarChart3 size={18} /></span><strong>{responses}</strong><p>Submitted responses</p></article><article><span><Radio size={18} /></span><strong>{live}</strong><p>Currently accepting</p></article></div>
    <section className="overview-list"><div className="section-heading"><div><h2>Survey performance</h2><p>Only completed submissions are counted.</p></div></div>{surveys.map((survey) => <Link to={`/surveys/${survey.id}/analytics`} key={survey.id}><div><strong>{survey.title}</strong><small>{survey.schema.questions.length} questions</small></div><span>{survey.submittedResponseCount ?? 0} responses</span></Link>)}</section>
  </div>;
}
