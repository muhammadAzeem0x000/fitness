import React, { useEffect, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { PageTransition } from './components/ui/PageTransition';
import { Auth } from './components/auth/Auth';
import { useAuth, AuthProvider } from './hooks/useAuth';
import { useProfile } from './hooks/useProfile';
import { UserPreferencesProvider } from './context/UserPreferencesContext';
import LandingPage from './pages/LandingPage';
import { initNativeFeatures } from './lib/native';
import { useHardwareBackButton } from './hooks/useHardwareBackButton';
import appLogo from './assets/logo.png';

// Helper: retry a dynamic import by reloading the page once on failure (stale chunk fix)
function lazyWithRetry(importFn) {
  return lazy(() =>
    importFn().catch((error) => {
      // Only auto-reload once to avoid infinite loops
      const hasReloaded = sessionStorage.getItem('chunk_reload');
      if (!hasReloaded) {
        sessionStorage.setItem('chunk_reload', 'true');
        window.location.reload();
        return new Promise(() => {}); // never resolves — page is reloading
      }
      sessionStorage.removeItem('chunk_reload');
      throw error; // let error boundary handle it
    })
  );
}

// Clear the reload flag on successful page loads
if (sessionStorage.getItem('chunk_reload')) {
  sessionStorage.removeItem('chunk_reload');
}

const Dashboard = lazyWithRetry(() => import('./pages/Dashboard').then(module => ({ default: module.Dashboard })));
const WorkoutLoggerPage = lazyWithRetry(() => import('./pages/WorkoutLoggerPage').then(module => ({ default: module.WorkoutLoggerPage })));
const AiCoach = lazyWithRetry(() => import('./pages/AiCoach').then(module => ({ default: module.AiCoach })));
const ProfilePage = lazyWithRetry(() => import('./pages/ProfilePage'));
const OnboardingPage = lazyWithRetry(() => import('./pages/OnboardingPage'));
const SharedWorkout = lazyWithRetry(() => import('./pages/SharedWorkout').then(module => ({ default: module.SharedWorkout })));
const Pricing = lazyWithRetry(() => import('./pages/Pricing').then(module => ({ default: module.Pricing })));
const Success = lazyWithRetry(() => import('./pages/Success').then(module => ({ default: module.Success })));
const NutritionPage = lazyWithRetry(() => import('./pages/NutritionPage').then(module => ({ default: module.NutritionPage })));
const LeaderboardPage = lazyWithRetry(() => import('./pages/LeaderboardPage').then(module => ({ default: module.LeaderboardPage })));

// Cool Logo Loader Component
const Loader = () => (
  <div className="relative flex flex-col items-center justify-center">
    <div className="relative flex items-center justify-center">
      {/* Outer spinning rings for a high-tech/professional look */}
      <div 
        className="absolute w-28 h-28 rounded-full border-4 border-emerald-500/10 border-t-emerald-500 animate-spin"
        style={{ animationDuration: '1.5s' }}
      ></div>
      <div 
        className="absolute w-32 h-32 rounded-full border-4 border-emerald-500/10 border-b-emerald-400 animate-spin"
        style={{ animationDuration: '2s', animationDirection: 'reverse' }}
      ></div>
      {/* Inner pulsating logo */}
      <img 
        src={appLogo} 
        alt="Loading..." 
        className="w-16 h-16 object-contain animate-pulse relative z-10"
        style={{ filter: 'drop-shadow(0 0 10px rgba(16, 185, 129, 0.5))' }}
      />
    </div>
    <div className="mt-8 text-emerald-500/80 text-sm tracking-[0.2em] font-medium animate-pulse">
      LOADING...
    </div>
  </div>
);

const FullScreenLoader = () => (
  <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center z-50">
    <Loader />
  </div>
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
        <PageTransition key={location.pathname} className="h-full w-full">
          <Outlet />
        </PageTransition>
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

  useHardwareBackButton();

  // Onboarding Redirect Verification (skip for public share pages)
  useEffect(() => {
    // Don't redirect if on public share page
    if (location.pathname.startsWith('/share/')) {
      return;
    }

    if (user && !profileLoading) {
      const isOnboarding = location.pathname === '/onboarding';
      const needsOnboarding = !profile || profile.needs_onboarding;
      
      if (needsOnboarding && !isOnboarding) {
        navigate('/onboarding');
      } else if (!needsOnboarding && isOnboarding) {
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
          <Route path="/nutrition" element={<NutritionPage />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
          <Route path="/profile" element={<ProfilePage />} />
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

import { ThemeProvider } from './context/ThemeContext';

function App() {
  useEffect(() => {
    initNativeFeatures();
  }, []);

  return (
    <ThemeProvider>
      <AuthProvider>
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
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
