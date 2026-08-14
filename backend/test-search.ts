import supabase from './src/config/supabase';

async function test() {
  const search = 'mithun';
  const { data: searchUsers, error: err1 } = await supabase.from('users').select('id').or(`name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);
  console.log('searchUsers:', searchUsers, err1);

  const searchUserIds = (searchUsers || []).map((u: any) => u.id);
  let orStr = `order_number.ilike.%${search}%,walk_in_customer_name.ilike.%${search}%,walk_in_customer_phone.ilike.%${search}%`;
  if (searchUserIds.length > 0) {
    // try with and without quotes
    orStr += `,user_id.in.("${searchUserIds.join('","')}")`;
  }
  console.log('orStr:', orStr);
  const { data, error } = await supabase.from('orders').select('*').or(orStr);
  console.log('orders error:', error);
  console.log('orders data length:', data?.length);
}

test();
