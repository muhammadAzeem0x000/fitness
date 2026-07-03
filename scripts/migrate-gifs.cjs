const fs = require('fs');
const https = require('https');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Parse environment variables
const env = fs.readFileSync(path.join(__dirname, '../.env.local'), 'utf8').split('\n').reduce((acc, line) => {
  const [key, ...valParts] = line.split('=');
  const val = valParts.join('=');
  if (key && val) acc[key.trim()] = val.trim().replace(/^["']|["']$/g, '');
  return acc;
}, {});

const supabaseUrl = env.VITE_SUPABASE_URL;
// Use SERVICE_ROLE_KEY if available to bypass RLS, otherwise fallback to anon key (which might fail writes if RLS is on)
const supabaseKey = env.VITE_SUPABASE_SERVICE_ROLE_KEY || env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const BUCKET_NAME = 'exercise-gifs';
const BATCH_SIZE = 5; // Download 5 at a time concurrently

// Helper to download a file from HTTPS into a buffer
function downloadFileToBuffer(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        // Follow redirects
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

// Ensure bucket is public
async function ensureBucket() {
  const { data, error } = await supabase.storage.getBucket(BUCKET_NAME);
  if (error && error.message.includes('not found')) {
    console.log(`Bucket ${BUCKET_NAME} not found. Attempting to create it...`);
    const { error: createError } = await supabase.storage.createBucket(BUCKET_NAME, {
      public: true,
      allowedMimeTypes: ['image/gif', 'image/jpeg', 'image/png'],
      fileSizeLimit: 10485760 // 10MB
    });
    if (createError) {
      console.error('Failed to create bucket:', createError.message);
      console.log('Ensure you manually created a PUBLIC bucket named "exercise-gifs". Continuing anyway...');
    }
  } else if (data && !data.public) {
    console.warn(`WARNING: Bucket ${BUCKET_NAME} is not public. The GIFs will not load in the app!`);
    const { error: updateError } = await supabase.storage.updateBucket(BUCKET_NAME, {
      public: true
    });
    if (updateError) {
      console.error('Failed to make bucket public:', updateError.message);
    }
  }
}

async function migrate() {
  console.log('Starting GIF migration...');
  await ensureBucket();
  
  let allRows = [];
  let page = 0;
  const pageSize = 1000;
  
  while (true) {
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
  
  console.log(`Found ${allRows.length} exercises with GitHub GIFs.`);
  
  let successCount = 0;
  let failCount = 0;
  
  for (let i = 0; i < allRows.length; i += BATCH_SIZE) {
    const batch = allRows.slice(i, i + BATCH_SIZE);
    
    await Promise.all(batch.map(async (exercise) => {
      try {
        const githubUrl = exercise.gif_url;
        
        // Use the exercise ID or name to construct a clean filename
        const filename = `${exercise.id || exercise.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}.gif`;
        
        console.log(`[${i+1}/${allRows.length}] Downloading ${exercise.name}...`);
        const buffer = await downloadFileToBuffer(githubUrl);
        
        // console.log(`[${i+1}/${allRows.length}] Uploading ${filename} to Supabase Storage...`);
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from(BUCKET_NAME)
          .upload(filename, buffer, {
            contentType: 'image/gif',
            upsert: true
          });
          
        if (uploadError) {
          throw new Error(`Upload error: ${uploadError.message}`);
        }
        
        // Get the public URL
        const { data: publicUrlData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(filename);
        const newUrl = publicUrlData.publicUrl;
        
        // console.log(`[${i+1}/${allRows.length}] Updating database with new URL: ${newUrl}`);
        const { error: dbError } = await supabase
          .from('exercise_library')
          .update({ gif_url: newUrl })
          .eq('id', exercise.id);
          
        if (dbError) {
          throw new Error(`Database update error: ${dbError.message}`);
        }
        
        successCount++;
        // console.log(`✅ Success: ${exercise.name}`);
        
      } catch (err) {
        failCount++;
        console.error(`❌ Failed: ${exercise.name} - ${err.message}`);
      }
    }));
    
    console.log(`Batch complete. Progress: ${Math.min(i + BATCH_SIZE, allRows.length)} / ${allRows.length}`);
  }
  
  console.log('\n--- Migration Summary ---');
  console.log(`Total Found: ${allRows.length}`);
  console.log(`Successfully Migrated: ${successCount}`);
  console.log(`Failed: ${failCount}`);
}

migrate();
