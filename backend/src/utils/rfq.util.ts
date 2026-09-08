import supabase from '../config/supabase';

export async function generateSequentialRfqNumber(): Promise<string> {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  
  // Format matching the screenshot / old format?
  // Old format: `RFQ-${new Date().getFullYear()}-${String((count || 0) + 1).padStart(4, '0')}`;
  // New unified format: `RFQ-${dd}${mm}${yyyy}-XXX` ? Let's use the old format `RFQ-YYYY-XXXX` since it was used in `rfq.routes.ts` before.
  // Wait, let's look at `rfqNumber = \`RFQ-${new Date().getFullYear()}-${String((count || 0) + 1).padStart(4, '0')}\`;`
  // Actually, let's use the same date format as PO for consistency: `RFQ-${dd}${mm}${yyyy}-XXX`.

  const dateStr = `${dd}${mm}${yyyy}`;

  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).toISOString();

  // Get the most recent RFQ for today
  const { data } = await supabase
    .from('rfqs')
    .select('rfq_number')
    .gte('created_at', startOfDay)
    .lte('created_at', endOfDay)
    .order('created_at', { ascending: false })
    .limit(1);

  let seqNum = 1;
  if (data && data.length > 0) {
    const lastRfq = data[0].rfq_number;
    const parts = lastRfq.split('-');
    // RFQ-08092026-001 -> length 3
    if (parts.length >= 3) {
      const lastSeq = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(lastSeq)) {
        seqNum = lastSeq + 1;
      }
    }
  }

  const seq = String(seqNum).padStart(3, '0');
  return `RFQ-${dateStr}-${seq}`;
}
