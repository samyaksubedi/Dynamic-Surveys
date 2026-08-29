import { useParams } from 'react-router-dom';
import { SurveyAnalytics } from '@/components/survey-analytics';

export default function SurveyAnalyticsPage() {
  const { surveyId } = useParams<{ surveyId: string }>();
  return surveyId ? <SurveyAnalytics surveyId={surveyId} /> : null;
}
