require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function investigateOppo() {
    console.log("=== Investigating Oppo Restock ===");

    // Find product
    const { data: products } = await supabase.from('products').select('*').ilike('name', '%Oppo A52 Pro%');
    
    if (!products || products.length === 0) {
        console.log("Product not found.");
        return;
    }
    
    const product = products[0];
    console.log(`Product ID: ${product.id}, Name: ${product.name}`);
    
    // Find inventory
    const { data: inventory } = await supabase.from('inventory').select('*').eq('product_id', product.id);
    if (inventory && inventory.length > 0) {
         const inv = inventory[0];
         // Find latest audit log
         const { data: audit } = await supabase.from('inventory_audit_log').select('*').eq('inventory_id', inv.id).order('created_at', { ascending: false }).limit(1);
         console.log("Latest Audit Log:", JSON.stringify(audit, null, 2));
    }

    // Find subscriptions
    const { data: subs } = await supabase.from('stock_notification_subscriptions').select('*, users(phone)').eq('product_id', product.id);
    if (subs) {
        subs.forEach(s => {
            if (s.users && s.users.phone) {
                s.users.phone = '******' + s.users.phone.slice(-4);
            }
            if (s.user_id) {
                s.user_id = s.user_id.substring(0, 8) + '...';
            }
        });
    }
    console.log("Subscriptions:", JSON.stringify(subs, null, 2));

    // Find logs
    const { data: logs } = await supabase.from('stock_notification_logs').select('*').eq('product_id', product.id).order('created_at', { ascending: false }).limit(2);
    console.log("Logs:", JSON.stringify(logs, null, 2));

    // Env check
    console.log("Env WHATSAPP_ACCESS_TOKEN Present:", !!process.env.WHATSAPP_ACCESS_TOKEN);
    console.log("Env WHATSAPP_PHONE_NUMBER_ID:", process.env.WHATSAPP_PHONE_NUMBER_ID);
    console.log("Env WHATSAPP_API_VERSION:", process.env.WHATSAPP_API_VERSION);
    console.log("Env WHATSAPP_STOCK_ALERT_TEST_PHONE Present:", !!process.env.WHATSAPP_STOCK_ALERT_TEST_PHONE);
}

investigateOppo();
