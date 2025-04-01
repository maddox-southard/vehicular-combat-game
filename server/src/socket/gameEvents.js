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

  // Initialize pickups when game starts
  gameState.initializePickups(SPAWN_POSITIONS);

  io.on('connection', (socket) => {
    console.log(`Player connected: ${socket.id}`);

    // Send current pickups state to new player
    socket.emit('initializePickups', gameState.pickups);

    // Handle player joining the game
    socket.on('join', (data) => {
      console.log(`Player ${socket.id} joined as ${data.username} with vehicle ${data.vehicle}`);

      // Add player to game state
      const player = gameState.addPlayer(socket.id, data);

      // Notify other players
      socket.broadcast.emit('playerJoined', player);

      // Send current game state to new player
      socket.emit('gameState', gameState.getCurrentState());
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
  });

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