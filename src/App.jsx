import React, { useState } from 'react';
import { Layout } from './components/layout/Layout';
import { StatsOverview } from './components/dashboard/StatsOverview';
import { WeightChart } from './components/dashboard/WeightChart';
import { WorkoutLogger } from './components/workout/WorkoutLogger';
import { useFitnessData } from './hooks/useFitnessData';
import { Button } from './components/ui/Button';
import { LayoutDashboard, PlusCircle, LogOut } from 'lucide-react';
import { Auth } from './components/auth/Auth';
import { supabase } from './lib/supabase';

function App() {
  const {
    userStats,
    weightHistory,
    currentBMI,
    addWeightEntry,
    addWorkoutLog,
    user
  } = useFitnessData();

  const [activeTab, setActiveTab] = useState('dashboard');

  if (!user) {
    return <Auth />;
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <Layout>
      <div className="flex flex-wrap gap-2 pb-4 border-b border-zinc-800 items-center justify-between">
        <div className="flex gap-2 font-medium">
          {/* Mobile friendly flex wrap container for tabs */}
          <div className="flex gap-2">
            <Button
              variant={activeTab === 'dashboard' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('dashboard')}
              className="gap-2 flex-grow sm:flex-grow-0"
            >
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </Button>
            <Button
              variant={activeTab === 'log' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('log')}
              className="gap-2 flex-grow sm:flex-grow-0"
            >
              <PlusCircle className="h-4 w-4" />
              Log Workout
            </Button>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={handleSignOut} title="Sign Out">
          <LogOut className="h-4 w-4 text-zinc-400 hover:text-red-400 transition-colors" />
        </Button>
      </div>

      <div className="mt-6 animation-fade-in">
        {activeTab === 'dashboard' ? (
          <div className="grid gap-6">
            <StatsOverview stats={userStats} currentBMI={currentBMI} />
            <WeightChart data={weightHistory} />

            {/* Quick Weight Entry for simplicity in dashboard */}
            <div className="p-4 rounded-xl border border-dashed border-zinc-800 bg-zinc-900/30">
              <h3 className="text-sm font-medium text-zinc-400 mb-3">Quick Update Weight</h3>
              <div className="flex gap-2 w-full max-w-sm">
                <input
                  type="number"
                  step="0.1"
                  placeholder="Enter (kg)"
                  className="flex-1 h-11 min-w-0 rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-base placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      addWeightEntry(e.target.value);
                      e.target.value = '';
                    }
                  }}
                />
                <Button variant="secondary" className="h-11" onClick={() => {
                  const input = document.querySelector('input[placeholder="Enter (kg)"]');
                  if (input && input.value) {
                    addWeightEntry(input.value);
                    input.value = '';
                  }
                }}>Update</Button>
              </div>
            </div>
          </div>
        ) : (
          <WorkoutLogger onSaveLog={addWorkoutLog} />
        )}
      </div>
    </Layout>
  );
}

export default App;
