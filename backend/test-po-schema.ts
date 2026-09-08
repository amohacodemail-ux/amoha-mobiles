import supabase from './src/config/supabase';

async function test() {
  const { data } = await supabase.from('purchase_order_items').select('*').limit(1);
  if (data && data.length > 0) {
    console.log('Columns:', Object.keys(data[0]));
  }
}
test();
