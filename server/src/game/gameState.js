/**
 * Creates the game state object for the server
 * @returns {Object} Game state object
 */
function createGameState() {
  // Create game state object
  const gameState = {
    players: new Map(),
    boss: null,
    pickups: [],
    bossKillStreak: 0,
    lastBossDefeatTime: 0,
    bossRespawnDelay: 10000, // 10 seconds

    /**
     * Initialize pickups at spawn positions
     * @param {Array} spawnPositions Array of positions to spawn pickups
     */
    initializePickups(spawnPositions) {
      // Clear existing pickups
      this.pickups = [];

      // Available pickup types
      const types = ['homingMissile', 'freezeMissile', 'fullHealth', 'rapidFire'];

      // Use time-based index for deterministic but changing types
      const timeIndex = Math.floor(Date.now() / 30000) % types.length;

      // Spawn pickups at each position
      spawnPositions.forEach((position, index) => {
        const type = types[(timeIndex + index) % types.length];
        this.spawnPickup(position, type);
      });
    },

    /**
     * Spawn a pickup at the given position
     * @param {Object} position Position to spawn pickup
     * @param {string} type Type of pickup to spawn
     * @returns {Object} The created pickup
     */
    spawnPickup(position, type) {
      const pickup = {
        id: `pickup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: type,
        position: {
          x: position.x,
          y: position.y,
          z: position.z
        }
      };

      this.pickups.push(pickup);
      return pickup;
    },

    /**
     * Update game state
     * @param {number} delta Time since last update in seconds
     * @param {number} time Current time in milliseconds
     * @param {SocketIO.Server} io Socket.IO server instance
     */
    update(delta, time, io) {
      // Check for boss respawn
      this.checkBossRespawn(time, io);

      // Update pickups
      this.updatePickups(delta, time, io);

      // Update boss
      if (this.boss) {
        this.updateBoss(delta, time, io);
      }
    },

    /**
     * Check if boss should respawn
     * @param {number} time Current time
     * @param {SocketIO.Server} io Socket.IO server
     */
    checkBossRespawn(time, io) {
      // If we have a boss, no need to respawn
      if (this.boss) return;

      // If no players, no need for a boss
      if (this.players.size === 0) return;

      // Check if enough time has passed since last defeat
      if (this.lastBossDefeatTime > 0 &&
        time - this.lastBossDefeatTime > this.bossRespawnDelay) {
        // Spawn a new boss
        this.spawnBoss(io);
      }
    },

    /**
     * Spawn the boss
     * @param {SocketIO.Server} io Socket.IO server
     */
    spawnBoss(io) {
      // Calculate difficulty based on player count and kill streak
      const difficulty = this.calculateBossDifficulty();

      // Create boss data
      this.boss = {
        id: 'boss',
        type: 'SemiTrump',
        difficulty,
        health: 100 * difficulty,
        maxHealth: 100 * difficulty,
        position: this.getBossSpawnPosition(),
        rotation: { y: Math.PI }, // Facing south
        lastAttackTime: 0,
        attackCooldown: 3000 / difficulty,
        state: 'spawning',
        stateTimer: 0,
        stateTimeout: 3000, // 3 seconds for spawning state
        target: null
      };

      // Notify all clients
      io.emit('bossSpawned', {
        boss: this.boss
      });

      // Reset last defeat time
      this.lastBossDefeatTime = 0;

      console.log(`Boss spawned with difficulty: ${difficulty.toFixed(1)}`);
    },

    /**
     * Handle boss defeat
     * @param {string} killerId ID of player who defeated the boss
     * @param {SocketIO.Server} io Socket.IO server
     */
    handleBossDefeat(killerId, io) {
      if (!this.boss) return;

      // Increment global boss kill streak
      this.bossKillStreak++;

      // Increment kill streak for player
      const killer = this.players.get(killerId);
      if (killer) {
        killer.killStreak = (killer.killStreak || 0) + 1;
        io.emit('updateKillStreak', {
          id: killerId,
          killStreak: killer.killStreak
        });
      }

      // Notify all clients
      io.emit('bossDefeated', {
        killerId,
        bossKillStreak: this.bossKillStreak,
        position: this.boss.position
      });

      // Record defeat time
      this.lastBossDefeatTime = Date.now();

      // Spawn pickups where the boss was defeated
      this.spawnPickups(this.boss.position, 3 + Math.floor(this.bossKillStreak / 2), io);

      // Remove boss
      this.boss = null;

      console.log(`Boss defeated by player ${killerId}. Kill streak: ${this.bossKillStreak}`);
    },

    /**
     * Update the boss state
     * @param {number} delta Time since last update
     * @param {number} time Current time
     * @param {SocketIO.Server} io Socket.IO server
     */
    updateBoss(delta, time, io) {
      // This is a simplified AI update
      // A more complete implementation would include pathfinding,
      // state machines, and more complex behaviors

      // For now we'll just update the boss position to follow players
      if (this.boss.state === 'spawning') {
        // Just update timer in spawning state
        this.boss.stateTimer += delta * 1000;
        if (this.boss.stateTimer >= this.boss.stateTimeout) {
          this.boss.state = 'patrolling';
          this.boss.stateTimer = 0;
          this.boss.stateTimeout = 8000; // 8 seconds for patrolling

          io.emit('bossStateChanged', {
            id: this.boss.id,
            state: this.boss.state
          });
        }
      } else {
        // Find a target if we don't have one
        if (!this.boss.target) {
          this.findBossTarget();
        }

        // Update boss position to follow target
        if (this.boss.target) {
          const target = this.players.get(this.boss.target);
          if (target) {
            // Move towards target
            const speed = 0.2 * (1 + (this.boss.difficulty * 0.3)) * delta * 60;
            const dx = target.position.x - this.boss.position.x;
            const dz = target.position.z - this.boss.position.z;
            const distance = Math.sqrt(dx * dx + dz * dz);

            if (distance > 10) { // Only move if not too close
              const dirX = dx / distance;
              const dirZ = dz / distance;

              this.boss.position.x += dirX * speed;
              this.boss.position.z += dirZ * speed;

              // Update rotation to face target
              this.boss.rotation.y = Math.atan2(dx, dz);
            }

            // Check for attack
            if (distance < 15 && time - this.boss.lastAttackTime > this.boss.attackCooldown) {
              this.bossAttack(target, io);
              this.boss.lastAttackTime = time;
            }
          } else {
            // Target no longer exists
            this.boss.target = null;
          }
        }
      }

      // Broadcast boss position updates
      io.emit('bossPositionUpdated', {
        id: this.boss.id,
        position: this.boss.position,
        rotation: this.boss.rotation
      });
    },

    /**
     * Find a target for the boss
     */
    findBossTarget() {
      if (this.players.size === 0) return;

      // Simple logic: pick random player
      const playerIds = Array.from(this.players.keys());
      const randomIndex = Math.floor(Math.random() * playerIds.length);
      this.boss.target = playerIds[randomIndex];
    },

    /**
     * Boss attacks a player
     * @param {Object} target Target player
     * @param {SocketIO.Server} io Socket.IO server
     */
    bossAttack(target, io) {
      // Calculate damage
      const baseDamage = 10 * (1 + (this.boss.difficulty * 0.2));

      // Notify clients about attack
      io.emit('bossAttack', {
        id: this.boss.id,
        targetId: target.id,
        attackType: Math.random() < 0.7 ? 'ram' : 'flamethrower',
        damage: baseDamage
      });
    },

    /**
     * Calculate boss difficulty based on player count and kill streak
     * @returns {number} Difficulty value
     */
    calculateBossDifficulty() {
      return 1 + (0.2 * Math.min(this.players.size - 1, 3)) + (0.2 * this.bossKillStreak);
    },

    /**
     * Get the boss spawn position
     * @returns {Object} Position object
     */
    getBossSpawnPosition() {
      // For now, fixed position at south side
      return { x: 0, y: 0, z: 80 };
    },

    /**
     * Spawn pickups at a position
     * @param {Object} position Position to spawn pickups
     * @param {number} count Number of pickups to spawn
     * @param {SocketIO.Server} io Socket.IO server
     */
    spawnPickups(position, count, io) {
      const pickupTypes = ['health', 'weapon', 'special', 'shield'];

      for (let i = 0; i < count; i++) {
        // Randomize position slightly
        const x = position.x + (Math.random() * 20 - 10);
        const z = position.z + (Math.random() * 20 - 10);

        // Create pickup
        const pickup = {
          id: `pickup-${Date.now()}-${i}`,
          type: pickupTypes[Math.floor(Math.random() * pickupTypes.length)],
          position: { x, y: 1, z },
          spawnTime: Date.now(),
          lifetime: 30000 // 30 seconds
        };

        // Add to pickups
        this.pickups.push(pickup);

        // Notify clients
        io.emit('pickupSpawned', pickup);
      }
    },

    /**
     * Update pickups
     * @param {number} delta Time since last update
     * @param {number} time Current time
     * @param {SocketIO.Server} io Socket.IO server
     */
    updatePickups(delta, time, io) {
      // Check for expired pickups
      const now = Date.now();
      const expiredPickups = this.pickups.filter(pickup =>
        now - pickup.spawnTime > pickup.lifetime
      );

      // Remove expired pickups
      if (expiredPickups.length > 0) {
        this.pickups = this.pickups.filter(pickup =>
          now - pickup.spawnTime <= pickup.lifetime
        );

        // Notify clients
        io.emit('pickupsRemoved', expiredPickups.map(p => p.id));
      }
    },

    /**
     * Handle player collecting a pickup
     * @param {string} playerId Player ID
     * @param {string} pickupId Pickup ID
     * @param {SocketIO.Server} io Socket.IO server
     */
    handlePickupCollected(playerId, pickupId, io) {
      // Find pickup
      const pickupIndex = this.pickups.findIndex(p => p.id === pickupId);
      if (pickupIndex === -1) return;

      const pickup = this.pickups[pickupIndex];

      // Remove pickup
      this.pickups.splice(pickupIndex, 1);

      // Apply pickup effect
      const player = this.players.get(playerId);
      if (player) {
        switch (pickup.type) {
          case 'health':
            // Health pickup would restore player's health
            // Actual healing is handled client-side
            break;
          case 'weapon':
            // Weapon pickup would give player a new weapon
            // Weapon assignment is handled client-side
            break;
          case 'special':
            // Special weapon pickup
            // Handled client-side
            break;
          case 'shield':
            // Shield pickup
            // Handled client-side
            break;
        }
      }

      // Notify clients
      io.emit('pickupCollected', {
        id: pickupId,
        playerId,
        type: pickup.type
      });
    },

    /**
     * Add a player to the game
     * @param {string} id Player ID
     * @param {Object} data Player data
     * @returns {Object} Created player
     */
    addPlayer(id, data) {
      // Create player object
      const player = {
        id,
        username: data.username || 'Player',
        vehicle: data.vehicle || 'roadkill',
        position: this.getPlayerSpawnPosition(),
        rotation: { y: 0 },
        health: 100,
        killStreak: 0,
        lastUpdateTime: Date.now()
      };

      // Add to players map
      this.players.set(id, player);

      // Spawn boss if needed
      if (this.players.size === 1 && !this.boss && this.lastBossDefeatTime === 0) {
        this.lastBossDefeatTime = Date.now() - this.bossRespawnDelay + 2000; // Spawn after 2 seconds
      }

      return player;
    },

    /**
     * Remove a player from the game
     * @param {string} id Player ID
     */
    removePlayer(id) {
      // Remove from players map
      this.players.delete(id);

      // If no players left, remove boss
      if (this.players.size === 0 && this.boss) {
        this.boss = null;
        this.lastBossDefeatTime = 0;
      }
    },

    /**
     * Update player position
     * @param {string} id Player ID
     * @param {Object} position New position
     * @param {Object} rotation New rotation
     */
    updatePlayerPosition(id, position, rotation) {
      const player = this.players.get(id);
      if (player) {
        player.position = position;
        player.rotation = rotation;
        player.lastUpdateTime = Date.now();
      }
    },

    /**
     * Get a spawn position for a player
     * @returns {Object} Spawn position
     */
    getPlayerSpawnPosition() {
      // Spawn at center of map with some random variation
      const x = Math.random() * 40 - 20;
      return { x, y: 0, z: 0 };
    },

    /**
     * Get current game state for a new player
     * @returns {Object} Current game state
     */
    getCurrentState() {
      return {
        players: Array.from(this.players.values()),
        boss: this.boss,
        pickups: this.pickups,
        bossKillStreak: this.bossKillStreak
      };
    }
  };

  return gameState;
}

module.exports = { createGameState }; 