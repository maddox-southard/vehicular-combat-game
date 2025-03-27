import * as THREE from 'three';
import { io } from 'socket.io-client';
import { setupVehicleSelection } from './components/VehicleSelection';
import { createRenderer, createScene, createCamera, updateCamera } from './game/core/Renderer';
import { initializeGameState } from './game/core/GameState';
import { setupPortals } from './game/map/Portal';
import { checkForPortalParameters } from './utils/UrlUtils';
import { createAerialCamera, updateAerialCamera } from './game/core/AerialCamera';
import { initializeRespawn, startRespawn, updateRespawn, createRespawnUI } from './game/core/Respawn';
import { createMap } from './game/map/Map';

// Initialize core components
let renderer, scene, camera, aerialCamera;
let gameState = {
  localPlayer: null,
  players: new Map(),
  boss: null,
  pickups: [],
  portals: null,
  lastTime: 0,
  running: false,
  useAerialCamera: true // Start with aerial view
};

// Socket configuration
const socketUrl = import.meta.env.PROD 
  ? 'https://your-production-server.com' 
  : 'http://localhost:3000';
const socket = io(socketUrl, {
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000
});

// Game initialization
function init() {
  // Setup Three.js core
  renderer = createRenderer();
  scene = createScene();
  camera = createCamera();
  aerialCamera = createAerialCamera();
  
  document.getElementById('game-container').appendChild(renderer.domElement);
  
  // Initialize respawn system
  initializeRespawn(gameState);
  createRespawnUI();
  
  // Create the map early so it's visible during vehicle selection
  gameState.map = createMap(scene);
  
  // Check for portal parameters
  const portalParams = checkForPortalParameters();
  
  // Setup vehicle selection
  setupVehicleSelection(selectVehicleAndJoinGame, portalParams);
  
  // Handle window resize
  window.addEventListener('resize', onWindowResize);
  
  // Start animation loop immediately for instant loading experience
  animate(0);
}

// Vehicle selection callback
function selectVehicleAndJoinGame(vehicleType, playerName) {
  // Hide vehicle selection UI
  document.getElementById('vehicle-selection').style.display = 'none';
  
  // Set game to running
  gameState.running = true;
  gameState.useAerialCamera = false;
  
  // Initialize game with selected vehicle
  initializeGameState(scene, vehicleType, playerName, socket, gameState);
  
  // Extend vehicle handleDeath method to trigger respawn
  if (gameState.localPlayer && gameState.localPlayer.vehicle) {
    const originalHandleDeath = gameState.localPlayer.vehicle.handleDeath;
    gameState.localPlayer.vehicle.handleDeath = function() {
      originalHandleDeath.call(this);
      
      // Trigger respawn and switch to aerial view
      gameState.useAerialCamera = true;
      startRespawn(gameState);
    };
  }
  
  // Setup portals
  gameState.portals = setupPortals(scene);
  
  // Connect to server
  socket.connect();
  
  // Join game with selected vehicle
  socket.emit('join', {
    username: playerName || 'Player',
    vehicle: vehicleType
  });
  
  // Setup socket event handlers
  setupSocketHandlers();
}

// Socket event handlers
function setupSocketHandlers() {
  socket.on('connect', () => {
    console.log('Connected to server');
  });
  
  socket.on('disconnect', () => {
    console.log('Disconnected from server');
  });
  
  socket.on('gameState', (state) => {
    // Initialize game with received state
    handleGameState(state);
  });
  
  socket.on('playerJoined', (player) => {
    // Add new player to game
    addPlayer(player);
  });
  
  socket.on('playerLeft', (playerId) => {
    // Remove player from game
    removePlayer(playerId);
  });
  
  socket.on('playerMoved', (data) => {
    // Update player position
    updatePlayerPosition(data);
  });
  
  // Additional socket event handlers...
}

// Handler functions for socket events
function handleGameState(state) {
  // Implement state synchronization
}

function addPlayer(player) {
  // Add new player to the game
}

function removePlayer(playerId) {
  // Remove player from the game
}

function updatePlayerPosition(data) {
  // Update remote player position and rotation
}

// Animation loop
function animate(time) {
  requestAnimationFrame(animate);
  
  const delta = (time - gameState.lastTime) / 1000;
  gameState.lastTime = time;
  
  // Update game logic if game is running
  if (gameState.running) {
    updateGame(delta, time);
  }
  
  // Update respawn system
  updateRespawn(gameState, scene);
  
  // Update aerial camera
  updateAerialCamera(aerialCamera, scene, time);
  
  // Choose which camera to use
  const activeCamera = gameState.useAerialCamera ? aerialCamera : camera;
  
  // Render scene
  renderer.render(scene, activeCamera);
}

// Game update logic
function updateGame(delta, time) {
  // Update local player
  if (gameState.localPlayer) {
    // Skip local player updates during respawn
    if (!gameState.respawn?.active) {
      // Update the vehicle instead of the player object
      gameState.localPlayer.vehicle.update(delta, gameState.map);
      
      // Send position updates to server
      socket.emit('updatePosition', {
        position: gameState.localPlayer.vehicle.mesh.position.clone(),
        rotation: gameState.localPlayer.vehicle.mesh.rotation.clone()
      });
      
      // Update camera to follow player
      updateCameraPosition();
      
      // Check for portal collisions
      checkPortalCollisions();
    }
  }
  
  // Update other players
  for (const player of gameState.players.values()) {
    if (player.id !== socket.id) {
      player.vehicle.update(delta, gameState.map);
    }
  }
  
  // Update boss if present
  if (gameState.boss) {
    gameState.boss.update(Array.from(gameState.players.values()), delta, time);
  }
  
  // Update pickups
  updatePickups(delta);
}

// Update camera to follow player
function updateCameraPosition() {
  if (!gameState.localPlayer || !gameState.localPlayer.vehicle) return;
  
  // Use the updateCamera function from Renderer.js
  const target = gameState.localPlayer.vehicle.mesh;
  const delta = 1/60; // Approximate delta if not available
  
  updateCamera(camera, target, delta);
}

// Check for portal collisions
function checkPortalCollisions() {
  // Implement portal collision detection
}

// Update pickups
function updatePickups(delta) {
  // Implement pickup updates and collision detection
}

// Handle window resize
function onWindowResize() {
  // Update main camera
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  
  // Update aerial camera
  aerialCamera.aspect = window.innerWidth / window.innerHeight;
  aerialCamera.updateProjectionMatrix();
  
  // Update renderer
  renderer.setSize(window.innerWidth, window.innerHeight);
}

// Initialize the game
init(); 