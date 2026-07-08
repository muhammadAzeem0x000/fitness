const fs = require('fs');
const https = require('https');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

// Parse environment variables
const env = fs.readFileSync(path.join(__dirname, '../.env.local'), 'utf8').split('\n').reduce((acc, line) => {
  const [key, ...valParts] = line.split('=');
  const val = valParts.join('=');
  if (key && val) acc[key.trim()] = val.trim().replace(/^["']|["']$/g, '');
  return acc;
}, {});

// --- Supabase Config ---
const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseKey = env.VITE_SUPABASE_SERVICE_ROLE_KEY || env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// --- Cloudflare R2 Config ---
// You will need to add these to your .env.local file
const R2_ACCOUNT_ID = env.R2_ACCOUNT_ID; // e.g. "abc123def456..."
const R2_ACCESS_KEY = env.R2_ACCESS_KEY;
const R2_SECRET_KEY = env.R2_SECRET_KEY;
const R2_BUCKET_NAME = env.R2_BUCKET_NAME || 'exercise-gifs';
const R2_PUBLIC_URL = env.R2_PUBLIC_URL; // e.g. "https://pub-abcdef.r2.dev"

if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY || !R2_SECRET_KEY || !R2_PUBLIC_URL) {
    console.error("Missing R2 credentials in .env.local.");
    console.error("Required: R2_ACCOUNT_ID, R2_ACCESS_KEY, R2_SECRET_KEY, R2_PUBLIC_URL");
    process.exit(1);
}

const s3Client = new S3Client({
    region: 'auto',
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: R2_ACCESS_KEY,
        secretAccessKey: R2_SECRET_KEY,
    }
});

const BATCH_SIZE = 5;

// Helper to download a file from HTTPS into a buffer
function downloadFileToBuffer(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return downloadFileToBuffer(res.headers.location).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        reject(new Error(`Failed to get '${url}' (${res.statusCode})`));
        return;
      }
      const data = [];
      res.on('data', (chunk) => data.push(chunk));
      res.on('end', () => resolve(Buffer.concat(data)));
    }).on('error', reject);
  });
}

async function migrateToR2() {
  console.log('Starting GIF migration to Cloudflare R2...');
  
  let allRows = [];
  let page = 0;
  const pageSize = 1000;
  
  while (true) {
    // We only fetch gifs that still point to github
    const { data, error } = await supabase
      .from('exercise_library')
      .select('id, name, gif_url')
      .like('gif_url', '%githubusercontent%')
      .range(page * pageSize, (page + 1) * pageSize - 1);
      
    if (error) {
      console.error('Error fetching rows:', error);
      process.exit(1);
    }
    
    if (data.length === 0) break;
    allRows = allRows.concat(data);
    if (data.length < pageSize) break;
    page++;
  }
  
  console.log(`Found ${allRows.length} exercises with GitHub GIFs to migrate.`);
  
  let successCount = 0;
  let failCount = 0;
  
  for (let i = 0; i < allRows.length; i += BATCH_SIZE) {
    const batch = allRows.slice(i, i + BATCH_SIZE);
    
    await Promise.all(batch.map(async (exercise) => {
      try {
        const githubUrl = exercise.gif_url;
        const filename = `${exercise.id || exercise.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}.gif`;
        
        console.log(`[${i+1}/${allRows.length}] Updating database for ${exercise.name}...`);
        
        // Construct public URL
        // Ensure R2_PUBLIC_URL has no trailing slash
        const baseUrl = R2_PUBLIC_URL.endsWith('/') ? R2_PUBLIC_URL.slice(0, -1) : R2_PUBLIC_URL;
        const newUrl = `${baseUrl}/${filename}`;
        
        // Update Supabase Database
        const { error: dbError } = await supabase
          .from('exercise_library')
          .update({ gif_url: newUrl })
          .eq('id', exercise.id);
          
        if (dbError) {
          throw new Error(`Database update error: ${dbError.message}`);
        }
        
        successCount++;
      } catch (err) {
        failCount++;
        console.error(`❌ Failed: ${exercise.name} - ${err.message}`);
      }
    }));
    
    console.log(`Batch complete. Progress: ${Math.min(i + BATCH_SIZE, allRows.length)} / ${allRows.length}`);
  }
  
  console.log('\n--- R2 Migration Summary ---');
  console.log(`Total Found: ${allRows.length}`);
  console.log(`Successfully Migrated: ${successCount}`);
  console.log(`Failed: ${failCount}`);
}

migrateToR2();
