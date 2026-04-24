const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkProjects() {
    const { data, error } = await supabase.from('projects').select('title, dept_category');
    console.log(JSON.stringify(data, null, 2));
}

checkProjects();
