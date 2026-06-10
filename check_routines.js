import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hvjchdgthkxqdvxrjero.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2amNoZGd0aGt4cWR2eHJqZXJvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkyNjg1MjQsImV4cCI6MjA4NDg0NDUyNH0.zIngHNW3FgVeSYL8DDfDGNn_-7SVQSYuj6Tuv68p5QY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    const { data, error } = await supabase.from('routines').select('*');
    if (error) console.error(error);
    console.log(JSON.stringify(data, null, 2));
}

check();
