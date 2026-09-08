import supabase from './src/config/supabase';

async function fixPOItems() {
  const { data, error } = await supabase.rpc('execute_sql', { query: 'UPDATE purchase_order_items SET pending_qty = quantity WHERE pending_qty = 0 AND received_qty = 0' });
  if (error) {
     console.log("RPC fail, falling back to manual fetch");
     const { data: items } = await supabase.from('purchase_order_items').select('*').eq('pending_qty', 0).eq('received_qty', 0);
     if (items) {
       for (const item of items) {
          await supabase.from('purchase_order_items').update({ pending_qty: item.quantity }).eq('id', item.id);
       }
       console.log(`Updated ${items.length} items`);
     }
  } else {
    console.log("SQL executed");
  }
}
fixPOItems();
