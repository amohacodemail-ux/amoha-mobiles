const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://kwcsrninpsyxkryeuwsl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3Y3NybmlucHN5eGtyeWV1d3NsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTkxNDcyNSwiZXhwIjoyMDkxNDkwNzI1fQ.q9Yug-rkMeLBSav9HwFS4x40msQAQFC71sKjutVB0IQ';
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data, error } = await supabase.from('goods_receipt_notes').select('*').limit(1);
  console.log('Error:', error);
}
check();
total_cost: 5000
    });
console.log('Inserted item:', p[0].name);
  }
}
check();
