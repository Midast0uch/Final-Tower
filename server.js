const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { Readable } = require('stream');

const STATIC_PORT = 8080;
const LLAMA_PORT = 9999;
const MODEL_PATH = path.join(__dirname, 'models', 'LFM2.5-VL-450M-Q4_0.gguf');
const MMPROJ_PATH = path.join(__dirname, 'models', 'mmproj-LFM2.5-VL-450m-F16.gguf');
const LLAMA_SERVER = path.join(__dirname, 'bin', 'llama-server');

let llamaReady = false;
let llamaProcess = null;

function log(tag, msg) {
  console.log(`[${tag}] ${msg}`);
}

function startLlamaServer() {
  if (!fs.existsSync(LLAMA_SERVER)) {
    log('SERAPH', 'llama-server not found. Run: node download-llama.js');
    return false;
  }
  if (!fs.existsSync(MODEL_PATH)) {
    log('SERAPH', 'Model not found. Run: node download-gguf.js');
    return false;
  }
  if (!fs.existsSync(MMPROJ_PATH)) {
    log('SERAPH', 'Vision projector (mmproj) not found. Run: node download-gguf.js');
    return false;
  }

  const args = [
    '-m', MODEL_PATH,
    '--mmproj', MMPROJ_PATH,
    '--port', String(LLAMA_PORT),
    '-c', '4096',
    '-ngl', '0',
    '--host', '127.0.0.1',
  ];

  log('SERAPH', 'Starting llama-server with LFM2.5-VL-450M...');
  log('SERAPH', `  Model: ${path.basename(MODEL_PATH)}`);
  log('SERAPH', `  MMProj: ${path.basename(MMPROJ_PATH)}`);

  llamaProcess = spawn(LLAMA_SERVER, args, {
    stdio: 'pipe',
    env: { ...process.env, LD_LIBRARY_PATH: path.join(__dirname, 'bin') + ':' + (process.env.LD_LIBRARY_PATH || '') }
  });

  llamaProcess.stdout.on('data', (data) => {
    const text = data.toString().trim();
    if (text.includes('model loaded') || text.includes('HTTP server listening')) {
      llamaReady = true;
      log('SERAPH', 'ALL-SEEING — Vision model ready');
    }
    if (text.includes('error') || text.includes('Error')) {
      log('LLAMA', text);
    }
  });

  llamaProcess.stderr.on('data', (data) => {
    const text = data.toString().trim();
    if (text.includes('model loaded') || text.includes('HTTP server listening') || text.includes('all slots are idle')) {
      llamaReady = true;
    }
    // Only log errors, suppress normal output
    if (text.toLowerCase().includes('error') || text.toLowerCase().includes('fail')) {
      log('LLAMA', text);
    }
  });

  llamaProcess.on('exit', (code) => {
    llamaReady = false;
    log('SERAPH', `llama-server exited with code ${code}`);
  });

  return true;
}

// Poll llama-server health
async function waitForLlama(maxSeconds = 180) {
  const start = Date.now();
  while (Date.now() - start < maxSeconds * 1000) {
    if (llamaReady) return true;
    try {
      const res = await fetch(`http://127.0.0.1:${LLAMA_PORT}/health`);
      if (res.ok) { llamaReady = true; return true; }
    } catch (e) {}
    await new Promise(r => setTimeout(r, 2000));
  }
  return false;
}

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.json': 'application/json',
  '.ico': 'image/x-icon',
  '.gguf': 'application/octet-stream',
};

function serveStatic(req, res) {
  let filePath = req.url === '/' ? '/tower-defense.html' : decodeURIComponent(req.url);
  filePath = path.join(__dirname, filePath);

  // Security: prevent directory traversal
  if (!filePath.startsWith(__dirname)) {
    res.writeHead(403); res.end('Forbidden'); return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404); res.end('Not found');
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, {
      'Content-Type': MIME_TYPES[ext] || 'application/octet-stream',
      'Access-Control-Allow-Origin': '*',
    });
    res.end(data);
  });
}

// Fallback taunts if generation fails
const FALLBACK_TAUNTS = [
  { taunt: "The wheels turn, {name}. You do not.", emotion: "idle", action: "none" },
  { taunt: "I see you, {name}. All of me sees you.", emotion: "mocking", action: "none" },
  { taunt: "Geometric perfection mocks your chaos, {name}.", emotion: "mocking", action: "none" },
  { taunt: "Your towers are merely pebbles in the infinite, {name}.", emotion: "mocking", action: "none" },
  { taunt: "Every path you build, I have already foreseen, {name}.", emotion: "mocking", action: "none" },
  { taunt: "How many eyes must watch before you crumble, {name}?", emotion: "mocking", action: "none" },
  { taunt: "You organize, {name}. I annihilate.", emotion: "enraged", action: "none" },
  { taunt: "The fog remembers, {name}. The fog forgives nothing.", emotion: "idle", action: "none" },
];

function substituteName(tauntObj, name) {
  if (!tauntObj || !tauntObj.taunt) return tauntObj;
  return { ...tauntObj, taunt: tauntObj.taunt.replace(/\{name\}/g, name || 'Architect') };
}

async function llamaChat(messages, maxTokens = 200, timeoutMs = 40000, temperature = 0.1) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const res = await fetch(`http://127.0.0.1:${LLAMA_PORT}/v1/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'seraph',
      messages: messages,
      max_tokens: maxTokens,
      temperature: temperature,
      min_p: 0.15,
      repeat_penalty: 1.05,
    }),
    signal: controller.signal,
  });
  clearTimeout(timeout);
  const data = await res.json();
  return (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) || '';
}

function extractJson(text) {
  try {
    // Strip markdown code blocks first
    let clean = text.replace(/```json\s*/gi, '').replace(/```\s*$/gi, '').trim();
    // Find the outermost JSON object
    const m = clean.match(/\{[\s\S]*?\}/);
    if (m) return JSON.parse(m[0]);
  } catch (e) {}
  return null;
}

async function proxyToLlama(req, res) {
  if (!llamaReady) {
    const ready = await waitForLlama(5);
    if (!ready) {
      res.writeHead(503, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Vision model still loading. Try again in a moment.' }));
      return;
    }
  }

  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const body = Buffer.concat(chunks).toString();

  try {
    const payload = JSON.parse(body);

    // ── PASS 1: Vision model extracts factual board state ──
    const analysisPrompt = `Analyze this tower defense game screenshot.

Respond with ONLY a flat JSON object in this EXACT format (no arrays, no nested objects):
{"towers":"brief description of tower placement","enemies":"brief description of enemy wave","player_status":"winning|losing|even","mood":"calm|frantic"}

EXAMPLE:
{"towers":"towers clustered in northeast corner","enemies":"fast enemies rushing center","player_status":"losing","mood":"frantic"}

Be factual and brief. No opinions. No taunts. No markdown code blocks.`;

    const pass1Text = await llamaChat([
      { role: 'user', content: [
        { type: 'text', text: analysisPrompt },
        { type: 'image_url', image_url: { url: payload.image } }
      ]}
    ], 120);

    log('SERVER', `Pass 1 raw: ${pass1Text.substring(0, 300)}`);
    const analysis = extractJson(pass1Text) || {};
    log('SERVER', `Vision analysis: ${JSON.stringify(analysis)}`);

    // ── PASS 2: Text-only roleplay — generate unique taunt from board state ──
    const playerName = payload.playerName || 'Architect';
    const tauntPrompt = `You are the Ophanim Seraph. Biblical wheel-of-eyes angel. Corrupted. Malevolent.

You observe from above. You DESPISE ${playerName} organizing chaos below.
Address ${playerName} by name in your taunts. Use their name naturally.
Your voice: geometric riddles, sarcastic scripture, cryptic arrogance.

BOARD STATE:
- Towers: ${analysis.towers || 'unknown'}
- Enemies: ${analysis.enemies || 'unknown'}
- Status: ${analysis.player_status || 'unknown'}

EXAMPLES OF PERFECT TAUNTS:
{"taunt":"${playerName} stacks stones like a child building walls against the tide...","emotion":"mocking","action":"none"}
{"taunt":"Your geometry collapses, ${playerName}. I predicted every angle.","emotion":"enraged","action":"spawn_extra"}
{"taunt":"How many eyes must watch before you crumble, ${playerName}?","emotion":"mocking","action":"none"}

NOW WRITE A NEW TAUNT for this board state. Under 120 chars. ONLY JSON. NO DESCRIPTION.

{"taunt":"`;

    const pass2Text = await llamaChat([
      { role: 'user', content: tauntPrompt }
    ], 100, 40000, 0.7);  // higher temp for creativity, fewer tokens for brevity

    // The model might have continued the JSON we started
    let fullJson = pass2Text.includes('"emotion"') ? '{"taunt":"' + pass2Text : pass2Text;
    let parsed = extractJson(fullJson);

    // Guard against literal descriptions leaking through
    if (!parsed || !parsed.taunt || parsed.taunt.length > 200 || /^(I see|There is|This is|The image|In the|A tower|The screenshot)/i.test(parsed.taunt)) {
      const ctx = (analysis.player_status || '').toLowerCase();
      if (ctx === 'losing') parsed = { taunt: `Your geometry collapses, ${playerName}. I predicted every angle.`, emotion: "enraged", action: "spawn_extra" };
      else if (ctx === 'winning') parsed = { taunt: `You think you control this board, ${playerName}? I SEE EVERY SQUARE.`, emotion: "enraged", action: "buff_enemies" };
      else parsed = substituteName(FALLBACK_TAUNTS[Math.floor(Math.random() * FALLBACK_TAUNTS.length)], playerName);
    }

    parsed.confidence = 0.85;
    parsed.observation = analysis;

    log('SERVER', `Final taunt: ${parsed.taunt}`);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(parsed));
  } catch (e) {
    log('SERVER', `Vision error: ${e.message}`);
    const fb = FALLBACK_TAUNTS[Math.floor(Math.random() * FALLBACK_TAUNTS.length)];
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ...fb, error: e.message }));
  }
}

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  if (req.url === '/api/vision' && req.method === 'POST') {
    proxyToLlama(req, res);
    return;
  }

  if (req.url === '/api/health' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ llamaReady, timestamp: Date.now() }));
    return;
  }

  serveStatic(req, res);
});

server.listen(STATIC_PORT, () => {
  log('SERVER', `Running at http://localhost:${STATIC_PORT}`);
  const started = startLlamaServer();
  if (!started) {
    log('SERVER', 'Vision model not started — run download scripts first');
  }
});

process.on('SIGINT', () => {
  log('SERVER', 'Shutting down...');
  if (llamaProcess) llamaProcess.kill();
  server.close(() => process.exit(0));
});
