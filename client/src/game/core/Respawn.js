import * as THREE from 'three';

// Respawn configuration
const RESPAWN_DELAY = 5000; // 5 seconds

/**
 * Initialize the respawn system
 * @param {Object} gameState Reference to the game state object
 */
export function initializeRespawn(gameState) {
  // Add respawn properties to game state
  gameState.respawn = {
    active: false,
    startTime: 0,
    countdown: 0,
    completed: false
  };
}

/**
 * Start respawn countdown for local player
 * @param {Object} gameState Reference to the game state object
 */
export function startRespawn(gameState) {
  if (!gameState.localPlayer) return;
  
  // Set respawn state
  gameState.respawn.active = true;
  gameState.respawn.startTime = Date.now();
  gameState.respawn.countdown = RESPAWN_DELAY;
  gameState.respawn.completed = false;
  
  // Show respawn UI
  const respawnUI = document.getElementById('respawn-ui');
  if (respawnUI) {
    respawnUI.style.display = 'flex';
  }
}

/**
 * Update respawn state
 * @param {Object} gameState Reference to the game state object
 * @param {THREE.Scene} scene The Three.js scene
 */
export function updateRespawn(gameState, scene) {
  if (!gameState.respawn.active) return;
  
  // Calculate remaining time
  const elapsed = Date.now() - gameState.respawn.startTime;
  const remaining = Math.max(0, RESPAWN_DELAY - elapsed);
  gameState.respawn.countdown = remaining;
  
  // Update countdown display
  const countdownElement = document.getElementById('respawn-countdown');
  if (countdownElement) {
    countdownElement.textContent = Math.ceil(remaining / 1000);
  }
  
  // Check if respawn is complete
  if (remaining <= 0 && !gameState.respawn.completed) {
    completeRespawn(gameState, scene);
  }
}

/**
 * Complete respawn process
 * @param {Object} gameState Reference to the game state object
 * @param {THREE.Scene} scene The Three.js scene
 */
function completeRespawn(gameState, scene) {
  if (!gameState.localPlayer) return;
  
  // Reset health
  gameState.localPlayer.vehicle.health = gameState.localPlayer.vehicle.maxHealth;
  gameState.localPlayer.vehicle.damageLevel = 0;
  
  // Reset position to spawn point
  const spawnPoint = gameState.map.getPlayerSpawnPoint();
  gameState.localPlayer.vehicle.mesh.position.copy(spawnPoint.position);
  gameState.localPlayer.vehicle.mesh.rotation.y = spawnPoint.rotation;
  
  // Reset velocity
  gameState.localPlayer.vehicle.velocity.set(0, 0, 0);
  gameState.localPlayer.vehicle.rotationVelocity = 0;
  
  // Mark respawn as completed
  gameState.respawn.active = false;
  gameState.respawn.completed = true;
  
  // Add vehicle back to scene if it was removed
  if (!scene.getObjectById(gameState.localPlayer.vehicle.mesh.id)) {
    scene.add(gameState.localPlayer.vehicle.mesh);
  }
  
  // Hide respawn UI
  const respawnUI = document.getElementById('respawn-ui');
  if (respawnUI) {
    respawnUI.style.display = 'none';
  }
}

/**
 * Creates the respawn UI
 */
export function createRespawnUI() {
  // Remove any existing respawn UI
  const existingUI = document.getElementById('respawn-ui');
  if (existingUI) {
    existingUI.remove();
  }
  
  // Create new respawn UI
  const respawnUI = document.createElement('div');
  respawnUI.id = 'respawn-ui';
  respawnUI.style.display = 'none';
  respawnUI.innerHTML = `
    <div class="respawn-container">
      <h2>VEHICLE DESTROYED</h2>
      <p class="respawn-message">Enjoy the aerial view of the battlefield while waiting</p>
      <div class="respawn-timer">
        <span>RESPAWNING IN</span>
        <div id="respawn-countdown">5</div>
      </div>
    </div>
  `;
  
  // Add UI to game UI
  const gameUI = document.getElementById('game-ui');
  if (gameUI) {
    gameUI.appendChild(respawnUI);
  }
  
  // Add styling to the head
  const style = document.createElement('style');
  style.textContent = `
    #respawn-ui {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      display: none;
      justify-content: center;
      align-items: center;
      pointer-events: none;
    }
    .respawn-container {
      background-color: rgba(0, 0, 0, 0.7);
      padding: 30px 50px;
      border-radius: 10px;
      text-align: center;
      color: #fff;
      border: 2px solid #f00;
      box-shadow: 0 0 20px rgba(255, 0, 0, 0.5);
    }
    .respawn-message {
      font-size: 16px;
      margin: 15px 0;
      color: #ccc;
    }
    .respawn-timer {
      margin-top: 20px;
    }
    .respawn-timer span {
      font-size: 18px;
      font-weight: bold;
    }
    #respawn-countdown {
      font-size: 60px;
      font-weight: bold;
      margin-top: 10px;
      color: #f00;
    }
  `;
  document.head.appendChild(style);
} 