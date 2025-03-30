import * as THREE from 'three';
import { createPickupMesh } from '../pickups/PickupMeshFactory';

export class Projectile {
    constructor(type, position, direction, owner) {
        this.type = type;
        this.owner = owner;
        this.speed = type === 'homingMissile' ? 1.5 : 2;
        this.damage = type === 'homingMissile' ? 15 : 5;
        this.target = null;
        this.lifeTime = 5000; // 5 seconds
        this.spawnTime = Date.now();
        this.isFreezeMissile = type === 'freezeMissile';

        // Create mesh using the same mesh as pickups
        this.mesh = this.createMesh(type);
        this.mesh.position.copy(position);
        this.direction = direction.normalize();
        this.mesh.lookAt(position.clone().add(direction));

        // Scale down the mesh since pickup meshes are larger
        this.mesh.scale.set(2, 2, 2);
    }

    createMesh(type) {
        switch (type) {
            case 'homingMissile':
            case 'freezeMissile':
                // Use the same mesh as pickups
                const pickupMesh = createPickupMesh(type);
                // Remove any animations or extra features from pickup
                pickupMesh.userData = {};
                return pickupMesh;

            default: // machineGun
                const geometry = new THREE.SphereGeometry(0.15);
                const material = new THREE.MeshPhongMaterial({
                    color: 0xffff00,
                    emissive: 0x666600
                });
                return new THREE.Mesh(geometry, material);
        }
    }

    update(delta, boss) {
        if (this.type === 'homingMissile' && boss && boss.mesh) {
            // Home in on boss only if boss exists and has a mesh
            const toTarget = new THREE.Vector3()
                .subVectors(boss.mesh.position, this.mesh.position)
                .normalize();

            // Gradual turning
            this.direction.lerp(toTarget, 0.1).normalize();

            // Update orientation
            this.mesh.lookAt(this.mesh.position.clone().add(this.direction));
        }

        // Move projectile
        const movement = this.direction.clone().multiplyScalar(this.speed * delta * 60);
        this.mesh.position.add(movement);

        // Check lifetime
        return Date.now() - this.spawnTime < this.lifeTime;
    }
} 