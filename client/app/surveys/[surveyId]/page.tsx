import { useParams } from 'react-router-dom';
import { SurveyBuilder } from '@/components/survey-builder';

export default function SurveyBuilderPage() {
  const { surveyId } = useParams<{ surveyId: string }>();
  return surveyId ? <SurveyBuilder surveyId={surveyId} /> : null;
}
