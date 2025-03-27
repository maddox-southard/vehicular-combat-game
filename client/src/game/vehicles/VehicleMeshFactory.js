import * as THREE from 'three';
import { VEHICLES } from './VehicleConfig';

/**
 * Creates a 3D mesh for a vehicle
 * @param {string} vehicleType The type of vehicle to create
 * @returns {THREE.Object3D} The created vehicle mesh
 */
export function createVehicleMesh(vehicleType) {
  const vehicleConfig = VEHICLES[vehicleType];
  if (!vehicleConfig) {
    throw new Error(`Invalid vehicle type: ${vehicleType}`);
  }
  
  // Create a group to hold all parts of the vehicle
  const group = new THREE.Group();
  
  // For now, create a simplified box model for each vehicle
  // In a full implementation, we would load more detailed models
  
  switch(vehicleType) {
    case 'auger':
      createAugerMesh(group);
      break;
    case 'axel':
      createAxelMesh(group);
      break;
    case 'clubKid':
      createClubKidMesh(group);
      break;
    case 'firestarter':
      createFirestarterMesh(group);
      break;
    case 'flowerPower':
      createFlowerPowerMesh(group);
      break;
    case 'hammerhead':
      createHammerheadMesh(group);
      break;
    case 'mrGrimm':
      createMrGrimmMesh(group);
      break;
    case 'outlaw':
      createOutlawMesh(group);
      break;
    case 'roadkill':
      createRoadkillMesh(group);
      break;
    case 'spectre':
      createSpectreMesh(group);
      break;
    case 'thumper':
      createThumperMesh(group);
      break;
    case 'warthog':
      createWarthogMesh(group);
      break;
    default:
      // Default simple vehicle if type not recognized
      createDefaultVehicleMesh(group);
  }
  
  // Scale the vehicle according to its configuration
  const scale = vehicleConfig.modelScale || 1.0;
  group.scale.set(scale, scale, scale);
  
  // Make sure vehicles cast shadows
  group.traverse(object => {
    if (object.isMesh) {
      object.castShadow = true;
      object.receiveShadow = true;
    }
  });
  
  return group;
}

/**
 * Creates a simple default vehicle mesh
 * @param {THREE.Group} group The group to add parts to
 */
function createDefaultVehicleMesh(group) {
  // Body
  const bodyGeometry = new THREE.BoxGeometry(2, 1, 4);
  const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
  const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
  body.position.y = 0.5;
  group.add(body);
  
  // Add 4 wheels
  const wheelGeometry = new THREE.CylinderGeometry(0.5, 0.5, 0.2, 16);
  const wheelMaterial = new THREE.MeshStandardMaterial({ color: 0x111111 });
  
  const wheels = [
    { x: -1, y: 0, z: -1.2 },
    { x: 1, y: 0, z: -1.2 },
    { x: -1, y: 0, z: 1.2 },
    { x: 1, y: 0, z: 1.2 }
  ];
  
  wheels.forEach(position => {
    const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
    wheel.position.set(position.x, position.y, position.z);
    wheel.rotation.z = Math.PI / 2;
    group.add(wheel);
  });
  
  // Add cabin
  const cabinGeometry = new THREE.BoxGeometry(1.8, 0.8, 2);
  const cabinMaterial = new THREE.MeshStandardMaterial({ color: 0x666666 });
  const cabin = new THREE.Mesh(cabinGeometry, cabinMaterial);
  cabin.position.set(0, 1.4, 0);
  group.add(cabin);
}

/**
 * Creates an Auger vehicle mesh
 * @param {THREE.Group} group The group to add parts to
 */
function createAugerMesh(group) {
  // Base vehicle
  createDefaultVehicleMesh(group);
  
  // Add mining drill at front
  const drillGeometry = new THREE.ConeGeometry(0.5, 2, 16);
  const drillMaterial = new THREE.MeshStandardMaterial({ color: 0x888888 });
  const drill = new THREE.Mesh(drillGeometry, drillMaterial);
  drill.position.set(0, 0.5, -3);
  drill.rotation.x = -Math.PI / 2;
  group.add(drill);
  
  // Additional armor on sides
  const armorGeometry = new THREE.BoxGeometry(0.5, 1, 3);
  const armorMaterial = new THREE.MeshStandardMaterial({ color: 0x777777 });
  
  const leftArmor = new THREE.Mesh(armorGeometry, armorMaterial);
  leftArmor.position.set(-1.25, 0.5, 0);
  group.add(leftArmor);
  
  const rightArmor = new THREE.Mesh(armorGeometry, armorMaterial);
  rightArmor.position.set(1.25, 0.5, 0);
  group.add(rightArmor);
}

/**
 * Creates an Axel vehicle mesh
 * @param {THREE.Group} group The group to add parts to
 */
function createAxelMesh(group) {
  // This is a unique vehicle with a person between two wheels
  
  // Create two large wheels
  const wheelGeometry = new THREE.CylinderGeometry(1.2, 1.2, 0.5, 16);
  const wheelMaterial = new THREE.MeshStandardMaterial({ color: 0x222222 });
  
  const leftWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
  leftWheel.position.set(-1.5, 1.2, 0);
  leftWheel.rotation.z = Math.PI / 2;
  group.add(leftWheel);
  
  const rightWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
  rightWheel.position.set(1.5, 1.2, 0);
  rightWheel.rotation.z = Math.PI / 2;
  group.add(rightWheel);
  
  // Create driver in the middle
  const torsoGeometry = new THREE.BoxGeometry(0.8, 1, 0.5);
  const torsoMaterial = new THREE.MeshStandardMaterial({ color: 0x0000ff });
  const torso = new THREE.Mesh(torsoGeometry, torsoMaterial);
  torso.position.set(0, 1.2, 0);
  group.add(torso);
  
  // Head
  const headGeometry = new THREE.SphereGeometry(0.4, 16, 16);
  const headMaterial = new THREE.MeshStandardMaterial({ color: 0xffddcc });
  const head = new THREE.Mesh(headGeometry, headMaterial);
  head.position.set(0, 2.1, 0);
  group.add(head);
  
  // Arms (axles)
  const armGeometry = new THREE.CylinderGeometry(0.1, 0.1, 3, 8);
  const armMaterial = new THREE.MeshStandardMaterial({ color: 0x777777 });
  const arms = new THREE.Mesh(armGeometry, armMaterial);
  arms.position.set(0, 1.2, 0);
  arms.rotation.z = Math.PI / 2;
  group.add(arms);
}

// Implement simplified meshes for each vehicle type
// For brevity, I'll implement a couple more examples

/**
 * Creates a Club Kid vehicle mesh
 * @param {THREE.Group} group The group to add parts to
 */
function createClubKidMesh(group) {
  // Base vehicle
  createDefaultVehicleMesh(group);
  
  // Add disco ball on top
  const discoGeometry = new THREE.SphereGeometry(0.6, 8, 8);
  const discoMaterial = new THREE.MeshStandardMaterial({ 
    color: 0xffffff,
    emissive: 0x555555
  });
  const discoBall = new THREE.Mesh(discoGeometry, discoMaterial);
  discoBall.position.set(0, 2.2, 0);
  group.add(discoBall);
  
  // Add neon lights
  const neonGeometry = new THREE.BoxGeometry(2.4, 0.1, 4.4);
  const neonMaterial = new THREE.MeshStandardMaterial({ 
    color: 0xff00ff,
    emissive: 0xff00ff,
    emissiveIntensity: 0.5
  });
  const neonLights = new THREE.Mesh(neonGeometry, neonMaterial);
  neonLights.position.set(0, 0.2, 0);
  group.add(neonLights);
}

/**
 * Creates a Mr. Grimm vehicle mesh
 * @param {THREE.Group} group The group to add parts to
 */
function createMrGrimmMesh(group) {
  // Motorcycle body
  const bodyGeometry = new THREE.BoxGeometry(0.8, 0.8, 3);
  const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 });
  const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
  body.position.y = 0.8;
  group.add(body);
  
  // Create two wheels
  const wheelGeometry = new THREE.CylinderGeometry(0.8, 0.8, 0.2, 16);
  const wheelMaterial = new THREE.MeshStandardMaterial({ color: 0x111111 });
  
  const frontWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
  frontWheel.position.set(0, 0.8, -1.2);
  frontWheel.rotation.z = Math.PI / 2;
  group.add(frontWheel);
  
  const backWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
  backWheel.position.set(0, 0.8, 1.2);
  backWheel.rotation.z = Math.PI / 2;
  group.add(backWheel);
  
  // Add rider
  const riderGeometry = new THREE.BoxGeometry(0.6, 1.2, 0.8);
  const riderMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
  const rider = new THREE.Mesh(riderGeometry, riderMaterial);
  rider.position.set(0, 1.9, 0);
  group.add(rider);
  
  // Add skull head
  const skullGeometry = new THREE.SphereGeometry(0.4, 16, 16);
  const skullMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });
  const skull = new THREE.Mesh(skullGeometry, skullMaterial);
  skull.position.set(0, 2.7, 0);
  group.add(skull);
  
  // Add scythe
  const handleGeometry = new THREE.CylinderGeometry(0.05, 0.05, 2, 8);
  const bladeMaterial = new THREE.MeshStandardMaterial({ color: 0x999999 });
  const handle = new THREE.Mesh(handleGeometry, bladeMaterial);
  handle.position.set(0.5, 2, 0);
  handle.rotation.z = Math.PI / 4;
  group.add(handle);
  
  const bladeGeometry = new THREE.BoxGeometry(0.1, 1, 0.05);
  const blade = new THREE.Mesh(bladeGeometry, bladeMaterial);
  blade.position.set(1.2, 3, 0);
  group.add(blade);
}

// Placeholder implementations for other vehicles
// In a real implementation, each would have a detailed model

function createFirestarterMesh(group) {
  createDefaultVehicleMesh(group);
  // Add fire truck specific details
}

function createFlowerPowerMesh(group) {
  createDefaultVehicleMesh(group);
  // Add hippie van specific details
}

function createHammerheadMesh(group) {
  createDefaultVehicleMesh(group);
  // Add SUV specific details
}

function createOutlawMesh(group) {
  createDefaultVehicleMesh(group);
  // Add police car specific details
}

function createRoadkillMesh(group) {
  createDefaultVehicleMesh(group);
  // Add sports car specific details
}

function createSpectreMesh(group) {
  createDefaultVehicleMesh(group);
  // Add ghost car specific details
}

function createThumperMesh(group) {
  createDefaultVehicleMesh(group);
  // Add lowrider specific details
}

function createWarthogMesh(group) {
  createDefaultVehicleMesh(group);
  // Add tank specific details
} 