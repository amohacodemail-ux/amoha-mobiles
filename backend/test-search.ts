import supabase from './src/config/supabase';

async function test() {
  const { data, error } = await supabase.from('orders').select('*').limit(1);
  console.log(data?.[0] ? Object.keys(data[0]) : 'no data');
}

test();
