import React, { useState } from 'react';
import { X, Save, GripVertical, Trash2, Plus, Dumbbell } from 'lucide-react';
import { Button } from '../ui/Button';
import { ExercisePicker } from './ExercisePicker';
import { hapticLight, hapticSuccess } from '../../lib/haptics';
import { useWorkouts } from '../../hooks/useWorkouts';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../context/ToastContext';

export function RoutineEditor({ routine, onClose, onSaveComplete }) {
    const { user } = useAuth();
    const { updateRoutine, exercises } = useWorkouts(user?.id);
    const { toast } = useToast();

    const [name, setName] = useState(routine.name || 'New Routine');
    
    // Support string array or object array for exercises
    const initialExercises = (routine.exercises || []).map(ex => typeof ex === 'string' ? { name: ex } : ex);
    const [selectedExercises, setSelectedExercises] = useState(initialExercises);
    
    const [showPicker, setShowPicker] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Simple Drag & Drop implementation
    const [draggedIdx, setDraggedIdx] = useState(null);

    const handleDragStart = (e, index) => {
        setDraggedIdx(index);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e, index) => {
        e.preventDefault();
        if (draggedIdx === null || draggedIdx === index) return;
        
        const newEx = [...selectedExercises];
        const draggedItem = newEx[draggedIdx];
        newEx.splice(draggedIdx, 1);
        newEx.splice(index, 0, draggedItem);
        
        setDraggedIdx(index);
        setSelectedExercises(newEx);
    };

    const handleDragEnd = () => {
        setDraggedIdx(null);
        hapticLight();
    };

    const handleRemoveExercise = (index) => {
        hapticLight();
        const newEx = [...selectedExercises];
        newEx.splice(index, 1);
        setSelectedExercises(newEx);
    };

    const handleAddExercises = (newExerciseNames) => {
        // newExerciseNames is an array of strings from ExercisePicker
        const toAdd = newExerciseNames.filter(name => !selectedExercises.find(e => e.name === name));
        setSelectedExercises([...selectedExercises, ...toAdd.map(name => ({ name }))]);
        setShowPicker(false);
    };

    const handleSave = async () => {
        if (!name.trim()) {
            toast.error('Routine name cannot be empty');
            return;
        }
        if (selectedExercises.length === 0) {
            toast.error('Please add at least one exercise');
            return;
        }

        setIsSaving(true);
        try {
            await updateRoutine({
                id: routine.id,
                name: name.trim(),
                exercises: selectedExercises
            });
            hapticSuccess();
            toast.success('Routine updated successfully!');
            if (onSaveComplete) onSaveComplete();
            onClose();
        } catch (error) {
            console.error(error);
            toast.error('Failed to update routine');
        } finally {
            setIsSaving(false);
        }
    };

    if (showPicker) {
        return (
            <div className="fixed inset-0 z-[150] bg-white dark:bg-slate-950 flex flex-col">
                <ExercisePicker
                    availableExercises={exercises}
                    initialSelection={selectedExercises.map(e => e.name)}
                    onComplete={handleAddExercises}
                    onBack={() => setShowPicker(false)}
                />
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-[120] bg-white dark:bg-slate-950 flex flex-col animate-in slide-in-from-bottom duration-300">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-zinc-800 bg-white dark:bg-slate-900 z-10 sticky top-0 pt-safe">
                <div className="flex items-center gap-3">
                    <button onClick={onClose} className="p-2 -ml-2 rounded-full hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-500 transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">Edit Routine</h2>
                </div>
                <Button 
                    onClick={handleSave} 
                    disabled={isSaving}
                    size="sm" 
                    className="bg-violet-600 hover:bg-violet-700 text-white rounded-xl shadow-lg shadow-violet-500/20 px-5"
                >
                    {isSaving ? 'Saving...' : 'Save'}
                </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 pb-32">
                <div className="max-w-xl mx-auto space-y-6">
                    {/* Name Input */}
                    <div>
                        <label className="text-sm font-semibold text-slate-700 dark:text-zinc-300 mb-2 block">Routine Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Push Day, Full Body"
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 rounded-xl font-medium focus:ring-2 focus:ring-violet-500 outline-none text-slate-900 dark:text-white"
                        />
                    </div>

                    {/* Exercises List */}
                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <label className="text-sm font-semibold text-slate-700 dark:text-zinc-300">Exercises ({selectedExercises.length})</label>
                        </div>
                        
                        <div className="space-y-2">
                            {selectedExercises.length === 0 ? (
                                <div className="p-8 border-2 border-dashed border-slate-200 dark:border-zinc-800 rounded-xl text-center text-slate-500 dark:text-zinc-500">
                                    <Dumbbell className="w-8 h-8 mx-auto mb-3 opacity-50" />
                                    <p>No exercises added yet</p>
                                </div>
                            ) : (
                                selectedExercises.map((ex, idx) => (
                                    <div 
                                        key={`${ex.name}-${idx}`}
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, idx)}
                                        onDragOver={(e) => handleDragOver(e, idx)}
                                        onDragEnd={handleDragEnd}
                                        className={`flex items-center gap-3 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-zinc-800 rounded-xl shadow-sm transition-transform ${draggedIdx === idx ? 'opacity-50 scale-95' : ''}`}
                                    >
                                        <div className="cursor-grab active:cursor-grabbing p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                                            <GripVertical className="w-5 h-5" />
                                        </div>
                                        <span className="flex-1 font-medium text-slate-800 dark:text-slate-200">{ex.name}</span>
                                        <button 
                                            onClick={() => handleRemoveExercise(idx)}
                                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>

                        <Button 
                            variant="outline" 
                            className="w-full mt-4 h-12 rounded-xl border-dashed border-2 hover:border-violet-500 hover:bg-violet-50 dark:hover:bg-violet-500/10 hover:text-violet-600"
                            onClick={() => setShowPicker(true)}
                        >
                            <Plus className="w-5 h-5 mr-2" />
                            Add Exercise
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
