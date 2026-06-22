/**
 * Seed script for exercise_library table.
 * 
 * Fetches the hasaneyldrm/exercises-dataset from GitHub,
 * maps categories, and inserts all records into Supabase.
 * 
 * Usage: node scripts/seed-exercise-library.mjs
 * 
 * Requires: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load .env manually (no dotenv dependency needed)
function loadEnv() {
  try {
    // Try .env.local first (Vite convention), then .env
    let envPath = resolve(__dirname, '..', '.env.local');
    try { readFileSync(envPath); } catch { envPath = resolve(__dirname, '..', '.env'); }
    const envContent = readFileSync(envPath, 'utf-8');
    const vars = {};
    envContent.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx === -1) return;
      const key = trimmed.slice(0, eqIdx).trim();
      let value = trimmed.slice(eqIdx + 1).trim();
      // Remove surrounding quotes
      if ((value.startsWith('"') && value.endsWith('"')) || 
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      vars[key] = value;
    });
    return vars;
  } catch (e) {
    console.error('Could not read .env file:', e.message);
    process.exit(1);
  }
}

const env = loadEnv();
const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseKey = env.VITE_SUPABASE_ANON_KEY || env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// GitHub raw base URL for this dataset
const GITHUB_RAW_BASE = 'https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main';
const DATASET_URL = `${GITHUB_RAW_BASE}/data/exercises.json`;

/**
 * Map dataset body_part categories to our app categories
 */
const CATEGORY_MAP = {
  'chest': 'Chest',
  'back': 'Back',
  'shoulders': 'Shoulders',
  'upper arms': 'Arms',
  'lower arms': 'Arms',
  'upper legs': 'Legs',
  'lower legs': 'Legs',
  'waist': 'Core',
  'cardio': 'Cardio',
  'neck': 'Shoulders',
};

/**
 * Our existing exercise names from seeding.js (for display_name matching)
 */
const OUR_EXERCISES = {
  'barbell bench press': 'Barbell Bench Press',
  'incline dumbbell press': 'Incline Dumbbell Press',
  'dumbbell flyes': 'Dumbbell Flyes',
  'dumbbell pullover': 'Dumbbell Pullover',
  'cable crossovers': 'Cable Crossovers',
  'push-ups': 'Push-Ups',
  'push ups': 'Push-Ups',
  'push up': 'Push-Ups',
  'machine chest press': 'Machine Chest Press',
  'incline barbell press': 'Incline Barbell Press',
  'decline bench press': 'Decline Bench Press',
  'pec deck fly': 'Pec Deck Fly',
  'smith machine bench press': 'Smith Machine Bench Press',
  'landmine press': 'Landmine Press',
  'floor press': 'Floor Press',
  'seated cable rows': 'Seated Cable Rows',
  'seated cable row': 'Seated Cable Rows',
  'lat pulldowns': 'Lat Pulldowns',
  'lat pulldown': 'Lat Pulldowns',
  'face pulls': 'Face Pulls',
  'face pull': 'Face Pulls',
  'deadlift': 'Deadlift',
  'pull-ups': 'Pull-Ups',
  'pull ups': 'Pull-Ups',
  'pull up': 'Pull-Ups',
  'barbell rows': 'Barbell Rows',
  'barbell row': 'Barbell Rows',
  'chin-ups': 'Chin-Ups',
  'chin ups': 'Chin-Ups',
  'rack pulls': 'Rack Pulls',
  'back extensions': 'Back Extensions',
  'back extension': 'Back Extensions',
  'good mornings': 'Good Mornings',
  'lateral raises': 'Lateral Raises',
  'lateral raise': 'Lateral Raises',
  'front raises': 'Front Raises',
  'front raise': 'Front Raises',
  'shrugs': 'Shrugs',
  'overhead press': 'Overhead Press (OHP)',
  'overhead press (ohp)': 'Overhead Press (OHP)',
  'seated dumbbell press': 'Seated Dumbbell Press',
  'arnold press': 'Arnold Press',
  'military press': 'Military Press',
  'standing barbell curl': 'Standing Barbell Curl',
  'barbell curl': 'Standing Barbell Curl',
  'incline dumbbell curl': 'Incline Dumbbell Curl',
  'hammer curl': 'Standing Hammer Curl',
  'standing hammer curl': 'Standing Hammer Curl',
  'ez bar preacher curl': 'EZ Bar Preacher Curl',
  'rope pushdown': 'Rope Pushdown',
  'tricep pushdown': 'Straight Bar Tricep Pushdown',
  'spider curls': 'Spider Curls',
  'spider curl': 'Spider Curls',
  'barbell squat': 'Barbell Squat',
  'squat': 'Barbell Squat',
  'leg press': 'Leg Press',
  'romanian deadlift': 'Romanian Deadlift',
  'leg extensions': 'Leg Extensions',
  'leg extension': 'Leg Extensions',
  'leg curls': 'Lying Leg Curls',
  'lying leg curls': 'Lying Leg Curls',
  'bulgarian split squat': 'Bulgarian Split Squat',
  'lunges': 'Lunges',
  'lunge': 'Lunges',
  'hack squat': 'Hack Squat',
  'calf raises': 'Calf Raises',
  'calf raise': 'Calf Raises',
  'front squat': 'Front Squat',
  'hip thrusts': 'Hip Thrusts',
  'hip thrust': 'Hip Thrusts',
  'goblet squat': 'Goblet Squat',
  'sumo deadlift': 'Sumo Deadlift',
  'cycling': 'Cycling',
  'rowing machine': 'Rowing Machine',
  'jump rope': 'Jump Rope',
  'swimming': 'Swimming',
  'walking': 'Walking',
  'burpees': 'Burpees',
  'burpee': 'Burpees',
  'mountain climbers': 'Mountain Climbers',
  'mountain climber': 'Mountain Climbers',
  'kettlebell swings': 'Kettlebell Swings',
  'kettlebell swing': 'Kettlebell Swings',
  'dips': 'Dips (Chest Focus)',
  'close grip bench press': 'Close Grip Bench Press',
};

function matchDisplayName(datasetName) {
  const lower = datasetName.toLowerCase().trim();
  
  // Direct match
  if (OUR_EXERCISES[lower]) return OUR_EXERCISES[lower];
  
  // Partial match — check if dataset name contains one of our keys
  for (const [key, displayName] of Object.entries(OUR_EXERCISES)) {
    if (lower.includes(key) || key.includes(lower)) {
      return displayName;
    }
  }
  
  return null;
}

async function fetchDataset() {
  console.log('📥 Fetching exercises dataset from GitHub...');
  const response = await fetch(DATASET_URL);
  if (!response.ok) {
    throw new Error(`Failed to fetch dataset: ${response.status} ${response.statusText}`);
  }
  const data = await response.json();
  console.log(`✅ Fetched ${data.length} exercises`);
  return data;
}

async function uploadThumbnail(imageRelPath, exerciseId) {
  const imageUrl = `${GITHUB_RAW_BASE}/${imageRelPath}`;
  
  try {
    // Fetch the image from GitHub
    const response = await fetch(imageUrl);
    if (!response.ok) return null;
    
    const arrayBuffer = await response.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);
    const fileName = `thumbnails/${imageRelPath.split('/').pop()}`;
    
    const { data, error } = await supabase.storage
      .from('exercise-media')
      .upload(fileName, buffer, {
        contentType: 'image/jpeg',
        upsert: true
      });
    
    if (error) {
      console.warn(`⚠️  Upload failed for ${exerciseId}: ${error.message}`);
      return null;
    }
    
    // Get public URL
    const { data: urlData } = supabase.storage
      .from('exercise-media')
      .getPublicUrl(fileName);
    
    return urlData.publicUrl;
  } catch (err) {
    console.warn(`⚠️  Error uploading ${exerciseId}: ${err.message}`);
    return null;
  }
}

async function seedDatabase(exercises) {
  console.log('\n🗄️  Inserting exercises into database...');
  
  // Process in batches of 50
  const BATCH_SIZE = 50;
  let inserted = 0;
  let matched = 0;
  
  for (let i = 0; i < exercises.length; i += BATCH_SIZE) {
    const batch = exercises.slice(i, i + BATCH_SIZE);
    
    const records = batch.map(ex => {
      const appCategory = CATEGORY_MAP[ex.body_part?.toLowerCase()] || CATEGORY_MAP[ex.category?.toLowerCase()] || 'Other';
      const displayName = matchDisplayName(ex.name);
      if (displayName) matched++;
      
      // GIF URL from GitHub raw (Option A — no storage cost)
      const gifUrl = `${GITHUB_RAW_BASE}/${ex.gif_url}`;
      
      return {
        id: ex.id,
        name: ex.name.toLowerCase(),
        display_name: displayName,
        category: ex.category || ex.body_part,
        app_category: appCategory,
        equipment: ex.equipment,
        target: ex.target,
        muscle_group: ex.muscle_group,
        secondary_muscles: ex.secondary_muscles || [],
        instructions_en: ex.instructions?.en || '',
        instruction_steps: ex.instruction_steps?.en || [],
        image_url: null, // Will be set after thumbnail upload
        gif_url: gifUrl,
      };
    });
    
    const { error } = await supabase
      .from('exercise_library')
      .upsert(records, { onConflict: 'id' });
    
    if (error) {
      console.error(`❌ Batch ${Math.floor(i/BATCH_SIZE) + 1} insert error:`, error.message);
    } else {
      inserted += batch.length;
      process.stdout.write(`\r   Inserted: ${inserted}/${exercises.length}`);
    }
  }
  
  console.log(`\n✅ Database seeded: ${inserted} exercises, ${matched} matched to our display names`);
}

async function uploadThumbnails(exercises) {
  console.log('\n📸 Uploading thumbnails to Supabase Storage...');
  console.log('   (This may take a few minutes for 1,324 images...)\n');
  
  let uploaded = 0;
  let failed = 0;
  
  // Process in batches of 10 concurrent uploads
  const CONCURRENCY = 10;
  
  for (let i = 0; i < exercises.length; i += CONCURRENCY) {
    const batch = exercises.slice(i, i + CONCURRENCY);
    
    const results = await Promise.allSettled(
      batch.map(async (ex) => {
        const publicUrl = await uploadThumbnail(ex.image, ex.id);
        
        if (publicUrl) {
          // Update the database record with the storage URL
          await supabase
            .from('exercise_library')
            .update({ image_url: publicUrl })
            .eq('id', ex.id);
          
          return true;
        }
        return false;
      })
    );
    
    results.forEach(r => {
      if (r.status === 'fulfilled' && r.value) uploaded++;
      else failed++;
    });
    
    process.stdout.write(`\r   Uploaded: ${uploaded} | Failed: ${failed} | Total: ${i + batch.length}/${exercises.length}`);
  }
  
  console.log(`\n✅ Thumbnails uploaded: ${uploaded} successful, ${failed} failed`);
}

async function main() {
  console.log('═══════════════════════════════════════════════');
  console.log('  Exercise Library Seed Script');
  console.log('  Dataset: hasaneyldrm/exercises-dataset');
  console.log('═══════════════════════════════════════════════\n');
  
  try {
    // Step 1: Fetch dataset
    const exercises = await fetchDataset();
    
    // Step 2: Insert into database
    await seedDatabase(exercises);
    
    // Step 3: Upload thumbnails
    await uploadThumbnails(exercises);
    
    console.log('\n═══════════════════════════════════════════════');
    console.log('  ✅ ALL DONE! Exercise library is ready.');
    console.log('═══════════════════════════════════════════════\n');
    
  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  }
}

main();
