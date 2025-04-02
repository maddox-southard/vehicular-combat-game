/**
 * Setup socket.io event handlers for the game
 * @param {SocketIO.Server} io Socket.IO server instance
 * @param {Object} gameState Game state object
 */
function setupGameEvents(io, gameState) {
  // Define spawn positions at map corners and additional positions in further corners
  const SPAWN_POSITIONS = [
    // Original positions
    { x: -45, y: 3, z: -45 },
    { x: -45, y: 3, z: 45 },
    { x: 45, y: 3, z: -45 },
    { x: 45, y: 3, z: 45 },
    // Additional positions at extreme corners (5 units from walls)
    { x: -155, y: 3, z: -235 },
    { x: -155, y: 3, z: 235 },
    { x: 155, y: 3, z: -235 },
    { x: 155, y: 3, z: 235 }
  ];

  // Track Easter Egg pickup state
  let easterEggState = {
    active: true,
    position: { x: 50, y: 50.0, z: 0 }, // Center of map, height adjusted to 1.0
    respawnTime: 30000, // 30 seconds
    respawnTimer: null
  };

  // Initialize pickups when game starts
  gameState.initializePickups(SPAWN_POSITIONS);

  // Send Easter Egg state when players connect
  function broadcastEasterEggState() {
    io.emit('easterEggState', easterEggState);
  }

  io.on('connection', (socket) => {
    console.log(`Player connected: ${socket.id}`);

    // Send current pickups state to new player
    socket.emit('initializePickups', gameState.pickups);
    
    // Send current Easter Egg state to new player
    socket.emit('easterEggState', easterEggState);

    // Handle player joining the game
    socket.on('join', (data) => {
      console.log(`Player ${socket.id} joined as ${data.username} with vehicle ${data.vehicle}`);

      // Add player to game state
      const player = gameState.addPlayer(socket.id, data);

      // Notify other players
      socket.broadcast.emit('playerJoined', player);

      // Send current game state to new player
      socket.emit('gameState', gameState.getCurrentState());
      
      // Check if this is the first player and spawn the boss
      if (gameState.players.size === 1 && !gameState.boss) {
        console.log('First player joined, initiating initial boss spawn...');
        respawnBoss(); // Use the existing respawn function to spawn the boss
      }
    });

    // Handle player position updates
    socket.on('updatePosition', (data) => {
      // Update player position in game state
      gameState.updatePlayerPosition(socket.id, data.position, data.rotation);

      // Broadcast to other players
      socket.broadcast.emit('playerMoved', {
        id: socket.id,
        position: data.position,
        rotation: data.rotation
      });
    });

    // Handle weapon firing
    socket.on('fireWeapon', (data) => {
      console.log('Received fireWeapon event:', data);

      // Add slight spread to machine gun fire
      if (data.type === 'machineGun') {
        const spread = 0.05;
        data.direction.x += (Math.random() - 0.5) * spread;
        data.direction.y += (Math.random() - 0.5) * spread;
        // Normalize direction after adding spread
        const length = Math.sqrt(
          data.direction.x * data.direction.x +
          data.direction.y * data.direction.y +
          data.direction.z * data.direction.z
        );
        data.direction.x /= length;
        data.direction.y /= length;
        data.direction.z /= length;
      }

      // Adjust spawn position to be slightly above vehicle
      data.position.y += 0.5;

      console.log('Broadcasting projectileFired event:', {
        type: data.type,
        position: data.position,
        direction: data.direction,
        playerId: socket.id
      });

      // Broadcast the projectile to all clients including sender
      io.emit('projectileFired', {
        type: data.type,
        position: data.position,
        direction: data.direction,
        playerId: socket.id
      });
    });

    // Handle hits on targets
    socket.on('hitTarget', (data) => {
      // Process hit based on target type
      if (data.targetType === 'boss' && gameState.boss) {
        // Apply damage to boss
        const damage = data.damage || 10;
        gameState.boss.health -= damage;

        // Check if boss is defeated
        if (gameState.boss.health <= 0) {
          // Handle boss defeat
          gameState.handleBossDefeat(socket.id, io);
        } else {
          // Broadcast boss hit
          io.emit('bossHit', {
            health: gameState.boss.health,
            maxHealth: gameState.boss.maxHealth,
            attackerId: socket.id
          });
        }
      } else if (data.targetType === 'player') {
        // Get target player
        const targetPlayer = gameState.players.get(data.targetId);
        if (targetPlayer) {
          // Apply damage to player
          const damage = data.damage || 10;

          // Broadcast player hit
          io.emit('playerHit', {
            id: data.targetId,
            attackerId: socket.id,
            damage
          });

          // Note: actual health tracking is done client-side
          // This just broadcasts the event to all clients
        }
      }
    });

    // Handle pickup collection
    socket.on('collectPickup', (data) => {
      const pickup = gameState.pickups.find(p => p.id === data.pickupId);
      if (pickup) {
        // Remove pickup
        gameState.pickups = gameState.pickups.filter(p => p.id !== data.pickupId);

        // Broadcast pickup collection to all clients
        io.emit('pickupCollected', {
          id: data.pickupId,
          playerId: socket.id,
          type: pickup.type
        });
      }
    });

    // Handle player disconnection
    socket.on('disconnect', () => {
      console.log(`Player disconnected: ${socket.id}`);

      // Remove player from game state
      gameState.removePlayer(socket.id);

      // Notify other players
      io.emit('playerLeft', socket.id);
    });

    // Handle player chat messages
    socket.on('chatMessage', (data) => {
      // Get player info
      const player = gameState.players.get(socket.id);
      if (!player) return;

      // Broadcast message to all players
      io.emit('chatMessage', {
        id: socket.id,
        username: player.username,
        message: data.message,
        timestamp: Date.now()
      });
    });

    // Handle player ready status
    socket.on('ready', () => {
      // Get player
      const player = gameState.players.get(socket.id);
      if (!player) return;

      // Set player as ready
      player.ready = true;

      // Notify all players
      io.emit('playerReady', {
        id: socket.id
      });
    });

    // Handle Easter Egg pickup collection
    socket.on('collectEasterEgg', () => {
      console.log(`Player ${socket.id} collected the Easter Egg pickup`);
      
      // Only allow collection if the Easter Egg is active
      if (easterEggState.active) {
        // Set Easter Egg as inactive
        easterEggState.active = false;
        
        // Broadcast to all clients that Easter Egg was collected
        io.emit('easterEggCollected', {
          playerId: socket.id
        });
        
        // Start respawn timer
        easterEggState.respawnTimer = setTimeout(() => {
          // Reactivate Easter Egg
          easterEggState.active = true;
          easterEggState.respawnTimer = null;
          
          // Broadcast respawn to all clients
          io.emit('easterEggRespawned');
          
          console.log(`Easter Egg pickup respawned after ${easterEggState.respawnTime / 1000} seconds`);
        }, easterEggState.respawnTime);
      }
    });

    // Handle player transformation (Easter Egg pickup)
    socket.on('playerTransformed', (data) => {
      console.log(`Player ${socket.id} transformed to vehicle type: ${data.newVehicleType}`);
      
      // Update the player's vehicle type in gameState
      const player = gameState.players.get(socket.id);
      if (player) {
        // Update vehicle type
        player.vehicle = data.newVehicleType;
        
        // Broadcast transformation to all other players
        socket.broadcast.emit('playerTransformed', {
          playerId: socket.id,
          newVehicleType: data.newVehicleType
        });
        
        console.log(`Broadcasted transformation of player ${socket.id} to ${data.newVehicleType}`);
      }
    });
    
    // Handle direct boss hit event (separate from hitTarget)
    socket.on('bossHit', (data) => {
      console.log(`Player ${socket.id} hit the boss for ${data.damage} damage`);
      
      // Only process if boss exists
      if (gameState.boss) {
        // Apply damage to boss server-side health
        gameState.boss.health -= data.damage;
        
        // Ensure health doesn't go below 0
        if (gameState.boss.health < 0) {
          gameState.boss.health = 0;
        }
        
        console.log(`Boss health updated to ${gameState.boss.health}/${gameState.boss.maxHealth}`);
        
        // Check if boss is defeated
        if (gameState.boss.health <= 0) {
          // Handle boss defeat
          handleBossDefeat(socket.id);
        } else {
          // Broadcast updated health to all players
          io.emit('bossHit', {
            health: gameState.boss.health,
            maxHealth: gameState.boss.maxHealth,
            attackerId: socket.id
          });
        }
      }
    });
    
    // Handle boss defeat event
    socket.on('bossDefeated', () => {
      console.log(`Boss defeated notification from ${socket.id}`);
      
      // Only handle if the boss exists
      if (gameState.boss) {
        handleBossDefeat(socket.id);
      }
    });
  });

  /**
   * Create a safe copy of boss object without circular references
   * @param {Object} boss - The boss object to sanitize
   * @returns {Object} A sanitized copy of the boss object
   */
  function createSafeBossCopy(boss) {
    if (!boss) return null;
    
    return {
      id: boss.id,
      type: boss.type,
      difficulty: boss.difficulty,
      level: boss.level,
      health: boss.health,
      maxHealth: boss.maxHealth,
      position: { ...boss.position },
      rotation: { ...boss.rotation },
      state: boss.state,
      stateTimer: boss.stateTimer,
      stateTimeout: boss.stateTimeout,
      lastAttackTime: boss.lastAttackTime,
      attackCooldown: boss.attackCooldown,
      damage: boss.damage
    };
  }

  /**
   * Handle boss defeat on the server
   * @param {string} killerId - ID of the player who defeated the boss
   */
  function handleBossDefeat(killerId) {
    console.log(`Boss defeated by player ${killerId}!`);
    
    // Broadcast to all clients
    io.emit('bossDefeated', {
      killerId: killerId
    });
    
    // Set boss health to zero explicitly
    if (gameState.boss) {
      gameState.boss.health = 0;
    }
    
    // Record defeat time and update kill streak if needed
    const now = Date.now();
    const bossKillStreak = gameState.bossKillStreak || 0;
    
    // Store last defeat time for respawn timing
    gameState.lastBossDefeatTime = now;
    gameState.bossKillStreak = bossKillStreak + 1;
    
    // Clear any existing boss respawn timer
    if (gameState.bossRespawnTimer) {
      clearTimeout(gameState.bossRespawnTimer);
    }
    
    // Set server-side respawn timer
    gameState.bossRespawnTimer = setTimeout(() => {
      respawnBoss();
    }, 35000); // 35 seconds (grace period + warning)
    
    // Set boss to null to indicate it's destroyed
    gameState.boss = null;
    
    console.log(`Started boss respawn timer, will respawn in 35 seconds`);
  }
  
  /**
   * Respawn the boss on the server
   */
  function respawnBoss() {
    console.log('Respawning boss on server');
    
    // Calculate level and health based on player count
    const playerCount = gameState.players.size;
    const difficulty = playerCount; // Difficulty/level is equal to the number of players
    
    // Create new boss data
    gameState.boss = {
      id: 'boss', 
      type: 'SemiTrump',
      difficulty: difficulty,
      level: playerCount, // Store the level (number of players)
      health: 1000 * playerCount, // Health is 1000 times the number of players
      maxHealth: 1000 * playerCount, // Max health is also 1000 times the number of players
      state: 'spawning',
      stateTimer: 0, // Initialize state timer
      stateTimeout: 3000, // Set initial spawning timeout (3 seconds)
      position: {
        x: 0,
        y: 0.2,
        z: 0
      },
      rotation: {
        y: Math.PI
      },
      // Initialize other necessary properties if updateBoss expects them
      lastAttackTime: 0,
      attackCooldown: 2000 / difficulty, // Reduced from 3000 to 2000 for faster attacks
      damage: 15 * difficulty, // Increased base damage from 10 to 15
      target: null,
      perimeterWaypoints: null, // Ensure waypoints are reset
      currentWaypointIndex: 0
    };
    
    // Clear respawn timer reference stored in gameState
    if (gameState.bossRespawnTimer) { // Check if timer exists before clearing
      clearTimeout(gameState.bossRespawnTimer);
      gameState.bossRespawnTimer = null;
    }
    
    // Broadcast to all clients
    io.emit('bossRespawned', {
      boss: createSafeBossCopy(gameState.boss) // Send the sanitized boss object
    });
    
    console.log(`Boss respawned with level: ${playerCount}, health: ${1000 * playerCount}`);
  }

  // Set up pickup respawn timer
  setInterval(() => {
    SPAWN_POSITIONS.forEach((position, index) => {
      // Check if position is empty
      const hasPickup = gameState.pickups.some(pickup =>
        pickup.position.x === position.x &&
        pickup.position.z === position.z
      );

      if (!hasPickup) {
        // Available pickup types with 50/50 distribution
        const types = ['specialAttack', 'fullHealth'];
        
        // Simple alternating pattern for 50/50 distribution
        // Even-indexed positions get one type, odd-indexed get the other
        const type = types[index % 2];

        const pickup = gameState.spawnPickup(position, type);
        io.emit('pickupSpawned', pickup);
      }
    });
  }, 30000); // Respawn check every 30 seconds
}

module.exports = { setupGameEvents }; 