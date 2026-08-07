import jwt from 'jsonwebtoken';
import axios from 'axios';
import * as dotenv from 'dotenv';
import path from 'path';
import supabase from './src/config/supabase';

dotenv.config({ path: path.resolve(__dirname, '.env') });

async function test() {
  try {
    const { data: users } = await supabase.from('users').select('id, email, role').eq('role', 'marketing').limit(1);
    if (!users || users.length === 0) throw new Error('No marketing user found');
    const u = users[0];

    const user = {
      userId: u.id,
      role: u.role,
      email: u.email
    };
    const token = jwt.sign(user, process.env.JWT_ACCESS_SECRET || 'fallback', { expiresIn: '1d' });
    console.log('Token generated for:', u.email);

    const pRes = await axios.get('http://localhost:10000/api/admin/products', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('Products status:', pRes.status);
    console.log('Products fetched:', pRes.data.data.products?.length);
  } catch (err: any) {
    console.error('Error fetching products:', err.response?.status, err.response?.data);
  }
}

test();
