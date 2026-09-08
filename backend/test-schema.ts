import supabase from './src/config/supabase';

async function test() {
  const { data, error } = await supabase.rpc('get_table_schema', { table_name: 'purchase_requests' });
  console.log('Result:', data || error);
}
test();
