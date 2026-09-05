const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 3001;
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';

const isOriginAllowed = (origin, callback) => {
  if (!origin) return callback(null, true);
  if (CORS_ORIGIN === '*') return callback(null, true);

  const configuredOrigins = CORS_ORIGIN.split(',').map(s => s.trim());
  if (configuredOrigins.includes(origin)) return callback(null, true);

  try {
    const parsed = new URL(origin);
    if (
      parsed.hostname === 'localhost' ||
      parsed.hostname === '127.0.0.1' ||
      parsed.hostname === '0.0.0.0' ||
      parsed.hostname.startsWith('192.168.') ||
      parsed.hostname.startsWith('10.') ||
      parsed.hostname.endsWith('.test') ||
      parsed.hostname.endsWith('.local')
    ) {
      return callback(null, true);
    }
  } catch (e) {}

  return callback(null, true);
};

app.use(cors({
  origin: isOriginAllowed,
  credentials: true
}));
app.use(express.json());

const io = new Server(server, {
  cors: {
    origin: isOriginAllowed,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Track connected sockets
let connectedClients = 0;

io.on('connection', (socket) => {
  connectedClients++;
  console.log(`[Socket.io] Client connected: ${socket.id} (Total: ${connectedClients})`);

  // Channel / Room subscription
  socket.on('subscribe', (channel) => {
    if (channel) {
      socket.join(channel);
      console.log(`[Socket.io] Socket ${socket.id} joined channel: ${channel}`);
      socket.emit('subscribed', { channel, status: 'ok' });
    }
  });

  socket.on('unsubscribe', (channel) => {
    if (channel) {
      socket.leave(channel);
      console.log(`[Socket.io] Socket ${socket.id} left channel: ${channel}`);
      socket.emit('unsubscribed', { channel, status: 'ok' });
    }
  });

  // Client-to-server ping
  socket.on('ping', (data) => {
    socket.emit('pong', { ...data, timestamp: Date.now() });
  });

  // Client broadcast (optional peer-to-peer messaging)
  socket.on('client_message', (payload) => {
    console.log(`[Socket.io] Message from ${socket.id}:`, payload);
    if (payload.channel) {
      socket.to(payload.channel).emit('client_message', payload);
    } else {
      socket.broadcast.emit('client_message', payload);
    }
  });

  socket.on('disconnect', (reason) => {
    connectedClients = Math.max(0, connectedClients - 1);
    console.log(`[Socket.io] Client disconnected: ${socket.id} Reason: ${reason} (Total: ${connectedClients})`);
  });
});

// REST Healthcheck
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    connectedClients,
    timestamp: new Date().toISOString()
  });
});

// HTTP Webhook to broadcast events from Laravel / worker to Socket.io clients
app.post('/api/broadcast', (req, res) => {
  const { event, data, channel } = req.body;

  if (!event) {
    return res.status(400).json({ error: 'Field "event" is required' });
  }

  const payload = {
    event,
    data: data || {},
    channel: channel || 'global',
    timestamp: new Date().toISOString()
  };

  if (channel && channel !== 'global') {
    io.to(channel).emit(event, payload);
    console.log(`[Broadcast] Event "${event}" emitted to channel "${channel}"`);
  } else {
    io.emit(event, payload);
    console.log(`[Broadcast] Event "${event}" emitted globally to all clients`);
  }

  return res.json({
    success: true,
    recipients: connectedClients,
    broadcast: payload
  });
});

server.listen(PORT, () => {
  console.log(`[Realtime Server] Listening on http://localhost:${PORT}`);
  console.log(`[Realtime Server] Allowed CORS origin: ${CORS_ORIGIN}`);
});

