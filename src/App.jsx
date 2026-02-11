import React, { useEffect, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { AnimatePresence } from 'framer-motion';
import { PageTransition } from './components/ui/PageTransition';
import { Auth } from './components/auth/Auth';
import { useAuth } from './hooks/useAuth';
import { useProfile } from './hooks/useProfile';
import { UserPreferencesProvider } from './context/UserPreferencesContext';
import LandingPage from './pages/LandingPage';

const Dashboard = lazy(() => import('./pages/Dashboard').then(module => ({ default: module.Dashboard })));
const WorkoutLoggerPage = lazy(() => import('./pages/WorkoutLoggerPage').then(module => ({ default: module.WorkoutLoggerPage })));
const AiCoach = lazy(() => import('./pages/AiCoach').then(module => ({ default: module.AiCoach })));
const OnboardingPage = lazy(() => import('./pages/OnboardingPage'));
const SharedWorkout = lazy(() => import('./pages/SharedWorkout').then(module => ({ default: module.SharedWorkout })));
const Pricing = lazy(() => import('./pages/Pricing').then(module => ({ default: module.Pricing })));
const Success = lazy(() => import('./pages/Success').then(module => ({ default: module.Success })));

// Simple Loader Component
const Loader = () => (
  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
);

const FullScreenLoader = () => (
  <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white"><Loader /></div>
);

// Protected Route Wrapper
const RequireAuth = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <FullScreenLoader />;

  if (!user) {
    return <Navigate to="/auth" replace state={{ from: location }} />;
  }

  return children;
};

// Public Route (Redirects to Dashboard if logged in)
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return <FullScreenLoader />;

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// Persistent Layout Wrapper for Animations
const ProtectedLayout = () => {
  const location = useLocation();

  return (
    <RequireAuth>
      <Layout>
        <AnimatePresence mode="wait">
          <PageTransition key={location.pathname} className="h-full">
            <Outlet />
          </PageTransition>
        </AnimatePresence>
      </Layout>
    </RequireAuth>
  );
};

// Onboarding Wrapper logic
const AppContent = () => {
  const { user } = useAuth();
  const { profile, isLoading: profileLoading } = useProfile(user?.id);
  const location = useLocation();
  const navigate = useNavigate();

  // Onboarding Redirect Verification (skip for public share pages)
  useEffect(() => {
    // Don't redirect if on public share page
    if (location.pathname.startsWith('/share/')) {
      return;
    }

    if (user && !profileLoading) {
      const isOnboarding = location.pathname === '/onboarding';
      if (!profile && !isOnboarding) {
        navigate('/onboarding');
      } else if (profile && isOnboarding) {
        navigate('/dashboard');
      }
    }
  }, [user, profile, profileLoading, location.pathname, navigate]);

  if (user && profileLoading) return <FullScreenLoader />;

  return (
    <Suspense fallback={<FullScreenLoader />}>
      <Routes>
        {/* Public Marketing Page */}
        <Route path="/" element={
          <PublicRoute>
            <LandingPage />
          </PublicRoute>
        } />

        {/* Login/Signup */}
        <Route path="/auth" element={
          <PublicRoute>
            <Auth />
          </PublicRoute>
        } />

        {/* Protected Routes Wrapper - Persistent Layout */}
        <Route element={<ProtectedLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/log" element={<WorkoutLoggerPage />} />
          <Route path="/ai-coach" element={<AiCoach />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/success" element={<Success />} />
        </Route>

        {/* Onboarding - Separate because it might have different layout or no layout */}
        <Route path="/onboarding" element={
          <RequireAuth>
            <PageTransition>
              <OnboardingPage />
            </PageTransition>
          </RequireAuth>
        } />

        {/* Catch All */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
};

function App() {
  return (
    <UserPreferencesProvider>
      <Suspense fallback={<FullScreenLoader />}>
        <Routes>
          {/* Public Shared Workout - Must be outside AppContent to avoid auth redirects */}
          <Route path="/share/:shareId" element={<SharedWorkout />} />

          {/* All other routes */}
          <Route path="/*" element={<AppContent />} />
        </Routes>
      </Suspense>
    </UserPreferencesProvider>
  );
}

export default App;
