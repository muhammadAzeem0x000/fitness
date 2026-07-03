import React, { useState, useEffect } from 'react';
import { X, Dumbbell, Target, Zap, ChevronRight } from 'lucide-react';
import { getExerciseData, formatEquipment, formatTarget } from '../../lib/exerciseImages';

export function ExerciseDetailModal({ isOpen, onClose, exerciseName }) {
  const [exerciseData, setExerciseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [gifLoaded, setGifLoaded] = useState(false);
  const [gifError, setGifError] = useState(false);

  useEffect(() => {
    if (!isOpen || !exerciseName) return;
    
    setLoading(true);
    setGifLoaded(false);
    setGifError(false);
    
    getExerciseData(exerciseName).then(data => {
      setExerciseData(data);
      setLoading(false);
    });
  }, [isOpen, exerciseName]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" 
        onClick={onClose} 
      />
      
      {/* Modal Content */}
      <div className="relative w-full max-w-lg max-h-[85vh] bg-white dark:bg-zinc-900 rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-300 flex flex-col">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 p-2 rounded-full bg-black/30 hover:bg-black/50 text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* GIF Preview */}
        <div className="relative bg-gradient-to-b from-zinc-800 to-zinc-900 flex items-center justify-center min-h-[200px] sm:min-h-[260px]">
          {loading ? (
            <div className="flex flex-col items-center gap-3 text-zinc-500">
              <div className="w-12 h-12 rounded-full border-2 border-zinc-700 border-t-blue-500 animate-spin" />
              <span className="text-sm">Loading exercise...</span>
            </div>
          ) : (exerciseData?.gif_url && !gifError) ? (
            <>
              {!gifLoaded && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-10 h-10 rounded-full border-2 border-zinc-700 border-t-blue-500 animate-spin" />
                </div>
              )}
              <img
                src={exerciseData.gif_url}
                alt={`${exerciseName} demonstration`}
                className={`w-full max-h-[280px] object-contain hd-image transition-opacity duration-300 ${gifLoaded ? 'opacity-100' : 'opacity-0'}`}
                onLoad={() => setGifLoaded(true)}
                onError={() => {
                  setGifError(true);
                  setGifLoaded(true);
                }}
              />
            </>
          ) : (
            <div className="flex flex-col items-center gap-2 text-zinc-500 py-8">
              <Dumbbell className="w-12 h-12" />
              <span className="text-sm">No animation available</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Title */}
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white capitalize">
              {exerciseData?.display_name || exerciseName}
            </h3>
            {exerciseData && (
              <div className="flex flex-wrap gap-2 mt-2">
                {exerciseData.app_category && (
                  <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                    <Target className="w-3 h-3" />
                    {exerciseData.app_category}
                  </span>
                )}
                {exerciseData.target && (
                  <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                    <Zap className="w-3 h-3" />
                    {formatTarget(exerciseData.target)}
                  </span>
                )}
                {exerciseData.equipment && (
                  <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    <Dumbbell className="w-3 h-3" />
                    {formatEquipment(exerciseData.equipment)}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Secondary Muscles */}
          {exerciseData?.secondary_muscles?.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-slate-500 dark:text-zinc-500 uppercase tracking-wider mb-1.5">
                Muscles Worked
              </h4>
              <div className="flex flex-wrap gap-1.5">
                <span className="text-xs px-2 py-0.5 rounded bg-purple-500/20 text-purple-700 dark:text-purple-300 font-medium">
                  {formatTarget(exerciseData.target)} (primary)
                </span>
                {exerciseData.secondary_muscles.map((muscle, i) => (
                  <span key={i} className="text-xs px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                    {formatTarget(muscle)}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Instructions */}
          {exerciseData?.instruction_steps?.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-slate-500 dark:text-zinc-500 uppercase tracking-wider mb-2">
                How to Perform
              </h4>
              <ol className="space-y-2">
                {exerciseData.instruction_steps.map((step, i) => (
                  <li key={i} className="flex gap-3 text-sm text-slate-700 dark:text-zinc-300">
                    <span className="flex-none w-6 h-6 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xs font-bold">
                      {i + 1}
                    </span>
                    <span className="pt-0.5">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* No data fallback */}
          {!loading && !exerciseData && (
            <div className="text-center py-6 text-zinc-500">
              <p className="text-sm">No detailed information available for this exercise.</p>
              <p className="text-xs mt-1 text-zinc-600">This may be a custom exercise.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
