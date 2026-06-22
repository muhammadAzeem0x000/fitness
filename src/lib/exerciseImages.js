import { supabase } from './supabase';

/**
 * In-memory cache for exercise library lookups.
 * Populated on first request, keyed by lowercase exercise name.
 */
let exerciseLibraryCache = null;
let cacheTimestamp = 0;
const CACHE_KEY = 'antigravity_exercise_library_v2';
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

/**
 * Fetches the full exercise library from Supabase and caches it.
 */
async function loadLibraryCache() {
  const now = Date.now();
  
  // 1. Check in-memory cache
  if (exerciseLibraryCache && (now - cacheTimestamp) < CACHE_TTL) {
    return exerciseLibraryCache;
  }

  // 2. Check localStorage cache (persists across page refreshes)
  try {
    const cachedDataStr = localStorage.getItem(CACHE_KEY);
    if (cachedDataStr) {
      const cachedData = JSON.parse(cachedDataStr);
      if (cachedData && cachedData.timestamp && (now - cachedData.timestamp) < CACHE_TTL) {
        // Rebuild in-memory map
        const cache = new Map();
        cachedData.data.forEach(ex => {
          cache.set(ex.name.toLowerCase(), ex);
          if (ex.display_name) {
            cache.set(ex.display_name.toLowerCase(), ex);
          }
        });
        exerciseLibraryCache = cache;
        cacheTimestamp = cachedData.timestamp;
        return cache;
      }
    }
  } catch (err) {
    console.warn('Failed to read exercise library from localStorage:', err);
  }

  const { data, error } = await supabase
    .from('exercise_library')
    .select('id, name, display_name, app_category, category, equipment, target, muscle_group, image_url, gif_url, instructions_en, instruction_steps')
    .order('name');

  if (error) {
    console.error('Failed to load exercise library:', error);
    return exerciseLibraryCache || new Map();
  }

  // 4. Update both in-memory cache and localStorage
  const cache = new Map();
  data.forEach(ex => {
    cache.set(ex.name.toLowerCase(), ex);
    if (ex.display_name) {
      cache.set(ex.display_name.toLowerCase(), ex);
    }
  });

  exerciseLibraryCache = cache;
  cacheTimestamp = now;

  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({
      timestamp: now,
      data: data
    }));
  } catch (err) {
    console.warn('Failed to save exercise library to localStorage:', err);
  }

  return cache;
}

/**
 * Gets exercise library data for a given exercise name.
 * Tries exact match first, then fuzzy matching.
 * 
 * @param {string} exerciseName - The exercise name to look up
 * @returns {Object|null} Exercise library data or null
 */
export async function getExerciseData(exerciseName) {
  if (!exerciseName) return null;
  const cache = await loadLibraryCache();
  const lower = exerciseName.toLowerCase().trim();

  // Direct match
  if (cache.has(lower)) return cache.get(lower);

  // Robust Word-based partial matching
  // Remove punctuation and split into words
  const targetWords = lower.replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean);
  
  let bestMatch = null;
  let bestScore = 0;

  for (const [key, value] of cache) {
    const keyWords = key.replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean);
    
    // Calculate overlap: how many target words are in the key words?
    let overlap = 0;
    for (const tw of targetWords) {
      // Allow partial word matches (e.g., "dumbell" vs "dumbbell" or "raise" vs "raises")
      // To be safe and fast, just check if the key word includes the target word or vice-versa
      if (keyWords.some(kw => kw.includes(tw) || tw.includes(kw))) {
        overlap++;
      }
    }

    // Calculate score percentage (overlap / max words)
    // We want to penalize keys that have way too many extra words, but prioritize high overlap
    const score = overlap / Math.max(targetWords.length, keyWords.length);

    // If it's a very strong match (e.g. all words match)
    if (score > bestScore) {
      bestScore = score;
      bestMatch = value;
    }
  }

  // Require at least a 50% word overlap to consider it a valid match
  if (bestScore >= 0.5) {
    return bestMatch;
  }

  return null;
}

/**
 * Gets the thumbnail image URL for an exercise.
 * Returns a Supabase Storage public URL or null.
 */
export async function getExerciseImage(exerciseName) {
  const data = await getExerciseData(exerciseName);
  return data?.image_url || null;
}

/**
 * Gets the animated GIF URL for an exercise (from GitHub).
 */
export async function getExerciseGif(exerciseName) {
  const data = await getExerciseData(exerciseName);
  return data?.gif_url || null;
}

export async function getExerciseDataBatch(exerciseNames) {
  // We can just rely on getExerciseData which has the robust fuzzy matching
  // and already caches the library internally, so it's very fast.
  const results = new Map();
  for (const name of exerciseNames) {
    const data = await getExerciseData(name);
    results.set(name, data);
  }
  return results;
}

/**
 * Gets all exercises from the library grouped by app_category.
 * Used to populate the exercise picker with the full library.
 */
export async function getExerciseLibrary() {
  const cache = await loadLibraryCache();
  
  // Deduplicate (cache has entries by name AND display_name)
  const seen = new Set();
  const exercises = [];
  
  for (const [, ex] of cache) {
    if (seen.has(ex.id)) continue;
    seen.add(ex.id);
    exercises.push(ex);
  }

  return exercises;
}

/**
 * Formats equipment name for display.
 */
export function formatEquipment(equipment) {
  if (!equipment) return '';
  return equipment
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Formats target muscle for display.
 */
export function formatTarget(target) {
  if (!target) return '';
  return target
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Returns a fallback emoji/icon for a category when no image is available.
 */
export function getCategoryFallbackIcon(category) {
  const icons = {
    'Chest': '👕',
    'Back': '🎒',
    'Shoulders': '🏋️',
    'Arms': '💪',
    'Legs': '🦵',
    'Core': '🔥',
    'Cardio': '🏃',
  };
  return icons[category] || '🎯';
}

/**
 * Invalidates the cache so next call re-fetches from Supabase.
 */
export function invalidateExerciseCache() {
  exerciseLibraryCache = null;
  cacheTimestamp = 0;
}
