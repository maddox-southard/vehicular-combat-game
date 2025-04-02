import * as THREE from 'three';

// Respawn configuration
const BASE_RESPAWN_DELAY = 5000; // 5 seconds base time
const ADDITIONAL_DELAY_PER_DEATH = 5000; // 5 seconds additional per death

/**
 * Initialize the respawn system
 * @param {Object} gameState Reference to the game state object
 */
export function initializeRespawn(gameState) {
  // Explicitly reset death counter to 0
  gameState.deathCount = 0;

  // Add respawn properties to game state
  gameState.respawn = {
    active: false,
    startTime: 0,
    totalDelay: 0,
    countdown: 0,
    completed: false
  };
  
  console.log('Respawn system initialized with death count reset to 0');
}

/**
 * Start respawn countdown for local player
 * @param {Object} gameState Reference to the game state object
 */
export function startRespawn(gameState) {
  if (!gameState.localPlayer) return;

  // Make sure deathCount is initialized before incrementing
  if (typeof gameState.deathCount !== 'number') {
    gameState.deathCount = 0;
  }
  // Increment death count
  gameState.deathCount += 1;
  
  console.log(`Death count incremented to: ${gameState.deathCount}`);

  // Calculate respawn delay based on current death count
  // First death: BASE_RESPAWN_DELAY (5 seconds)
  // Second death: BASE_RESPAWN_DELAY + ADDITIONAL_DELAY_PER_DEATH (10 seconds)
  // Third death: BASE_RESPAWN_DELAY + 2 * ADDITIONAL_DELAY_PER_DEATH (15 seconds)
  // And so on...
  const additionalDelay = ADDITIONAL_DELAY_PER_DEATH * (gameState.deathCount - 1);
  const respawnDelay = BASE_RESPAWN_DELAY + additionalDelay;
  
  console.log(`Respawn delay set to ${respawnDelay}ms (${respawnDelay/1000} seconds)`);

  // Set respawn state
  gameState.respawn.active = true;
  gameState.respawn.startTime = Date.now();
  gameState.respawn.totalDelay = respawnDelay;
  gameState.respawn.countdown = respawnDelay;
  gameState.respawn.completed = false;

  // Disable player controls during respawn
  if (gameState.localPlayer.vehicle) {
    // Store original controls state to restore later
    gameState.respawn.originalControls = { ...gameState.localPlayer.vehicle.controls };

    // Disable all controls
    for (const key in gameState.localPlayer.vehicle.controls) {
      gameState.localPlayer.vehicle.controls[key] = false;
    }

    // Set isRespawning flag to prevent controls from working
    gameState.localPlayer.vehicle.isRespawning = true;
  }

  // Make sure the respawn UI exists
  let respawnUI = document.getElementById('respawn-ui');
  if (!respawnUI) {
    createRespawnUI();
    respawnUI = document.getElementById('respawn-ui');
  }

  // Show respawn UI
  if (respawnUI) {
    respawnUI.style.display = 'flex';

    // Update death counter in UI
    const deathCountElement = document.getElementById('death-count');
    if (deathCountElement) {
      deathCountElement.textContent = gameState.deathCount;
      console.log(`Updated death count UI to: ${gameState.deathCount}`);
    } else {
      console.warn('Death count element not found in UI');
    }
    
    // Update initial countdown display
    const countdownElement = document.getElementById('respawn-countdown');
    if (countdownElement) {
      const countdownSeconds = Math.ceil(respawnDelay / 1000);
      countdownElement.textContent = countdownSeconds;
      console.log(`Set initial countdown UI to: ${countdownSeconds} seconds`);
    } else {
      console.warn('Countdown element not found in UI');
    }
  } else {
    console.error('Failed to create or find respawn UI');
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
  const remaining = Math.max(0, gameState.respawn.totalDelay - elapsed);

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

  // Reset position to spawn point - respawns are always at Capitol Building (not through portal)
  const spawnPoint = gameState.map.getPlayerSpawnPoint(false);
  gameState.localPlayer.vehicle.mesh.position.copy(spawnPoint.position);
  gameState.localPlayer.vehicle.mesh.rotation.y = spawnPoint.rotation;

  // Reset velocity
  gameState.localPlayer.vehicle.velocity.set(0, 0, 0);
  gameState.localPlayer.vehicle.rotationVelocity = 0;

  // Mark respawn as completed
  gameState.respawn.active = false;
  gameState.respawn.completed = true;

  // Switch back to normal camera view
  gameState.useAerialCamera = false;

  // Add vehicle back to scene if it was removed
  if (!scene.children.includes(gameState.localPlayer.vehicle.mesh)) {
    scene.add(gameState.localPlayer.vehicle.mesh);
  }

  // Re-enable controls
  if (gameState.localPlayer.vehicle) {
    // Remove the respawning flag
    gameState.localPlayer.vehicle.isRespawning = false;
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
      <div class="death-counter">
        <span>DEATH COUNT:</span>
        <div id="death-count">0</div>
      </div>
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
    .death-counter {
      margin: 15px 0;
    }
    .death-counter span {
      font-size: 18px;
      font-weight: bold;
      color: #ff6666;
    }
    #death-count {
      font-size: 30px;
      font-weight: bold;
      margin-top: 5px;
      color: #ff0000;
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