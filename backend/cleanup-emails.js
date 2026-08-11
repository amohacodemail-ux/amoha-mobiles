import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanupEmails() {
  console.log("Starting cleanup of dummy emails...");
  
  // Clean up walkin_ emails
  const { data: walkinData, error: walkinErr } = await supabase
    .from('users')
    .update({ email: null })
    .like('email', 'walkin_%')
    .select('id, email');
    
  if (walkinErr) {
    console.error("Error cleaning walkin_ emails:", walkinErr);
  } else {
    console.log(`Cleaned up ${walkinData?.length || 0} walkin_ emails`);
  }
  
  // Clean up noemail.local emails
  const { data: noemailData, error: noemailErr } = await supabase
    .from('users')
    .update({ email: null })
    .like('email', '%@noemail.local')
    .select('id, email');
    
  if (noemailErr) {
    console.error("Error cleaning noemail.local emails:", noemailErr);
  } else {
    console.log(`Cleaned up ${noemailData?.length || 0} noemail.local emails`);
  }
  
  console.log("Cleanup complete!");
}

cleanupEmails().catch(console.error);
