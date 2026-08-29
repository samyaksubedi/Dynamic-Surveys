import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { AppShell } from '@/components/app-shell';
import { Providers } from '@/components/providers';
import Home from '@/app/page';
import SignInPage from '@/app/sign-in/page';
import SignUpPage from '@/app/sign-up/page';
import VerifyPage from '@/app/auth/verify/[token]/page';
import DashboardPage from '@/app/dashboard/page';
import AnalyticsOverviewPage from '@/app/dashboard/analytics/page';
import AccountPage from '@/app/account/page';
import NewSurveyPage from '@/app/surveys/new/page';
import SurveyBuilderPage from '@/app/surveys/[surveyId]/page';
import SurveyAnalyticsPage from '@/app/surveys/[surveyId]/analytics/page';
import PublicSurveyPage from '@/app/s/[surveyId]/page';

function WorkspaceLayout() {
  return <AppShell><Outlet /></AppShell>;
}

export default function App() {
  return <Providers><Routes>
    <Route path="/" element={<Home />} />
    <Route path="/sign-in" element={<SignInPage />} />
    <Route path="/sign-up" element={<SignUpPage />} />
    <Route path="/auth/verify/:token" element={<VerifyPage />} />
    <Route path="/s/:surveyId" element={<PublicSurveyPage />} />
    <Route element={<WorkspaceLayout />}>
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/dashboard/analytics" element={<AnalyticsOverviewPage />} />
      <Route path="/account" element={<AccountPage />} />
      <Route path="/surveys/new" element={<NewSurveyPage />} />
      <Route path="/surveys/:surveyId" element={<SurveyBuilderPage />} />
      <Route path="/surveys/:surveyId/analytics" element={<SurveyAnalyticsPage />} />
    </Route>
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes></Providers>;
}
