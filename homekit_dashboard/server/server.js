'use strict';

const express = require('express');
const http = require('http');
const path = require('path');
const { WebSocket, WebSocketServer } = require('ws');

// Read port from HA options file (set by user in add-on config), fallback to env/default
function readOptionsPort() {
  try {
    const fs = require('fs');
    const opts = JSON.parse(fs.readFileSync('/data/options.json', 'utf8'));
    if (opts.port && Number.isInteger(opts.port)) return opts.port;
  } catch { /* not running as HA add-on */ }
  return null;
}
const PORT = readOptionsPort() || parseInt(process.env.PORT || '3000', 10);
const SUPERVISOR_TOKEN = process.env.SUPERVISOR_TOKEN || '';
const HA_WS_URL = 'ws://supervisor/core/websocket';
const HA_API_URL = 'http://supervisor/core/api';

const app = express();
const server = http.createServer(app);

// Serve React build
app.use(express.static(path.join(__dirname, 'public')));

// REST proxy: /ha-api/* → http://supervisor/core/api/*
app.use('/ha-api', (req, res) => {
  const targetUrl = `${HA_API_URL}${req.url}`;

  const options = {
    method: req.method,
    headers: {
      Authorization: `Bearer ${SUPERVISOR_TOKEN}`,
      'Content-Type': 'application/json',
    },
  };

  const proxyReq = http.request(targetUrl, options, (proxyRes) => {
    res.status(proxyRes.statusCode || 200);
    Object.entries(proxyRes.headers).forEach(([k, v]) => {
      if (v !== undefined) res.setHeader(k, v);
    });
    proxyRes.pipe(res);
  });

  proxyReq.on('error', (err) => {
    console.error('REST proxy error:', err.message);
    res.status(502).json({ error: 'Bad gateway', detail: err.message });
  });

  req.pipe(proxyReq);
});

const fs = require('fs');

app.use('/dashboard-api', express.json({ limit: '2mb' }));

// Return the HA user ID injected by the Supervisor ingress proxy
app.get('/dashboard-api/whoami', (req, res) => {
  const userId = req.headers['x-hass-user-id'] || null
  res.json({ userId })
})

app.get('/dashboard-api/settings/:userId', (req, res) => {
  const safeId = req.params.userId.replace(/[^a-z0-9_-]/gi, '_').slice(0, 64)
  const file = path.join('/data', `user_settings_${safeId}.json`)
  try {
    res.json(fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : {})
  } catch { res.json({}) }
})

app.put('/dashboard-api/settings/:userId', (req, res) => {
  const safeId = req.params.userId.replace(/[^a-z0-9_-]/gi, '_').slice(0, 64)
  const file = path.join('/data', `user_settings_${safeId}.json`)
  try {
    fs.writeFileSync(file, JSON.stringify(req.body))
    res.json({ ok: true })
  } catch (e) { res.status(500).json({ error: String(e) }) }
})

// Fallback: serve React app for all other GET routes (SPA)
app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// WebSocket proxy: /ws → ws://supervisor/core/websocket
// The proxy auto-injects the SUPERVISOR_TOKEN auth so the browser never needs a token.
const wss = new WebSocketServer({ server, path: '/ws' });

wss.on('connection', (browserWs) => {
  let haWs = null;
  let authDone = false;
  // Queue messages from browser that arrive before HA WS is ready
  const browserQueue = [];

  haWs = new WebSocket(HA_WS_URL, {
    headers: { Authorization: `Bearer ${SUPERVISOR_TOKEN}` },
  });

  haWs.on('open', () => {
    // Drain queued browser messages (shouldn't normally be needed)
    browserQueue.forEach((msg) => {
      if (haWs.readyState === WebSocket.OPEN) haWs.send(msg);
    });
    browserQueue.length = 0;
  });

  haWs.on('message', (data) => {
    let msg;
    try {
      msg = JSON.parse(data.toString());
    } catch {
      // Forward raw if not JSON
      if (browserWs.readyState === WebSocket.OPEN) browserWs.send(data);
      return;
    }

    if (msg.type === 'auth_required') {
      // Inject auth on behalf of the browser using SUPERVISOR_TOKEN
      if (haWs.readyState === WebSocket.OPEN) {
        haWs.send(JSON.stringify({ type: 'auth', access_token: SUPERVISOR_TOKEN }));
      }
      // Forward auth_required to browser so it knows what to expect
      if (browserWs.readyState === WebSocket.OPEN) {
        browserWs.send(JSON.stringify(msg));
      }
      return;
    }

    if (msg.type === 'auth_ok') {
      authDone = true;
    }

    if (msg.type === 'auth_invalid') {
      console.error('HA auth invalid — check SUPERVISOR_TOKEN');
    }

    // Forward all other messages to browser
    if (browserWs.readyState === WebSocket.OPEN) {
      browserWs.send(JSON.stringify(msg));
    }
  });

  haWs.on('error', (err) => {
    console.error('HA WebSocket error:', err.message);
    if (browserWs.readyState === WebSocket.OPEN) browserWs.close(1011, 'HA connection error');
  });

  haWs.on('close', () => {
    if (browserWs.readyState === WebSocket.OPEN) browserWs.close(1001, 'HA connection closed');
  });

  // Browser → HA: forward all messages except auth (proxy already handled it)
  browserWs.on('message', (data) => {
    let msg;
    try {
      msg = JSON.parse(data.toString());
    } catch {
      return;
    }

    // Discard auth messages from browser — proxy handles auth
    if (msg.type === 'auth') return;

    if (haWs && haWs.readyState === WebSocket.OPEN) {
      haWs.send(JSON.stringify(msg));
    } else {
      browserQueue.push(JSON.stringify(msg));
    }
  });

  browserWs.on('close', () => {
    if (haWs && haWs.readyState !== WebSocket.CLOSED) haWs.close();
  });

  browserWs.on('error', (err) => {
    console.error('Browser WebSocket error:', err.message);
    if (haWs && haWs.readyState !== WebSocket.CLOSED) haWs.close();
  });
});

server.listen(PORT, () => {
  console.log(`HomeKit Dashboard server listening on port ${PORT}`);
  if (!SUPERVISOR_TOKEN) {
    console.warn('WARNING: SUPERVISOR_TOKEN is not set — HA connection will fail');
  }
});
