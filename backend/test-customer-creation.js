import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import crypto from 'crypto';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testCustomerCreation() {
  console.log("=== Testing Walk-in Customer Creation ===");
  
  // 1. Without Email
  const phoneNoEmail = `99${Math.floor(10000000 + Math.random() * 90000000)}`;
  console.log(`Test 1: Creating without email (Phone: ${phoneNoEmail})`);
  
  const { data: user1, error: err1 } = await supabase.from('users').insert({
    name: 'Test NoEmail',
    phone: phoneNoEmail,
    email: null,
    password: crypto.randomBytes(16).toString('hex'),
    role: 'user',
    is_verified: true
  }).select('id, name, email, phone').single();
  
  if (err1) {
    console.error("Test 1 Failed:", err1);
  } else {
    console.log("Test 1 Success! Record:", user1);
  }
  
  // 2. With Email
  const phoneWithEmail = `98${Math.floor(10000000 + Math.random() * 90000000)}`;
  const testEmail = `test_${Date.now()}@example.com`;
  console.log(`\nTest 2: Creating with email (Phone: ${phoneWithEmail}, Email: ${testEmail})`);
  
  const { data: user2, error: err2 } = await supabase.from('users').insert({
    name: 'Test WithEmail',
    phone: phoneWithEmail,
    email: testEmail,
    password: crypto.randomBytes(16).toString('hex'),
    role: 'user',
    is_verified: true
  }).select('id, name, email, phone').single();
  
  if (err2) {
    console.error("Test 2 Failed:", err2);
  } else {
    console.log("Test 2 Success! Record:", user2);
  }
}

testCustomerCreation().catch(console.error);
