import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from '../ui/Button';
import { X, ChevronDown, AlertTriangle, Sparkles, Loader2 } from 'lucide-react';
import { hapticLight, hapticSuccess } from '../../lib/haptics';
import { recalculateFoodItem } from '../../lib/openai';

const UNITS = ['g', 'ml', 'piece', 'slice', 'cup', 'tbsp', 'serving', 'large', 'medium', 'small'];
const PREPS = ['raw', 'boiled', 'fried', 'grilled', 'baked', 'steamed', 'toasted', 'cooked', 'spread', 'as described'];

/**
 * FoodConfirmationModal — shows the AI-parsed food breakdown before saving.
 * Users can edit quantities, units, and prep methods.
 * Totals are recalculated live from individual items using linear scaling.
 */
export function FoodConfirmationModal({ isOpen, onClose, parsedData, mealType, onConfirm }) {
    // Deep clone foods so edits don't mutate the original
    const [foods, setFoods] = useState(() => 
        (parsedData?.foods || []).map(f => ({ ...f, _origQuantity: f.quantity }))
    );
    const [recalculatingIndices, setRecalculatingIndices] = useState(new Set());

    // Sync foods when parsedData changes (e.g. on new modal open)
    useEffect(() => {
        if (parsedData?.foods) {
            setFoods(parsedData.foods.map(f => ({ ...f, _origQuantity: f.quantity })));
        } else {
            setFoods([]);
        }
    }, [parsedData]);

    // Recalculate totals from individual food items (code-calculated)
    const totals = useMemo(() => {
        return foods.reduce((acc, food) => {
            // Linear scaling: if user changed quantity, scale macros proportionally
            const scale = food._origQuantity > 0 ? food.quantity / food._origQuantity : 1;
            const protein = Math.max(0, Math.round(food.protein * scale));
            const carbs = Math.max(0, Math.round(food.carbs * scale));
            const fats = Math.max(0, Math.round(food.fats * scale));
            const calories = Math.round((protein * 4) + (carbs * 4) + (fats * 9));

            return {
                calories: acc.calories + calories,
                protein: acc.protein + protein,
                carbs: acc.carbs + carbs,
                fats: acc.fats + fats,
            };
        }, { calories: 0, protein: 0, carbs: 0, fats: 0 });
    }, [foods]);

    const updateFood = async (index, field, value) => {
        hapticLight();
        
        const shouldRecalculate = (field === 'unit' || field === 'prep');
        
        setFoods(prev => {
            const updated = [...prev];
            updated[index] = { ...updated[index], [field]: value };
            return updated;
        });

        if (shouldRecalculate) {
            setRecalculatingIndices(prev => {
                const newSet = new Set(prev);
                newSet.add(index);
                return newSet;
            });

            try {
                // Get the updated food item details
                const updatedFood = foods[index];
                const newMacros = await recalculateFoodItem({
                    name: updatedFood.name,
                    quantity: updatedFood.quantity,
                    unit: field === 'unit' ? value : updatedFood.unit,
                    prep: field === 'prep' ? value : updatedFood.prep
                });

                setFoods(prev => {
                    const updated = [...prev];
                    updated[index] = {
                        ...updated[index],
                        protein: newMacros.protein,
                        carbs: newMacros.carbs,
                        fats: newMacros.fats,
                        calories: newMacros.calories,
                        _origQuantity: updated[index].quantity // Reset original quantity so scale becomes 1
                    };
                    return updated;
                });
            } catch (error) {
                console.error("Failed to recalculate food item:", error);
                // On error, we just leave the previous macros
            } finally {
                setRecalculatingIndices(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(index);
                    return newSet;
                });
            }
        }
    };

    const handleConfirm = () => {
        hapticSuccess();
        // Build the final food items with scaled macros
        const finalFoods = foods.map(food => {
            const scale = food._origQuantity > 0 ? food.quantity / food._origQuantity : 1;
            return {
                ...food,
                protein: Math.max(0, Math.round(food.protein * scale)),
                carbs: Math.max(0, Math.round(food.carbs * scale)),
                fats: Math.max(0, Math.round(food.fats * scale)),
                calories: Math.round(
                    (Math.max(0, Math.round(food.protein * scale)) * 4) +
                    (Math.max(0, Math.round(food.carbs * scale)) * 4) +
                    (Math.max(0, Math.round(food.fats * scale)) * 9)
                )
            };
        });

        onConfirm({
            food_name: parsedData?.food_name || 'Meal',
            foods: finalFoods,
            ...totals,
            mealType
        });
    };

    if (!isOpen) return null;

    return createPortal(
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-end justify-center h-[100dvh]">
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-slate-900/60 dark:bg-black/60 backdrop-blur-sm" 
                    onClick={onClose} 
                />

                <motion.div 
                    initial={{ y: '100%', opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: '100%', opacity: 0 }}
                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    drag="y"
                    dragConstraints={{ top: 0, bottom: 0 }}
                    dragElastic={0.2}
                    onDragEnd={(e, { offset, velocity }) => {
                        if (offset.y > 100 || velocity.y > 500) onClose();
                    }}
                    className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-t-3xl shadow-2xl p-6 pb-safe max-h-[85dvh] flex flex-col z-10"
                >
                    <div className="flex justify-center mb-4 shrink-0">
                        <div className="w-12 h-1.5 bg-slate-200 dark:bg-zinc-800 rounded-full" />
                    </div>

                    {/* Header */}
                    <div className="flex justify-between items-center mb-4 shrink-0">
                        <div>
                            <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-amber-500" />
                                AI Estimated Breakdown
                            </h2>
                            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                                Review and adjust before logging
                            </p>
                        </div>
                        <button onClick={onClose} className="p-2 bg-slate-100 dark:bg-zinc-800 rounded-full text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Estimated disclaimer */}
                    <div className="flex items-start gap-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40 rounded-xl p-3 mb-4 shrink-0">
                        <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                        <p className="text-xs text-amber-700 dark:text-amber-300">
                            These are <strong>AI estimates</strong>. Adjust quantities if needed — macros will scale automatically.
                        </p>
                    </div>

                    {/* Food Items — scrollable */}
                    <div className="flex-1 overflow-y-auto hide-scrollbar space-y-3 min-h-0 pb-2">
                        {foods.map((food, index) => (
                            <div key={index} className="bg-slate-50 dark:bg-zinc-800/50 rounded-xl p-3 border border-slate-100 dark:border-zinc-700/50">
                                <div className="font-semibold text-sm text-slate-800 dark:text-slate-200 mb-2 flex items-center justify-between">
                                    {food.name}
                                    {recalculatingIndices.has(index) && (
                                        <Loader2 className="w-3.5 h-3.5 animate-spin text-violet-500" />
                                    )}
                                </div>
                                
                                {/* Editable row: quantity, unit, prep */}
                                <div className="flex gap-2 mb-2">
                                    {/* Quantity */}
                                    <div className="flex-1">
                                        <label className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-zinc-500 font-semibold mb-0.5 block">Qty</label>
                                        <input
                                            type="number"
                                            min="0"
                                            step="any"
                                            value={food.quantity}
                                            onChange={(e) => updateFood(index, 'quantity', Math.max(0, parseFloat(e.target.value) || 0))}
                                            className="w-full px-2 py-1.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-600 rounded-lg text-sm text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-violet-500 outline-none"
                                        />
                                    </div>
                                    
                                    {/* Unit */}
                                    <div className="flex-1">
                                        <label className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-zinc-500 font-semibold mb-0.5 block">Unit</label>
                                        <select
                                            value={food.unit}
                                            onChange={(e) => updateFood(index, 'unit', e.target.value)}
                                            className="w-full px-2 py-1.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-600 rounded-lg text-sm text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-violet-500 outline-none appearance-none"
                                        >
                                            {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                                        </select>
                                    </div>

                                    {/* Prep */}
                                    <div className="flex-1">
                                        <label className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-zinc-500 font-semibold mb-0.5 block">Prep</label>
                                        <select
                                            value={food.prep}
                                            onChange={(e) => updateFood(index, 'prep', e.target.value)}
                                            className="w-full px-2 py-1.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-600 rounded-lg text-sm text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-violet-500 outline-none appearance-none"
                                        >
                                            {PREPS.map(p => <option key={p} value={p}>{p}</option>)}
                                        </select>
                                    </div>
                                </div>

                                {/* Per-item macros (scaled, read-only) */}
                                {(() => {
                                    const scale = food._origQuantity > 0 ? food.quantity / food._origQuantity : 1;
                                    const p = Math.max(0, Math.round(food.protein * scale));
                                    const c = Math.max(0, Math.round(food.carbs * scale));
                                    const f = Math.max(0, Math.round(food.fats * scale));
                                    const cal = Math.round((p * 4) + (c * 4) + (f * 9));
                                    return (
                                        <div className="flex gap-3 text-[11px] text-slate-500 dark:text-zinc-400">
                                            <span className="font-medium text-slate-700 dark:text-zinc-300">~{cal} kcal</span>
                                            <span>P: {p}g</span>
                                            <span>C: {c}g</span>
                                            <span>F: {f}g</span>
                                        </div>
                                    );
                                })()}
                            </div>
                        ))}
                    </div>

                    {/* Totals Footer */}
                    <div className="mt-3 pt-3 border-t border-slate-200 dark:border-zinc-700 shrink-0">
                        <div className="flex justify-between items-center mb-3">
                            <span className="text-sm font-bold text-slate-800 dark:text-white">Estimated Total</span>
                            <span className="text-lg font-bold text-violet-600 dark:text-violet-400">~{totals.calories} kcal</span>
                        </div>
                        <div className="flex justify-center gap-6 text-xs font-medium text-slate-500 dark:text-zinc-400 mb-4">
                            <span>Protein: <strong className="text-blue-600 dark:text-blue-400">{totals.protein}g</strong></span>
                            <span>Carbs: <strong className="text-amber-600 dark:text-amber-400">{totals.carbs}g</strong></span>
                            <span>Fats: <strong className="text-rose-600 dark:text-rose-400">{totals.fats}g</strong></span>
                        </div>

                        <div className="flex gap-2">
                            <Button
                                onClick={onClose}
                                variant="outline"
                                className="flex-1 h-12 rounded-xl text-sm font-medium"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleConfirm}
                                disabled={recalculatingIndices.size > 0}
                                className="flex-1 h-12 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold shadow-lg shadow-violet-500/20"
                            >
                                {recalculatingIndices.size > 0 ? (
                                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Recalculating...</>
                                ) : (
                                    '✓ Confirm & Log'
                                )}
                            </Button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>,
        document.body
    );
}
