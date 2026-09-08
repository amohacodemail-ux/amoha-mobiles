import supabase from './src/config/supabase';

async function test() {
  const { data, error } = await supabase
      .from('purchase_requests')
      .insert({
        pr_number: 'PR-TEST-001',
        requested_by: '2a490d19-ee36-4c40-9b43-b1d7d2d3adfa', // Dummy UUID, might fail fk constraint
        items: [{"name": "vivo", "quantity": 10, "unitPrice": 1000}],
        reason: 'needed',
        urgency: 'high',
        notes: 'for grn testing',
        supplier_id: 'f99fbb3f-4139-440d-8180-72436e97e473',
        status: 'draft',
      })
      .select('*');

  console.log('Result:', data);
  console.log('Error:', error);
}

test();
