import React, { useEffect, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
const Dashboard = lazy(() => import('./pages/Dashboard').then(module => ({ default: module.Dashboard })));
const WorkoutLoggerPage = lazy(() => import('./pages/WorkoutLoggerPage').then(module => ({ default: module.WorkoutLoggerPage })));
const AiCoach = lazy(() => import('./pages/AiCoach').then(module => ({ default: module.AiCoach })));
const OnboardingPage = lazy(() => import('./pages/OnboardingPage'));
import { Auth } from './components/auth/Auth';
import { useAuth } from './hooks/useAuth';
import { useProfile } from './hooks/useProfile';
import { UserPreferencesProvider } from './context/UserPreferencesContext';

// Auth Wrapper to handle Onboarding Redirection
const AuthWrapper = ({ children, profile, loadingProfile }) => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loadingProfile) {
      if (!profile && location.pathname !== '/onboarding') {
        navigate('/onboarding');
      } else if (profile && location.pathname === '/onboarding') {
        navigate('/');
      }
    }
  }, [profile, loadingProfile, location.pathname, navigate]);

  if (loadingProfile) {
    return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white"><Loader /></div>;
  }

  return children;
};

// Simple Loader Component
const Loader = () => (
  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
);

function App() {
  const { user, loading: authLoading } = useAuth();
  const { profile, isLoading: profileLoading } = useProfile(user?.id);

  if (authLoading) {
    return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white"><Loader /></div>;
  }

  if (!user) {
    return <Auth />;
  }

  return (
    <UserPreferencesProvider>
      <AuthWrapper profile={profile} loadingProfile={profileLoading}>
        <Suspense fallback={<div className="min-h-screen bg-slate-900 flex items-center justify-center text-white"><Loader /></div>}>
          <Routes>
            <Route path="/onboarding" element={<OnboardingPage />} />

            <Route path="/" element={
              <Layout>
                <Dashboard />
              </Layout>
            } />

            <Route path="/log" element={
              <Layout>
                <WorkoutLoggerPage />
              </Layout>
            } />

            <Route path="/ai-coach" element={
              <Layout>
                <AiCoach />
              </Layout>
            } />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </AuthWrapper>
    </UserPreferencesProvider>
  );
}

export default App;
