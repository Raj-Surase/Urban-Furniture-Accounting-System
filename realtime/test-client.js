const { io } = require('socket.io-client');
const http = require('http');

const socket = io('http://localhost:3001', {
  transports: ['websocket', 'polling']
});

console.log('Attempting to connect to realtime server...');

socket.on('connect', () => {
  console.log('✅ Connected to realtime server with ID:', socket.id);

  // Subscribe to channel
  socket.emit('subscribe', 'items');

  // Ping test
  socket.emit('ping', { message: 'hello from test' });
});

socket.on('pong', (data) => {
  console.log('✅ Received pong from server:', data);

  // Test REST broadcast webhook trigger
  triggerBroadcastTest();
});

socket.on('subscribed', (res) => {
  console.log('✅ Channel subscription confirmed:', res);
});

socket.on('item:created', (payload) => {
  console.log('✅ Received broadcast event "item:created":', payload);
  console.log('🎉 Socket.io End-to-End Test PASSED successfully!');
  socket.disconnect();
  process.exit(0);
});

socket.on('connect_error', (err) => {
  console.error('❌ Connection error:', err.message);
  process.exit(1);
});

setTimeout(() => {
  console.error('❌ Timeout: did not receive all expected socket events within 10s');
  process.exit(1);
}, 10000);

function triggerBroadcastTest() {
  const postData = JSON.stringify({
    event: 'item:created',
    channel: 'items',
    data: { id: 1, title: 'Test Item', message: 'Triggered via HTTP broadcast endpoint' }
  });

  const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/broadcast',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  const req = http.request(options, (res) => {
    let body = '';
    res.on('data', chunk => body += chunk);
    res.on('end', () => {
      console.log('✅ REST /api/broadcast trigger responded with:', body);
    });
  });

  req.on('error', (e) => {
    console.error('❌ Problem with broadcast request:', e.message);
  });

  req.write(postData);
  req.end();
}

