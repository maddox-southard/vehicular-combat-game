import * as THREE from 'three';
import { SemiTrump } from '../ai/SemiTrump';

export function createBossMesh() {
    // Create a new SemiTrump instance
    const semiTrump = new SemiTrump();

    // Get the mesh from the SemiTrump instance
    const bossMesh = semiTrump.createMesh();

    // Scale the boss to be larger
    bossMesh.scale.set(1, 1, 1);

    return bossMesh;
} 