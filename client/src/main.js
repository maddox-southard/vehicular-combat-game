import * as THREE from 'three';
import { io } from 'socket.io-client';
import { setupVehicleSelection, cleanupVehicleSelection } from './components/VehicleSelection';
import { createRenderer, createScene, createCamera, updateCamera } from './game/core/Renderer';
import { initializeGameState } from './game/core/GameState';
import { setupPortals } from './game/map/Portal';
import { checkForPortalParameters } from './utils/UrlUtils';
import { createAerialCamera, updateAerialCamera } from './game/core/AerialCamera';
import { initializeRespawn, startRespawn, updateRespawn, createRespawnUI } from './game/core/Respawn';
import { createMap } from './game/map/Map';
import { Vehicle } from './game/vehicles/Vehicle';
import { createPickupMesh } from './game/pickups/PickupMeshFactory';
import { GameUI } from './game/ui/GameUI';
import { createBossMesh } from './game/boss/BossMeshFactory';
import { Projectile } from './game/weapons/Projectile';

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
  useAerialCamera: true, // Start with aerial view
  bossMesh: null,
  projectiles: []
};

// Make gameState globally available
window.gameState = gameState;

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

// Add to game state initialization
window.gameUI = new GameUI();

// Make socket available globally
window.socket = socket;

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

  // Clean up WebGL resources from vehicle selection
  cleanupVehicleSelection();

  // Set game to running
  gameState.running = true;
  gameState.useAerialCamera = false;

  // Initialize game with selected vehicle
  initializeGameState(scene, vehicleType, playerName, socket, gameState);

  // Initialize weapon UI with initial weapon state
  if (gameState.localPlayer && gameState.localPlayer.vehicle) {
    window.gameUI.updateWeaponSystem(
      gameState.localPlayer.vehicle.weapons,
      gameState.localPlayer.vehicle.currentWeapon,
      gameState.localPlayer.vehicle.weaponAmmo
    );
  }

  // Extend vehicle handleDeath method to trigger respawn
  if (gameState.localPlayer && gameState.localPlayer.vehicle) {
    const originalHandleDeath = gameState.localPlayer.vehicle.handleDeath;
    gameState.localPlayer.vehicle.handleDeath = function () {
      originalHandleDeath.call(this);

      // Trigger respawn and switch to aerial view
      gameState.useAerialCamera = true;
      startRespawn(gameState);
    };
  }

  // Setup portals
  gameState.portals = setupPortals(scene);

  // Setup socket handlers
  setupSocketHandlers();

  // Connect socket
  socket.connect();

  // Join game with selected vehicle
  socket.emit('join', {
    username: playerName || 'Player',
    vehicle: vehicleType
  });
}

// Socket event handlers
function setupSocketHandlers() {
  socket.on('connect', () => {
    console.log('Connected to server with ID:', socket.id);
  });

  socket.on('disconnect', () => {
    console.log('Disconnected from server');
  });

  socket.on('gameState', (state) => {
    console.log('Received game state:', state);

    // Initialize other players from received state
    state.players.forEach(playerData => {
      if (playerData.id !== socket.id) {
        addPlayer(playerData, scene, gameState);
      }
    });

    // Handle initial boss state if present
    if (state.boss) {
      console.log('Initializing boss from game state:', state.boss);
      gameState.boss = state.boss;

      // Create boss mesh
      if (!gameState.bossMesh) {
        gameState.bossMesh = createBossMesh();
        scene.add(gameState.bossMesh);
      }

      // Set boss position and rotation
      gameState.bossMesh.position.set(
        state.boss.position.x,
        state.boss.position.y,
        state.boss.position.z
      );

      if (state.boss.rotation) {
        gameState.bossMesh.rotation.set(
          state.boss.rotation._x || 0,
          state.boss.rotation._y || state.boss.rotation.y || 0,
          state.boss.rotation._z || 0
        );
      }

      // Update UI
      window.gameUI.updateBossHealth(state.boss.health, state.boss.maxHealth);
    }
  });

  socket.on('playerJoined', (playerData) => {
    console.log('Player joined:', playerData);
    if (playerData.id !== socket.id) {
      addPlayer(playerData, scene, gameState);
    }
  });

  socket.on('playerLeft', (playerId) => {
    console.log('Player left:', playerId);
    removePlayer(playerId, scene, gameState);
  });

  socket.on('playerMoved', (data) => {
    const player = gameState.players.get(data.id);
    if (player && player.vehicle) {
      // Update remote player position and rotation
      player.vehicle.mesh.position.set(
        data.position.x,
        data.position.y,
        data.position.z
      );
      player.vehicle.mesh.rotation.set(
        data.rotation._x || 0,
        data.rotation._y || data.rotation.y || 0,
        data.rotation._z || 0
      );
    }
  });

  socket.on('initializePickups', (pickups) => {
    console.log('Received initial pickups:', pickups);

    // Clear existing pickups
    gameState.pickups.forEach(pickup => {
      if (pickup.mesh) {
        scene.remove(pickup.mesh);
      }
    });
    gameState.pickups = [];

    // Create new pickups
    pickups.forEach(pickupData => {
      createPickup(pickupData);
    });
  });

  socket.on('pickupSpawned', (pickupData) => {
    console.log('New pickup spawned:', pickupData);
    createPickup(pickupData);
  });

  socket.on('pickupCollected', (data) => {
    console.log('Pickup collected:', data);

    // Remove pickup from scene and state
    const pickup = gameState.pickups.find(p => p.id === data.id);
    if (pickup) {
      scene.remove(pickup.mesh);
      gameState.pickups = gameState.pickups.filter(p => p.id !== data.id);

      // If collected by local player, apply effect
      if (data.playerId === socket.id && gameState.localPlayer) {
        gameState.localPlayer.vehicle.handlePickupCollection(data.type);

        // Force immediate UI update
        window.gameUI.updateWeaponSystem(
          gameState.localPlayer.vehicle.weapons,
          gameState.localPlayer.vehicle.currentWeapon,
          gameState.localPlayer.vehicle.weaponAmmo
        );
      }
    }
  });

  socket.on('bossSpawned', (data) => {
    console.log('Boss spawned:', data);
    gameState.boss = data.boss;

    // Create boss mesh if it doesn't exist
    if (!gameState.bossMesh) {
      gameState.bossMesh = createBossMesh();
      scene.add(gameState.bossMesh);
    }

    // Set initial position
    gameState.bossMesh.position.set(
      data.boss.position.x,
      data.boss.position.y,
      data.boss.position.z
    );

    // Set initial rotation
    if (data.boss.rotation) {
      gameState.bossMesh.rotation.set(
        data.boss.rotation._x || 0,
        data.boss.rotation._y || data.boss.rotation.y || 0,
        data.boss.rotation._z || 0
      );
    }

    // Update UI
    window.gameUI.updateBossHealth(data.boss.health, data.boss.maxHealth);
  });

  socket.on('bossStateChanged', (data) => {
    if (gameState.boss) {
      gameState.boss.state = data.state;
      // You can add visual effects based on state here
    }
  });

  socket.on('bossPositionUpdated', (data) => {
    if (gameState.bossMesh) {
      // Smoothly update boss position
      gameState.bossMesh.position.set(
        data.position.x,
        data.position.y,
        data.position.z
      );
      gameState.bossMesh.rotation.set(
        data.rotation._x || 0,
        data.rotation._y || data.rotation.y || 0,
        data.rotation._z || 0
      );
    }
  });

  socket.on('bossHit', (data) => {
    console.log('Boss hit:', data);
    if (gameState.boss) {
      gameState.boss.health = data.health;
      gameState.boss.maxHealth = data.maxHealth;
      window.gameUI.updateBossHealth(data.health, data.maxHealth);

      // Add hit effect
      if (gameState.bossMesh) {
        // Flash the boss red
        const materials = [];
        gameState.bossMesh.traverse((child) => {
          if (child.material) {
            materials.push(child.material);
          }
        });

        // Flash all materials red
        materials.forEach(material => {
          const originalColor = material.color.clone();
          material.color.setHex(0xff0000);
          setTimeout(() => {
            material.color.copy(originalColor);
          }, 100);
        });
      }
    }
  });

  socket.on('bossDefeated', () => {
    console.log('Boss defeated');
    if (gameState.bossMesh) {
      // Add defeat animation/effect
      scene.remove(gameState.bossMesh);
      gameState.bossMesh = null;
    }
    gameState.boss = null;
    window.gameUI.updateBossHealth(0, 100);
  });

  socket.on('projectileFired', (data) => {
    console.log('Received projectileFired event:', data);

    const projectile = new Projectile(
      data.type,
      new THREE.Vector3(data.position.x, data.position.y, data.position.z),
      new THREE.Vector3(data.direction.x, data.direction.y, data.direction.z),
      gameState.players.get(data.playerId)
    );

    console.log('Created projectile:', projectile);

    scene.add(projectile.mesh);
    gameState.projectiles.push(projectile);
  });
}

// Add these helper functions
function addPlayer(playerData, scene, gameState) {
  // Create new vehicle for player
  const vehicle = new Vehicle(playerData.vehicle);

  // Set position if provided
  if (playerData.position) {
    vehicle.mesh.position.set(
      playerData.position.x,
      playerData.position.y,
      playerData.position.z
    );
  }

  // Set rotation if provided
  if (playerData.rotation) {
    vehicle.mesh.rotation.set(
      playerData.rotation._x || 0,
      playerData.rotation._y || playerData.rotation.y || 0,
      playerData.rotation._z || 0
    );
  }

  // Create player object
  const player = {
    id: playerData.id,
    username: playerData.username,
    vehicle: vehicle,
    isLocal: false
  };

  // Add to scene and game state
  scene.add(vehicle.mesh);
  gameState.players.set(player.id, player);
}

function removePlayer(playerId, scene, gameState) {
  const player = gameState.players.get(playerId);
  if (player) {
    scene.remove(player.vehicle.mesh);
    gameState.players.delete(playerId);
  }
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
  if (gameState.localPlayer && gameState.localPlayer.vehicle) {
    // Update vehicle
    gameState.localPlayer.vehicle.update(delta, gameState.map, gameState);

    // Send position updates to server
    socket.emit('updatePosition', {
      position: {
        x: gameState.localPlayer.vehicle.mesh.position.x,
        y: gameState.localPlayer.vehicle.mesh.position.y,
        z: gameState.localPlayer.vehicle.mesh.position.z
      },
      rotation: {
        _x: gameState.localPlayer.vehicle.mesh.rotation.x,
        _y: gameState.localPlayer.vehicle.mesh.rotation.y,
        _z: gameState.localPlayer.vehicle.mesh.rotation.z
      }
    });

    // Update camera
    updateCameraPosition();
  }

  // Update other players
  for (const [id, player] of gameState.players) {
    if (id !== socket.id && player.vehicle) {
      player.vehicle.update(delta, gameState.map, gameState);
    }
  }

  // Update pickups
  updatePickups(delta, time);

  // Check for pickup collisions
  if (gameState.localPlayer && gameState.localPlayer.vehicle) {
    const vehicle = gameState.localPlayer.vehicle;
    gameState.pickups.forEach(pickup => {
      if (vehicle.collisionBox.intersectsBox(new THREE.Box3().setFromObject(pickup.mesh))) {
        // Emit pickup collection
        socket.emit('collectPickup', {
          pickupId: pickup.id,
          type: pickup.type
        });
      }
    });
  }

  // Update projectiles
  gameState.projectiles = gameState.projectiles.filter(projectile => {
    // Update projectile position
    const alive = projectile.update(delta, gameState.boss);

    // Check for boss collision
    if (gameState.boss && gameState.bossMesh) {
      const bossBox = new THREE.Box3().setFromObject(gameState.bossMesh);
      const projectileBox = new THREE.Box3().setFromObject(projectile.mesh);

      if (projectileBox.intersectsBox(bossBox)) {
        // Handle hit
        if (projectile.isFreezeMissile) {
          socket.emit('bossFreeze');
        } else {
          socket.emit('bossHit', {
            damage: projectile.damage,
            projectileType: projectile.type
          });
        }

        // Remove projectile
        scene.remove(projectile.mesh);
        return false;
      }
    }

    // Remove if lifetime expired
    if (!alive) {
      scene.remove(projectile.mesh);
      return false;
    }

    return true;
  });

  // Fire weapons if active
  if (gameState.localPlayer && gameState.localPlayer.vehicle) {
    if (gameState.localPlayer.vehicle.controls.fire) {
      const projectile = gameState.localPlayer.vehicle.fireWeapon(scene, gameState.boss);
      if (projectile) {
        gameState.projectiles.push(projectile);
      }
    }
  }
}

// Update camera to follow player
function updateCameraPosition() {
  if (!gameState.localPlayer || !gameState.localPlayer.vehicle) return;

  // Use the updateCamera function from Renderer.js
  const target = gameState.localPlayer.vehicle.mesh;
  const delta = 1 / 60; // Approximate delta if not available

  updateCamera(camera, target, delta);
}

// Check for portal collisions
function checkPortalCollisions() {
  // Implement portal collision detection
}

// Update pickups
function updatePickups(delta, time) {
  gameState.pickups.forEach(pickup => {
    if (pickup && pickup.mesh) {
      // Floating animation
      pickup.mesh.position.y = pickup.position.y +
        Math.sin(time * 0.002 + pickup.mesh.userData.floatOffset) * 0.3;

      // Rotation
      pickup.mesh.rotation.y += 0.02;
    }
  });
}

function createPickup(pickupData) {
  const pickup = {
    id: pickupData.id,
    type: pickupData.type,
    position: new THREE.Vector3(
      pickupData.position.x,
      pickupData.position.y,
      pickupData.position.z
    ),
    mesh: createPickupMesh(pickupData.type)
  };

  pickup.mesh.position.copy(pickup.position);
  scene.add(pickup.mesh);
  gameState.pickups.push(pickup);
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