import axios from 'axios';
import * as dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '.env') });

async function test() {
  try {
    const res = await axios.post('http://localhost:10000/api/auth/login', {
      email: 'anu@gmail.com',
      password: 'password123'
    });
    const token = res.data.data.token;
    console.log('Login successful');

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
