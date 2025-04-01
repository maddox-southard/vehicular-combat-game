import * as THREE from 'three';
import { SemiTrump } from '../ai/SemiTrump';

export function createBossMesh() {
    // Create a new SemiTrump instance
    const semiTrump = new SemiTrump();

    // Get the mesh from the SemiTrump instance
    const bossMesh = semiTrump.createMesh();

    // Scale the boss to be larger and more intimidating
    bossMesh.scale.set(1.2, 1.2, 1.2);
    
    // Adjust the position to start at a corner of the map for perimeter roaming
    bossMesh.position.y = 0.5;
    
    // Position at the first corner of the perimeter route (top left)
    const mapSize = 160;
    const margin = 20;
    bossMesh.position.set(-mapSize/2 + margin, 0.5, -mapSize/2 + margin);
    
    // Rotate the mesh 180 degrees so it faces forward in the direction of travel
    bossMesh.rotation.y = Math.PI;

    return bossMesh;
}

/**
 * Create a new SemiTrump boss instance with its mesh
 * @param {THREE.Scene} scene The Three.js scene
 * @returns {SemiTrump} The SemiTrump boss instance
 */
export function createBossInstance(scene) {
    // Create a new SemiTrump instance with the scene
    const semiTrump = new SemiTrump(scene);
    
    console.log('Created SemiTrump instance:', {
        health: semiTrump.health,
        maxHealth: semiTrump.maxHealth,
        hasTakeDamage: !!semiTrump.takeDamage
    });
    
    // Scale the boss to be larger and more intimidating
    semiTrump.mesh.scale.set(1.2, 1.2, 1.2);
    
    // Position at the first corner of the perimeter route (top left)
    const mapSize = 160;
    const margin = 20;
    semiTrump.mesh.position.set(-mapSize/2 + margin, 0.5, -mapSize/2 + margin);
    
    // Rotate the mesh 180 degrees so it faces forward in the direction of travel
    semiTrump.mesh.rotation.y = Math.PI;
    
    return semiTrump;
} 