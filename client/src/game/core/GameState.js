import { Vehicle } from '../vehicles/Vehicle';
import { createMap } from '../map/Map';
import { setupControls } from './Controls';
import { SemiTrump } from '../ai/SemiTrump';

/**
 * Initialize the game state with selected vehicle and player
 * @param {THREE.Scene} scene The Three.js scene
 * @param {string} vehicleType Selected vehicle type
 * @param {string} playerName Player name
 * @param {SocketIOClient.Socket} socket Socket.io client instance
 * @param {Object} gameState Reference to the game state object
 */
export function initializeGameState(scene, vehicleType, playerName, socket, gameState) {
  // Create the map if it doesn't exist already
  if (!gameState.map) {
    gameState.map = createMap(scene);
  }

  // Create local player vehicle with scene reference
  const localPlayer = {
    id: socket.id || 'local-player',
    username: playerName || 'Player',
    vehicle: new Vehicle(vehicleType, { scene: scene }),
    isLocal: true
  };

  // Position at spawn point
  const spawnPoint = gameState.map.getPlayerSpawnPoint();
  localPlayer.vehicle.mesh.position.copy(spawnPoint.position);
  localPlayer.vehicle.mesh.rotation.y = spawnPoint.rotation;

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

  return gameState;
}

/**
 * Create the boss entity
 * @param {THREE.Scene} scene The Three.js scene
 * @param {Object} gameState Reference to the game state object
 */
function createBoss(scene, gameState) {
  // Create Semi-Trump boss with initial difficulty level
  // const difficulty = 1 + (0.2 * Math.min(gameState.players.size - 1, 3));
  // const boss = new SemiTrump(scene, difficulty);

  // // Position at boss spawn point
  // const bossSpawn = gameState.map.getBossSpawnPoint();
  // boss.mesh.position.copy(bossSpawn.position);
  // boss.mesh.rotation.y = bossSpawn.rotation;

  // // Add to scene
  // scene.add(boss.mesh);

  // // Set in game state
  // gameState.boss = boss;
}

/**
 * Add a new player to the game
 * @param {Object} playerData Player data from server
 * @param {THREE.Scene} scene The Three.js scene
 * @param {Object} gameState Reference to the game state object
 */
export function addPlayer(playerData, scene, gameState) {
  // Check if player already exists
  if (gameState.players.has(playerData.id)) {
    return;
  }

  // Create new vehicle for player
  const vehicle = new Vehicle(playerData.vehicle);

  // Position at provided coordinates or spawn point
  if (playerData.position) {
    vehicle.mesh.position.set(
      playerData.position.x,
      playerData.position.y,
      playerData.position.z
    );
  } else {
    const spawnPoint = gameState.map.getPlayerSpawnPoint();
    vehicle.mesh.position.copy(spawnPoint.position);
    vehicle.mesh.rotation.y = spawnPoint.rotation;
  }

  // Create player object
  const player = {
    id: playerData.id,
    username: playerData.username || 'Player',
    vehicle: vehicle,
    isLocal: false
  };

  // Add to scene
  scene.add(vehicle.mesh);

  // Add to game state
  gameState.players.set(player.id, player);

  // Update boss difficulty if needed
  updateBossDifficulty(gameState);

  return player;
}

/**
 * Remove a player from the game
 * @param {string} playerId ID of the player to remove
 * @param {THREE.Scene} scene The Three.js scene
 * @param {Object} gameState Reference to the game state object
 */
export function removePlayer(playerId, scene, gameState) {
  // Get player
  const player = gameState.players.get(playerId);
  if (!player) return;

  // Remove from scene
  scene.remove(player.vehicle.mesh);

  // Remove from game state
  gameState.players.delete(playerId);

  // Update boss difficulty
  updateBossDifficulty(gameState);
}

/**
 * Update boss difficulty based on player count
 * @param {Object} gameState Reference to the game state object
 */
function updateBossDifficulty(gameState) {
  if (!gameState.boss) return;

  // Scale difficulty with player count and kill streak
  const playerCount = gameState.players.size;
  const killStreak = gameState.bossKillStreak || 0;

  const difficulty = 1 + (0.2 * Math.min(playerCount - 1, 3)) + (0.2 * killStreak);
  gameState.boss.setDifficulty(difficulty);
} 