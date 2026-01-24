import React from 'react';
import { Card, CardContent } from '../ui/Card';

export function ExerciseCard({ exercise, sets, onUpdateSets }) {
    // Parsing standard sets/reps if needed, but for now simple text input or structured inputs
    // Let's implement structured inputs for sets: [ {weight: 0, reps: 0} ] or just a simple log string?
    // "Exercise Set Logger" implies tracking sets. 
    // For simplicity MVP: 3 sets inputs.

    return (
        <Card className="mb-4 border-l-4 border-l-blue-500">
            <CardContent className="pt-6">
                <h4 className="text-lg font-semibold mb-4 text-slate-200">{exercise}</h4>
                <div className="space-y-3">
                    {[0, 1, 2].map((setIndex) => (
                        <div key={setIndex} className="flex items-center gap-2 md:gap-4">
                            <span className="text-xs font-mono text-zinc-500 w-8 md:w-12 shrink-0">SET {setIndex + 1}</span>
                            <input
                                type="number"
                                placeholder="kg"
                                className="flex-1 min-w-0 h-11 rounded-md border border-zinc-800 bg-zinc-950 px-2 md:px-3 py-1 text-base shadow-sm transition-colors placeholder:text-zinc-600 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500"
                            />
                            <input
                                type="number"
                                placeholder="reps"
                                className="flex-1 min-w-0 h-11 rounded-md border border-zinc-800 bg-zinc-950 px-2 md:px-3 py-1 text-base shadow-sm transition-colors placeholder:text-zinc-600 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500"
                            />
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
