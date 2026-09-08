import supabase from './src/config/supabase';

async function run() {
  const email = 'vd@gmail.com';
  console.log('--- Fetch User ---');
  const user = await supabase.from('users').select('id, email').eq('email', email).maybeSingle();
  console.log(user);
  
  console.log('--- Fetch Supplier ---');
  const supplier = await supabase.from('suppliers').select('id, email').eq('email', email).maybeSingle();
  console.log(supplier);

  console.log('--- Simulating Insert ---');
  const { data, error } = await supabase.from('supplier_entries').insert({
    supplier_id: supplier.data!.id,
    item_name: 'test',
    quantity: 1,
    status: 'pending',
    created_by: user.data!.id
  }).select('*');
  console.log('Result:', data);
  console.log('Error:', error);
}

run();
