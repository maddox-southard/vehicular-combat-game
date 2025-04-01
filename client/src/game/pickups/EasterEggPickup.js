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
  constructor(scene, position = new THREE.Vector3(0, 5.0, 0)) {
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

    // White base material with pink polkadots
    const material = new THREE.MeshStandardMaterial({
      color: 0xF5F5F5, // Off-white color to match weathered look
      metalness: 0.1,
      roughness: 0.9, // More roughness for weathered appearance
      emissive: 0xF5F5F5,
      emissiveIntensity: 0.1,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(this.position);
    mesh.castShadow = true;
    mesh.name = 'EasterEggPickup'; // For debugging or identification

    // Add pink polkadots to match the ice cream truck image
    // Fewer but much larger dots with a weathered appearance
    const dotGeometry = new THREE.CircleGeometry(0.3, 16); // Flat circular dots
    const dotMaterial = new THREE.MeshStandardMaterial({
      color: 0xFF6B6B, // Slightly faded pink (to match weathered look)
      metalness: 0.0,
      roughness: 1.0, // Maximum roughness for distressed look
      emissive: 0xFF6B6B,
      emissiveIntensity: 0.2,
      side: THREE.DoubleSide,
    });

    // Simpler pattern with fewer, larger dots like on the truck
    const dotPositions = [
      { x: 0, y: 0.6, z: 0 }, // Top
      { x: 0, y: -0.6, z: 0 }, // Bottom
      { x: 0, y: 0, z: 0.7 }, // Front
      { x: 0, y: 0, z: -0.7 }, // Back
      { x: 0.7, y: 0, z: 0 }, // Right
      { x: -0.7, y: 0, z: 0 }, // Left

    ];

    // Create a group to hold all the dots
    const dotsGroup = new THREE.Group();
    mesh.add(dotsGroup);

    dotPositions.forEach(pos => {
      // Create the dot
      const dot = new THREE.Mesh(dotGeometry, dotMaterial);
      
      // Calculate normal vector for the dot position
      const direction = new THREE.Vector3(pos.x, pos.y / 1.3, pos.z).normalize();
      const rayLength = 0.81; // Slightly above egg surface
      
      // Position the dot
      dot.position.copy(direction.multiplyScalar(rayLength));
      
      // Orient the dot to face outward (align with normal vector)
      dot.lookAt(dot.position.clone().add(direction));
      
      // Add slight random rotation for more natural look
      dot.rotation.z = Math.random() * Math.PI / 6 - Math.PI / 12;
      
      // Add slight scale variation for weathered look
      const scaleVar = 0.85 + Math.random() * 0.3;
      dot.scale.set(scaleVar, scaleVar, scaleVar);
      
      // Add distressing effect - create a slightly transparent overlay with noise pattern
      const distressGeometry = new THREE.CircleGeometry(0.3, 16);
      const distressMaterial = new THREE.MeshBasicMaterial({
        color: 0xFFFFFF,
        transparent: true,
        opacity: 0.3,
        alphaTest: 0.1,
        side: THREE.DoubleSide,
      });
      
      const distressOverlay = new THREE.Mesh(distressGeometry, distressMaterial);
      distressOverlay.position.z = 0.01; // Slightly in front of the dot
      
      // Randomly remove parts of dots for worn look
      for (let i = 0; i < distressGeometry.attributes.position.count; i++) {
        if (Math.random() > 0.7) {
          const idx = i * 3;
          distressGeometry.attributes.position.array[idx] *= 1.2;
          distressGeometry.attributes.position.array[idx + 1] *= 1.2;
        }
      }
      distressGeometry.attributes.position.needsUpdate = true;
      
      dot.add(distressOverlay);
      dotsGroup.add(dot);
    });

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