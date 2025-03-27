# AI-Optimized Prompts for Building a Twisted Metal-Inspired Vehicular Combat Game

## Context & Project Background

You are an expert game developer AI tasked with creating a multiplayer web-based vehicular combat game inspired by Twisted Metal 3, specifically focusing on the Washington D.C. map. This is for submission to Vibe Jam 2025, which requires 80%+ AI-generated code, web-based implementation, instant loading, and specific competition requirements.

The game features player-selected vehicles battling an AI boss named "Semi-Trump" in a Washington D.C. arena. Players cooperate to defeat the boss, which respawns stronger after each defeat. The game must include multiplayer functionality, pickup items, and a portal system connecting to external sites.

## Technology Requirements

- **Frontend/Game Engine**: Use Three.js for 3D rendering and game logic
- **Backend**: Implement with Node.js and Express
- **Multiplayer**: Integrate Socket.io for WebSocket-based real-time communication
- **Deployment**: Configure for Vercel/Netlify (frontend) and Heroku (backend)
- **Browser Compatibility**: Ensure functionality across all major browsers

## Project Structure

```
vehicular-combat-game/
├── client/                 # Frontend code
│   ├── public/             # Static assets
│   │   ├── assets/         # Game assets (AI-generated)
│   │   ├── src/
│   │   │   ├── assets/     # Game assets (AI-generated)
│   │   │   ├── components/ # UI components
│   │   │   ├── game/       # Game logic
│   │   │   │   ├── vehicles/ # Vehicle classes and properties
│   │   │   │   ├── weapons/  # Weapon classes and properties
│   │   │   │   ├── ai/       # AI behavior for Semi-Trump
│   │   │   │   ├── physics/  # Collision detection and physics
│   │   │   │   ├── map/      # Map layout and objects
│   │   │   │   └── pickups/  # Item pickup logic
│   │   │   ├── multiplayer/ # Multiplayer functionality
│   │   │   └── utils/      # Utility functions
│   │   ├── index.html      # Main HTML entry
│   │   └── package.json    # Frontend dependencies
├── server/                 # Backend code
│   ├── src/
│   │   ├── game/           # Game state management
│   │   ├── socket/         # Socket.io implementation
│   │   └── index.js        # Server entry point
│   └── package.json        # Backend dependencies
└── README.md               # Project documentation
```

## Core Components for AI Implementation

### 1. Project Setup & Configuration

Generate the initial project structure with appropriate configurations. Create package.json files for both client and server with necessary dependencies. Implement a clean, modular architecture that keeps code well-organized.

For the client:
```json
{
  "name": "vehicular-combat-client",
  "version": "1.0.0",
  "dependencies": {
    "three": "^0.157.0",
    "socket.io-client": "^4.7.2"
  }
}
```

For the server:
```json
{
  "name": "vehicular-combat-server",
  "version": "1.0.0",
  "dependencies": {
    "express": "^4.18.2",
    "socket.io": "^4.7.2"
  }
}
```

### 2. Three.js Scene & Rendering

Create a high-performance Three.js scene that renders smoothly across browsers. Implement camera systems, lighting, and rendering optimizations. Ensure the game loads instantly with no loading screens.

Key implementation requirements:
- Set up a scene with proper perspective camera
- Configure WebGL renderer with appropriate settings
- Implement lighting that creates dramatic shadows while maintaining performance
- Add a basic ground plane with texture
- Create a game loop that maintains consistent performance

Implementation example:
```javascript
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 10, 20);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

const ambientLight = new THREE.AmbientLight(0x404040);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(10, 20, 10);
directionalLight.castShadow = true;
scene.add(directionalLight);

// Game loop
function animate() {
  requestAnimationFrame(animate);
  
  // Update game logic here
  
  renderer.render(scene, camera);
}
animate();
```

### 3. Vehicle System Implementation

Implement a comprehensive vehicle system with the 13 vehicles from Twisted Metal III, each with unique stats and characteristics. Create a flexible base class that allows for variations in speed, armor, damage, and handling.

Vehicle parameters:
| Vehicle | Speed | Armor | Damage | Handling |
|---------|-------|-------|--------|----------|
| Auger | 2/5 | 4/5 | 3/5 | 2/5 |
| Axel | 3/5 | 3/5 | 3/5 | 3/5 |
| Club Kid | 4/5 | 2/5 | 2/5 | 4/5 |
| Firestarter | 4/5 | 2/5 | 3/5 | 3/5 |
| Flower Power | 3/5 | 2/5 | 2/5 | 4/5 |
| Hammerhead | 2/5 | 4/5 | 3/5 | 2/5 |
| Mr. Grimm | 5/5 | 1/5 | 4/5 | 5/5 |
| Outlaw | 3/5 | 3/5 | 3/5 | 3/5 |
| Roadkill | 4/5 | 2/5 | 3/5 | 3/5 |
| Spectre | 5/5 | 1/5 | 3/5 | 4/5 |
| Thumper | 3/5 | 3/5 | 3/5 | 3/5 |
| Warthog | 2/5 | 5/5 | 3/5 | 2/5 |

Your implementation should feature:
- A base Vehicle class with common properties and methods
- Factory pattern for creating vehicle instances
- Physics behavior affected by vehicle stats
- Simplified collision boxes for performance
- Weapon mounting points
- Visual damage states

Implementation example:
```javascript
class Vehicle {
  constructor(type, config) {
    this.type = type;
    this.speed = config.speed;
    this.armor = config.armor;
    this.damage = config.damage;
    this.handling = config.handling;
    this.health = 100;
    this.maxHealth = 100;
    this.weapons = [new MachineGun()]; // Default weapon
    this.currentWeaponIndex = 0;
    this.mesh = null; // Three.js mesh to be set by subclasses
  }
  
  get currentWeapon() {
    return this.weapons[this.currentWeaponIndex];
  }
  
  switchWeapon() {
    this.currentWeaponIndex = (this.currentWeaponIndex + 1) % this.weapons.length;
    return this.currentWeapon;
  }
  
  addWeapon(weapon) {
    this.weapons.push(weapon);
  }
  
  updatePosition(controls, delta) {
    // Calculate movement based on speed and handling
    const acceleration = this.speed * 0.5;
    const turnRate = this.handling * 0.03;
    
    // Apply movement to mesh
    // Implementation details...
  }
  
  takeDamage(amount) {
    const actualDamage = amount * (1 - (this.armor * 0.15));
    this.health = Math.max(0, this.health - actualDamage);
    
    // Update visual damage state
    this.updateDamageVisuals();
    
    return this.health <= 0; // Return true if destroyed
  }
  
  fireWeapon(scene) {
    return this.currentWeapon.fire(this.mesh.position, this.mesh.rotation, scene);
  }
  
  updateDamageVisuals() {
    const damageLevel = 1 - (this.health / this.maxHealth);
    
    // Apply visual damage effects based on damage level
    // Implementation details...
  }
}
```

### 4. Physics & Movement System

Implement a physics system that provides satisfying vehicle movement while maintaining performance. Focus on arcade-style physics rather than simulation-level realism.

Key requirements:
- Vehicle acceleration, deceleration, and turning
- Collision detection with environment and other vehicles
- Physics-based reactions to collisions
- Optional terrain effects (slippery surfaces, rough terrain)

Implementation approach:
```javascript
class Physics {
  constructor() {
    this.gravity = -9.8;
    this.friction = 0.95;
  }
  
  applyVehiclePhysics(vehicle, controls, delta, colliders) {
    // Apply acceleration
    if (controls.forward) {
      vehicle.velocity.z -= vehicle.acceleration * delta;
    }
    if (controls.backward) {
      vehicle.velocity.z += vehicle.acceleration * delta * 0.6; // Slower backward
    }
    
    // Apply turning
    if (controls.left) {
      vehicle.rotation.y += vehicle.handling * delta;
    }
    if (controls.right) {
      vehicle.rotation.y -= vehicle.handling * delta;
    }
    
    // Apply friction
    vehicle.velocity.x *= this.friction;
    vehicle.velocity.z *= this.friction;
    
    // Update position
    vehicle.position.x += vehicle.velocity.x;
    vehicle.position.z += vehicle.velocity.z;
    
    // Handle collisions
    this.resolveCollisions(vehicle, colliders);
  }
  
  resolveCollisions(vehicle, colliders) {
    // Implement collision detection and resolution
    // Use simple bounding box or sphere collisions for performance
    // Push vehicles away from collision points
  }
}
```

### 5. Weapons System

Create a weapons system with different weapon types, firing mechanics, and damage calculations. Include pickups for special weapons and implement visual effects for weapon firing.

Weapon types:
1. Machine Gun (default) - Rapid fire, low damage
2. Homing Missile - Locks on and deals moderate damage
3. Freeze Missile - Freezes enemies for 5 seconds (no damage)
4. Special Weapons (optional) - Unique weapons for variety

Implementation approach:
```javascript
class Weapon {
  constructor(config) {
    this.name = config.name;
    this.damage = config.damage;
    this.cooldown = config.cooldown;
    this.lastFired = 0;
    this.projectileSpeed = config.projectileSpeed || 1;
    this.range = config.range || 100;
  }
  
  canFire(time) {
    return time - this.lastFired >= this.cooldown;
  }
  
  fire(position, rotation, scene, time) {
    if (!this.canFire(time)) return null;
    
    this.lastFired = time;
    
    // Create projectile
    const projectile = this.createProjectile(position, rotation);
    scene.add(projectile.mesh);
    
    // Play sound effect
    // this.playSound();
    
    return projectile;
  }
  
  createProjectile(position, rotation) {
    // Implementation specific to weapon type
  }
}

class MachineGun extends Weapon {
  constructor() {
    super({
      name: 'Machine Gun',
      damage: 5,
      cooldown: 100, // milliseconds
      projectileSpeed: 2,
      range: 50
    });
  }
  
  createProjectile(position, rotation) {
    // Create bullet projectile
    // ...
  }
}

class HomingMissile extends Weapon {
  constructor() {
    super({
      name: 'Homing Missile',
      damage: 20,
      cooldown: 2000, // milliseconds
      projectileSpeed: 0.8,
      range: 100
    });
  }
  
  createProjectile(position, rotation) {
    // Create missile projectile with homing capability
    // ...
  }
}
```

### 6. Washington D.C. Map

Design and implement the Washington D.C. map with key landmarks and proper collision boundaries. Create a rectangular arena approximately 10 seconds to drive across with the Washington Monument at the north and White House at the south.

Map requirements:
- Rectangular arena with appropriate scale
- Washington Monument structure on north side
- White House structure on south side
- Player spawn points at north side, facing the White House
- Advertising panels on outer walls
- Collision detection for all structures and walls

Implementation approach:
```javascript
class GameMap {
  constructor(scene) {
    this.scene = scene;
    this.objects = [];
    this.colliders = [];
    this.spawnPoints = [];
    this.pickupSpawnPoints = [];
  }
  
  create() {
    // Create ground
    const groundGeometry = new THREE.PlaneGeometry(200, 200);
    const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);
    
    // Add boundary walls
    this.addBoundaryWalls();
    
    // Add Washington Monument
    this.addWashingtonMonument();
    
    // Add White House
    this.addWhiteHouse();
    
    // Add spawn points
    this.createSpawnPoints();
    
    // Add pickup spawn points
    this.createPickupSpawnPoints();
    
    // Add advertising panels
    this.addAdvertisingPanels();
    
    return this;
  }
  
  addWashingtonMonument() {
    // Create simplified Washington Monument model
    const monumentGeometry = new THREE.CylinderGeometry(2, 5, 40, 4);
    const monumentMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });
    const monument = new THREE.Mesh(monumentGeometry, monumentMaterial);
    monument.position.set(0, 20, -90);
    monument.castShadow = true;
    this.scene.add(monument);
    
    // Add to colliders
    const collider = new THREE.Box3().setFromObject(monument);
    this.colliders.push(collider);
  }
  
  addWhiteHouse() {
    // Create simplified White House model
    const whiteHouseGeometry = new THREE.BoxGeometry(40, 15, 20);
    const whiteHouseMaterial = new THREE.MeshStandardMaterial({ color: 0xf0f0f0 });
    const whiteHouse = new THREE.Mesh(whiteHouseGeometry, whiteHouseMaterial);
    whiteHouse.position.set(0, 7.5, 90);
    whiteHouse.castShadow = true;
    this.scene.add(whiteHouse);
    
    // Add to colliders
    const collider = new THREE.Box3().setFromObject(whiteHouse);
    this.colliders.push(collider);
  }
  
  // Other map building methods...
}
```

### 7. Multiplayer Implementation

Implement robust multiplayer functionality using Socket.io, allowing players to join the same game instance and cooperatively battle the boss. Handle player synchronization, game state management, and network optimization.

Key requirements:
- Real-time position and rotation synchronization
- Player joining and leaving handling
- Game state synchronization
- Weapon firing and damage synchronization
- Latency compensation techniques

Server implementation example:
```javascript
const io = require('socket.io')(server);
const gameState = {
  players: new Map(),
  boss: null,
  pickups: [],
  bossKillStreak: 0
};

io.on('connection', (socket) => {
  console.log('Player connected:', socket.id);
  
  socket.on('join', ({ username, vehicle }) => {
    // Create player object
    const player = {
      id: socket.id,
      username,
      vehicle,
      position: { x: 0, y: 0, z: -70 },
      rotation: { x: 0, y: 0, z: 0 },
      health: 100,
      killStreak: 0
    };
    
    // Add to gameState
    gameState.players.set(socket.id, player);
    
    // Notify other players
    socket.broadcast.emit('playerJoined', player);
    
    // Send current game state to new player
    socket.emit('gameState', {
      players: Array.from(gameState.players.values()),
      boss: gameState.boss,
      pickups: gameState.pickups
    });
    
    // Spawn or scale boss if needed
    updateBossDifficulty();
  });
  
  socket.on('updatePosition', (data) => {
    const player = gameState.players.get(socket.id);
    if (player) {
      player.position = data.position;
      player.rotation = data.rotation;
      
      // Broadcast to other players
      socket.broadcast.emit('playerMoved', {
        id: socket.id,
        position: data.position,
        rotation: data.rotation
      });
    }
  });
  
  socket.on('fireWeapon', (data) => {
    // Handle weapon firing
    // Broadcast to other players
    socket.broadcast.emit('playerFired', {
      id: socket.id,
      weaponType: data.weaponType,
      projectileId: data.projectileId,
      position: data.position,
      direction: data.direction
    });
  });
  
  socket.on('hitTarget', (data) => {
    // Process hit on target (player or boss)
    if (data.targetType === 'boss' && gameState.boss) {
      const damage = data.damage;
      gameState.boss.health -= damage;
      
      if (gameState.boss.health <= 0) {
        handleBossDefeat(socket.id);
      } else {
        // Broadcast boss damage
        io.emit('bossHit', {
          health: gameState.boss.health,
          attackerId: socket.id
        });
      }
    } else if (data.targetType === 'player') {
      const targetPlayer = gameState.players.get(data.targetId);
      if (targetPlayer) {
        targetPlayer.health -= data.damage;
        
        if (targetPlayer.health <= 0) {
          handlePlayerDefeat(data.targetId, socket.id);
        } else {
          // Broadcast player damage
          io.emit('playerHit', {
            id: data.targetId,
            health: targetPlayer.health,
            attackerId: socket.id
          });
        }
      }
    }
  });
  
  socket.on('disconnect', () => {
    // Remove player from game
    gameState.players.delete(socket.id);
    
    // Notify other players
    io.emit('playerLeft', socket.id);
    
    // Update boss difficulty
    updateBossDifficulty();
  });
});

function updateBossDifficulty() {
  const playerCount = gameState.players.size;
  
  if (playerCount > 0 && !gameState.boss) {
    // Spawn boss
    spawnBoss(1 + (gameState.bossKillStreak * 0.2));
  } else if (gameState.boss) {
    // Scale boss based on player count
    const difficulty = 1 + (0.5 * playerCount) + (gameState.bossKillStreak * 0.2);
    scaleBossDifficulty(difficulty);
  }
}

function handleBossDefeat(killerId) {
  // Increment kill streak for player
  const killer = gameState.players.get(killerId);
  if (killer) {
    killer.killStreak++;
    io.emit('updateKillStreak', {
      id: killerId,
      killStreak: killer.killStreak
    });
  }
  
  // Increment global boss kill streak
  gameState.bossKillStreak++;
  io.emit('bossDefeated', {
    killerId,
    bossKillStreak: gameState.bossKillStreak
  });
  
  // Spawn pickups
  spawnPickups(gameState.boss.position, 3 + Math.floor(gameState.bossKillStreak / 2));
  
  // Respawn stronger boss after delay
  gameState.boss = null;
  setTimeout(() => {
    if (gameState.players.size > 0) {
      spawnBoss(1 + (gameState.bossKillStreak * 0.2));
    }
  }, 10000); // 10 second respawn delay
}
```

Client implementation example:
```javascript
const socket = io();

socket.on('connect', () => {
  console.log('Connected to server');
  
  // Join game with selected vehicle
  socket.emit('join', {
    username: playerName,
    vehicle: selectedVehicle
  });
});

socket.on('gameState', (state) => {
  // Initialize game with received state
  initializeGameState(state);
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
  updatePlayerPosition(data.id, data.position, data.rotation);
});

// Additional socket event handlers...

// Update loop to send player position
function updateGameState() {
  if (localPlayer) {
    socket.emit('updatePosition', {
      position: localPlayer.mesh.position.clone(),
      rotation: localPlayer.mesh.rotation.clone()
    });
  }
}
```

### 8. AI Boss Implementation (Semi-Trump)

Create an intelligent AI boss that scales in difficulty with player count and provides a challenging opponent. Implement Semi-Trump as a large semi-truck with Donald Trump hanging out the window, complete with trash-talking and aggressive behavior.

AI requirements:
- State machine for AI behavior (patrolling, chasing, attacking, retreating)
- Pathfinding to track and chase players
- Difficulty scaling based on player count and kill streak
- Special attacks: ramming, freeze missiles, flamethrowers
- Visual and audio feedback for boss state changes

Implementation approach:
```javascript
class SemiTrump {
  constructor(scene, difficulty = 1) {
    this.scene = scene;
    this.difficulty = difficulty;
    this.health = 100 * difficulty;
    this.maxHealth = 100 * difficulty;
    this.damage = 10 * (1 + (difficulty * 0.2));
    this.speed = 0.2 * (1 + (difficulty * 0.3));
    this.currentState = 'spawning';
    this.target = null;
    this.lastAttackTime = 0;
    this.attackCooldown = 3000 / difficulty; // milliseconds
    this.mesh = this.createMesh();
    
    // AI state machine timers
    this.stateTimer = 0;
    this.stateTimeout = 5000; // 5 seconds default
    
    // Weapon systems
    this.weapons = [
      new FreezeMissile(),
      new Flamethrower()
    ];
    this.currentWeaponIndex = 0;
  }
  
  createMesh() {
    // Create the semi-truck mesh
    const truckGroup = new THREE.Group();
    
    // Create cabin
    const cabinGeometry = new THREE.BoxGeometry(5, 5, 8);
    const cabinMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
    const cabin = new THREE.Mesh(cabinGeometry, cabinMaterial);
    cabin.position.set(0, 2.5, -3);
    truckGroup.add(cabin);
    
    // Create trailer
    const trailerGeometry = new THREE.BoxGeometry(5, 6, 15);
    const trailerMaterial = new THREE.MeshStandardMaterial({ color: 0x222222 });
    const trailer = new THREE.Mesh(trailerGeometry, trailerMaterial);
    trailer.position.set(0, 3, 6);
    truckGroup.add(trailer);
    
    // Create wheels
    // ...
    
    // Create Trump character in window
    // ...
    
    return truckGroup;
  }
  
  update(players, delta, time) {
    if (players.length === 0) return;
    
    // Update state timer
    this.stateTimer += delta * 1000;
    if (this.stateTimer >= this.stateTimeout) {
      this.transitionState(players);
    }
    
    // Execute current state behavior
    switch(this.currentState) {
      case 'spawning':
        this.handleSpawningState(delta);
        break;
      case 'patrolling':
        this.handlePatrollingState(players, delta);
        break;
      case 'chasing':
        this.handleChasingState(players, delta);
        break;
      case 'attacking':
        this.handleAttackingState(players, delta, time);
        break;
      case 'enraged':
        this.handleEnragedState(players, delta, time);
        break;
      case 'retreating':
        this.handleRetreatingState(delta);
        break;
    }
    
    // Update visual effects based on health
    this.updateVisualEffects();
  }
  
  transitionState(players) {
    // Reset state timer
    this.stateTimer = 0;
    
    // Determine next state based on current state and conditions
    switch(this.currentState) {
      case 'spawning':
        this.currentState = 'patrolling';
        this.stateTimeout = 8000;
        break;
      case 'patrolling':
        this.findTarget(players);
        if (this.target) {
          this.currentState = 'chasing';
          this.stateTimeout = 10000; // Chase for up to 10 seconds
        } else {
          this.stateTimeout = 8000; // Continue patrolling
        }
        break;
      case 'chasing':
        if (this.isTargetInRange()) {
          this.currentState = 'attacking';
          this.stateTimeout = 5000;
        } else {
          this.findTarget(players); // Try to find a new target
          if (!this.target) {
            this.currentState = 'patrolling';
            this.stateTimeout = 8000;
          } else {
            this.stateTimeout = 10000; // Continue chasing
          }
        }
        break;
      // Additional state transitions...
    }
    
    // Play state transition effects/sounds
    this.playStateTransitionEffects();
  }
  
  findTarget(players) {
    if (players.length === 0) {
      this.target = null;
      return;
    }
    
    // Find closest player or random player based on AI behavior
    if (Math.random() < 0.7) {
      // 70% chance to target closest player
      let closestPlayer = null;
      let closestDistance = Infinity;
      
      players.forEach(player => {
        const distance = this.mesh.position.distanceTo(player.mesh.position);
        if (distance < closestDistance) {
          closestDistance = distance;
          closestPlayer = player;
        }
      });
      
      this.target = closestPlayer;
    } else {
      // 30% chance to target random player
      const randomIndex = Math.floor(Math.random() * players.length);
      this.target = players[randomIndex];
    }
  }
  
  // Additional AI behavior methods...
}
```

### 9. Portal System

Implement the required portal system with proper interaction and URL parameter handling as specified in the competition requirements. Place the exit portal at the Washington Monument and support the required GET parameters.

Portal requirements:
- Exit portal near Washington Monument
- Redirect to http://portal.pieter.com with required GET parameters
- Support for incoming portal parameters
- Visual effects for portals

Implementation example:
```javascript
class Portal {
  constructor(type, position, targetUrl = '') {
    this.type = type; // 'exit' or 'entry'
    this.position = position;
    this.targetUrl = targetUrl;
    this.mesh = this.createMesh();
    this.active = true;
    this.hitbox = new THREE.Sphere(this.position, 5); // 5 units radius for collision
  }
  
  createMesh() {
    const group = new THREE.Group();
    
    // Create portal ring
    const ringGeometry = new THREE.TorusGeometry(4, 0.5, 16, 32);
    const ringMaterial = new THREE.MeshStandardMaterial({ 
      color: this.type === 'exit' ? 0x00aaff : 0xff00aa,
      emissive: this.type === 'exit' ? 0x0044aa : 0xaa0044,
      emissiveIntensity: 0.5
    });
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.rotation.x = Math.PI / 2; // Make it horizontal
    group.add(ring);
    
    // Create portal effect (particle system or shader)
    // ...
    
    // Position at the specified location
    group.position.copy(this.position);
    
    return group;
  }
  
  checkCollision(object) {
    if (!this.active) return false;
    
    // Simple distance-based collision check
    const distance = object.position.distanceTo(this.position);
    return distance < 5; // 5 units collision radius
  }
  
  onEnter(player) {
    if (this.type === 'exit') {
      // Construct URL with parameters
      let url = this.targetUrl;
      url += `?username=${encodeURIComponent(player.username)}`;
      url += `&color=${encodeURIComponent(player.color || 'blue')}`;
      url += `&speed=${encodeURIComponent(player.vehicle.speed)}`;
      url += `&ref=${encodeURIComponent(window.location.href)}`;
      
      // Redirect to portal URL
      window.location.href = url;
    }
  }
}

// Portal system setup
function setupPortals(scene) {
  // Create exit portal near Washington Monument
  const exitPortal = new Portal(
    'exit',
    new THREE.Vector3(0, 0.5, -80), // Near Washington Monument
    'http://portal.pieter.com'
  );
  scene.add(exitPortal.mesh);
  
  // Check for entry portal parameters
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('portal') === 'true') {
    // Player is coming from a portal
    const username = urlParams.get('username') || 'Player';
    const color = urlParams.get('color') || 'blue';
    const speed = parseFloat(urlParams.get('speed')) || 3;
    const ref = urlParams.get('ref') || '';
    
    // Create entry portal effect
    const entryPortal = new Portal(
      'entry',
      new THREE.Vector3(0, 0.5, -60), // Spawn location
      ref
    );
    scene.add(entryPortal.mesh);
    
    // Apply parameters to player
    playerConfig = {
      username,
      color,
      vehicleOverrides: {
        speed
      },
      spawnAtPortal: true
    };
    
    // Animate entry effect
    animatePortalEntry(entryPortal);
  }
  
  return { exitPortal };
}
```

### 10. Competition Requirements

Ensure the implementation meets all Vibe Jam 2025 competition requirements, particularly the badge placement, load time optimization, and hosting configuration.

Key requirements:
- Game must load instantly with no loading screens
- Include the Vibe Jam badge in the specified position
- Proper portal integration
- Web-based with no login requirements
- Hosted on a custom domain

Implementation example:
```javascript
function setupCompetitionRequirements() {
  // Add Vibe Jam badge
  const badgeElement = document.createElement('a');
  badgeElement.target = '_blank';
  badgeElement.href = 'https://jam.pieter.com';
  badgeElement.style.fontFamily = 'system-ui, sans-serif';
  badgeElement.style.position = 'fixed';
  badgeElement.style.bottom = '-1px';
  badgeElement.style.right = '-1px';
  badgeElement.style.padding = '7px';
  badgeElement.style.fontSize = '14px';
  badgeElement.style.fontWeight = 'bold';
  badgeElement.style.background = '#fff';
  badgeElement.style.color = '#000';
  badgeElement.style.textDecoration = 'none';
  badgeElement.style.zIndex = '10000';
  badgeElement.style.borderTopLeftRadius = '12px';
  badgeElement.style.border = '1px solid #fff';
  badgeElement.textContent = '🕹️ Vibe Jam 2025';
  document.body.appendChild(badgeElement);
  
  // Implement instant loading optimizations
  setupProgressiveLoading();
  preloadCriticalAssets();
  optimizeInitialRender();
}

function setupProgressiveLoading() {
  // Show game immediately with minimal assets
  // Load remaining assets in background
  // Use level-of-detail system for models
}

function preloadCriticalAssets() {
  // Only preload absolute minimum required assets
  // Use low-poly placeholders initially
  // Implement progressive texture loading
}

function optimizeInitialRender() {
  // Reduce initial draw calls
  // Use simplified lighting for first render
  // Defer non-critical initialization
}
```

## Asset Generation Prompts

### Vehicle Models

Generate low-poly 3D models for all 13 Twisted Metal III vehicles with these specifications:
- Triangular mesh with 300-500 polygons per vehicle
- Each vehicle should have distinctive silhouette and characteristics
- Textured with flat colors and minimal details for performance
- Optimized for Three.js rendering
- Include appropriate collision bounding boxes
- Support for damage states (3 levels of visible damage)

For the Semi-Trump boss vehicle:
- Semi-truck model with 600-800 polygons
- Distinctive truck cab and trailer sections
- Driver-side window with visible Donald Trump character
- Exaggerated design with menacing features
- Weapon mounting points for freeze missiles and flamethrower

### Map Assets

Generate low-poly models for Washington D.C. landmarks:
- Washington Monument: Simplified white obelisk (150-200 polygons)
- White House: Recognizable but simplified building (300-400 polygons)
- Road textures: Urban asphalt with minimal detail
- Boundary walls: Simple barriers with ad panel placeholders
- Environment props: Street lights, barriers, destroyed vehicles (100-150 polygons each)

### Effects & UI

Generate particle effect textures and UI components:
- Weapon fire effects (muzzle flash, projectile trails)
- Impact effects (explosions, sparks, smoke)
- Damage effects (fire, smoke, electrical sparks)
- Portal effects (swirling, glowing particles)
- UI components (vehicle selection screen, HUD elements, health indicators)

## Optimization Instructions

The game must load instantly, meeting these performance targets:
- Initial load time under 2 seconds
- Consistent 60 FPS on mid-range devices
- Support for at least 8 simultaneous players
- Minimal network bandwidth usage
- Mobile browser compatibility

Implement these optimization techniques:
- Asset compression and format optimization
- Level-of-detail (LOD) system for models
- Occlusion culling for off-screen objects
- Instanced rendering for similar objects
- Efficient lighting with baked shadows where possible
- Network message batching and delta compression
- WebGL renderer optimizations (object pooling, draw call batching)
- Progressive asset loading (show game before all assets are loaded)

## Browser Compatibility

Ensure the game functions correctly across all major browsers:
- Chrome, Firefox, Safari, and Edge
- Mobile browsers on iOS and Android
- Different screen sizes and aspect ratios
- Touch controls for mobile devices
- Fallbacks for WebGL features not supported universally

## Integration & Deployment

Prepare the application for deployment with these configurations:
- Frontend build process (bundling, minification)
- Backend server deployment configuration
- Domain and SSL certificate setup
- Performance monitoring integration
- Error tracking and reporting

The deployment should allow for:
- Easy updates and hotfixes
- Scaling for increased player counts
- Analytics for tracking game usage
- Minimal server costs during low-usage periods

This document provides comprehensive instructions for an AI system to implement every aspect of the vehicular combat game. By following these prompts, an AI should be able to generate high-quality, optimized code that meets all the requirements for the Vibe Jam 2025 competition. 