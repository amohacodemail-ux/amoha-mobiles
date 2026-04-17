import { createClient, SupabaseClient } from '@supabase/supabase-js';
import env from './env';
import logger from '../utils/logger.util';

const supabase: SupabaseClient = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    db: {
      schema: 'public',
    },
  },
);

export const testConnection = async (): Promise<void> => {
  try {
    // Use a simple RPC call or direct table query to verify connectivity
    // First try querying users table; if tables don't exist yet, just test the connection is alive
    const { error } = await supabase.from('users').select('id').limit(1);
    if (error) {
      // If table doesn't exist, that's OK — DB is reachable but migration hasn't run
      if (error.message.includes('schema cache') || error.message.includes('does not exist') || error.code === 'PGRST204' || error.code === '42P01') {
        logger.warn('Supabase connected but tables not found — run the migration SQL first');
        return;
      }
      // Empty results are fine
      if (error.code === 'PGRST116' || error.message.includes('0 rows')) {
        return;
      }
      throw error;
    }
    logger.info('Supabase PostgreSQL connected successfully');
  } catch (error) {
    logger.error('Supabase connection failed:', error);
    throw error;
  }
};

export default supabase;
