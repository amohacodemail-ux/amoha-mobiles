import supabase from './src/config/supabase';

async function run() {
  const email = 'vd@gmail.com';
  console.log('--- Users Table ---');
  const user = await supabase.from('users').select('id, email, role').eq('email', email);
  console.log(user);
  
  console.log('--- Suppliers Table ---');
  const supplier = await supabase.from('suppliers').select('id, email').eq('email', email);
  console.log(supplier);
}

run();
