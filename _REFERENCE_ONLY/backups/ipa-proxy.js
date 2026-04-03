/**
 * Ven'ai IPA Proxy — Aelarian Archive
 * Forwards Anthropic API calls from the browser (CORS-blocked on localhost)
 * through this local Node.js server.
 *
 * Usage:
 *   ANTHROPIC_API_KEY=sk-ant-... node ipa-proxy.js
 *
 * Or create a .env file in the same folder:
 *   ANTHROPIC_API_KEY=sk-ant-...
 *   PORT=3131
 *
 * Then run:  node ipa-proxy.js
 *
 * The proxy listens on http://localhost:3131 by default.
 */

const http  = require('http');
const https = require('https');
const fs    = require('fs');
const path  = require('path');

// ── Load .env if present ────────────────────────────────────────
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
    const [k, ...v] = line.trim().split('=');
    if (k && v.length) process.env[k.trim()] = v.join('=').trim();
  });
}

const API_KEY = process.env.ANTHROPIC_API_KEY || '';
const PORT    = parseInt(process.env.PORT || '3131', 10);

if (!API_KEY) {
  console.error('\n[ipa-proxy] ✗ ANTHROPIC_API_KEY is not set.');
  console.error('  Set it in a .env file or as an environment variable.\n');
  process.exit(1);
}

// ── Server ──────────────────────────────────────────────────────
const server = http.createServer((req, res) => {
  // CORS — allow the archive origin
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }
  if (req.method !== 'POST')    { res.writeHead(405); res.end('Method not allowed'); return; }

  let body = '';
  req.on('data', chunk => body += chunk);
  req.on('end', () => {
    const options = {
      hostname: 'api.anthropic.com',
      path:     '/v1/messages',
      method:   'POST',
      headers: {
        'Content-Type':      'application/json',
        'x-api-key':         API_KEY,
        'anthropic-version': '2023-06-01',
        'Content-Length':    Buffer.byteLength(body),
      },
    };

    const proxy = https.request(options, apiRes => {
      res.writeHead(apiRes.statusCode, { 'Content-Type': 'application/json' });
      apiRes.pipe(res);
    });

    proxy.on('error', err => {
      console.error('[ipa-proxy] upstream error:', err.message);
      res.writeHead(502);
      res.end(JSON.stringify({ error: err.message }));
    });

    proxy.write(body);
    proxy.end();
  });
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`\n[ipa-proxy] ✦ Running on http://localhost:${PORT}`);
  console.log(`[ipa-proxy]   API key: ${API_KEY.slice(0,8)}…${API_KEY.slice(-4)}`);
  console.log('[ipa-proxy]   Ready — IPA generation will now work in the Archive.\n');
});
