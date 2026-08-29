'use client';

import { closestCenter, DndContext, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { arrayMove, sortableKeyboardCoordinates, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ArrowLeft, BarChart3, Check, ExternalLink, FileText, GripVertical, ListChecks, MessageSquareText, Save, Star, ToggleLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCallback, useEffect, useState } from 'react';
import { useToast } from './toast';
import { QuestionEditor } from './question-editor';
import { apiRequest, ApiRequestError } from '@/lib/api';
import { createQuestion, hasValidDependencyOrder, questionTypeLabel } from '@/lib/survey';
import type { QuestionType, Survey, SurveyAnalytics, SurveyQuestion } from '@/lib/types';

const typeTools: Array<{ type: QuestionType; label: string; icon: typeof MessageSquareText }> = [
  { type: 'text', label: 'Text answer', icon: MessageSquareText },
  { type: 'singleSelect', label: 'Single select', icon: ListChecks },
  { type: 'multiSelect', label: 'Multiple select', icon: ToggleLeft },
  { type: 'rating', label: 'Rating', icon: Star },
];

function SortableQuestion({ question, index, selected, locked, onSelect }: { question: SurveyQuestion; index: number; selected: boolean; locked: boolean; onSelect: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: question.id, disabled: locked });
  return <button ref={setNodeRef} type="button" style={{ transform: CSS.Transform.toString(transform), transition }} className={`builder-question ${selected ? 'selected' : ''} ${isDragging ? 'dragging' : ''}`} onClick={onSelect}>
    <span className="builder-drag" {...attributes} {...listeners} onClick={(event) => event.stopPropagation()}><GripVertical size={18} /></span><span className="builder-number">{String(index + 1).padStart(2, '0')}</span><span className="builder-question-copy"><strong>{question.label || 'Untitled question'}</strong><small>{questionTypeLabel[question.type]}{question.required ? ' · Required' : ''}</small></span>{question.condition && <span className="logic-badge">Logic</span>}
  </button>;
}

export function SurveyBuilder({ surveyId }: { surveyId: string }) {
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [title, setTitle] = useState(''); const [description, setDescription] = useState('');
  const [questions, setQuestions] = useState<SurveyQuestion[]>([]); const [selectedId, setSelectedId] = useState<string | null>(null);
  const [savedMetadata, setSavedMetadata] = useState(''); const [savedSchema, setSavedSchema] = useState('');
  const [locked, setLocked] = useState(false); const [loading, setLoading] = useState(true); const [saving, setSaving] = useState(false);
  const { notify } = useToast();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

  const load = useCallback(async () => {
    try {
      const [surveyResponse, analyticsResponse] = await Promise.all([
        apiRequest<{ survey: Survey }>(`/api/v1/surveys/${surveyId}`),
        apiRequest<{ analytics: SurveyAnalytics }>(`/api/v1/surveys/${surveyId}/analytics`),
      ]);
      const next = surveyResponse.data.survey; setSurvey(next); setTitle(next.title); setDescription(next.description); setQuestions(next.schema.questions);
      setSavedMetadata(JSON.stringify([next.title, next.description])); setSavedSchema(JSON.stringify(next.schema.questions)); setLocked(analyticsResponse.data.analytics.totalSubmittedResponses > 0);
      setSelectedId(next.schema.questions[0]?.id ?? null);
    } catch (error) { notify(error instanceof ApiRequestError ? error.message : 'Could not open this survey.', 'error'); }
    finally { setLoading(false); }
  }, [surveyId, notify]);
  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const metadataDirty = savedMetadata !== JSON.stringify([title, description]);
  const schemaDirty = savedSchema !== JSON.stringify(questions);
  const dirty = metadataDirty || schemaDirty;
  const selectedIndex = questions.findIndex((question) => question.id === selectedId);
  const selected = selectedIndex >= 0 ? questions[selectedIndex] : null;

  const updateSelected = (next: SurveyQuestion) => setQuestions((items) => {
    const previous = items.find((item) => item.id === next.id);
    const removedOptionIds = previous && 'options' in previous && 'options' in next
      ? new Set(previous.options.filter((option) => !next.options.some((candidate) => candidate.id === option.id)).map((option) => option.id))
      : new Set<string>();
    return items.map((item) => {
      if (item.id === next.id) return next;
      if (item.condition?.sourceQuestionId === next.id && removedOptionIds.has(String(item.condition.value))) {
        const withoutCondition = { ...item };
        delete withoutCondition.condition;
        return withoutCondition;
      }
      return item;
    });
  });
  const addQuestion = (type: QuestionType) => {
    if (locked) return; const question = createQuestion(type); setQuestions((items) => [...items, question]); setSelectedId(question.id);
  };
  const deleteSelected = () => {
    if (!selected || locked) return;
    const dependent = questions.find((item) => item.condition?.sourceQuestionId === selected.id);
    if (dependent) { notify(`Remove the condition from “${dependent.label}” first.`, 'error'); return; }
    setQuestions((items) => items.filter((item) => item.id !== selected.id)); setSelectedId(questions.find((item) => item.id !== selected.id)?.id ?? null);
  };
  const dragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id || locked) return;
    const from = questions.findIndex((item) => item.id === active.id); const to = questions.findIndex((item) => item.id === over.id);
    const reordered = arrayMove(questions, from, to);
    if (!hasValidDependencyOrder(reordered)) { notify('A controlling question must stay above the question that depends on it.', 'error'); return; }
    setQuestions(reordered);
  };

  const save = async () => {
    if (!survey || !dirty) return;
    if (!title.trim()) { notify('Give your survey a title before saving.', 'error'); return; }
    const empty = questions.find((question) => !question.label.trim() || ('options' in question && question.options.some((option) => !option.label.trim())));
    if (empty) { notify('Every question and option needs a label.', 'error'); setSelectedId(empty.id); return; }
    setSaving(true);
    try {
      if (metadataDirty) { await apiRequest(`/api/v1/surveys/${surveyId}/metadata`, { method: 'PATCH', body: JSON.stringify({ title: title.trim(), description: description.trim() }) }); setTitle(title.trim()); setDescription(description.trim()); setSavedMetadata(JSON.stringify([title.trim(), description.trim()])); }
      if (schemaDirty) { await apiRequest(`/api/v1/surveys/${surveyId}/schema`, { method: 'PUT', body: JSON.stringify({ questions }) }); setSavedSchema(JSON.stringify(questions)); }
      notify('All changes saved.');
    } catch (error) { notify(error instanceof ApiRequestError ? error.message : 'Could not save changes.', 'error'); }
    finally { setSaving(false); }
  };

  const toggleAccepting = async () => {
    if (!survey) return;
    try { const result = await apiRequest<{ survey: Survey }>(`/api/v1/surveys/${surveyId}/accepting-responses`, { method: 'PATCH', body: JSON.stringify({ acceptingResponses: !survey.acceptingResponses }) }); setSurvey({ ...survey, acceptingResponses: result.data.survey.acceptingResponses }); notify(result.data.survey.acceptingResponses ? 'Survey is accepting responses.' : 'Survey is now closed.'); }
    catch (error) { notify(error instanceof ApiRequestError ? error.message : 'Could not update survey.', 'error'); }
  };

  if (loading) return <div className="page-loading"><span className="loading-mark">D</span><p>Opening the builder…</p></div>;
  if (!survey) return <div className="page-loading"><p>Survey unavailable.</p><Link to="/dashboard">Return to surveys</Link></div>;

  return <div className="builder-page">
    <header className="builder-topbar"><Link to="/dashboard" className="icon-button" aria-label="Back to surveys"><ArrowLeft size={18} /></Link><div className="builder-title"><input value={title} maxLength={200} onChange={(event) => setTitle(event.target.value)} aria-label="Survey title" /><span>{dirty ? 'Unsaved changes' : 'All changes saved'}</span></div><div className="builder-actions"><button type="button" className={`response-toggle ${survey.acceptingResponses ? 'active' : ''}`} onClick={() => void toggleAccepting()}><i />{survey.acceptingResponses ? 'Accepting responses' : 'Responses closed'}</button><Link className="icon-button" to={`/s/${surveyId}`} target="_blank" aria-label="Preview public survey"><ExternalLink size={17} /></Link><Link className="button button-quiet bordered" to={`/surveys/${surveyId}/analytics`}><BarChart3 size={16} /> Analytics</Link><button className="button button-accent" type="button" disabled={!dirty || saving} onClick={() => void save()}>{saving ? 'Saving…' : <><Save size={16} /> Save</>}</button></div></header>
    {locked && <div className="builder-lock-banner"><Check size={16} /><span>The question structure is locked after the first submission. You can still edit the title, description, and response availability.</span></div>}
    <div className="builder-workspace">
      <aside className="builder-toolbox"><div><span className="toolbox-label">Question types</span>{typeTools.map(({ type, label, icon: Icon }) => <button type="button" key={type} disabled={locked} onClick={() => addQuestion(type)}><Icon size={17} /><span>{label}</span></button>)}</div><div className="toolbox-tip"><GripVertical size={16} /><p>Drag questions to reorder. Stable IDs keep answers and logic intact.</p></div></aside>
      <main className="builder-canvas"><div className="survey-metadata"><label className="field"><span>Description</span><textarea value={description} maxLength={2000} rows={2} placeholder="Tell respondents what this survey is about…" onChange={(event) => setDescription(event.target.value)} /></label></div><div className="canvas-heading"><div><h2>Survey structure</h2><p>{questions.length} {questions.length === 1 ? 'question' : 'questions'} · Drag to reorder</p></div></div>
        {questions.length === 0 ? <div className="builder-empty"><FileText size={23} /><h3>Add your first question</h3><p>Choose a question type from the left. You can refine it here and add conditional logic later.</p></div> : <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={dragEnd}><SortableContext items={questions.map((item) => item.id)} strategy={verticalListSortingStrategy}><div className="builder-list">{questions.map((question, index) => <SortableQuestion key={question.id} question={question} index={index} selected={question.id === selectedId} locked={locked} onSelect={() => setSelectedId(question.id)} />)}</div></SortableContext></DndContext>}
      </main>
      {selected ? <QuestionEditor question={selected} previousQuestions={questions.slice(0, selectedIndex)} locked={locked} onChange={updateSelected} onDelete={deleteSelected} onClose={() => setSelectedId(null)} /> : <aside className="question-inspector inspector-empty"><p>Select a question to edit its wording, options, and conditional logic.</p></aside>}
    </div>
  </div>;
}
