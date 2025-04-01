import * as THREE from 'three';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';

// Define pickup colors
const PICKUP_COLORS = {
    specialAttack: 0xffff00,  // Yellow
    fullHealth: 0xff0000      // Red
};

// Cache for loaded font to avoid reloading
let cachedFont = null;

// Font loading promise
let fontPromise = null;

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
    
    // Create a temporary placeholder while the font loads
    const placeholderGeometry = new THREE.TorusGeometry(0.8, 0.3, 16, 50);
    const specialAttackMaterial = new THREE.MeshPhongMaterial({
        color: 0x0000ff, // Blue
        emissive: 0x0000aa,
        emissiveIntensity: 0.3,
        transparent: true,
        opacity: 0.9,
        shininess: 30
    });
    
    const placeholder = new THREE.Mesh(placeholderGeometry, specialAttackMaterial);
    group.add(placeholder);
    
    // Load the font and create the "S" once it's ready
    if (!fontPromise) {
        const loader = new FontLoader();
        fontPromise = new Promise((resolve) => {
            loader.load('https://threejs.org/examples/fonts/helvetiker_bold.typeface.json', function(font) {
                cachedFont = font;
                resolve(font);
            });
        });
    }
    
    // Replace the placeholder with actual S when font loads
    fontPromise.then((font) => {
        // Remove placeholder
        group.remove(placeholder);
        
        // Create the "S" geometry with proper depth and bevel
        const textGeometry = new TextGeometry('S', {
            font: font,
            size: 1.2,
            height: 0.4,
            curveSegments: 12,
            bevelEnabled: true,
            bevelThickness: 0.1,
            bevelSize: 0.05,
            bevelOffset: 0,
            bevelSegments: 5
        });
        
        // Center the geometry
        textGeometry.computeBoundingBox();
        const centerOffset = new THREE.Vector3();
        textGeometry.boundingBox.getCenter(centerOffset).negate();
        
        // Create a glowing blue material for the S
        const textMaterial = new THREE.MeshPhongMaterial({
            color: 0x0055ff,  // Bright blue
            emissive: 0x0033cc,
            emissiveIntensity: 0.4,
            specular: 0x6666ff,
            shininess: 30,
            transparent: true,
            opacity: 0.9
        });
        
        // Create the mesh and position it
        const textMesh = new THREE.Mesh(textGeometry, textMaterial);
        textMesh.position.copy(centerOffset);
        
        // Add a subtle glow effect using a point light
        const glow = new THREE.PointLight(0x0066ff, 1, 3);
        glow.position.set(0, 0, 0);
        
        group.add(textMesh, glow);
    });
    
    // Slight rotation to make it more visible from all angles
    group.rotation.set(0, Math.PI / 4, 0);
    
    // Scaling and floating behavior
    group.scale.set(1.5, 1.5, 1.5);
    group.userData.floatOffset = Math.random() * Math.PI * 2;
    
    return group;
} 