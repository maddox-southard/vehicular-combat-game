import * as THREE from 'three';
import { createPickupMesh } from '../pickups/PickupMeshFactory';
import { VEHICLES } from '../vehicles/VehicleConfig';

export class Projectile {
    constructor(type, position, direction, owner) {
        this.type = type;
        this.owner = owner;
        this.speed = type === 'specialAttack' ? 1.5 : 2;
        this.damage = type === 'specialAttack' ? 15 : 5;
        this.target = null;
        this.lifeTime = 3000; // Reduced from 5000 to 3000 for shorter range
        this.spawnTime = Date.now();
        this.startPosition = position.clone(); // Store start position to calculate distance
        this.maxDistance = 50; // Maximum travel distance matching boss missile range

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
            case 'specialAttack':
                return this.createSpecialAttackMesh();
            default: // machineGun
                const geometry = new THREE.SphereGeometry(0.15);
                const material = new THREE.MeshPhongMaterial({
                    color: 0xffff00,
                    emissive: 0x666600
                });
                return new THREE.Mesh(geometry, material);
        }
    }

    createSpecialAttackMesh() {
        if (!this.owner) {
            // Default special attack if no owner
            return this.createDefaultSpecialAttack();
        }

        const vehicleType = this.owner.type; // This was the issue - using .type instead of .vehicleType
        
        // Create a unique mesh for each vehicle type
        switch (vehicleType) {
            case 'auger':
                return this.createAugerProjectile();
            case 'axel':
                return this.createAxelProjectile();
            case 'clubKid':
                return this.createClubKidProjectile();
            case 'firestarter':
                return this.createFirestarterProjectile();
            case 'flowerPower':
                return this.createFlowerPowerProjectile();
            case 'hammerhead':
                return this.createHammerheadProjectile();
            case 'mrGrimm':
                return this.createMrGrimmProjectile();
            case 'outlaw':
                return this.createOutlawProjectile();
            case 'roadkill':
                return this.createRoadkillProjectile();
            case 'spectre':
                return this.createSpectreProjectile();
            case 'thumper':
                return this.createThumperProjectile();
            case 'warthog':
                return this.createWarthogProjectile();
            case 'sweetTooth':
                return this.createSweetToothProjectile();
            default:
                return this.createDefaultSpecialAttack();
        }
    }

    createAugerProjectile() {
        const group = new THREE.Group();
        
        // Create a drill-shaped projectile
        const drillBase = new THREE.CylinderGeometry(0.3, 0.3, 0.6, 8);
        const drillTip = new THREE.ConeGeometry(0.3, 0.8, 8);
        
        const baseMaterial = new THREE.MeshPhongMaterial({
            color: 0xf4a460, // Sandy brown
            emissive: 0xa0522d,
            emissiveIntensity: 0.3
        });
        
        const tipMaterial = new THREE.MeshPhongMaterial({
            color: 0x808080, // Gray
            emissive: 0x505050,
            emissiveIntensity: 0.3,
            metalness: 0.8
        });
        
        const base = new THREE.Mesh(drillBase, baseMaterial);
        const tip = new THREE.Mesh(drillTip, tipMaterial);
        
        tip.position.y = 0.7;
        tip.rotation.x = Math.PI;
        
        group.add(base, tip);
        return group;
    }
    
    createAxelProjectile() {
        // Create a shock wave ring
        const ringGeometry = new THREE.TorusGeometry(0.5, 0.1, 8, 16);
        const ringMaterial = new THREE.MeshPhongMaterial({
            color: 0x00ffff, // Cyan
            emissive: 0x00ffff,
            emissiveIntensity: 0.5,
            transparent: true,
            opacity: 0.8
        });
        
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.rotation.x = Math.PI / 2; // Make it horizontal
        
        return ring;
    }
    
    createClubKidProjectile() {
        // Disco ball
        const ballGeometry = new THREE.SphereGeometry(0.4, 16, 16);
        const ballMaterial = new THREE.MeshStandardMaterial({
            color: 0xc0c0c0, // Silver
            emissive: 0x808080,
            emissiveIntensity: 0.7,
            metalness: 1.0,
            roughness: 0.2
        });
        
        const discoBall = new THREE.Mesh(ballGeometry, ballMaterial);
        
        // Add reflective mirror tiles
        for (let i = 0; i < 20; i++) {
            const tileGeometry = new THREE.PlaneGeometry(0.1, 0.1);
            const tileMaterial = new THREE.MeshPhongMaterial({
                color: 0xffffff,
                emissive: 0xffffff,
                emissiveIntensity: 1.0,
                side: THREE.DoubleSide
            });
            
            const tile = new THREE.Mesh(tileGeometry, tileMaterial);
            
            // Position randomly on sphere
            const phi = Math.random() * Math.PI * 2;
            const theta = Math.random() * Math.PI;
            
            tile.position.x = 0.4 * Math.sin(theta) * Math.cos(phi);
            tile.position.y = 0.4 * Math.sin(theta) * Math.sin(phi);
            tile.position.z = 0.4 * Math.cos(theta);
            
            // Make it face outward
            tile.lookAt(0, 0, 0);
            
            discoBall.add(tile);
        }
        
        return discoBall;
    }
    
    createFirestarterProjectile() {
        // Flame projectile
        const flameGeometry = new THREE.ConeGeometry(0.3, 0.8, 8);
        const flameMaterial = new THREE.MeshPhongMaterial({
            color: 0xff4500, // Orange-red
            emissive: 0xff4500,
            emissiveIntensity: 0.7,
            transparent: true,
            opacity: 0.9
        });
        
        const flame = new THREE.Mesh(flameGeometry, flameMaterial);
        flame.rotation.x = Math.PI; // Point forward
        
        return flame;
    }
    
    createFlowerPowerProjectile() {
        const group = new THREE.Group();
        
        // Flower center
        const centerGeometry = new THREE.SphereGeometry(0.2, 16, 16);
        const centerMaterial = new THREE.MeshPhongMaterial({
            color: 0xffff00, // Yellow
            emissive: 0xffff00,
            emissiveIntensity: 0.3
        });
        const center = new THREE.Mesh(centerGeometry, centerMaterial);
        
        // Flower petals
        const petalCount = 8;
        const petalGeometry = new THREE.CircleGeometry(0.25, 8);
        const petalMaterial = new THREE.MeshPhongMaterial({
            color: 0xff69b4, // Pink
            emissive: 0xff69b4,
            emissiveIntensity: 0.3,
            side: THREE.DoubleSide
        });
        
        for (let i = 0; i < petalCount; i++) {
            const petal = new THREE.Mesh(petalGeometry, petalMaterial);
            const angle = (i / petalCount) * Math.PI * 2;
            petal.position.x = Math.cos(angle) * 0.3;
            petal.position.z = Math.sin(angle) * 0.3;
            petal.lookAt(0, 0, 0);
            petal.rotation.y = Math.PI / 2;
            group.add(petal);
        }
        
        group.add(center);
        return group;
    }
    
    createHammerheadProjectile() {
        // Create a charging ram
        const ramGeometry = new THREE.BoxGeometry(0.7, 0.4, 0.4);
        const ramMaterial = new THREE.MeshPhongMaterial({
            color: 0x555555, // Dark gray
            emissive: 0x333333,
            emissiveIntensity: 0.3,
            metalness: 0.8
        });
        
        const ram = new THREE.Mesh(ramGeometry, ramMaterial);
        
        // Add spikes
        const spikeGeometry = new THREE.ConeGeometry(0.05, 0.2, 4);
        const spikeMaterial = new THREE.MeshPhongMaterial({
            color: 0x888888, // Light gray
            emissive: 0x666666,
            emissiveIntensity: 0.3,
            metalness: 0.8
        });
        
        for (let i = 0; i < 4; i++) {
            const spike = new THREE.Mesh(spikeGeometry, spikeMaterial);
            spike.position.set(0.4, 0, 0);
            spike.rotation.z = Math.PI / 2;
            spike.rotation.y = (i / 4) * Math.PI * 2;
            ram.add(spike);
        }
        
        return ram;
    }
    
    createMrGrimmProjectile() {
        // Soul collector - a mini scythe
        const group = new THREE.Group();
        
        // Handle
        const handleGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.8, 8);
        const handleMaterial = new THREE.MeshPhongMaterial({
            color: 0x4B0082, // Indigo
            emissive: 0x4B0082,
            emissiveIntensity: 0.3
        });
        
        const handle = new THREE.Mesh(handleGeometry, handleMaterial);
        handle.rotation.x = Math.PI / 2;
        
        // Blade
        const bladeGeometry = new THREE.TorusGeometry(0.3, 0.05, 8, 12, Math.PI);
        const bladeMaterial = new THREE.MeshPhongMaterial({
            color: 0xC0C0C0, // Silver
            emissive: 0xC0C0C0,
            emissiveIntensity: 0.3,
            metalness: 0.8
        });
        
        const blade = new THREE.Mesh(bladeGeometry, bladeMaterial);
        blade.position.set(0, 0, -0.4);
        blade.rotation.x = Math.PI / 2;
        
        group.add(handle, blade);
        return group;
    }
    
    createOutlawProjectile() {
        // Taser projectile
        const group = new THREE.Group();
        
        // Taser body
        const bodyGeometry = new THREE.BoxGeometry(0.3, 0.15, 0.5);
        const bodyMaterial = new THREE.MeshPhongMaterial({
            color: 0x000080, // Navy
            emissive: 0x000040,
            emissiveIntensity: 0.3
        });
        
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        
        // Electric prongs
        const prongGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.2, 8);
        const prongMaterial = new THREE.MeshPhongMaterial({
            color: 0xFFFF00, // Yellow
            emissive: 0xFFFF00,
            emissiveIntensity: 0.7
        });
        
        const prong1 = new THREE.Mesh(prongGeometry, prongMaterial);
        const prong2 = new THREE.Mesh(prongGeometry, prongMaterial);
        
        prong1.position.set(0.1, 0, 0.3);
        prong2.position.set(-0.1, 0, 0.3);
        
        group.add(body, prong1, prong2);
        return group;
    }
    
    createRoadkillProjectile() {
        // Remote bomb
        const group = new THREE.Group();
        
        // Bomb body
        const bodyGeometry = new THREE.SphereGeometry(0.3, 16, 16);
        const bodyMaterial = new THREE.MeshPhongMaterial({
            color: 0x202020, // Dark gray
            emissive: 0x101010,
            emissiveIntensity: 0.3,
            metalness: 0.8
        });
        
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        
        // Blinking light
        const lightGeometry = new THREE.SphereGeometry(0.05, 8, 8);
        const lightMaterial = new THREE.MeshPhongMaterial({
            color: 0xFF0000, // Red
            emissive: 0xFF0000,
            emissiveIntensity: 0.7
        });
        
        const light = new THREE.Mesh(lightGeometry, lightMaterial);
        light.position.y = 0.25;
        
        group.add(body, light);
        return group;
    }
    
    createSpectreProjectile() {
        // Ghost missile
        const group = new THREE.Group();
        
        // Missile body
        const bodyGeometry = new THREE.CylinderGeometry(0.15, 0.15, 0.6, 8);
        const bodyMaterial = new THREE.MeshPhongMaterial({
            color: 0xFFFFFF, // White
            emissive: 0xFFFFFF,
            emissiveIntensity: 0.3,
            transparent: true,
            opacity: 0.7
        });
        
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.rotation.x = Math.PI / 2;
        
        // Missile tip
        const tipGeometry = new THREE.ConeGeometry(0.15, 0.3, 8);
        const tipMaterial = new THREE.MeshPhongMaterial({
            color: 0xADD8E6, // Light blue
            emissive: 0xADD8E6,
            emissiveIntensity: 0.3,
            transparent: true,
            opacity: 0.7
        });
        
        const tip = new THREE.Mesh(tipGeometry, tipMaterial);
        tip.position.set(0, 0, 0.45);
        tip.rotation.x = Math.PI / 2;
        
        group.add(body, tip);
        return group;
    }
    
    createThumperProjectile() {
        // Sound wave
        const group = new THREE.Group();
        
        // Create several expanding rings
        for (let i = 0; i < 3; i++) {
            const radius = 0.2 + (i * 0.15);
            const ringGeometry = new THREE.TorusGeometry(radius, 0.03, 8, 16);
            const ringMaterial = new THREE.MeshPhongMaterial({
                color: 0x8A2BE2, // Purple
                emissive: 0x8A2BE2,
                emissiveIntensity: 0.5,
                transparent: true,
                opacity: 1 - (i * 0.2)
            });
            
            const ring = new THREE.Mesh(ringGeometry, ringMaterial);
            ring.rotation.x = Math.PI / 2; // Make it horizontal
            ring.position.z = i * 0.1; // Offset each ring
            
            group.add(ring);
        }
        
        return group;
    }
    
    createWarthogProjectile() {
        // Patriot missile
        const group = new THREE.Group();
        
        // Missile body
        const bodyGeometry = new THREE.CylinderGeometry(0.1, 0.1, 0.7, 8);
        const bodyMaterial = new THREE.MeshPhongMaterial({
            color: 0x556B2F, // Dark olive green
            emissive: 0x556B2F,
            emissiveIntensity: 0.3
        });
        
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.rotation.x = Math.PI / 2;
        
        // Missile tip
        const tipGeometry = new THREE.ConeGeometry(0.1, 0.3, 8);
        const tipMaterial = new THREE.MeshPhongMaterial({
            color: 0x8B0000, // Dark red
            emissive: 0x8B0000,
            emissiveIntensity: 0.3
        });
        
        const tip = new THREE.Mesh(tipGeometry, tipMaterial);
        tip.position.set(0, 0, 0.5);
        tip.rotation.x = Math.PI / 2;
        
        // Fins
        const finGeometry = new THREE.BoxGeometry(0.05, 0.15, 0.15);
        const finMaterial = new THREE.MeshPhongMaterial({
            color: 0x556B2F, // Dark olive green
            emissive: 0x556B2F,
            emissiveIntensity: 0.3
        });
        
        for (let i = 0; i < 4; i++) {
            const fin = new THREE.Mesh(finGeometry, finMaterial);
            fin.position.set(0, 0, -0.2);
            fin.rotation.y = (i / 4) * Math.PI * 2;
            fin.translateX(0.15);
            body.add(fin);
        }
        
        group.add(body, tip);
        return group;
    }
    
    createSweetToothProjectile() {
        // Fire missile / Flaming ice cream cone
        const group = new THREE.Group();
        
        // Cone
        const coneGeometry = new THREE.ConeGeometry(0.3, 0.8, 8);
        const coneMaterial = new THREE.MeshPhongMaterial({
            color: 0xd2691e, // Brown
            emissive: 0x8b4513,
            emissiveIntensity: 0.3
        });
        const cone = new THREE.Mesh(coneGeometry, coneMaterial);
        cone.rotation.x = Math.PI;
        cone.position.y = -0.4;
        
        // Ice cream scoop
        const scoopGeometry = new THREE.SphereGeometry(0.4, 16, 16);
        const scoopMaterial = new THREE.MeshPhongMaterial({
            color: 0xff0000, // Red
            emissive: 0xff4500,
            emissiveIntensity: 0.7
        });
        const scoop = new THREE.Mesh(scoopGeometry, scoopMaterial);
        
        // Flames
        const flameGeometry = new THREE.SphereGeometry(0.5, 8, 8);
        const flameMaterial = new THREE.MeshPhongMaterial({
            color: 0xff7700, // Orange
            emissive: 0xff7700,
            emissiveIntensity: 0.7,
            transparent: true,
            opacity: 0.8
        });
        
        const flame = new THREE.Mesh(flameGeometry, flameMaterial);
        flame.scale.set(0.8, 1.2, 0.8);
        flame.position.y = 0.2;
        
        group.add(cone, scoop, flame);
        return group;
    }

    createDefaultSpecialAttack() {
        // Default special attack - a colorful energy orb
        const geometry = new THREE.SphereGeometry(0.4, 16, 16);
        const material = new THREE.MeshPhongMaterial({
            color: 0x00ffff,
            emissive: 0x00ffff,
            emissiveIntensity: 0.5,
            transparent: true,
            opacity: 0.8
        });
        
        return new THREE.Mesh(geometry, material);
    }

    update(delta, boss) {
        if (this.type === 'specialAttack' && boss && boss.mesh) {
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

        // Check if lifetime expired (force strict time limit)
        const elapsed = Date.now() - this.spawnTime;
        if (elapsed >= this.lifeTime) {
            return false;
        }

        // Check if projectile is moving too slowly (very minimal movement threshold)
        if (movement.lengthSq() < 0.0001) {
            return false;
        }

        // Check if projectile has exceeded maximum travel distance
        const distanceTraveled = this.mesh.position.distanceTo(this.startPosition);
        if (distanceTraveled > this.maxDistance) {
            return false;
        }

        return true;
    }
} 