import supabase from './src/config/supabase';

async function testStatus(status: string) {
  const { data, error } = await supabase
      .from('purchase_requests')
      .insert({
        pr_number: 'PR-TEST-' + status,
        requested_by: '2a490d19-ee36-4c40-9b43-b1d7d2d3adfa',
        items: [{"name": "vivo", "quantity": 10, "unitPrice": 1000}],
        reason: 'needed',
        urgency: 'high',
        notes: 'testing status ' + status,
        supplier_id: 'f99fbb3f-4139-440d-8180-72436e97e473',
        status: status,
      })
      .select('*');
      
  console.log(`Status '${status}':`, error ? error.message : 'SUCCESS');
}

async function run() {
  await testStatus('pending');
  await testStatus('Pending');
  await testStatus('submitted');
  await testStatus('Submitted');
  await testStatus('draft');
  await testStatus('Draft');
}
run();
