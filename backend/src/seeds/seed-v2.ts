import dotenv from 'dotenv';
dotenv.config();

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const seed = async () => {
  console.log('Seeding new admin modules (Suppliers, Customer Mgmt, Inventory)...\n');

  // ====== Fetch existing users & products for references ======
  const { data: users } = await supabase.from('users').select('id, name, role').limit(100);
  const { data: products } = await supabase.from('products').select('id, name, price, stock').limit(100);

  if (!users?.length || !products?.length) {
    console.error('No users or products found. Run the main seed first.');
    process.exit(1);
  }

  const adminUser = users.find(u => u.role === 'admin') || users[0];
  const customerUsers = users.filter(u => u.role !== 'admin');

  // ====== SUPPLIERS ======
  console.log('Creating suppliers...');
  const supplierData = [
    { name: 'TechWorld Distributors', email: 'sales@techworld.com', phone: '9876543210', company: 'TechWorld Pvt Ltd', gst_number: '27AABCT1234A1Z5', address: '42 Tech Park, Andheri East, Mumbai', city: 'Mumbai', state: 'Maharashtra', pincode: '400069', payment_terms: 'net_30', lead_time_days: 7, rating: 4.5, status: 'active' },
    { name: 'MobileHub India', email: 'orders@mobilehub.in', phone: '9876543211', company: 'MobileHub India Pvt Ltd', gst_number: '29AABCM5678B1Z3', address: '15 Electronic City Phase 1', city: 'Bangalore', state: 'Karnataka', pincode: '560100', payment_terms: 'net_15', lead_time_days: 5, rating: 4.8, status: 'active' },
    { name: 'Gadget Galaxy', email: 'supply@gadgetgalaxy.com', phone: '9876543212', company: 'Galaxy Electronics', gst_number: '07AABCG9012C1Z1', address: '88 Nehru Place', city: 'New Delhi', state: 'Delhi', pincode: '110019', payment_terms: 'net_30', lead_time_days: 10, rating: 3.9, status: 'active' },
    { name: 'SmartParts Co', email: 'bulk@smartparts.co', phone: '9876543213', company: 'SmartParts Co Ltd', gst_number: '33AABCS3456D1Z7', address: '22 Anna Salai', city: 'Chennai', state: 'Tamil Nadu', pincode: '600002', payment_terms: 'net_45', lead_time_days: 14, rating: 4.2, status: 'active' },
    { name: 'AccessoryKing', email: 'info@accessoryking.in', phone: '9876543214', company: 'AccessoryKing Enterprises', gst_number: '24AABCA7890E1Z9', address: '10 CG Road, Navrangpura', city: 'Ahmedabad', state: 'Gujarat', pincode: '380009', payment_terms: 'net_15', lead_time_days: 3, rating: 4.0, status: 'active' },
    { name: 'ProMobile Supplies', email: 'contact@promobile.com', phone: '9876543215', company: 'ProMobile Supplies LLP', gst_number: '36AABCP2345F1Z2', address: '55 Banjara Hills', city: 'Hyderabad', state: 'Telangana', pincode: '500034', payment_terms: 'net_30', lead_time_days: 8, rating: 4.6, status: 'active' },
    { name: 'CellSource India', email: 'orders@cellsource.in', phone: '9876543216', company: 'CellSource India Pvt Ltd', gst_number: '19AABCC6789G1Z4', address: '77 Park Street', city: 'Kolkata', state: 'West Bengal', pincode: '700016', payment_terms: 'net_30', lead_time_days: 12, rating: 3.7, status: 'active' },
    { name: 'DigiWholesale', email: 'sales@digiwhole.com', phone: '9876543217', company: 'DigiWholesale Corp', gst_number: '27AABCD1122H1Z6', address: '33 FC Road', city: 'Pune', state: 'Maharashtra', pincode: '411005', payment_terms: 'net_15', lead_time_days: 4, rating: 4.3, status: 'active' },
    { name: 'PhonePartsPlus', email: 'bulk@phonepp.com', phone: '9876543218', company: 'PhonePartsPlus', gst_number: '09AABCP3344I1Z8', address: '12 Hazratganj', city: 'Lucknow', state: 'Uttar Pradesh', pincode: '226001', payment_terms: 'net_45', lead_time_days: 15, rating: 3.5, status: 'inactive' },
    { name: 'ElectroBazaar', email: 'orders@electrobazaar.in', phone: '9876543219', company: 'ElectroBazaar Trading', gst_number: '23AABCE5566J1Z0', address: '5 MG Road', city: 'Indore', state: 'Madhya Pradesh', pincode: '452001', payment_terms: 'net_30', lead_time_days: 9, rating: 4.1, status: 'active' },
  ];

  const { data: suppliers, error: supplierErr } = await supabase.from('suppliers').insert(supplierData).select('id, name');
  if (supplierErr) { console.error('Supplier seed error:', supplierErr.message); process.exit(1); }
  console.log(`  Created ${suppliers.length} suppliers`);

  // Assign products to suppliers
  console.log('Assigning products to suppliers...');
  const supplierProducts = [];
  for (let i = 0; i < Math.min(products.length, 50); i++) {
    const sup = suppliers[i % suppliers.length];
    supplierProducts.push({
      supplier_id: sup.id,
      product_id: products[i].id,
      supply_price: Math.round(products[i].price * 0.7),
      min_order_quantity: [10, 20, 25, 50][Math.floor(Math.random() * 4)],
      lead_time_days: [3, 5, 7, 10, 14][Math.floor(Math.random() * 5)],
      is_preferred: i % 3 === 0,
    });
  }
  const { error: spErr } = await supabase.from('supplier_products').insert(supplierProducts);
  if (spErr) console.warn('  Supplier-product assignment warning:', spErr.message);
  else console.log(`  Assigned ${supplierProducts.length} supplier-product mappings`);

  // Create purchase orders
  console.log('Creating purchase orders...');
  const poStatuses: string[] = ['draft', 'sent', 'confirmed', 'shipped', 'received', 'cancelled'];
  const purchaseOrders = [];
  for (let i = 0; i < 20; i++) {
    const sup = suppliers[i % suppliers.length];
    const status = poStatuses[i % poStatuses.length];
    const totalAmount = Math.round(10000 + Math.random() * 90000);
    purchaseOrders.push({
      po_number: `PO-${String(i + 1).padStart(4, '0')}`,
      supplier_id: sup.id,
      status,
      total_amount: totalAmount,
      expected_delivery: new Date(Date.now() + (7 + i) * 24 * 60 * 60 * 1000).toISOString(),
      notes: `Purchase order #${i + 1} for ${sup.name}`,
      created_by: adminUser.id,
    });
  }
  const { data: pos, error: poErr } = await supabase.from('purchase_orders').insert(purchaseOrders).select('id, supplier_id');
  if (poErr) console.warn('  PO creation warning:', poErr.message);
  else console.log(`  Created ${pos?.length} purchase orders`);

  // PO items
  if (pos?.length) {
    const poItems = [];
    for (const po of pos) {
      const itemCount = 1 + Math.floor(Math.random() * 3);
      for (let j = 0; j < itemCount; j++) {
        const prod = products[Math.floor(Math.random() * products.length)];
        poItems.push({
          purchase_order_id: po.id,
          product_id: prod.id,
          quantity: 10 + Math.floor(Math.random() * 40),
          unit_price: Math.round(prod.price * 0.7),
        });
      }
    }
    const { error: poiErr } = await supabase.from('purchase_order_items').insert(poItems);
    if (poiErr) console.warn('  PO items warning:', poiErr.message);
    else console.log(`  Created ${poItems.length} PO line items`);
  }

  // ====== CUSTOMER MANAGEMENT ======
  console.log('\nCreating customer management data...');

  // Customer segments
  const segmentData = [
    { name: 'VIP', description: 'High-value repeat customers with 50k+ spending or 10+ orders', rules: { min_spent: 50000, min_orders: 10 }, color: '#7c3aed' },
    { name: 'Frequent Buyer', description: 'Customers with 5+ orders', rules: { min_orders: 5 }, color: '#2563eb' },
    { name: 'Regular', description: 'Standard customers', rules: {}, color: '#6b7280' },
    { name: 'Inactive', description: 'Customers with no activity in 90+ days', rules: { inactive_days: 90 }, color: '#d97706' },
    { name: 'New Customer', description: 'Recently registered, no orders yet', rules: { max_orders: 0 }, color: '#059669' },
  ];
  const { data: segments, error: segErr } = await supabase.from('customer_segments').insert(segmentData).select('id, name');
  if (segErr) console.warn('  Segments warning:', segErr.message);
  else console.log(`  Created ${segments?.length} customer segments`);

  // Customer tags
  if (customerUsers.length) {
    const tagValues = ['high-value', 'tech-enthusiast', 'gift-buyer', 'price-sensitive', 'brand-loyal', 'early-adopter', 'bulk-buyer', 'needs-follow-up', 'referred-customer', 'complaint-history'];
    const tags = [];
    for (let i = 0; i < Math.min(customerUsers.length, 30); i++) {
      const user = customerUsers[i % customerUsers.length];
      tags.push({
        user_id: user.id,
        tag: tagValues[i % tagValues.length],
        created_by: adminUser.id,
      });
    }
    const { error: tagErr } = await supabase.from('customer_tags').insert(tags);
    if (tagErr) console.warn('  Tags warning:', tagErr.message);
    else console.log(`  Created ${tags.length} customer tags`);

    // Customer notes
    const noteTypes = ['note', 'call', 'email', 'complaint', 'follow_up', 'meeting'];
    const noteTexts = [
      'Customer called regarding order delay, assured 2-day delivery.',
      'Interested in iPhone 15 Pro Max bundle deal.',
      'Complaint about screen protector quality. Offered replacement.',
      'Follow up regarding pending warranty claim.',
      'VIP customer - always prioritize support.',
      'Referred 3 new customers last month. Consider loyalty bonus.',
      'Expressed interest in corporate bulk pricing.',
      'Customer prefers COD for all orders.',
    ];
    const notes = [];
    for (let i = 0; i < Math.min(customerUsers.length * 2, 40); i++) {
      const user = customerUsers[i % customerUsers.length];
      notes.push({
        user_id: user.id,
        note: noteTexts[i % noteTexts.length],
        type: noteTypes[i % noteTypes.length],
        created_by: adminUser.id,
        is_pinned: i % 5 === 0,
      });
    }
    const { error: noteErr } = await supabase.from('customer_notes').insert(notes);
    if (noteErr) console.warn('  Notes warning:', noteErr.message);
    else console.log(`  Created ${notes.length} customer notes`);

    // Fraud flags
    const fraudTypes = ['excessive_returns', 'suspicious_activity', 'payment_fraud', 'account_abuse'];
    const fraudDescriptions = [
      'Return rate exceeds 50% threshold (7 out of 10 orders returned)',
      '5+ cancellations within 30 days detected',
      'Multiple failed payment attempts with different cards',
      'Suspicious address pattern - multiple accounts, same delivery point',
    ];
    const flagCount = Math.min(5, customerUsers.length);
    const flags = [];
    for (let i = 0; i < flagCount; i++) {
      flags.push({
        user_id: customerUsers[i].id,
        flag_type: fraudTypes[i % fraudTypes.length],
        severity: (['low', 'medium', 'high', 'critical'] as const)[i % 4],
        description: fraudDescriptions[i % fraudDescriptions.length],
        is_resolved: i >= 3,
        resolved_by: i >= 3 ? adminUser.id : null,
        resolved_note: i >= 3 ? 'Verified as legitimate activity after investigation.' : null,
      });
    }
    const { error: fraudErr } = await supabase.from('fraud_flags').insert(flags);
    if (fraudErr) console.warn('  Fraud flags warning:', fraudErr.message);
    else console.log(`  Created ${flags.length} fraud flags`);
  }

  // ====== INVENTORY MANAGEMENT ======
  console.log('\nCreating inventory data...');

  // Warehouses
  const warehouseData = [
    { name: 'Mumbai Central Warehouse', location: 'Mumbai', address: '42 Goregaon Industrial Estate, Mumbai, MH 400063', is_active: true },
    { name: 'Bangalore Hub', location: 'Bangalore', address: '15 Whitefield Tech Park, Bangalore, KA 560066', is_active: true },
    { name: 'Delhi Distribution Center', location: 'New Delhi', address: '88 Okhla Industrial Area Phase 2, New Delhi 110020', is_active: true },
    { name: 'Chennai Storage Facility', location: 'Chennai', address: '22 Ambattur Industrial Estate, Chennai, TN 600058', is_active: true },
    { name: 'Pune Overflow Warehouse', location: 'Pune', address: '10 Hinjewadi Phase 3, Pune, MH 411057', is_active: false },
  ];
  const { data: warehouses, error: whErr } = await supabase.from('warehouses').insert(warehouseData).select('id, name');
  if (whErr) { console.error('Warehouse seed error:', whErr.message); process.exit(1); }
  console.log(`  Created ${warehouses.length} warehouses`);

  // Warehouse stock
  const stockEntries = [];
  for (let i = 0; i < products.length; i++) {
    const wh = warehouses[i % warehouses.length];
    const stock = Math.floor(Math.random() * 200);
    stockEntries.push({
      warehouse_id: wh.id,
      product_id: products[i].id,
      quantity: stock,
      min_stock_level: 10,
      max_stock_level: 200,
    });
  }
  const { error: stockErr } = await supabase.from('warehouse_stock').insert(stockEntries);
  if (stockErr) console.warn('  Stock entries warning:', stockErr.message);
  else console.log(`  Created ${stockEntries.length} stock entries`);

  // Inventory movements
  const movementTypes = ['in', 'out', 'adjustment', 'transfer'];
  const movementReasons = [
    'Restocking from supplier PO',
    'Customer order fulfillment',
    'Inventory audit correction',
    'Transfer to Bangalore Hub',
    'Return from customer',
    'Damaged stock write-off',
    'New batch received',
    'Sample allocation',
  ];
  const movements = [];
  for (let i = 0; i < Math.min(products.length * 2, 100); i++) {
    const prod = products[i % products.length];
    const wh = warehouses[i % warehouses.length];
    const qty = 1 + Math.floor(Math.random() * 30);
    const prevStock = 50 + Math.floor(Math.random() * 100);
    const type = movementTypes[i % movementTypes.length];
    movements.push({
      product_id: prod.id,
      warehouse_id: wh.id,
      movement_type: type,
      quantity: qty,
      previous_stock: prevStock,
      new_stock: type === 'in' ? prevStock + qty : Math.max(0, prevStock - qty),
      reason: movementReasons[i % movementReasons.length],
      created_by: adminUser.id,
    });
  }
  const { error: movErr } = await supabase.from('inventory_movements').insert(movements);
  if (movErr) console.warn('  Movements warning:', movErr.message);
  else console.log(`  Created ${movements.length} inventory movements`);

  // Stock alerts
  const alertTypes = ['low_stock', 'out_of_stock', 'overstock', 'expiring_soon'];
  const alertMessages = [
    'Stock below minimum level of 10 units',
    'Product is completely out of stock',
    'Stock exceeds maximum level of 200 units',
    'Stock nearing expiry date',
  ];
  const alertEntries = [];
  for (let i = 0; i < Math.min(20, products.length); i++) {
    alertEntries.push({
      product_id: products[i].id,
      warehouse_id: warehouses[i % warehouses.length].id,
      alert_type: alertTypes[i % alertTypes.length],
      severity: (['low', 'medium', 'high', 'critical'] as const)[i % 4],
      message: alertMessages[i % alertMessages.length],
      current_stock: i % 4 === 1 ? 0 : Math.floor(Math.random() * 8),
      threshold: 10,
      is_resolved: i >= 15,
    });
  }
  const { error: alertErr } = await supabase.from('stock_alerts').insert(alertEntries);
  if (alertErr) console.warn('  Alerts warning:', alertErr.message);
  else console.log(`  Created ${alertEntries.length} stock alerts`);

  // Inventory forecasts
  const forecastEntries = [];
  for (let i = 0; i < Math.min(15, products.length); i++) {
    const currentStock = products[i].stock || 50;
    const predictedDemand = 10 + Math.floor(Math.random() * 60);
    const daysUntilStockout = predictedDemand > 0 ? Math.round((currentStock / predictedDemand) * 30) : null;
    forecastEntries.push({
      product_id: products[i].id,
      current_stock: currentStock,
      predicted_demand: predictedDemand,
      suggested_order_quantity: Math.max(0, predictedDemand - currentStock + 20),
      days_until_stockout: daysUntilStockout,
      confidence: Math.round((0.5 + Math.random() * 0.45) * 100) / 100,
      forecast_period_start: new Date().toISOString(),
      forecast_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      needs_reorder: (daysUntilStockout !== null && daysUntilStockout < 14),
    });
  }
  const { error: fcErr } = await supabase.from('inventory_forecasts').insert(forecastEntries);
  if (fcErr) console.warn('  Forecasts warning:', fcErr.message);
  else console.log(`  Created ${forecastEntries.length} inventory forecasts`);

  console.log('\nSeed complete!');
  process.exit(0);
};

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
