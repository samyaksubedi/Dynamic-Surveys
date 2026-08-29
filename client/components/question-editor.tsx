'use client';

import { Plus, Trash2, X } from 'lucide-react';
import { getDefaultCondition, questionTypeLabel } from '@/lib/survey';
import type { SurveyQuestion } from '@/lib/types';

type Props = {
  question: SurveyQuestion;
  previousQuestions: SurveyQuestion[];
  locked: boolean;
  onChange: (question: SurveyQuestion) => void;
  onDelete: () => void;
  onClose: () => void;
};

export function QuestionEditor({ question, previousQuestions, locked, onChange, onDelete, onClose }: Props) {
  const changeSource = (sourceId: string) => {
    if (!sourceId) {
      const withoutCondition = { ...question };
      delete withoutCondition.condition;
      onChange(withoutCondition);
      return;
    }
    const source = previousQuestions.find((item) => item.id === sourceId);
    if (source) onChange({ ...question, condition: getDefaultCondition(source) });
  };
  const source = previousQuestions.find((item) => item.id === question.condition?.sourceQuestionId);

  return <aside className="question-inspector">
    <div className="inspector-head"><div><span>Question settings</span><strong>{questionTypeLabel[question.type]}</strong></div><button type="button" onClick={onClose} aria-label="Close settings"><X size={18} /></button></div>
    {locked && <div className="locked-note">Question settings are read-only because this survey has submitted responses.</div>}
    <div className="inspector-section">
      <label className="field"><span>Question label</span><textarea value={question.label} maxLength={500} disabled={locked} onChange={(event) => onChange({ ...question, label: event.target.value })} rows={3} /></label>
      <label className="toggle-row"><div><strong>Required answer</strong><small>Respondents must answer when visible.</small></div><input type="checkbox" checked={question.required} disabled={locked} onChange={(event) => onChange({ ...question, required: event.target.checked })} /></label>
    </div>

    {question.type === 'text' && <div className="inspector-section"><label className="field"><span>Maximum characters</span><input type="number" min={1} max={5000} value={question.maxLength} disabled={locked} onChange={(event) => onChange({ ...question, maxLength: Math.min(5000, Math.max(1, Number(event.target.value))) })} /></label></div>}

    {(question.type === 'singleSelect' || question.type === 'multiSelect') && <div className="inspector-section"><div className="field-label"><span>Answer options</span><small>IDs stay stable when labels change.</small></div><div className="option-editor-list">{question.options.map((option, index) => <div key={option.id}><span>{index + 1}</span><input value={option.label} maxLength={200} disabled={locked} onChange={(event) => onChange({ ...question, options: question.options.map((item) => item.id === option.id ? { ...item, label: event.target.value } : item) })} /><button type="button" disabled={locked || question.options.length <= 2} onClick={() => onChange({ ...question, options: question.options.filter((item) => item.id !== option.id) })} aria-label={`Delete ${option.label}`}><Trash2 size={15} /></button></div>)}</div><button type="button" className="inline-add" disabled={locked || question.options.length >= 50} onClick={() => onChange({ ...question, options: [...question.options, { id: crypto.randomUUID(), label: `Option ${question.options.length + 1}` }] })}><Plus size={15} /> Add option</button></div>}

    <div className="inspector-section"><div className="field-label"><span>Conditional logic</span><small>Only show this question when…</small></div><label className="field"><span>Controlling question</span><select value={question.condition?.sourceQuestionId ?? ''} disabled={locked || previousQuestions.length === 0} onChange={(event) => changeSource(event.target.value)}><option value="">Always show</option>{previousQuestions.map((item) => <option value={item.id} key={item.id}>{item.label || 'Untitled question'}</option>)}</select></label>
      {question.condition && source && <div className="condition-value"><span>{question.condition.operator === 'includes' ? 'includes' : 'equals'}</span>{source.type === 'singleSelect' || source.type === 'multiSelect' ? <select disabled={locked} value={String(question.condition.value)} onChange={(event) => onChange({ ...question, condition: { ...question.condition!, value: event.target.value } })}>{source.options.map((option) => <option value={option.id} key={option.id}>{option.label}</option>)}</select> : source.type === 'rating' ? <select disabled={locked} value={Number(question.condition.value)} onChange={(event) => onChange({ ...question, condition: { ...question.condition!, value: Number(event.target.value) } })}>{[1,2,3,4,5].map((rating) => <option value={rating} key={rating}>{rating}</option>)}</select> : <input disabled={locked} value={String(question.condition.value)} placeholder="Expected text" maxLength={5000} onChange={(event) => onChange({ ...question, condition: { ...question.condition!, value: event.target.value } })} />}</div>}
    </div>
    <div className="inspector-footer"><button type="button" className="delete-question" disabled={locked} onClick={onDelete}><Trash2 size={15} /> Delete question</button></div>
  </aside>;
}
