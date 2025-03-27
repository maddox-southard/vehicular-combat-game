import * as THREE from 'three';
import { VEHICLES, getNormalizedVehicleStats, getDefaultWeapon } from './VehicleConfig';
import { createVehicleMesh } from './VehicleMeshFactory';
import { checkWallCollision, resolveWallCollision, checkObjectCollision } from '../physics/CollisionDetection';

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
    
    // Movement state
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.rotationVelocity = 0;
    
    // Weapons
    this.weapons = [getDefaultWeapon(type)];
    this.currentWeaponIndex = 0;
    this.lastFired = 0;
    
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
  }
  
  /**
   * Get the current weapon
   */
  get currentWeapon() {
    return this.weapons[this.currentWeaponIndex];
  }
  
  /**
   * Switch to the next weapon
   */
  switchWeapon() {
    this.currentWeaponIndex = (this.currentWeaponIndex + 1) % this.weapons.length;
    return this.currentWeapon;
  }
  
  /**
   * Add a weapon to the vehicle
   * @param {string} weaponType The weapon type to add
   */
  addWeapon(weaponType) {
    if (!this.weapons.includes(weaponType)) {
      this.weapons.push(weaponType);
    }
  }
  
  /**
   * Update vehicle position based on controls
   * @param {number} delta Time since last update in seconds
   * @param {Object} map The game map
   */
  update(delta, map) {
    // Apply controls to movement
    this.updateMovement(delta);
    
    // Check for wall collisions if map is provided
    if (map) {
      // Check and resolve wall collisions
      const wallCollision = checkWallCollision(this, map);
      if (wallCollision) {
        resolveWallCollision(this, wallCollision);
      }
      
      // Check and resolve object collisions (Washington Monument, Capitol Building)
      const objectCollision = checkObjectCollision(this, map);
      if (objectCollision) {
        resolveWallCollision(this, objectCollision);
      }
    }
    
    // Update collision box
    this.updateCollisionBox();
    
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
    
    // Move in the direction we're facing
    const movement = this.velocity.clone();
    movement.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.mesh.rotation.y);
    
    // Apply movement
    this.mesh.position.add(movement);
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
   * Fire the current weapon
   * @param {THREE.Scene} scene The scene to add projectiles to
   * @param {number} time Current time for cooldown checks
   * @returns {Object|null} The projectile if fired, null otherwise
   */
  fireWeapon(scene, time) {
    // This would be implemented with actual weapon firing logic
    // For now, just a placeholder
    console.log(`Vehicle ${this.type} fired weapon: ${this.currentWeapon}`);
    return null;
  }
} 