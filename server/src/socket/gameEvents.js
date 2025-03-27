/**
 * Setup socket.io event handlers for the game
 * @param {SocketIO.Server} io Socket.IO server instance
 * @param {Object} gameState Game state object
 */
function setupGameEvents(io, gameState) {
  io.on('connection', (socket) => {
    console.log(`Player connected: ${socket.id}`);
    
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
      // Broadcast to other players
      socket.broadcast.emit('playerFired', {
        id: socket.id,
        weaponType: data.weaponType,
        projectileId: data.projectileId,
        position: data.position,
        direction: data.direction
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
      // Process pickup collection
      gameState.handlePickupCollected(socket.id, data.pickupId, io);
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
}

module.exports = { setupGameEvents }; 