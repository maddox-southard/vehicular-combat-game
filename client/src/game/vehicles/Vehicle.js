import * as THREE from 'three';
import { VEHICLES, getNormalizedVehicleStats, getDefaultWeapon } from './VehicleConfig';
import { createVehicleMesh } from './VehicleMeshFactory';
import { checkWallCollision, resolveWallCollision, checkObjectCollision } from '../physics/CollisionDetection';
import { Projectile } from '../weapons/Projectile';

// Define weapon types as constants
export const WEAPON_TYPES = {
  MACHINE_GUN: 'machineGun',
  SPECIAL_ATTACK: 'specialAttack'
};

/**
 * Base Vehicle class representing any player or AI vehicle
 */
export class Vehicle {
  /**
   * Create a new vehicle
   * @param {string} type Vehicle type from VehicleConfig
   * @param {Object} config Additional configuration options
   */
  constructor(type, config = {}) {
    // Store type
    this.type = type;

    // Get vehicle configuration
    const vehicleConfig = VEHICLES[type];
    if (!vehicleConfig) {
      throw new Error(`Invalid vehicle type: ${type}`);
    }

    // Apply stats from config
    this.speed = vehicleConfig.speed;
    this.armor = vehicleConfig.armor;
    this.damage = vehicleConfig.damage;
    this.handling = vehicleConfig.handling;

    // Apply any overrides from config
    if (config.speedOverride) this.speed = config.speedOverride;
    if (config.armorOverride) this.armor = config.armorOverride;
    if (config.damageOverride) this.damage = config.damageOverride;
    if (config.handlingOverride) this.handling = config.handlingOverride;

    // Compute derived stats
    this.maxHealth = 100 + (this.armor * 20);
    this.health = this.maxHealth;
    this.acceleration = 0.5 + (this.speed * 0.1);
    this.turnRate = 0.03 + (this.handling * 0.01);
    this.maxSpeed = 1 + (this.speed * 0.2);

    // Player name for display
    this.playerName = null;
    this.nameLabel = null;
    this.healthBar = null;

    // Movement state
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.rotationVelocity = 0;

    // Weapons
    this.weapons = [WEAPON_TYPES.MACHINE_GUN]; // Start with machine gun
    this.currentWeaponIndex = 0;
    this._currentWeapon = WEAPON_TYPES.MACHINE_GUN;
    this.weaponAmmo = new Map();
    this.weaponAmmo.set(WEAPON_TYPES.MACHINE_GUN, Infinity); // Infinite ammo for machine gun
    this.projectiles = []; // Initialize projectiles array

    // Create mesh
    this.mesh = createVehicleMesh(type);

    // Add collision box
    this.collisionBox = new THREE.Box3().setFromObject(this.mesh);

    // Controls state
    this.controls = {
      forward: false,
      backward: false,
      left: false,
      right: false,
      fire: false,
      special: false
    };

    // Damage visual states
    this.damageLevel = 0; // 0-2 (none, medium, severe)

    // Add collision damage cooldown
    this.lastCollisionDamage = 0;

    // Store scene reference if provided
    this.scene = config.scene;

    // Initialize UI if it exists
    if (window.gameUI) {
      window.gameUI.updateWeaponSystem(this.weapons, this._currentWeapon, this.weaponAmmo);
    }
  }

  /**
   * Get the current weapon
   */
  get currentWeapon() {
    return this._currentWeapon;
  }

  /**
   * Set the current weapon
   */
  set currentWeapon(weapon) {
    this._currentWeapon = weapon;
  }

  /**
   * Switch to the next weapon
   * @deprecated Use cycleItemForward instead
   */
  switchWeapon() {
    this.cycleItemForward();
  }

  /**
   * Cycle to the next item/weapon
   */
  cycleItemForward() {
    if (this.weapons.length > 1) {
      this.currentWeaponIndex = (this.currentWeaponIndex + 1) % this.weapons.length;
      this._currentWeapon = this.weapons[this.currentWeaponIndex];

      // Force immediate UI update
      if (window.gameUI) {
        window.gameUI.updateWeaponSystem(this.weapons, this._currentWeapon, this.weaponAmmo);
      }
    }
  }

  /**
   * Cycle to the previous item/weapon
   */
  cycleItemBackward() {
    if (this.weapons.length > 1) {
      this.currentWeaponIndex = (this.currentWeaponIndex - 1 + this.weapons.length) % this.weapons.length;
      this._currentWeapon = this.weapons[this.currentWeaponIndex];

      // Force immediate UI update
      if (window.gameUI) {
        window.gameUI.updateWeaponSystem(this.weapons, this._currentWeapon, this.weaponAmmo);
      }
    }
  }

  /**
   * Add a weapon to the vehicle
   * @param {string} weaponType The weapon type to add
   */
  addWeapon(weaponType, ammo = 3) {
    if (!this.weapons.includes(weaponType)) {
      this.weapons.push(weaponType);
      this.weaponAmmo.set(weaponType, ammo);
    } else {
      // Add ammo if we already have the weapon
      const currentAmmo = this.weaponAmmo.get(weaponType) || 0;
      this.weaponAmmo.set(weaponType, currentAmmo + ammo);
    }
  }

  /**
   * Update vehicle position based on controls
   * @param {number} delta Time since last update in seconds
   * @param {Object} map The game map
   * @param {Object} gameState The game state object
   */
  update(delta, map, gameState) {
    // Apply controls to movement
    this.updateMovement(delta);

    // Check for wall collisions if map is provided
    if (map) {
      const wallCollision = checkWallCollision(this, map);
      if (wallCollision) {
        resolveWallCollision(this, wallCollision);
      }

      const objectCollision = checkObjectCollision(this, map);
      if (objectCollision) {
        resolveWallCollision(this, objectCollision);
      }
    }

    // Check for vehicle collisions if gameState is provided
    if (gameState && gameState.players) {
      this.checkVehicleCollisions(gameState.players);
    }

    // Update collision box
    this.updateCollisionBox();

    // Update the player name label position if it exists
    if (this.nameLabel) {
      this.updateNameLabelPosition();
    }

    // Update the health bar if it exists
    if (this.healthBar) {
      this.updateHealthBar();
    }

    // Update damage visuals if needed
    if (this.health <= this.maxHealth * 0.3 && this.damageLevel < 2) {
      this.damageLevel = 2;
      this.updateDamageVisuals();
    } else if (this.health <= this.maxHealth * 0.6 && this.damageLevel < 1) {
      this.damageLevel = 1;
      this.updateDamageVisuals();
    }
  }

  /**
   * Update vehicle movement based on controls
   * @param {number} delta Time since last update in seconds
   */
  updateMovement(delta) {
    // Skip movement if vehicle is respawning
    if (this.isRespawning) {
      return;
    }
    
    // Apply acceleration based on controls
    if (this.controls.forward) {
      this.velocity.z -= this.acceleration * delta;
    }
    if (this.controls.backward) {
      this.velocity.z += this.acceleration * 0.6 * delta; // Slower in reverse
    }

    // Apply turning
    if (this.controls.left) {
      this.rotationVelocity += this.turnRate * delta;
    }
    if (this.controls.right) {
      this.rotationVelocity -= this.turnRate * delta;
      
      // Fix for health bar color issue - ensure opacity is maintained
      if (this.healthBarFill && this.healthBarFill.material) {
        // Store the current material color
        const currentColor = this.healthBarFill.material.color.getHex();
        // Re-apply the same color to prevent it from becoming muted
        this.healthBarFill.material.color.setHex(currentColor);
        // Ensure opacity is set correctly
        this.healthBarFill.material.opacity = 0.9;
      }
    }

    // Apply friction and gravity
    this.velocity.multiplyScalar(0.95);
    this.rotationVelocity *= 0.9;

    // Enforce speed limits
    const speedSq = this.velocity.lengthSq();
    if (speedSq > this.maxSpeed * this.maxSpeed) {
      this.velocity.normalize().multiplyScalar(this.maxSpeed);
    }

    // Update rotation
    this.mesh.rotation.y += this.rotationVelocity;

    // Ensure no Y velocity at any time
    this.velocity.y = 0;

    // Move in the direction we're facing
    const movement = this.velocity.clone();
    movement.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.mesh.rotation.y);
    
    // Ensure no Y movement at any time
    movement.y = 0;

    // Apply movement
    this.mesh.position.add(movement);
    
    // Lock Y position at a constant value to prevent any vertical movement
    this.mesh.position.y = 0.2; // Lower height for vehicles to appear on the ground
  }

  /**
   * Update the collision box to match the current position
   */
  updateCollisionBox() {
    this.collisionBox.setFromObject(this.mesh);
  }

  /**
   * Make the vehicle take damage
   * @param {number} amount Amount of damage to take
   * @returns {boolean} True if the vehicle was destroyed
   */
  takeDamage(amount) {
    // Skip if already destroyed
    if (this.health <= 0) {
      console.log(`Vehicle ${this.type} already destroyed, ignoring damage`);
      return true;
    }

    // Apply armor damage reduction
    const damageReduction = this.armor * 0.15;
    const actualDamage = amount * (1 - damageReduction);

    // Apply damage
    this.health = Math.max(0, this.health - actualDamage);

    // Update visual damage state if needed
    if (this.health <= this.maxHealth * 0.3 && this.damageLevel < 2) {
      this.damageLevel = 2;
      this.updateDamageVisuals();
    } else if (this.health <= this.maxHealth * 0.6 && this.damageLevel < 1) {
      this.damageLevel = 1;
      this.updateDamageVisuals();
    }
    
    // Update the 3D health bar
    this.updateHealthBar();

    // Check if destroyed
    const isDestroyed = this.health <= 0;

    if (isDestroyed) {
      this.handleDeath();
    }

    return isDestroyed;
  }

  /**
   * Handle vehicle death
   */
  handleDeath() {
    // This method will be called when vehicle health reaches 0
    // The implementation can be extended by game logic
    console.log(`Vehicle ${this.type} destroyed`);
    
    // Play death animation and remove vehicle from scene
    if (this.mesh && this.scene) {
      this.createDeathAnimation(this.scene);
    }
  }

  /**
   * Create death animation for vehicle
   * @param {THREE.Scene} scene The Three.js scene
   */
  createDeathAnimation(scene) {
    if (!this.mesh || !scene) return;
    
    // Store original position
    const originalPosition = this.mesh.position.clone();
    
    // Create explosion particles
    const particleCount = 50;
    const particles = new THREE.Group();
    
    // Create different colored particle geometries
    const particleGeometry = new THREE.BoxGeometry(0.3, 0.3, 0.3);
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
      
      // Random positions relative to vehicle center
      particle.position.set(
        originalPosition.x + (Math.random() - 0.5) * 3,
        originalPosition.y + (Math.random() - 0.5) * 3,
        originalPosition.z + (Math.random() - 0.5) * 3
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
      const scale = 0.2 + Math.random() * 0.6;
      particle.scale.set(scale, scale, scale);
      
      particles.add(particle);
    }
    
    scene.add(particles);
    
    // Create explosion effect at the center
    const explosionGeometry = new THREE.SphereGeometry(0.8, 16, 16);
    const explosionMaterial = new THREE.MeshBasicMaterial({ 
      color: 0xff5500, 
      transparent: true, 
      opacity: 1 
    });
    const explosionMesh = new THREE.Mesh(explosionGeometry, explosionMaterial);
    explosionMesh.position.copy(originalPosition);
    explosionMesh.scale.set(1, 1, 1);
    scene.add(explosionMesh);
    
    // Duration for animation
    const animationDuration = 1500; // 1.5 seconds
    const startTime = Date.now();
    
    // Remove vehicle temporarily from scene during respawn
    if (this.mesh.parent) {
      scene.remove(this.mesh);
    }
    
    // Animation loop
    const animateExplosion = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / animationDuration, 1);
      
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
        const explosionScale = 1 + progress * 10;
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
        scene.remove(particles);
        scene.remove(explosionMesh);
      }
    };
    
    // Start animation
    animateExplosion();
  }

  /**
   * Update visual appearance based on damage level
   */
  updateDamageVisuals() {
    // This would be implemented with actual visual changes
    // For now, just a placeholder
    console.log(`Vehicle ${this.type} damage level: ${this.damageLevel}`);
  }

  /**
   * Fire current weapon
   * @param {THREE.Scene} scene The Three.js scene
   * @param {Object} boss The boss object to target for guided weapons
   * @returns {Projectile|null} The created projectile or null if firing failed
   */
  fireWeapon(scene, boss) {
    // Skip if respawning
    if (this.isRespawning) {
      return null;
    }

    // Get current weapon type
    const weaponType = this._currentWeapon;
    
    // Check if we have ammo for this weapon (except machine gun which has infinite)
    if (weaponType !== WEAPON_TYPES.MACHINE_GUN) {
      const ammo = this.weaponAmmo.get(weaponType) || 0;
      if (ammo <= 0) {
        console.log('No ammo for', weaponType);
        return null;
      }
    }
    
    // Create a new projectile at the vehicle's position
    const position = this.mesh.position.clone();
    
    // Calculate direction based on vehicle's orientation
    const direction = new THREE.Vector3(0, 0, -1);
    direction.applyQuaternion(this.mesh.quaternion);
    
    // Create the projectile
    const projectile = new Projectile(weaponType, position, direction, this);
    
    // Add to scene
    scene.add(projectile.mesh);
    
    // Emit weapon fire event for multiplayer
    console.log('Emitting fireWeapon event:', {
      type: weaponType,
      position: position,
      direction: direction
    });
    
    if (window.socket) {
      window.socket.emit('fireWeapon', {
        type: weaponType,
        position: position,
        direction: direction
      });
    }
    
    // Play sound effect based on weapon type
    this.playWeaponSound(weaponType);
    
    // Update UI
    this.updateAmmoUI();
    
    // Special case for specialAttack
    if (weaponType === WEAPON_TYPES.SPECIAL_ATTACK) {
      // Handle guided missiles or special effects for some vehicle types
      if (boss && this.type === 'spectre') {
        // Make ghost missile target the boss
        projectile.setTarget(boss);
      }
    }
    
    return projectile;
  }

  /**
   * Fire special attack
   */
  fireSpecialAttack() {
    // Skip if respawning
    if (this.isRespawning) {
      return;
    }
    
    // Check if we have special attack ammo
    const ammo = this.weaponAmmo.get(WEAPON_TYPES.SPECIAL_ATTACK) || 0;
    if (ammo <= 0) {
      // Play "empty" sound effect
      this.playEmptySound();
      return;
    }
    
    // Decrease ammo
    this.weaponAmmo.set(WEAPON_TYPES.SPECIAL_ATTACK, ammo - 1);
    
    // Create projectile (handled by scene in game logic)
    const position = this.mesh.position.clone();
    const direction = new THREE.Vector3(0, 0, -1);
    direction.applyQuaternion(this.mesh.quaternion);
    
    // Emit weapon fire event for multiplayer
    console.log('Emitting fireWeapon event for special attack');
    if (window.socket) {
      window.socket.emit('fireWeapon', {
        type: WEAPON_TYPES.SPECIAL_ATTACK,
        position: position,
        direction: direction
      });
    }
    
    // Update UI
    this.updateAmmoUI();
  }

  /**
   * Fire machine gun
   */
  fireMachineGun() {
    // Skip if respawning
    if (this.isRespawning) {
      return;
    }
    
    // Machine gun has no ammo limit
    // Create projectile (handled by scene in game logic)
    const position = this.mesh.position.clone();
    const direction = new THREE.Vector3(0, 0, -1);
    direction.applyQuaternion(this.mesh.quaternion);
    
    // Add slight randomness to machine gun direction (spread)
    const spread = 0.05;
    direction.x += (Math.random() - 0.5) * spread;
    direction.y += (Math.random() - 0.5) * spread;
    direction.normalize();
    
    // Emit weapon fire event for multiplayer
    console.log('Emitting fireWeapon event for machine gun');
    if (window.socket) {
      window.socket.emit('fireWeapon', {
        type: WEAPON_TYPES.MACHINE_GUN,
        position: position,
        direction: direction
      });
    }
    
    // Update UI
    this.updateAmmoUI();
  }

  /**
   * Check for vehicle collisions
   * @param {Object} players The game players
   */
  checkVehicleCollisions(players) {
    for (const [id, otherPlayer] of players) {
      // Skip self
      if (otherPlayer.vehicle === this) continue;

      const collision = this.checkVehicleCollision(otherPlayer.vehicle);
      if (collision) {
        this.resolveVehicleCollision(otherPlayer.vehicle, collision);
      }
    }
  }

  /**
   * Check for vehicle collision
   * @param {Vehicle} otherVehicle The other vehicle to check collision with
   * @returns {Object|null} The collision object if collision detected, null otherwise
   */
  checkVehicleCollision(otherVehicle) {
    // Check if bounding boxes intersect
    if (this.collisionBox.intersectsBox(otherVehicle.collisionBox)) {
      const myPos = this.mesh.position;
      const otherPos = otherVehicle.mesh.position;

      // Calculate collision normal
      const normal = new THREE.Vector3()
        .subVectors(myPos, otherPos)
        .normalize();

      // Calculate penetration depth with smaller collision radius
      const mySize = new THREE.Vector3();
      const otherSize = new THREE.Vector3();
      this.collisionBox.getSize(mySize);
      otherVehicle.collisionBox.getSize(otherSize);

      // Use smaller collision radius (30% of vehicle size)
      const radius1 = Math.max(mySize.x, mySize.z) * 0.3;
      const radius2 = Math.max(otherSize.x, otherSize.z) * 0.3;
      const distance = myPos.distanceTo(otherPos);
      const penetration = (radius1 + radius2) - distance;

      // Higher minimum penetration threshold
      if (penetration > 0.2) {
        return {
          normal,
          penetration,
          otherVehicle
        };
      }
    }
    return null;
  }

  /**
   * Resolve vehicle collision
   * @param {Vehicle} otherVehicle The other vehicle involved in the collision
   * @param {Object} collision The collision object
   */
  resolveVehicleCollision(otherVehicle, collision) {
    // Calculate mass ratio (based on armor)
    const myMass = 1 + (this.armor * 0.2);
    const otherMass = 1 + (otherVehicle.armor * 0.2);
    const totalMass = myMass + otherMass;
    const myRatio = myMass / totalMass;
    const otherRatio = otherMass / totalMass;

    // Store original Y positions
    const myOriginalY = this.mesh.position.y;
    const otherOriginalY = otherVehicle.mesh.position.y;

    // Gentler separation (25% of penetration)
    const pushBack = collision.normal.clone().multiplyScalar(collision.penetration * 0.25);
    
    // Apply push back only on X and Z axes
    this.mesh.position.x += pushBack.x * otherRatio;
    this.mesh.position.z += pushBack.z * otherRatio;
    otherVehicle.mesh.position.x -= pushBack.x * myRatio;
    otherVehicle.mesh.position.z -= pushBack.z * myRatio;
    
    // Restore original Y positions
    this.mesh.position.y = myOriginalY;
    otherVehicle.mesh.position.y = otherOriginalY;

    // Calculate relative velocity
    const relativeVelocity = this.velocity.clone().sub(otherVehicle.velocity);
    const velocityAlongNormal = relativeVelocity.dot(collision.normal);

    // Only resolve if objects are moving toward each other
    if (velocityAlongNormal > 0) return;

    // Very low bounce coefficient
    const restitution = 0.05;

    // Calculate impulse scalar
    const impulseScalar = -(1 + restitution) * velocityAlongNormal;

    // Reduced impulse effect (40% of original)
    const impulse = collision.normal.clone().multiplyScalar(impulseScalar * 0.4);

    // Apply velocity changes - only to X and Z components
    this.velocity.x -= impulse.x * otherRatio;
    this.velocity.z -= impulse.z * otherRatio;
    otherVehicle.velocity.x += impulse.x * myRatio;
    otherVehicle.velocity.z += impulse.z * myRatio;
    
    // Ensure Y velocities are zero
    this.velocity.y = 0;
    otherVehicle.velocity.y = 0;

    // Strong friction during collision
    this.velocity.multiplyScalar(0.7);
    otherVehicle.velocity.multiplyScalar(0.7);
    
    // Ensure Y velocities are still zero after friction
    this.velocity.y = 0;
    otherVehicle.velocity.y = 0;

    // Only apply damage on significant high-speed collisions
    const impactForce = Math.abs(velocityAlongNormal) * (myMass + otherMass);
    const speedThreshold = 1.2;

    if (impactForce > 5 && Math.abs(velocityAlongNormal) > speedThreshold) {
      const now = Date.now();
      if (!this.lastCollisionDamage || now - this.lastCollisionDamage > 1500) { // Longer cooldown
        // Reduced damage calculation
        const damage = Math.min(impactForce * 1.2, 15);
        this.takeDamage(damage);
        otherVehicle.takeDamage(damage);

        // Update collision damage timestamp
        this.lastCollisionDamage = now;
        otherVehicle.lastCollisionDamage = now;
      }
    }
  }

  // Update weapon methods
  useSpecialWeapon() {
    const currentWeapon = this._currentWeapon;
    if (currentWeapon === WEAPON_TYPES.MACHINE_GUN) return;

    const ammo = this.weaponAmmo.get(currentWeapon);
    if (ammo && ammo > 0) {
      // Fire special attack
      this.fireSpecialAttack();

      // Decrease ammo handled in fireSpecialAttack method
      // updateAmmoUI is also called in fireSpecialAttack
    }
  }

  /**
   * Get the forward vector of the vehicle
   * @returns {THREE.Vector3} The forward vector
   */
  getForwardVector() {
    const direction = new THREE.Vector3(0, 0, -1);
    return direction.applyQuaternion(this.mesh.quaternion).normalize();
  }

  // Add method to handle pickup collection
  handlePickupCollection(pickupType) {
    console.log('Handling pickup:', pickupType, {
      beforeWeapons: [...this.weapons],
      beforeAmmo: new Map(this.weaponAmmo)
    });

    switch (pickupType) {
      case 'specialAttack':
        if (!this.weaponAmmo.has(WEAPON_TYPES.SPECIAL_ATTACK)) {
          this.weapons.push(WEAPON_TYPES.SPECIAL_ATTACK);
          this.weaponAmmo.set(WEAPON_TYPES.SPECIAL_ATTACK, 0);
        }
        // Increment the Special Attack ammo count (stackable)
        const currentAmmo = this.weaponAmmo.get(WEAPON_TYPES.SPECIAL_ATTACK) || 0;
        this.weaponAmmo.set(WEAPON_TYPES.SPECIAL_ATTACK, currentAmmo + 1);
        break;
      case 'fullHealth':
        this.health = this.maxHealth;
        break;
    }

    console.log('After pickup:', {
      weapons: [...this.weapons],
      currentWeapon: this.currentWeapon,
      ammo: new Map(this.weaponAmmo)
    });

    // Force immediate UI update
    if (window.gameUI) {
      window.gameUI.updateWeaponSystem(this.weapons, this._currentWeapon, this.weaponAmmo);
    }
  }

  /**
   * Set the player name for this vehicle and create a label to display it
   * @param {string} name The player name to display
   */
  setPlayerName(name) {
    if (!name) return;
    
    this.playerName = name;
    
    // Get the model scale for this vehicle type
    const vehicleConfig = VEHICLES[this.type];
    const modelScale = vehicleConfig?.modelScale || 1.0; // Default to 1 if not found
    
    // Remove any existing label
    if (this.nameLabel && this.mesh) {
      this.mesh.remove(this.nameLabel);
    }
    
    // Create a canvas for the text
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = 512; // Larger canvas for better resolution
    canvas.height = 128;
    
    // Draw text on canvas with larger, more visible font
    context.fillStyle = '#ffffff';
    context.font = 'Bold 42px Arial';
    context.textAlign = 'center';
    
    // Add a stronger drop shadow for better visibility
    context.shadowColor = '#000000';
    context.shadowBlur = 10;
    context.shadowOffsetY = 4;
    context.fillText(name, 256, 70);
    
    // Add stroke for even better visibility
    context.strokeStyle = '#000000';
    context.lineWidth = 3;
    context.strokeText(name, 256, 70);
    
    // Create texture from canvas
    const texture = new THREE.CanvasTexture(canvas);
    const labelMaterial = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthTest: false,  // This ensures it's always visible
      depthWrite: false  // Prevent depth writing
    });
    
    // Create sprite with improved visibility settings
    this.nameLabel = new THREE.Sprite(labelMaterial);
    this.nameLabel.scale.set(6, 1.5, 1); // Scale remains relative to parent
    
    // Position the label higher above the vehicle, adjusting for model scale
    const labelBaseYOffset = 4.0; // Desired visual offset
    this.nameLabel.position.set(0, labelBaseYOffset / modelScale, 0);
    
    // Add label to the vehicle mesh
    this.mesh.add(this.nameLabel);
    
    // Set renderOrder to ensure it renders on top
    this.nameLabel.renderOrder = 999;
    
    // Create health bar after setting the name
    this.createHealthBar(); // createHealthBar will also use modelScale
  }
  
  /**
   * Create 3D health bar to display under the player name
   */
  createHealthBar() {
    // Remove any existing health bar
    if (this.healthBar && this.mesh) {
      this.mesh.remove(this.healthBar);
    }

    // Get the model scale for this vehicle type
    const vehicleConfig = VEHICLES[this.type];
    const modelScale = vehicleConfig?.modelScale || 1.0; // Default to 1
    
    // Create health bar group
    this.healthBar = new THREE.Group();
    
    // Create background bar
    const bgGeometry = new THREE.PlaneGeometry(4, 0.4);
    const bgMaterial = new THREE.MeshBasicMaterial({ 
      color: 0x333333,
      transparent: true,
      opacity: 0.7,
      depthTest: false,
      depthWrite: false,
      side: THREE.DoubleSide // Render on both sides to avoid orientation issues
    });
    const background = new THREE.Mesh(bgGeometry, bgMaterial);
    this.healthBar.add(background);
    
    // Create foreground health bar
    const fgGeometry = new THREE.PlaneGeometry(4, 0.4);
    const fgMaterial = new THREE.MeshBasicMaterial({ 
      color: 0x00ff00,
      transparent: true,
      opacity: 0.9,
      depthTest: false,
      depthWrite: false,
      side: THREE.DoubleSide, // Render on both sides to avoid orientation issues
      // Disable features that might cause visual inconsistencies
      toneMapped: false
    });
    this.healthBarFill = new THREE.Mesh(fgGeometry, fgMaterial);
    this.healthBarFill.position.z = 0.01; // Slightly in front of background
    this.healthBarFill.scale.x = 1.0; // Full health to start
    this.healthBar.add(this.healthBarFill);
    
    // Position below the name label, adjusting for model scale
    const healthBarBaseYOffset = 3.2; // Desired visual offset (relative to mesh origin)
    this.healthBar.position.set(0, healthBarBaseYOffset / modelScale, 0);
    
    // Add to mesh
    this.mesh.add(this.healthBar);
    
    // Set high render order to ensure visibility
    this.healthBar.renderOrder = 998;
    
    // Update the health bar to current health
    this.updateHealthBar();
  }
  
  /**
   * Update the health bar to reflect current health
   */
  updateHealthBar() {
    if (!this.healthBar || !this.healthBarFill) return;
    
    const healthPercent = this.health / this.maxHealth;
    this.healthBarFill.scale.x = Math.max(0.01, healthPercent);
    this.healthBarFill.position.x = -2 * (1 - healthPercent);
    
    // Update color based on health
    if (healthPercent > 0.6) {
      this.healthBarFill.material.color.setHex(0x00ff00); // Green
    } else if (healthPercent > 0.3) {
      this.healthBarFill.material.color.setHex(0xffff00); // Yellow
    } else {
      this.healthBarFill.material.color.setHex(0xff0000); // Red
    }
    
    // Explicitly maintain opacity to prevent it from becoming muted
    this.healthBarFill.material.opacity = 0.9;
  }
  
  /**
   * Update the position of the name label to stay above the vehicle
   */
  updateNameLabelPosition() {
    if (!this.nameLabel) return;
    
    // Force the label to face the camera
    this.nameLabel.matrixAutoUpdate = true;
    
    // Update health bar position if it exists
    if (this.healthBar) {
      // Ensure the health bar properly faces the camera at all times
      this.healthBar.matrixAutoUpdate = true;
      
      // Force the health bar to maintain proper orientation during turns
      // This prevents the visual darkening effect during right turns
      if (window.camera) {
        // Get camera position in world space
        const cameraPosition = window.camera.position.clone();
        // Make health bar face camera, keeping Y-up orientation
        this.healthBar.lookAt(cameraPosition);
        // Reset any rotation on X and Z axis to keep bar flat
        this.healthBar.rotation.x = 0;
        this.healthBar.rotation.z = 0;
      }
    }
  }

  updateAmmoUI() {
    // Update weapon UI if gameUI exists
    if (window.gameUI) {
      window.gameUI.updateWeaponSystem(this.weapons, this._currentWeapon, this.weaponAmmo);
    }
  }

  /**
   * Play sound when trying to fire without ammo
   */
  playEmptySound() {
    console.log('No ammo available - would play empty sound');
    // If sound system exists, it would be called here
    // TODO: Add actual sound effect when sound system is available
  }
} 