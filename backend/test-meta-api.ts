import env from './src/config/env';

async function main() {
  const wabaId = '2858883264471856';
  const token = env.WHATSAPP_ACCESS_TOKEN;
  
  console.log('--- PHONE NUMBERS ---');
  const res1 = await fetch(`https://graph.facebook.com/v20.0/${wabaId}/phone_numbers`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const data1 = await res1.json();
  console.log(JSON.stringify(data1, null, 2));

  console.log('--- MESSAGE TEMPLATES ---');
  const res2 = await fetch(`https://graph.facebook.com/v20.0/${wabaId}/message_templates?name=restock_alert`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const data2 = await res2.json();
  console.log(JSON.stringify(data2, null, 2));
}
main();
