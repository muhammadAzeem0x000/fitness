const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8');
let url = '', key = '';
env.split('\n').forEach(line => {
  if (line.startsWith('VITE_SUPABASE_URL=')) url = line.split('=')[1].trim();
  if (line.startsWith('VITE_SUPABASE_ANON_KEY=')) key = line.split('=')[1].trim();
});

const supabase = createClient(url, key);

async function run() {
  const { data } = await supabase.from('exercise_library').select('name');
  const dbNames = data.map(d => d.name.toLowerCase());
  
  const searchFor = ['rear', 'delt', 'shrug', 'curl'];
  for (let s of searchFor) {
    console.log(`\nSearching for: ${s}`);
    for (let name of dbNames) {
      if (name.includes(s)) console.log(" -", name);
    }
  }
}
run();
