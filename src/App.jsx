import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { Dashboard } from './pages/Dashboard';
import { WorkoutLoggerPage } from './pages/WorkoutLoggerPage';
import { AiCoach } from './pages/AiCoach';
import OnboardingPage from './pages/OnboardingPage';
import { Auth } from './components/auth/Auth';
import { useFitnessData } from './hooks/useFitnessData';
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
    return <div className="min-h-screen bg-neutral-950 flex items-center justify-center text-white">Loading...</div>;
  }

  return children;
};

function App() {
  const {
    userStats,
    weightHistory,
    currentBMI,
    addWeightEntry,
    addWorkoutLog,
    workoutLogs,
    updateHeight,
    user,
    profile,
    loadingProfile,
    routines
  } = useFitnessData();

  if (!user) {
    return <Auth />;
  }

  return (
    <UserPreferencesProvider>
      <AuthWrapper profile={profile} loadingProfile={loadingProfile}>
        <Routes>
          <Route path="/onboarding" element={<OnboardingPage />} />

          <Route path="/" element={
            <Layout>
              <Dashboard
                userStats={userStats}
                currentBMI={currentBMI}
                weightHistory={weightHistory}
                addWeightEntry={addWeightEntry}
                updateHeight={updateHeight}
              />
            </Layout>
          } />

          <Route path="/log" element={
            <Layout>
              <WorkoutLoggerPage
                addWorkoutLog={addWorkoutLog}
                workoutLogs={workoutLogs}
                routines={routines}
              />
            </Layout>
          } />

          <Route path="/ai-coach" element={
            <Layout>
              <AiCoach
                weightHistory={weightHistory}
                workoutLogs={workoutLogs}
                user={user}
              />
            </Layout>
          } />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthWrapper>
    </UserPreferencesProvider>
  );
}

export default App;
