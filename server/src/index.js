const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const cors = require('cors');
const { setupGameEvents } = require('./socket/gameEvents');
const { createGameState } = require('./game/gameState');

// Create Express app
const app = express();
const server = http.createServer(app);

// Set up CORS for API routes
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? ['https://vcg.nsmbl.io']
    : ['http://localhost:5173', 'http://127.0.0.1:5173']
}));

// Create Socket.IO server with CORS
const io = socketIO(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production'
      ? ['https://vcg.nsmbl.io']
      : ['http://localhost:5173', 'http://127.0.0.1:5173'],
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Initialize game state
const gameState = createGameState();

// Set up static routes for health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

// Set up Socket.IO events
setupGameEvents(io, gameState);

// Game update loop
const TICK_RATE = 30; // Updates per second
const TICK_INTERVAL = 1000 / TICK_RATE;

let lastUpdate = Date.now();

function gameLoop() {
  const now = Date.now();
  const delta = (now - lastUpdate) / 1000; // Convert to seconds
  lastUpdate = now;
  
  // Update game state
  gameState.update(delta, now, io);
  
  // Schedule next update
  setTimeout(gameLoop, TICK_INTERVAL);
}

// Start game loop
gameLoop();

// Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 