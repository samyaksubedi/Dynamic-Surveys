export type QuestionType = 'text' | 'singleSelect' | 'multiSelect' | 'rating';

export type SurveyOption = { id: string; label: string };

export type QuestionCondition = {
  sourceQuestionId: string;
  operator: 'equals' | 'includes';
  value: string | number;
};

type QuestionBase = {
  id: string;
  label: string;
  required: boolean;
  condition?: QuestionCondition;
};

export type TextQuestion = QuestionBase & {
  type: 'text';
  maxLength: number;
};

export type SingleSelectQuestion = QuestionBase & {
  type: 'singleSelect';
  options: SurveyOption[];
};

export type MultiSelectQuestion = QuestionBase & {
  type: 'multiSelect';
  options: SurveyOption[];
};

export type RatingQuestion = QuestionBase & {
  type: 'rating';
  min: 1;
  max: 5;
};

export type SurveyQuestion =
  | TextQuestion
  | SingleSelectQuestion
  | MultiSelectQuestion
  | RatingQuestion;

export type SurveyDefinition = { questions: SurveyQuestion[] };

export type Survey = {
  id: string;
  creatorId?: string;
  title: string;
  description: string;
  schema: SurveyDefinition;
  acceptingResponses: boolean;
  createdAt: string;
  updatedAt: string;
  submittedResponseCount?: number;
};

export type User = {
  id: string;
  name: string;
  email: string;
  isVerified: boolean;
  createdAt?: string;
};

export type Answers = Record<string, string | string[] | number>;

export type ResponseState = {
  status: 'NONE' | 'DRAFT' | 'SUBMITTED';
  answers: Answers;
  submittedAt?: string | null;
};

export type TextAnalytics = {
  id: string;
  type: 'text';
  label: string;
  answers: string[];
};

export type SelectAnalytics = {
  id: string;
  type: 'singleSelect' | 'multiSelect';
  label: string;
  options: Array<{ id: string; label: string; count: number }>;
};

export type RatingAnalytics = {
  id: string;
  type: 'rating';
  label: string;
  responseCount: number;
  average: number | null;
};

export type SurveyAnalytics = {
  totalSubmittedResponses: number;
  questions: Array<TextAnalytics | SelectAnalytics | RatingAnalytics>;
};

export type ApiEnvelope<T> = {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
  errors?: Array<{ path?: Array<string | number>; questionId?: string; message: string }>;
};
