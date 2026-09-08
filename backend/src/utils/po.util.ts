import supabase from '../config/supabase';

export async function generateSequentialPoNumber(): Promise<string> {
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, '0');
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const yyyy = now.getFullYear();
  const dateStr = `${dd}${mm}${yyyy}`; // e.g. 08092026

  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).toISOString();

  // Get the most recent PO for today
  const { data } = await supabase
    .from('purchase_orders')
    .select('po_number')
    .gte('created_at', startOfDay)
    .lte('created_at', endOfDay)
    .order('created_at', { ascending: false })
    .limit(1);

  let seqNum = 1;
  if (data && data.length > 0) {
    const lastPo = data[0].po_number;
    const parts = lastPo.split('-');
    if (parts.length === 3) {
      const lastSeq = parseInt(parts[2], 10);
      if (!isNaN(lastSeq)) {
        seqNum = lastSeq + 1;
      }
    }
  }

  const seq = String(seqNum).padStart(3, '0');
  return `PO-${dateStr}-${seq}`;
}
