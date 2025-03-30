import * as THREE from 'three';

// Define pickup colors
const PICKUP_COLORS = {
    homingMissile: 0xffff00,  // Yellow
    freezeMissile: 0x00ffff,  // Cyan
    fullHealth: 0xff0000,     // Red
    rapidFire: 0xffa500       // Orange
};

/**
 * Create a mesh for a pickup
 * @param {string} type The type of pickup
 * @returns {THREE.Group} The created mesh group
 */
export function createPickupMesh(type) {
    switch (type) {
        case 'homingMissile':
            return createMissileMesh(PICKUP_COLORS.homingMissile);
        case 'freezeMissile':
            return createMissileMesh(PICKUP_COLORS.freezeMissile);
        case 'fullHealth':
            return createHealthMesh();
        case 'rapidFire':
            return createThunderMesh();
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