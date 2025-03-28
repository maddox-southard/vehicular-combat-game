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
  // Create a new construction vehicle from scratch rather than using default
  
  // Main body - yellow box
  const bodyGeometry = new THREE.BoxGeometry(2.2, 1.2, 3.5);
  const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0xFFCC00 });
  const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
  body.position.y = 0.8;
  group.add(body);
  
  // Add 4 wheels with yellow hubs
  const wheelRadius = 0.7;
  const wheelWidth = 0.3;
  const wheelGeometry = new THREE.CylinderGeometry(wheelRadius, wheelRadius, wheelWidth, 16);
  const wheelMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
  const hubGeometry = new THREE.CylinderGeometry(0.3, 0.3, wheelWidth + 0.05, 16);
  const hubMaterial = new THREE.MeshStandardMaterial({ color: 0xFFCC00 });
  
  const wheels = [
    { x: -1.1, y: 0, z: -1.0 },
    { x: 1.1, y: 0, z: -1.0 },
    { x: -1.1, y: 0, z: 1.0 },
    { x: 1.1, y: 0, z: 1.0 }
  ];
  
  wheels.forEach(position => {
    const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
    wheel.position.set(position.x, wheelRadius, position.z);
    wheel.rotation.z = Math.PI / 2;
    group.add(wheel);
    
    // Add yellow hub in the center of each wheel
    const hub = new THREE.Mesh(hubGeometry, hubMaterial);
    hub.position.set(position.x, wheelRadius, position.z);
    hub.rotation.z = Math.PI / 2;
    group.add(hub);
  });
  
  // Add cabin
  const cabinGeometry = new THREE.BoxGeometry(1.8, 1.0, 1.6);
  const cabinMaterial = new THREE.MeshStandardMaterial({ color: 0xFFCC00 });
  const cabin = new THREE.Mesh(cabinGeometry, cabinMaterial);
  cabin.position.set(0, 1.9, 0.2);
  group.add(cabin);
  
  // Add windows to the cabin
  const windshieldGeometry = new THREE.BoxGeometry(1.6, 0.8, 0.1);
  const windowMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x88AA99,
    transparent: true,
    opacity: 0.7
  });
  
  // Front windshield
  const frontWindow = new THREE.Mesh(windshieldGeometry, windowMaterial);
  frontWindow.position.set(0, 1.9, -0.6);
  group.add(frontWindow);
  
  // Side windows
  const sideWindowGeometry = new THREE.BoxGeometry(0.1, 0.8, 1.5);
  const leftWindow = new THREE.Mesh(sideWindowGeometry, windowMaterial);
  leftWindow.position.set(-0.95, 1.9, 0.2);
  group.add(leftWindow);
  
  const rightWindow = new THREE.Mesh(sideWindowGeometry, windowMaterial);
  rightWindow.position.set(0.95, 1.9, 0.2);
  group.add(rightWindow);
  
  // Add exhaust pipes on top
  const pipeGeometry = new THREE.BoxGeometry(0.2, 0.4, 0.2);
  const pipeMaterial = new THREE.MeshStandardMaterial({ color: 0x555555 });
  
  const leftPipe = new THREE.Mesh(pipeGeometry, pipeMaterial);
  leftPipe.position.set(-0.5, 2.6, 0.4);
  group.add(leftPipe);
  
  const rightPipe = new THREE.Mesh(pipeGeometry, pipeMaterial);
  rightPipe.position.set(0.5, 2.6, 0.4);
  group.add(rightPipe);
  
  // Add drill at front
  const drillGeometry = new THREE.ConeGeometry(0.6, 1.8, 12);
  const drillMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x999999,
    metalness: 0.8,
    roughness: 0.3
  });
  const drill = new THREE.Mesh(drillGeometry, drillMaterial);
  drill.position.set(0, 0.8, -2.5);
  drill.rotation.x = -Math.PI / 2;
  group.add(drill);
  
  // Add details to the drill (rings)
  const ringGeometry = new THREE.TorusGeometry(0.4, 0.08, 8, 16);
  const ringMaterial = new THREE.MeshStandardMaterial({ color: 0x777777 });
  
  const ring1 = new THREE.Mesh(ringGeometry, ringMaterial);
  ring1.position.set(0, 0.8, -2.0);
  ring1.rotation.x = Math.PI / 2;
  group.add(ring1);
  
  const ring2 = new THREE.Mesh(ringGeometry, ringMaterial);
  ring2.position.set(0, 0.8, -1.7);
  ring2.rotation.x = Math.PI / 2;
  group.add(ring2);
}

/**
 * Creates an Axel vehicle mesh
 * @param {THREE.Group} group The group to add parts to
 */
function createAxelMesh(group) {
  // This is a unique vehicle with a person between two wheels
  
  // Create two large wheels with treads
  const wheelGeometry = new THREE.CylinderGeometry(1.2, 1.2, 0.6, 24);
  const wheelMaterial = new THREE.MeshStandardMaterial({ color: 0x222222 });
  
  const leftWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
  leftWheel.position.set(-1.5, 1.2, 0);
  leftWheel.rotation.z = Math.PI / 2;
  group.add(leftWheel);
  
  // Add tread pattern to wheels
  const hubCapGeometry = new THREE.CylinderGeometry(0.8, 0.8, 0.62, 16);
  const hubCapMaterial = new THREE.MeshStandardMaterial({ color: 0x444444 });
  
  const leftHubCap = new THREE.Mesh(hubCapGeometry, hubCapMaterial);
  leftHubCap.position.set(-1.5, 1.2, 0);
  leftHubCap.rotation.z = Math.PI / 2;
  group.add(leftHubCap);
  
  const rightWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
  rightWheel.position.set(1.5, 1.2, 0);
  rightWheel.rotation.z = Math.PI / 2;
  group.add(rightWheel);
  
  const rightHubCap = new THREE.Mesh(hubCapGeometry, hubCapMaterial);
  rightHubCap.position.set(1.5, 1.2, 0);
  rightHubCap.rotation.z = Math.PI / 2;
  group.add(rightHubCap);
  
  // Create platform for driver
  const platformGeometry = new THREE.BoxGeometry(1.5, 0.2, 1.2);
  const platformMaterial = new THREE.MeshStandardMaterial({ color: 0x555555 });
  const platform = new THREE.Mesh(platformGeometry, platformMaterial);
  platform.position.set(0, 0.5, 0);
  group.add(platform);
  
  // Add prongs in front
  const frontProngsGeometry = new THREE.BoxGeometry(0.8, 0.15, 1.0);
  const frontProngsMaterial = new THREE.MeshStandardMaterial({ color: 0x555555 });
  const frontProngs = new THREE.Mesh(frontProngsGeometry, frontProngsMaterial);
  frontProngs.position.set(0, 0.5, -1.0);
  group.add(frontProngs);
  
  // Add prong details - front forks
  const frontForkLeft = new THREE.BoxGeometry(0.15, 0.15, 0.8);
  const forkMaterial = new THREE.MeshStandardMaterial({ color: 0x555555 });
  const leftFrontFork = new THREE.Mesh(frontForkLeft, forkMaterial);
  leftFrontFork.position.set(-0.3, 0.4, -1.3);
  group.add(leftFrontFork);
  
  const rightFrontFork = new THREE.Mesh(frontForkLeft, forkMaterial);
  rightFrontFork.position.set(0.3, 0.4, -1.3);
  group.add(rightFrontFork);
  
  // Add back prongs
  const backProngsGeometry = new THREE.BoxGeometry(0.8, 0.15, 1.0);
  const backProngs = new THREE.Mesh(backProngsGeometry, frontProngsMaterial);
  backProngs.position.set(0, 0.5, 1.0);
  group.add(backProngs);
  
  // Add prong details - back forks
  const leftBackFork = new THREE.Mesh(frontForkLeft, forkMaterial);
  leftBackFork.position.set(-0.3, 0.4, 1.3);
  group.add(leftBackFork);
  
  const rightBackFork = new THREE.Mesh(frontForkLeft, forkMaterial);
  rightBackFork.position.set(0.3, 0.4, 1.3);
  group.add(rightBackFork);
  
  // Add small details to the platform - connection points
  const connectorGeometry = new THREE.BoxGeometry(0.3, 0.1, 0.3);
  const connectorMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
  
  // Front connector
  const frontConnector = new THREE.Mesh(connectorGeometry, connectorMaterial);
  frontConnector.position.set(0, 0.6, -0.5);
  group.add(frontConnector);
  
  // Back connector
  const backConnector = new THREE.Mesh(connectorGeometry, connectorMaterial);
  backConnector.position.set(0, 0.6, 0.5);
  group.add(backConnector);
  
  // Add support arms between platform and wheels
  const armGeometry = new THREE.BoxGeometry(3.0, 0.15, 0.15);
  const armMaterial = new THREE.MeshStandardMaterial({ color: 0x777777 });
  const arms = new THREE.Mesh(armGeometry, armMaterial);
  arms.position.set(0, 1.2, 0);
  group.add(arms);
  
  // Create driver with better detailing
  // Legs
  const legsGeometry = new THREE.BoxGeometry(0.4, 0.6, 0.4);
  const legsMaterial = new THREE.MeshStandardMaterial({ color: 0x1a237e });
  const legs = new THREE.Mesh(legsGeometry, legsMaterial);
  legs.position.set(0, 0.9, 0);
  group.add(legs);
  
  // Torso
  const torsoGeometry = new THREE.BoxGeometry(0.7, 0.7, 0.4);
  const torsoMaterial = new THREE.MeshStandardMaterial({ color: 0x8d6e63 });
  const torso = new THREE.Mesh(torsoGeometry, torsoMaterial);
  torso.position.set(0, 1.5, 0);
  group.add(torso);
  
  // Arms connecting to wheels
  const leftArmGeometry = new THREE.BoxGeometry(0.9, 0.2, 0.2);
  const armsMaterial = new THREE.MeshStandardMaterial({ color: 0x757575 });
  
  const leftArm = new THREE.Mesh(leftArmGeometry, armsMaterial);
  leftArm.position.set(-0.8, 1.5, 0);
  group.add(leftArm);
  
  const rightArm = new THREE.Mesh(leftArmGeometry, armsMaterial);
  rightArm.position.set(0.8, 1.5, 0);
  group.add(rightArm);
  
  // Head
  const headGeometry = new THREE.BoxGeometry(0.4, 0.4, 0.4);
  const headMaterial = new THREE.MeshStandardMaterial({ color: 0x8d6e63 });
  const head = new THREE.Mesh(headGeometry, headMaterial);
  head.position.set(0, 2.0, 0);
  group.add(head);
  
  // Sunglasses/visor
  const visorGeometry = new THREE.BoxGeometry(0.45, 0.1, 0.1);
  const visorMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 });
  const visor = new THREE.Mesh(visorGeometry, visorMaterial);
  visor.position.set(0, 2.0, 0.2);
  group.add(visor);
}

/**
 * Creates a Club Kid vehicle mesh
 * @param {THREE.Group} group The group to add parts to
 */
function createClubKidMesh(group) {
  // Main body - black box with yellow accents
  const bodyGeometry = new THREE.BoxGeometry(2.0, 1.0, 3.0);
  const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x111111 });
  const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
  body.position.y = 0.8;
  group.add(body);
  
  // Add cabin/roof
  const cabinGeometry = new THREE.BoxGeometry(1.8, 0.7, 1.5);
  const cabinMaterial = new THREE.MeshStandardMaterial({ color: 0x111111 });
  const cabin = new THREE.Mesh(cabinGeometry, cabinMaterial);
  cabin.position.set(0, 1.65, 0);
  group.add(cabin);
  
  // Add windshield
  const windshieldGeometry = new THREE.BoxGeometry(1.7, 0.6, 0.1);
  const windowMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x2c3e50,
    transparent: true,
    opacity: 0.7
  });
  
  // Front windshield
  const frontWindow = new THREE.Mesh(windshieldGeometry, windowMaterial);
  frontWindow.position.set(0, 1.65, -0.7);
  group.add(frontWindow);
  
  // Rear window
  const rearWindow = new THREE.Mesh(windshieldGeometry, windowMaterial);
  rearWindow.position.set(0, 1.65, 0.7);
  group.add(rearWindow);
  
  // Add front grille
  const grilleGeometry = new THREE.BoxGeometry(1.8, 0.3, 0.1);
  const grilleMaterial = new THREE.MeshStandardMaterial({ color: 0x888888 });
  const grille = new THREE.Mesh(grilleGeometry, grilleMaterial);
  grille.position.set(0, 0.6, -1.5);
  group.add(grille);
  
  // Add headlights
  const headlightGeometry = new THREE.BoxGeometry(0.4, 0.4, 0.1);
  const headlightMaterial = new THREE.MeshStandardMaterial({ 
    color: 0xffffff,
    emissive: 0xffffcc,
    emissiveIntensity: 0.3
  });
  
  const leftHeadlight = new THREE.Mesh(headlightGeometry, headlightMaterial);
  leftHeadlight.position.set(-0.7, 0.8, -1.5);
  group.add(leftHeadlight);
  
  const rightHeadlight = new THREE.Mesh(headlightGeometry, headlightMaterial);
  rightHeadlight.position.set(0.7, 0.8, -1.5);
  group.add(rightHeadlight);
  
  // Add taillights
  const taillightGeometry = new THREE.BoxGeometry(0.4, 0.4, 0.1);
  const taillightMaterial = new THREE.MeshStandardMaterial({ 
    color: 0xff3333,
    emissive: 0xff0000,
    emissiveIntensity: 0.3
  });
  
  const leftTaillight = new THREE.Mesh(taillightGeometry, taillightMaterial);
  leftTaillight.position.set(-0.7, 0.8, 1.5);
  group.add(leftTaillight);
  
  const rightTaillight = new THREE.Mesh(taillightGeometry, taillightMaterial);
  rightTaillight.position.set(0.7, 0.8, 1.5);
  group.add(rightTaillight);
  
  // Add yellow stripes along the sides
  const stripeGeometry = new THREE.BoxGeometry(0.1, 0.15, 3.0);
  const stripeMaterial = new THREE.MeshStandardMaterial({ color: 0xffde00 });
  
  const leftStripe = new THREE.Mesh(stripeGeometry, stripeMaterial);
  leftStripe.position.set(-1.0, 0.9, 0);
  group.add(leftStripe);
  
  const rightStripe = new THREE.Mesh(stripeGeometry, stripeMaterial);
  rightStripe.position.set(1.0, 0.9, 0);
  group.add(rightStripe);
  
  // Add front hood stripe
  const hoodStripeGeometry = new THREE.BoxGeometry(0.4, 0.15, 1.0);
  
  const leftHoodStripe = new THREE.Mesh(hoodStripeGeometry, stripeMaterial);
  leftHoodStripe.position.set(-0.5, 0.9, -0.8);
  group.add(leftHoodStripe);
  
  const rightHoodStripe = new THREE.Mesh(hoodStripeGeometry, stripeMaterial);
  rightHoodStripe.position.set(0.5, 0.9, -0.8);
  group.add(rightHoodStripe);
  
  // Add wheels with yellow rims
  const wheelRadius = 0.5;
  const wheelWidth = 0.3;
  const wheelGeometry = new THREE.CylinderGeometry(wheelRadius, wheelRadius, wheelWidth, 16);
  const wheelMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
  const rimGeometry = new THREE.CylinderGeometry(0.3, 0.3, wheelWidth + 0.02, 16);
  const rimMaterial = new THREE.MeshStandardMaterial({ color: 0xffde00 });
  
  const wheels = [
    { x: -0.9, y: 0, z: -0.9 },
    { x: 0.9, y: 0, z: -0.9 },
    { x: -0.9, y: 0, z: 0.9 },
    { x: 0.9, y: 0, z: 0.9 }
  ];
  
  wheels.forEach(position => {
    const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
    wheel.position.set(position.x, wheelRadius, position.z);
    wheel.rotation.z = Math.PI / 2;
    group.add(wheel);
    
    // Add yellow rim in the center of each wheel
    const rim = new THREE.Mesh(rimGeometry, rimMaterial);
    rim.position.set(position.x, wheelRadius, position.z);
    rim.rotation.z = Math.PI / 2;
    group.add(rim);
  });
  
  // Add yellow smiley face on roof
  const roofSmileyGeometry = new THREE.CircleGeometry(0.7, 24);
  const smileyMaterial = new THREE.MeshStandardMaterial({ color: 0xffde00 });
  const roofSmiley = new THREE.Mesh(roofSmileyGeometry, smileyMaterial);
  roofSmiley.position.set(0, 2.05, 0);
  roofSmiley.rotation.x = -Math.PI / 2;
  group.add(roofSmiley);
  
  // Add eyes to roof smiley
  const eyeGeometry = new THREE.CircleGeometry(0.12, 16);
  const eyeMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 });
  
  const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
  leftEye.position.set(-0.25, 2.06, -0.2);
  leftEye.rotation.x = -Math.PI / 2;
  group.add(leftEye);
  
  const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
  rightEye.position.set(0.25, 2.06, -0.2);
  rightEye.rotation.x = -Math.PI / 2;
  group.add(rightEye);
  
  // Add smile to roof smiley
  const smileGeometry = new THREE.TorusGeometry(0.4, 0.05, 8, 12, Math.PI);
  const smileMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 });
  const smile = new THREE.Mesh(smileGeometry, smileMaterial);
  smile.position.set(0, 2.06, 0.1);
  smile.rotation.x = -Math.PI / 2;
  group.add(smile);
  
  // Add smiley faces on sides
  const sideSmileyGeometry = new THREE.CircleGeometry(0.5, 24);
  
  // Left side smiley
  const leftSideSmiley = new THREE.Mesh(sideSmileyGeometry, smileyMaterial);
  leftSideSmiley.position.set(-1.01, 0.9, 0);
  leftSideSmiley.rotation.y = Math.PI / 2;
  group.add(leftSideSmiley);
  
  // Add eyes to left smiley
  const leftSideLeftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
  leftSideLeftEye.position.set(-1.02, 1.05, -0.15);
  leftSideLeftEye.rotation.y = Math.PI / 2;
  group.add(leftSideLeftEye);
  
  const leftSideRightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
  leftSideRightEye.position.set(-1.02, 1.05, 0.15);
  leftSideRightEye.rotation.y = Math.PI / 2;
  group.add(leftSideRightEye);
  
  // Add smile to left smiley
  const leftSideSmile = new THREE.Mesh(smileGeometry, smileMaterial);
  leftSideSmile.position.set(-1.02, 0.8, 0);
  leftSideSmile.rotation.y = Math.PI / 2; 
  leftSideSmile.rotation.z = Math.PI;
  group.add(leftSideSmile);
  
  // Right side smiley
  const rightSideSmiley = new THREE.Mesh(sideSmileyGeometry, smileyMaterial);
  rightSideSmiley.position.set(1.01, 0.9, 0);
  rightSideSmiley.rotation.y = -Math.PI / 2;
  group.add(rightSideSmiley);
  
  // Add eyes to right smiley
  const rightSideLeftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
  rightSideLeftEye.position.set(1.02, 1.05, 0.15);
  rightSideLeftEye.rotation.y = -Math.PI / 2;
  group.add(rightSideLeftEye);
  
  const rightSideRightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
  rightSideRightEye.position.set(1.02, 1.05, -0.15);
  rightSideRightEye.rotation.y = -Math.PI / 2;
  group.add(rightSideRightEye);
  
  // Add smile to right smiley
  const rightSideSmile = new THREE.Mesh(smileGeometry, smileMaterial);
  rightSideSmile.position.set(1.02, 0.8, 0);
  rightSideSmile.rotation.y = -Math.PI / 2;
  rightSideSmile.rotation.z = Math.PI;
  group.add(rightSideSmile);
  
  // Add front smiley
  const frontSmiley = new THREE.Mesh(sideSmileyGeometry, smileyMaterial);
  frontSmiley.position.set(0, 1.0, -1.51);
  group.add(frontSmiley);
  
  // Add eyes to front smiley
  const frontLeftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
  frontLeftEye.position.set(-0.15, 1.15, -1.52);
  group.add(frontLeftEye);
  
  const frontRightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
  frontRightEye.position.set(0.15, 1.15, -1.52);
  group.add(frontRightEye);
  
  // Add smile to front smiley
  const frontSmile = new THREE.Mesh(smileGeometry, smileMaterial);
  frontSmile.position.set(0, 0.9, -1.52);
  frontSmile.rotation.z = Math.PI;
  group.add(frontSmile);
  
  // Add rear smiley
  const rearSmiley = new THREE.Mesh(sideSmileyGeometry, smileyMaterial);
  rearSmiley.position.set(0, 1.0, 1.51);
  rearSmiley.rotation.y = Math.PI;
  group.add(rearSmiley);
  
  // Add eyes to rear smiley
  const rearLeftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
  rearLeftEye.position.set(0.15, 1.15, 1.52);
  rearLeftEye.rotation.y = Math.PI;
  group.add(rearLeftEye);
  
  const rearRightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
  rearRightEye.position.set(-0.15, 1.15, 1.52);
  rearRightEye.rotation.y = Math.PI;
  group.add(rearRightEye);
  
  // Add smile to rear smiley
  const rearSmile = new THREE.Mesh(smileGeometry, smileMaterial);
  rearSmile.position.set(0, 0.9, 1.52);
  rearSmile.rotation.y = Math.PI;
  rearSmile.rotation.z = Math.PI;
  group.add(rearSmile);
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