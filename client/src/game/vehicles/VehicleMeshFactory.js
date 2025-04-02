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
    case 'sweetTooth':
      createSweetToothMesh(group);
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
  // Motorcycle body - red frame
  const bodyGeometry = new THREE.BoxGeometry(0.8, 0.6, 2.0);
  const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0xcc0000 }); // Red color
  const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
  body.position.y = 0.8;
  group.add(body);
  
  // Rear section of the bike body
  const rearBodyGeometry = new THREE.BoxGeometry(0.8, 0.5, 0.7);
  const rearBody = new THREE.Mesh(rearBodyGeometry, bodyMaterial);
  rearBody.position.set(0, 0.9, 1.1);
  group.add(rearBody);
  
  // Add fuel tank (red)
  const fuelTankGeometry = new THREE.BoxGeometry(0.7, 0.4, 0.8);
  const fuelTank = new THREE.Mesh(fuelTankGeometry, bodyMaterial);
  fuelTank.position.set(0, 1.0, 0.2);
  group.add(fuelTank);
  
  // Create large wheels - bigger black wheels
  const wheelGeometry = new THREE.CylinderGeometry(0.7, 0.7, 0.2, 16);
  const wheelMaterial = new THREE.MeshStandardMaterial({ color: 0x111111 });
  
  // Front wheel
  const frontWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
  frontWheel.position.set(0, 0.7, -1.0);
  frontWheel.rotation.z = Math.PI / 2;
  group.add(frontWheel);
  
  // Rear wheel
  const backWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
  backWheel.position.set(0, 0.7, 1.0);
  backWheel.rotation.z = Math.PI / 2;
  group.add(backWheel);
  
  // Add front fork
  const forkGeometry = new THREE.BoxGeometry(0.12, 1.0, 0.12);
  const forkMaterial = new THREE.MeshStandardMaterial({ color: 0xaaaaaa });
  
  // Left fork
  const leftFork = new THREE.Mesh(forkGeometry, forkMaterial);
  leftFork.position.set(-0.3, 1.0, -0.8);
  leftFork.rotation.x = 0.3;
  group.add(leftFork);
  
  // Right fork
  const rightFork = new THREE.Mesh(forkGeometry, forkMaterial);
  rightFork.position.set(0.3, 1.0, -0.8);
  rightFork.rotation.x = 0.3;
  group.add(rightFork);
  
  // Add front fairing with skull design
  const fairingGeometry = new THREE.BoxGeometry(0.6, 0.5, 0.3);
  const fairingMaterial = new THREE.MeshStandardMaterial({ color: 0xcc0000 });
  const fairing = new THREE.Mesh(fairingGeometry, fairingMaterial);
  fairing.position.set(0, 1.1, -1.0);
  group.add(fairing);
  
  // Add skull-like shape on front fairing
  const skullGeometry = new THREE.BoxGeometry(0.4, 0.3, 0.1);
  const skullMaterial = new THREE.MeshStandardMaterial({ color: 0xffffdd });
  const skull = new THREE.Mesh(skullGeometry, skullMaterial);
  skull.position.set(0, 1.1, -1.16);
  group.add(skull);
  
  // Add front headlight
  const headlightGeometry = new THREE.BoxGeometry(0.3, 0.2, 0.05);
  const headlightMaterial = new THREE.MeshStandardMaterial({ 
    color: 0xffffee,
    emissive: 0xffffee,
    emissiveIntensity: 0.2
  });
  const headlight = new THREE.Mesh(headlightGeometry, headlightMaterial);
  headlight.position.set(0, 1.0, -1.2);
  group.add(headlight);
  
  // Add handlebar
  const handlebarGeometry = new THREE.BoxGeometry(0.8, 0.08, 0.08);
  const handlebarMaterial = new THREE.MeshStandardMaterial({ color: 0x222222 });
  const handlebar = new THREE.Mesh(handlebarGeometry, handlebarMaterial);
  handlebar.position.set(0, 1.4, -0.7);
  group.add(handlebar);
  
  // Add left handlebar grip
  const leftGripGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.15, 8);
  const leftGrip = new THREE.Mesh(leftGripGeometry, handlebarMaterial);
  leftGrip.position.set(-0.45, 1.4, -0.7);
  leftGrip.rotation.z = Math.PI / 2;
  group.add(leftGrip);
  
  // Add right handlebar grip
  const rightGrip = new THREE.Mesh(leftGripGeometry, handlebarMaterial);
  rightGrip.position.set(0.45, 1.4, -0.7);
  rightGrip.rotation.z = Math.PI / 2;
  group.add(rightGrip);
  
  // Add seat
  const seatGeometry = new THREE.BoxGeometry(0.6, 0.15, 0.8);
  const seatMaterial = new THREE.MeshStandardMaterial({ color: 0x222222 });
  const seat = new THREE.Mesh(seatGeometry, seatMaterial);
  seat.position.set(0, 1.15, 0.6);
  group.add(seat);
  
  // Add rider
  
  // Rider legs
  const legsGeometry = new THREE.BoxGeometry(0.6, 0.5, 0.4);
  const legsMaterial = new THREE.MeshStandardMaterial({ color: 0x3e2723 }); // Brown
  const legs = new THREE.Mesh(legsGeometry, legsMaterial);
  legs.position.set(0, 1.4, 0.4);
  group.add(legs);
  
  // Rider torso
  const torsoGeometry = new THREE.BoxGeometry(0.7, 0.6, 0.5);
  const torsoMaterial = new THREE.MeshStandardMaterial({ color: 0x3e2723 }); // Brown
  const torso = new THREE.Mesh(torsoGeometry, torsoMaterial);
  torso.position.set(0, 1.9, 0.3);
  group.add(torso);
  
  // Rider arms
  const armsGeometry = new THREE.BoxGeometry(0.2, 0.15, 0.6);
  const armsMaterial = new THREE.MeshStandardMaterial({ color: 0x3e2723 }); // Brown
  
  // Left arm
  const leftArm = new THREE.Mesh(armsGeometry, armsMaterial);
  leftArm.position.set(-0.4, 1.8, -0.1);
  leftArm.rotation.y = -0.4;
  group.add(leftArm);
  
  // Right arm
  const rightArm = new THREE.Mesh(armsGeometry, armsMaterial);
  rightArm.position.set(0.4, 1.8, -0.1);
  rightArm.rotation.y = 0.4;
  group.add(rightArm);
  
  // Rider head
  const headGeometry = new THREE.BoxGeometry(0.4, 0.4, 0.4);
  const headMaterial = new THREE.MeshStandardMaterial({ color: 0xdeb887 }); // Beige/tan
  const head = new THREE.Mesh(headGeometry, headMaterial);
  head.position.set(0, 2.3, 0.3);
  group.add(head);
  
  // Rider helmet/mask back part
  const helmetBackGeometry = new THREE.BoxGeometry(0.42, 0.42, 0.2);
  const helmetMaterial = new THREE.MeshStandardMaterial({ color: 0x111111 });
  const helmetBack = new THREE.Mesh(helmetBackGeometry, helmetMaterial);
  helmetBack.position.set(0, 2.3, 0.41);
  group.add(helmetBack);
  
  // Add exhaust pipes
  const exhaustGeometry = new THREE.CylinderGeometry(0.06, 0.06, 0.8, 8);
  const exhaustMaterial = new THREE.MeshStandardMaterial({ color: 0x999999 });
  
  // Left exhaust
  const leftExhaust = new THREE.Mesh(exhaustGeometry, exhaustMaterial);
  leftExhaust.position.set(-0.25, 0.6, 0.8);
  leftExhaust.rotation.z = Math.PI / 2;
  leftExhaust.rotation.y = -0.2;
  group.add(leftExhaust);
  
  // Right exhaust
  const rightExhaust = new THREE.Mesh(exhaustGeometry, exhaustMaterial);
  rightExhaust.position.set(0.25, 0.6, 0.8);
  rightExhaust.rotation.z = Math.PI / 2;
  rightExhaust.rotation.y = 0.2;
  group.add(rightExhaust);
  
  // Add wheel hubs
  const hubGeometry = new THREE.CylinderGeometry(0.2, 0.2, 0.22, 16);
  const hubMaterial = new THREE.MeshStandardMaterial({ color: 0x777777 });
  
  // Front hub
  const frontHub = new THREE.Mesh(hubGeometry, hubMaterial);
  frontHub.position.set(0, 0.7, -1.0);
  frontHub.rotation.z = Math.PI / 2;
  group.add(frontHub);
  
  // Rear hub
  const rearHub = new THREE.Mesh(hubGeometry, hubMaterial);
  rearHub.position.set(0, 0.7, 1.0);
  rearHub.rotation.z = Math.PI / 2;
  group.add(rearHub);
}

/**
 * Creates a Firestarter vehicle mesh (Hot Rod with flames)
 * @param {THREE.Group} group The group to add parts to
 */
function createFirestarterMesh(group) {
  // Main body - classic hot rod style with black color
  const bodyGeometry = new THREE.BoxGeometry(2.0, 0.7, 3.2);
  const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x0f0f0f });
  const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
  body.position.y = 0.6;
  group.add(body);
  
  // Add front grille (yellow)
  const grilleGeometry = new THREE.BoxGeometry(1.6, 0.5, 0.3);
  const grilleMaterial = new THREE.MeshStandardMaterial({ color: 0xffde00 });
  const grille = new THREE.Mesh(grilleGeometry, grilleMaterial);
  grille.position.set(0, 0.6, -1.7);
  group.add(grille);
  
  // Add grille details (small vertical bars)
  const grilleBarGeometry = new THREE.BoxGeometry(0.08, 0.4, 0.05);
  const grilleBarMaterial = new THREE.MeshStandardMaterial({ color: 0x111111 });
  
  for (let i = -3; i <= 3; i++) {
    const bar = new THREE.Mesh(grilleBarGeometry, grilleBarMaterial);
    bar.position.set(i * 0.2, 0.6, -1.85);
    group.add(bar);
  }
  
  // Add cabin
  const cabinGeometry = new THREE.BoxGeometry(1.8, 0.7, 1.0);
  const cabinMaterial = new THREE.MeshStandardMaterial({ color: 0x0a0a0a });
  const cabin = new THREE.Mesh(cabinGeometry, cabinMaterial);
  cabin.position.set(0, 1.3, 0);
  group.add(cabin);
  
  // Add windshield
  const windshieldGeometry = new THREE.BoxGeometry(1.7, 0.5, 0.1);
  const windowMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x3a5c7b,
    transparent: true,
    opacity: 0.7
  });
  
  // Front windshield
  const frontWindow = new THREE.Mesh(windshieldGeometry, windowMaterial);
  frontWindow.position.set(0, 1.3, -0.5);
  frontWindow.rotation.x = Math.PI * 0.1;
  group.add(frontWindow);
  
  // Engine block with exposed cylinders
  const engineGeometry = new THREE.BoxGeometry(1.8, 0.5, 0.8);
  const engineMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x333333,
    metalness: 0.8,
    roughness: 0.2
  });
  const engine = new THREE.Mesh(engineGeometry, engineMaterial);
  engine.position.set(0, 1.0, -1.3);
  group.add(engine);
  
  // Engine cylinders
  const cylinderGeometry = new THREE.CylinderGeometry(0.15, 0.15, 0.4, 8);
  const cylinderMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x555555,
    metalness: 0.9,
    roughness: 0.3
  });
  
  // Create two rows of cylinders for the engine
  for (let i = 0; i < 2; i++) {
    for (let j = 0; j < 2; j++) {
      const cylinder = new THREE.Mesh(cylinderGeometry, cylinderMaterial);
      cylinder.position.set(-0.4 + i * 0.8, 1.25, -1.3 + j * 0.4);
      group.add(cylinder);
    }
  }
  
  // Add exhaust pipes
  const exhaustGeometry = new THREE.CylinderGeometry(0.08, 0.08, 1.2, 8);
  const exhaustMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x777777,
    metalness: 0.8,
    roughness: 0.2
  });
  
  // Left exhaust
  const leftExhaust = new THREE.Mesh(exhaustGeometry, exhaustMaterial);
  leftExhaust.rotation.z = Math.PI / 2;
  leftExhaust.position.set(-0.8, 0.5, 0.2);
  group.add(leftExhaust);
  
  // Right exhaust
  const rightExhaust = new THREE.Mesh(exhaustGeometry, exhaustMaterial);
  rightExhaust.rotation.z = Math.PI / 2;
  rightExhaust.position.set(0.8, 0.5, 0.2);
  group.add(rightExhaust);
  
  // Add flame effects coming from exhaust
  const exhaustFlameGeometry = new THREE.ConeGeometry(0.15, 0.6, 8);
  const exhaustFlameMaterial = new THREE.MeshStandardMaterial({ 
    color: 0xff3300,
    emissive: 0xff3300,
    emissiveIntensity: 0.7
  });
  
  // Left exhaust flame
  const leftExhaustFlame = new THREE.Mesh(exhaustFlameGeometry, exhaustFlameMaterial);
  leftExhaustFlame.rotation.z = Math.PI / 2;
  leftExhaustFlame.position.set(-1.4, 0.5, 0.2);
  group.add(leftExhaustFlame);
  
  // Right exhaust flame
  const rightExhaustFlame = new THREE.Mesh(exhaustFlameGeometry, exhaustFlameMaterial);
  rightExhaustFlame.rotation.z = Math.PI / 2;
  rightExhaustFlame.position.set(1.4, 0.5, 0.2);
  group.add(rightExhaustFlame);
  
  // Add inner yellow flames to exhaust
  const innerFlameGeometry = new THREE.ConeGeometry(0.08, 0.4, 8);
  const innerFlameMaterial = new THREE.MeshStandardMaterial({ 
    color: 0xffcc00,
    emissive: 0xffcc00,
    emissiveIntensity: 0.8
  });
  
  // Left inner flame
  const leftInnerFlame = new THREE.Mesh(innerFlameGeometry, innerFlameMaterial);
  leftInnerFlame.rotation.z = Math.PI / 2;
  leftInnerFlame.position.set(-1.5, 0.5, 0.2);
  group.add(leftInnerFlame);
  
  // Right inner flame
  const rightInnerFlame = new THREE.Mesh(innerFlameGeometry, innerFlameMaterial);
  rightInnerFlame.rotation.z = Math.PI / 2;
  rightInnerFlame.position.set(1.5, 0.5, 0.2);
  group.add(rightInnerFlame);
  
  // Add wheels
  const frontWheelGeometry = new THREE.CylinderGeometry(0.4, 0.4, 0.4, 16);
  const rearWheelGeometry = new THREE.CylinderGeometry(0.6, 0.6, 0.5, 16);
  const wheelMaterial = new THREE.MeshStandardMaterial({ color: 0x111111 });
  
  // Front wheels (smaller)
  const frontLeftWheel = new THREE.Mesh(frontWheelGeometry, wheelMaterial);
  frontLeftWheel.position.set(-1.0, 0.4, -1.2);
  frontLeftWheel.rotation.z = Math.PI / 2;
  group.add(frontLeftWheel);
  
  const frontRightWheel = new THREE.Mesh(frontWheelGeometry, wheelMaterial);
  frontRightWheel.position.set(1.0, 0.4, -1.2);
  frontRightWheel.rotation.z = Math.PI / 2;
  group.add(frontRightWheel);
  
  // Rear wheels (larger)
  const rearLeftWheel = new THREE.Mesh(rearWheelGeometry, wheelMaterial);
  rearLeftWheel.position.set(-1.0, 0.6, 1.2);
  rearLeftWheel.rotation.z = Math.PI / 2;
  group.add(rearLeftWheel);
  
  const rearRightWheel = new THREE.Mesh(rearWheelGeometry, wheelMaterial);
  rearRightWheel.position.set(1.0, 0.6, 1.2);
  rearRightWheel.rotation.z = Math.PI / 2;
  group.add(rearRightWheel);
  
  // Add wheel hubs/rims
  const hubGeometry = new THREE.CylinderGeometry(0.2, 0.2, 0.41, 16);
  const hubMaterial = new THREE.MeshStandardMaterial({ color: 0x555555 });
  
  // Add hubs to all wheels
  const frontLeftHub = new THREE.Mesh(hubGeometry, hubMaterial);
  frontLeftHub.position.set(-1.0, 0.4, -1.2);
  frontLeftHub.rotation.z = Math.PI / 2;
  group.add(frontLeftHub);
  
  const frontRightHub = new THREE.Mesh(hubGeometry, hubMaterial);
  frontRightHub.position.set(1.0, 0.4, -1.2);
  frontRightHub.rotation.z = Math.PI / 2;
  group.add(frontRightHub);
  
  const rearLeftHub = new THREE.Mesh(hubGeometry, hubMaterial);
  rearLeftHub.position.set(-1.0, 0.6, 1.2);
  rearLeftHub.rotation.z = Math.PI / 2;
  group.add(rearLeftHub);
  
  const rearRightHub = new THREE.Mesh(hubGeometry, hubMaterial);
  rearRightHub.position.set(1.0, 0.6, 1.2);
  rearRightHub.rotation.z = Math.PI / 2;
  group.add(rearRightHub);
  
  // Create flame decals on sides and hood using custom geometry
  
  // Side flame decals (left side)
  const createFlameDecal = (posX, posY, posZ, rotY, width, height) => {
    // Create flame shape on side of car
    const points = [];
    const flameWidth = width || 2.8;
    const flameHeight = height || 0.7;
    const segmentWidth = flameWidth / 6;
    
    // Base of flame (straight line at bottom)
    points.push(new THREE.Vector2(-flameWidth/2, -flameHeight/2));
    points.push(new THREE.Vector2(flameWidth/2, -flameHeight/2));
    
    // Top part with flame shape (zigzag pattern)
    points.push(new THREE.Vector2(flameWidth/2 - segmentWidth*0.5, flameHeight/2));
    points.push(new THREE.Vector2(flameWidth/2 - segmentWidth*1.5, -flameHeight/6));
    points.push(new THREE.Vector2(flameWidth/2 - segmentWidth*2.5, flameHeight/3));
    points.push(new THREE.Vector2(flameWidth/2 - segmentWidth*3.5, -flameHeight/8));
    points.push(new THREE.Vector2(flameWidth/2 - segmentWidth*4.5, flameHeight/4));
    points.push(new THREE.Vector2(flameWidth/2 - segmentWidth*5.5, -flameHeight/5));
    points.push(new THREE.Vector2(-flameWidth/2, -flameHeight/2)); // Close the shape
    
    const flameShape = new THREE.Shape(points);
    const flameGeometry = new THREE.ShapeGeometry(flameShape);
    const flameMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xff3300,
      emissive: 0xff2200,
      emissiveIntensity: 0.3,
      side: THREE.DoubleSide
    });
    
    const flameDecal = new THREE.Mesh(flameGeometry, flameMaterial);
    flameDecal.position.set(posX, posY, posZ);
    flameDecal.rotation.y = rotY;
    group.add(flameDecal);
    
    // Add yellow inner flame
    const innerPoints = [];
    const innerFlameWidth = flameWidth * 0.7;
    const innerFlameHeight = flameHeight * 0.6;
    const innerSegmentWidth = innerFlameWidth / 6;
    
    innerPoints.push(new THREE.Vector2(-innerFlameWidth/2, -innerFlameHeight/2));
    innerPoints.push(new THREE.Vector2(innerFlameWidth/2, -innerFlameHeight/2));
    innerPoints.push(new THREE.Vector2(innerFlameWidth/2 - innerSegmentWidth*0.5, innerFlameHeight/2));
    innerPoints.push(new THREE.Vector2(innerFlameWidth/2 - innerSegmentWidth*1.5, -innerFlameHeight/6));
    innerPoints.push(new THREE.Vector2(innerFlameWidth/2 - innerSegmentWidth*2.5, innerFlameHeight/3));
    innerPoints.push(new THREE.Vector2(innerFlameWidth/2 - innerSegmentWidth*3.5, -innerFlameHeight/8));
    innerPoints.push(new THREE.Vector2(innerFlameWidth/2 - innerSegmentWidth*4.5, innerFlameHeight/4));
    innerPoints.push(new THREE.Vector2(innerFlameWidth/2 - innerSegmentWidth*5.5, -innerFlameHeight/5));
    innerPoints.push(new THREE.Vector2(-innerFlameWidth/2, -innerFlameHeight/2));
    
    const innerFlameShape = new THREE.Shape(innerPoints);
    const innerFlameGeometry = new THREE.ShapeGeometry(innerFlameShape);
    const innerFlameMaterial = new THREE.MeshStandardMaterial({
      color: 0xffcc00,
      emissive: 0xffcc00,
      emissiveIntensity: 0.3,
      side: THREE.DoubleSide
    });
    
    const innerFlameDecal = new THREE.Mesh(innerFlameGeometry, innerFlameMaterial);
    innerFlameDecal.position.set(posX, posY, posZ);
    innerFlameDecal.position.x += (rotY === Math.PI/2 ? -0.01 : 0.01); // Offset slightly to prevent z-fighting
    innerFlameDecal.rotation.y = rotY;
    group.add(innerFlameDecal);
  };
  
  // Add flame decals to both sides
  createFlameDecal(-1.01, 0.7, 0, Math.PI/2);  // Left side
  createFlameDecal(1.01, 0.7, 0, -Math.PI/2);  // Right side
  
  // Add flame decals to hood
  createFlameDecal(0, 0.71, -1.6, 0, 1.8, 1.6);
  
  // Add flame decal to the roof/top
  createFlameDecal(0, 1.66, 0, -Math.PI/2, 2.0, 0.9);  // Top side, rotated to be horizontal
  
  // Create top roof flames with proper orientation
  const topFlamePoints = [];
  const topFlameWidth = 1.7;
  const topFlameHeight = 0.9;
  const topSegmentWidth = topFlameWidth / 6;
  
  // Base of flame (straight line at bottom)
  topFlamePoints.push(new THREE.Vector2(-topFlameWidth/2, -topFlameHeight/2));
  topFlamePoints.push(new THREE.Vector2(topFlameWidth/2, -topFlameHeight/2));
  
  // Top part with flame shape (zigzag pattern)
  topFlamePoints.push(new THREE.Vector2(topFlameWidth/2 - topSegmentWidth*0.5, topFlameHeight/2));
  topFlamePoints.push(new THREE.Vector2(topFlameWidth/2 - topSegmentWidth*1.5, -topFlameHeight/6));
  topFlamePoints.push(new THREE.Vector2(topFlameWidth/2 - topSegmentWidth*2.5, topFlameHeight/3));
  topFlamePoints.push(new THREE.Vector2(topFlameWidth/2 - topSegmentWidth*3.5, -topFlameHeight/8));
  topFlamePoints.push(new THREE.Vector2(topFlameWidth/2 - topSegmentWidth*4.5, topFlameHeight/4));
  topFlamePoints.push(new THREE.Vector2(topFlameWidth/2 - topSegmentWidth*5.5, -topFlameHeight/5));
  topFlamePoints.push(new THREE.Vector2(-topFlameWidth/2, -topFlameHeight/2)); // Close the shape
  
  const topFlameShape = new THREE.Shape(topFlamePoints);
  const topFlameGeometry = new THREE.ShapeGeometry(topFlameShape);
  const topFlameMaterial = new THREE.MeshStandardMaterial({ 
    color: 0xff3300,
    emissive: 0xff2200,
    emissiveIntensity: 0.3,
    side: THREE.DoubleSide
  });
  
  const topFlameDecal = new THREE.Mesh(topFlameGeometry, topFlameMaterial);
  topFlameDecal.position.set(0, 1.67, 0);
  topFlameDecal.rotation.x = -Math.PI/2;  // Rotate to lie flat on the roof
  group.add(topFlameDecal);
  
  // Add yellow inner flames to roof
  const topInnerPoints = [];
  const topInnerFlameWidth = topFlameWidth * 0.7;
  const topInnerFlameHeight = topFlameHeight * 0.6;
  const topInnerSegmentWidth = topInnerFlameWidth / 6;
  
  topInnerPoints.push(new THREE.Vector2(-topInnerFlameWidth/2, -topInnerFlameHeight/2));
  topInnerPoints.push(new THREE.Vector2(topInnerFlameWidth/2, -topInnerFlameHeight/2));
  topInnerPoints.push(new THREE.Vector2(topInnerFlameWidth/2 - topInnerSegmentWidth*0.5, topInnerFlameHeight/2));
  topInnerPoints.push(new THREE.Vector2(topInnerFlameWidth/2 - topInnerSegmentWidth*1.5, -topInnerFlameHeight/6));
  topInnerPoints.push(new THREE.Vector2(topInnerFlameWidth/2 - topInnerSegmentWidth*2.5, topInnerFlameHeight/3));
  topInnerPoints.push(new THREE.Vector2(topInnerFlameWidth/2 - topInnerSegmentWidth*3.5, -topInnerFlameHeight/8));
  topInnerPoints.push(new THREE.Vector2(topInnerFlameWidth/2 - topInnerSegmentWidth*4.5, topInnerFlameHeight/4));
  topInnerPoints.push(new THREE.Vector2(topInnerFlameWidth/2 - topInnerSegmentWidth*5.5, -topInnerFlameHeight/5));
  topInnerPoints.push(new THREE.Vector2(-topInnerFlameWidth/2, -topInnerFlameHeight/2));
  
  const topInnerFlameShape = new THREE.Shape(topInnerPoints);
  const topInnerFlameGeometry = new THREE.ShapeGeometry(topInnerFlameShape);
  const topInnerFlameMaterial = new THREE.MeshStandardMaterial({
    color: 0xffcc00,
    emissive: 0xffcc00,
    emissiveIntensity: 0.3,
    side: THREE.DoubleSide
  });
  
  const topInnerFlameDecal = new THREE.Mesh(topInnerFlameGeometry, topInnerFlameMaterial);
  topInnerFlameDecal.position.set(0, 1.68, 0);  // Slight offset to prevent z-fighting
  topInnerFlameDecal.rotation.x = -Math.PI/2;  // Rotate to lie flat on the roof
  group.add(topInnerFlameDecal);
  
  // Add some details to make it look more like a hot rod
  const frontBumperGeometry = new THREE.BoxGeometry(1.9, 0.2, 0.1);
  const bumperMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x999999,
    metalness: 0.8,
    roughness: 0.2
  });
  const frontBumper = new THREE.Mesh(frontBumperGeometry, bumperMaterial);
  frontBumper.position.set(0, 0.3, -1.7);
  group.add(frontBumper);
  
  // Add rear bumper
  const rearBumperGeometry = new THREE.BoxGeometry(1.9, 0.2, 0.1);
  const rearBumper = new THREE.Mesh(rearBumperGeometry, bumperMaterial);
  rearBumper.position.set(0, 0.3, 1.7);
  group.add(rearBumper);
}

function createFlowerPowerMesh(group) {
  // Main body - beige sedan style
  const bodyGeometry = new THREE.BoxGeometry(2.0, 0.8, 3.4);
  const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0xd2c8ad }); // Beige/tan color
  const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
  body.position.y = 0.6;
  group.add(body);
  
  // Add cabin
  const cabinGeometry = new THREE.BoxGeometry(1.9, 0.7, 1.8);
  const cabinMaterial = new THREE.MeshStandardMaterial({ color: 0xd2c8ad });
  const cabin = new THREE.Mesh(cabinGeometry, cabinMaterial);
  cabin.position.set(0, 1.35, -0.2);
  group.add(cabin);
  
  // Add front grille and bumper
  const grilleGeometry = new THREE.BoxGeometry(1.8, 0.4, 0.1);
  const grilleMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
  const grille = new THREE.Mesh(grilleGeometry, grilleMaterial);
  grille.position.set(0, 0.5, -1.7);
  group.add(grille);
  
  // Add front bumper
  const bumperGeometry = new THREE.BoxGeometry(2.0, 0.2, 0.1);
  const bumperMaterial = new THREE.MeshStandardMaterial({ color: 0x999999 });
  const frontBumper = new THREE.Mesh(bumperGeometry, bumperMaterial);
  frontBumper.position.set(0, 0.3, -1.7);
  group.add(frontBumper);
  
  // Add rear bumper
  const rearBumper = new THREE.Mesh(bumperGeometry, bumperMaterial);
  rearBumper.position.set(0, 0.3, 1.7);
  group.add(rearBumper);
  
  // Add headlights
  const headlightGeometry = new THREE.BoxGeometry(0.4, 0.3, 0.1);
  const headlightMaterial = new THREE.MeshStandardMaterial({ 
    color: 0xf5f5f5,
    emissive: 0xffffcc,
    emissiveIntensity: 0.2
  });
  
  const leftHeadlight = new THREE.Mesh(headlightGeometry, headlightMaterial);
  leftHeadlight.position.set(-0.7, 0.6, -1.7);
  group.add(leftHeadlight);
  
  const rightHeadlight = new THREE.Mesh(headlightGeometry, headlightMaterial);
  rightHeadlight.position.set(0.7, 0.6, -1.7);
  group.add(rightHeadlight);
  
  // Add taillights
  const taillightGeometry = new THREE.BoxGeometry(0.4, 0.3, 0.1);
  const taillightMaterial = new THREE.MeshStandardMaterial({ 
    color: 0xff3333,
    emissive: 0xff0000,
    emissiveIntensity: 0.2
  });
  
  const leftTaillight = new THREE.Mesh(taillightGeometry, taillightMaterial);
  leftTaillight.position.set(-0.7, 0.6, 1.7);
  group.add(leftTaillight);
  
  const rightTaillight = new THREE.Mesh(taillightGeometry, taillightMaterial);
  rightTaillight.position.set(0.7, 0.6, 1.7);
  group.add(rightTaillight);
  
  // Add windows (windshield, rear, sides)
  const windowMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x4c6a92,
    transparent: true,
    opacity: 0.7
  });
  
  // Front windshield
  const windshieldGeometry = new THREE.BoxGeometry(1.8, 0.6, 0.1);
  const windshield = new THREE.Mesh(windshieldGeometry, windowMaterial);
  windshield.position.set(0, 1.4, -1.1);
  windshield.rotation.x = Math.PI * 0.08;
  group.add(windshield);
  
  // Rear window
  const rearWindowGeometry = new THREE.BoxGeometry(1.8, 0.6, 0.1);
  const rearWindow = new THREE.Mesh(rearWindowGeometry, windowMaterial);
  rearWindow.position.set(0, 1.4, 0.7);
  rearWindow.rotation.x = -Math.PI * 0.08;
  group.add(rearWindow);
  
  // Side windows
  const leftWindowGeometry = new THREE.BoxGeometry(0.1, 0.5, 1.4);
  const leftWindow = new THREE.Mesh(leftWindowGeometry, windowMaterial);
  leftWindow.position.set(-1.0, 1.3, -0.2);
  group.add(leftWindow);
  
  const rightWindowGeometry = new THREE.BoxGeometry(0.1, 0.5, 1.4);
  const rightWindow = new THREE.Mesh(rightWindowGeometry, windowMaterial);
  rightWindow.position.set(1.0, 1.3, -0.2);
  group.add(rightWindow);
  
  // Add wheels
  const wheelGeometry = new THREE.CylinderGeometry(0.4, 0.4, 0.3, 16);
  const wheelMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
  
  // Front left wheel
  const frontLeftWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
  frontLeftWheel.position.set(-1.0, 0.4, -1.1);
  frontLeftWheel.rotation.z = Math.PI / 2;
  group.add(frontLeftWheel);
  
  // Front right wheel
  const frontRightWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
  frontRightWheel.position.set(1.0, 0.4, -1.1);
  frontRightWheel.rotation.z = Math.PI / 2;
  group.add(frontRightWheel);
  
  // Rear left wheel
  const rearLeftWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
  rearLeftWheel.position.set(-1.0, 0.4, 1.1);
  rearLeftWheel.rotation.z = Math.PI / 2;
  group.add(rearLeftWheel);
  
  // Rear right wheel
  const rearRightWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
  rearRightWheel.position.set(1.0, 0.4, 1.1);
  rearRightWheel.rotation.z = Math.PI / 2;
  group.add(rearRightWheel);
  
  // Add wheel hubs
  const hubGeometry = new THREE.CylinderGeometry(0.15, 0.15, 0.31, 16);
  const hubMaterial = new THREE.MeshStandardMaterial({ color: 0x888888 });
  
  // Add hubs to all wheels
  const frontLeftHub = new THREE.Mesh(hubGeometry, hubMaterial);
  frontLeftHub.position.set(-1.0, 0.4, -1.1);
  frontLeftHub.rotation.z = Math.PI / 2;
  group.add(frontLeftHub);
  
  const frontRightHub = new THREE.Mesh(hubGeometry, hubMaterial);
  frontRightHub.position.set(1.0, 0.4, -1.1);
  frontRightHub.rotation.z = Math.PI / 2;
  group.add(frontRightHub);
  
  const rearLeftHub = new THREE.Mesh(hubGeometry, hubMaterial);
  rearLeftHub.position.set(-1.0, 0.4, 1.1);
  rearLeftHub.rotation.z = Math.PI / 2;
  group.add(rearLeftHub);
  
  const rearRightHub = new THREE.Mesh(hubGeometry, hubMaterial);
  rearRightHub.position.set(1.0, 0.4, 1.1);
  rearRightHub.rotation.z = Math.PI / 2;
  group.add(rearRightHub);
  
  // Create flower decorations
  const createFlower = (posX, posY, posZ, rotX, rotY, rotZ, scale, innerColor, outerColor) => {
    const flowerGroup = new THREE.Group();
    
    // Create outer petals
    const petalGeometry = new THREE.CircleGeometry(0.4 * scale, 6);
    const petalMaterial = new THREE.MeshStandardMaterial({ 
      color: outerColor,
      side: THREE.DoubleSide 
    });
    const petals = new THREE.Mesh(petalGeometry, petalMaterial);
    flowerGroup.add(petals);
    
    // Create inner circle
    const centerGeometry = new THREE.CircleGeometry(0.2 * scale, 16);
    const centerMaterial = new THREE.MeshStandardMaterial({ 
      color: innerColor,
      side: THREE.DoubleSide 
    });
    const center = new THREE.Mesh(centerGeometry, centerMaterial);
    center.position.z = 0.001; // Slightly in front to avoid z-fighting
    flowerGroup.add(center);
    
    flowerGroup.position.set(posX, posY, posZ);
    flowerGroup.rotation.set(rotX, rotY, rotZ);
    group.add(flowerGroup);
  };
  
  // Create peace symbol
  const createPeaceSymbol = (posX, posY, posZ, rotX, rotY, rotZ, scale, color) => {
    const peaceGroup = new THREE.Group();
    
    // Create circle
    const circleGeometry = new THREE.RingGeometry(0.3 * scale, 0.4 * scale, 32);
    const peaceMaterial = new THREE.MeshStandardMaterial({ 
      color: color,
      side: THREE.DoubleSide 
    });
    const circle = new THREE.Mesh(circleGeometry, peaceMaterial);
    peaceGroup.add(circle);
    
    // Create peace symbol lines
    const lineGeometry = new THREE.PlaneGeometry(0.1 * scale, 0.6 * scale);
    const line = new THREE.Mesh(lineGeometry, peaceMaterial);
    peaceGroup.add(line);
    
    // Create diagonal lines for peace symbol
    const diagonalLen = 0.3 * scale;
    const diagonalWidth = 0.1 * scale;
    
    const leftLine = new THREE.Mesh(
      new THREE.PlaneGeometry(diagonalWidth, diagonalLen),
      peaceMaterial
    );
    leftLine.position.y = -0.15 * scale;
    leftLine.rotation.z = Math.PI / 4;
    peaceGroup.add(leftLine);
    
    const rightLine = new THREE.Mesh(
      new THREE.PlaneGeometry(diagonalWidth, diagonalLen),
      peaceMaterial
    );
    rightLine.position.y = -0.15 * scale;
    rightLine.rotation.z = -Math.PI / 4;
    peaceGroup.add(rightLine);
    
    peaceGroup.position.set(posX, posY, posZ);
    peaceGroup.rotation.set(rotX, rotY, rotZ);
    group.add(peaceGroup);
  };
  
  // Create colored shape
  const createColorShape = (posX, posY, posZ, rotX, rotY, rotZ, scale, color, sides) => {
    const shapeGeometry = new THREE.CircleGeometry(0.3 * scale, sides || 4);
    const shapeMaterial = new THREE.MeshStandardMaterial({ 
      color: color,
      side: THREE.DoubleSide 
    });
    const shape = new THREE.Mesh(shapeGeometry, shapeMaterial);
    
    shape.position.set(posX, posY, posZ);
    shape.rotation.set(rotX, rotY, rotZ);
    group.add(shape);
  };
  
  // Create LOVE text
  const createLoveText = (posX, posY, posZ, rotX, rotY, rotZ, scale, color) => {
    // Since we can't easily create actual text with basic Three.js shapes,
    // we'll create a rectangular decal to represent the text
    const textPlane = new THREE.PlaneGeometry(0.8 * scale, 0.3 * scale);
    const textMaterial = new THREE.MeshStandardMaterial({ 
      color: color,
      side: THREE.DoubleSide 
    });
    const textMesh = new THREE.Mesh(textPlane, textMaterial);
    
    textMesh.position.set(posX, posY, posZ);
    textMesh.rotation.set(rotX, rotY, rotZ);
    group.add(textMesh);
  };
  
  // Add decorations to the car based on the reference image
  
  // Front hood decoration - blue peace symbol
  createPeaceSymbol(
    0,     // x
    0.71,  // y
    -1.3,  // z
    -Math.PI/2, // rotX
    0,     // rotY
    0,     // rotZ
    0.8,   // scale
    0x3498db // blue
  );
  
  // Roof decoration - flower with red center and blue petals
  createFlower(
    0,     // x
    1.71,  // y
    -0.2,  // z
    -Math.PI/2, // rotX
    0,     // rotY
    0,     // rotZ
    1.0,   // scale
    0xe74c3c, // red center
    0x3498db  // blue petals
  );
  
  // Left side flower decoration
  createFlower(
    -1.01, // x
    0.8,   // y
    0.6,   // z
    0,     // rotX
    Math.PI/2, // rotY
    0,     // rotZ
    0.8,   // scale
    0xffcc00, // yellow center
    0xe74c3c  // red petals
  );
  
  // Left side LOVE text
  createLoveText(
    -1.01, // x
    0.8,   // y
    -0.3,  // z
    0,     // rotX
    Math.PI/2, // rotY
    0,     // rotZ
    1.0,   // scale
    0xe74c3c // red
  );
  
  // Right side peace symbol
  createPeaceSymbol(
    1.01,  // x
    0.8,   // y
    -0.3,  // z
    0,     // rotX
    -Math.PI/2, // rotY
    0,     // rotZ
    0.8,   // scale
    0xe74c3c // red
  );
  
  // Right side yellow shape
  createColorShape(
    1.01,  // x
    0.8,   // y
    0.3,   // z
    0,     // rotX
    -Math.PI/2, // rotY
    0,     // rotZ
    0.8,   // scale
    0xffcc00, // yellow
    4      // square shape (4 sides)
  );
  
  // Right side blue shape
  createColorShape(
    1.01,  // x
    0.8,   // y
    0.8,   // z
    0,     // rotX
    -Math.PI/2, // rotY
    0,     // rotZ
    0.8,   // scale
    0x3498db, // blue
    6      // hexagon shape (6 sides)
  );
  
  // Additional decorative elements
  
  // Flower on the front hood
  createFlower(
    0,     // x
    0.71,  // y
    -0.7,  // z
    -Math.PI/2, // rotX
    0,     // rotY
    0,     // rotZ
    0.7,   // scale
    0xe74c3c, // red center
    0x3498db  // blue petals
  );
}

function createHammerheadMesh(group) {
  // Increase the overall scale to make the monster truck more imposing
  const scale = 1.3;
  
  // Main body - red jeep-like vehicle with more pronounced proportions
  const bodyGeometry = new THREE.BoxGeometry(1.7, 0.6, 2.2);
  const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0xd82c20 }); // Bright red
  const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
  body.position.y = 1.5 * scale;
  group.add(body);
  
  // Add body details - side panels
  const sideDetailGeometry = new THREE.BoxGeometry(0.1, 0.2, 1.0);
  const leftSideDetail = new THREE.Mesh(sideDetailGeometry, bodyMaterial);
  leftSideDetail.position.set(-0.85, 1.5 * scale, 0);
  group.add(leftSideDetail);
  
  const rightSideDetail = new THREE.Mesh(sideDetailGeometry, bodyMaterial);
  rightSideDetail.position.set(0.85, 1.5 * scale, 0);
  group.add(rightSideDetail);
  
  // Add white stripes on hood
  const stripeGeometry = new THREE.BoxGeometry(0.6, 0.05, 0.8);
  const stripeMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });
  const hoodStripe = new THREE.Mesh(stripeGeometry, stripeMaterial);
  hoodStripe.position.set(0, 1.55 * scale, -0.8);
  group.add(hoodStripe);
  
  // Create hood section
  const hoodGeometry = new THREE.BoxGeometry(1.7, 0.15, 0.8);
  const hood = new THREE.Mesh(hoodGeometry, bodyMaterial);
  hood.position.set(0, 1.40 * scale, -1.2);
  group.add(hood);
  
  // Front grille area
  const grilleBoxGeometry = new THREE.BoxGeometry(1.5, 0.35, 0.2);
  const grilleBox = new THREE.Mesh(grilleBoxGeometry, bodyMaterial);
  grilleBox.position.set(0, 1.35 * scale, -1.65);
  group.add(grilleBox);
  
  // Create headlights
  const headlightGeometry = new THREE.BoxGeometry(0.3, 0.2, 0.1);
  const headlightMaterial = new THREE.MeshStandardMaterial({ 
    color: 0xffffff, 
    emissive: 0xffffdd,
    emissiveIntensity: 0.3
  });
  
  // Left headlight
  const leftHeadlight = new THREE.Mesh(headlightGeometry, headlightMaterial);
  leftHeadlight.position.set(-0.5, 1.35 * scale, -1.76);
  group.add(leftHeadlight);
  
  // Right headlight
  const rightHeadlight = new THREE.Mesh(headlightGeometry, headlightMaterial);
  rightHeadlight.position.set(0.5, 1.35 * scale, -1.76);
  group.add(rightHeadlight);
  
  // Add black grille
  const grilleGeometry = new THREE.BoxGeometry(0.8, 0.25, 0.05);
  const grilleMaterial = new THREE.MeshStandardMaterial({ color: 0x111111 });
  const grille = new THREE.Mesh(grilleGeometry, grilleMaterial);
  grille.position.set(0, 1.35 * scale, -1.76);
  group.add(grille);
  
  // Add vertical grille bars
  for (let i = -2; i <= 2; i++) {
    if (i === 0) continue; // Skip the middle for a distinctive look
    const barGeometry = new THREE.BoxGeometry(0.06, 0.25, 0.07);
    const bar = new THREE.Mesh(barGeometry, grilleMaterial);
    bar.position.set(i * 0.15, 1.35 * scale, -1.77);
    group.add(bar);
  }
  
  // Create roll cage (black frame) with thicker bars
  const frameThickness = 0.08;
  const frameMaterial = new THREE.MeshStandardMaterial({ color: 0x111111 });
  
  // Front pillars
  const frontLeftPillarGeometry = new THREE.BoxGeometry(frameThickness, 0.7, frameThickness);
  const frontLeftPillar = new THREE.Mesh(frontLeftPillarGeometry, frameMaterial);
  frontLeftPillar.position.set(-0.8, 1.85 * scale, -0.6);
  group.add(frontLeftPillar);
  
  const frontRightPillarGeometry = new THREE.BoxGeometry(frameThickness, 0.7, frameThickness);
  const frontRightPillar = new THREE.Mesh(frontRightPillarGeometry, frameMaterial);
  frontRightPillar.position.set(0.8, 1.85 * scale, -0.6);
  group.add(frontRightPillar);
  
  // Rear pillars
  const rearLeftPillarGeometry = new THREE.BoxGeometry(frameThickness, 0.7, frameThickness);
  const rearLeftPillar = new THREE.Mesh(rearLeftPillarGeometry, frameMaterial);
  rearLeftPillar.position.set(-0.8, 1.85 * scale, 0.6);
  group.add(rearLeftPillar);
  
  const rearRightPillarGeometry = new THREE.BoxGeometry(frameThickness, 0.7, frameThickness);
  const rearRightPillar = new THREE.Mesh(rearRightPillarGeometry, frameMaterial);
  rearRightPillar.position.set(0.8, 1.85 * scale, 0.6);
  group.add(rearRightPillar);
  
  // Top connecting bars
  const frontBarGeometry = new THREE.BoxGeometry(1.7, frameThickness, frameThickness);
  const frontBar = new THREE.Mesh(frontBarGeometry, frameMaterial);
  frontBar.position.set(0, 2.2 * scale, -0.6);
  group.add(frontBar);
  
  const rearBarGeometry = new THREE.BoxGeometry(1.7, frameThickness, frameThickness);
  const rearBar = new THREE.Mesh(rearBarGeometry, frameMaterial);
  rearBar.position.set(0, 2.2 * scale, 0.6);
  group.add(rearBar);
  
  const leftBarGeometry = new THREE.BoxGeometry(frameThickness, frameThickness, 1.3);
  const leftBar = new THREE.Mesh(leftBarGeometry, frameMaterial);
  leftBar.position.set(-0.8, 2.2 * scale, 0);
  group.add(leftBar);
  
  const rightBarGeometry = new THREE.BoxGeometry(frameThickness, frameThickness, 1.3);
  const rightBar = new THREE.Mesh(rightBarGeometry, frameMaterial);
  rightBar.position.set(0.8, 2.2 * scale, 0);
  group.add(rightBar);
  
  // Cross bars for additional structure
  const crossBar1Geometry = new THREE.BoxGeometry(1.7, frameThickness, frameThickness);
  const crossBar1 = new THREE.Mesh(crossBar1Geometry, frameMaterial);
  crossBar1.position.set(0, 2.2 * scale, 0);
  group.add(crossBar1);
  
  // Add windshield frame
  const windshieldFrameGeometry = new THREE.BoxGeometry(1.5, 0.05, 0.05);
  const windshieldTopFrame = new THREE.Mesh(windshieldFrameGeometry, frameMaterial);
  windshieldTopFrame.position.set(0, 1.8 * scale, -0.6);
  group.add(windshieldTopFrame);
  
  // Add windshield (transparent blue)
  const windshieldGeometry = new THREE.BoxGeometry(1.4, 0.5, 0.05);
  const windshieldMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x3a5c7b,
    transparent: true,
    opacity: 0.5
  });
  const windshield = new THREE.Mesh(windshieldGeometry, windshieldMaterial);
  windshield.position.set(0, 1.65 * scale, -0.6);
  windshield.rotation.x = Math.PI * 0.05; // Slight angle
  group.add(windshield);
  
  // Add interior detail - blue driver seat
  const seatGeometry = new THREE.BoxGeometry(0.5, 0.3, 0.5);
  const seatMaterial = new THREE.MeshStandardMaterial({ color: 0x1a56ba }); // Blue
  const seat = new THREE.Mesh(seatGeometry, seatMaterial);
  seat.position.set(0, 1.55 * scale, 0);
  group.add(seat);
  
  // Add steering wheel hint
  const steeringWheelGeometry = new THREE.TorusGeometry(0.15, 0.03, 8, 16);
  const steeringWheelMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
  const steeringWheel = new THREE.Mesh(steeringWheelGeometry, steeringWheelMaterial);
  steeringWheel.position.set(0, 1.7 * scale, -0.2);
  steeringWheel.rotation.x = Math.PI / 2;
  group.add(steeringWheel);
  
  // Add huge monster truck wheels - make them even bigger
  const wheelRadius = 1.0;
  const wheelWidth = 0.7;
  const wheelGeometry = new THREE.CylinderGeometry(wheelRadius, wheelRadius, wheelWidth, 16);
  const wheelMaterial = new THREE.MeshStandardMaterial({ color: 0x222222 });
  
  // Add wheel tread detail
  const createWheelWithTread = (posX, posY, posZ) => {
    // Main wheel
    const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
    wheel.position.set(posX, posY, posZ);
    wheel.rotation.z = Math.PI / 2;
    group.add(wheel);
    
    // Add tread pattern
    const treadCount = 8;
    const treadAngle = (Math.PI * 2) / treadCount;
    const treadDepth = 0.05;
    const treadWidth = 0.15;
    const treadGeometry = new THREE.BoxGeometry(wheelWidth + 0.01, treadDepth, treadWidth);
    const treadMaterial = new THREE.MeshStandardMaterial({ color: 0x111111 });
    
    for (let i = 0; i < treadCount; i++) {
      const tread = new THREE.Mesh(treadGeometry, treadMaterial);
      const angle = i * treadAngle;
      tread.position.set(
        posX,
        posY + Math.sin(angle) * (wheelRadius - treadDepth/2),
        posZ + Math.cos(angle) * (wheelRadius - treadDepth/2)
      );
      tread.rotation.x = angle;
      group.add(tread);
    }
    
    // Add hub cap (5-star pattern)
    const hubGeometry = new THREE.CylinderGeometry(0.35, 0.35, wheelWidth + 0.02, 5);
    const hubMaterial = new THREE.MeshStandardMaterial({ color: 0xcccccc });
    const hub = new THREE.Mesh(hubGeometry, hubMaterial);
    hub.position.set(posX, posY, posZ);
    hub.rotation.z = Math.PI / 2;
    
    // Add hub center
    const hubCenterGeometry = new THREE.CylinderGeometry(0.1, 0.1, wheelWidth + 0.03, 16);
    const hubCenter = new THREE.Mesh(hubCenterGeometry, hubMaterial);
    hubCenter.position.set(posX, posY, posZ);
    hubCenter.rotation.z = Math.PI / 2;
    
    group.add(hub);
    group.add(hubCenter);
    
    return wheel;
  };
  
  // Position the four wheels with proper offsets for monster truck look
  const wheelPositionY = 1.0 * scale;
  const wheelOuterOffset = 1.4;
  
  // Front wheels
  createWheelWithTread(-wheelOuterOffset, wheelPositionY, -0.9);
  createWheelWithTread(wheelOuterOffset, wheelPositionY, -0.9);
  
  // Rear wheels
  createWheelWithTread(-wheelOuterOffset, wheelPositionY, 0.9);
  createWheelWithTread(wheelOuterOffset, wheelPositionY, 0.9);
  
  // Add suspension details with thicker parts
  const suspensionMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
  
  // Add suspension elements connecting body to wheels
  const suspensionThickness = 0.15;
  const suspensionLength = 0.4;
  
  // Front left suspension
  const frontLeftSuspensionGeometry = new THREE.BoxGeometry(suspensionLength, suspensionThickness, suspensionThickness);
  const frontLeftSuspension = new THREE.Mesh(frontLeftSuspensionGeometry, suspensionMaterial);
  frontLeftSuspension.position.set(-1.15, wheelPositionY, -0.9);
  group.add(frontLeftSuspension);
  
  // Front right suspension
  const frontRightSuspensionGeometry = new THREE.BoxGeometry(suspensionLength, suspensionThickness, suspensionThickness);
  const frontRightSuspension = new THREE.Mesh(frontRightSuspensionGeometry, suspensionMaterial);
  frontRightSuspension.position.set(1.15, wheelPositionY, -0.9);
  group.add(frontRightSuspension);
  
  // Rear left suspension
  const rearLeftSuspensionGeometry = new THREE.BoxGeometry(suspensionLength, suspensionThickness, suspensionThickness);
  const rearLeftSuspension = new THREE.Mesh(rearLeftSuspensionGeometry, suspensionMaterial);
  rearLeftSuspension.position.set(-1.15, wheelPositionY, 0.9);
  group.add(rearLeftSuspension);
  
  // Rear right suspension
  const rearRightSuspensionGeometry = new THREE.BoxGeometry(suspensionLength, suspensionThickness, suspensionThickness);
  const rearRightSuspension = new THREE.Mesh(rearRightSuspensionGeometry, suspensionMaterial);
  rearRightSuspension.position.set(1.15, wheelPositionY, 0.9);
  group.add(rearRightSuspension);
  
  // Add vertical suspension supports
  const verticalSuspensionGeometry = new THREE.BoxGeometry(suspensionThickness, 0.5, suspensionThickness);
  
  // Front left vertical support
  const frontLeftVertical = new THREE.Mesh(verticalSuspensionGeometry, suspensionMaterial);
  frontLeftVertical.position.set(-0.8, 1.2 * scale, -0.9);
  group.add(frontLeftVertical);
  
  // Front right vertical support
  const frontRightVertical = new THREE.Mesh(verticalSuspensionGeometry, suspensionMaterial);
  frontRightVertical.position.set(0.8, 1.2 * scale, -0.9);
  group.add(frontRightVertical);
  
  // Rear left vertical support
  const rearLeftVertical = new THREE.Mesh(verticalSuspensionGeometry, suspensionMaterial);
  rearLeftVertical.position.set(-0.8, 1.2 * scale, 0.9);
  group.add(rearLeftVertical);
  
  // Rear right vertical support
  const rearRightVertical = new THREE.Mesh(verticalSuspensionGeometry, suspensionMaterial);
  rearRightVertical.position.set(0.8, 1.2 * scale, 0.9);
  group.add(rearRightVertical);
  
  // Add rear details - tail lights
  const taillightGeometry = new THREE.BoxGeometry(0.25, 0.15, 0.05);
  const taillightMaterial = new THREE.MeshStandardMaterial({ 
    color: 0xff0000, 
    emissive: 0xff0000,
    emissiveIntensity: 0.5
  });
  
  // Left taillight
  const leftTaillight = new THREE.Mesh(taillightGeometry, taillightMaterial);
  leftTaillight.position.set(-0.6, 1.35 * scale, 1.16);
  group.add(leftTaillight);
  
  // Right taillight
  const rightTaillight = new THREE.Mesh(taillightGeometry, taillightMaterial);
  rightTaillight.position.set(0.6, 1.35 * scale, 1.16);
  group.add(rightTaillight);
  
  // Add front bumper
  const bumperGeometry = new THREE.BoxGeometry(1.7, 0.15, 0.1);
  const bumperMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
  const bumper = new THREE.Mesh(bumperGeometry, bumperMaterial);
  bumper.position.set(0, 1.15 * scale, -1.76);
  group.add(bumper);
  
  // Add rear bumper
  const rearBumperGeometry = new THREE.BoxGeometry(1.7, 0.15, 0.1);
  const rearBumper = new THREE.Mesh(rearBumperGeometry, bumperMaterial);
  rearBumper.position.set(0, 1.15 * scale, 1.16);
  group.add(rearBumper);
  
  // Scale the entire group to adjust overall size
  group.scale.set(1.2, 1.2, 1.2);
}

function createOutlawMesh(group) {
  // Main body - black police car
  const bodyGeometry = new THREE.BoxGeometry(2.0, 0.9, 3.5);
  const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x111111 }); // Black
  const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
  body.position.y = 0.6;
  group.add(body);
  
  // Add cabin/roof
  const cabinGeometry = new THREE.BoxGeometry(1.9, 0.7, 1.8);
  const cabin = new THREE.Mesh(cabinGeometry, bodyMaterial);
  cabin.position.set(0, 1.35, -0.2);
  group.add(cabin);
  
  // Front white section (hood)
  const frontWhiteGeometry = new THREE.BoxGeometry(2.0, 0.01, 1.2);
  const whiteMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });
  const frontWhite = new THREE.Mesh(frontWhiteGeometry, whiteMaterial);
  frontWhite.position.set(0, 1.06, -1.3);
  group.add(frontWhite);
  
  // Front white section (bumper)
  const bumperWhiteGeometry = new THREE.BoxGeometry(2.0, 0.3, 0.2);
  const bumperWhite = new THREE.Mesh(bumperWhiteGeometry, whiteMaterial);
  bumperWhite.position.set(0, 0.6, -1.75);
  group.add(bumperWhite);
  
  // White police door sections
  const doorWhiteGeometry = new THREE.BoxGeometry(0.01, 0.8, 2.0);
  
  // Left door white panel
  const leftDoorWhite = new THREE.Mesh(doorWhiteGeometry, whiteMaterial);
  leftDoorWhite.position.set(-1.01, 0.9, 0);
  group.add(leftDoorWhite);
  
  // Right door white panel
  const rightDoorWhite = new THREE.Mesh(doorWhiteGeometry, whiteMaterial);
  rightDoorWhite.position.set(1.01, 0.9, 0);
  group.add(rightDoorWhite);
  
  // Add police text on sides
  // Use thin black boxes to represent "POLICE" text on the doors
  const textBaseGeometry = new THREE.BoxGeometry(0.02, 0.3, 0.8);
  const textMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 });
  
  // Left door text
  const leftDoorText = new THREE.Mesh(textBaseGeometry, textMaterial);
  leftDoorText.position.set(-1.02, 0.9, 0);
  group.add(leftDoorText);
  
  // Right door text
  const rightDoorText = new THREE.Mesh(textBaseGeometry, textMaterial);
  rightDoorText.position.set(1.02, 0.9, 0);
  group.add(rightDoorText);
  
  // Add police badge (star) on doors
  // Create a simple star shape for the badge
  const badgeGeometry = new THREE.CircleGeometry(0.2, 5); // 5-pointed star approximation
  const badgeMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });
  
  // Left door badge
  const leftBadge = new THREE.Mesh(badgeGeometry, badgeMaterial);
  leftBadge.position.set(-1.02, 0.9, -0.7);
  leftBadge.rotation.y = Math.PI / 2;
  group.add(leftBadge);
  
  // Right door badge
  const rightBadge = new THREE.Mesh(badgeGeometry, badgeMaterial);
  rightBadge.position.set(1.02, 0.9, -0.7);
  rightBadge.rotation.y = -Math.PI / 2;
  group.add(rightBadge);
  
  // Add police light bar on roof
  const lightBarBaseGeometry = new THREE.BoxGeometry(1.2, 0.15, 0.5);
  const lightBarBaseMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });
  const lightBarBase = new THREE.Mesh(lightBarBaseGeometry, lightBarBaseMaterial);
  lightBarBase.position.set(0, 1.76, -0.2);
  group.add(lightBarBase);
  
  // Add red and blue lights
  const lightGeometry = new THREE.BoxGeometry(0.3, 0.1, 0.4);
  
  // Red light (left)
  const redLightMaterial = new THREE.MeshStandardMaterial({ 
    color: 0xff0000, 
    emissive: 0xff0000,
    emissiveIntensity: 0.5
  });
  const redLight = new THREE.Mesh(lightGeometry, redLightMaterial);
  redLight.position.set(-0.3, 1.84, -0.2);
  group.add(redLight);
  
  // Blue light (right)
  const blueLightMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x0000ff, 
    emissive: 0x0000ff,
    emissiveIntensity: 0.5
  });
  const blueLight = new THREE.Mesh(lightGeometry, blueLightMaterial);
  blueLight.position.set(0.3, 1.84, -0.2);
  group.add(blueLight);
  
  // Add windshield
  const windshieldGeometry = new THREE.BoxGeometry(1.8, 0.65, 0.1);
  const windowMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x333333,
    transparent: true,
    opacity: 0.7
  });
  
  // Front windshield
  const frontWindow = new THREE.Mesh(windshieldGeometry, windowMaterial);
  frontWindow.position.set(0, 1.35, -1.1);
  frontWindow.rotation.x = Math.PI * 0.08;
  group.add(frontWindow);
  
  // Rear window
  const rearWindow = new THREE.Mesh(windshieldGeometry, windowMaterial);
  rearWindow.position.set(0, 1.35, 0.7);
  rearWindow.rotation.x = -Math.PI * 0.08;
  group.add(rearWindow);
  
  // Side windows
  const sideWindowGeometry = new THREE.BoxGeometry(0.1, 0.5, 1.4);
  
  // Left side window
  const leftWindow = new THREE.Mesh(sideWindowGeometry, windowMaterial);
  leftWindow.position.set(-1.0, 1.35, -0.2);
  group.add(leftWindow);
  
  // Right side window
  const rightWindow = new THREE.Mesh(sideWindowGeometry, windowMaterial);
  rightWindow.position.set(1.0, 1.35, -0.2);
  group.add(rightWindow);
  
  // Add front grille and bumper
  const grilleGeometry = new THREE.BoxGeometry(1.2, 0.3, 0.1);
  const grilleMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
  const grille = new THREE.Mesh(grilleGeometry, grilleMaterial);
  grille.position.set(0, 0.6, -1.76);
  group.add(grille);
  
  // Add headlights
  const headlightGeometry = new THREE.BoxGeometry(0.4, 0.2, 0.1);
  const headlightMaterial = new THREE.MeshStandardMaterial({ 
    color: 0xffffff,
    emissive: 0xffffcc,
    emissiveIntensity: 0.3
  });
  
  // Left headlight
  const leftHeadlight = new THREE.Mesh(headlightGeometry, headlightMaterial);
  leftHeadlight.position.set(-0.7, 0.6, -1.76);
  group.add(leftHeadlight);
  
  // Right headlight
  const rightHeadlight = new THREE.Mesh(headlightGeometry, headlightMaterial);
  rightHeadlight.position.set(0.7, 0.6, -1.76);
  group.add(rightHeadlight);
  
  // Add taillights
  const taillightGeometry = new THREE.BoxGeometry(0.4, 0.2, 0.1);
  const taillightMaterial = new THREE.MeshStandardMaterial({ 
    color: 0xff0000,
    emissive: 0xff0000,
    emissiveIntensity: 0.3
  });
  
  // Left taillight
  const leftTaillight = new THREE.Mesh(taillightGeometry, taillightMaterial);
  leftTaillight.position.set(-0.7, 0.6, 1.76);
  group.add(leftTaillight);
  
  // Right taillight
  const rightTaillight = new THREE.Mesh(taillightGeometry, taillightMaterial);
  rightTaillight.position.set(0.7, 0.6, 1.76);
  group.add(rightTaillight);
  
  // Add wheels
  const wheelGeometry = new THREE.CylinderGeometry(0.4, 0.4, 0.3, 16);
  const wheelMaterial = new THREE.MeshStandardMaterial({ color: 0x222222 });
  const hubCapGeometry = new THREE.CylinderGeometry(0.2, 0.2, 0.31, 5); // Star-shaped hub cap
  const hubCapMaterial = new THREE.MeshStandardMaterial({ color: 0xdddddd });
  
  // Front left wheel
  const frontLeftWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
  frontLeftWheel.position.set(-1.0, 0.4, -1.0);
  frontLeftWheel.rotation.z = Math.PI / 2;
  group.add(frontLeftWheel);
  
  // Front left hubcap
  const frontLeftHub = new THREE.Mesh(hubCapGeometry, hubCapMaterial);
  frontLeftHub.position.set(-1.0, 0.4, -1.0);
  frontLeftHub.rotation.z = Math.PI / 2;
  group.add(frontLeftHub);
  
  // Front right wheel
  const frontRightWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
  frontRightWheel.position.set(1.0, 0.4, -1.0);
  frontRightWheel.rotation.z = Math.PI / 2;
  group.add(frontRightWheel);
  
  // Front right hubcap
  const frontRightHub = new THREE.Mesh(hubCapGeometry, hubCapMaterial);
  frontRightHub.position.set(1.0, 0.4, -1.0);
  frontRightHub.rotation.z = Math.PI / 2;
  group.add(frontRightHub);
  
  // Rear left wheel
  const rearLeftWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
  rearLeftWheel.position.set(-1.0, 0.4, 1.0);
  rearLeftWheel.rotation.z = Math.PI / 2;
  group.add(rearLeftWheel);
  
  // Rear left hubcap
  const rearLeftHub = new THREE.Mesh(hubCapGeometry, hubCapMaterial);
  rearLeftHub.position.set(-1.0, 0.4, 1.0);
  rearLeftHub.rotation.z = Math.PI / 2;
  group.add(rearLeftHub);
  
  // Rear right wheel
  const rearRightWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
  rearRightWheel.position.set(1.0, 0.4, 1.0);
  rearRightWheel.rotation.z = Math.PI / 2;
  group.add(rearRightWheel);
  
  // Rear right hubcap
  const rearRightHub = new THREE.Mesh(hubCapGeometry, hubCapMaterial);
  rearRightHub.position.set(1.0, 0.4, 1.0);
  rearRightHub.rotation.z = Math.PI / 2;
  group.add(rearRightHub);
  
  // Add rear bumper
  const rearBumperGeometry = new THREE.BoxGeometry(2.0, 0.3, 0.2);
  const rearBumper = new THREE.Mesh(rearBumperGeometry, whiteMaterial);
  rearBumper.position.set(0, 0.6, 1.75);
  group.add(rearBumper);
  
  // Add "OUTLAW" text at the bottom right corner
  // This is represented by a small white box for simplicity
  const outlawTextGeometry = new THREE.BoxGeometry(0.8, 0.2, 0.01);
  const outlawText = new THREE.Mesh(outlawTextGeometry, whiteMaterial);
  outlawText.position.set(0.8, 0.3, 1.76);
  group.add(outlawText);
}

function createRoadkillMesh(group) {
  // Main body - beige/silver muscle car
  const bodyGeometry = new THREE.BoxGeometry(2.0, 0.7, 3.0);
  const bodyMaterial = new THREE.MeshStandardMaterial({ 
    color: 0xd4cdb6,  // Beige-silver color
    metalness: 0.3,
    roughness: 0.5
  });
  const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
  body.position.y = 0.5;
  group.add(body);
  
  // Add cabin/roof
  const cabinGeometry = new THREE.BoxGeometry(1.8, 0.6, 1.4);
  const cabin = new THREE.Mesh(cabinGeometry, bodyMaterial);
  cabin.position.set(0, 1.15, 0);
  group.add(cabin);
  
  // Add hood section
  const hoodGeometry = new THREE.BoxGeometry(1.9, 0.15, 0.8);
  const hood = new THREE.Mesh(hoodGeometry, bodyMaterial);
  hood.position.set(0, 0.63, -1.0);
  group.add(hood);
  
  // Add front grille
  const grilleGeometry = new THREE.BoxGeometry(1.7, 0.3, 0.1);
  const grilleMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x888888,
    metalness: 0.6,
    roughness: 0.3
  });
  const grille = new THREE.Mesh(grilleGeometry, grilleMaterial);
  grille.position.set(0, 0.45, -1.5);
  group.add(grille);
  
  // Add front bumper
  const frontBumperGeometry = new THREE.BoxGeometry(1.95, 0.2, 0.15);
  const bumperMaterial = new THREE.MeshStandardMaterial({ 
    color: 0xaaaaaa,
    metalness: 0.5,
    roughness: 0.4
  });
  const frontBumper = new THREE.Mesh(frontBumperGeometry, bumperMaterial);
  frontBumper.position.set(0, 0.3, -1.52);
  group.add(frontBumper);
  
  // Add rear bumper
  const rearBumperGeometry = new THREE.BoxGeometry(1.95, 0.2, 0.15);
  const rearBumper = new THREE.Mesh(rearBumperGeometry, bumperMaterial);
  rearBumper.position.set(0, 0.3, 1.52);
  group.add(rearBumper);
  
  // Add windshield
  const windshieldGeometry = new THREE.BoxGeometry(1.7, 0.6, 0.1);
  const glassMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x2a373f,
    transparent: true,
    opacity: 0.7
  });
  
  // Front windshield (angled)
  const frontWindshield = new THREE.Mesh(windshieldGeometry, glassMaterial);
  frontWindshield.position.set(0, 1.1, -0.7);
  frontWindshield.rotation.x = Math.PI * 0.15;
  group.add(frontWindshield);
  
  // Rear window (angled)
  const rearWindow = new THREE.Mesh(windshieldGeometry, glassMaterial);
  rearWindow.position.set(0, 1.1, 0.7);
  rearWindow.rotation.x = -Math.PI * 0.15;
  group.add(rearWindow);
  
  // Add side windows
  const sideWindowGeometry = new THREE.BoxGeometry(0.1, 0.5, 1.2);
  
  // Left window
  const leftWindow = new THREE.Mesh(sideWindowGeometry, glassMaterial);
  leftWindow.position.set(-1.05, 1.0, 0);
  group.add(leftWindow);
  
  // Right window
  const rightWindow = new THREE.Mesh(sideWindowGeometry, glassMaterial);
  rightWindow.position.set(1.05, 1.0, 0);
  group.add(rightWindow);
  
  // Add headlights
  const headlightGeometry = new THREE.BoxGeometry(0.35, 0.15, 0.05);
  const headlightMaterial = new THREE.MeshStandardMaterial({ 
    color: 0xffffee,
    emissive: 0xffffee,
    emissiveIntensity: 0.2
  });
  
  // Left headlight
  const leftHeadlight = new THREE.Mesh(headlightGeometry, headlightMaterial);
  leftHeadlight.position.set(-0.7, 0.45, -1.53);
  group.add(leftHeadlight);
  
  // Right headlight
  const rightHeadlight = new THREE.Mesh(headlightGeometry, headlightMaterial);
  rightHeadlight.position.set(0.7, 0.45, -1.53);
  group.add(rightHeadlight);
  
  // Add taillights
  const taillightGeometry = new THREE.BoxGeometry(0.35, 0.15, 0.05);
  const taillightMaterial = new THREE.MeshStandardMaterial({ 
    color: 0xff3333,
    emissive: 0xff0000,
    emissiveIntensity: 0.3
  });
  
  // Left taillight
  const leftTaillight = new THREE.Mesh(taillightGeometry, taillightMaterial);
  leftTaillight.position.set(-0.7, 0.45, 1.53);
  group.add(leftTaillight);
  
  // Right taillight
  const rightTaillight = new THREE.Mesh(taillightGeometry, taillightMaterial);
  rightTaillight.position.set(0.7, 0.45, 1.53);
  group.add(rightTaillight);
  
  // Add wheels
  const wheelRadius = 0.45;
  const wheelGeometry = new THREE.CylinderGeometry(wheelRadius, wheelRadius, 0.25, 16);
  const wheelMaterial = new THREE.MeshStandardMaterial({ color: 0x222222 });
  
  // Add hubcaps
  const hubCapGeometry = new THREE.CylinderGeometry(0.25, 0.25, 0.26, 16);
  const hubCapMaterial = new THREE.MeshStandardMaterial({ 
    color: 0xcccccc,
    metalness: 0.7,
    roughness: 0.3
  });
  
  // Add wheels with hubcaps
  const createWheel = (x, z) => {
    const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
    wheel.position.set(x, wheelRadius, z);
    wheel.rotation.z = Math.PI / 2;
    group.add(wheel);
    
    const hubCap = new THREE.Mesh(hubCapGeometry, hubCapMaterial);
    hubCap.position.set(x, wheelRadius, z);
    hubCap.rotation.z = Math.PI / 2;
    group.add(hubCap);
  };
  
  // Create all four wheels
  createWheel(-0.9, -1.0);  // Front left
  createWheel(0.9, -1.0);   // Front right
  createWheel(-0.9, 1.0);   // Rear left
  createWheel(0.9, 1.0);    // Rear right
  
  // Add muscle car details
  
  // Hood scoop
  const hoodScoopGeometry = new THREE.BoxGeometry(0.7, 0.1, 0.6);
  const hoodScoop = new THREE.Mesh(hoodScoopGeometry, bodyMaterial);
  hoodScoop.position.set(0, 0.73, -1.0);
  group.add(hoodScoop);
  
  // Trunk/rear details
  const trunkGeometry = new THREE.BoxGeometry(1.9, 0.1, 0.5);
  const trunk = new THREE.Mesh(trunkGeometry, bodyMaterial);
  trunk.position.set(0, 0.7, 1.2);
  group.add(trunk);
  
  // Add side details/trim
  const sideTrimGeometry = new THREE.BoxGeometry(0.1, 0.15, 2.8);
  const sideTrimMaterial = new THREE.MeshStandardMaterial({ 
    color: 0xaaaaaa,
    metalness: 0.7,
    roughness: 0.3
  });
  
  // Left side trim
  const leftTrim = new THREE.Mesh(sideTrimGeometry, sideTrimMaterial);
  leftTrim.position.set(-1.01, 0.4, 0);
  group.add(leftTrim);
  
  // Right side trim
  const rightTrim = new THREE.Mesh(sideTrimGeometry, sideTrimMaterial);
  rightTrim.position.set(1.01, 0.4, 0);
  group.add(rightTrim);
  
  // Add trim details - door handles, etc.
  const doorHandleGeometry = new THREE.BoxGeometry(0.02, 0.05, 0.1);
  const doorHandleMaterial = new THREE.MeshStandardMaterial({ 
    color: 0xcccccc,
    metalness: 0.8,
    roughness: 0.2
  });
  
  // Left door handle
  const leftDoorHandle = new THREE.Mesh(doorHandleGeometry, doorHandleMaterial);
  leftDoorHandle.position.set(-1.02, 0.8, 0.2);
  group.add(leftDoorHandle);
  
  // Right door handle
  const rightDoorHandle = new THREE.Mesh(doorHandleGeometry, doorHandleMaterial);
  rightDoorHandle.position.set(1.02, 0.8, 0.2);
  group.add(rightDoorHandle);
  
  // Add exhaust pipes
  const exhaustGeometry = new THREE.CylinderGeometry(0.06, 0.06, 0.4, 8);
  const exhaustMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x999999,
    metalness: 0.7,
    roughness: 0.3
  });
  
  // Left exhaust
  const leftExhaust = new THREE.Mesh(exhaustGeometry, exhaustMaterial);
  leftExhaust.position.set(-0.5, 0.3, 1.52);
  leftExhaust.rotation.z = Math.PI / 2;
  group.add(leftExhaust);
  
  // Right exhaust
  const rightExhaust = new THREE.Mesh(exhaustGeometry, exhaustMaterial);
  rightExhaust.position.set(0.5, 0.3, 1.52);
  rightExhaust.rotation.z = Math.PI / 2;
  group.add(rightExhaust);
  
  // Add details to the windows - window frames
  const windowFrameGeometry = new THREE.BoxGeometry(1.8, 0.05, 0.05);
  const windowFrameMaterial = new THREE.MeshStandardMaterial({ 
    color: 0xaaaaaa,
    metalness: 0.5,
    roughness: 0.5
  });
  
  // Front windshield top frame
  const frontFrameTop = new THREE.Mesh(windowFrameGeometry, windowFrameMaterial);
  frontFrameTop.position.set(0, 1.4, -0.5);
  group.add(frontFrameTop);
  
  // Add interior hints
  const seatBackGeometry = new THREE.BoxGeometry(1.5, 0.4, 0.1);
  const seatMaterial = new THREE.MeshStandardMaterial({ color: 0x42352c });
  const seatBack = new THREE.Mesh(seatBackGeometry, seatMaterial);
  seatBack.position.set(0, 0.8, 0.2);
  group.add(seatBack);
  
  // Add roof details (slight curvature hinted with a thin box)
  const roofDetailGeometry = new THREE.BoxGeometry(1.7, 0.05, 1.2);
  const roofDetail = new THREE.Mesh(roofDetailGeometry, bodyMaterial);
  roofDetail.position.set(0, 1.43, 0);
  group.add(roofDetail);
  
  // Add front grill details
  for (let i = -0.7; i <= 0.7; i += 0.2) {
    const grillDetailGeometry = new THREE.BoxGeometry(0.08, 0.2, 0.05);
    const grillDetail = new THREE.Mesh(grillDetailGeometry, grilleMaterial);
    grillDetail.position.set(i, 0.45, -1.53);
    group.add(grillDetail);
  }
}

function createSpectreMesh(group) {
  // Main body - blue sports car
  const bodyGeometry = new THREE.BoxGeometry(2.0, 0.6, 3.0);
  const bodyMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x0a4b9e,  // Deep blue
    metalness: 0.5,
    roughness: 0.2
  });
  const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
  body.position.y = 0.5;
  group.add(body);
  
  // Add cabin/roof
  const cabinGeometry = new THREE.BoxGeometry(1.8, 0.5, 1.4);
  const cabin = new THREE.Mesh(cabinGeometry, bodyMaterial);
  cabin.position.set(0, 1.05, 0);
  group.add(cabin);
  
  // Add white racing stripes (hood)
  const hoodStripeGeometry = new THREE.BoxGeometry(0.4, 0.01, 1.2);
  const stripeMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });
  
  // Front hood dual stripes
  const frontStripe1 = new THREE.Mesh(hoodStripeGeometry, stripeMaterial);
  frontStripe1.position.set(-0.3, 0.81, -0.8);
  group.add(frontStripe1);
  
  const frontStripe2 = new THREE.Mesh(hoodStripeGeometry, stripeMaterial);
  frontStripe2.position.set(0.3, 0.81, -0.8);
  group.add(frontStripe2);
  
  // Roof stripes
  const roofStripeGeometry = new THREE.BoxGeometry(0.4, 0.01, 1.4);
  
  const roofStripe1 = new THREE.Mesh(roofStripeGeometry, stripeMaterial);
  roofStripe1.position.set(-0.3, 1.31, 0);
  group.add(roofStripe1);
  
  const roofStripe2 = new THREE.Mesh(roofStripeGeometry, stripeMaterial);
  roofStripe2.position.set(0.3, 1.31, 0);
  group.add(roofStripe2);
  
  // Rear deck stripes
  const rearStripeGeometry = new THREE.BoxGeometry(0.4, 0.01, 0.8);
  
  const rearStripe1 = new THREE.Mesh(rearStripeGeometry, stripeMaterial);
  rearStripe1.position.set(-0.3, 0.81, 1.1);
  group.add(rearStripe1);
  
  const rearStripe2 = new THREE.Mesh(rearStripeGeometry, stripeMaterial);
  rearStripe2.position.set(0.3, 0.81, 1.1);
  group.add(rearStripe2);
  
  // Add front hood/nose
  const noseGeometry = new THREE.BoxGeometry(1.9, 0.3, 0.8);
  const nose = new THREE.Mesh(noseGeometry, bodyMaterial);
  nose.position.set(0, 0.65, -1.4);
  group.add(nose);
  
  // Add windshield
  const windshieldGeometry = new THREE.BoxGeometry(1.7, 0.5, 0.1);
  const glassMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x111111,
    transparent: true,
    opacity: 0.8
  });
  
  // Front windshield (angled)
  const frontWindshield = new THREE.Mesh(windshieldGeometry, glassMaterial);
  frontWindshield.position.set(0, 1.0, -0.7);
  frontWindshield.rotation.x = Math.PI * 0.15;
  group.add(frontWindshield);
  
  // Rear window (angled)
  const rearWindow = new THREE.Mesh(windshieldGeometry, glassMaterial);
  rearWindow.position.set(0, 1.0, 0.7);
  rearWindow.rotation.x = -Math.PI * 0.15;
  group.add(rearWindow);
  
  // Add side windows
  const sideWindowGeometry = new THREE.BoxGeometry(0.1, 0.4, 1.0);
  
  // Left window
  const leftWindow = new THREE.Mesh(sideWindowGeometry, glassMaterial);
  leftWindow.position.set(-0.95, 1.0, 0);
  group.add(leftWindow);
  
  // Right window
  const rightWindow = new THREE.Mesh(sideWindowGeometry, glassMaterial);
  rightWindow.position.set(0.95, 1.0, 0);
  group.add(rightWindow);
  
  // Add headlights
  const headlightGeometry = new THREE.BoxGeometry(0.3, 0.15, 0.05);
  const headlightMaterial = new THREE.MeshStandardMaterial({ 
    color: 0xffffee,
    emissive: 0xffffee,
    emissiveIntensity: 0.2
  });
  
  // Left headlight
  const leftHeadlight = new THREE.Mesh(headlightGeometry, headlightMaterial);
  leftHeadlight.position.set(-0.6, 0.6, -1.51);
  group.add(leftHeadlight);
  
  // Right headlight
  const rightHeadlight = new THREE.Mesh(headlightGeometry, headlightMaterial);
  rightHeadlight.position.set(0.6, 0.6, -1.51);
  group.add(rightHeadlight);
  
  // Add taillights
  const taillightGeometry = new THREE.BoxGeometry(0.3, 0.15, 0.05);
  const taillightMaterial = new THREE.MeshStandardMaterial({ 
    color: 0xff3333,
    emissive: 0xff0000,
    emissiveIntensity: 0.3
  });
  
  // Left taillight
  const leftTaillight = new THREE.Mesh(taillightGeometry, taillightMaterial);
  leftTaillight.position.set(-0.6, 0.6, 1.51);
  group.add(leftTaillight);
  
  // Right taillight
  const rightTaillight = new THREE.Mesh(taillightGeometry, taillightMaterial);
  rightTaillight.position.set(0.6, 0.6, 1.51);
  group.add(rightTaillight);
  
  // Add front grille
  const grilleGeometry = new THREE.BoxGeometry(1.0, 0.15, 0.05);
  const grilleMaterial = new THREE.MeshStandardMaterial({ color: 0x222222 });
  const grille = new THREE.Mesh(grilleGeometry, grilleMaterial);
  grille.position.set(0, 0.6, -1.51);
  group.add(grille);
  
  // Add wheels
  const wheelRadius = 0.4;
  const wheelGeometry = new THREE.CylinderGeometry(wheelRadius, wheelRadius, 0.25, 16);
  const wheelMaterial = new THREE.MeshStandardMaterial({ color: 0x222222 });
  
  // Create star-shaped hub caps
  const hubCapGeometry = new THREE.CylinderGeometry(0.2, 0.2, 0.26, 5); // 5-pointed star
  const hubCapMaterial = new THREE.MeshStandardMaterial({ 
    color: 0xcccccc,
    metalness: 0.8,
    roughness: 0.2
  });
  
  // Add wheels with hubcaps
  const createWheel = (x, z) => {
    const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
    wheel.position.set(x, wheelRadius, z);
    wheel.rotation.z = Math.PI / 2;
    group.add(wheel);
    
    const hubCap = new THREE.Mesh(hubCapGeometry, hubCapMaterial);
    hubCap.position.set(x, wheelRadius, z);
    hubCap.rotation.z = Math.PI / 2;
    group.add(hubCap);
  };
  
  // Create all four wheels
  createWheel(-0.8, -0.9);  // Front left
  createWheel(0.8, -0.9);   // Front right
  createWheel(-0.8, 0.9);   // Rear left
  createWheel(0.8, 0.9);    // Rear right
  
  // Add front bumper
  const frontBumperGeometry = new THREE.BoxGeometry(1.8, 0.15, 0.1);
  const bumperMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x333333,
    metalness: 0.6,
    roughness: 0.4
  });
  const frontBumper = new THREE.Mesh(frontBumperGeometry, bumperMaterial);
  frontBumper.position.set(0, 0.4, -1.51);
  group.add(frontBumper);
  
  // Add rear bumper
  const rearBumperGeometry = new THREE.BoxGeometry(1.8, 0.15, 0.1);
  const rearBumper = new THREE.Mesh(rearBumperGeometry, bumperMaterial);
  rearBumper.position.set(0, 0.4, 1.51);
  group.add(rearBumper);
  
  // Add side skirts/details
  const sideSkirtGeometry = new THREE.BoxGeometry(0.05, 0.15, 1.8);
  const sideSkirtMaterial = new THREE.MeshStandardMaterial({ color: 0x222222 });
  
  // Left side skirt
  const leftSideSkirt = new THREE.Mesh(sideSkirtGeometry, sideSkirtMaterial);
  leftSideSkirt.position.set(-1.01, 0.3, 0);
  group.add(leftSideSkirt);
  
  // Right side skirt
  const rightSideSkirt = new THREE.Mesh(sideSkirtGeometry, sideSkirtMaterial);
  rightSideSkirt.position.set(1.01, 0.3, 0);
  group.add(rightSideSkirt);
  
  // Add spoiler
  const spoilerBaseGeometry = new THREE.BoxGeometry(1.6, 0.05, 0.3);
  const spoilerMaterial = new THREE.MeshStandardMaterial({ color: 0x222222 });
  const spoilerBase = new THREE.Mesh(spoilerBaseGeometry, spoilerMaterial);
  spoilerBase.position.set(0, 0.8, 1.4);
  group.add(spoilerBase);
  
  // Spoiler stands
  const spoilerStandGeometry = new THREE.BoxGeometry(0.05, 0.2, 0.05);
  
  // Left stand
  const leftStand = new THREE.Mesh(spoilerStandGeometry, spoilerMaterial);
  leftStand.position.set(-0.7, 0.9, 1.4);
  group.add(leftStand);
  
  // Right stand
  const rightStand = new THREE.Mesh(spoilerStandGeometry, spoilerMaterial);
  rightStand.position.set(0.7, 0.9, 1.4);
  group.add(rightStand);
  
  // Spoiler wing
  const spoilerWingGeometry = new THREE.BoxGeometry(1.6, 0.05, 0.2);
  const spoilerWing = new THREE.Mesh(spoilerWingGeometry, spoilerMaterial);
  spoilerWing.position.set(0, 1.0, 1.4);
  group.add(spoilerWing);
  
  // Add hood scoop/intake
  const hoodScoopGeometry = new THREE.BoxGeometry(0.6, 0.1, 0.4);
  const hoodScoopMaterial = new THREE.MeshStandardMaterial({ color: 0x222222 });
  const hoodScoop = new THREE.Mesh(hoodScoopGeometry, hoodScoopMaterial);
  hoodScoop.position.set(0, 0.81, -0.8);
  group.add(hoodScoop);
  
  // Add exhaust pipes
  const exhaustGeometry = new THREE.CylinderGeometry(0.06, 0.06, 0.3, 8);
  const exhaustMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x888888,
    metalness: 0.7,
    roughness: 0.3
  });
  
  // Left exhaust
  const leftExhaust = new THREE.Mesh(exhaustGeometry, exhaustMaterial);
  leftExhaust.position.set(-0.4, 0.4, 1.51);
  leftExhaust.rotation.z = Math.PI / 2;
  group.add(leftExhaust);
  
  // Right exhaust
  const rightExhaust = new THREE.Mesh(exhaustGeometry, exhaustMaterial);
  rightExhaust.position.set(0.4, 0.4, 1.51);
  rightExhaust.rotation.z = Math.PI / 2;
  group.add(rightExhaust);
}

function createThumperMesh(group) {
  // Main body - purple classic car/lowrider
  const bodyGeometry = new THREE.BoxGeometry(2.2, 0.8, 3.8);
  const bodyMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x800080,  // Purple
    metalness: 0.6,
    roughness: 0.3
  });
  const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
  body.position.y = 0.7;
  group.add(body);
  
  // Add black roof/top
  const roofGeometry = new THREE.BoxGeometry(2.0, 0.4, 1.8);
  const blackMaterial = new THREE.MeshStandardMaterial({ color: 0x111111 });
  const roof = new THREE.Mesh(roofGeometry, blackMaterial);
  roof.position.set(0, 1.3, 0);
  group.add(roof);
  
  // Add long hood section
  const hoodGeometry = new THREE.BoxGeometry(2.2, 0.1, 1.2);
  const hood = new THREE.Mesh(hoodGeometry, bodyMaterial);
  hood.position.set(0, 0.85, -1.3);
  group.add(hood);
  
  // Add trunk
  const trunkGeometry = new THREE.BoxGeometry(2.2, 0.1, 0.8);
  const trunk = new THREE.Mesh(trunkGeometry, bodyMaterial);
  trunk.position.set(0, 0.85, 1.5);
  group.add(trunk);
  
  // Add front grille (chrome)
  const grilleGeometry = new THREE.BoxGeometry(2.0, 0.4, 0.1);
  const chromeMaterial = new THREE.MeshStandardMaterial({ 
    color: 0xcccccc,
    metalness: 0.9,
    roughness: 0.1
  });
  const grille = new THREE.Mesh(grilleGeometry, chromeMaterial);
  grille.position.set(0, 0.7, -1.9);
  group.add(grille);
  
  // Add grille details - horizontal chrome bars
  for (let i = -0.15; i <= 0.15; i += 0.1) {
    const barGeometry = new THREE.BoxGeometry(1.8, 0.04, 0.05);
    const bar = new THREE.Mesh(barGeometry, chromeMaterial);
    bar.position.set(0, 0.7 + i, -1.91);
    group.add(bar);
  }
  
  // Add front bumper
  const frontBumperGeometry = new THREE.BoxGeometry(2.0, 0.2, 0.15);
  const frontBumper = new THREE.Mesh(frontBumperGeometry, chromeMaterial);
  frontBumper.position.set(0, 0.5, -1.92);
  group.add(frontBumper);
  
  // Add rear bumper
  const rearBumperGeometry = new THREE.BoxGeometry(2.0, 0.2, 0.15);
  const rearBumper = new THREE.Mesh(rearBumperGeometry, chromeMaterial);
  rearBumper.position.set(0, 0.5, 1.92);
  group.add(rearBumper);
  
  // Add windshield
  const windshieldGeometry = new THREE.BoxGeometry(1.9, 0.6, 0.1);
  const glassMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x333333,
    transparent: true,
    opacity: 0.7
  });
  
  // Front windshield
  const frontWindshield = new THREE.Mesh(windshieldGeometry, glassMaterial);
  frontWindshield.position.set(0, 1.05, -0.9);
  frontWindshield.rotation.x = Math.PI * 0.1;
  group.add(frontWindshield);
  
  // Rear window
  const rearWindow = new THREE.Mesh(windshieldGeometry, glassMaterial);
  rearWindow.position.set(0, 1.05, 0.9);
  rearWindow.rotation.x = -Math.PI * 0.1;
  group.add(rearWindow);
  
  // Add side windows
  const sideWindowGeometry = new THREE.BoxGeometry(0.1, 0.4, 1.6);
  
  // Left window
  const leftWindow = new THREE.Mesh(sideWindowGeometry, glassMaterial);
  leftWindow.position.set(-1.11, 1.1, 0);
  group.add(leftWindow);
  
  // Right window
  const rightWindow = new THREE.Mesh(sideWindowGeometry, glassMaterial);
  rightWindow.position.set(1.11, 1.1, 0);
  group.add(rightWindow);
  
  // Add headlights - classic round style
  const headlightGeometry = new THREE.CylinderGeometry(0.2, 0.2, 0.1, 16);
  const headlightMaterial = new THREE.MeshStandardMaterial({ 
    color: 0xffffee,
    emissive: 0xffffee,
    emissiveIntensity: 0.2
  });
  
  // Left headlight
  const leftHeadlight = new THREE.Mesh(headlightGeometry, headlightMaterial);
  leftHeadlight.position.set(-0.6, 0.7, -1.91);
  leftHeadlight.rotation.x = Math.PI / 2;
  group.add(leftHeadlight);
  
  // Right headlight
  const rightHeadlight = new THREE.Mesh(headlightGeometry, headlightMaterial);
  rightHeadlight.position.set(0.6, 0.7, -1.91);
  rightHeadlight.rotation.x = Math.PI / 2;
  group.add(rightHeadlight);
  
  // Add chrome rings around headlights
  const headlightRingGeometry = new THREE.TorusGeometry(0.2, 0.03, 8, 16);
  
  // Left headlight ring
  const leftHeadlightRing = new THREE.Mesh(headlightRingGeometry, chromeMaterial);
  leftHeadlightRing.position.set(-0.6, 0.7, -1.86);
  leftHeadlightRing.rotation.x = Math.PI / 2;
  group.add(leftHeadlightRing);
  
  // Right headlight ring
  const rightHeadlightRing = new THREE.Mesh(headlightRingGeometry, chromeMaterial);
  rightHeadlightRing.position.set(0.6, 0.7, -1.86);
  rightHeadlightRing.rotation.x = Math.PI / 2;
  group.add(rightHeadlightRing);
  
  // Add taillights - classic rectangular style
  const taillightGeometry = new THREE.BoxGeometry(0.5, 0.15, 0.05);
  const taillightMaterial = new THREE.MeshStandardMaterial({ 
    color: 0xff0000,
    emissive: 0xff0000,
    emissiveIntensity: 0.3
  });
  
  // Left taillight
  const leftTaillight = new THREE.Mesh(taillightGeometry, taillightMaterial);
  leftTaillight.position.set(-0.8, 0.7, 1.92);
  group.add(leftTaillight);
  
  // Right taillight
  const rightTaillight = new THREE.Mesh(taillightGeometry, taillightMaterial);
  rightTaillight.position.set(0.8, 0.7, 1.92);
  group.add(rightTaillight);
  
  // Add chrome trim around taillights
  const tailTrimGeometry = new THREE.BoxGeometry(0.6, 0.2, 0.02);
  
  // Left taillight trim
  const leftTailTrim = new THREE.Mesh(tailTrimGeometry, chromeMaterial);
  leftTailTrim.position.set(-0.8, 0.7, 1.93);
  group.add(leftTailTrim);
  
  // Right taillight trim
  const rightTailTrim = new THREE.Mesh(tailTrimGeometry, chromeMaterial);
  rightTailTrim.position.set(0.8, 0.7, 1.93);
  group.add(rightTailTrim);
  
  // Add wheels - classic whitewalls
  const wheelRadius = 0.4;
  const wheelGeometry = new THREE.CylinderGeometry(wheelRadius, wheelRadius, 0.2, 16);
  const wheelMaterial = new THREE.MeshStandardMaterial({ color: 0x222222 });
  const whiteWallGeometry = new THREE.CylinderGeometry(wheelRadius * 0.85, wheelRadius * 0.85, 0.21, 16);
  const whiteWallMaterial = new THREE.MeshStandardMaterial({ color: 0xdddddd });
  
  // Create wheels with whitewalls and hubcaps
  const createWheel = (x, z) => {
    // Main tire
    const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
    wheel.position.set(x, wheelRadius, z);
    wheel.rotation.z = Math.PI / 2;
    group.add(wheel);
    
    // White wall
    const whiteWall = new THREE.Mesh(whiteWallGeometry, whiteWallMaterial);
    whiteWall.position.set(x, wheelRadius, z);
    whiteWall.rotation.z = Math.PI / 2;
    group.add(whiteWall);
    
    // Chrome hubcap
    const hubCapGeometry = new THREE.CylinderGeometry(wheelRadius * 0.5, wheelRadius * 0.5, 0.22, 16);
    const hubCap = new THREE.Mesh(hubCapGeometry, chromeMaterial);
    hubCap.position.set(x, wheelRadius, z);
    hubCap.rotation.z = Math.PI / 2;
    group.add(hubCap);
  };
  
  // Create all four wheels
  createWheel(-1.0, -1.3);  // Front left
  createWheel(1.0, -1.3);   // Front right
  createWheel(-1.0, 1.3);   // Rear left
  createWheel(1.0, 1.3);    // Rear right
  
  // Add chrome side trim
  const sideTrimGeometry = new THREE.BoxGeometry(0.05, 0.1, 3.2);
  
  // Left side trim
  const leftSideTrim = new THREE.Mesh(sideTrimGeometry, chromeMaterial);
  leftSideTrim.position.set(-1.11, 0.7, 0);
  group.add(leftSideTrim);
  
  // Right side trim
  const rightSideTrim = new THREE.Mesh(sideTrimGeometry, chromeMaterial);
  rightSideTrim.position.set(1.11, 0.7, 0);
  group.add(rightSideTrim);
  
  // Add hood ornaments/details - air intake blocks
  const intakeGeometry = new THREE.BoxGeometry(0.3, 0.15, 0.3);
  const intakeMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x555555,
    metalness: 0.7,
    roughness: 0.3
  });
  
  // Left intake
  const leftIntake = new THREE.Mesh(intakeGeometry, intakeMaterial);
  leftIntake.position.set(-0.6, 0.95, -1.3);
  group.add(leftIntake);
  
  // Right intake
  const rightIntake = new THREE.Mesh(intakeGeometry, intakeMaterial);
  rightIntake.position.set(0.6, 0.95, -1.3);
  group.add(rightIntake);
  
  // Add door handles
  const doorHandleGeometry = new THREE.BoxGeometry(0.03, 0.06, 0.15);
  
  // Left door handle
  const leftDoorHandle = new THREE.Mesh(doorHandleGeometry, chromeMaterial);
  leftDoorHandle.position.set(-1.12, 0.9, 0);
  group.add(leftDoorHandle);
  
  // Right door handle
  const rightDoorHandle = new THREE.Mesh(doorHandleGeometry, chromeMaterial);
  rightDoorHandle.position.set(1.12, 0.9, 0);
  group.add(rightDoorHandle);
  
  // Add front fender details
  const fenderDetailGeometry = new THREE.BoxGeometry(0.1, 0.15, 0.6);
  
  // Left fender detail
  const leftFenderDetail = new THREE.Mesh(fenderDetailGeometry, bodyMaterial);
  leftFenderDetail.position.set(-1.05, 0.6, -1.6);
  group.add(leftFenderDetail);
  
  // Right fender detail
  const rightFenderDetail = new THREE.Mesh(fenderDetailGeometry, bodyMaterial);
  rightFenderDetail.position.set(1.05, 0.6, -1.6);
  group.add(rightFenderDetail);
  
  // Add chrome roof trim
  const roofTrimGeometry = new THREE.BoxGeometry(2.02, 0.03, 1.82);
  const roofTrim = new THREE.Mesh(roofTrimGeometry, chromeMaterial);
  roofTrim.position.set(0, 1.1, 0);
  group.add(roofTrim);
}

function createWarthogMesh(group) {
  // Main body - tan/beige military Humvee style vehicle
  const bodyGeometry = new THREE.BoxGeometry(2.4, 1.2, 3.0);
  const bodyMaterial = new THREE.MeshStandardMaterial({ 
    color: 0xbdb76b,  // Military tan/khaki
    metalness: 0.1,
    roughness: 0.8
  });
  const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
  body.position.y = 0.9;
  group.add(body);
  
  // Add cabin/roof
  const cabinGeometry = new THREE.BoxGeometry(2.2, 0.6, 2.0);
  const cabin = new THREE.Mesh(cabinGeometry, bodyMaterial);
  cabin.position.set(0, 1.8, -0.2);
  group.add(cabin);
  
  // Add hood section
  const hoodGeometry = new THREE.BoxGeometry(2.0, 0.2, 0.8);
  const hood = new THREE.Mesh(hoodGeometry, bodyMaterial);
  hood.position.set(0, 1.1, -1.6);
  group.add(hood);
  
  // Add front grille
  const grilleGeometry = new THREE.BoxGeometry(1.8, 0.6, 0.1);
  const grilleMaterial = new THREE.MeshStandardMaterial({ color: 0x444444 });
  const grille = new THREE.Mesh(grilleGeometry, grilleMaterial);
  grille.position.set(0, 0.9, -1.55);
  group.add(grille);
  
  // Add front grille slats
  for (let i = -0.25; i <= 0.25; i += 0.1) {
    const slatGeometry = new THREE.BoxGeometry(1.6, 0.05, 0.06);
    const slat = new THREE.Mesh(slatGeometry, grilleMaterial);
    slat.position.set(0, 0.9 + i, -1.53);
    group.add(slat);
  }
  
  // Add windshield
  const windshieldGeometry = new THREE.BoxGeometry(2.0, 0.6, 0.1);
  const glassMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x444444,
    transparent: true,
    opacity: 0.6
  });
  
  // Front windshield
  const frontWindshield = new THREE.Mesh(windshieldGeometry, glassMaterial);
  frontWindshield.position.set(0, 1.5, -1.1);
  frontWindshield.rotation.x = Math.PI * 0.1;
  group.add(frontWindshield);
  
  // Side windows
  const sideWindowGeometry = new THREE.BoxGeometry(0.1, 0.5, 1.4);
  
  // Left window
  const leftWindow = new THREE.Mesh(sideWindowGeometry, glassMaterial);
  leftWindow.position.set(-1.11, 1.6, -0.4);
  group.add(leftWindow);
  
  // Right window
  const rightWindow = new THREE.Mesh(sideWindowGeometry, glassMaterial);
  rightWindow.position.set(1.11, 1.6, -0.4);
  group.add(rightWindow);
  
  // Rear windows
  const rearWindowGeometry = new THREE.BoxGeometry(0.1, 0.5, 0.6);
  
  // Left rear window
  const leftRearWindow = new THREE.Mesh(rearWindowGeometry, glassMaterial);
  leftRearWindow.position.set(-1.11, 1.6, 0.6);
  group.add(leftRearWindow);
  
  // Right rear window
  const rightRearWindow = new THREE.Mesh(rearWindowGeometry, glassMaterial);
  rightRearWindow.position.set(1.11, 1.6, 0.6);
  group.add(rightRearWindow);
  
  // Back window
  const backWindow = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.5, 0.1), glassMaterial);
  backWindow.position.set(0, 1.6, 0.9);
  group.add(backWindow);
  
  // Add headlights
  const headlightGeometry = new THREE.BoxGeometry(0.4, 0.2, 0.1);
  const headlightMaterial = new THREE.MeshStandardMaterial({ 
    color: 0xffffee,
    emissive: 0xffffee,
    emissiveIntensity: 0.2
  });
  
  // Left headlight
  const leftHeadlight = new THREE.Mesh(headlightGeometry, headlightMaterial);
  leftHeadlight.position.set(-0.7, 0.7, -1.53);
  group.add(leftHeadlight);
  
  // Right headlight
  const rightHeadlight = new THREE.Mesh(headlightGeometry, headlightMaterial);
  rightHeadlight.position.set(0.7, 0.7, -1.53);
  group.add(rightHeadlight);
  
  // Add taillights
  const taillightGeometry = new THREE.BoxGeometry(0.3, 0.15, 0.05);
  const taillightMaterial = new THREE.MeshStandardMaterial({ 
    color: 0xff0000,
    emissive: 0xff0000,
    emissiveIntensity: 0.3
  });
  
  // Left taillight
  const leftTaillight = new THREE.Mesh(taillightGeometry, taillightMaterial);
  leftTaillight.position.set(-0.8, 0.6, 1.53);
  group.add(leftTaillight);
  
  // Right taillight
  const rightTaillight = new THREE.Mesh(taillightGeometry, taillightMaterial);
  rightTaillight.position.set(0.8, 0.6, 1.53);
  group.add(rightTaillight);
  
  // Add large military-style wheels with rugged tires
  const wheelRadius = 0.6;
  const wheelGeometry = new THREE.CylinderGeometry(wheelRadius, wheelRadius, 0.4, 16);
  const wheelMaterial = new THREE.MeshStandardMaterial({ color: 0x222222 });
  
  // Add hubs
  const hubGeometry = new THREE.CylinderGeometry(wheelRadius * 0.5, wheelRadius * 0.5, 0.41, 8);
  const hubMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x555555, 
    metalness: 0.3,
    roughness: 0.7
  });
  
  // Create wheels with hubs
  const createWheel = (x, z) => {
    const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
    wheel.position.set(x, wheelRadius, z);
    wheel.rotation.z = Math.PI / 2;
    group.add(wheel);
    
    const hub = new THREE.Mesh(hubGeometry, hubMaterial);
    hub.position.set(x, wheelRadius, z);
    hub.rotation.z = Math.PI / 2;
    group.add(hub);
  };
  
  // Create all four wheels
  createWheel(-1.0, -1.0);  // Front left
  createWheel(1.0, -1.0);   // Front right
  createWheel(-1.0, 1.0);   // Rear left
  createWheel(1.0, 1.0);    // Rear right
  
  // Add fenders over wheels
  const fenderGeometry = new THREE.BoxGeometry(0.5, 0.15, 0.8);
  
  // Front left fender
  const frontLeftFender = new THREE.Mesh(fenderGeometry, bodyMaterial);
  frontLeftFender.position.set(-1.1, 1.3, -1.0);
  group.add(frontLeftFender);
  
  // Front right fender
  const frontRightFender = new THREE.Mesh(fenderGeometry, bodyMaterial);
  frontRightFender.position.set(1.1, 1.3, -1.0);
  group.add(frontRightFender);
  
  // Rear left fender
  const rearLeftFender = new THREE.Mesh(fenderGeometry, bodyMaterial);
  rearLeftFender.position.set(-1.1, 1.3, 1.0);
  group.add(rearLeftFender);
  
  // Rear right fender
  const rearRightFender = new THREE.Mesh(fenderGeometry, bodyMaterial);
  rearRightFender.position.set(1.1, 1.3, 1.0);
  group.add(rearRightFender);
  
  // Add roof equipment/details
  
  // Roof rack
  const roofRackGeometry = new THREE.BoxGeometry(1.8, 0.07, 1.6);
  const roofRackMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
  const roofRack = new THREE.Mesh(roofRackGeometry, roofRackMaterial);
  roofRack.position.set(0, 2.11, -0.2);
  group.add(roofRack);
  
  // Equipment boxes on roof
  const boxGeometry = new THREE.BoxGeometry(0.4, 0.2, 0.4);
  const equipmentMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x666666,
    metalness: 0.2,
    roughness: 0.8
  });
  
  // Front left box
  const box1 = new THREE.Mesh(boxGeometry, equipmentMaterial);
  box1.position.set(-0.6, 2.25, -0.6);
  group.add(box1);
  
  // Front right box
  const box2 = new THREE.Mesh(boxGeometry, equipmentMaterial);
  box2.position.set(0.6, 2.25, -0.6);
  group.add(box2);
  
  // Rear center box
  const box3 = new THREE.Mesh(boxGeometry, equipmentMaterial);
  box3.position.set(0, 2.25, 0.3);
  group.add(box3);
  
  // Add antenna
  const antennaGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.6, 8);
  const antennaMaterial = new THREE.MeshStandardMaterial({ color: 0x222222 });
  const antenna = new THREE.Mesh(antennaGeometry, antennaMaterial);
  antenna.position.set(-0.9, 2.5, 0.2);
  group.add(antenna);
  
  // Add bumpers
  const frontBumperGeometry = new THREE.BoxGeometry(2.2, 0.3, 0.2);
  const bumperMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x444444,
    metalness: 0.3,
    roughness: 0.7
  });
  const frontBumper = new THREE.Mesh(frontBumperGeometry, bumperMaterial);
  frontBumper.position.set(0, 0.5, -1.52);
  group.add(frontBumper);
  
  // Rear bumper
  const rearBumper = new THREE.Mesh(frontBumperGeometry, bumperMaterial);
  rearBumper.position.set(0, 0.5, 1.52);
  group.add(rearBumper);
  
  // Add door handles
  const doorHandleGeometry = new THREE.BoxGeometry(0.08, 0.08, 0.15);
  const doorHandleMaterial = new THREE.MeshStandardMaterial({ color: 0x222222 });
  
  // Front left door handle
  const leftFrontDoorHandle = new THREE.Mesh(doorHandleGeometry, doorHandleMaterial);
  leftFrontDoorHandle.position.set(-1.21, 1.3, -0.6);
  group.add(leftFrontDoorHandle);
  
  // Front right door handle
  const rightFrontDoorHandle = new THREE.Mesh(doorHandleGeometry, doorHandleMaterial);
  rightFrontDoorHandle.position.set(1.21, 1.3, -0.6);
  group.add(rightFrontDoorHandle);
  
  // Add side details - horizontal reinforcement
  const sideReinforcementGeometry = new THREE.BoxGeometry(0.1, 0.15, 2.8);
  const reinforcementMaterial = new THREE.MeshStandardMaterial({ color: 0x444444 });
  
  // Left side reinforcement
  const leftReinforcement = new THREE.Mesh(sideReinforcementGeometry, reinforcementMaterial);
  leftReinforcement.position.set(-1.2, 0.7, 0);
  group.add(leftReinforcement);
  
  // Right side reinforcement
  const rightReinforcement = new THREE.Mesh(sideReinforcementGeometry, reinforcementMaterial);
  rightReinforcement.position.set(1.2, 0.7, 0);
  group.add(rightReinforcement);
} 

/**
 * Creates a Sweet Tooth ice cream truck mesh
 * @param {THREE.Group} group The group to add parts to
 */
function createSweetToothMesh(group) {
  // Create the main ice cream truck body
  const truckGroup = new THREE.Group();
  
  // Main body - boxy white truck with sharper edges
  const bodyGeometry = new THREE.BoxGeometry(3.0, 2.5, 4.5);
  const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0xeeeeee });
  const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
  body.position.set(0, 1.7, 0);
  truckGroup.add(body);
  
  // Front cab section (more separated from the rear box)
  const frontGeometry = new THREE.BoxGeometry(3.0, 1.0, 1.2);
  const front = new THREE.Mesh(frontGeometry, bodyMaterial);
  front.position.set(0, 1.0, -2.0);
  truckGroup.add(front);
  
  // Front window section - black
  const frontWindowAreaGeometry = new THREE.BoxGeometry(2.8, 0.8, 0.7);
  const windowMaterial = new THREE.MeshStandardMaterial({
    color: 0x111111,
    transparent: true,
    opacity: 0.9
  });
  const frontWindowArea = new THREE.Mesh(frontWindowAreaGeometry, windowMaterial);
  frontWindowArea.position.set(0, 1.7, -2.0);
  truckGroup.add(frontWindowArea);
  
  // Side windows - large black rectangles
  const sideWindowGeometry = new THREE.BoxGeometry(0.1, 0.8, 1.5);
  
  // Left side window
  const leftSideWindow = new THREE.Mesh(sideWindowGeometry, windowMaterial);
  leftSideWindow.position.set(-1.55, 1.7, -1.5);
  truckGroup.add(leftSideWindow);
  
  // Right side window
  const rightSideWindow = new THREE.Mesh(sideWindowGeometry, windowMaterial);
  rightSideWindow.position.set(1.55, 1.7, -1.5);
  truckGroup.add(rightSideWindow);
  
  // Front grille area
  const grillGeometry = new THREE.BoxGeometry(2.6, 0.6, 0.2);
  const grillMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
  const grill = new THREE.Mesh(grillGeometry, grillMaterial);
  grill.position.set(0, 0.6, -2.6);
  truckGroup.add(grill);
  
  // Front bumper
  const frontBumperGeometry = new THREE.BoxGeometry(3.0, 0.4, 0.3);
  const bumperMaterial = new THREE.MeshStandardMaterial({ color: 0x666666 });
  const frontBumper = new THREE.Mesh(frontBumperGeometry, bumperMaterial);
  frontBumper.position.set(0, 0.3, -2.6);
  truckGroup.add(frontBumper);
  
  // Add headlights - simple squares
  const headlightGeometry = new THREE.BoxGeometry(0.6, 0.4, 0.1);
  const headlightMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffcc,
    emissive: 0xffffee,
    emissiveIntensity: 0.3
  });
  
  // Left headlight
  const leftHeadlight = new THREE.Mesh(headlightGeometry, headlightMaterial);
  leftHeadlight.position.set(-1.0, 0.6, -2.65);
  truckGroup.add(leftHeadlight);
  
  // Right headlight
  const rightHeadlight = new THREE.Mesh(headlightGeometry, headlightMaterial);
  rightHeadlight.position.set(1.0, 0.6, -2.65);
  truckGroup.add(rightHeadlight);
  
  // Row of roof lights (signature of the ice cream truck)
  const roofLightGeometry = new THREE.BoxGeometry(0.3, 0.15, 0.15);
  const roofLightMaterial = new THREE.MeshStandardMaterial({
    color: 0xff3333,
    emissive: 0xff0000,
    emissiveIntensity: 0.4
  });
  
  // Add row of lights at the front top edge
  for (let i = -1.2; i <= 1.2; i += 0.5) {
    const roofLight = new THREE.Mesh(roofLightGeometry, roofLightMaterial);
    roofLight.position.set(i, 3.0, -2.0);
    truckGroup.add(roofLight);
  }
  
  // Add polka dots using circles
  addPolkaDots(truckGroup);
  
  // Create wheels
  const wheelGeometry = new THREE.CylinderGeometry(0.6, 0.6, 0.4, 12);
  const wheelMaterial = new THREE.MeshStandardMaterial({ color: 0x222222 });
  
  const wheelPositions = [
    { x: -1.3, y: 0.6, z: -1.5 }, // Front left
    { x: 1.3, y: 0.6, z: -1.5 },  // Front right
    { x: -1.3, y: 0.6, z: 1.5 },  // Rear left
    { x: 1.3, y: 0.6, z: 1.5 }    // Rear right
  ];
  
  wheelPositions.forEach(pos => {
    const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
    wheel.position.set(pos.x, pos.y, pos.z);
    wheel.rotation.z = Math.PI / 2;
    truckGroup.add(wheel);
    
    // Add simple hubcap
    const hubGeometry = new THREE.CylinderGeometry(0.25, 0.25, 0.41, 8);
    const hubMaterial = new THREE.MeshStandardMaterial({ color: 0x777777 });
    const hub = new THREE.Mesh(hubGeometry, hubMaterial);
    hub.position.set(pos.x, pos.y, pos.z);
    hub.rotation.z = Math.PI / 2;
    truckGroup.add(hub);
  });
  
  // Add "SWEET TOOTH" text on sides
  addSweetToothText(truckGroup);
  
  // Create the flaming clown head
  const clownHead = createClownHead();
  clownHead.position.set(0, 3.6, 0);
  truckGroup.add(clownHead);
  
  // Add the truck to the main group
  group.add(truckGroup);
}

// Function to add polka dots to the truck
function addPolkaDots(truckGroup) {
  const dotGeometry = new THREE.CircleGeometry(0.35, 8);
  const dotMaterial = new THREE.MeshStandardMaterial({ 
    color: 0xff3377,
    side: THREE.DoubleSide
  });
  
  // Positions for dots on the main body sides
  const dotPositions = [
    // Left side dots
    { x: -1.51, y: 1.0, z: -1.5, rx: 0, ry: Math.PI/2, rz: 0 },
    { x: -1.51, y: 1.0, z: 0, rx: 0, ry: Math.PI/2, rz: 0 },
    { x: -1.51, y: 1.0, z: 1.5, rx: 0, ry: Math.PI/2, rz: 0 },
    { x: -1.51, y: 2.0, z: -1.5, rx: 0, ry: Math.PI/2, rz: 0 },
    { x: -1.51, y: 2.0, z: 0, rx: 0, ry: Math.PI/2, rz: 0 },
    { x: -1.51, y: 2.0, z: 1.5, rx: 0, ry: Math.PI/2, rz: 0 },
    
    // Right side dots
    { x: 1.51, y: 1.0, z: -1.5, rx: 0, ry: -Math.PI/2, rz: 0 },
    { x: 1.51, y: 1.0, z: 0, rx: 0, ry: -Math.PI/2, rz: 0 },
    { x: 1.51, y: 1.0, z: 1.5, rx: 0, ry: -Math.PI/2, rz: 0 },
    { x: 1.51, y: 2.0, z: -1.5, rx: 0, ry: -Math.PI/2, rz: 0 },
    { x: 1.51, y: 2.0, z: 0, rx: 0, ry: -Math.PI/2, rz: 0 },
    { x: 1.51, y: 2.0, z: 1.5, rx: 0, ry: -Math.PI/2, rz: 0 },
    
    // Front dots
    { x: -1.0, y: 1.5, z: -2.26, rx: 0, ry: 0, rz: 0 },
    { x: 0, y: 1.5, z: -2.26, rx: 0, ry: 0, rz: 0 },
    { x: 1.0, y: 1.5, z: -2.26, rx: 0, ry: 0, rz: 0 },
    
    // Back dots
    { x: -1.0, y: 1.5, z: 2.26, rx: 0, ry: 0, rz: 0 },
    { x: 0, y: 1.5, z: 2.26, rx: 0, ry: 0, rz: 0 },
    { x: 1.0, y: 1.5, z: 2.26, rx: 0, ry: 0, rz: 0 },
    
    // Top dots
    { x: -1.0, y: 3.0, z: -1.0, rx: -Math.PI/2, ry: 0, rz: 0 },
    { x: -1.0, y: 3.0, z: 1.0, rx: -Math.PI/2, ry: 0, rz: 0 },
    { x: 1.0, y: 3.0, z: -1.0, rx: -Math.PI/2, ry: 0, rz: 0 },
    { x: 1.0, y: 3.0, z: 1.0, rx: -Math.PI/2, ry: 0, rz: 0 },
    { x: 0, y: 3.0, z: 0, rx: -Math.PI/2, ry: 0, rz: 0 }
  ];
  
  // Create dots at each position
  dotPositions.forEach(pos => {
    const dot = new THREE.Mesh(dotGeometry, dotMaterial);
    dot.position.set(pos.x, pos.y, pos.z);
    dot.rotation.set(pos.rx, pos.ry, pos.rz);
    truckGroup.add(dot);
  });
}

// Function to add Sweet Tooth text
function addSweetToothText(truckGroup) {
  // Black backing rectangle for text
  const textBackingGeometry = new THREE.BoxGeometry(0.05, 0.7, 2.2);
  const textBackingMaterial = new THREE.MeshStandardMaterial({ color: 0x111111 });
  
  // Left side text panel
  const leftTextBacking = new THREE.Mesh(textBackingGeometry, textBackingMaterial);
  leftTextBacking.position.set(-1.51, 1.5, 0);
  truckGroup.add(leftTextBacking);
  
  // Right side text panel
  const rightTextBacking = new THREE.Mesh(textBackingGeometry, textBackingMaterial);
  rightTextBacking.position.set(1.51, 1.5, 0);
  truckGroup.add(rightTextBacking);
  
  // White letters (simplified as blocks)
  const letterMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });
  
  // Add letters on left side
  for (let i = 0; i < 10; i++) {
    const letterGeometry = new THREE.BoxGeometry(0.06, 0.12, 0.15);
    const letter = new THREE.Mesh(letterGeometry, letterMaterial);
    letter.position.set(-1.52, 1.5, -1.0 + i * 0.22);
    truckGroup.add(letter);
  }
  
  // Add letters on right side
  for (let i = 0; i < 10; i++) {
    const letterGeometry = new THREE.BoxGeometry(0.06, 0.12, 0.15);
    const letter = new THREE.Mesh(letterGeometry, letterMaterial);
    letter.position.set(1.52, 1.5, -1.0 + i * 0.22);
    truckGroup.add(letter);
  }
}

// Function to create the clown head
function createClownHead() {
  const headGroup = new THREE.Group();
  
  // Base head shape - dark blue/purple, slightly elongated vertically
  const headGeometry = new THREE.SphereGeometry(0.8, 16, 16);
  headGeometry.scale(1, 1.2, 1); // Elongate the head slightly
  const headMaterial = new THREE.MeshStandardMaterial({ color: 0x2a2a7d });
  const head = new THREE.Mesh(headGeometry, headMaterial);
  headGroup.add(head);
  
  // Add white face area - covers the FRONT half of the face
  const faceMaskGeometry = new THREE.SphereGeometry(0.81, 16, 16, 
    Math.PI * 1.75, Math.PI * 0.5, Math.PI * 0.3, Math.PI * 0.4);
  const faceMaskMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });
  const faceMask = new THREE.Mesh(faceMaskGeometry, faceMaskMaterial);
  faceMask.rotation.y = Math.PI; // Rotate to face forward
  headGroup.add(faceMask);
  
  // Red eyes - larger and more menacing - positioned on FRONT
  const eyeGeometry = new THREE.SphereGeometry(0.15, 8, 8);
  const eyeMaterial = new THREE.MeshStandardMaterial({ 
    color: 0xff0000,
    emissive: 0xff0000,
    emissiveIntensity: 0.8
  });
  
  // Left eye - positioned on front
  const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
  leftEye.position.set(-0.25, 0.15, -0.65);
  headGroup.add(leftEye);
  
  // Right eye - positioned on front
  const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
  rightEye.position.set(0.25, 0.15, -0.65);
  headGroup.add(rightEye);
  
  // Create menacing grin on FRONT
  const mouthGeometry = new THREE.BoxGeometry(0.5, 0.2, 0.3);
  const mouthMaterial = new THREE.MeshStandardMaterial({ 
    color: 0xff0000
  });
  const mouth = new THREE.Mesh(mouthGeometry, mouthMaterial);
  mouth.position.set(0, -0.3, 0.65);
  headGroup.add(mouth);
  
  // Add teeth to the mouth on FRONT
  const teethGeometry = new THREE.BoxGeometry(0.45, 0.1, 0.31);
  const teethMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });
  const teeth = new THREE.Mesh(teethGeometry, teethMaterial);
  teeth.position.set(0, -0.28, 0.65);
  headGroup.add(teeth);
  
  // Add individual teeth for more menacing look - on FRONT
  const toothGeometry = new THREE.BoxGeometry(0.08, 0.12, 0.1);
  
  // Create bottom row of teeth - pointier
  const bottomToothGeometry = new THREE.ConeGeometry(0.04, 0.1, 4);
  // Position teeth across the mouth
  for (let i = -0.15; i <= 0.15; i += 0.08) {
    const tooth = new THREE.Mesh(bottomToothGeometry, teethMaterial);
    tooth.position.set(i, -0.37, 0.7);
    tooth.rotation.x = Math.PI; // Point downward
    headGroup.add(tooth);
  }
  
  // Add the flames
  createFlames(headGroup);
  
  return headGroup;
}

// Function to create the flames for the clown head
function createFlames(headGroup) {
  // Main flame color is yellow-orange
  const flameColors = [
    0xffcc00, // Core yellow
    0xff9500, // Middle orange
    0xff5500  // Outer orange-red
  ];
  
  // Create main large flame envelope
  const mainFlameGeometry = new THREE.ConeGeometry(1.0, 2.2, 20);
  const mainFlameMaterial = new THREE.MeshStandardMaterial({
    color: flameColors[2],
    emissive: flameColors[2],
    emissiveIntensity: 0.5,
    transparent: true,
    opacity: 0.9
  });
  
  const mainFlame = new THREE.Mesh(mainFlameGeometry, mainFlameMaterial);
  mainFlame.position.set(0, 1.0, 0);
  mainFlame.rotation.x = Math.PI;
  headGroup.add(mainFlame);
  
  // Middle flame layer
  const middleFlameGeometry = new THREE.ConeGeometry(0.8, 2.5, 16);
  const middleFlameMaterial = new THREE.MeshStandardMaterial({
    color: flameColors[1],
    emissive: flameColors[1],
    emissiveIntensity: 0.7,
    transparent: true,
    opacity: 0.9
  });
  
  const middleFlame = new THREE.Mesh(middleFlameGeometry, middleFlameMaterial);
  middleFlame.position.set(0, 1.1, 0);
  middleFlame.rotation.x = Math.PI;
  headGroup.add(middleFlame);
  
  // Inner brightest flame
  const innerFlameGeometry = new THREE.ConeGeometry(0.6, 2.8, 12);
  const innerFlameMaterial = new THREE.MeshStandardMaterial({
    color: flameColors[0],
    emissive: flameColors[0],
    emissiveIntensity: 0.9,
    transparent: true,
    opacity: 0.8
  });
  
  const innerFlame = new THREE.Mesh(innerFlameGeometry, innerFlameMaterial);
  innerFlame.position.set(0, 1.2, 0);
  innerFlame.rotation.x = Math.PI;
  headGroup.add(innerFlame);
  
  // Create flame wisps for more texture and randomness
  const createFlameWisps = () => {
    // Wisp positions around the main flame
    const wispPositions = [
      { x: 0.4, y: 0.9, z: 0.3, scale: 0.7, color: flameColors[1] },
      { x: -0.4, y: 1.1, z: -0.2, scale: 0.8, color: flameColors[1] },
      { x: 0.2, y: 1.3, z: -0.4, scale: 0.6, color: flameColors[0] },
      { x: -0.3, y: 1.0, z: 0.3, scale: 0.7, color: flameColors[2] },
      { x: 0, y: 1.5, z: 0, scale: 0.9, color: flameColors[0] }
    ];
    
    wispPositions.forEach(pos => {
      // Use custom flame geometry for better wisp shape
      const points = [];
      const height = 2.0 * pos.scale;
      const radius = 0.5 * pos.scale;
      
      for (let i = 0; i < 6; i++) {
        const t = i / 5;
        // Create a wavy flame shape
        const waist = 1.0 - Math.sin(t * Math.PI) * 0.3;
        points.push(new THREE.Vector2(radius * waist * (1-t*0.8), height * t));
      }
      
      const wispGeometry = new THREE.LatheGeometry(points, 8);
      const wispMaterial = new THREE.MeshStandardMaterial({
        color: pos.color,
        emissive: pos.color,
        emissiveIntensity: 0.8,
        transparent: true,
        opacity: 0.8
      });
      
      const wisp = new THREE.Mesh(wispGeometry, wispMaterial);
      wisp.position.set(pos.x, pos.y, pos.z);
      wisp.rotation.x = Math.PI;
      // Add some random rotation
      wisp.rotation.y = Math.random() * Math.PI;
      wisp.rotation.z = Math.random() * Math.PI * 0.1;
      
      headGroup.add(wisp);
    });
  };
  
  createFlameWisps();
}