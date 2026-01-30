import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { supabase } from '../lib/supabase';
import { useUserPreferences } from '../context/UserPreferencesContext';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Ruler, Weight, Target, ArrowRight, Check, Dumbbell, Calendar, Info, Loader2 } from 'lucide-react';

const OnboardingPage = () => {
    const navigate = useNavigate();
    const { heightUnit, weightUnit, toggleHeightUnit, toggleWeightUnit, convertHeightToCm, convertWeightToDb } = useUserPreferences();

    useEffect(() => {
        document.title = 'Onboarding | SmartFit';
    }, []);

    // Use Local Storage for persistence
    const [step, setStep] = useLocalStorage('onboarding_step', 1);

    // Step 1: Biometrics
    const [formData, setFormData] = useLocalStorage('onboarding_form', {
        height: '',
        currentWeight: '',
        goalWeight: '',
    });

    // Step 2: Routine
    const [routineType, setRoutineType] = useLocalStorage('onboarding_routine_type', 'default');
    const [selectedDays, setSelectedDays] = useLocalStorage('onboarding_custom_days', []);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleNextLastStep = async () => {
        setLoading(true);
        setError(null);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("No user found");

            // Save Profile
            let heightInCm;
            if (heightUnit === 'ft') {
                heightInCm = convertHeightToCm(formData.heightFt, formData.heightIn, 'ft');
            } else {
                heightInCm = convertHeightToCm(formData.height, null, 'cm');
            }

            const weightInKg = convertWeightToDb(formData.currentWeight);
            const goalWeightInKg = convertWeightToDb(formData.goalWeight);

            const { error: profileError } = await supabase
                .from('profiles')
                .upsert({
                    id: user.id,
                    height: heightInCm,
                    current_weight: weightInKg,
                    goal_weight: goalWeightInKg,
                    updated_at: new Date().toISOString()
                });

            if (profileError) throw profileError;

            // Save Initial Weight to History (so it shows on graph)
            // Save Initial Weight to History
            const today = new Date().toISOString().split('T')[0];
            if (weightInKg > 0) {
                // Check for existing entry today to avoid duplicates or errors
                const { data: existingEntry } = await supabase
                    .from('weight_history')
                    .select('id')
                    .eq('user_id', user.id)
                    .eq('date', today)
                    .maybeSingle();

                let historyError;

                if (existingEntry) {
                    const { error } = await supabase
                        .from('weight_history')
                        .update({ weight: weightInKg })
                        .eq('id', existingEntry.id);
                    historyError = error;
                } else {
                    const { error } = await supabase
                        .from('weight_history')
                        .insert({
                            user_id: user.id,
                            weight: weightInKg,
                            date: today
                        });
                    historyError = error;
                }

                if (historyError) {
                    console.error("Error saving weight history:", historyError);
                    // Don't block onboarding, but log it visible to user? 
                    // Better to just log for now as throwing might confuse them if profile worked.
                    // Actually, let's append to error state so they know.
                    setError("Profile saved, but weight history failed: " + historyError.message);
                    // Pause to let them see it? No, if we throw, we stop redirect.
                    // Let's NOT throw, but maybe delay or set a flag?
                    // We'll trust verifyProfile below.
                }
            }

            // Seed Routine
            if (routineType === 'default') {
                const defaultRoutines = [
                    { user_id: user.id, name: 'Push Day', schedule_days: ['Monday'], exercises: [] },
                    { user_id: user.id, name: 'Pull Day', schedule_days: ['Tuesday'], exercises: [] },
                    { user_id: user.id, name: 'Legs Day', schedule_days: ['Wednesday'], exercises: [] },
                ];
                const { error: routineError } = await supabase.from('routines').insert(defaultRoutines);
                if (routineError) console.error("Error seeding default:", routineError);
            } else if (routineType === 'custom') {
                const customRoutines = selectedDays.map(day => ({
                    user_id: user.id,
                    name: `Workout (${day})`,
                    schedule_days: [day],
                    exercises: []
                }));

                if (customRoutines.length > 0) {
                    const { error: routineError } = await supabase.from('routines').insert(customRoutines);
                    if (routineError) console.error("Error seeding custom:", routineError);
                }
            }

            // Verify Profile Created before Redirecting
            const { data: verifyProfile } = await supabase.from('profiles').select('id').eq('id', user.id).single();

            if (verifyProfile) {
                // Clear Storage
                localStorage.removeItem('onboarding_step');
                localStorage.removeItem('onboarding_form');
                localStorage.removeItem('onboarding_routine_type');
                localStorage.removeItem('onboarding_custom_days');

                // Force Reload to update App State
                window.location.href = '/';
            } else {
                throw new Error("Profile creation verification failed. Please try again.");
            }
        } catch (err) {
            console.error(err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
            <div className="max-w-2xl w-full">
                <div className="mb-8 text-center">
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-500 to-indigo-500 bg-clip-text text-transparent mb-2">
                        Welcome to SmartFit
                    </h1>
                    <p className="text-zinc-400">Let's set up your profile for success.</p>
                </div>

                {/* Progress Steps */}
                <div className="flex items-center justify-center gap-4 mb-8">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step >= 1 ? 'bg-blue-500 text-white' : 'bg-zinc-800 text-zinc-500'}`}>1</div>
                    <div className={`w-16 h-1 rounded bg-zinc-800`}>
                        <div className={`h-full bg-blue-500 transition-all duration-300 ${step >= 2 ? 'w-full' : 'w-0'}`} />
                    </div>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step >= 2 ? 'bg-blue-500 text-white' : 'bg-zinc-800 text-zinc-500'}`}>2</div>
                </div>

                <Card className="bg-zinc-900/50 border-zinc-800 p-6 md:p-8 backdrop-blur-xl">
                    {error && (
                        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm">
                            {error}
                        </div>
                    )}

                    {step === 1 && (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h2 className="text-xl font-semibold text-white mb-1">Your Biometrics</h2>
                                    <p className="text-sm text-zinc-400">Help the AI customize your plan.</p>
                                </div>
                                <button
                                    onClick={toggleWeightUnit}
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
                                                    type="number"
                                                    name="heightFt"
                                                    value={formData.heightFt || ''}
                                                    onChange={handleInputChange}
                                                    placeholder="Feet"
                                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                                                />
                                                <span className="absolute right-3 top-3 text-zinc-500 text-sm">ft</span>
                                            </div>
                                            <div className="flex-1 relative">
                                                <input
                                                    type="number"
                                                    name="heightIn"
                                                    value={formData.heightIn || ''}
                                                    onChange={handleInputChange}
                                                    placeholder="Inches"
                                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                                                />
                                                <span className="absolute right-3 top-3 text-zinc-500 text-sm">in</span>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex gap-2">
                                        <input
                                            type="number"
                                            name="height"
                                            value={formData.height || ''}
                                            onChange={handleInputChange}
                                            placeholder="Height in cm"
                                            className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                                        />
                                        <div className="flex items-center gap-2 bg-zinc-950 border border-zinc-800 rounded-lg px-2">
                                            <span className="text-zinc-400 text-sm">cm</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Current Weight Input */}
                            <div className="space-y-2">
                                <label className="text-sm text-zinc-400 flex items-center gap-2">
                                    <Weight className="w-4 h-4" /> Current Weight
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="number"
                                        name="currentWeight"
                                        value={formData.currentWeight}
                                        onChange={handleInputChange}
                                        placeholder={`Weight in ${weightUnit || 'kg'}`}
                                        className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                                    />
                                    <div className="flex items-center gap-2 bg-zinc-950 border border-zinc-800 rounded-lg px-2">
                                        <span className="text-zinc-400 text-sm">{weightUnit || 'kg'}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Goal Weight Input */}
                            <div className="space-y-2">
                                <label className="text-sm text-zinc-400 flex items-center gap-2">
                                    <Target className="w-4 h-4" /> Goal Weight
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="number"
                                        name="goalWeight"
                                        value={formData.goalWeight}
                                        onChange={handleInputChange}
                                        placeholder={`Goal in ${weightUnit || 'kg'}`}
                                        className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                                    />
                                    <div className="flex items-center gap-2 bg-zinc-950 border border-zinc-800 rounded-lg px-2">
                                        <span className="text-zinc-400 text-sm">{weightUnit || 'kg'}</span>
                                    </div>
                                </div>
                            </div>

                            <Button
                                onClick={() => setStep(2)}
                                className="w-full mt-4"
                                disabled={
                                    (!formData.currentWeight || !formData.goalWeight) ||
                                    (heightUnit === 'ft' ? (!formData.heightFt || !formData.heightIn) : !formData.height)
                                }
                            >
                                Next Step <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-6">
                            <div className="text-center mb-6">
                                <h2 className="text-xl font-semibold text-white mb-1">Setup Routine</h2>
                                <p className="text-sm text-zinc-400">Choose how you want to train.</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <button
                                    onClick={() => setRoutineType('default')}
                                    type="button"
                                    className={`p-4 rounded-xl border text-left transition-all ${routineType === 'default' ? 'border-blue-500 bg-blue-500/10' : 'border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800'}`}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <Dumbbell className={`w-5 h-5 ${routineType === 'default' ? 'text-blue-500' : 'text-zinc-400'}`} />
                                        {routineType === 'default' && <Check className="w-4 h-4 text-blue-500" />}
                                    </div>
                                    <h3 className="text-white font-medium mb-1">Expert Default (PPL)</h3>
                                    <p className="text-xs text-zinc-400">Proven Push-Pull-Legs split suitable for most goals.</p>
                                </button>

                                <button
                                    onClick={() => setRoutineType('custom')} // Just text for now, Logic would be complex for full custom in step 2
                                    type="button"
                                    className={`p-4 rounded-xl border text-left transition-all ${routineType === 'custom' ? 'border-blue-500 bg-blue-500/10' : 'border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800'}`}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <Calendar className={`w-5 h-5 ${routineType === 'custom' ? 'text-blue-500' : 'text-zinc-400'}`} />
                                        {routineType === 'custom' && <Check className="w-4 h-4 text-blue-500" />}
                                    </div>
                                    <h3 className="text-white font-medium mb-1">Customize My Week</h3>
                                    <p className="text-xs text-zinc-400">Build your own split from scratch. (Coming Soon)</p>
                                </button>
                            </div>

                            {routineType === 'custom' && (
                                <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                                    <h4 className="text-sm font-medium text-zinc-300">Select Training Days</h4>
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
                                                className={`p-2 text-xs rounded-lg border transition-all ${selectedDays.includes(day)
                                                    ? 'bg-blue-500 border-blue-500 text-white'
                                                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                                                    }`}
                                            >
                                                {day}
                                            </button>
                                        ))}
                                    </div>
                                    <p className="text-xs text-zinc-500">Select the days you plan to workout.</p>
                                </div>
                            )}

                            <div className="flex gap-3 mt-8">
                                <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                                    Back
                                </Button>
                                <Button
                                    onClick={handleNextLastStep}
                                    className="flex-1 gap-2"
                                    disabled={loading || (routineType === 'custom' && selectedDays.length === 0)}
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Setting up...
                                        </>
                                    ) : (
                                        "Complete Setup"
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
