'use client';

import { ArrowRight, Check, CheckCircle2, CircleAlert, LoaderCircle, LockKeyhole } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Brand } from './brand';
import { apiRequest, ApiRequestError } from '@/lib/api';
import { firstValidationError, sanitizeAnswers, visibleQuestions } from '@/lib/survey';
import type { Answers, ResponseState, Survey, SurveyQuestion } from '@/lib/types';

type SaveState = 'idle' | 'saving' | 'saved' | 'error';

function AnswerField({ question, value, disabled, onChange }: { question: SurveyQuestion; value: Answers[string] | undefined; disabled: boolean; onChange: (answer: Answers[string]) => void }) {
  if (question.type === 'text') return <textarea className="public-textarea" rows={5} maxLength={question.maxLength} value={typeof value === 'string' ? value : ''} disabled={disabled} placeholder="Type your answer…" onChange={(event) => onChange(event.target.value)} />;
  if (question.type === 'rating') return <div className="rating-options">{[1,2,3,4,5].map((rating) => <button type="button" key={rating} disabled={disabled} className={value === rating ? 'selected' : ''} onClick={() => onChange(rating)}><span>{rating}</span><small>{rating === 1 ? 'Low' : rating === 5 ? 'High' : ''}</small></button>)}</div>;
  if (question.type === 'singleSelect') return <div className="choice-list">{question.options.map((option) => <label className={value === option.id ? 'selected' : ''} key={option.id}><input type="radio" name={question.id} disabled={disabled} checked={value === option.id} onChange={() => onChange(option.id)} /><i /><span>{option.label}</span></label>)}</div>;
  const selected = Array.isArray(value) ? value : [];
  return <div className="choice-list multi">{question.options.map((option) => <label className={selected.includes(option.id) ? 'selected' : ''} key={option.id}><input type="checkbox" disabled={disabled} checked={selected.includes(option.id)} onChange={(event) => onChange(event.target.checked ? [...selected, option.id] : selected.filter((id) => id !== option.id))} /><i><Check size={13} /></i><span>{option.label}</span></label>)}</div>;
}

export function PublicSurvey({ surveyId }: { surveyId: string }) {
  const [survey, setSurvey] = useState<Survey | null>(null); const [response, setResponse] = useState<ResponseState | null>(null);
  const [answers, setAnswers] = useState<Answers>({}); const [loading, setLoading] = useState(true); const [submitting, setSubmitting] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>('idle'); const [error, setError] = useState(''); const hydrated = useRef(false);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const surveyResult = await apiRequest<{ survey: Survey }>(`/api/v1/public/surveys/${surveyId}`, {}, { auth: false });
        if (!active) return; setSurvey(surveyResult.data.survey);
        const responseResult = await apiRequest<{ response: ResponseState }>(`/api/v1/public/surveys/${surveyId}/response`, {}, { auth: false });
        if (!active) return; setResponse(responseResult.data.response); setAnswers(responseResult.data.response.answers); hydrated.current = true;
      } catch (requestError) { if (active) setError(requestError instanceof ApiRequestError ? requestError.message : 'This survey could not be loaded.'); }
      finally { if (active) setLoading(false); }
    })();
    return () => { active = false; };
  }, [surveyId]);

  const visible = useMemo(() => survey ? visibleQuestions(survey.schema.questions, answers) : [], [survey, answers]);
  const readonly = !survey?.acceptingResponses || response?.status === 'SUBMITTED';

  const saveDraft = useCallback(async (nextAnswers: Answers) => {
    if (!survey?.acceptingResponses || response?.status === 'SUBMITTED') return;
    setSaveState('saving');
    try {
      const result = await apiRequest<{ response: ResponseState }>(`/api/v1/public/surveys/${surveyId}/response`, { method: 'PUT', body: JSON.stringify({ answers: nextAnswers }) }, { auth: false });
      setResponse(result.data.response); setSaveState('saved');
    } catch { setSaveState('error'); }
  }, [survey, response?.status, surveyId]);

  useEffect(() => {
    if (!hydrated.current || readonly) return;
    const timer = window.setTimeout(() => void saveDraft(answers), 850);
    return () => window.clearTimeout(timer);
  }, [answers, readonly, saveDraft]);

  const changeAnswer = (questionId: string, value: Answers[string]) => {
    if (!survey) return; setError('');
    const next = sanitizeAnswers(survey.schema.questions, { ...answers, [questionId]: value });
    setAnswers(next); setSaveState('idle');
  };

  const submit = async () => {
    if (!survey) return;
    const validationError = firstValidationError(survey.schema.questions, answers);
    if (validationError) { setError(validationError); return; }
    setSubmitting(true); setError('');
    try {
      const result = await apiRequest<{ response: ResponseState }>(`/api/v1/public/surveys/${surveyId}/submissions`, { method: 'POST', body: JSON.stringify({ answers: sanitizeAnswers(survey.schema.questions, answers) }) }, { auth: false });
      setResponse(result.data.response); window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (requestError) { setError(requestError instanceof ApiRequestError ? requestError.message : 'Could not submit your response.'); }
    finally { setSubmitting(false); }
  };

  if (loading) return <div className="public-loading"><LoaderCircle className="spin" size={24} /><p>Restoring your survey…</p></div>;
  if (!survey) return <main className="public-shell"><div className="public-error-page"><CircleAlert size={24} /><h1>Survey unavailable</h1><p>{error}</p><Link to="/">Return home</Link></div></main>;
  if (response?.status === 'SUBMITTED') return <main className="public-shell"><header className="public-nav"><Brand /><span>Response received</span></header><section className="completion-card"><span><CheckCircle2 size={26} /></span><p className="section-kicker">Complete</p><h1>Thank you for sharing.</h1><p>Your response to “{survey.title}” has been submitted. There’s nothing else you need to do.</p><Link to="/" className="text-link">Built with Dynamic Surveys <ArrowRight size={14} /></Link></section></main>;

  const answered = visible.filter((question) => { const value = answers[question.id]; return value !== undefined && value !== '' && (!Array.isArray(value) || value.length > 0); }).length;
  return <main className="public-shell"><header className="public-nav"><Brand /><div>{saveState === 'saving' ? 'Saving draft…' : saveState === 'saved' ? 'Draft saved' : saveState === 'error' ? 'Draft not saved' : 'Anonymous response'}</div></header>
    <div className="public-progress"><span style={{ width: `${visible.length ? (answered / visible.length) * 100 : 0}%` }} /></div>
    <div className="public-layout"><aside className="public-context"><p className="section-kicker">Survey</p><h1>{survey.title}</h1><p>{survey.description || 'Your thoughtful response is appreciated.'}</p><div className="privacy-note"><LockKeyhole size={16} /><span>Your draft is stored anonymously in this browser.</span></div></aside>
      <section className="public-form">
        {!survey.acceptingResponses && <div className="closed-notice"><CircleAlert size={18} /><div><strong>This survey is currently closed.</strong><p>You can review a saved draft, but answers cannot be changed or submitted until it reopens.</p></div></div>}
        {error && <div className="form-error" role="alert">{error}</div>}
        {visible.length === 0 ? <div className="public-empty"><p>This survey has no questions yet.</p></div> : visible.map((question, index) => <article className="public-question" key={question.id}><div className="public-question-head"><span>{String(index + 1).padStart(2, '0')}</span><div><h2>{question.label}</h2>{question.required && <small>Required</small>}</div></div><AnswerField question={question} value={answers[question.id]} disabled={readonly} onChange={(value) => changeAnswer(question.id, value)} /></article>)}
        <footer className="public-submit"><div><strong>{answered} of {visible.length}</strong><span>questions answered</span></div><button type="button" className="button button-accent button-large" disabled={readonly || submitting || visible.length === 0} onClick={() => void submit()}>{submitting ? 'Submitting…' : <>Submit response <ArrowRight size={17} /></>}</button></footer>
      </section>
    </div>
  </main>;
}
