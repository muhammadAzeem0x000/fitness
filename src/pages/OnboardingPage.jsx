import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { supabase } from '../lib/supabase';
import { useUserPreferences } from '../context/UserPreferencesContext';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Ruler, Weight, Target, ArrowRight, Check, Dumbbell, Calendar, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const OnboardingPage = () => {
    const navigate = useNavigate();
    const { heightUnit, weightUnit, toggleHeightUnit, toggleWeightUnit, convertHeightToCm, convertWeightToDb } = useUserPreferences();

    useEffect(() => {
        document.title = 'Onboarding | MuscleBot';
    }, []);

    // Persistence
    const [step, setStep] = useLocalStorage('onboarding_step', 1);

    // Custom validation for step 1
    const step1Schema = z.object({
        height: heightUnit === 'cm' ? z.string().min(1, "Height is required") : z.string().optional(),
        heightFt: heightUnit === 'ft' ? z.string().min(1, "Feet required") : z.string().optional(),
        heightIn: heightUnit === 'ft' ? z.string().min(1, "Inches required") : z.string().optional(),
        currentWeight: z.string().min(1, "Current weight is required"),
        goalWeight: z.string().min(1, "Goal weight is required"),
    });

    const {
        register,
        handleSubmit,
        trigger,
        getValues,
        setValue,
        formState: { errors }
    } = useForm({
        defaultValues: {
            height: '',
            heightFt: '',
            heightIn: '',
            currentWeight: '',
            goalWeight: '',
        },
        resolver: zodResolver(step1Schema)
    });

    // Step 2 State (Routine Split)
    const [splitType, setSplitType] = useLocalStorage('onboarding_split_type', 'ppl');
    
    // Step 3 State (Preferred Days)
    const [selectedDays, setSelectedDays] = useLocalStorage('onboarding_custom_days', []);

    const [loading, setLoading] = useState(false);
    const [submitError, setSubmitError] = useState(null);

    const handleNextStep = async (currentStep) => {
        if (currentStep === 1) {
            const isValid = await trigger();
            if (isValid) setStep(2);
        } else if (currentStep === 2) {
            setStep(3);
        }
    };

    const handleUnitToggle = () => {
        const values = getValues();
        
        // Converting Weight
        if (weightUnit === 'kg') {
            // Currently KG -> converting to LBS
            const cWeight = parseFloat(values.currentWeight);
            if (!isNaN(cWeight)) setValue('currentWeight', (cWeight * 2.20462).toFixed(1));
            
            const gWeight = parseFloat(values.goalWeight);
            if (!isNaN(gWeight)) setValue('goalWeight', (gWeight * 2.20462).toFixed(1));

            // Height CM -> FT/IN
            const hCm = parseFloat(values.height);
            if (!isNaN(hCm)) {
                const totalInches = hCm / 2.54;
                setValue('heightFt', Math.floor(totalInches / 12).toString());
                setValue('heightIn', Math.round(totalInches % 12).toString());
            }
        } else {
            // Currently LBS -> converting to KG
            const cWeight = parseFloat(values.currentWeight);
            if (!isNaN(cWeight)) setValue('currentWeight', (cWeight / 2.20462).toFixed(1));
            
            const gWeight = parseFloat(values.goalWeight);
            if (!isNaN(gWeight)) setValue('goalWeight', (gWeight / 2.20462).toFixed(1));

            // Height FT/IN -> CM
            const hFt = parseFloat(values.heightFt) || 0;
            const hIn = parseFloat(values.heightIn) || 0;
            if (hFt > 0 || hIn > 0) {
                const cm = ((hFt * 12) + hIn) * 2.54;
                setValue('height', Math.round(cm).toString());
            }
        }
        
        // This toggles both weight and height units in the UserPreferencesContext
        toggleWeightUnit();
    };

    const onSubmit = async (data) => {
        setLoading(true);
        setSubmitError(null);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("No user found");

            // Conversion Logic
            let heightInCm;
            if (heightUnit === 'ft') {
                heightInCm = convertHeightToCm(data.heightFt, data.heightIn, 'ft');
            } else {
                heightInCm = convertHeightToCm(data.height, null, 'cm');
            }

            const weightInKg = convertWeightToDb(data.currentWeight);
            const goalWeightInKg = convertWeightToDb(data.goalWeight);

            // 1. Profile Upsert (with independent workout_days)
            const { error: profileError } = await supabase
                .from('profiles')
                .upsert({
                    id: user.id,
                    height: heightInCm,
                    current_weight: weightInKg,
                    goal_weight: goalWeightInKg,
                    workout_days: selectedDays,
                    needs_onboarding: false,
                    updated_at: new Date().toISOString()
                });

            if (profileError) throw profileError;

            // 2. Weight History
            const today = new Date().toISOString().split('T')[0];
            if (weightInKg > 0) {
                const { data: existingEntry } = await supabase
                    .from('weight_history')
                    .select('id')
                    .eq('user_id', user.id)
                    .eq('date', today)
                    .maybeSingle();

                if (existingEntry) {
                    await supabase.from('weight_history').update({ weight: weightInKg }).eq('id', existingEntry.id);
                } else {
                    await supabase.from('weight_history').insert({ user_id: user.id, weight: weightInKg, date: today });
                }
            }

            // 3. Routines (Templates)
            let templates = [];
            if (splitType === 'ppl') {
                templates = [
                    { 
                        user_id: user.id, name: 'Push', schedule_days: [], exercises: [
                            { name: 'Barbell Bench Press', category: 'Chest', sets: 3, reps: 10 }, 
                            { name: 'Dumbbell Seated Press', category: 'Shoulders', sets: 3, reps: 10 }, 
                            { name: 'Dumbbell Incline Press', category: 'Chest', sets: 3, reps: 10 },
                            { name: 'Cable Lateral Raise', category: 'Shoulders', sets: 3, reps: 15 },
                            { name: 'Cable Tricep Pushdown', category: 'Arms', sets: 3, reps: 12 },
                            { name: 'Cable Overhead Triceps Extension', category: 'Arms', sets: 3, reps: 12 }
                        ] 
                    },
                    { 
                        user_id: user.id, name: 'Pull', schedule_days: [], exercises: [
                            { name: 'Cable Pulldown', category: 'Back', sets: 3, reps: 10 }, 
                            { name: 'Cable Seated Row', category: 'Back', sets: 3, reps: 10 }, 
                            { name: 'Cable Rear Delt Row', category: 'Shoulders', sets: 3, reps: 15 },
                            { name: 'Dumbbell Shrug', category: 'Back', sets: 3, reps: 15 },
                            { name: 'Barbell Curl', category: 'Arms', sets: 3, reps: 12 },
                            { name: 'Dumbbell Hammer Curl', category: 'Arms', sets: 3, reps: 12 }
                        ] 
                    },
                    { 
                        user_id: user.id, name: 'Legs', schedule_days: [], exercises: [
                            { name: 'Barbell Squat', category: 'Legs', sets: 3, reps: 10 }, 
                            { name: 'Leg Press', category: 'Legs', sets: 3, reps: 10 }, 
                            { name: 'Barbell Romanian Deadlift', category: 'Legs', sets: 3, reps: 10 },
                            { name: 'Leg Extension', category: 'Legs', sets: 3, reps: 15 },
                            { name: 'Seated Leg Curl', category: 'Legs', sets: 3, reps: 15 },
                            { name: 'Standing Calf Raise', category: 'Legs', sets: 4, reps: 15 }
                        ] 
                    },
                ];
            } else if (splitType === 'upper_lower') {
                templates = [
                    { 
                        user_id: user.id, name: 'Upper Body', schedule_days: [], exercises: [
                            { name: 'Barbell Bench Press', category: 'Chest', sets: 3, reps: 10 }, 
                            { name: 'Barbell Row', category: 'Back', sets: 3, reps: 10 }, 
                            { name: 'Dumbbell Seated Press', category: 'Shoulders', sets: 3, reps: 10 },
                            { name: 'Cable Pulldown', category: 'Back', sets: 3, reps: 10 },
                            { name: 'Cable Crossover', category: 'Chest', sets: 3, reps: 12 },
                            { name: 'Dumbbell Bicep Curl', category: 'Arms', sets: 3, reps: 12 },
                            { name: 'Cable Tricep Pushdown', category: 'Arms', sets: 3, reps: 12 }
                        ] 
                    },
                    { 
                        user_id: user.id, name: 'Lower Body', schedule_days: [], exercises: [
                            { name: 'Barbell Squat', category: 'Legs', sets: 3, reps: 10 }, 
                            { name: 'Barbell Romanian Deadlift', category: 'Legs', sets: 3, reps: 10 }, 
                            { name: 'Barbell Lunge', category: 'Legs', sets: 3, reps: 12 },
                            { name: 'Leg Extension', category: 'Legs', sets: 3, reps: 15 },
                            { name: 'Seated Leg Curl', category: 'Legs', sets: 3, reps: 15 },
                            { name: 'Seated Calf Raise', category: 'Legs', sets: 4, reps: 15 }
                        ] 
                    },
                ];
            } else if (splitType === 'full_body') {
                templates = [
                    { 
                        user_id: user.id, name: 'Full Body', schedule_days: [], exercises: [
                            { name: 'Barbell Squat', category: 'Legs', sets: 3, reps: 10 }, 
                            { name: 'Barbell Bench Press', category: 'Chest', sets: 3, reps: 10 }, 
                            { name: 'Cable Seated Row', category: 'Back', sets: 3, reps: 10 },
                            { name: 'Dumbbell Seated Press', category: 'Shoulders', sets: 3, reps: 10 },
                            { name: 'Barbell Romanian Deadlift', category: 'Legs', sets: 3, reps: 10 },
                            { name: 'Cable Pulldown', category: 'Back', sets: 3, reps: 10 },
                            { name: 'Dumbbell Incline Press', category: 'Chest', sets: 3, reps: 10 },
                            { name: 'Cable Rear Delt Row', category: 'Shoulders', sets: 3, reps: 12 },
                            { name: 'Dumbbell Bicep Curl', category: 'Arms', sets: 3, reps: 12 },
                            { name: 'Cable Tricep Pushdown', category: 'Arms', sets: 3, reps: 12 },
                            { name: 'Standing Calf Raise', category: 'Legs', sets: 3, reps: 15 },
                            { name: 'Cable Crunch', category: 'Core', sets: 3, reps: 15 }
                        ] 
                    },
                ];
            }

            if (templates.length > 0) {
                await supabase.from('routines').insert(templates);
            }

            // 4. Verification & Clean up
            const { data: verifyProfile } = await supabase.from('profiles').select('id').eq('id', user.id).single();

            if (verifyProfile) {
                localStorage.removeItem('onboarding_step');
                localStorage.removeItem('onboarding_form');
                localStorage.removeItem('onboarding_split_type');
                localStorage.removeItem('onboarding_custom_days');
                // Force reload
                window.location.href = '/';
            } else {
                throw new Error("Verification failed.");
            }

        } catch (err) {
            console.error(err);
            setSubmitError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
            <div className="max-w-2xl w-full">
                <div className="mb-8 text-center">
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-500 to-indigo-500 bg-clip-text text-transparent mb-2">
                        Welcome to MuscleBot
                    </h1>
                    <p className="text-zinc-400">Let's set up your profile for success.</p>
                </div>

                {/* Progress Steps */}
                <div className="flex items-center justify-center gap-4 mb-8">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step >= 1 ? 'bg-blue-500 text-white' : 'bg-zinc-800 text-zinc-500'}`}>1</div>
                    <div className={`w-12 h-1 rounded bg-zinc-800`}>
                        <div className={`h-full bg-blue-500 transition-all duration-300 ${step >= 2 ? 'w-full' : 'w-0'}`} />
                    </div>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step >= 2 ? 'bg-blue-500 text-white' : 'bg-zinc-800 text-zinc-500'}`}>2</div>
                    <div className={`w-12 h-1 rounded bg-zinc-800`}>
                        <div className={`h-full bg-blue-500 transition-all duration-300 ${step >= 3 ? 'w-full' : 'w-0'}`} />
                    </div>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step >= 3 ? 'bg-blue-500 text-white' : 'bg-zinc-800 text-zinc-500'}`}>3</div>
                </div>

                <Card className="bg-zinc-900/50 border-zinc-800 p-6 md:p-8 backdrop-blur-xl">
                    {submitError && (
                        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm">
                            {submitError}
                        </div>
                    )}

                    {step === 1 && (
                        <form className="space-y-6">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h2 className="text-xl font-semibold text-white mb-1">Your Biometrics</h2>
                                    <p className="text-sm text-zinc-400">Help the AI customize your plan.</p>
                                </div>
                                <button
                                    onClick={handleUnitToggle}
                                    type="button"
                                    className="px-3 py-1.5 rounded-lg bg-zinc-800 text-xs font-medium text-zinc-300 hover:text-white hover:bg-zinc-700 transition-colors border border-zinc-700"
                                >
                                    {weightUnit === 'kg' ? 'KG / FT' : 'LBS / CM'}
                                </button>
                            </div>

                            {/* Height Input */}
                            <div className="space-y-2">
                                <label className="text-sm text-zinc-400 flex items-center gap-2">
                                    <Ruler className="w-4 h-4" /> Height
                                </label>
                                {heightUnit === 'ft' ? (
                                    <div className="flex gap-2">
                                        <div className="flex-1 flex gap-2">
                                            <div className="flex-1 relative">
                                                <input
                                                    {...register('heightFt')}
                                                    type="number"
                                                    placeholder="Feet"
                                                    className={`w-full bg-zinc-950 border ${errors.heightFt ? 'border-red-500' : 'border-zinc-800'} rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors`}
                                                />
                                                <span className="absolute right-3 top-3 text-zinc-500 text-sm">ft</span>
                                            </div>
                                            <div className="flex-1 relative">
                                                <input
                                                    {...register('heightIn')}
                                                    type="number"
                                                    placeholder="Inches"
                                                    className={`w-full bg-zinc-950 border ${errors.heightIn ? 'border-red-500' : 'border-zinc-800'} rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors`}
                                                />
                                                <span className="absolute right-3 top-3 text-zinc-500 text-sm">in</span>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex gap-2">
                                        <input
                                            {...register('height')}
                                            type="number"
                                            placeholder="Height in cm"
                                            className={`flex-1 bg-zinc-950 border ${errors.height ? 'border-red-500' : 'border-zinc-800'} rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors`}
                                        />
                                        <div className="flex items-center gap-2 bg-zinc-950 border border-zinc-800 rounded-lg px-2">
                                            <span className="text-zinc-400 text-sm">cm</span>
                                        </div>
                                    </div>
                                )}
                                {(errors.height || errors.heightFt || errors.heightIn) && <p className="text-xs text-red-500">Height is required</p>}
                            </div>

                            {/* Current Weight Input */}
                            <div className="space-y-2">
                                <label className="text-sm text-zinc-400 flex items-center gap-2">
                                    <Weight className="w-4 h-4" /> Current Weight
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        {...register('currentWeight')}
                                        type="number"
                                        placeholder={`Weight in ${weightUnit || 'kg'}`}
                                        className={`flex-1 bg-zinc-950 border ${errors.currentWeight ? 'border-red-500' : 'border-zinc-800'} rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors`}
                                    />
                                    <div className="flex items-center gap-2 bg-zinc-950 border border-zinc-800 rounded-lg px-2">
                                        <span className="text-zinc-400 text-sm">{weightUnit || 'kg'}</span>
                                    </div>
                                </div>
                                {errors.currentWeight && <p className="text-xs text-red-500">{errors.currentWeight.message}</p>}
                            </div>

                            {/* Goal Weight Input */}
                            <div className="space-y-2">
                                <label className="text-sm text-zinc-400 flex items-center gap-2">
                                    <Target className="w-4 h-4" /> Goal Weight
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        {...register('goalWeight')}
                                        type="number"
                                        placeholder={`Goal in ${weightUnit || 'kg'}`}
                                        className={`flex-1 bg-zinc-950 border ${errors.goalWeight ? 'border-red-500' : 'border-zinc-800'} rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors`}
                                    />
                                    <div className="flex items-center gap-2 bg-zinc-950 border border-zinc-800 rounded-lg px-2">
                                        <span className="text-zinc-400 text-sm">{weightUnit || 'kg'}</span>
                                    </div>
                                </div>
                                {errors.goalWeight && <p className="text-xs text-red-500">{errors.goalWeight.message}</p>}
                            </div>

                            <div className="pt-6 mt-8 border-t border-zinc-800/50">
                                <Button
                                    onClick={() => handleNextStep(1)}
                                    type="button"
                                    className="w-full h-12 text-base font-semibold"
                                >
                                    Next Step <ArrowRight className="w-5 h-5 ml-2" />
                                </Button>
                            </div>
                        </form>
                    )}

                    {step === 2 && (
                        <div className="space-y-6">
                            <div className="text-center mb-6">
                                <h2 className="text-xl font-semibold text-white mb-1">Choose Workout Split</h2>
                                <p className="text-sm text-zinc-400">Select templates to start your journey.</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <button
                                    onClick={() => setSplitType('ppl')}
                                    type="button"
                                    className={`p-4 rounded-xl border text-left transition-all ${splitType === 'ppl' ? 'border-blue-500 bg-blue-500/10' : 'border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800'}`}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <Dumbbell className={`w-5 h-5 ${splitType === 'ppl' ? 'text-blue-500' : 'text-zinc-400'}`} />
                                        {splitType === 'ppl' && <Check className="w-4 h-4 text-blue-500" />}
                                    </div>
                                    <h3 className="text-white font-medium mb-1">Push / Pull / Legs</h3>
                                    <p className="text-xs text-zinc-300 font-semibold mb-2">3 to 6 Days / Week</p>
                                    <p className="text-xs text-zinc-400 leading-relaxed">Best for dedicated beginners and intermediates. Groups muscles by movement type. Requires a highly consistent schedule to hit all muscles effectively.</p>
                                </button>

                                <button
                                    onClick={() => setSplitType('upper_lower')}
                                    type="button"
                                    className={`p-4 rounded-xl border text-left transition-all ${splitType === 'upper_lower' ? 'border-blue-500 bg-blue-500/10' : 'border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800'}`}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <Target className={`w-5 h-5 ${splitType === 'upper_lower' ? 'text-blue-500' : 'text-zinc-400'}`} />
                                        {splitType === 'upper_lower' && <Check className="w-4 h-4 text-blue-500" />}
                                    </div>
                                    <h3 className="text-white font-medium mb-1">Upper / Lower</h3>
                                    <p className="text-xs text-zinc-300 font-semibold mb-2">4 Days / Week</p>
                                    <p className="text-xs text-zinc-400 leading-relaxed">The golden standard for balanced growth. Perfect for busy schedules (e.g. Mon/Tue & Thu/Fri). Hits muscles twice a week for optimal recovery.</p>
                                </button>

                                <button
                                    onClick={() => setSplitType('full_body')}
                                    type="button"
                                    className={`p-4 rounded-xl border text-left transition-all ${splitType === 'full_body' ? 'border-blue-500 bg-blue-500/10' : 'border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800'}`}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <Dumbbell className={`w-5 h-5 ${splitType === 'full_body' ? 'text-blue-500' : 'text-zinc-400'}`} />
                                        {splitType === 'full_body' && <Check className="w-4 h-4 text-blue-500" />}
                                    </div>
                                    <h3 className="text-white font-medium mb-1">Full Body</h3>
                                    <p className="text-xs text-zinc-300 font-semibold mb-2">2 to 3 Days / Week</p>
                                    <p className="text-xs text-zinc-400 leading-relaxed">Best for absolute beginners or very busy people. Hits every major muscle in one session. <span className="text-red-400 font-medium">Requires 48 hours rest between workouts. Do not do daily.</span></p>
                                </button>

                                <button
                                    onClick={() => setSplitType('blank')}
                                    type="button"
                                    className={`p-4 rounded-xl border text-left transition-all ${splitType === 'blank' ? 'border-blue-500 bg-blue-500/10' : 'border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800'}`}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <Calendar className={`w-5 h-5 ${splitType === 'blank' ? 'text-blue-500' : 'text-zinc-400'}`} />
                                        {splitType === 'blank' && <Check className="w-4 h-4 text-blue-500" />}
                                    </div>
                                    <h3 className="text-white font-medium mb-1">Blank Canvas</h3>
                                    <p className="text-xs text-zinc-300 font-semibold mb-2">Custom Schedule</p>
                                    <p className="text-xs text-zinc-400 leading-relaxed">Start from scratch and build your own custom templates later. Best for fitness experts who know exactly what they want.</p>
                                </button>
                            </div>

                            <div className="pt-6 mt-8 border-t border-zinc-800/50 flex gap-3">
                                <Button variant="outline" onClick={() => setStep(1)} className="flex-1 h-12 text-base font-semibold">
                                    Back
                                </Button>
                                <Button onClick={() => handleNextStep(2)} className="flex-1 gap-2 h-12 text-base font-semibold">
                                    Next Step <ArrowRight className="w-5 h-5 ml-2" />
                                </Button>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-6">
                            <div className="text-center mb-6">
                                <h2 className="text-xl font-semibold text-white mb-1">Target Training Days</h2>
                                <p className="text-sm text-zinc-400">Select the days you plan to workout. We'll use this to track your streaks.</p>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                                    <button
                                        key={day}
                                        type="button"
                                        onClick={() => {
                                            setSelectedDays(prev =>
                                                prev.includes(day)
                                                    ? prev.filter(d => d !== day)
                                                    : [...prev, day]
                                            );
                                        }}
                                        className={`p-3 text-sm font-medium rounded-lg border transition-all ${selectedDays.includes(day)
                                            ? 'bg-blue-500 border-blue-500 text-white shadow-lg'
                                            : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:bg-zinc-800'
                                            }`}
                                    >
                                        {day}
                                    </button>
                                ))}
                            </div>

                            <div className="pt-6 mt-8 border-t border-zinc-800/50 flex gap-3">
                                <Button variant="outline" onClick={() => setStep(2)} className="flex-1 h-12 text-base font-semibold">
                                    Back
                                </Button>
                                <Button
                                    onClick={handleSubmit(onSubmit)}
                                    className="flex-1 gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 h-12 text-base font-semibold"
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin mr-2" />
                                            Saving...
                                        </>
                                    ) : (
                                        "Finish Setup"
                                    )}
                                </Button>
                            </div>
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
};

export default OnboardingPage;
