import * as THREE from 'three';

/**
 * Represents the Sweet Tooth Easter Egg pickup item in the game.
 */
export class EasterEggPickup {
  /**
   * Creates an instance of the EasterEggPickup.
   * @param {THREE.Scene} scene - The game scene to add the pickup to.
   * @param {THREE.Vector3} position - The position where the pickup should spawn.
   */
  constructor(scene, position = new THREE.Vector3(0, 0.5, 0)) {
    this.scene = scene;
    this.position = position;
    this.type = 'sweetToothEasterEgg';
    this.mesh = this.createMesh();
    this.respawnTime = 30000; // 30 seconds (controlled by server now)
    this.isActive = false; // Initially inactive until spawned
    this.respawnTimer = null; // Used only for local visualization effects

    // Bounding box for collision detection
    this.boundingBox = new THREE.Box3().setFromObject(this.mesh);
  }

  /**
   * Creates the mesh for the Easter Egg pickup (a simple egg shape).
   * @returns {THREE.Mesh} The mesh object.
   */
  createMesh() {
    // Simple egg shape using a scaled sphere
    const geometry = new THREE.SphereGeometry(0.8, 16, 12);
    geometry.scale(1, 1.3, 1); // Scale vertically to make it egg-like

    // Golden/Easter egg color
    const material = new THREE.MeshStandardMaterial({
      color: 0xFFD700, // Gold color
      metalness: 0.6,
      roughness: 0.3,
      emissive: 0x443300, // Slight glow
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(this.position);
    mesh.castShadow = true;
    mesh.name = 'EasterEggPickup'; // For debugging or identification

    return mesh;
  }

  /**
   * Spawns the pickup into the scene, making it active.
   */
  spawn() {
    if (!this.isActive) {
      this.mesh.position.copy(this.position); // Ensure correct position
      this.mesh.visible = true;
      // Check if mesh is already added, add if not (important for respawn)
      if (!this.mesh.parent) {
        this.scene.add(this.mesh);
      }
      this.isActive = true;
      this.boundingBox.setFromObject(this.mesh); // Update bounding box on spawn
      console.log('Easter Egg pickup spawned at', this.position);
    }
  }

  /**
   * Handles the collection of the pickup by a player vehicle.
   * @param {Vehicle} vehicle - The vehicle that collected the pickup.
   * @returns {boolean} True if successfully collected, false otherwise
   */
  collect(vehicle) {
    if (!this.isActive) return false;

    console.log(`Easter Egg collected by vehicle ${vehicle.type}`);
    this.isActive = false;
    this.mesh.visible = false; // Hide mesh immediately

    // NOTE: We no longer start a respawn timer here - the server controls respawning now
    
    return true; // Indicate successful collection
  }

  /**
   * Updates the pickup state (e.g., animations, checks).
   * Called in the game loop.
   * @param {number} delta - Time since last update.
   */
  update(delta) {
    if (this.isActive) {
      // Add simple animation (e.g., slow rotation)
      this.mesh.rotation.y += delta * 0.5;
      // Update bounding box if mesh moves/rotates significantly
      // this.boundingBox.setFromObject(this.mesh); // Only if needed
    }
  }

  /**
   * Cleans up resources when the pickup is no longer needed.
   */
  dispose() {
    if (this.respawnTimer) {
      clearTimeout(this.respawnTimer);
      this.respawnTimer = null;
    }
    if (this.mesh && this.mesh.parent) {
      this.scene.remove(this.mesh);
    }
    // Dispose geometry and material if they are unique to this instance
    if (this.mesh) {
        if (this.mesh.geometry) this.mesh.geometry.dispose();
        if (this.mesh.material) this.mesh.material.dispose();
    }
    console.log("Easter Egg pickup disposed.");
  }
} 