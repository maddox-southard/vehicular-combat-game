import * as THREE from 'three';
import { VEHICLES, getNormalizedVehicleStats, getDefaultWeapon } from './VehicleConfig';
import { createVehicleMesh } from './VehicleMeshFactory';
import { checkWallCollision, resolveWallCollision, checkObjectCollision } from '../physics/CollisionDetection';
import { Projectile } from '../weapons/Projectile';

// Update the WEAPON_TYPES constant to match exactly with the UI
const WEAPON_TYPES = {
  MACHINE_GUN: 'machineGun',
  HOMING_MISSILE: 'homingMissile',
  FREEZE_MISSILE: 'freezeMissile',
  RAPID_FIRE: 'rapidFire'
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

    // Movement state
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.rotationVelocity = 0;

    // Weapons
    this.weapons = [WEAPON_TYPES.MACHINE_GUN]; // Start with machine gun
    this.currentWeaponIndex = 0;
    this._currentWeapon = WEAPON_TYPES.MACHINE_GUN;
    this.weaponAmmo = new Map();
    this.weaponAmmo.set(WEAPON_TYPES.MACHINE_GUN, Infinity); // Infinite ammo for machine gun
    this.rapidFireActive = false;
    this.rapidFireEndTime = 0;

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

    // Add key bindings for weapon switching and firing
    document.addEventListener('keydown', (e) => {
      if (e.key === 'q' || e.key === 'Q') {
        this.switchWeapon();
      }
      // if (e.key === 'r' || e.key === 'R') {
      //   if (this.scene) {  // Only fire if we have a scene reference
      //     // Set fire control to true temporarily
      //     this.controls.fire = true;
      //     // Fire weapon immediately
      //     this.fireWeapon(this.scene, null);
      //     // Reset fire control
      //     this.controls.fire = false;
      //   }
      // }
    });

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
   */
  switchWeapon() {
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

    // Update damage visuals if needed
    if (this.health <= this.maxHealth * 0.3 && this.damageLevel < 2) {
      this.damageLevel = 2;
      this.updateDamageVisuals();
    } else if (this.health <= this.maxHealth * 0.6 && this.damageLevel < 1) {
      this.damageLevel = 1;
      this.updateDamageVisuals();
    }

    // Check rapid fire status
    if (this.rapidFireActive && Date.now() > this.rapidFireEndTime) {
      this.rapidFireActive = false;
      console.log('Rapid fire deactivated');
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
   * @param {Vehicle} boss The boss vehicle
   * @returns {Object|null} The projectile if fired, null otherwise
   */
  fireWeapon(scene, boss) {
    // Use provided scene or stored scene reference
    const targetScene = scene || this.scene;
    if (!targetScene) return null;

    // Handle different weapon types
    switch (this._currentWeapon) {
      case WEAPON_TYPES.MACHINE_GUN:
        const currentTime = Date.now();
        const fireInterval = this.rapidFireActive ? 100 : 200;

        if (currentTime > (this.lastFireTime || 0) + fireInterval) {
          // Emit fire event to server
          if (window.socket) {
            const position = this.mesh.position.clone();
            const direction = new THREE.Vector3(0, 0, -1)
              .applyQuaternion(this.mesh.quaternion);

            console.log('Emitting fireWeapon event:', {
              type: 'machineGun',
              position: position,
              direction: direction
            });

            window.socket.emit('fireWeapon', {
              type: 'machineGun',
              position: {
                x: position.x,
                y: position.y,
                z: position.z
              },
              direction: {
                x: direction.x,
                y: direction.y,
                z: direction.z
              }
            });
          }
          this.lastFireTime = currentTime;
        }
        break;

      case WEAPON_TYPES.HOMING_MISSILE:
      case WEAPON_TYPES.FREEZE_MISSILE:
        const ammo = this.weaponAmmo.get(this._currentWeapon);
        if (ammo && ammo > 0 && Date.now() > (this.lastFireTime || 0) + 1000) {
          // Emit fire event to server
          if (window.socket) {
            const position = this.mesh.position.clone();
            const direction = new THREE.Vector3(0, 0, -1)
              .applyQuaternion(this.mesh.quaternion);

            window.socket.emit('fireWeapon', {
              type: this._currentWeapon,
              position: {
                x: position.x,
                y: position.y,
                z: position.z
              },
              direction: {
                x: direction.x,
                y: direction.y,
                z: direction.z
              }
            });
          }

          // Handle ammo locally
          const newAmmo = ammo - 1;
          this.weaponAmmo.set(this._currentWeapon, newAmmo);

          // Remove weapon if no ammo left
          if (newAmmo <= 0) {
            const index = this.weapons.indexOf(this._currentWeapon);
            if (index > -1) {
              this.weapons.splice(index, 1);
              this.weaponAmmo.delete(this._currentWeapon);
              this.currentWeaponIndex = Math.min(this.currentWeaponIndex, this.weapons.length - 1);
              this._currentWeapon = this.weapons[this.currentWeaponIndex];
            }
          }

          // Update UI
          if (window.gameUI) {
            window.gameUI.updateWeaponSystem(this.weapons, this._currentWeapon, this.weaponAmmo);
          }

          this.lastFireTime = Date.now();
        }
        break;
    }
    return null;
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

    // Gentler separation (25% of penetration)
    const pushBack = collision.normal.clone().multiplyScalar(collision.penetration * 0.25);
    this.mesh.position.add(pushBack.clone().multiplyScalar(otherRatio));
    otherVehicle.mesh.position.sub(pushBack.clone().multiplyScalar(myRatio));

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

    // Apply velocity changes
    this.velocity.sub(impulse.clone().multiplyScalar(otherRatio));
    otherVehicle.velocity.add(impulse.clone().multiplyScalar(myRatio));

    // Strong friction during collision
    this.velocity.multiplyScalar(0.7);
    otherVehicle.velocity.multiplyScalar(0.7);

    // Only apply damage on significant high-speed collisions
    const impactForce = Math.abs(velocityAlongNormal) * (myMass + otherMass);
    const speedThreshold = 1.2; // Higher speed threshold

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
      // Only handle rapid fire here
      if (currentWeapon === WEAPON_TYPES.RAPID_FIRE) {
        this.activateRapidFire();

        // Decrease ammo
        const newAmmo = ammo - 1;
        this.weaponAmmo.set(currentWeapon, newAmmo);

        // Remove weapon if no ammo left
        if (newAmmo <= 0) {
          const index = this.weapons.indexOf(currentWeapon);
          if (index > -1) {
            this.weapons.splice(index, 1);
            this.weaponAmmo.delete(currentWeapon);
            this.currentWeaponIndex = Math.min(this.currentWeaponIndex, this.weapons.length - 1);
            this._currentWeapon = this.weapons[this.currentWeaponIndex];
          }
        }

        // Force immediate UI update
        if (window.gameUI) {
          window.gameUI.updateWeaponSystem(this.weapons, this._currentWeapon, this.weaponAmmo);
        }
      }
    }
  }

  // Special weapon methods
  activateRapidFire() {
    this.rapidFireActive = true;
    this.rapidFireEndTime = Date.now() + 10000; // 10 seconds duration
    console.log('Activated rapid fire');
  }

  // Add method to handle pickup collection
  handlePickupCollection(pickupType) {
    console.log('Handling pickup:', pickupType, {
      beforeWeapons: [...this.weapons],
      beforeAmmo: new Map(this.weaponAmmo)
    });

    switch (pickupType) {
      case 'homingMissile':
        if (!this.weaponAmmo.has(WEAPON_TYPES.HOMING_MISSILE)) {
          this.weapons.push(WEAPON_TYPES.HOMING_MISSILE);
          this.weaponAmmo.set(WEAPON_TYPES.HOMING_MISSILE, 0);
        }
        this.weaponAmmo.set(WEAPON_TYPES.HOMING_MISSILE,
          (this.weaponAmmo.get(WEAPON_TYPES.HOMING_MISSILE) || 0) + 3);
        break;
      case 'freezeMissile':
        if (!this.weaponAmmo.has(WEAPON_TYPES.FREEZE_MISSILE)) {
          this.weapons.push(WEAPON_TYPES.FREEZE_MISSILE);
          this.weaponAmmo.set(WEAPON_TYPES.FREEZE_MISSILE, 0);
        }
        this.weaponAmmo.set(WEAPON_TYPES.FREEZE_MISSILE,
          (this.weaponAmmo.get(WEAPON_TYPES.FREEZE_MISSILE) || 0) + 2);
        break;
      case 'rapidFire':
        if (!this.weaponAmmo.has(WEAPON_TYPES.RAPID_FIRE)) {
          this.weapons.push(WEAPON_TYPES.RAPID_FIRE);
          this.weaponAmmo.set(WEAPON_TYPES.RAPID_FIRE, 0);
        }
        this.weaponAmmo.set(WEAPON_TYPES.RAPID_FIRE,
          (this.weaponAmmo.get(WEAPON_TYPES.RAPID_FIRE) || 0) + 1);
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
} 