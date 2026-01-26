import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { Dashboard } from './pages/Dashboard';
import { WorkoutLoggerPage } from './pages/WorkoutLoggerPage';
import { AiCoach } from './pages/AiCoach';
import { Auth } from './components/auth/Auth';
import { useFitnessData } from './hooks/useFitnessData';
import { UserPreferencesProvider } from './context/UserPreferencesContext';

function App() {
  const {
    userStats,
    weightHistory,
    currentBMI,
    addWeightEntry,
    addWorkoutLog,
    workoutLogs,
    user
  } = useFitnessData();

  if (!user) {
    return <Auth />;
  }

  return (
    <UserPreferencesProvider>
      <Layout>
        <Routes>
          <Route path="/" element={
            <Dashboard
              userStats={userStats}
              currentBMI={currentBMI}
              weightHistory={weightHistory}
              addWeightEntry={addWeightEntry}
            />
          } />
          <Route path="/log" element={
            <WorkoutLoggerPage
              addWorkoutLog={addWorkoutLog}
              workoutLogs={workoutLogs}
            />
          } />
          <Route path="/ai-coach" element={
            <AiCoach
              weightHistory={weightHistory}
              workoutLogs={workoutLogs}
              user={user}
            />
          } />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </UserPreferencesProvider>
  );
}

export default App;
