import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function testRpc() {
  const { data, error } = await supabase.rpc('exec_sql', { query: 'SELECT 1;' });
  console.log("Result:", data, error);
}
testRpc();
