import * as THREE from 'three';
import { constructPortalExitUrl } from '../../utils/UrlUtils';

/**
 * Portal class representing a teleportation point
 */
export class Portal {
  /**
   * Create a new portal
   * @param {string} type Portal type ('entry' or 'exit')
   * @param {THREE.Vector3} position Portal position
   * @param {string} targetUrl URL to teleport to (for exit portals)
   */
  constructor(type, position, targetUrl = '') {
    this.type = type; // 'entry' or 'exit'
    this.position = position;
    this.targetUrl = targetUrl;
    this.mesh = this.createMesh();
    this.active = true;
    this.hitbox = new THREE.Sphere(this.position, 5); // 5 units radius
    this.activationCooldown = 0; // Cooldown timer to prevent instant re-entry
  }
  
  /**
   * Create the portal mesh
   * @returns {THREE.Group} The portal mesh group
   */
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
    
    // Create portal effect (particles would be better but using a simple plane for now)
    const portalGeometry = new THREE.CircleGeometry(3.5, 32);
    const portalMaterial = new THREE.MeshBasicMaterial({ 
      color: this.type === 'exit' ? 0x00aaff : 0xff00aa,
      opacity: 0.5,
      transparent: true,
      side: THREE.DoubleSide
    });
    const portalPlane = new THREE.Mesh(portalGeometry, portalMaterial);
    portalPlane.rotation.x = Math.PI / 2; // Make it horizontal
    portalPlane.position.y = 0.1; // Slightly above ring
    group.add(portalPlane);
    
    // Position portal
    group.position.copy(this.position);
    group.position.y = 0.2; // Just above ground
    
    return group;
  }
  
  /**
   * Update portal animation
   * @param {number} delta Time since last update
   * @param {number} time Current time
   */
  update(delta, time) {
    // Rotate the portal slightly
    this.mesh.rotation.y += delta * 0.5;
    
    // Pulse the portal
    const scale = 1 + 0.1 * Math.sin(time * 0.002);
    this.mesh.scale.set(scale, 1, scale);
    
    // Update cooldown
    if (this.activationCooldown > 0) {
      this.activationCooldown -= delta;
    }
  }
  
  /**
   * Check if an object is colliding with the portal
   * @param {THREE.Vector3} position Position to check
   * @returns {boolean} True if colliding
   */
  checkCollision(position) {
    if (!this.active || this.activationCooldown > 0) return false;
    
    // Simple distance-based collision check
    const distance = position.distanceTo(this.position);
    return distance < 5; // 5 units collision radius
  }
  
  /**
   * Activate the portal (transport the player)
   * @param {Object} player Player that entered the portal
   */
  activate(player) {
    if (this.type === 'exit') {
      // Construct URL with parameters
      const url = constructPortalExitUrl(player, this.targetUrl);
      
      // Redirect to portal URL
      window.location.href = url;
    } else {
      // Entry portal effect, maybe play sound or animation
      console.log('Player entered through entry portal');
      
      // Set a cooldown to prevent immediate re-entry
      this.activationCooldown = 5; // 5 seconds
    }
  }
}

/**
 * Set up portals in the game world
 * @param {THREE.Scene} scene The scene to add portals to
 * @returns {Object} Portal system
 */
export function setupPortals(scene) {
  const portals = [];
  
  // Create exit portal near Washington Monument
  const exitPortal = new Portal(
    'exit',
    new THREE.Vector3(0, 0, -80), // Near Washington Monument
    'http://portal.pieter.com'
  );
  scene.add(exitPortal.mesh);
  portals.push(exitPortal);
  
  // Check for entry portal parameters
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('portal') === 'true') {
    // Player is coming from a portal
    const entryPortal = new Portal(
      'entry',
      new THREE.Vector3(0, 0, -60) // Spawn location
    );
    scene.add(entryPortal.mesh);
    portals.push(entryPortal);
    
    // Make entry portal disappear after some time
    setTimeout(() => {
      scene.remove(entryPortal.mesh);
      const index = portals.indexOf(entryPortal);
      if (index !== -1) {
        portals.splice(index, 1);
      }
    }, 10000); // 10 seconds
  }
  
  return {
    portals,
    
    /**
     * Update all portals
     * @param {number} delta Time since last update
     * @param {number} time Current time
     */
    update: (delta, time) => {
      portals.forEach(portal => portal.update(delta, time));
    },
    
    /**
     * Check for portal collisions with player
     * @param {Object} player Player to check
     * @returns {boolean} True if player activated a portal
     */
    checkCollisions: (player) => {
      for (const portal of portals) {
        if (portal.checkCollision(player.vehicle.mesh.position)) {
          portal.activate(player);
          return true;
        }
      }
      return false;
    }
  };
} 