import * as THREE from 'three';
import { io } from 'socket.io-client';
import { setupVehicleSelection, cleanupVehicleSelection } from './components/VehicleSelection';
import { createRenderer, createScene, createCamera, updateCamera } from './game/core/Renderer';
import { initializeGameState } from './game/core/GameState';
import { setupPortals } from './game/map/Portal';
import { checkForPortalParameters, shouldAutoStart } from './utils/UrlUtils';
import { createAerialCamera, updateAerialCamera } from './game/core/AerialCamera';
import { initializeRespawn, startRespawn, updateRespawn, createRespawnUI } from './game/core/Respawn';
import { createMap } from './game/map/Map';
import { Vehicle } from './game/vehicles/Vehicle';
import { createVehicleMesh } from './game/vehicles/VehicleMeshFactory';
import { createPickupMesh } from './game/pickups/PickupMeshFactory';
import { EasterEggPickup } from './game/pickups/EasterEggPickup';
import { GameUI } from './game/ui/GameUI';
import { createBossMesh, createBossInstance } from './game/boss/BossMeshFactory';
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
  projectiles: [],
  // Boss respawn settings
  bossRespawnTimer: null,
  bossRespawning: false,
  gracePeriodDuration: 30, // 30 seconds grace period
  respawnWarningDuration: 5,  // 5 seconds warning
  deathCount: 0
};

// Make gameState globally available
window.gameState = gameState;

// Socket configuration
const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';
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

  // ADD EASTER EGG PICKUP INITIALIZATION HERE TOO
  if (!gameState.easterEggPickup) {
      const eggPosition = new THREE.Vector3(0, 1.0, -212.5); //Behind capitol building
      gameState.easterEggPickup = new EasterEggPickup(scene, eggPosition);
      gameState.easterEggPickup.spawn();
      console.log("Easter Egg Pickup created and spawned during normal init.");
  }

  // Check for portal parameters
  const portalParams = checkForPortalParameters();

  // If coming from a portal, skip vehicle selection and start immediately
  if (portalParams && portalParams.portal) {
    // Auto-select vehicle and start game
    const vehicleType = portalParams.vehicle || 'roadkill';
    const playerName = portalParams.username || 'Portal Player';
    
    // Hide vehicle selection UI immediately
    document.getElementById('vehicle-selection').style.display = 'none';
    
    // Start game with portal parameters
    startGameWithPortalParams(vehicleType, playerName, portalParams);
  } else {
    // Show vehicle selection UI
    setupVehicleSelection(selectVehicleAndJoinGame, portalParams);
  }

  // Handle window resize
  window.addEventListener('resize', onWindowResize);

  // Start animation loop immediately for instant loading experience
  animate(0);
}

// Function to start game directly from portal parameters
function startGameWithPortalParams(vehicleType, playerName, portalParams) {
  // Clean up WebGL resources from vehicle selection
  cleanupVehicleSelection();

  // Set game to running
  gameState.running = true;
  gameState.useAerialCamera = false;

  // Reset death counter explicitly
  if (typeof gameState.deathCount !== 'number') {
    gameState.deathCount = 0;
  }
  
  // Initialize game with selected vehicle and portal parameters
  initializeGameWithPortal(scene, vehicleType, playerName, socket, gameState, portalParams);
  
  // Ensure respawn system is initialized
  initializeRespawn(gameState);

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
      // Only call startRespawn if not already respawning
      if (!gameState.respawn || !gameState.respawn.active) {
        originalHandleDeath.call(this);

        // Trigger respawn and switch to aerial view
        gameState.useAerialCamera = true;
        startRespawn(gameState);
        
        console.log('Started respawn after death');
      } else {
        console.log('Ignoring duplicate death call - respawn already active');
      }
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
    vehicle: vehicleType,
    fromPortal: true
  });
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

  // Reset death counter explicitly
  if (typeof gameState.deathCount !== 'number') {
    gameState.deathCount = 0;
  }
  
  // Initialize game with selected vehicle
  initializeGameState(scene, vehicleType, playerName, socket, gameState);
  
  // Ensure respawn system is initialized
  initializeRespawn(gameState);

  // ADD EASTER EGG PICKUP INITIALIZATION HERE TOO
  if (!gameState.easterEggPickup) {
      const eggPosition = new THREE.Vector3(0, 0.5, 0); // Center of the map
      gameState.easterEggPickup = new EasterEggPickup(scene, eggPosition);
      gameState.easterEggPickup.spawn();
      console.log("Easter Egg Pickup created and spawned during normal init.");
  }

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
      // Only call startRespawn if not already respawning
      if (!gameState.respawn || !gameState.respawn.active) {
        originalHandleDeath.call(this);

        // Trigger respawn and switch to aerial view
        gameState.useAerialCamera = true;
        startRespawn(gameState);
        
        console.log('Started respawn after death');
      } else {
        console.log('Ignoring duplicate death call - respawn already active');
      }
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

// Initialize game state with portal parameters
function initializeGameWithPortal(scene, vehicleType, playerName, socket, gameState, portalParams) {
  // Create the map if it doesn't exist already
  if (!gameState.map) {
    gameState.map = createMap(scene);
  }

  // Create local player vehicle with scene reference
  const localPlayer = {
    id: socket.id || 'local-player',
    username: playerName || 'Player',
    vehicle: new Vehicle(vehicleType, { scene: scene }),
    isLocal: true,
    color: portalParams.color || 'blue'
  };

  // Apply portal parameters to vehicle
  if (portalParams) {
    // Apply speed if provided
    if (portalParams.speed) {
      localPlayer.vehicle.speed = parseFloat(portalParams.speed);
    }
    
    // Apply velocity if provided
    if (portalParams.speed_x !== undefined || 
        portalParams.speed_y !== undefined || 
        portalParams.speed_z !== undefined) {
      localPlayer.vehicle.velocity = {
        x: parseFloat(portalParams.speed_x || 0),
        y: parseFloat(portalParams.speed_y || 0),
        z: parseFloat(portalParams.speed_z || 0)
      };
    }
    
    // Apply rotation if provided
    if (portalParams.rotation_x !== undefined ||
        portalParams.rotation_y !== undefined ||
        portalParams.rotation_z !== undefined) {
      localPlayer.vehicle.mesh.rotation.x = parseFloat(portalParams.rotation_x || 0);
      localPlayer.vehicle.mesh.rotation.y = parseFloat(portalParams.rotation_y || 0);
      localPlayer.vehicle.mesh.rotation.z = parseFloat(portalParams.rotation_z || 0);
    }
    
    // Store other portal parameters
    if (portalParams.avatar_url) {
      localPlayer.avatar_url = portalParams.avatar_url;
    }
    
    if (portalParams.team) {
      localPlayer.team = portalParams.team;
    }
  }

  // Position at entry portal instead of spawn point
  const entryPortalPosition = new THREE.Vector3(0, 0, -gameState.map.getDimensions().length/3);
  localPlayer.vehicle.mesh.position.copy(entryPortalPosition);
  localPlayer.vehicle.mesh.rotation.y = Math.PI; // Face south

  // Add to scene
  scene.add(localPlayer.vehicle.mesh);

  // Set in game state
  gameState.localPlayer = localPlayer;

  // Setup controls
  setupControls(localPlayer.vehicle);

  // Initialize players map with local player
  gameState.players.set(localPlayer.id, localPlayer);

  // Create boss
  createBoss(scene, gameState);
  
  // Create and spawn the Easter Egg pickup if it doesn't exist
  if (!gameState.easterEggPickup) {
      const eggPosition = new THREE.Vector3(0, 0.5, 0); // Center of the map
      gameState.easterEggPickup = new EasterEggPickup(scene, eggPosition);
      gameState.easterEggPickup.spawn(); // Spawn it immediately
      // Add it to the main pickups array for update loop, but mark it
      // gameState.pickups.push(gameState.easterEggPickup); // Add this later in update logic perhaps? Or handle separately. Let's handle separately for now.
      console.log("Easter Egg Pickup created and spawned.");
  }

  return gameState;
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
      
      // Create a new boss instance if we don't have one
      if (!gameState.boss || !gameState.boss.takeDamage) {
        createBoss(scene, gameState);
      }
      
      // Update boss properties from server data
      if (gameState.boss) {
        gameState.boss.health = state.boss.health;
        gameState.boss.maxHealth = state.boss.maxHealth;
        gameState.boss.state = state.boss.state;
        
        // Update position if provided
        if (state.boss.position) {
          gameState.boss.mesh.position.set(
            state.boss.position.x,
            state.boss.position.y,
            state.boss.position.z
          );
        }
        
        // Update rotation if provided
        if (state.boss.rotation) {
          gameState.boss.mesh.rotation.set(
            state.boss.rotation._x || 0,
            state.boss.rotation._y || state.boss.rotation.y || 0,
            state.boss.rotation._z || 0
          );
        }
        
        // Update UI
        window.gameUI.updateBossHealth(state.boss.health, state.boss.maxHealth);
      }
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

    // Find the pickup by ID (excluding the local Easter Egg pickup)
    const pickupIndex = gameState.pickups.findIndex(p => p.id === data.id);
    if (pickupIndex !== -1) {
        const pickup = gameState.pickups[pickupIndex];
        scene.remove(pickup.mesh);
        gameState.pickups.splice(pickupIndex, 1); // Remove from array

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
    } else {
        console.warn(`Could not find pickup with ID ${data.id} to remove.`);
    }
  });

  socket.on('bossSpawned', (data) => {
    console.log('Boss spawned:', data);
    
    // If we already have a local boss instance, just update its properties
    if (gameState.boss && gameState.boss.takeDamage) {
      // Update properties from server data
      gameState.boss.health = data.boss.health;
      gameState.boss.maxHealth = data.boss.maxHealth;
      gameState.boss.state = data.boss.state;
      gameState.boss.level = data.boss.level; // Store the level
      
      // Update position and rotation
      if (data.boss.position) {
        gameState.boss.mesh.position.set(
          data.boss.position.x,
          data.boss.position.y,
          data.boss.position.z
        );
      }
      
      if (data.boss.rotation) {
        gameState.boss.mesh.rotation.set(
          data.boss.rotation._x || 0,
          data.boss.rotation._y || data.boss.rotation.y || 0,
          data.boss.rotation._z || 0
        );
      }
    } else {
      // Create a new boss instance if we don't have one
      createBoss(scene, gameState);
      
      // Update the new instance with server data
      if (gameState.boss) {
        gameState.boss.health = data.boss.health;
        gameState.boss.maxHealth = data.boss.maxHealth;
        gameState.boss.state = data.boss.state;
        gameState.boss.level = data.boss.level; // Store the level
        
        // Set initial position
        if (data.boss.position) {
          gameState.boss.mesh.position.set(
            data.boss.position.x,
            data.boss.position.y,
            data.boss.position.z
          );
        }
        
        // Set initial rotation
        if (data.boss.rotation) {
          gameState.boss.mesh.rotation.set(
            data.boss.rotation._x || 0,
            data.boss.rotation._y || data.boss.rotation.y || 0,
            data.boss.rotation._z || 0
          );
        }
      }
    }

    // Update UI with boss health and level
    window.gameUI.updateBossHealth(
      data.boss.health, 
      data.boss.maxHealth,
      data.boss.level
    );
  });

  socket.on('bossStateChanged', (data) => {
    if (gameState.boss) {
      gameState.boss.state = data.state;
      // You can add visual effects based on state here
    }
  });

  socket.on('bossPositionUpdated', (data) => {
    if (gameState.boss && gameState.boss.mesh) {
      // Smoothly update boss position
      // Use lerp for smoother movement
      const targetPosition = new THREE.Vector3(
        data.position.x,
        data.position.y || 0.2,
        data.position.z
      );
      
      // Use lerp to smooth the movement (avoid teleporting)
      gameState.boss.mesh.position.lerp(targetPosition, 0.1);
      
      // Get the target rotation
      const targetRotation = {
        x: data.rotation._x || 0,
        y: data.rotation._y || data.rotation.y || 0,
        z: data.rotation._z || 0
      };
      
      // Smooth rotation by lerping each component
      gameState.boss.mesh.rotation.x += (targetRotation.x - gameState.boss.mesh.rotation.x) * 0.1;
      gameState.boss.mesh.rotation.y += (targetRotation.y - gameState.boss.mesh.rotation.y) * 0.1;
      gameState.boss.mesh.rotation.z += (targetRotation.z - gameState.boss.mesh.rotation.z) * 0.1;
    }
  });

  socket.on('bossHit', (data) => {
    console.log('Server reported boss hit:', data);
    if (gameState.boss) {
      // Always update with server's health values for consistency
      gameState.boss.health = data.health;
      gameState.boss.maxHealth = data.maxHealth;
      
      // Always update UI with server values for consistency
      window.gameUI.updateBossHealth(
        data.health, 
        data.maxHealth,
        gameState.boss.level // Pass the stored level
      );

      // Add hit effect
      if (gameState.boss.mesh) {
        // Flash the boss red
        const materials = [];
        gameState.boss.mesh.traverse((child) => {
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

  socket.on('bossDefeated', (data) => {
    console.log('Server reported boss defeated by player:', data?.killerId);
    
    // Only play the death animation if we still have a boss reference
    if (gameState.boss && gameState.boss.mesh) {
      console.log('Playing boss death animation');
      // Play death animation
      createBossDeathAnimation(gameState.boss.mesh, scene);
    }
    
    // Clear boss references
    gameState.boss = null;
    gameState.bossMesh = null;
    
    // Update UI - pass undefined for level since boss is defeated
    window.gameUI.updateBossHealth(0, 100, undefined);
    
    // Start the client-side respawn notification timer sequence
    startBossRespawnTimer(); 
    
    // Local clients don't need to start respawn timer - the server will handle this
    // and send a bossRespawned event when ready
    console.log('Waiting for server to respawn boss...');
  });

  socket.on('projectileFired', (data) => {
    console.log('Received projectileFired event:', data);

    let owner = null;
    
    // Check if this is the local player's projectile
    if (data.playerId === socket.id && gameState.localPlayer) {
      // Use local player's vehicle directly for better first-person view
      owner = gameState.localPlayer.vehicle;
    } else {
      // Get the other player's vehicle from the player ID
      const player = gameState.players.get(data.playerId);
      owner = player ? player.vehicle : null;
    }
    
    // Create the projectile with the appropriate vehicle as the owner
    const projectile = new Projectile(
      data.type,
      new THREE.Vector3(data.position.x, data.position.y, data.position.z),
      new THREE.Vector3(data.direction.x, data.direction.y, data.direction.z),
      owner
    );

    console.log('Created projectile:', projectile);

    scene.add(projectile.mesh);
    gameState.projectiles.push(projectile);
  });

  socket.on('bossRespawned', (data) => {
    console.log('Boss respawned:', data);
    
    // If we already have a local boss instance, just update its properties
    if (gameState.boss && gameState.boss.takeDamage) {
      // Update properties from server data
      gameState.boss.health = data.boss.health;
      gameState.boss.maxHealth = data.boss.maxHealth;
      gameState.boss.state = data.boss.state;
      gameState.boss.level = data.boss.level; // Store the level
      
      // Update position and rotation
      if (data.boss.position) {
        gameState.boss.mesh.position.set(
          data.boss.position.x,
          data.boss.position.y,
          data.boss.position.z
        );
      }
      
      if (data.boss.rotation) {
        gameState.boss.mesh.rotation.set(
          data.boss.rotation._x || 0,
          data.boss.rotation._y || data.boss.rotation.y || 0,
          data.boss.rotation._z || 0
        );
      }
    } else {
      // Create a new boss instance if we don't have one
      createBoss(scene, gameState);
      
      // Update the new instance with server data
      if (gameState.boss) {
        gameState.boss.health = data.boss.health;
        gameState.boss.maxHealth = data.boss.maxHealth;
        gameState.boss.state = data.boss.state;
        gameState.boss.level = data.boss.level; // Store the level
        
        // Set initial position
        if (data.boss.position) {
          gameState.boss.mesh.position.set(
            data.boss.position.x,
            data.boss.position.y,
            data.boss.position.z
          );
        }
        
        // Set initial rotation
        if (data.boss.rotation) {
          gameState.boss.mesh.rotation.set(
            data.boss.rotation._x || 0,
            data.boss.rotation._y || data.boss.rotation.y || 0,
            data.boss.rotation._z || 0
          );
        }
      }
    }

    // Update UI with boss health and level
    window.gameUI.updateBossHealth(
      data.boss.health, 
      data.boss.maxHealth,
      data.boss.level
    );
    
    // Hide the respawn notification now that the boss is back
    window.gameUI.hideRespawnNotification();
  });

  // Handle Easter Egg state from server on initial connection
  socket.on('easterEggState', (state) => {
    console.log('Received Easter Egg state:', state);
    
    // Initialize Easter Egg if it doesn't exist yet
    if (!gameState.easterEggPickup) {
      const eggPosition = new THREE.Vector3(0, 0.5, 0);
      gameState.easterEggPickup = new EasterEggPickup(scene, eggPosition);
    }
    
    // Set active state based on server
    if (state.active) {
      gameState.easterEggPickup.spawn();
    } else {
      // It's inactive on the server, so hide it locally
      gameState.easterEggPickup.isActive = false;
      gameState.easterEggPickup.mesh.visible = false;
    }
  });
  
  // Handle Easter Egg collected by another player
  socket.on('easterEggCollected', (data) => {
    console.log('Easter Egg collected by player:', data.playerId);
    
    // If we have the Easter Egg locally, hide it
    if (gameState.easterEggPickup) {
      gameState.easterEggPickup.isActive = false;
      gameState.easterEggPickup.mesh.visible = false;
      
      // Cancel any existing respawn timer to sync with server
      if (gameState.easterEggPickup.respawnTimer) {
        clearTimeout(gameState.easterEggPickup.respawnTimer);
        gameState.easterEggPickup.respawnTimer = null;
      }
    }
  });
  
  // Handle Easter Egg respawn event from server
  socket.on('easterEggRespawned', () => {
    console.log('Easter Egg respawned');
    
    // Spawn the Easter Egg if we have it locally
    if (gameState.easterEggPickup) {
      gameState.easterEggPickup.spawn();
    }
  });

  // Handler for remote player transformation
  socket.on('playerTransformed', (data) => {
      console.log('Player transformed event received:', data);
      if (data.playerId !== socket.id) {
          const player = gameState.players.get(data.playerId);
          if (player && player.vehicle) {
              console.log(`Transforming remote player ${player.id} to ${data.newVehicleType}`);
              const vehicle = player.vehicle;
              
              // Store old position/rotation before removing mesh
              const oldPosition = vehicle.mesh.position.clone();
              const oldRotation = vehicle.mesh.rotation.clone();

              // Remove old mesh
              scene.remove(vehicle.mesh);
              
              // Create and assign new mesh
              const newMesh = createVehicleMesh(data.newVehicleType);
              newMesh.position.copy(oldPosition);
              newMesh.rotation.copy(oldRotation);
              
              vehicle.mesh = newMesh;
              vehicle.type = data.newVehicleType; // Update type
              vehicle.collisionBox.setFromObject(vehicle.mesh); // Update collision box

              // Add new mesh to scene
              scene.add(vehicle.mesh);
              
              // Re-create name label and health bar for the remote player on the new mesh
              vehicle.setPlayerName(vehicle.playerName); 
              
              // Note: Remote player stats/weapons are not managed client-side beyond visual representation
          }
      }
  });
}

// Add these helper functions
function addPlayer(playerData, scene, gameState) {
  // Create new vehicle for player
  const vehicle = new Vehicle(playerData.vehicle);

  // Set player name on the vehicle
  vehicle.setPlayerName(playerData.username || 'Player');

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
    // Remove player's name label if it exists
    if (player.vehicle && player.vehicle.nameLabel) {
      scene.remove(player.vehicle.nameLabel);
    }
    scene.remove(player.vehicle.mesh);
    gameState.players.delete(playerId);
  }
}

// Animation loop
function animate(time) {
  requestAnimationFrame(animate);
  
  const delta = Math.min((time - gameState.lastTime) / 1000, 0.1);
  gameState.lastTime = time;
  
  // Update game logic if the game is running
  if (gameState.running) {
    updateGame(delta, time);
    
    // Update portals if available
    if (gameState.portals) {
      gameState.portals.update(delta, time);
      
      // Check for portal collisions
      checkPortalCollisions();
    }
    
    // Update respawn logic
    updateRespawn(gameState, scene);
  }
  
  // Always update aerial camera when in aerial view mode
  // This ensures the aerial view is visible in the background during vehicle selection
  if (gameState.useAerialCamera) {
    updateAerialCamera(aerialCamera, delta);
    renderer.render(scene, aerialCamera);
  } else {
    renderer.render(scene, camera);
  }
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

  // DIRECT BOSS UPDATE - Ensure the boss gets updated with all players
  if (gameState.boss && gameState.boss.update) {
    // Create array of all players (including local player)
    const allPlayers = [];
    
    // Add local player if it exists
    if (gameState.localPlayer) {
      allPlayers.push(gameState.localPlayer);
    }
    
    // Add all other players
    gameState.players.forEach(player => {
      if (player.id !== gameState.localPlayer?.id) {
        allPlayers.push(player);
      }
    });
    
    // Log the players we're sending to the boss
    console.log(`Updating boss with ${allPlayers.length} players`);
    
    // Call the boss's update method with the player array
    gameState.boss.update(allPlayers, delta, time);
  }

  // Check for boss-vehicle collisions
  if (gameState.boss && gameState.boss.mesh) {
    // Create boss bounding box
    const bossBox = new THREE.Box3().setFromObject(gameState.boss.mesh);
    
    // Check collision with local player
    if (gameState.localPlayer && gameState.localPlayer.vehicle) {
      const vehicle = gameState.localPlayer.vehicle;
      checkAndResolveBossCollision(bossBox, vehicle);
    }
    
    // Check collisions with other players
    for (const [id, player] of gameState.players) {
      if (player.vehicle) {
        checkAndResolveBossCollision(bossBox, player.vehicle);
      }
    }
  }

  // Update Easter Egg Pickup if it exists
  if (gameState.easterEggPickup) {
    gameState.easterEggPickup.update(delta);
  }

  // Check for pickup collisions (including Easter Egg)
  if (gameState.localPlayer && gameState.localPlayer.vehicle) {
    const vehicle = gameState.localPlayer.vehicle;
    const vehicleBox = vehicle.collisionBox; // Use existing collision box

    // Check Easter Egg collision separately
    if (gameState.easterEggPickup && gameState.easterEggPickup.isActive) {
        if (vehicleBox.intersectsBox(gameState.easterEggPickup.boundingBox)) {
            console.log('Player collided with Easter Egg!');
            // Collect the pickup
            const collected = gameState.easterEggPickup.collect(vehicle);

            if (collected) {
                console.log('Transforming player vehicle to Sweet Tooth');
                
                // Notify server that Easter Egg was collected (to sync with other clients)
                socket.emit('collectEasterEgg');
                
                // --- Vehicle Transformation Logic ---
                const oldPosition = vehicle.mesh.position.clone();
                const oldRotation = vehicle.mesh.rotation.clone();
                
                // Remove old mesh
                scene.remove(vehicle.mesh);
                // Dispose old geometry/material if needed (optional for now)

                // Create new mesh
                const newMesh = createVehicleMesh('sweetTooth'); // Use the factory
                newMesh.position.copy(oldPosition);
                newMesh.rotation.copy(oldRotation);

                // Assign new mesh and update properties
                vehicle.mesh = newMesh;
                vehicle.type = 'sweetTooth'; // Update vehicle type property
                vehicle.collisionBox.setFromObject(vehicle.mesh); // Update collision box

                // Add new mesh to scene
                scene.add(vehicle.mesh);
                
                // Re-create and attach the name label and health bar to the new mesh
                vehicle.setPlayerName(vehicle.playerName);

                // TODO: Update vehicle stats based on Sweet Tooth config?
                // For now, only mesh/type change as requested.
                
                // Notify the server about the transformation, which will broadcast to other players
                socket.emit('playerTransformed', {
                    playerId: socket.id,
                    newVehicleType: 'sweetTooth'
                });
                
                console.log("Emitted playerTransformed event to server");
            }
        }
    }

    // Check regular pickups (server-synced)
    gameState.pickups.forEach((pickup, index) => {
      if (pickup && pickup.mesh) {
        // Create a box for pickup collision detection
        const pickupBox = new THREE.Box3().setFromObject(pickup.mesh);
        
        if (vehicle.collisionBox.intersectsBox(pickupBox)) {
          console.log('Player collected pickup:', pickup);
          
          // Handle locally spawned pickups from boss death
          if (pickup.isBossPickup) {
            // Remove from scene immediately
            scene.remove(pickup.mesh);
            
            // Remove from game state array
            gameState.pickups.splice(index, 1);
            
            // Apply effect to player
            vehicle.handlePickupCollection(pickup.type);
            
            // Update UI
            window.gameUI.updateWeaponSystem(
              vehicle.weapons,
              vehicle.currentWeapon,
              vehicle.weaponAmmo
            );
          } else {
            // Server-synced pickups - notify server
            socket.emit('collectPickup', {
              pickupId: pickup.id,
              type: pickup.type
            });
          }
        }
      }
    });
  }

  // Update projectiles
  gameState.projectiles = gameState.projectiles.filter(projectile => {
    // Update projectile position
    const alive = projectile.update(delta, gameState.boss);

    // Check for boss collision
    if (gameState.boss && gameState.boss.mesh) {
      const bossBox = new THREE.Box3().setFromObject(gameState.boss.mesh);
      const projectileBox = new THREE.Box3().setFromObject(projectile.mesh);

      if (projectileBox.intersectsBox(bossBox)) {
        console.log('Projectile hit boss!', projectile.type, projectile.damage);
        // Handle hit
        if (projectile.isFreezeMissile) {
          socket.emit('bossFreeze');
        } else {
          // Apply damage locally for immediate feedback
          if (gameState.boss.takeDamage) {
            console.log('Before damage - Boss health:', gameState.boss.health);
            // Apply local damage for visual feedback, but let server decide if boss is actually defeated
            gameState.boss.takeDamage(projectile.damage, projectile.owner, false); // Don't trigger death locally
            console.log('After damage - Boss health:', gameState.boss.health);
            
            // Update the UI health bar
            window.gameUI.updateBossHealth(gameState.boss.health, gameState.boss.maxHealth);
          } else {
            console.error('Boss has no takeDamage method!', gameState.boss);
          }
          
          // ALWAYS send to server for multiplayer sync
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
  if (gameState.portals && gameState.localPlayer && gameState.localPlayer.vehicle) {
    gameState.portals.checkCollisions(gameState.localPlayer);
  }
}

// Update pickups
function updatePickups(delta, time) {
  gameState.pickups.forEach(pickup => {
    if (pickup && pickup.mesh) {
      if (pickup.isFlying) {
        // Apply physics to flying pickups
        pickup.velocity.y -= 0.01; // Gravity
        
        // Move based on velocity
        pickup.mesh.position.x += pickup.velocity.x;
        pickup.mesh.position.y += pickup.velocity.y;
        pickup.mesh.position.z += pickup.velocity.z;
        
        // Update position for collision detection
        pickup.position.copy(pickup.mesh.position);
        
        // Check if landed (y velocity near zero and close to ground)
        if (pickup.mesh.position.y < 1.2) {
          // Force landing when close to ground
          pickup.isFlying = false;
          pickup.velocity.set(0, 0, 0);
          pickup.mesh.position.y = 1; // Set to ground level
          pickup.position.y = 1;
          
          // Make sure the pickup has a float offset for the hovering animation
          if (!pickup.mesh.userData.floatOffset) {
            pickup.mesh.userData.floatOffset = Math.random() * Math.PI * 2;
          }
          
          console.log(`Pickup ${pickup.id} of type ${pickup.type} has landed and is ready for collection`);
        }
        
        // Add spin while flying
        pickup.mesh.rotation.x += 0.05;
        pickup.mesh.rotation.y += 0.1;
      } else {
        // Regular floating animation for landed pickups
        pickup.mesh.position.y = pickup.position.y +
          Math.sin(time * 0.002 + pickup.mesh.userData.floatOffset) * 0.3;
        
        // Regular rotation
        pickup.mesh.rotation.y += 0.02;
      }
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

/**
 * Check and resolve collision between the boss and a vehicle
 * @param {THREE.Box3} bossBox The boss's bounding box
 * @param {Object} vehicle The vehicle to check collision with
 */
function checkAndResolveBossCollision(bossBox, vehicle) {
  // Check if bounding boxes intersect
  if (bossBox.intersectsBox(vehicle.collisionBox)) {
    const bossPos = gameState.boss.mesh.position;
    const vehiclePos = vehicle.mesh.position;

    // Calculate a horizontal-only collision normal (ignore Y component)
    const horizontalNormal = new THREE.Vector3(
      vehiclePos.x - bossPos.x,
      0, // Force Y component to be zero
      vehiclePos.z - bossPos.z
    ).normalize();

    // Calculate penetration depth with collision radius
    const bossSize = new THREE.Vector3();
    const vehicleSize = new THREE.Vector3();
    bossBox.getSize(bossSize);
    vehicle.collisionBox.getSize(vehicleSize);

    // Use collision radius (30% of sizes, matching vehicle collision)
    const bossRadius = Math.max(bossSize.x, bossSize.z) * 0.3;
    const vehicleRadius = Math.max(vehicleSize.x, vehicleSize.z) * 0.3;
    
    // Calculate horizontal distance (XZ plane only)
    const horizontalDistance = Math.sqrt(
      Math.pow(vehiclePos.x - bossPos.x, 2) + 
      Math.pow(vehiclePos.z - bossPos.z, 2)
    );
    
    const penetration = (bossRadius + vehicleRadius) - horizontalDistance;

    // Minimum penetration threshold
    if (penetration > 0.2) {
      // Boss should be much heavier than vehicles
      const bossMass = 4; // Much heavier than regular vehicles
      const vehicleMass = 1 + (vehicle.armor * 0.2);
      const totalMass = bossMass + vehicleMass;
      const bossRatio = bossMass / totalMass;
      const vehicleRatio = vehicleMass / totalMass;

      // Separation - boss should push vehicles more than it gets pushed
      const pushBack = horizontalNormal.clone().multiplyScalar(penetration * 0.3);
      
      // Store original Y position
      const originalY = vehicle.mesh.position.y;
      
      // Apply horizontal pushback - only modify X and Z components
      vehicle.mesh.position.x += pushBack.x * bossRatio;
      vehicle.mesh.position.z += pushBack.z * bossRatio;
      
      // Ensure Y position is maintained
      vehicle.mesh.position.y = originalY;

      // Calculate relative velocity for horizontal plane only
      const horizontalVelocity = new THREE.Vector3(
        vehicle.velocity.x,
        0, // Ignore Y component
        vehicle.velocity.z
      );
      
      const velocityAlongNormal = horizontalVelocity.dot(horizontalNormal);

      // Only resolve if objects are moving toward each other
      if (velocityAlongNormal < 0) {
        // Low bounce coefficient
        const restitution = 0.05;

        // Calculate impulse scalar
        const impulseScalar = -(1 + restitution) * velocityAlongNormal;

        // Reduced impulse effect for gameplay
        const impulse = horizontalNormal.clone().multiplyScalar(impulseScalar * 0.5);

        // Apply velocity changes only to X and Z components
        vehicle.velocity.x += impulse.x * bossRatio;
        vehicle.velocity.z += impulse.z * bossRatio;
        // Y velocity must be zeroed to prevent any vertical movement
        vehicle.velocity.y = 0;

        // Strong friction for vehicle during collision
        vehicle.velocity.x *= 0.6;
        vehicle.velocity.z *= 0.6;
        // Don't apply friction to Y component
      }

      // Apply damage to vehicle on collision
      const now = Date.now();
      const cooldown = 1000; // 1 second between collision damage
      
      if (!vehicle.lastBossCollisionDamage || now - vehicle.lastBossCollisionDamage > cooldown) {
        // Calculate damage based on boss's damage stat
        const damage = gameState.boss ? (gameState.boss.damage || 10) : 10;
        const isEnraged = gameState.boss && gameState.boss.state === 'enraged';
        // Increased damage multiplier from 1.0 to 2.0 for normal state, and from 1.5 to 3.0 for enraged state
        const finalDamage = damage * (isEnraged ? 3.0 : 2.0);
        
        vehicle.takeDamage(finalDamage);
        
        // Update collision damage timestamp
        vehicle.lastBossCollisionDamage = now;
      }
    }
  }
}

/**
 * Create the boss entity and attach it to the gameState
 * @param {THREE.Scene} scene The Three.js scene
 * @param {Object} gameState Reference to the game state object
 */
function createBoss(scene, gameState) {
  // Make sure we have a scene reference
  if (!scene) {
    console.error('No scene provided to createBoss!');
    return;
  }
  
  console.log('Creating boss with scene:', scene);
  
  // Create a full SemiTrump boss instance with the scene
  const boss = createBossInstance(scene);
  
  // Add boss mesh to the scene (it's already added in the SemiTrump constructor,
  // but we'll make sure it's there)
  if (boss.mesh && !scene.getObjectById(boss.mesh.id)) {
    scene.add(boss.mesh);
  }
  
  // Store both the boss instance and its mesh separately for compatibility
  gameState.boss = boss;
  gameState.bossMesh = boss.mesh;
  
  console.log('Boss created and attached to gameState:', boss);
  
  // Update UI with boss health and level (default to level 1 if not specified)
  const level = boss.level || 1;
  window.gameUI.updateBossHealth(boss.health, boss.maxHealth, level);
}

// First, add a function to handle boss respawning logic
function startBossRespawnTimer() {
  if (gameState.bossRespawnTimer) {
    clearTimeout(gameState.bossRespawnTimer);
  }
  
  // Begin respawn sequence
  gameState.bossRespawning = true;
  
  // Show grace period notification with countdown
  window.gameUI.showGracePeriod(gameState.gracePeriodDuration);
  
  // Schedule warning notification
  gameState.bossRespawnTimer = setTimeout(() => {
    // Show warning notification
    window.gameUI.showSpawningSoon();
    
    // REMOVED: Client no longer creates the boss or emits respawn event
    // The server will send 'bossRespawned' when ready.
    // setTimeout(() => {
    //   createBoss(scene, gameState);
    //   gameState.bossRespawning = false;
    //   socket.emit('bossRespawned');
    // }, gameState.respawnWarningDuration * 1000);
    
  }, gameState.gracePeriodDuration * 1000);
}

/**
 * Create an explosion and spinning effect when the boss is defeated
 * @param {THREE.Object3D} bossMesh - The boss mesh to animate
 * @param {THREE.Scene} scene - The scene to add particles to
 */
function createBossDeathAnimation(bossMesh, scene) {
  if (!bossMesh) return;
  
  // Store original position
  const originalPosition = bossMesh.position.clone();
  
  // Create explosion particles
  const particleCount = 100;
  const particles = new THREE.Group();
  
  // Create different colored particle geometries
  const particleGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
  const particleMaterials = [
    new THREE.MeshBasicMaterial({ color: 0xff0000 }), // red
    new THREE.MeshBasicMaterial({ color: 0xff7700 }), // orange
    new THREE.MeshBasicMaterial({ color: 0xffff00 }), // yellow
    new THREE.MeshBasicMaterial({ color: 0xffffff }), // white
    new THREE.MeshBasicMaterial({ color: 0x555555 }), // dark gray (smoke)
  ];
  
  // Create particle meshes
  for (let i = 0; i < particleCount; i++) {
    const material = particleMaterials[Math.floor(Math.random() * particleMaterials.length)];
    const particle = new THREE.Mesh(particleGeometry, material);
    
    // Random positions relative to boss center
    particle.position.set(
      originalPosition.x + (Math.random() - 0.5) * 5,
      originalPosition.y + (Math.random() - 0.5) * 5,
      originalPosition.z + (Math.random() - 0.5) * 5
    );
    
    // Random velocities
    particle.userData.velocity = new THREE.Vector3(
      (Math.random() - 0.5) * 0.3,
      Math.random() * 0.2,
      (Math.random() - 0.5) * 0.3
    );
    
    // Random rotation speeds
    particle.userData.rotationSpeed = {
      x: (Math.random() - 0.5) * 0.2,
      y: (Math.random() - 0.5) * 0.2,
      z: (Math.random() - 0.5) * 0.2
    };
    
    // Random scale
    const scale = 0.2 + Math.random() * 0.8;
    particle.scale.set(scale, scale, scale);
    
    particles.add(particle);
  }
  
  scene.add(particles);
  
  // Create larger explosion effect at the center
  const explosionGeometry = new THREE.SphereGeometry(1, 16, 16);
  const explosionMaterial = new THREE.MeshBasicMaterial({ 
    color: 0xff5500, 
    transparent: true, 
    opacity: 1 
  });
  const explosionMesh = new THREE.Mesh(explosionGeometry, explosionMaterial);
  explosionMesh.position.copy(originalPosition);
  explosionMesh.scale.set(1, 1, 1);
  scene.add(explosionMesh);
  
  // Spawn pickups based on player count
  spawnDeathPickups(originalPosition);
  
  // Add random spin to boss
  const spinAxis = new THREE.Vector3(
    Math.random() - 0.5,
    Math.random() - 0.5,
    Math.random() - 0.5
  ).normalize();
  const spinSpeed = 0.1;
  
  // Duration for animation
  const animationDuration = 2000; // 2 seconds
  const startTime = Date.now();
  
  // Animation loop
  function animateExplosion() {
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / animationDuration, 1);
    
    // Animate boss spinning out of control
    if (bossMesh.parent) {
      // Increase spin rate over time
      const currentSpinSpeed = spinSpeed * (1 + progress * 5);
      const rotationAngle = currentSpinSpeed;
      bossMesh.rotateOnAxis(spinAxis, rotationAngle);
      
      // Add chaotic movement
      bossMesh.position.x += (Math.random() - 0.5) * 0.2;
      bossMesh.position.z += (Math.random() - 0.5) * 0.2;
      bossMesh.position.y += Math.random() * 0.1; // Slight upward movement
      
      // Grow the boss slightly before removing
      const scale = 1 + progress * 0.3;
      bossMesh.scale.set(scale, scale, scale);
      
      // Fade out the boss
      if (progress > 0.5) {
        bossMesh.traverse(child => {
          if (child.material && child.material.opacity !== undefined) {
            child.material.transparent = true;
            child.material.opacity = Math.max(0, 1 - (progress - 0.5) * 2);
          }
        });
      }
    }
    
    // Animate particles
    particles.children.forEach(particle => {
      // Move based on velocity
      particle.position.add(particle.userData.velocity);
      
      // Add gravity effect
      particle.userData.velocity.y -= 0.01;
      
      // Rotate the particle
      particle.rotation.x += particle.userData.rotationSpeed.x;
      particle.rotation.y += particle.userData.rotationSpeed.y;
      particle.rotation.z += particle.userData.rotationSpeed.z;
      
      // Fade out particles
      if (particle.material.opacity !== undefined) {
        particle.material.transparent = true;
        particle.material.opacity = Math.max(0, 1 - progress);
      }
    });
    
    // Animate explosion
    if (progress < 0.3) {
      // Expand explosion
      const explosionScale = 1 + progress * 15;
      explosionMesh.scale.set(explosionScale, explosionScale, explosionScale);
    } else {
      // Fade out explosion
      explosionMesh.material.opacity = Math.max(0, 1 - ((progress - 0.3) / 0.7));
    }
    
    // Continue animation or clean up
    if (progress < 1) {
      requestAnimationFrame(animateExplosion);
    } else {
      // Clean up
      if (bossMesh.parent) {
        scene.remove(bossMesh);
      }
      scene.remove(particles);
      scene.remove(explosionMesh);
    }
  }
  
  // Start animation
  animateExplosion();
}

/**
 * Spawn health and special attack pickups when the boss is defeated
 * @param {THREE.Vector3} position - The position to spawn pickups from
 */
function spawnDeathPickups(position) {
  // Get player count (including local player)
  const playerCount = gameState.players.size + (gameState.localPlayer ? 1 : 0);
  
  // Calculate number of pickups based on player count
  // At least 2 pickups (1 health, 1 special), but more with more players
  const healthPickupCount = Math.max(1, Math.floor(playerCount / 2));
  const specialPickupCount = Math.max(1, Math.ceil(playerCount / 2));
  
  console.log(`Spawning ${healthPickupCount} health and ${specialPickupCount} special attack pickups`);
  
  // Create and shoot out health pickups
  for (let i = 0; i < healthPickupCount; i++) {
    createFlyingPickup('fullHealth', position, i, healthPickupCount);
  }
  
  // Create and shoot out special attack pickups
  for (let i = 0; i < specialPickupCount; i++) {
    createFlyingPickup('specialAttack', position, i, specialPickupCount);
  }
}

/**
 * Create a pickup that flies out from the boss's position
 * @param {string} type - The pickup type ('fullHealth' or 'specialAttack')
 * @param {THREE.Vector3} position - The position to spawn from
 * @param {number} index - The index of this pickup
 * @param {number} total - The total number of pickups of this type
 */
function createFlyingPickup(type, position, index, total) {
  // Create unique ID for pickup
  const pickupId = `boss-death-${type}-${Date.now()}-${index}`;
  
  // Create pickup mesh using the existing pickup mesh factory
  const pickupMesh = createPickupMesh(type);
  
  // Add float offset for animation once landed
  pickupMesh.userData.floatOffset = Math.random() * Math.PI * 2;
  
  // Position at boss position with small offset
  pickupMesh.position.copy(position);
  pickupMesh.position.y += 2; // Start slightly above boss center
  
  // Add to scene
  scene.add(pickupMesh);
  
  // Calculate direction angle based on index and total
  const angleStep = (Math.PI * 2) / total;
  const angle = index * angleStep;
  
  // Calculate velocity based on angle (circular pattern)
  const speed = 0.2 + Math.random() * 0.3; // Random speed variation
  const velocityX = Math.cos(angle) * speed;
  const velocityZ = Math.sin(angle) * speed;
  const velocityY = 0.3; // Initial upward velocity
  
  // Create pickup data object
  const pickup = {
    id: pickupId,
    type: type,
    position: new THREE.Vector3().copy(pickupMesh.position),
    mesh: pickupMesh,
    // Add physics properties
    velocity: new THREE.Vector3(velocityX, velocityY, velocityZ),
    isFlying: true,
    spawnTime: Date.now(),
    // Flag as a local pickup to prevent server removal
    isBossPickup: true
  };
  
  // Add to game state
  gameState.pickups.push(pickup);
  
  // DON'T notify server about this pickup - handle it locally only
  // This prevents the server from potentially removing it through sync
  // The pickup will still be collectible locally
}

// Initialize the game
init(); 