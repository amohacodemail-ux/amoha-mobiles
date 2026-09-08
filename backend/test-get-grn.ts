import supabase from './src/config/supabase';

async function test() {
  const { data, error } = await supabase
      .from('goods_receipt_notes')
      .select(`
        *,
        supplier:supplier_id (id, name, code),
        purchaseOrder:po_id (id, po_number),
        items:goods_receipt_note_items (*)
      `)
      .order('created_at', { ascending: false });

  if (error) {
    console.error('Supabase Error:', error);
  } else {
    console.log('Success:', data?.length, 'records');
  }
}

test();
