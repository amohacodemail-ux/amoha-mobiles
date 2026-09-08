import supabase from './src/config/supabase';

async function test() {
  const { data, error } = await supabase
    .from('supplier_catalogues')
    .select('*, products(name, sku)')
    .limit(1);

  console.log(error || data);
}

test();
