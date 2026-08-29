import { useParams } from 'react-router-dom';
import { PublicSurvey } from '@/components/public-survey';

export default function PublicSurveyPage() {
  const { surveyId } = useParams<{ surveyId: string }>();
  return surveyId ? <PublicSurvey surveyId={surveyId} /> : null;
}
