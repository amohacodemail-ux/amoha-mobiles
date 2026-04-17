import { testConnection } from './supabase';
import logger from '../utils/logger.util';

const connectDB = async (): Promise<void> => {
  try {
    await testConnection();
    logger.info('Supabase PostgreSQL connected successfully');
  } catch (error) {
    logger.error('Supabase connection failed:', error);
    throw error;
  }
};

export default connectDB;
