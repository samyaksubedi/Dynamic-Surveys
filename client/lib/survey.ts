import type { Answers, QuestionCondition, QuestionType, SurveyQuestion } from './types';

const defaultOptions = () => [
  { id: crypto.randomUUID(), label: 'Option 1' },
  { id: crypto.randomUUID(), label: 'Option 2' },
];

export function createQuestion(type: QuestionType): SurveyQuestion {
  const base = { id: crypto.randomUUID(), label: 'Untitled question', required: false };
  if (type === 'text') return { ...base, type, maxLength: 2000 };
  if (type === 'rating') return { ...base, type, min: 1, max: 5 };
  return { ...base, type, options: defaultOptions() };
}

export const questionTypeLabel: Record<QuestionType, string> = {
  text: 'Text answer',
  singleSelect: 'Single select',
  multiSelect: 'Multiple select',
  rating: 'Rating',
};

export function conditionMatches(condition: QuestionCondition, answers: Answers) {
  const sourceAnswer = answers[condition.sourceQuestionId];
  return condition.operator === 'includes'
    ? Array.isArray(sourceAnswer) && sourceAnswer.includes(String(condition.value))
    : sourceAnswer === condition.value;
}

export function visibleQuestions(questions: SurveyQuestion[], answers: Answers) {
  const visibleIds = new Set<string>();
  return questions.filter((question) => {
    const visible = !question.condition || (visibleIds.has(question.condition.sourceQuestionId) && conditionMatches(question.condition, answers));
    if (visible) visibleIds.add(question.id);
    return visible;
  });
}

export function sanitizeAnswers(questions: SurveyQuestion[], answers: Answers): Answers {
  const visible = new Set(visibleQuestions(questions, answers).map((question) => question.id));
  return Object.fromEntries(Object.entries(answers).filter(([questionId]) => visible.has(questionId)));
}

export function hasValidDependencyOrder(questions: SurveyQuestion[]) {
  const indexes = new Map(questions.map((question, index) => [question.id, index]));
  return questions.every((question, index) => {
    if (!question.condition) return true;
    const sourceIndex = indexes.get(question.condition.sourceQuestionId);
    return sourceIndex !== undefined && sourceIndex < index;
  });
}

export function getDefaultCondition(source: SurveyQuestion): QuestionCondition {
  if (source.type === 'multiSelect') {
    return { sourceQuestionId: source.id, operator: 'includes', value: source.options[0]?.id ?? '' };
  }
  if (source.type === 'singleSelect') {
    return { sourceQuestionId: source.id, operator: 'equals', value: source.options[0]?.id ?? '' };
  }
  if (source.type === 'rating') return { sourceQuestionId: source.id, operator: 'equals', value: 5 };
  return { sourceQuestionId: source.id, operator: 'equals', value: '' };
}

export function firstValidationError(questions: SurveyQuestion[], answers: Answers) {
  for (const question of visibleQuestions(questions, answers)) {
    const answer = answers[question.id];
    const missing = answer === undefined || answer === '' || (Array.isArray(answer) && answer.length === 0);
    if (question.required && missing) return `${question.label} is required.`;
  }
  return null;
}
