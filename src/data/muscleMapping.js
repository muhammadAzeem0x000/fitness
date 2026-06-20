/**
 * Exercise → Muscle Group Mapping
 * Maps exercise names to their primary and secondary muscle groups.
 * Used by useMuscleIntensity hook to compute per-muscle training data.
 */

// Primary muscles = main target (100% set credit)
// Secondary muscles = assistors (40% set credit)
export const EXERCISE_MUSCLE_MAP = {
  // ══════════════ CHEST ══════════════
  'Barbell Bench Press':     { primary: ['chest'], secondary: ['shoulders', 'triceps'] },
  'Flat Bench Press':        { primary: ['chest'], secondary: ['shoulders', 'triceps'] },
  'Incline Dumbbell Press':  { primary: ['chest'], secondary: ['shoulders', 'triceps'] },
  'Incline Bench Press':     { primary: ['chest'], secondary: ['shoulders', 'triceps'] },
  'Decline Bench Press':     { primary: ['chest'], secondary: ['triceps'] },
  'Dumbbell Bench Press':    { primary: ['chest'], secondary: ['shoulders', 'triceps'] },
  'Cable Flyes':             { primary: ['chest'], secondary: ['shoulders'] },
  'Cable Crossovers':        { primary: ['chest'], secondary: ['shoulders'] },
  'Dumbbell Flyes':          { primary: ['chest'], secondary: ['shoulders'] },
  'Incline Dumbbell Flyes':  { primary: ['chest'], secondary: ['shoulders'] },
  'Push-Ups':                { primary: ['chest'], secondary: ['shoulders', 'triceps'] },
  'Weighted Dips':           { primary: ['chest', 'triceps'], secondary: ['shoulders'] },
  'Dips':                    { primary: ['chest', 'triceps'], secondary: ['shoulders'] },
  'Machine Chest Press':     { primary: ['chest'], secondary: ['shoulders', 'triceps'] },
  'Pec Deck':                { primary: ['chest'], secondary: [] },

  // ══════════════ BACK ══════════════
  'Deadlift':                { primary: ['back', 'hamstrings', 'glutes'], secondary: ['forearms', 'traps'] },
  'Barbell Rows':            { primary: ['back'], secondary: ['biceps', 'forearms'] },
  'Bent Over Rows':          { primary: ['back'], secondary: ['biceps'] },
  'Pull-Ups':                { primary: ['back'], secondary: ['biceps'] },
  'Chin-Ups':                { primary: ['back', 'biceps'], secondary: ['forearms'] },
  'Lat Pulldowns':           { primary: ['back'], secondary: ['biceps'] },
  'Seated Cable Rows':       { primary: ['back'], secondary: ['biceps'] },
  'T-Bar Rows':              { primary: ['back'], secondary: ['biceps', 'forearms'] },
  'Dumbbell Rows':           { primary: ['back'], secondary: ['biceps'] },
  'Single Arm Dumbbell Row': { primary: ['back'], secondary: ['biceps'] },
  'Cable Rows':              { primary: ['back'], secondary: ['biceps'] },
  'Pendlay Rows':            { primary: ['back'], secondary: ['biceps', 'lower_back'] },
  'Meadows Rows':            { primary: ['back'], secondary: ['biceps'] },
  'Chest Supported Rows':    { primary: ['back'], secondary: ['biceps'] },

  // ══════════════ SHOULDERS ══════════════
  'Overhead Press':          { primary: ['shoulders'], secondary: ['triceps', 'traps'] },
  'Seated Dumbbell Press':   { primary: ['shoulders'], secondary: ['triceps'] },
  'Dumbbell Shoulder Press': { primary: ['shoulders'], secondary: ['triceps'] },
  'Military Press':          { primary: ['shoulders'], secondary: ['triceps', 'traps'] },
  'Arnold Press':            { primary: ['shoulders'], secondary: ['triceps'] },
  'Lateral Raises':          { primary: ['shoulders'], secondary: [] },
  'Front Raises':            { primary: ['shoulders'], secondary: [] },
  'Rear Delt Flyes':         { primary: ['shoulders'], secondary: ['back'] },
  'Face Pulls':              { primary: ['shoulders'], secondary: ['back', 'traps'] },
  'Upright Rows':            { primary: ['shoulders', 'traps'], secondary: ['biceps'] },
  'Cable Lateral Raises':    { primary: ['shoulders'], secondary: [] },
  'Machine Shoulder Press':  { primary: ['shoulders'], secondary: ['triceps'] },

  // ══════════════ TRAPS ══════════════
  'Dumbbell Shrugs':         { primary: ['traps'], secondary: [] },
  'Barbell Shrugs':          { primary: ['traps'], secondary: ['forearms'] },
  'Farmer Walks':            { primary: ['traps', 'forearms'], secondary: ['abs'] },

  // ══════════════ BICEPS ══════════════
  'Bicep Curls':             { primary: ['biceps'], secondary: ['forearms'] },
  'Barbell Curls':           { primary: ['biceps'], secondary: ['forearms'] },
  'Dumbbell Bicep Curls':    { primary: ['biceps'], secondary: ['forearms'] },
  'Hammer Curls':            { primary: ['biceps', 'forearms'], secondary: [] },
  'Preacher Curls':          { primary: ['biceps'], secondary: [] },
  'Concentration Curls':     { primary: ['biceps'], secondary: [] },
  'Incline Curls':           { primary: ['biceps'], secondary: [] },
  'Cable Curls':             { primary: ['biceps'], secondary: ['forearms'] },
  'EZ Bar Curls':            { primary: ['biceps'], secondary: ['forearms'] },
  'Spider Curls':            { primary: ['biceps'], secondary: [] },

  // ══════════════ TRICEPS ══════════════
  'Tricep Pushdowns':        { primary: ['triceps'], secondary: [] },
  'Tricep Rope Pushdowns':   { primary: ['triceps'], secondary: [] },
  'Skullcrushers':           { primary: ['triceps'], secondary: [] },
  'Overhead Tricep Extension': { primary: ['triceps'], secondary: [] },
  'Close Grip Bench Press':  { primary: ['triceps'], secondary: ['chest'] },
  'Tricep Kickbacks':        { primary: ['triceps'], secondary: [] },
  'Diamond Push-Ups':        { primary: ['triceps'], secondary: ['chest'] },

  // ══════════════ FOREARMS ══════════════
  'Wrist Curls':             { primary: ['forearms'], secondary: [] },
  'Reverse Curls':           { primary: ['forearms'], secondary: ['biceps'] },

  // ══════════════ QUADS ══════════════
  'Barbell Squat':           { primary: ['quads', 'glutes'], secondary: ['hamstrings', 'lower_back', 'abs'] },
  'Barbell Squats':          { primary: ['quads', 'glutes'], secondary: ['hamstrings', 'lower_back', 'abs'] },
  'Front Squat':             { primary: ['quads'], secondary: ['glutes', 'abs'] },
  'Leg Press':               { primary: ['quads', 'glutes'], secondary: ['hamstrings'] },
  'Hack Squat':              { primary: ['quads'], secondary: ['glutes'] },
  'Leg Extensions':          { primary: ['quads'], secondary: [] },
  'Goblet Squat':            { primary: ['quads', 'glutes'], secondary: ['abs'] },
  'Smith Machine Squat':     { primary: ['quads', 'glutes'], secondary: ['hamstrings'] },
  'Sissy Squat':             { primary: ['quads'], secondary: [] },

  // ══════════════ HAMSTRINGS ══════════════
  'Romanian Deadlift':       { primary: ['hamstrings', 'glutes'], secondary: ['lower_back'] },
  'Romanian Deadlifts':      { primary: ['hamstrings', 'glutes'], secondary: ['lower_back'] },
  'Stiff Leg Deadlift':      { primary: ['hamstrings'], secondary: ['lower_back', 'glutes'] },
  'Leg Curls':               { primary: ['hamstrings'], secondary: [] },
  'Lying Leg Curls':         { primary: ['hamstrings'], secondary: [] },
  'Seated Leg Curls':        { primary: ['hamstrings'], secondary: [] },
  'Nordic Curls':            { primary: ['hamstrings'], secondary: [] },
  'Good Mornings':           { primary: ['hamstrings', 'lower_back'], secondary: ['glutes'] },

  // ══════════════ GLUTES ══════════════
  'Hip Thrusts':             { primary: ['glutes'], secondary: ['hamstrings'] },
  'Glute Bridges':           { primary: ['glutes'], secondary: ['hamstrings'] },
  'Cable Pull Through':      { primary: ['glutes'], secondary: ['hamstrings'] },
  'Donkey Kicks':            { primary: ['glutes'], secondary: [] },

  // ══════════════ COMPOUND LEGS ══════════════
  'Lunges':                  { primary: ['quads', 'glutes'], secondary: ['hamstrings'] },
  'Walking Lunges':          { primary: ['quads', 'glutes'], secondary: ['hamstrings'] },
  'Bulgarian Split Squats':  { primary: ['quads', 'glutes'], secondary: ['hamstrings'] },
  'Step Ups':                { primary: ['quads', 'glutes'], secondary: ['hamstrings'] },

  // ══════════════ CALVES ══════════════
  'Calf Raises':             { primary: ['calves'], secondary: [] },
  'Standing Calf Raises':    { primary: ['calves'], secondary: [] },
  'Seated Calf Raises':      { primary: ['calves'], secondary: [] },

  // ══════════════ ABS / CORE ══════════════
  'Crunches':                { primary: ['abs'], secondary: ['obliques'] },
  'Sit-Ups':                 { primary: ['abs'], secondary: ['obliques'] },
  'Planks':                  { primary: ['abs'], secondary: ['obliques', 'lower_back'] },
  'Russian Twists':          { primary: ['obliques'], secondary: ['abs'] },
  'Leg Raises':              { primary: ['abs'], secondary: [] },
  'Hanging Leg Raises':      { primary: ['abs'], secondary: ['forearms'] },
  'Ab Rollouts':             { primary: ['abs'], secondary: ['shoulders'] },
  'Cable Woodchops':         { primary: ['obliques'], secondary: ['abs'] },
  'Mountain Climbers':       { primary: ['abs'], secondary: ['shoulders', 'quads'] },
  'Dead Bugs':               { primary: ['abs'], secondary: ['lower_back'] },
  'Bicycle Crunches':        { primary: ['abs', 'obliques'], secondary: [] },
  'Ab Wheel':                { primary: ['abs'], secondary: ['shoulders', 'lower_back'] },

  // ══════════════ LOWER BACK ══════════════
  'Back Extensions':         { primary: ['lower_back'], secondary: ['glutes'] },
  'Hyperextensions':         { primary: ['lower_back'], secondary: ['glutes', 'hamstrings'] },
  'Superman':                { primary: ['lower_back'], secondary: ['glutes'] },

  // ══════════════ FULL BODY / CARDIO ══════════════
  'Burpees':                 { primary: ['chest', 'quads'], secondary: ['shoulders', 'abs', 'triceps'] },
  'Clean and Press':         { primary: ['shoulders', 'quads', 'traps'], secondary: ['back', 'glutes'] },
  'Kettlebell Swings':       { primary: ['glutes', 'hamstrings'], secondary: ['lower_back', 'shoulders'] },
  'Thrusters':               { primary: ['quads', 'shoulders'], secondary: ['glutes', 'triceps'] },
  'Battle Ropes':            { primary: ['shoulders'], secondary: ['abs', 'forearms'] },
};

/**
 * Muscle group display labels and metadata
 */
export const MUSCLE_LABELS = {
  chest:      { name: 'Chest',       emoji: '👕', shortName: 'Chest' },
  back:       { name: 'Back',        emoji: '🎒', shortName: 'Back' },
  shoulders:  { name: 'Shoulders',   emoji: '🏋️', shortName: 'Delts' },
  traps:      { name: 'Traps',       emoji: '🏋️', shortName: 'Traps' },
  biceps:     { name: 'Biceps',      emoji: '💪', shortName: 'Bis' },
  triceps:    { name: 'Triceps',     emoji: '💪', shortName: 'Tris' },
  forearms:   { name: 'Forearms',    emoji: '💪', shortName: 'Fore' },
  abs:        { name: 'Abs',         emoji: '🔥', shortName: 'Abs' },
  obliques:   { name: 'Obliques',    emoji: '🔥', shortName: 'Obl' },
  quads:      { name: 'Quads',       emoji: '🦵', shortName: 'Quads' },
  hamstrings: { name: 'Hamstrings',  emoji: '🦵', shortName: 'Hams' },
  glutes:     { name: 'Glutes',      emoji: '🦵', shortName: 'Glutes' },
  calves:     { name: 'Calves',      emoji: '🦵', shortName: 'Calves' },
  lower_back: { name: 'Lower Back',  emoji: '🎒', shortName: 'L.Back' },
};

/**
 * All tracked muscle group keys
 */
export const ALL_MUSCLE_GROUPS = Object.keys(MUSCLE_LABELS);

/**
 * Attempt to guess muscle group from workout type name (fallback)
 */
export function guessMuscleGroupFromType(typeName) {
  const t = (typeName || '').toLowerCase();
  if (t.includes('push'))      return ['chest', 'shoulders', 'triceps'];
  if (t.includes('pull'))      return ['back', 'biceps', 'forearms'];
  if (t.includes('leg'))       return ['quads', 'hamstrings', 'glutes', 'calves'];
  if (t.includes('chest'))     return ['chest'];
  if (t.includes('back'))      return ['back'];
  if (t.includes('shoulder'))  return ['shoulders'];
  if (t.includes('arm'))       return ['biceps', 'triceps'];
  if (t.includes('bicep'))     return ['biceps'];
  if (t.includes('tricep'))    return ['triceps'];
  if (t.includes('core') || t.includes('abs')) return ['abs', 'obliques'];
  if (t.includes('upper'))     return ['chest', 'back', 'shoulders', 'biceps', 'triceps'];
  if (t.includes('lower'))     return ['quads', 'hamstrings', 'glutes', 'calves'];
  if (t.includes('full'))      return ['chest', 'back', 'shoulders', 'quads', 'hamstrings'];
  if (t.includes('glute'))     return ['glutes'];
  return [];
}
