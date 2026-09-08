import supabase from './src/config/supabase';

async function fetchItems() {
  const { data: po } = await supabase.from('purchase_orders').select('*').eq('po_number', 'PO-2026-0012').single();
  if (po) {
    const { data: items } = await supabase.from('purchase_order_items').select('*').eq('purchase_order_id', po.id);
    console.log("Items:", items);
  } else {
    console.log("PO not found");
  }
}
fetchItems();
