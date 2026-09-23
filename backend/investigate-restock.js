require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function investigate() {
    console.log("=== Investigating Restock Notifications ===");

    // 1. Find product GOOGLE 7A (5G) (Used )
    const { data: products } = await supabase.from('products').select('*').ilike('name', '%GOOGLE 7A%');
    console.log("Products found:", products ? products.length : 0);
    
    if (products && products.length > 0) {
        const product = products[0];
        console.log(`Product ID: ${product.id}, Name: ${product.name}`);
        
        // 3. Find subscriptions
        const { data: subs } = await supabase.from('stock_notification_subscriptions').select('*, users(phone, name)').eq('product_id', product.id);
        console.log("Subscriptions:", JSON.stringify(subs, null, 2));

        // 5 & 11. Find logs
        const { data: logs } = await supabase.from('stock_notification_logs').select('*').eq('product_id', product.id).order('created_at', { ascending: false });
        console.log("Logs:", JSON.stringify(logs, null, 2));
    }
    
    // Check Redmi Note 9
    const { data: redmiProducts } = await supabase.from('products').select('*').ilike('name', '%Redmi Note 9%');
    if (redmiProducts && redmiProducts.length > 0) {
        const p = redmiProducts[0];
        console.log(`\nRedmi Note 9 Product ID: ${p.id}, Name: ${p.name}`);
        const { data: logs } = await supabase.from('stock_notification_logs').select('*').eq('product_id', p.id).order('created_at', { ascending: false });
        console.log("Redmi Logs:", JSON.stringify(logs, null, 2));
    }
}

investigate();
