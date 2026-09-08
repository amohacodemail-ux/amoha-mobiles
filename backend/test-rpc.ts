import supabase from './src/config/supabase';
async function testRpc() {
  const { data, error } = await supabase.rpc('exec_sql', { query: 'SELECT 1' });
  console.log('data:', data, 'error:', error);
}
testRpc();
