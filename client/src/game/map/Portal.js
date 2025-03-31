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
   * @param {string} label Optional label text for the portal
   */
  constructor(type, position, targetUrl = '', label = '') {
    this.type = type; // 'entry' or 'exit'
    this.position = position;
    this.targetUrl = targetUrl;
    this.label = label;
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
    
    // Create label if provided
    if (this.label) {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.width = 256;
      canvas.height = 64;
      
      // Draw text on canvas
      context.fillStyle = '#ffffff';
      context.font = 'Bold 24px Arial';
      context.textAlign = 'center';
      context.fillText(this.label, 128, 40);
      
      // Create texture from canvas
      const texture = new THREE.CanvasTexture(canvas);
      const labelMaterial = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        side: THREE.DoubleSide
      });
      
      // Create label mesh
      const labelGeometry = new THREE.PlaneGeometry(8, 2);
      const labelMesh = new THREE.Mesh(labelGeometry, labelMaterial);
      labelMesh.position.set(0, 5, 0); // Position above portal
      labelMesh.rotation.x = 0; // Face the player
      
      group.add(labelMesh);
    }
    
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
      
      // If the entry portal has a target URL (ref), send the player back
      if (this.targetUrl) {
        // Create a slight delay for better UX
        setTimeout(() => {
          const url = constructPortalExitUrl(player, this.targetUrl);
          window.location.href = url;
        }, 500);
      }
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
  
  // Move exit portal in front of Washington Monument (south side of map)
  // Get map dimensions
  const mapDimensions = window.gameState?.map?.getDimensions() || { width: 320, length: 480 };
  
  // Create exit portal in front of Washington Monument (south side of map)
  const exitPortal = new Portal(
    'exit',
    new THREE.Vector3(0, 0, mapDimensions.length/2 - 60), // In front of Washington Monument
    'http://portal.pieter.com',
    'Vibeverse Portal' // Add label
  );
  scene.add(exitPortal.mesh);
  portals.push(exitPortal);
  
  // Check for entry portal parameters
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('portal') === 'true') {
    // Player is coming from a portal
    const ref = urlParams.get('ref') || '';
    
    // Create entry portal - spawn point with return capability
    const entryPortal = new Portal(
      'entry',
      new THREE.Vector3(0, 0, -mapDimensions.length/3), // North side of map
      ref, // Set ref as target URL to go back
      ref ? 'Return Portal' : '' // Add label if we have a return destination
    );
    scene.add(entryPortal.mesh);
    portals.push(entryPortal);
    
    // Entry portal should stay permanently if it has a return destination
    if (!ref) {
      // Make entry portal disappear after some time only if it has no return destination
      setTimeout(() => {
        scene.remove(entryPortal.mesh);
        const index = portals.indexOf(entryPortal);
        if (index !== -1) {
          portals.splice(index, 1);
        }
      }, 30000); // 30 seconds
    }
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