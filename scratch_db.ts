import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://kesngiwiilldcersofre.supabase.co';
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_2TbUB2KSNaiR6qTQ0r5OtA_5siUbEIk';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkGuides() {
  console.log("Fetching all guides from profiles...");
  const { data: guides, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'guide');
    
  if (error) {
    console.error("Error fetching guides:", error);
  } else {
    console.log(`Found ${guides?.length || 0} guides in profiles:`);
    guides?.forEach(g => {
      console.log(`- ID: ${g.id}`);
      console.log(`  Name: ${g.name}`);
      console.log(`  Dept: "${g.dept}"`);
      console.log(`  Role: "${g.role}"`);
    });
  }

  console.log("\nFetching approved_staff...");
  const { data: approved, error: err2 } = await supabase
    .from('approved_staff')
    .select('*');
    
  if (err2) {
    console.error("Error fetching approved staff:", err2);
  } else {
    console.log(`Found ${approved?.length || 0} approved staff:`);
    approved?.forEach(a => {
      console.log(`- Name: ${a.name}, Dept: "${a.dept}", ID: ${a.staff_id}`);
    });
  }
}

checkGuides();


