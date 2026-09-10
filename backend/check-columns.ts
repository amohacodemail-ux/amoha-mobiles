import supabase from './src/config/supabase';

async function check() {
  const { data, error } = await supabase.from('service_requests').select('status');
  if (error) {
    console.error('Error fetching:', error);
  } else {
    const statuses = new Set(data.map((r: any) => r.status));
    console.log('Unique statuses in DB:', Array.from(statuses));
  }
}
check();
