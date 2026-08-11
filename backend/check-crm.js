import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCRM() {
  console.log("Starting CRM Data Consistency Check...");
  
  // 1. Fetch all orders that are walk-in
  const { data: walkInOrders, error: ordersError } = await supabase
    .from('orders')
    .select('*')
    .eq('is_walk_in', true);

  if (ordersError) {
    console.error("Error fetching orders:", ordersError);
    return;
  }

  // 2. Fetch all customers created through walk-in
  // We can find customers who are linked to these walk-in orders
  const customerIdsFromOrders = [...new Set(walkInOrders.map(o => o.user_id))];
  
  const { data: walkInCustomers, error: customersError } = await supabase
    .from('users')
    .select('*')
    .in('id', customerIdsFromOrders);
    
  // What if there are walk-in customers who don't have orders?
  // Or customers with default emails like 'walkin_xxx@example.com'?
  const { data: allWalkinEmails, error: emailsError } = await supabase
    .from('users')
    .select('*')
    .like('email', 'walkin_%');
    
  const { data: allWalkinNames, error: namesError } = await supabase
    .from('users')
    .select('*')
    .ilike('name', '%walk%in%');

  // Combine them to find all potential walk-in customers in the CRM
  const allPotentialWalkInIds = new Set([
    ...customerIdsFromOrders,
    ...(allWalkinEmails || []).map(u => u.id),
    ...(allWalkinNames || []).map(u => u.id)
  ]);
  
  const { data: allWalkInUsers } = await supabase
    .from('users')
    .select('*')
    .in('id', Array.from(allPotentialWalkInIds));

  console.log("-----------------------------------------");
  console.log(`Total Walk-in Orders: ${walkInOrders.length}`);
  console.log(`Total Walk-in Customers identified: ${allWalkInUsers.length}`);

  let missingCustomerRecords = 0;
  let ordersWithoutValidCustomer = [];
  
  // Check orders for missing customers
  for (const order of walkInOrders) {
    const customer = allWalkInUsers.find(u => u.id === order.user_id);
    if (!customer) {
      missingCustomerRecords++;
      ordersWithoutValidCustomer.push(order.order_number);
    }
  }

  let customersWithoutOrders = [];
  // Check customers without orders
  for (const customer of allWalkInUsers) {
    const hasOrder = walkInOrders.some(o => o.user_id === customer.id);
    if (!hasOrder) {
      customersWithoutOrders.push(customer);
    }
  }

  let customersWithDefaultEmails = [];
  let duplicateCustomers = [];
  let missingInfoCustomers = [];

  const phoneMap = new Map();

  for (const customer of allWalkInUsers) {
    // Missing info
    if (!customer.name || !customer.phone) {
      missingInfoCustomers.push(customer);
    }
    
    // Default email generated
    if (customer.email && customer.email.startsWith('walkin_') && customer.email.includes('@')) {
      customersWithDefaultEmails.push(customer);
    }
    
    // Check duplicates
    if (customer.phone) {
      if (phoneMap.has(customer.phone)) {
        phoneMap.get(customer.phone).push(customer);
      } else {
        phoneMap.set(customer.phone, [customer]);
      }
    }
  }

  for (const [phone, group] of phoneMap.entries()) {
    if (group.length > 1) {
      duplicateCustomers.push({ phone, count: group.length, users: group });
    }
  }

  console.log("\n--- ISSUES FOUND ---");
  console.log(`1. Orders missing customer mapping: ${missingCustomerRecords} (Order IDs: ${ordersWithoutValidCustomer.join(', ')})`);
  console.log(`2. CRM customers without corresponding walk-in order: ${customersWithoutOrders.length}`);
  console.log(`3. Customers with missing Name or Mobile: ${missingInfoCustomers.length}`);
  console.log(`4. Customers with incorrectly generated default emails: ${customersWithDefaultEmails.length}`);
  console.log(`5. Duplicate customers (same mobile number): ${duplicateCustomers.length} phone numbers have duplicates`);
  
  console.log("\n--- DETAILS ---");
  if (duplicateCustomers.length > 0) {
    console.log("Duplicates:");
    duplicateCustomers.forEach(d => {
      console.log(`  Phone: ${d.phone} - ${d.count} records`);
      d.users.forEach(u => console.log(`    -> ID: ${u.id}, Name: ${u.name}, Email: ${u.email}`));
    });
  }
  
  if (customersWithDefaultEmails.length > 0) {
    console.log("Default Emails generated:");
    customersWithDefaultEmails.forEach(c => console.log(`  -> ID: ${c.id}, Name: ${c.name}, Email: ${c.email}`));
  }
  
  if (missingInfoCustomers.length > 0) {
    console.log("Missing Info:");
    missingInfoCustomers.forEach(c => console.log(`  -> ID: ${c.id}, Name: ${c.name}, Phone: ${c.phone}`));
  }
  
  if (customersWithoutOrders.length > 0) {
    console.log("Customers without orders (possible test/invalid records):");
    customersWithoutOrders.forEach(c => console.log(`  -> ID: ${c.id}, Name: ${c.name}, Phone: ${c.phone}`));
  }

  console.log("\n--- END OF REPORT ---");
}

checkCRM().catch(console.error);
