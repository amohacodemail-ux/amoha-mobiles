require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function investigateStock() {
    console.log("=== Investigating Stock Changes ===");

    // 1. Find product GOOGLE 7A (5G) (Used )
    const { data: products } = await supabase.from('products').select('*').ilike('name', '%GOOGLE 7A%');
    
    if (products && products.length > 0) {
        const product = products[0];
        console.log(`Product ID: ${product.id}`);
        
        // Find inventory
        const { data: inventory } = await supabase.from('inventory').select('*').eq('product_id', product.id);
        if (inventory && inventory.length > 0) {
             const inv = inventory[0];
             // check movements
             const { data: movements } = await supabase.from('inventory_movements').select('*').eq('inventory_id', inv.id).order('created_at', { ascending: false }).limit(5);
             console.log("Movements for GOOGLE 7A:", JSON.stringify(movements, null, 2));

             const { data: audit } = await supabase.from('inventory_audit_log').select('*').eq('inventory_id', inv.id).order('created_at', { ascending: false }).limit(5);
             console.log("Audit logs for GOOGLE 7A:", JSON.stringify(audit, null, 2));
        }
    }
}

investigateStock();
