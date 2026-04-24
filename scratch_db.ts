import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://kesngiwiilldcersofre.supabase.co';
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_2TbUB2KSNaiR6qTQ0r5OtA_5siUbEIk';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkDb() {
  console.log("Fetching student profiles with team_id IS NULL...");
  const { data: studentProfiles, error: err1 } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'student')
    .is('team_id', null);
    
  if (err1) {
    console.error("Error fetching profiles:", err1);
  } else {
    console.log(`Found ${studentProfiles?.length || 0} unassigned student profiles:`);
    studentProfiles?.forEach(s => {
      console.log(`- ID: ${s.id}, Name: ${s.name}, Team Number: ${s.team_number}`);
    });
  }

  console.log("\nFetching all projects...");
  const { data: projects, error: err2 } = await supabase.from('projects').select('title');
  if (err2) {
    console.error("Error fetching projects:", err2);
  } else {
    console.log(`Found ${projects?.length || 0} projects:`);
    projects?.forEach(p => {
      console.log(`- Title: ${p.title}`);
    });
  }
}

checkDb();
