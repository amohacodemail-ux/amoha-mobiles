const https = require('https');
const TOKEN = process.env.RENDER_TOKEN || 'rnd_5e75CznULV902QNCRzAudnwWd79J';
const SVC = 'srv-d6uhembuibrs73867hog';

function req(path, method, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const opts = {
      hostname: 'api.render.com', path, method,
      headers: { 'Authorization': `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
    };
    if (data) opts.headers['Content-Length'] = Buffer.byteLength(data);
    const r = https.request(opts, (res) => {
      let b = '';
      res.on('data', c => b += c);
      res.on('end', () => { try { resolve({ s: res.statusCode, d: JSON.parse(b) }); } catch { resolve({ s: res.statusCode, d: b }); } });
    });
    r.on('error', reject);
    if (data) r.write(data);
    r.end();
  });
}

async function main() {
  // Update build command
  console.log('=== Updating build command ===');
  const up = await req(`/v1/services/${SVC}`, 'PATCH', {
    serviceDetails: {
      envSpecificDetails: {
        buildCommand: 'npm install --include=dev && npm run build',
        startCommand: 'npm start',
      },
    },
  });
  console.log('Update:', up.s, up.d?.serviceDetails?.envSpecificDetails || JSON.stringify(up.d).slice(0, 200));

  // Trigger redeploy
  console.log('\n=== Triggering redeploy ===');
  const dep = await req(`/v1/services/${SVC}/deploys`, 'POST', { clearCache: 'clear' });
  console.log('Deploy:', dep.s, dep.d?.id || JSON.stringify(dep.d));
}
main().catch(console.error);
