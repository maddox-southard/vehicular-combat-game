import * as THREE from 'three';

/**
 * AI-controlled Semi-Trump boss enemy
 */
export class SemiTrump {
  /**
   * Create a new Semi-Trump boss
   * @param {THREE.Scene} scene The game scene
   * @param {number} difficulty Difficulty level (1.0 = normal)
   */
  constructor(scene, difficulty = 1) {
    this.scene = scene;
    this.difficulty = difficulty;

    // Stats scaled by difficulty
    this.maxHealth = 100 * difficulty;
    this.health = this.maxHealth;
    this.damage = 10 * (1 + (difficulty * 0.2));
    this.speed = 0.2 * (1 + (difficulty * 0.3));
    this.turnRate = 0.01 * (1 + (difficulty * 0.2));

    // AI state machine
    this.currentState = 'spawning';
    this.previousState = '';
    this.stateTimer = 0;
    this.stateTimeout = 3000; // 3 seconds for spawning state

    // Target tracking
    this.target = null;
    this.targetTimer = 0;
    this.targetTimeout = 5000; // 5 seconds before finding a new target

    // Attack cooldowns
    this.lastAttackTime = 0;
    this.attackCooldown = 3000 / difficulty; // milliseconds

    // Movement
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.targetPosition = new THREE.Vector3(0, 0, 0);

    // Weapon systems
    this.currentWeapon = 'ram'; // ram, freezeMissile, flamethrower
    this.weaponCooldowns = {
      ram: 2000,
      freezeMissile: 5000,
      flamethrower: 3000
    };
    this.lastWeaponUse = {
      ram: 0,
      freezeMissile: 0,
      flamethrower: 0
    };

    // Create the mesh
    this.mesh = this.createMesh();

    // Mesh and physics
    this.boundingBox = new THREE.Box3().setFromObject(this.mesh);
  }

  /**
   * Create the Semi-Trump mesh
   * @returns {THREE.Group} The mesh group
   */
  createMesh() {
    const group = new THREE.Group();

    // Create the semi-truck mesh
    const truckGroup = new THREE.Group();

    // Create cabin
    const cabinGeometry = new THREE.BoxGeometry(5, 5, 8);
    const cabinMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
    const cabin = new THREE.Mesh(cabinGeometry, cabinMaterial);
    cabin.position.set(0, 2.5, -3);
    cabin.castShadow = true;
    cabin.receiveShadow = true;
    truckGroup.add(cabin);

    // Create trailer
    const trailerGeometry = new THREE.BoxGeometry(5, 6, 15);
    const trailerMaterial = new THREE.MeshStandardMaterial({ color: 0x222222 });
    const trailer = new THREE.Mesh(trailerGeometry, trailerMaterial);
    trailer.position.set(0, 3, 6);
    trailer.castShadow = true;
    trailer.receiveShadow = true;
    truckGroup.add(trailer);

    // Create wheels
    const wheelGeometry = new THREE.CylinderGeometry(1, 1, 0.7, 12);
    const wheelMaterial = new THREE.MeshStandardMaterial({ color: 0x111111 });

    // Cabin wheels
    const wheelPositions = [
      { x: -2.5, y: 1, z: -6 },
      { x: 2.5, y: 1, z: -6 },
      { x: -2.5, y: 1, z: 0 },
      { x: 2.5, y: 1, z: 0 }
    ];

    wheelPositions.forEach(pos => {
      const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
      wheel.position.set(pos.x, pos.y, pos.z);
      wheel.rotation.z = Math.PI / 2;
      wheel.castShadow = true;
      wheel.receiveShadow = true;
      truckGroup.add(wheel);
    });

    // Trailer wheels
    const trailerWheelPositions = [
      { x: -2.5, y: 1, z: 6 },
      { x: 2.5, y: 1, z: 6 },
      { x: -2.5, y: 1, z: 9 },
      { x: 2.5, y: 1, z: 9 },
      { x: -2.5, y: 1, z: 12 },
      { x: 2.5, y: 1, z: 12 }
    ];

    trailerWheelPositions.forEach(pos => {
      const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
      wheel.position.set(pos.x, pos.y, pos.z);
      wheel.rotation.z = Math.PI / 2;
      wheel.castShadow = true;
      wheel.receiveShadow = true;
      truckGroup.add(wheel);
    });

    // Create Trump character in window
    const trumpHead = new THREE.Group();

    // Head
    const headGeometry = new THREE.SphereGeometry(0.8, 16, 16);
    const headMaterial = new THREE.MeshStandardMaterial({ color: 0xffccaa });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    trumpHead.add(head);

    // Hair
    const hairGeometry = new THREE.BoxGeometry(1.7, 0.6, 1.2);
    const hairMaterial = new THREE.MeshStandardMaterial({ color: 0xffffaa });
    const hair = new THREE.Mesh(hairGeometry, hairMaterial);
    hair.position.set(0, 0.6, 0);
    trumpHead.add(hair);

    // Position Trump in driver's window
    trumpHead.position.set(-2.5, 4, -3);
    truckGroup.add(trumpHead);

    // Add lights
    const headlightGeometry = new THREE.CylinderGeometry(0.5, 0.5, 0.2, 12);
    const headlightMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffcc,
      emissive: 0xffffcc,
      emissiveIntensity: 0.5
    });

    const leftHeadlight = new THREE.Mesh(headlightGeometry, headlightMaterial);
    leftHeadlight.position.set(-2, 2, -7);
    leftHeadlight.rotation.x = Math.PI / 2;
    truckGroup.add(leftHeadlight);

    const rightHeadlight = new THREE.Mesh(headlightGeometry, headlightMaterial);
    rightHeadlight.position.set(2, 2, -7);
    rightHeadlight.rotation.x = Math.PI / 2;
    truckGroup.add(rightHeadlight);

    // Add a bull bar at the front
    const bullBarGeometry = new THREE.BoxGeometry(6, 3, 0.5);
    const bullBarMaterial = new THREE.MeshStandardMaterial({ color: 0x777777 });
    const bullBar = new THREE.Mesh(bullBarGeometry, bullBarMaterial);
    bullBar.position.set(0, 2, -7.25);
    truckGroup.add(bullBar);

    // Add exhaust pipes
    const exhaustGeometry = new THREE.CylinderGeometry(0.3, 0.3, 5, 8);
    const exhaustMaterial = new THREE.MeshStandardMaterial({ color: 0x666666 });

    const leftExhaust = new THREE.Mesh(exhaustGeometry, exhaustMaterial);
    leftExhaust.position.set(-2.5, 6, -3);
    leftExhaust.rotation.x = Math.PI / 2;
    truckGroup.add(leftExhaust);

    const rightExhaust = new THREE.Mesh(exhaustGeometry, exhaustMaterial);
    rightExhaust.position.set(2.5, 6, -3);
    rightExhaust.rotation.x = Math.PI / 2;
    truckGroup.add(rightExhaust);

    // Add the truck to the main group
    group.add(truckGroup);

    // Add health indicator
    this.healthBar = this.createHealthBar();
    group.add(this.healthBar);

    return group;
  }

  /**
   * Create the health bar mesh
   * @returns {THREE.Group} The health bar mesh
   */
  createHealthBar() {
    const group = new THREE.Group();

    // Create background bar
    const bgGeometry = new THREE.PlaneGeometry(6, 0.6);
    const bgMaterial = new THREE.MeshBasicMaterial({ color: 0x333333 });
    const background = new THREE.Mesh(bgGeometry, bgMaterial);
    group.add(background);

    // Create foreground health bar
    const fgGeometry = new THREE.PlaneGeometry(6, 0.6);
    const fgMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    this.healthBarFill = new THREE.Mesh(fgGeometry, fgMaterial);
    this.healthBarFill.position.z = 0.01; // Slightly in front of background
    this.healthBarFill.scale.x = 1.0; // Full health to start
    group.add(this.healthBarFill);

    // Position above the boss
    group.position.set(0, 10, 0);
    group.rotation.x = -Math.PI / 6; // Tilt towards camera

    // Billboard behavior (face camera) will be handled in update

    return group;
  }

  /**
   * Update the health bar to reflect current health
   */
  updateHealthBar() {
    const healthPercent = this.health / this.maxHealth;
    this.healthBarFill.scale.x = Math.max(0.01, healthPercent);
    this.healthBarFill.position.x = -3 * (1 - healthPercent) / 2;

    // Update color based on health
    if (healthPercent > 0.6) {
      this.healthBarFill.material.color.setHex(0x00ff00); // Green
    } else if (healthPercent > 0.3) {
      this.healthBarFill.material.color.setHex(0xffff00); // Yellow
    } else {
      this.healthBarFill.material.color.setHex(0xff0000); // Red
    }
  }

  /**
   * Update the boss AI and position
   * @param {Array<Object>} players Array of player objects
   * @param {number} delta Time since last update in seconds
   * @param {number} time Current time in milliseconds
   */
  update(players, delta, time) {
    if (players.length === 0) return;

    // Update state timer
    this.stateTimer += delta * 1000;

    // Check for state transition
    if (this.stateTimer >= this.stateTimeout) {
      this.transitionState(players, time);
    }

    // Execute current state behavior
    switch (this.currentState) {
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
    this.updateVisualEffects(delta, time);

    // Update health bar
    this.updateHealthBar();

    // Make health bar face camera
    const camera = this.scene.getObjectByProperty('type', 'PerspectiveCamera') ||
      this.scene.getObjectByProperty('type', 'OrthographicCamera');
    if (camera) {
      const cameraPosition = new THREE.Vector3();
      camera.getWorldPosition(cameraPosition);
      this.healthBar.lookAt(cameraPosition);
    }

    // Update bounding box
    this.boundingBox.setFromObject(this.mesh);
  }

  /**
   * Transition to a new state based on current conditions
   * @param {Array<Object>} players Array of player objects
   * @param {number} time Current time
   */
  transitionState(players, time) {
    // Store previous state
    this.previousState = this.currentState;

    // Reset state timer
    this.stateTimer = 0;

    // Determine next state based on current state and conditions
    switch (this.currentState) {
      case 'spawning':
        this.currentState = 'patrolling';
        this.stateTimeout = 8000;
        console.log('Boss state: patrolling');
        break;

      case 'patrolling':
        this.findTarget(players);
        if (this.target) {
          this.currentState = 'chasing';
          this.stateTimeout = 10000; // Chase for up to 10 seconds
          console.log('Boss state: chasing');
        } else {
          this.stateTimeout = 8000; // Continue patrolling
        }
        break;

      case 'chasing':
        if (this.isTargetInRange()) {
          this.currentState = 'attacking';
          this.stateTimeout = 5000;
          console.log('Boss state: attacking');
        } else {
          this.findTarget(players); // Try to find a new target
          if (!this.target) {
            this.currentState = 'patrolling';
            this.stateTimeout = 8000;
            console.log('Boss state: patrolling');
          } else {
            this.stateTimeout = 10000; // Continue chasing
          }
        }
        break;

      case 'attacking':
        // After attacking, go back to chasing or patrolling
        if (this.health < this.maxHealth * 0.3 && Math.random() < 0.7) {
          this.currentState = 'retreating';
          this.stateTimeout = 6000;
          console.log('Boss state: retreating');
        } else if (this.health < this.maxHealth * 0.3 && Math.random() < 0.5) {
          this.currentState = 'enraged';
          this.stateTimeout = 8000;
          console.log('Boss state: enraged');
        } else {
          this.findTarget(players);
          if (this.target) {
            this.currentState = 'chasing';
            this.stateTimeout = 10000;
            console.log('Boss state: chasing');
          } else {
            this.currentState = 'patrolling';
            this.stateTimeout = 8000;
            console.log('Boss state: patrolling');
          }
        }
        break;

      case 'enraged':
        // After enraged, go back to attacking or retreating
        if (this.health < this.maxHealth * 0.15) {
          this.currentState = 'retreating';
          this.stateTimeout = 6000;
          console.log('Boss state: retreating');
        } else {
          this.currentState = 'attacking';
          this.stateTimeout = 5000;
          console.log('Boss state: attacking');
        }
        break;

      case 'retreating':
        // After retreating, go back to patrolling or become enraged
        if (this.health < this.maxHealth * 0.2 && Math.random() < 0.7) {
          this.currentState = 'enraged';
          this.stateTimeout = 8000;
          console.log('Boss state: enraged');
        } else {
          this.currentState = 'patrolling';
          this.stateTimeout = 8000;
          console.log('Boss state: patrolling');
        }
        break;
    }

    // Play state transition effects/sounds
    this.playStateTransitionEffects();
  }

  /**
   * Find a target player to chase
   * @param {Array<Object>} players Array of player objects
   */
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
        const distance = this.mesh.position.distanceTo(player.vehicle.mesh.position);
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

    // Reset target timer
    this.targetTimer = 0;
  }

  /**
   * Check if current target is in attack range
   * @returns {boolean} True if target is in range
   */
  isTargetInRange() {
    if (!this.target) return false;

    const distance = this.mesh.position.distanceTo(this.target.vehicle.mesh.position);
    return distance < 15; // 15 units attack range
  }

  /**
   * Generate a random point to patrol towards
   * @returns {THREE.Vector3} Target patrol position
   */
  getPatrolPoint() {
    // Get random position within the map (we're assuming a 200x200 map)
    const x = (Math.random() - 0.5) * 160;
    const z = (Math.random() - 0.5) * 160;
    return new THREE.Vector3(x, 0, z);
  }

  /**
   * Handle spawning state (boss is materializing)
   * @param {number} delta Time since last update
   */
  handleSpawningState(delta) {
    // Visual effect for spawning (scale up)
    const progress = Math.min(1, this.stateTimer / this.stateTimeout);
    this.mesh.scale.set(progress, progress, progress);
  }

  /**
   * Handle patrolling state (moving to random points)
   * @param {Array<Object>} players Array of player objects
   * @param {number} delta Time since last update
   */
  handlePatrollingState(players, delta) {
    // If we don't have a patrol point, get one
    if (!this.targetPosition.lengthSq() ||
      this.mesh.position.distanceTo(this.targetPosition) < 10) {
      this.targetPosition = this.getPatrolPoint();
    }

    // Move towards patrol point
    this.moveTowards(this.targetPosition, this.speed * 0.7, delta);

    // Occasionally check for players to target
    this.targetTimer += delta * 1000;
    if (this.targetTimer > 2000) { // Check every 2 seconds
      this.findTarget(players);
    }
  }

  /**
   * Handle chasing state (pursuing a targeted player)
   * @param {Array<Object>} players Array of player objects
   * @param {number} delta Time since last update
   */
  handleChasingState(players, delta) {
    // If no target or target is dead/disconnected, find a new one
    if (!this.target || !players.some(p => p.id === this.target.id)) {
      this.findTarget(players);
      if (!this.target) {
        // No targets available, go back to patrolling
        this.currentState = 'patrolling';
        this.stateTimeout = 8000;
        this.stateTimer = 0;
        return;
      }
    }

    // Chase target
    const targetPosition = this.target.vehicle.mesh.position.clone();
    this.moveTowards(targetPosition, this.speed, delta);

    // Update target timer
    this.targetTimer += delta * 1000;
    if (this.targetTimer > this.targetTimeout) {
      this.findTarget(players); // Switch targets occasionally
    }
  }

  /**
   * Handle attacking state
   * @param {Array<Object>} players Array of player objects
   * @param {number} delta Time since last update
   * @param {number} time Current time
   */
  handleAttackingState(players, delta, time) {
    // If no target or target is dead/disconnected, find a new one
    if (!this.target || !players.some(p => p.id === this.target.id)) {
      this.findTarget(players);
      if (!this.target) {
        // No targets available, go back to patrolling
        this.currentState = 'patrolling';
        this.stateTimeout = 8000;
        this.stateTimer = 0;
        return;
      }
    }

    // Circle around the target
    const targetPosition = this.target.vehicle.mesh.position.clone();
    const directionToTarget = targetPosition.clone().sub(this.mesh.position).normalize();
    const perpendicular = new THREE.Vector3(-directionToTarget.z, 0, directionToTarget.x);

    // Calculate circle point
    const circleRadius = 12;
    const circlePoint = targetPosition.clone().add(
      perpendicular.multiplyScalar(circleRadius)
    );

    // Move towards circle point
    this.moveTowards(circlePoint, this.speed * 0.8, delta);

    // Face towards the target
    this.lookAt(targetPosition);

    // Attack if cooldown has elapsed
    if (time - this.lastAttackTime > this.attackCooldown) {
      this.attack(time);
    }
  }

  /**
   * Handle enraged state (faster movement, more aggressive attacks)
   * @param {Array<Object>} players Array of player objects
   * @param {number} delta Time since last update
   * @param {number} time Current time
   */
  handleEnragedState(players, delta, time) {
    // Similar to attacking but more aggressive and faster
    if (!this.target || !players.some(p => p.id === this.target.id)) {
      this.findTarget(players);
      if (!this.target) return;
    }

    // Charge directly at the target
    const targetPosition = this.target.vehicle.mesh.position.clone();
    this.moveTowards(targetPosition, this.speed * 1.5, delta);

    // Attack more frequently
    if (time - this.lastAttackTime > this.attackCooldown * 0.6) {
      this.attack(time);
    }
  }

  /**
   * Handle retreating state (move away from players to recover)
   * @param {number} delta Time since last update
   */
  handleRetreatingState(delta) {
    // If we have a target, move away from it
    if (this.target) {
      const directionToTarget = this.target.vehicle.mesh.position.clone()
        .sub(this.mesh.position).normalize();

      // Retreat position is in opposite direction
      const retreatPosition = this.mesh.position.clone().sub(
        directionToTarget.multiplyScalar(50)
      );

      // Move towards retreat position
      this.moveTowards(retreatPosition, this.speed * 0.8, delta);
    } else {
      // No target, just move to a random point
      if (!this.targetPosition.lengthSq() ||
        this.mesh.position.distanceTo(this.targetPosition) < 10) {
        this.targetPosition = this.getPatrolPoint();
      }

      this.moveTowards(this.targetPosition, this.speed * 0.8, delta);
    }

    // Slowly recover health during retreat
    this.health = Math.min(this.maxHealth, this.health + delta * 3);
  }

  /**
   * Move towards a target position
   * @param {THREE.Vector3} targetPosition Position to move towards
   * @param {number} speed Speed to move at
   * @param {number} delta Time since last update
   */
  moveTowards(targetPosition, speed, delta) {
    // Get direction to target
    const direction = targetPosition.clone().sub(this.mesh.position).normalize();

    // Calculate desired velocity
    this.velocity.x = direction.x * speed;
    this.velocity.z = direction.z * speed;

    // Apply velocity
    this.mesh.position.x += this.velocity.x * delta;
    this.mesh.position.z += this.velocity.z * delta;

    // Look in direction of movement
    this.lookAt(targetPosition);
  }

  /**
   * Orient the boss to look at a position
   * @param {THREE.Vector3} position Position to look at
   */
  lookAt(position) {
    // Calculate direction
    const direction = position.clone().sub(this.mesh.position);

    // Only rotate on Y axis (ignore height differences)
    direction.y = 0;

    // Only update if we have a meaningful direction
    if (direction.lengthSq() > 0.001) {
      // Get target rotation
      const targetRotation = Math.atan2(direction.x, direction.z);

      // Get current rotation
      let currentRotation = this.mesh.rotation.y;

      // Normalize angles
      while (targetRotation - currentRotation > Math.PI) currentRotation += Math.PI * 2;
      while (targetRotation - currentRotation < -Math.PI) currentRotation -= Math.PI * 2;

      // Interpolate to target rotation
      const rotationDelta = targetRotation - currentRotation;
      this.mesh.rotation.y += rotationDelta * 0.1;
    }
  }

  /**
   * Attack the target
   * @param {number} time Current time
   */
  attack(time) {
    if (!this.target) return;

    // Choose a weapon based on state and cooldowns
    let weapon = 'ram';

    if (this.currentState === 'enraged') {
      if (time - this.lastWeaponUse.flamethrower > this.weaponCooldowns.flamethrower) {
        weapon = 'flamethrower';
      } else if (time - this.lastWeaponUse.ram > this.weaponCooldowns.ram) {
        weapon = 'ram';
      }
    } else {
      // Choose weapon based on distance and cooldowns
      const distance = this.mesh.position.distanceTo(this.target.vehicle.mesh.position);

      if (distance < 10 && time - this.lastWeaponUse.ram > this.weaponCooldowns.ram) {
        weapon = 'ram';
      } else if (distance < 30 && time - this.lastWeaponUse.flamethrower > this.weaponCooldowns.flamethrower) {
        weapon = 'flamethrower';
      } else if (time - this.lastWeaponUse.freezeMissile > this.weaponCooldowns.freezeMissile) {
        weapon = 'freezeMissile';
      }
    }

    // Use the chosen weapon
    switch (weapon) {
      case 'ram':
        this.useRamAttack();
        break;
      case 'freezeMissile':
        this.useFreezeMissile();
        break;
      case 'flamethrower':
        this.useFlamethrower();
        break;
    }

    // Update attack timers
    this.lastAttackTime = time;
    this.lastWeaponUse[weapon] = time;
  }

  /**
   * Ram attack - charge at the target
   */
  useRamAttack() {
    console.log('Semi-Trump used Ram Attack!');
    // This would normally trigger a visual effect and damage calculation

    // In a full implementation, we'd also apply a force to the target
    // and check for collision damage
  }

  /**
   * Freeze missile attack - fire a missile that temporarily freezes the target
   */
  useFreezeMissile() {
    console.log('Semi-Trump used Freeze Missile!');
    // This would normally spawn a missile projectile that tracks the target

    // In a full implementation, we'd create a missile object that moves
    // and applies a freeze effect on hit
  }

  /**
   * Flamethrower attack - shoot flames in a cone
   */
  useFlamethrower() {
    console.log('Semi-Trump used Flamethrower!');
    // This would normally create flame particles and check for hits

    // In a full implementation, we'd create flame particles and apply
    // damage over time to targets in range
  }

  /**
   * Update visual effects based on state and health
   * @param {number} delta Time since last update
   * @param {number} time Current time
   */
  updateVisualEffects(delta, time) {
    // Update health-based effects
    const healthPercent = this.health / this.maxHealth;

    if (healthPercent < 0.3) {
      // Heavily damaged - add smoke and fire effects
      // This would normally spawn smoke and fire particles
    } else if (healthPercent < 0.6) {
      // Moderately damaged - add smoke effects
      // This would normally spawn smoke particles
    }

    // Update state-based effects
    if (this.currentState === 'enraged') {
      // Add red glow effect
      // This would normally adjust material emissive properties
    }
  }

  /**
   * Play effects when transitioning between states
   */
  playStateTransitionEffects() {
    // This would normally play sound effects and visual transitions
    // based on the state change

    if (this.previousState === 'normal' && this.currentState === 'enraged') {
      // Play enrage sound effect and visual
      console.log('Semi-Trump becomes enraged!');
    } else if (this.previousState === 'enraged' && this.currentState !== 'enraged') {
      // Play calming down effect
      console.log('Semi-Trump calms down.');
    }
  }

  /**
   * Make the boss take damage
   * @param {number} amount Amount of damage to take
   * @param {Object} attacker The player who caused the damage
   * @returns {boolean} True if the boss was destroyed
   */
  takeDamage(amount, attacker) {
    // Apply damage
    this.health = Math.max(0, this.health - amount);

    // Update health bar
    this.updateHealthBar();

    // If health is low, increase chance of entering enraged state
    if (this.health < this.maxHealth * 0.3 &&
      this.currentState !== 'enraged' &&
      Math.random() < 0.3) {
      this.currentState = 'enraged';
      this.stateTimer = 0;
      this.stateTimeout = 8000;
      this.playStateTransitionEffects();
    }

    // If attacker is not the current target, chance to switch targets
    if (attacker && this.target && attacker.id !== this.target.id && Math.random() < 0.5) {
      this.target = attacker;
    }

    // Check if destroyed
    return this.health <= 0;
  }

  /**
   * Set the difficulty level
   * @param {number} difficulty New difficulty level
   */
  setDifficulty(difficulty) {
    const oldHealth = this.health;
    const oldMaxHealth = this.maxHealth;

    // Update stats with new difficulty
    this.difficulty = difficulty;
    this.maxHealth = 100 * difficulty;
    this.health = (oldHealth / oldMaxHealth) * this.maxHealth; // Preserve health percentage
    this.damage = 10 * (1 + (difficulty * 0.2));
    this.speed = 0.2 * (1 + (difficulty * 0.3));
    this.turnRate = 0.01 * (1 + (difficulty * 0.2));
    this.attackCooldown = 3000 / difficulty;

    // Update health bar
    this.updateHealthBar();

    console.log(`Semi-Trump difficulty set to ${difficulty.toFixed(1)}`);
  }
} 