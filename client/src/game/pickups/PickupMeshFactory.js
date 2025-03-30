import * as THREE from 'three';

// Define pickup colors
const PICKUP_COLORS = {
    specialAttack: 0xffff00,  // Yellow
    fullHealth: 0xff0000      // Red
};

/**
 * Create a mesh for a pickup
 * @param {string} type The type of pickup
 * @returns {THREE.Group} The created mesh group
 */
export function createPickupMesh(type) {
    switch (type) {
        case 'specialAttack':
            return createSpecialAttackMesh();
        case 'fullHealth':
            return createHealthMesh();
        default:
            return createDefaultMesh();
    }
}

function createMissileMesh(color) {
    const group = new THREE.Group();

    // Missile body
    const bodyGeometry = new THREE.CylinderGeometry(0.2, 0.2, 1.5, 16);
    const bodyMaterial = new THREE.MeshPhongMaterial({
        color: color,
        emissive: color,
        emissiveIntensity: 0.3,
        transparent: true,
        opacity: 0.8
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.rotation.x = Math.PI / 2;

    // Missile nose cone
    const noseGeometry = new THREE.ConeGeometry(0.2, 0.5, 16);
    const nose = new THREE.Mesh(noseGeometry, bodyMaterial);
    nose.position.z = 1;
    nose.rotation.x = Math.PI / 2;

    // Fins
    const finGeometry = new THREE.BoxGeometry(0.1, 0.8, 0.4);
    const finMaterial = new THREE.MeshPhongMaterial({
        color: 0x808080,
        emissive: 0x404040
    });

    const fins = [];
    for (let i = 0; i < 4; i++) {
        const fin = new THREE.Mesh(finGeometry, finMaterial);
        fin.position.z = -0.5;
        fin.rotation.z = (Math.PI * i) / 2;
        fins.push(fin);
    }

    group.add(body, nose, ...fins);
    group.scale.set(2, 2, 2);
    group.userData.floatOffset = Math.random() * Math.PI * 2;

    return group;
}

function createHealthMesh() {
    const group = new THREE.Group();

    // Create plus sign
    const material = new THREE.MeshPhongMaterial({
        color: PICKUP_COLORS.fullHealth,
        emissive: PICKUP_COLORS.fullHealth,
        emissiveIntensity: 0.3,
        transparent: true,
        opacity: 0.8
    });

    // Vertical bar
    const verticalGeometry = new THREE.BoxGeometry(0.4, 1.5, 0.4);
    const vertical = new THREE.Mesh(verticalGeometry, material);

    // Horizontal bar
    const horizontalGeometry = new THREE.BoxGeometry(1.5, 0.4, 0.4);
    const horizontal = new THREE.Mesh(horizontalGeometry, material);

    group.add(vertical, horizontal);
    group.scale.set(2, 2, 2);
    group.userData.floatOffset = Math.random() * Math.PI * 2;

    return group;
}

function createThunderMesh() {
    const group = new THREE.Group();

    const material = new THREE.MeshPhongMaterial({
        color: PICKUP_COLORS.rapidFire,
        emissive: PICKUP_COLORS.rapidFire,
        emissiveIntensity: 0.3,
        transparent: true,
        opacity: 0.8
    });

    // Create lightning bolt shape using custom geometry
    const shape = new THREE.Shape();
    shape.moveTo(0, 1);
    shape.lineTo(0.3, 0.3);
    shape.lineTo(0.6, 0.5);
    shape.lineTo(0.3, -0.3);
    shape.lineTo(0, -1);
    shape.lineTo(-0.3, -0.3);
    shape.lineTo(-0.6, -0.5);
    shape.lineTo(-0.3, 0.3);
    shape.closePath();

    const geometry = new THREE.ExtrudeGeometry(shape, {
        depth: 0.2,
        bevelEnabled: false
    });

    const thunder = new THREE.Mesh(geometry, material);
    thunder.rotation.x = Math.PI / 2;

    group.add(thunder);
    group.scale.set(2, 2, 2);
    group.userData.floatOffset = Math.random() * Math.PI * 2;

    return group;
}

function createDefaultMesh() {
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshPhongMaterial({
        color: 0xffffff,
        emissive: 0xffffff,
        emissiveIntensity: 0.3,
        transparent: true,
        opacity: 0.8
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.scale.set(2, 2, 2);
    mesh.userData.floatOffset = Math.random() * Math.PI * 2;

    return mesh;
}

function createSpecialAttackMesh() {
    const group = new THREE.Group();

    // Create a geometric 3D "S" shape
    const frontMaterial = new THREE.MeshPhongMaterial({
        color: 0x0000cc, // Deep blue
        emissive: 0x0000aa,
        emissiveIntensity: 0.2,
        transparent: true,
        opacity: 0.9
    });
    
    const sideMaterial = new THREE.MeshPhongMaterial({
        color: 0x9370db, // Medium purple for sides
        emissive: 0x9370db,
        emissiveIntensity: 0.2,
        transparent: true,
        opacity: 0.9
    });
    
    // Create materials array for the cubes (front, side, side, side, side, back)
    const materials = [
        sideMaterial, sideMaterial,
        frontMaterial, sideMaterial,
        sideMaterial, sideMaterial
    ];

    // Top horizontal section
    const topBar = new THREE.Mesh(
        new THREE.BoxGeometry(0.8, 0.2, 0.3),
        materials
    );
    topBar.position.set(0, 0.9, 0);
    
    // Middle horizontal section
    const middleBar = new THREE.Mesh(
        new THREE.BoxGeometry(0.8, 0.2, 0.3),
        materials
    );
    middleBar.position.set(0, 0, 0);
    
    // Bottom horizontal section
    const bottomBar = new THREE.Mesh(
        new THREE.BoxGeometry(0.8, 0.2, 0.3),
        materials
    );
    bottomBar.position.set(0, -0.9, 0);
    
    // Top vertical section (right side)
    const topRight = new THREE.Mesh(
        new THREE.BoxGeometry(0.2, 0.7, 0.3),
        materials
    );
    topRight.position.set(0.3, 0.5, 0);
    
    // Bottom vertical section (left side)
    const bottomLeft = new THREE.Mesh(
        new THREE.BoxGeometry(0.2, 0.7, 0.3),
        materials
    );
    bottomLeft.position.set(-0.3, -0.5, 0);
    
    // Add all pieces to the group
    group.add(topBar, middleBar, bottomBar, topRight, bottomLeft);
    
    // Slight rotation to make it more visible
    group.rotation.y = Math.PI / 4;
    
    // Scaling and floating behavior
    group.scale.set(2, 2, 2);
    group.userData.floatOffset = Math.random() * Math.PI * 2;
    
    return group;
} 