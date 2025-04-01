import * as THREE from 'three';

/**
 * AI-controlled Semi-Trump boss enemy
 */
export class SemiTrump {
  /**
   * Create a new Semi-Trump boss
   * @param {THREE.Scene} scene The game scene
   * @param {number} difficulty Difficulty level (1.0 = normal)
   */
  constructor(scene, difficulty = 1) {
    this.scene = scene;
    this.difficulty = difficulty;

    // Stats scaled by difficulty
    this.maxHealth = 100 * difficulty;
    this.health = this.maxHealth;
    this.damage = 10 * (1 + (difficulty * 0.2));
    this.speed = 0.2 * (1 + (difficulty * 0.3));
    this.turnRate = 0.01 * (1 + (difficulty * 0.2));

    // AI state machine
    this.currentState = 'spawning';
    this.previousState = '';
    this.stateTimer = 0;
    this.stateTimeout = 3000; // 3 seconds for spawning state

    // Target tracking
    this.target = null;
    this.targetTimer = 0;
    this.targetTimeout = 5000; // 5 seconds before finding a new target

    // Attack cooldowns
    this.lastAttackTime = 0;
    this.attackCooldown = 3000 / difficulty; // milliseconds

    // Movement
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.targetPosition = new THREE.Vector3(0, 0, 0);

    // Weapon systems
    this.currentWeapon = 'ram'; // ram, freezeMissile, flamethrower, napalmRain
    this.weaponCooldowns = {
      ram: 2000,
      freezeMissile: 2500, // Reduced from 5000 to 2500 for more frequent missile firing
      flamethrower: 3000,
      napalmRain: 5000  // Reduced from 8000 to 5000 for more frequent use
    };
    this.lastWeaponUse = {
      ram: 0,
      freezeMissile: 0,
      flamethrower: 0,
      napalmRain: 0
    };
    
    // Testing flag to ensure napalm rain is used
    this.nextAttackForceNapalm = true;
    this.napalmTestTimer = 0;
    
    // Regular napalm rain timer - fires every 10 seconds
    this.napalmRainTimer = 0;
    this.napalmRainInterval = 10000; // 10 seconds

    // Missile system
    this.activeProjectiles = [];
    this.missileSpeed = 1.0; // Balanced missile speed
    this.missileDamage = 15 * difficulty;
    this.missileRange = 50; // Missile detection range - matches player projectiles range
    this.missileSpawnPoint = new THREE.Vector3(0, 3, 11); // Position at the back of the trailer
    
    // Napalm rain system
    this.napalmDamage = 20 * difficulty;
    this.napalmRange = 80; // Longer range than missile attack
    this.napalmRadius = 15; // Area of effect for each napalm explosion
    this.napalmCount = 5; // Number of napalm projectiles to fire at once

    // Create the mesh
    this.mesh = this.createMesh();

    // Mesh and physics
    this.boundingBox = new THREE.Box3().setFromObject(this.mesh);
  }

  /**
   * Create the Semi-Trump mesh
   * @returns {THREE.Group} The mesh group
   */
  createMesh() {
    const group = new THREE.Group();

    // Create the semi-truck mesh
    const truckGroup = new THREE.Group();

    // Create cabin - black box truck cabin with proper semi-truck shape
    const cabinGeometry = new THREE.BoxGeometry(4, 3.5, 5);
    const cabinMaterial = new THREE.MeshStandardMaterial({ color: 0x111111 });
    const cabin = new THREE.Mesh(cabinGeometry, cabinMaterial);
    cabin.position.set(0, 2.5, -5);
    cabin.castShadow = true;
    cabin.receiveShadow = true;
    truckGroup.add(cabin);
    
    // Add cabin roof/extension (sleeper portion)
    const cabinRoofGeometry = new THREE.BoxGeometry(4, 1, 2);
    const cabinRoofMaterial = new THREE.MeshStandardMaterial({ color: 0x111111 });
    const cabinRoof = new THREE.Mesh(cabinRoofGeometry, cabinRoofMaterial);
    cabinRoof.position.set(0, 4.5, -4);
    cabinRoof.castShadow = true;
    cabinRoof.receiveShadow = true;
    truckGroup.add(cabinRoof);
    
    // Create hood section for the semi-truck
    const hoodGeometry = new THREE.BoxGeometry(3.8, 1.8, 3);
    const hoodMaterial = new THREE.MeshStandardMaterial({ color: 0x111111 });
    const hood = new THREE.Mesh(hoodGeometry, hoodMaterial);
    hood.position.set(0, 1.6, -8.5);
    hood.castShadow = true;
    hood.receiveShadow = true;
    truckGroup.add(hood);
    
    // Create windshield
    const windshieldGeometry = new THREE.PlaneGeometry(3.5, 2.5);
    const windshieldMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x333333,
      transparent: true,
      opacity: 0.7
    });
    const windshield = new THREE.Mesh(windshieldGeometry, windshieldMaterial);
    windshield.position.set(0, 3, -7);
    windshield.rotation.x = Math.PI * 0.2;
    truckGroup.add(windshield);

    // Create trailer/flatbed - black flatbed
    const trailerGeometry = new THREE.BoxGeometry(5, 1, 14);
    const trailerMaterial = new THREE.MeshStandardMaterial({ color: 0x222222 });
    const trailer = new THREE.Mesh(trailerGeometry, trailerMaterial);
    trailer.position.set(0, 1, 4);
    trailer.castShadow = true;
    trailer.receiveShadow = true;
    truckGroup.add(trailer);

    // Add low walls to the flatbed trailer
    const sideWallGeometry = new THREE.BoxGeometry(0.2, 1, 14);
    const sideWallMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
    
    // Left wall
    const leftWall = new THREE.Mesh(sideWallGeometry, sideWallMaterial);
    leftWall.position.set(-2.4, 1.5, 4);
    truckGroup.add(leftWall);
    
    // Right wall
    const rightWall = new THREE.Mesh(sideWallGeometry, sideWallMaterial);
    rightWall.position.set(2.4, 1.5, 4);
    truckGroup.add(rightWall);
    
    // Add missile stand/turret base
    const turretBaseGeometry = new THREE.CylinderGeometry(1, 1.2, 0.5, 8);
    const turretBaseMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
    const turretBase = new THREE.Mesh(turretBaseGeometry, turretBaseMaterial);
    turretBase.position.set(0, 1.75, 4);
    turretBase.castShadow = true;
    turretBase.receiveShadow = true;
    truckGroup.add(turretBase);
    
    // Add missile mount/pivot
    const mountGeometry = new THREE.BoxGeometry(1.2, 0.8, 1.2);
    const mountMaterial = new THREE.MeshStandardMaterial({ color: 0x555555 });
    const missileMount = new THREE.Mesh(mountGeometry, mountMaterial);
    missileMount.position.set(0, 2.25, 4);
    missileMount.castShadow = true;
    missileMount.receiveShadow = true;
    truckGroup.add(missileMount);
    
    // Add support arms for the missile
    const armGeometry = new THREE.BoxGeometry(0.2, 1.5, 0.2);
    const armMaterial = new THREE.MeshStandardMaterial({ color: 0x555555 });
    
    // Left support arm
    const leftArm = new THREE.Mesh(armGeometry, armMaterial);
    leftArm.position.set(-0.8, 3, 4);
    leftArm.castShadow = true;
    leftArm.receiveShadow = true;
    truckGroup.add(leftArm);
    
    // Right support arm
    const rightArm = new THREE.Mesh(armGeometry, armMaterial);
    rightArm.position.set(0.8, 3, 4);
    rightArm.castShadow = true;
    rightArm.receiveShadow = true;
    truckGroup.add(rightArm);
    
    // Add control panel for the missile launcher
    const panelGeometry = new THREE.BoxGeometry(1.5, 0.8, 0.3);
    const panelMaterial = new THREE.MeshStandardMaterial({ color: 0x222222 });
    const controlPanel = new THREE.Mesh(panelGeometry, panelMaterial);
    controlPanel.position.set(0, 2.25, 5.2);
    controlPanel.castShadow = true;
    controlPanel.receiveShadow = true;
    truckGroup.add(controlPanel);
    
    // Add panel buttons/screens
    const buttonGeometry = new THREE.BoxGeometry(0.2, 0.2, 0.1);
    const buttonMaterials = [
      new THREE.MeshStandardMaterial({ color: 0xff0000 }),
      new THREE.MeshStandardMaterial({ color: 0x00ff00 }),
      new THREE.MeshStandardMaterial({ color: 0x0000ff })
    ];
    
    // Add a few buttons
    for (let i = 0; i < 3; i++) {
      const button = new THREE.Mesh(buttonGeometry, buttonMaterials[i]);
      button.position.set(-0.5 + i * 0.5, 2.4, 5.35);
      controlPanel.add(button);
    }

    // Create wheels
    const wheelGeometry = new THREE.CylinderGeometry(1, 1, 0.8, 16);
    const wheelMaterial = new THREE.MeshStandardMaterial({ color: 0x111111 });
    
    // Add wheel rims
    const rimGeometry = new THREE.CylinderGeometry(0.5, 0.5, 0.82, 8);
    const rimMaterial = new THREE.MeshStandardMaterial({ color: 0xaaaaaa });
    
    // Front wheels (steering axle)
    const frontWheelPositions = [
      { x: -2, y: 1, z: -8 },
      { x: 2, y: 1, z: -8 }
    ];
    
    frontWheelPositions.forEach(pos => {
      const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
      wheel.position.set(pos.x, pos.y, pos.z);
      wheel.rotation.z = Math.PI / 2;
      wheel.castShadow = true;
      wheel.receiveShadow = true;
      
      // Add wheel rim
      const rim = new THREE.Mesh(rimGeometry, rimMaterial);
      rim.rotation.z = Math.PI / 2;
      wheel.add(rim);
      
      truckGroup.add(wheel);
    });
    
    // Middle wheels (drive axles - 2 sets of double wheels)
    const driveAxlePositions = [
      // First drive axle
      { x: -2.3, y: 1, z: -3 },
      { x: 2.3, y: 1, z: -3 },
      { x: -2.3, y: 1, z: -2 },
      { x: 2.3, y: 1, z: -2 },
      // Second drive axle
      { x: -2.3, y: 1, z: 0 },
      { x: 2.3, y: 1, z: 0 },
      { x: -2.3, y: 1, z: 1 },
      { x: 2.3, y: 1, z: 1 }
    ];
    
    driveAxlePositions.forEach(pos => {
      const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
      wheel.position.set(pos.x, pos.y, pos.z);
      wheel.rotation.z = Math.PI / 2;
      wheel.scale.set(0.8, 0.8, 0.8); // Slightly smaller wheels for the double-wheel setup
      wheel.castShadow = true;
      wheel.receiveShadow = true;
      
      // Add wheel rim
      const rim = new THREE.Mesh(rimGeometry, rimMaterial);
      rim.rotation.z = Math.PI / 2;
      wheel.add(rim);
      
      truckGroup.add(wheel);
    });
    
    // Trailer wheels (two sets of double wheels)
    const trailerWheelPositions = [
      // First trailer axle
      { x: -2.3, y: 1, z: 6 },
      { x: 2.3, y: 1, z: 6 },
      { x: -2.3, y: 1, z: 7 },
      { x: 2.3, y: 1, z: 7 },
      // Second trailer axle
      { x: -2.3, y: 1, z: 9 },
      { x: 2.3, y: 1, z: 9 },
      { x: -2.3, y: 1, z: 10 },
      { x: 2.3, y: 1, z: 10 }
    ];
    
    trailerWheelPositions.forEach(pos => {
      const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
      wheel.position.set(pos.x, pos.y, pos.z);
      wheel.rotation.z = Math.PI / 2;
      wheel.scale.set(0.8, 0.8, 0.8); // Slightly smaller wheels for the double-wheel setup
      wheel.castShadow = true;
      wheel.receiveShadow = true;
      
      // Add wheel rim
      const rim = new THREE.Mesh(rimGeometry, rimMaterial);
      rim.rotation.z = Math.PI / 2;
      wheel.add(rim);
      
      truckGroup.add(wheel);
    });

    // Create Trump character for driver's seat
    const trumpHead = new THREE.Group();

    // Head - make more square/blocky to match the pixelated style
    const headGeometry = new THREE.BoxGeometry(1.2, 1.2, 1.2);
    const headMaterial = new THREE.MeshStandardMaterial({ color: 0xFFDAB9 });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    trumpHead.add(head);

    // Hair - blonde/yellow hair
    const hairGeometry = new THREE.BoxGeometry(1.3, 0.4, 1.3);
    const hairMaterial = new THREE.MeshStandardMaterial({ color: 0xFFFF99 });
    const hair = new THREE.Mesh(hairGeometry, hairMaterial);
    hair.position.set(0, 0.6, 0);
    trumpHead.add(hair);

    // Add MAGA hat (red cap)
    const hatGeometry = new THREE.BoxGeometry(1.2, 0.4, 1);
    const hatMaterial = new THREE.MeshStandardMaterial({ color: 0xFF0000 });
    const hat = new THREE.Mesh(hatGeometry, hatMaterial);
    hat.position.set(0, 0.8, 0);
    trumpHead.add(hat);
    
    // Add "MAGA" text (white front part of hat)
    const magaTextGeometry = new THREE.BoxGeometry(0.8, 0.3, 0.1);
    const magaTextMaterial = new THREE.MeshStandardMaterial({ color: 0xFFFFFF });
    const magaText = new THREE.Mesh(magaTextGeometry, magaTextMaterial);
    magaText.position.set(0, 0.8, 0.55);
    trumpHead.add(magaText);
    
    // Add facial features - frowning face
    const faceFeatures = new THREE.Group();
    
    // Eyes
    const eyeGeometry = new THREE.BoxGeometry(0.2, 0.15, 0.1);
    const eyeMaterial = new THREE.MeshStandardMaterial({ color: 0x6699CC });
    
    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(-0.3, 0.1, 0.6);
    faceFeatures.add(leftEye);
    
    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    rightEye.position.set(0.3, 0.1, 0.6);
    faceFeatures.add(rightEye);
    
    // Mouth (frown)
    const mouthGeometry = new THREE.BoxGeometry(0.5, 0.1, 0.1);
    const mouthMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 });
    const mouth = new THREE.Mesh(mouthGeometry, mouthMaterial);
    mouth.position.set(0, -0.3, 0.6);
    faceFeatures.add(mouth);
    
    trumpHead.add(faceFeatures);
    
    // Position Trump in driver's seat
    trumpHead.position.set(-2.2, 3, -5);
    trumpHead.rotation.y = Math.PI * 0.5; // Looking out the driver's window
    truckGroup.add(trumpHead);
    
    // Create Trump body (for hanging out the window)
    const trumpBodyGeometry = new THREE.BoxGeometry(0.8, 1, 0.6);
    const trumpBodyMaterial = new THREE.MeshStandardMaterial({ color: 0x000066 }); // Blue suit
    const trumpBody = new THREE.Mesh(trumpBodyGeometry, trumpBodyMaterial);
    trumpBody.position.set(-2.3, 2.1, -5);
    trumpBody.rotation.y = Math.PI * 0.5;
    truckGroup.add(trumpBody);
    
    // Add Trump arm hanging out
    const trumpArmGeometry = new THREE.BoxGeometry(0.3, 0.8, 0.3);
    const trumpArmMaterial = new THREE.MeshStandardMaterial({ color: 0xFFDAB9 });
    const trumpArm = new THREE.Mesh(trumpArmGeometry, trumpArmMaterial);
    trumpArm.position.set(-2.5, 2.5, -5);
    trumpArm.rotation.y = Math.PI * 0.5;
    trumpArm.rotation.z = Math.PI * 0.15;
    truckGroup.add(trumpArm);
    
    // Create Elon Musk character operating the missile
    const muskGroup = new THREE.Group();
    
    // Head
    const muskHeadGeometry = new THREE.BoxGeometry(1, 1, 1);
    const muskHeadMaterial = new THREE.MeshStandardMaterial({ color: 0xE0C8A0 });
    const muskHead = new THREE.Mesh(muskHeadGeometry, muskHeadMaterial);
    muskGroup.add(muskHead);
    
    // Short dark hair
    const muskHairGeometry = new THREE.BoxGeometry(1.1, 0.2, 1.1);
    const muskHairMaterial = new THREE.MeshStandardMaterial({ color: 0x553311 });
    const muskHair = new THREE.Mesh(muskHairGeometry, muskHairMaterial);
    muskHair.position.set(0, 0.5, 0);
    muskGroup.add(muskHair);
    
    // Body (green shirt)
    const muskBodyGeometry = new THREE.BoxGeometry(1, 1.5, 0.5);
    const muskBodyMaterial = new THREE.MeshStandardMaterial({ color: 0x006633 });
    const muskBody = new THREE.Mesh(muskBodyGeometry, muskBodyMaterial);
    muskBody.position.set(0, -1, 0);
    muskGroup.add(muskBody);
    
    // Legs (blue jeans)
    const muskLegsGeometry = new THREE.BoxGeometry(0.9, 1.5, 0.5);
    const muskLegsMaterial = new THREE.MeshStandardMaterial({ color: 0x0044aa });
    const muskLegs = new THREE.Mesh(muskLegsGeometry, muskLegsMaterial);
    muskLegs.position.set(0, -2.25, 0);
    muskGroup.add(muskLegs);
    
    // Arms
    const muskArmGeometry = new THREE.BoxGeometry(0.3, 1, 0.3);
    const muskArmMaterial = new THREE.MeshStandardMaterial({ color: 0x006633 });
    
    // Left arm (bent to hold rocket)
    const muskLeftArm = new THREE.Mesh(muskArmGeometry, muskArmMaterial);
    muskLeftArm.position.set(-0.8, -0.8, 0.4);
    muskLeftArm.rotation.z = Math.PI * 0.5;
    muskGroup.add(muskLeftArm);
    
    // Right arm (bent to hold rocket)
    const muskRightArm = new THREE.Mesh(muskArmGeometry, muskArmMaterial);
    muskRightArm.position.set(0.8, -0.8, 0.4);
    muskRightArm.rotation.z = -Math.PI * 0.5;
    muskGroup.add(muskRightArm);
    
    // Face features
    const muskFaceGeometry = new THREE.BoxGeometry(0.2, 0.15, 0.1);
    const muskFaceMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 });
    
    const muskLeftEye = new THREE.Mesh(muskFaceGeometry, muskFaceMaterial);
    muskLeftEye.position.set(-0.25, 0.1, 0.5);
    muskGroup.add(muskLeftEye);
    
    const muskRightEye = new THREE.Mesh(muskFaceGeometry, muskFaceMaterial);
    muskRightEye.position.set(0.25, 0.1, 0.5);
    muskGroup.add(muskRightEye);
    
    const muskMouth = new THREE.Mesh(muskFaceGeometry, muskFaceMaterial);
    muskMouth.position.set(0, -0.2, 0.5);
    muskMouth.scale.set(1.5, 1, 1);
    muskGroup.add(muskMouth);
    
    // Position Elon on the trailer operating the rocket
    muskGroup.position.set(0, 5, 0);
    // Rotate slightly to appear to be operating the missile
    truckGroup.add(muskGroup);

    // Add headlights
    const headlightGeometry = new THREE.BoxGeometry(0.8, 0.5, 0.2);
    const headlightMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffcc,
      emissive: 0xffffcc,
      emissiveIntensity: 0.5
    });

    const leftHeadlight = new THREE.Mesh(headlightGeometry, headlightMaterial);
    leftHeadlight.position.set(-1.5, 1.5, -10);
    truckGroup.add(leftHeadlight);

    const rightHeadlight = new THREE.Mesh(headlightGeometry, headlightMaterial);
    rightHeadlight.position.set(1.5, 1.5, -10);
    truckGroup.add(rightHeadlight);

    // Add taillights
    const taillightGeometry = new THREE.BoxGeometry(0.6, 0.3, 0.1);
    const taillightMaterial = new THREE.MeshStandardMaterial({
      color: 0xff0000,
      emissive: 0xff0000,
      emissiveIntensity: 0.5
    });

    const leftTaillight = new THREE.Mesh(taillightGeometry, taillightMaterial);
    leftTaillight.position.set(-2, 1, 11);
    truckGroup.add(leftTaillight);

    const rightTaillight = new THREE.Mesh(taillightGeometry, taillightMaterial);
    rightTaillight.position.set(2, 1, 11);
    truckGroup.add(rightTaillight);

    // Create SPACE X rocket
    const rocketGroup = new THREE.Group();
    
    // Rocket body (cylindrical, white with SPACE X text)
    const rocketBodyGeometry = new THREE.CylinderGeometry(0.6, 0.6, 6, 16);
    const rocketBodyMaterial = new THREE.MeshStandardMaterial({ color: 0xeeeeee });
    const rocketBody = new THREE.Mesh(rocketBodyGeometry, rocketBodyMaterial);
    rocketBody.position.set(0, 0, 0);
    rocketGroup.add(rocketBody);
    
    // Rocket nose cone (red tip)
    const noseConeGeometry = new THREE.ConeGeometry(0.6, 1.5, 16);
    const noseConeMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 });
    const noseCone = new THREE.Mesh(noseConeGeometry, noseConeMaterial);
    noseCone.position.set(0, 3.75, 0);
    rocketGroup.add(noseCone);
    
    // Black "SPACE" text
    const spaceTextGeometry = new THREE.BoxGeometry(1.2, 0.5, 0.1);
    const spaceTextMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 });
    const spaceText = new THREE.Mesh(spaceTextGeometry, spaceTextMaterial);
    spaceText.position.set(0, 0, 0.7);
    rocketGroup.add(spaceText);
    
    // Black "X" text
    const xTextGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.1);
    const xTextMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 });
    const xText = new THREE.Mesh(xTextGeometry, xTextMaterial);
    xText.position.set(0, -1, 0.7);
    rocketGroup.add(xText);
    
    // Position and rotate the rocket on the turret mount
    rocketGroup.position.set(0, 3.75, 4);
    // Rotate to show horizontally and slightly elevated for firing
    rocketGroup.rotation.x = Math.PI / 2; // Slight upward angle
    truckGroup.add(rocketGroup);

    // Add the truck to the main group
    group.add(truckGroup);

    // Add health indicator
    this.healthBar = this.createHealthBar();
    group.add(this.healthBar);

    return group;
  }

  /**
   * Create the health bar mesh
   * @returns {THREE.Group} The health bar mesh
   */
  createHealthBar() {
    const group = new THREE.Group();

    // Create background bar
    const bgGeometry = new THREE.PlaneGeometry(6, 0.6);
    const bgMaterial = new THREE.MeshBasicMaterial({ color: 0x333333 });
    const background = new THREE.Mesh(bgGeometry, bgMaterial);
    group.add(background);

    // Create foreground health bar
    const fgGeometry = new THREE.PlaneGeometry(6, 0.6);
    const fgMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    this.healthBarFill = new THREE.Mesh(fgGeometry, fgMaterial);
    this.healthBarFill.position.z = 0.01; // Slightly in front of background
    this.healthBarFill.scale.x = 1.0; // Full health to start
    group.add(this.healthBarFill);

    // Position above the boss
    group.position.set(0, 10, 0);
    group.rotation.x = -Math.PI / 6; // Tilt towards camera

    // Billboard behavior (face camera) will be handled in update

    return group;
  }

  /**
   * Update the health bar to reflect current health
   */
  updateHealthBar() {
    const healthPercent = this.health / this.maxHealth;
    this.healthBarFill.scale.x = Math.max(0.01, healthPercent);
    this.healthBarFill.position.x = -3 * (1 - healthPercent) / 2;

    // Update color based on health
    if (healthPercent > 0.6) {
      this.healthBarFill.material.color.setHex(0x00ff00); // Green
    } else if (healthPercent > 0.3) {
      this.healthBarFill.material.color.setHex(0xffff00); // Yellow
    } else {
      this.healthBarFill.material.color.setHex(0xff0000); // Red
    }
  }

  /**
   * Update the boss AI and position
   * @param {Array<Object>} players Array of player objects
   * @param {number} delta Time since last update in seconds
   * @param {number} time Current time in milliseconds
   */
  update(players, delta, time) {
    // Force Y position to keep the boss on the ground
    this.mesh.position.y = 0.2;
    
    // Handle perimeter roaming for movement
    this.handlePerimeterRoaming(delta);
    
    // Update napalm rain timer (fires every 10 seconds regardless of player position)
    this.napalmRainTimer += delta * 1000;
    if (this.napalmRainTimer >= this.napalmRainInterval) {
      const now = Date.now();
      if (now - this.lastWeaponUse.napalmRain > this.weaponCooldowns.napalmRain) {
        console.log("🔥 Regular napalm rain attack firing (10-second interval)");
        this.useNapalmRain();
        this.lastWeaponUse.napalmRain = now;
      }
      this.napalmRainTimer = 0;
    }
    
    // Force periodic napalm rain test (only for testing/debugging)
    this.napalmTestTimer += delta * 1000;
    if (this.napalmTestTimer > 15000) { // Every 15 seconds
      this.napalmTestTimer = 0;
      this.nextAttackForceNapalm = true;
      console.log("🔥 Napalm rain test scheduled for next attack opportunity");
    }
    
    // Check for nearby players to attack without changing direction
    if (players) {
      // If players is a Map (like in gameState.players), convert to array
      const playersArray = players instanceof Map ? Array.from(players.values()) : players;
      
      if (playersArray.length > 0) {
        // Find closest player in missile range
        let closestPlayer = null;
        let closestDistance = Infinity;
        
        for (const player of playersArray) {
          if (!player.vehicle || !player.vehicle.mesh) continue;
          
          const distance = this.mesh.position.distanceTo(player.vehicle.mesh.position);
          
          if (distance < this.missileRange && distance < closestDistance) {
            closestDistance = distance;
            closestPlayer = player;
          }
        }
        
        // If we found a target in range, fire a missile if cooldown allows
        if (closestPlayer) {
          this.target = closestPlayer;
          
          // Try to use napalm rain for testing if flag is set (only for testing)
          const now = Date.now();
          if (this.nextAttackForceNapalm && now - this.lastWeaponUse.napalmRain > this.weaponCooldowns.napalmRain) {
            console.log("🔥 Forcing napalm rain attack for testing");
            this.useNapalmRain();
            this.lastWeaponUse.napalmRain = now;
            this.nextAttackForceNapalm = false;
          }
          // Check if we can fire a missile - this is independent of napalm rain
          else if (now - this.lastWeaponUse.freezeMissile > this.weaponCooldowns.freezeMissile) {
            this.fireMissile(closestPlayer);
            this.lastWeaponUse.freezeMissile = now;
          }
        }
      }
    }
    
    // Update active projectiles
    this.updateProjectiles(delta);
    
    // Update health bar
    this.updateHealthBar();
    
    // Make health bar face camera
    const camera = this.scene.getObjectByProperty('type', 'PerspectiveCamera') ||
      this.scene.getObjectByProperty('type', 'OrthographicCamera');
    if (camera) {
      const cameraPosition = new THREE.Vector3();
      camera.getWorldPosition(cameraPosition);
      this.healthBar.lookAt(cameraPosition);
    }
    
    // Check for collisions with player vehicles
    this.checkPlayerCollisions(players);
    
    // Update bounding box
    this.boundingBox.setFromObject(this.mesh);
  }

  /**
   * Check for collisions with player vehicles
   * @param {Array<Object>} players Array of player objects
   */
  checkPlayerCollisions(players) {
    if (!players) return;
    
    // If players is a Map (like in gameState.players), convert to array
    const playersArray = players instanceof Map ? Array.from(players.values()) : players;
    
    for (const player of playersArray) {
      if (!player.vehicle) continue;
      
      const collision = this.checkPlayerCollision(player.vehicle);
      if (collision) {
        this.resolvePlayerCollision(player.vehicle, collision);
      }
    }
  }

  /**
   * Check for collision with a player vehicle
   * @param {Object} vehicle The player vehicle to check collision with
   * @returns {Object|null} The collision object if collision detected, null otherwise
   */
  checkPlayerCollision(vehicle) {
    // Check if bounding boxes intersect
    if (this.boundingBox.intersectsBox(vehicle.collisionBox)) {
      const bossPos = this.mesh.position;
      const vehiclePos = vehicle.mesh.position;

      // Calculate collision normal
      const normal = new THREE.Vector3()
        .subVectors(vehiclePos, bossPos)
        .normalize();

      // Calculate penetration depth with collision radius
      const bossSize = new THREE.Vector3();
      const vehicleSize = new THREE.Vector3();
      this.boundingBox.getSize(bossSize);
      vehicle.collisionBox.getSize(vehicleSize);

      // Use collision radius (30% of sizes, matching vehicle collision)
      const bossRadius = Math.max(bossSize.x, bossSize.z) * 0.3;
      const vehicleRadius = Math.max(vehicleSize.x, vehicleSize.z) * 0.3;
      const distance = bossPos.distanceTo(vehiclePos);
      const penetration = (bossRadius + vehicleRadius) - distance;

      // Minimum penetration threshold
      if (penetration > 0.2) {
        return {
          normal,
          penetration,
          vehicle
        };
      }
    }
    return null;
  }

  /**
   * Resolve collision with a player vehicle
   * @param {Object} vehicle The player vehicle involved in the collision
   * @param {Object} collision The collision object
   */
  resolvePlayerCollision(vehicle, collision) {
    // Boss should be much heavier than vehicles
    const bossMass = 4; // Much heavier than regular vehicles
    const vehicleMass = 1 + (vehicle.armor * 0.2);
    const totalMass = bossMass + vehicleMass;
    const bossRatio = bossMass / totalMass;
    const vehicleRatio = vehicleMass / totalMass;

    // Store original Y positions
    const vehicleOriginalY = vehicle.mesh.position.y;
    const bossOriginalY = this.mesh.position.y;

    // Separation - boss should push vehicles more than it gets pushed
    const pushBack = collision.normal.clone().multiplyScalar(collision.penetration * 0.3);
    
    // Apply pushback on X and Z axes only
    vehicle.mesh.position.x += pushBack.x * bossRatio;
    vehicle.mesh.position.z += pushBack.z * bossRatio;
    
    this.mesh.position.x -= pushBack.x * vehicleRatio * 0.2; // Boss barely moves
    this.mesh.position.z -= pushBack.z * vehicleRatio * 0.2;
    
    // Restore original Y positions
    vehicle.mesh.position.y = vehicleOriginalY;
    this.mesh.position.y = bossOriginalY;

    // Calculate relative velocity (if boss has velocity)
    if (this.velocity) {
      const relativeVelocity = vehicle.velocity.clone().sub(this.velocity);
      const velocityAlongNormal = relativeVelocity.dot(collision.normal);

      // Only resolve if objects are moving toward each other
      if (velocityAlongNormal < 0) {
        // Low bounce coefficient
        const restitution = 0.05;

        // Calculate impulse scalar
        const impulseScalar = -(1 + restitution) * velocityAlongNormal;

        // Reduced impulse effect for gameplay
        const impulse = collision.normal.clone().multiplyScalar(impulseScalar * 0.5);

        // Apply velocity changes - vehicles get pushed hard, boss barely affected
        vehicle.velocity.x += impulse.x * bossRatio;
        vehicle.velocity.z += impulse.z * bossRatio;
        
        if (this.velocity) {
          this.velocity.x -= impulse.x * vehicleRatio * 0.1;
          this.velocity.z -= impulse.z * vehicleRatio * 0.1;
        }
        
        // Ensure Y velocities remain zero
        vehicle.velocity.y = 0;
        if (this.velocity) this.velocity.y = 0;

        // Strong friction for vehicle during collision
        vehicle.velocity.x *= 0.6;
        vehicle.velocity.z *= 0.6;
      }
    }

    // Apply damage to vehicle on collision
    const now = Date.now();
    const cooldown = 1000; // 1 second between collision damage
    
    if (!vehicle.lastBossCollisionDamage || now - vehicle.lastBossCollisionDamage > cooldown) {
      // Calculate damage based on boss's damage stat
      // Increased base damage multiplier from 1.0 to 2.0 for normal state, and from 1.5 to 3.0 for enraged state
      const damage = this.damage * (this.currentState === 'enraged' ? 3.0 : 2.0);
      vehicle.takeDamage(damage);
      
      // Update collision damage timestamp
      vehicle.lastBossCollisionDamage = now;
    }
  }

  /**
   * Handle perimeter roaming behavior
   * @param {number} delta Time since last update in seconds
   */
  handlePerimeterRoaming(delta) {
    // Initialize waypoints if not defined
    if (!this.perimeterWaypoints) {
      const mapWidth = 160;
      const mapHeight = 200; // Make height larger than width for rectangular path
      const margin = 10;
      
      // Define a rectangular path around the map perimeter, shifted toward the Washington Monument (south side)
      const northMargin = 30; // Larger margin on north side (away from monument)
      const southMargin = 5;  // Smaller margin on south side (closer to monument)
      
      this.perimeterWaypoints = [
        new THREE.Vector3(-mapWidth/2 + margin, 0.2, -mapHeight/2 + northMargin),  // Top left (further from monument)
        new THREE.Vector3(mapWidth/2 - margin, 0.2, -mapHeight/2 + northMargin),   // Top right (further from monument)
        new THREE.Vector3(mapWidth/2 - margin, 0.2, mapHeight/2 - southMargin),    // Bottom right (closer to monument)
        new THREE.Vector3(-mapWidth/2 + margin, 0.2, mapHeight/2 - southMargin)    // Bottom left (closer to monument)
      ];
      
      // Start at a random waypoint
      this.currentWaypointIndex = Math.floor(Math.random() * this.perimeterWaypoints.length);
      this.nextWaypoint = this.perimeterWaypoints[this.currentWaypointIndex];
      
      // Set initial rotation to face the next waypoint
      this.alignTowardsWaypoint();
    }
    
    // Move towards the current waypoint
    const speed = this.speed * 0.6; // Move at 60% speed while roaming
    
    // Get direction to target
    const direction = this.nextWaypoint.clone().sub(this.mesh.position).normalize();

    // Calculate desired velocity
    this.velocity.x = direction.x * speed;
    this.velocity.z = direction.z * speed;
    this.velocity.y = 0; // Ensure no vertical movement

    // Apply velocity
    this.mesh.position.x += this.velocity.x * delta;
    this.mesh.position.z += this.velocity.z * delta;
    this.mesh.position.y = 0.2; // Maintain consistent Y position
    
    // Check if we've reached the waypoint (within 5 units)
    if (this.mesh.position.distanceTo(this.nextWaypoint) < 5) {
      // Move to the next waypoint
      this.currentWaypointIndex = (this.currentWaypointIndex + 1) % this.perimeterWaypoints.length;
      this.nextWaypoint = this.perimeterWaypoints[this.currentWaypointIndex];
      
      // Set the truck rotation to face the direction of travel
      this.alignTowardsWaypoint();
    }
  }
  
  /**
   * Align the truck to face the next waypoint
   */
  alignTowardsWaypoint() {
    // Calculate direction to next waypoint
    const direction = this.nextWaypoint.clone().sub(this.mesh.position);
    
    // Only rotate on Y axis (ignore height differences)
    direction.y = 0;
    
    if (direction.lengthSq() > 0.001) {
      // Calculate the angle to the next waypoint
      const targetRotation = Math.atan2(direction.x, direction.z) + Math.PI;
      
      // Set rotation directly without interpolation
      this.mesh.rotation.y = targetRotation;
    }
  }
  
  /**
   * Move towards a target position
   * @param {THREE.Vector3} targetPosition Position to move towards
   * @param {number} speed Speed to move at
   * @param {number} delta Time since last update
   */
  moveTowards(targetPosition, speed, delta) {
    // This is now just a wrapper for consistency with existing code
    // Get direction to target
    const direction = targetPosition.clone().sub(this.mesh.position).normalize();

    // Calculate desired velocity
    this.velocity.x = direction.x * speed;
    this.velocity.z = direction.z * speed;
    this.velocity.y = 0; // Ensure no vertical movement

    // Apply velocity
    this.mesh.position.x += this.velocity.x * delta;
    this.mesh.position.z += this.velocity.z * delta;
    this.mesh.position.y = 0.2; // Maintain consistent Y position
    
    // Do NOT look at the target - truck should keep facing forward
  }

  /**
   * Transition to a new state based on current conditions
   * @param {Array<Object>} players Array of player objects
   * @param {number} time Current time
   */
  transitionState(players, time) {
    // Store previous state
    this.previousState = this.currentState;

    // Reset state timer
    this.stateTimer = 0;

    // Determine next state based on current state and conditions
    switch (this.currentState) {
      case 'spawning':
        this.currentState = 'patrolling';
        this.stateTimeout = 8000;
        console.log('Boss state: patrolling');
        break;

      case 'patrolling':
        this.findTarget(players);
        if (this.target) {
          this.currentState = 'chasing';
          this.stateTimeout = 10000; // Chase for up to 10 seconds
          console.log('Boss state: chasing');
        } else {
          this.stateTimeout = 8000; // Continue patrolling
        }
        break;

      case 'chasing':
        if (this.isTargetInRange()) {
          this.currentState = 'attacking';
          this.stateTimeout = 5000;
          console.log('Boss state: attacking');
        } else {
          this.findTarget(players); // Try to find a new target
          if (!this.target) {
            this.currentState = 'patrolling';
            this.stateTimeout = 8000;
            console.log('Boss state: patrolling');
          } else {
            this.stateTimeout = 10000; // Continue chasing
          }
        }
        break;

      case 'attacking':
        // After attacking, go back to chasing or patrolling
        if (this.health < this.maxHealth * 0.3 && Math.random() < 0.7) {
          this.currentState = 'retreating';
          this.stateTimeout = 6000;
          console.log('Boss state: retreating');
        } else if (this.health < this.maxHealth * 0.3 && Math.random() < 0.5) {
          this.currentState = 'enraged';
          this.stateTimeout = 8000;
          console.log('Boss state: enraged');
        } else {
          this.findTarget(players);
          if (this.target) {
            this.currentState = 'chasing';
            this.stateTimeout = 10000;
            console.log('Boss state: chasing');
          } else {
            this.currentState = 'patrolling';
            this.stateTimeout = 8000;
            console.log('Boss state: patrolling');
          }
        }
        break;

      case 'enraged':
        // After enraged, go back to attacking or retreating
        if (this.health < this.maxHealth * 0.15) {
          this.currentState = 'retreating';
          this.stateTimeout = 6000;
          console.log('Boss state: retreating');
        } else {
          this.currentState = 'attacking';
          this.stateTimeout = 5000;
          console.log('Boss state: attacking');
        }
        break;

      case 'retreating':
        // After retreating, go back to patrolling or become enraged
        if (this.health < this.maxHealth * 0.2 && Math.random() < 0.7) {
          this.currentState = 'enraged';
          this.stateTimeout = 8000;
          console.log('Boss state: enraged');
        } else {
          this.currentState = 'patrolling';
          this.stateTimeout = 8000;
          console.log('Boss state: patrolling');
        }
        break;
    }

    // Play state transition effects/sounds
    this.playStateTransitionEffects();
  }

  /**
   * Find a target player to chase
   * @param {Array<Object>} players Array of player objects
   */
  findTarget(players) {
    if (players.length === 0) {
      this.target = null;
      return;
    }

    // Find closest player or random player based on AI behavior
    if (Math.random() < 0.7) {
      // 70% chance to target closest player
      let closestPlayer = null;
      let closestDistance = Infinity;

      players.forEach(player => {
        const distance = this.mesh.position.distanceTo(player.vehicle.mesh.position);
        if (distance < closestDistance) {
          closestDistance = distance;
          closestPlayer = player;
        }
      });

      this.target = closestPlayer;
    } else {
      // 30% chance to target random player
      const randomIndex = Math.floor(Math.random() * players.length);
      this.target = players[randomIndex];
    }

    // Reset target timer
    this.targetTimer = 0;
  }

  /**
   * Check if current target is in attack range
   * @returns {boolean} True if target is in range
   */
  isTargetInRange() {
    if (!this.target) return false;

    const distance = this.mesh.position.distanceTo(this.target.vehicle.mesh.position);
    return distance < 15; // 15 units attack range
  }

  /**
   * Generate a random point to patrol towards
   * @returns {THREE.Vector3} Target patrol position
   */
  getPatrolPoint() {
    // Get random position within the map (we're assuming a 200x200 map)
    const x = (Math.random() - 0.5) * 160;
    const z = (Math.random() - 0.5) * 160;
    return new THREE.Vector3(x, 0, z);
  }

  /**
   * Handle spawning state (boss is materializing)
   * @param {number} delta Time since last update
   */
  handleSpawningState(delta) {
    // Visual effect for spawning (scale up)
    const progress = Math.min(1, this.stateTimer / this.stateTimeout);
    this.mesh.scale.set(progress, progress, progress);
  }

  /**
   * Handle patrolling state (moving to random points)
   * @param {Array<Object>} players Array of player objects
   * @param {number} delta Time since last update
   */
  handlePatrollingState(players, delta) {
    // If we don't have a patrol point, get one
    if (!this.targetPosition.lengthSq() ||
      this.mesh.position.distanceTo(this.targetPosition) < 10) {
      this.targetPosition = this.getPatrolPoint();
    }

    // Move towards patrol point
    this.moveTowards(this.targetPosition, this.speed * 0.7, delta);

    // Occasionally check for players to target
    this.targetTimer += delta * 1000;
    if (this.targetTimer > 2000) { // Check every 2 seconds
      this.findTarget(players);
    }
  }

  /**
   * Handle chasing state (pursuing a targeted player)
   * @param {Array<Object>} players Array of player objects
   * @param {number} delta Time since last update
   */
  handleChasingState(players, delta) {
    // If no target or target is dead/disconnected, find a new one
    if (!this.target || !players.some(p => p.id === this.target.id)) {
      this.findTarget(players);
      if (!this.target) {
        // No targets available, go back to patrolling
        this.currentState = 'patrolling';
        this.stateTimeout = 8000;
        this.stateTimer = 0;
        return;
      }
    }

    // Chase target
    const targetPosition = this.target.vehicle.mesh.position.clone();
    this.moveTowards(targetPosition, this.speed, delta);

    // Update target timer
    this.targetTimer += delta * 1000;
    if (this.targetTimer > this.targetTimeout) {
      this.findTarget(players); // Switch targets occasionally
    }
  }

  /**
   * Handle attacking state
   * @param {Array<Object>} players Array of player objects
   * @param {number} delta Time since last update
   * @param {number} time Current time
   */
  handleAttackingState(players, delta, time) {
    // If no target or target is dead/disconnected, find a new one
    if (!this.target || !players.some(p => p.id === this.target.id)) {
      this.findTarget(players);
      if (!this.target) {
        // No targets available, go back to patrolling
        this.currentState = 'patrolling';
        this.stateTimeout = 8000;
        this.stateTimer = 0;
        return;
      }
    }

    // Circle around the target
    const targetPosition = this.target.vehicle.mesh.position.clone();
    const directionToTarget = targetPosition.clone().sub(this.mesh.position).normalize();
    const perpendicular = new THREE.Vector3(-directionToTarget.z, 0, directionToTarget.x);

    // Calculate circle point
    const circleRadius = 12;
    const circlePoint = targetPosition.clone().add(
      perpendicular.multiplyScalar(circleRadius)
    );

    // Move towards circle point
    this.moveTowards(circlePoint, this.speed * 0.8, delta);

    // Face towards the target
    this.lookAt(targetPosition);

    // Attack if cooldown has elapsed
    if (time - this.lastAttackTime > this.attackCooldown) {
      this.attack(time);
    }
  }

  /**
   * Handle enraged state (faster movement, more aggressive attacks)
   * @param {Array<Object>} players Array of player objects
   * @param {number} delta Time since last update
   * @param {number} time Current time
   */
  handleEnragedState(players, delta, time) {
    // Similar to attacking but more aggressive and faster
    if (!this.target || !players.some(p => p.id === this.target.id)) {
      this.findTarget(players);
      if (!this.target) return;
    }

    // Charge directly at the target
    const targetPosition = this.target.vehicle.mesh.position.clone();
    this.moveTowards(targetPosition, this.speed * 1.5, delta);

    // Attack more frequently
    if (time - this.lastAttackTime > this.attackCooldown * 0.6) {
      this.attack(time);
    }
  }

  /**
   * Handle retreating state (move away from players to recover)
   * @param {number} delta Time since last update
   */
  handleRetreatingState(delta) {
    // If we have a target, move away from it
    if (this.target) {
      const directionToTarget = this.target.vehicle.mesh.position.clone()
        .sub(this.mesh.position).normalize();

      // Retreat position is in opposite direction
      const retreatPosition = this.mesh.position.clone().sub(
        directionToTarget.multiplyScalar(50)
      );

      // Move towards retreat position
      this.moveTowards(retreatPosition, this.speed * 0.8, delta);
    } else {
      // No target, just move to a random point
      if (!this.targetPosition.lengthSq() ||
        this.mesh.position.distanceTo(this.targetPosition) < 10) {
        this.targetPosition = this.getPatrolPoint();
      }

      this.moveTowards(this.targetPosition, this.speed * 0.8, delta);
    }

    // Slowly recover health during retreat
    this.health = Math.min(this.maxHealth, this.health + delta * 3);
  }

  /**
   * Orient the boss to look at a position
   * @param {THREE.Vector3} position Position to look at
   */
  lookAt(position) {
    // Calculate direction
    const direction = position.clone().sub(this.mesh.position);

    // Only rotate on Y axis (ignore height differences)
    direction.y = 0;

    // Only update if we have a meaningful direction
    if (direction.lengthSq() > 0.001) {
      // Get target rotation and add PI (180 degrees) to make the truck face forward
      const targetRotation = Math.atan2(direction.x, direction.z) + Math.PI;

      // Get current rotation
      let currentRotation = this.mesh.rotation.y;

      // Normalize angles
      while (targetRotation - currentRotation > Math.PI) currentRotation += Math.PI * 2;
      while (targetRotation - currentRotation < -Math.PI) currentRotation -= Math.PI * 2;

      // Interpolate to target rotation
      const rotationDelta = targetRotation - currentRotation;
      this.mesh.rotation.y += rotationDelta * 0.1;
    }
  }

  /**
   * Attack the target
   * @param {number} time Current time
   */
  attack(time) {
    if (!this.target) return;

    console.log("Attack method called, choosing weapon...");

    // Force napalm rain for testing if flag is set
    if (this.nextAttackForceNapalm && time - this.lastWeaponUse.napalmRain > this.weaponCooldowns.napalmRain) {
      console.log("🔥 Using forced napalm rain attack for testing");
      this.useNapalmRain();
      this.lastWeaponUse.napalmRain = time;
      this.lastAttackTime = time;
      this.nextAttackForceNapalm = false;
      return;
    }

    // Choose a weapon based on state and cooldowns
    let weapon = 'ram';

    if (this.currentState === 'enraged') {
      // In enraged state, don't choose napalm rain here (it's on its own timer)
      if (time - this.lastWeaponUse.flamethrower > this.weaponCooldowns.flamethrower) {
        weapon = 'flamethrower';
      } else if (time - this.lastWeaponUse.ram > this.weaponCooldowns.ram) {
        weapon = 'ram';
      } else if (time - this.lastWeaponUse.freezeMissile > this.weaponCooldowns.freezeMissile) {
        weapon = 'freezeMissile';
      }
    } else {
      // Choose weapon based on distance and cooldowns
      const distance = this.mesh.position.distanceTo(this.target.vehicle.mesh.position);
      console.log(`Distance to target: ${distance.toFixed(1)} units`);

      // Don't choose napalm rain here (it's on its own timer)
      if (distance < 10 && time - this.lastWeaponUse.ram > this.weaponCooldowns.ram) {
        weapon = 'ram';
      } else if (distance < 30 && time - this.lastWeaponUse.flamethrower > this.weaponCooldowns.flamethrower) {
        weapon = 'flamethrower';
      } else if (time - this.lastWeaponUse.freezeMissile > this.weaponCooldowns.freezeMissile) {
        weapon = 'freezeMissile';
      }
    }

    // Use the chosen weapon
    console.log(`Boss selected weapon: ${weapon}`);
    switch (weapon) {
      case 'ram':
        this.useRamAttack();
        break;
      case 'freezeMissile':
        this.useFreezeMissile();
        break;
      case 'flamethrower':
        this.useFlamethrower();
        break;
      // napalmRain is not included here since it's on its own timer
    }

    // Update attack timers
    this.lastAttackTime = time;
    this.lastWeaponUse[weapon] = time;
  }

  /**
   * Ram attack - charge at the target
   */
  useRamAttack() {
    console.log('Semi-Trump used Ram Attack!');
    // This would normally trigger a visual effect and damage calculation

    // In a full implementation, we'd also apply a force to the target
    // and check for collision damage
  }

  /**
   * Freeze missile attack - fire a missile that temporarily freezes the target
   */
  useFreezeMissile() {
    console.log('Semi-Trump used Freeze Missile!');
    
    if (this.target) {
      this.fireMissile(this.target);
    }
  }

  /**
   * Check if the boss can fire a missile (cooldown check)
   * @returns {boolean} True if missile can be fired
   */
  canFireMissile() {
    const now = Date.now();
    const canFire = now - this.lastWeaponUse.freezeMissile > this.weaponCooldowns.freezeMissile;
    
    // Add debug logging
    if (canFire) {
      console.log('Missile cooldown complete, ready to fire');
    }
    
    return canFire;
  }
  
  /**
   * Fire a missile at the target
   * @param {Object} target The target player to fire at
   */
  fireMissile(target) {
    if (!target || !target.vehicle || !target.vehicle.mesh) return;
    
    // Get world position for missile spawn point
    const missilePosition = this.missileSpawnPoint.clone();
    missilePosition.applyMatrix4(this.mesh.matrixWorld);
    
    // Calculate direction to target
    const targetPosition = target.vehicle.mesh.position.clone();
    const direction = new THREE.Vector3().subVectors(targetPosition, missilePosition).normalize();
    
    // Create a simple missile mesh (cylinder + cone)
    const missileGroup = new THREE.Group();
    
    // Body (cylinder)
    const bodyGeometry = new THREE.CylinderGeometry(0.2, 0.2, 1.5, 8);
    const bodyMaterial = new THREE.MeshPhongMaterial({
      color: 0x555555,
      emissive: 0x333333,
      emissiveIntensity: 0.5
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.rotation.x = Math.PI / 2; // Rotate to point forward
    missileGroup.add(body);
    
    // Nose cone (red tip)
    const tipGeometry = new THREE.ConeGeometry(0.2, 0.5, 8);
    const tipMaterial = new THREE.MeshPhongMaterial({
      color: 0xff0000,
      emissive: 0xff0000,
      emissiveIntensity: 0.5
    });
    const tip = new THREE.Mesh(tipGeometry, tipMaterial);
    tip.position.set(0, 0, 0.9); // Place at front of cylinder
    tip.rotation.x = Math.PI / 2;
    missileGroup.add(tip);
    
    // Position at spawn point but orient directly toward target regardless of truck orientation
    missileGroup.position.copy(missilePosition);
    missileGroup.lookAt(targetPosition);
    
    // Add missile to scene
    this.scene.add(missileGroup);
    
    // Create missile data object
    const missile = {
      mesh: missileGroup,
      target: target,
      velocity: direction.multiplyScalar(this.missileSpeed),
      startPosition: missilePosition.clone(),
      startTime: Date.now(),
      lifetime: 5000, // 5 seconds
      damage: this.missileDamage,
      hit: false
    };
    
    // Add to active projectiles
    this.activeProjectiles.push(missile);
    
    // Create a simple flash effect at launch point
    this.createSimpleFlash(missilePosition);
  }
  
  /**
   * Create a simple flash effect for missile launch
   * @param {THREE.Vector3} position Position to create the flash
   */
  createSimpleFlash(position) {
    const flashGeometry = new THREE.SphereGeometry(0.5, 8, 8);
    const flashMaterial = new THREE.MeshBasicMaterial({
      color: 0xff8800,
      transparent: true,
      opacity: 0.8
    });
    
    const flash = new THREE.Mesh(flashGeometry, flashMaterial);
    flash.position.copy(position);
    this.scene.add(flash);
    
    // Simple fade out animation
    setTimeout(() => {
      this.scene.remove(flash);
    }, 200);
  }
  
  /**
   * Update active projectiles
   * @param {number} delta Time since last update
   */
  updateProjectiles(delta) {
    const now = Date.now();
    const projectilesToRemove = [];
    
    // Update each projectile
    this.activeProjectiles.forEach((projectile, index) => {
      // Check lifetime
      if (now - projectile.startTime > projectile.lifetime) {
        projectilesToRemove.push(index);
        return;
      }
      
      if (projectile.type === 'napalm') {
        // Elapsed time since projectile was created
        const elapsed = now - projectile.startTime;
        
        // Handle different phases of napalm missile flight
        if (projectile.launchPhase) {
          // Launch phase - missile goes upward with slight guidance
          projectile.mesh.position.x += projectile.velocity.x * delta * 60;
          projectile.mesh.position.y += projectile.velocity.y * delta * 60;
          projectile.mesh.position.z += projectile.velocity.z * delta * 60;
          
          // Check if launch phase is complete
          if (elapsed > projectile.launchDuration) {
            projectile.launchPhase = false;
            projectile.guidancePhase = true;
            
            // Transition to guidance phase - change direction toward target
            const toTarget = new THREE.Vector3().subVectors(
              projectile.targetPosition,
              projectile.mesh.position
            ).normalize();
            
            // Add strong downward component
            toTarget.y = -1.0;
            toTarget.normalize();
            
            // Update velocity direction but keep speed
            const speed = projectile.velocity.length();
            projectile.velocity.copy(toTarget).multiplyScalar(speed * 0.8); // Slow down slightly during transition
          }
        } else if (projectile.guidancePhase) {
          // Ballistic/guidance phase - missile arcs toward target
          
          // Apply gravity
          projectile.velocity.y -= 0.01 * delta * 60;
          
          // Very slight guidance toward target (minimal homing effect)
          const normalizedElapsed = Math.min(1.0, (elapsed - projectile.launchDuration) / 2000);
          const toTarget = new THREE.Vector3().subVectors(
            projectile.targetPosition,
            projectile.mesh.position
          ).normalize();
          
          // Blend between ballistic trajectory and guidance (stronger at beginning, weaker at end)
          const guidanceStrength = 0.05 * (1.0 - normalizedElapsed);
          projectile.velocity.lerp(toTarget.multiplyScalar(projectile.velocity.length()), guidanceStrength * delta * 60);
          
          // Update position
          projectile.mesh.position.x += projectile.velocity.x * delta * 60;
          projectile.mesh.position.y += projectile.velocity.y * delta * 60;
          projectile.mesh.position.z += projectile.velocity.z * delta * 60;
        }
        
        // Create trail effect (smoke particles)
        if (Math.random() < 0.3) {
          this.createProjectileTrail(projectile.mesh.position.clone(), projectile.velocity.clone());
        }
        
        // Update missile orientation to match velocity direction
        projectile.mesh.lookAt(
          projectile.mesh.position.clone().add(projectile.velocity)
        );
        
        // Check if reached target or hit ground
        if (projectile.mesh.position.y <= 0.2 && !projectile.hit) {
          // Mark as hit and for removal
          projectile.hit = true;
          projectilesToRemove.push(index);
          
          // Create napalm explosion
          this.createNapalmExplosion(projectile.mesh.position.clone(), projectile.radius, projectile.damage);
        }
      } else {
        // Regular missile projectile - simple straight-line movement with slight tracking
        if (projectile.target && projectile.target.vehicle && projectile.target.vehicle.mesh) {
          const targetPosition = projectile.target.vehicle.mesh.position;
          
          // Calculate direction to target (basic homing)
          const direction = new THREE.Vector3()
            .subVectors(targetPosition, projectile.mesh.position)
            .normalize();
          
          // Gradual course correction (25% towards target direction each frame)
          projectile.velocity.lerp(direction.multiplyScalar(this.missileSpeed), 0.25 * delta * 60);
          
          // Update position
          projectile.mesh.position.x += projectile.velocity.x * delta * 60;
          projectile.mesh.position.y += projectile.velocity.y * delta * 60;
          projectile.mesh.position.z += projectile.velocity.z * delta * 60;
          
          // Update orientation to match velocity direction
          projectile.mesh.lookAt(
            projectile.mesh.position.clone().add(projectile.velocity)
          );
          
          // Check collision with target
          const distance = projectile.mesh.position.distanceTo(targetPosition);
          if (distance < 2 && !projectile.hit) { // Hit if within 2 units
            // Apply damage
            if (projectile.target.vehicle.takeDamage) {
              // Apply damage
              projectile.target.vehicle.takeDamage(projectile.damage);
              
              // Apply freeze effect (slow down)
              if (projectile.target.vehicle.velocity) {
                projectile.target.vehicle.velocity.multiplyScalar(0.3);
              }
            }
            
            // Mark as hit and for removal
            projectile.hit = true;
            projectilesToRemove.push(index);
            
            // Create simple explosion
            this.createSimpleExplosion(projectile.mesh.position.clone());
          }
        }
      }
    });
    
    // Remove projectiles
    projectilesToRemove.sort((a, b) => b - a).forEach(index => {
      const projectile = this.activeProjectiles[index];
      if (projectile.mesh) {
        this.scene.remove(projectile.mesh);
      }
      this.activeProjectiles.splice(index, 1);
    });
  }
  
  /**
   * Create a trail effect behind projectiles
   * @param {THREE.Vector3} position Position of the trail particle
   * @param {THREE.Vector3} velocity Velocity of the projectile (for orientation)
   */
  createProjectileTrail(position, velocity) {
    // Small smoke particle
    const particleSize = 0.2 + Math.random() * 0.3;
    const particleGeometry = new THREE.SphereGeometry(particleSize, 6, 6);
    const particleMaterial = new THREE.MeshBasicMaterial({
      color: Math.random() < 0.3 ? 0xFF6600 : 0x777777, // Occasional fire particles in the smoke
      transparent: true,
      opacity: 0.6 + Math.random() * 0.2
    });
    
    const particle = new THREE.Mesh(particleGeometry, particleMaterial);
    
    // Offset slightly from projectile center
    const offset = new THREE.Vector3(
      (Math.random() - 0.5) * 0.1,
      (Math.random() - 0.5) * 0.1,
      (Math.random() - 0.5) * 0.1
    );
    
    // Place slightly behind the projectile (in direction opposite to velocity)
    const reverseDir = velocity.clone().negate().normalize();
    const positionOffset = reverseDir.multiplyScalar(0.7 + Math.random() * 0.7);
    
    particle.position.copy(position).add(offset).add(positionOffset);
    this.scene.add(particle);
    
    // Particle animation
    const lifetime = 500 + Math.random() * 500;
    const startTime = Date.now();
    
    const animate = () => {
      const now = Date.now();
      const elapsed = now - startTime;
      
      if (elapsed > lifetime) {
        this.scene.remove(particle);
        return;
      }
      
      // Fade out
      particleMaterial.opacity = 0.7 * (1 - elapsed / lifetime);
      
      // Slightly expand
      const scale = 1 + (elapsed / lifetime);
      particle.scale.set(scale, scale, scale);
      
      requestAnimationFrame(animate);
    };
    
    animate();
  }
  
  /**
   * Create a napalm explosion effect that damages players in radius
   * @param {THREE.Vector3} position Position of the explosion
   * @param {number} radius Radius of the explosion effect
   * @param {number} damage Damage amount to apply to players in radius
   */
  createNapalmExplosion(position, radius, damage) {
    // Create a simple sphere for the initial explosion
    const explosionGeometry = new THREE.SphereGeometry(radius * 0.5, 16, 16);
    const explosionMaterial = new THREE.MeshBasicMaterial({
      color: 0xFF4500,
      transparent: true,
      opacity: 0.9
    });
    
    const explosion = new THREE.Mesh(explosionGeometry, explosionMaterial);
    explosion.position.copy(position);
    this.scene.add(explosion);
    
    // Create fire effect (multiple smaller spheres inside the main explosion)
    const fireParticles = [];
    for (let i = 0; i < 10; i++) {
      const particleSize = 1 + Math.random() * 3;
      const particleGeometry = new THREE.SphereGeometry(particleSize, 8, 8);
      const particleMaterial = new THREE.MeshBasicMaterial({
        color: new THREE.Color(
          0.9 + Math.random() * 0.1, // Red
          0.4 + Math.random() * 0.4, // Green
          0 + Math.random() * 0.3    // Blue
        ),
        transparent: true,
        opacity: 0.7 + Math.random() * 0.3
      });
      
      const particle = new THREE.Mesh(particleGeometry, particleMaterial);
      
      // Random position within the explosion radius
      const offset = new THREE.Vector3(
        (Math.random() - 0.5) * radius * 0.8,
        Math.random() * radius * 0.3,
        (Math.random() - 0.5) * radius * 0.8
      );
      
      particle.position.copy(position).add(offset);
      this.scene.add(particle);
      
      fireParticles.push({
        mesh: particle,
        material: particleMaterial,
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 0.1,
          0.05 + Math.random() * 0.1,
          (Math.random() - 0.5) * 0.1
        ),
        lifetime: 2000 + Math.random() * 2000,
        startTime: Date.now()
      });
    }
    
    // Simple fade out and expand animation
    let scale = 1;
    let opacity = 0.9;
    const startTime = Date.now();
    const explosionDuration = 4000; // 4 seconds
    
    // Apply damage to players in radius
    this.applyNapalmDamage(position, radius, damage);
    
    // Create burning ground effect
    this.createBurningGround(position, radius);
    
    const animate = () => {
      const now = Date.now();
      const elapsed = now - startTime;
      const normalizedTime = Math.min(elapsed / explosionDuration, 1);
      
      // Update main explosion
      scale = 1 + normalizedTime * 1.5;
      opacity = 0.9 * (1 - normalizedTime);
      
      explosion.scale.set(scale, scale * 0.5, scale);
      explosionMaterial.opacity = Math.max(0, opacity);
      
      // Update fire particles
      for (let i = fireParticles.length - 1; i >= 0; i--) {
        const particle = fireParticles[i];
        const particleElapsed = now - particle.startTime;
        
        if (particleElapsed > particle.lifetime) {
          this.scene.remove(particle.mesh);
          fireParticles.splice(i, 1);
          continue;
        }
        
        const particleNormalizedTime = particleElapsed / particle.lifetime;
        
        // Move particle upward and fade out
        particle.mesh.position.add(particle.velocity);
        particle.material.opacity = Math.max(0, 0.7 * (1 - particleNormalizedTime));
      }
      
      // Remove reference to ground effect - it's managed by createBurningGround
      // The previous code was referencing remainingDuration which is not defined here
      
      // Continue animation or clean up
      if (normalizedTime < 1 || fireParticles.length > 0) {
        requestAnimationFrame(animate);
      } else {
        // Clean up explosion when complete
        this.scene.remove(explosion);
      }
    };
    
    animate();
  }
  
  /**
   * Apply napalm damage to players in radius
   * @param {THREE.Vector3} position Center position of the napalm explosion
   * @param {number} radius Radius of damage effect
   * @param {number} damage Amount of damage to apply
   */
  applyNapalmDamage(position, radius, damage) {
    // Find players in the scene
    const players = [];
    
    // Try to find players from various sources
    // Game state might be accessible different ways depending on implementation
    if (this.scene.userData && this.scene.userData.players) {
      // If players are stored in scene userData
      players.push(...this.scene.userData.players.values());
    } else if (window.gameState && window.gameState.players) {
      // If there's a global gameState
      players.push(...window.gameState.players.values());
    }
    
    // Apply damage to players in radius
    players.forEach(player => {
      if (!player.vehicle || !player.vehicle.mesh) return;
      
      const distance = position.distanceTo(player.vehicle.mesh.position);
      
      // Check if player is within explosion radius
      if (distance <= radius) {
        // Apply damage with falloff based on distance from center
        const falloff = 1 - (distance / radius);
        const damageAmount = damage * falloff;
        
        // Apply damage to player vehicle
        if (player.vehicle.takeDamage) {
          player.vehicle.takeDamage(damageAmount);
          
          // Add burning/fire effect to vehicle
          // This would normally be implemented in the vehicle class
          console.log(`Player ${player.id} hit by napalm for ${damageAmount.toFixed(1)} damage`);
        }
      }
    });
  }
  
  /**
   * Create a burning ground effect that lasts for a duration
   * @param {THREE.Vector3} position Center position of the burn effect
   * @param {number} radius Radius of the burn area
   */
  createBurningGround(position, radius) {
    // Create a simple disc for the burning ground
    const groundGeometry = new THREE.CircleGeometry(radius, 32);
    const groundMaterial = new THREE.MeshBasicMaterial({
      color: 0x330000,
      transparent: true,
      opacity: 0.5
    });
    
    // Rotate to be flat on the ground
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.position.copy(position);
    ground.position.y = 0.1; // Just above the ground
    ground.rotation.x = -Math.PI / 2; // Make flat on ground
    
    this.scene.add(ground);
    
    // Create fire particles on the ground
    const fireParticles = [];
    for (let i = 0; i < 20; i++) {
      const particleSize = 0.5 + Math.random() * 1.5;
      const particleGeometry = new THREE.SphereGeometry(particleSize, 8, 8);
      const particleMaterial = new THREE.MeshBasicMaterial({
        color: new THREE.Color(
          0.8 + Math.random() * 0.2, // Red
          0.3 + Math.random() * 0.3, // Green
          0 + Math.random() * 0.2    // Blue
        ),
        transparent: true,
        opacity: 0.6 + Math.random() * 0.4
      });
      
      const particle = new THREE.Mesh(particleGeometry, particleMaterial);
      
      // Random position within the circle
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * radius * 0.9;
      
      particle.position.set(
        position.x + Math.cos(angle) * distance,
        position.y + 0.5 + Math.random() * 0.5,
        position.z + Math.sin(angle) * distance
      );
      
      this.scene.add(particle);
      
      fireParticles.push({
        mesh: particle,
        material: particleMaterial,
        geometry: particleGeometry,
        startPosition: particle.position.clone(),
        height: 0.5 + Math.random() * 2.0,
        speed: 0.01 + Math.random() * 0.03,
        phase: Math.random() * Math.PI * 2
      });
    }
    
    // Set up a timer to apply periodic damage to players in the area
    let remainingDuration = 10000; // 10 seconds of burning ground
    let lastDamageTime = Date.now();
    const damageInterval = 1000; // Apply damage every second
    const damagePerSecond = this.napalmDamage * 0.3; // 30% of initial damage per second
    
    const startTime = Date.now();
    
    const update = () => {
      const now = Date.now();
      const elapsed = now - lastDamageTime;
      
      // Calculate duration based on current time
      const totalElapsed = now - startTime;
      remainingDuration = Math.max(0, 10000 - totalElapsed);
      
      // Apply periodic damage
      if (elapsed >= damageInterval && remainingDuration > 0) {
        this.applyNapalmDamage(position, radius, damagePerSecond);
        lastDamageTime = now;
      }
      
      // Animate fire particles
      const time = now * 0.001; // Convert to seconds for animation
      
      for (let i = fireParticles.length - 1; i >= 0; i--) {
        const particle = fireParticles[i];
        
        // If effect is almost over, start removing particles
        if (remainingDuration < 2000 && Math.random() < 0.05) {
          this.scene.remove(particle.mesh);
          fireParticles.splice(i, 1);
          continue;
        }
        
        // Oscillate particles up and down
        const yOffset = Math.sin(time * 3 + particle.phase) * particle.height * 0.2;
        
        particle.mesh.position.y = particle.startPosition.y + yOffset;
        
        // Flicker opacity
        particle.material.opacity = 0.3 + Math.sin(time * 5 + particle.phase) * 0.3;
        
        // Gradually reduce opacity as effect ends
        if (remainingDuration < 3000) {
          const fadeFactor = remainingDuration / 3000;
          particle.material.opacity *= fadeFactor;
        }
      }
      
      // Scale ground effect down as it expires
      let normalizedTimeRemaining = Math.max(0, remainingDuration / 10000);
      ground.scale.set(normalizedTimeRemaining, normalizedTimeRemaining, normalizedTimeRemaining);
      groundMaterial.opacity = 0.5 * normalizedTimeRemaining;
      
      // Continue animation or clean up
      if (remainingDuration > 0 || fireParticles.length > 0) {
        requestAnimationFrame(update);
      } else {
        // Clean up - ensure all objects are removed
        if (ground.parent) {
          this.scene.remove(ground);
        }
        
        // Remove any remaining fire particles
        fireParticles.forEach(particle => {
          if (particle.mesh && particle.mesh.parent) {
            this.scene.remove(particle.mesh);
            // Dispose of geometries and materials
            if (particle.geometry) particle.geometry.dispose();
            if (particle.material) particle.material.dispose();
          }
        });
        
        // Clear array
        fireParticles.length = 0;
        
        // Explicitly dispose of geometries and materials to prevent memory leaks
        groundGeometry.dispose();
        groundMaterial.dispose();
      }
    };
    
    // Start animation
    update();
  }

  /**
   * Update visual effects based on state and health
   * @param {number} delta Time since last update
   * @param {number} time Current time
   */
  updateVisualEffects(delta, time) {
    // Update health-based effects
    const healthPercent = this.health / this.maxHealth;

    if (healthPercent < 0.3) {
      // Heavily damaged - add smoke and fire effects
      // This would normally spawn smoke and fire particles
    } else if (healthPercent < 0.6) {
      // Moderately damaged - add smoke effects
      // This would normally spawn smoke particles
    }

    // Update state-based effects
    if (this.currentState === 'enraged') {
      // Add red glow effect
      // This would normally adjust material emissive properties
    }
  }

  /**
   * Play effects when transitioning between states
   */
  playStateTransitionEffects() {
    // This would normally play sound effects and visual transitions
    // based on the state change

    if (this.previousState === 'normal' && this.currentState === 'enraged') {
      // Play enrage sound effect and visual
      console.log('Semi-Trump becomes enraged!');
    } else if (this.previousState === 'enraged' && this.currentState !== 'enraged') {
      // Play calming down effect
      console.log('Semi-Trump calms down.');
    }
  }

  /**
   * Make the boss take damage
   * @param {number} amount Amount of damage to take
   * @param {Object} attacker The player who caused the damage
   * @param {boolean} [preventDeath=false] If true, don't report destruction even if health reaches 0
   * @returns {boolean} True if the boss was destroyed
   */
  takeDamage(amount, attacker, preventDeath = false) {
    console.log(`SemiTrump takeDamage called with damage: ${amount}, current health: ${this.health}`);
    
    // Apply damage
    this.health = Math.max(0, this.health - amount);

    // Update health bar
    this.updateHealthBar();

    // If health is low, increase chance of entering enraged state
    if (this.health < this.maxHealth * 0.3 &&
      this.currentState !== 'enraged' &&
      Math.random() < 0.3) {
      this.currentState = 'enraged';
      this.stateTimer = 0;
      this.stateTimeout = 8000;
      this.playStateTransitionEffects();
    }

    // If attacker is not the current target, chance to switch targets
    if (attacker && this.target && attacker.id !== this.target.id && Math.random() < 0.5) {
      this.target = attacker;
    }

    // Check if destroyed, but only report it if preventDeath is false
    // This lets the server control when the boss is actually destroyed
    return this.health <= 0 && !preventDeath;
  }

  /**
   * Set the difficulty level
   * @param {number} difficulty New difficulty level
   */
  setDifficulty(difficulty) {
    const oldHealth = this.health;
    const oldMaxHealth = this.maxHealth;

    // Update stats with new difficulty
    this.difficulty = difficulty;
    this.maxHealth = 100 * difficulty;
    this.health = (oldHealth / oldMaxHealth) * this.maxHealth; // Preserve health percentage
    this.damage = 10 * (1 + (difficulty * 0.2));
    this.speed = 0.2 * (1 + (difficulty * 0.3));
    this.turnRate = 0.01 * (1 + (difficulty * 0.2));
    this.attackCooldown = 3000 / difficulty;

    // Update health bar
    this.updateHealthBar();

    console.log(`Semi-Trump difficulty set to ${difficulty.toFixed(1)}`);
  }

  /**
   * Create a simple explosion effect
   * @param {THREE.Vector3} position Position of the explosion
   */
  createSimpleExplosion(position) {
    // Create a simple sphere for the explosion
    const explosionGeometry = new THREE.SphereGeometry(1, 8, 8);
    const explosionMaterial = new THREE.MeshBasicMaterial({
      color: 0xff4500,
      transparent: true,
      opacity: 0.8
    });
    
    const explosion = new THREE.Mesh(explosionGeometry, explosionMaterial);
    explosion.position.copy(position);
    this.scene.add(explosion);
    
    // Simple fade out and expand animation
    let scale = 1;
    let opacity = 0.8;
    
    const animate = () => {
      scale += 0.2;
      opacity -= 0.05;
      
      explosion.scale.set(scale, scale, scale);
      explosionMaterial.opacity = Math.max(0, opacity);
      
      if (opacity <= 0) {
        this.scene.remove(explosion);
        return;
      }
      
      requestAnimationFrame(animate);
    };
    
    animate();
  }

  /**
   * Flamethrower attack - shoot flames in a cone
   */
  useFlamethrower() {
    console.log('Semi-Trump used Flamethrower!');
    // This would normally create flame particles and check for hits

    // In a full implementation, we'd create flame particles and apply
    // damage over time to targets in range
  }
  
  /**
   * Napalm rain attack - fire multiple napalm projectiles toward the center of the map
   */
  useNapalmRain() {
    console.log('🔥🔥🔥 Semi-Trump used Napalm Rain! Firing', this.napalmCount, 'projectiles');
    
    // Get map dimensions from the perimeter waypoints
    const mapWidth = 160;
    const mapHeight = 200;
    const patrolMargin = 10;
    
    // Create a wider spread of projectiles with more randomness
    for (let i = 0; i < this.napalmCount; i++) {
      // Use different randomization patterns for more unpredictability
      let targetPosition;
      
      // Choose a randomization pattern - gives variety to the attack patterns
      const pattern = Math.floor(Math.random() * 4);
      
      switch(pattern) {
        case 0: // Cluster pattern - group of projectiles in a random area
          {
            // Choose a random cluster center point
            const clusterCenter = new THREE.Vector3(
              (Math.random() - 0.5) * (mapWidth * 0.6),
              0,
              (Math.random() - 0.5) * (mapHeight * 0.6)
            );
            
            // Add random offset from the cluster center
            targetPosition = clusterCenter.clone().add(new THREE.Vector3(
              (Math.random() - 0.5) * 25,
              0,
              (Math.random() - 0.5) * 25
            ));
          }
          break;
        
        case 1: // Line pattern - projectiles in rough line across the map
          {
            // Choose a random angle for the line
            const angle = Math.random() * Math.PI * 2;
            // Random position along that line
            const distance = (Math.random() - 0.5) * mapWidth * 0.7;
            
            targetPosition = new THREE.Vector3(
              Math.cos(angle) * distance,
              0,
              Math.sin(angle) * distance
            );
          }
          break;
          
        case 2: // Biased toward player areas
          {
            // If we have a target, bias some shots toward player-dense areas
            if (this.target && this.target.vehicle && this.target.vehicle.mesh) {
              // Get player position but add randomness
              const playerPos = this.target.vehicle.mesh.position.clone();
              targetPosition = new THREE.Vector3(
                playerPos.x + (Math.random() - 0.5) * 40,
                0,
                playerPos.z + (Math.random() - 0.5) * 40
              );
            } else {
              // Default to wide random if no target
              targetPosition = new THREE.Vector3(
                (Math.random() - 0.5) * mapWidth * 0.8,
                0,
                (Math.random() - 0.5) * mapHeight * 0.8
              );
            }
          }
          break;
          
        case 3: // Default - fully random within map area but wider spread
        default:
          targetPosition = new THREE.Vector3(
            (Math.random() - 0.5) * mapWidth * 0.8,
            0,
            (Math.random() - 0.5) * mapHeight * 0.8
          );
          break;
      }
      
      // Ensure the target position is within the map bounds
      targetPosition.x = Math.max(-(mapWidth/2 - patrolMargin), Math.min(mapWidth/2 - patrolMargin, targetPosition.x));
      targetPosition.z = Math.max(-(mapHeight/2 - patrolMargin), Math.min(mapHeight/2 - patrolMargin, targetPosition.z));
      
      // Fire the napalm projectile
      this.fireNapalmProjectile(targetPosition);
      
      // Add slight delay between projectile launches for visual effect
      // Since we can't use setTimeout directly in a synchronous method,
      // we prepare the projectiles with staggered start times
      if (i < this.napalmCount - 1) {
        setTimeout(() => {
          // This is just for visual effect, not necessary for the actual gameplay
          this.createSimpleFlash(this.missileSpawnPoint.clone().applyMatrix4(this.mesh.matrixWorld));
        }, i * 150); // 150ms stagger between projectiles
      }
    }
  }
  
  /**
   * Fire a napalm projectile at the target position
   * @param {THREE.Vector3} targetPosition The target position to fire at
   */
  fireNapalmProjectile(targetPosition) {
    // Get world position for projectile spawn point
    const projectilePosition = this.missileSpawnPoint.clone();
    projectilePosition.applyMatrix4(this.mesh.matrixWorld);
    
    // Calculate direction to target position
    const direction = new THREE.Vector3().subVectors(targetPosition, projectilePosition).normalize();
    
    // Create a more missile-like napalm projectile
    const projectileGroup = new THREE.Group();
    
    // Body (longer and thinner cylinder for missile look)
    const bodyGeometry = new THREE.CylinderGeometry(0.2, 0.2, 2.5, 8);
    const bodyMaterial = new THREE.MeshPhongMaterial({
      color: 0xDDDDDD, // Light gray for missile body
      emissive: 0x222222,
      emissiveIntensity: 0.3
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.rotation.x = Math.PI / 2; // Rotate to point forward
    projectileGroup.add(body);
    
    // Nose cone (red tip)
    const tipGeometry = new THREE.ConeGeometry(0.2, 0.7, 8);
    const tipMaterial = new THREE.MeshPhongMaterial({
      color: 0xFF4500,
      emissive: 0xFF4500,
      emissiveIntensity: 0.5
    });
    const tip = new THREE.Mesh(tipGeometry, tipMaterial);
    tip.position.set(0, 0, 1.5); // Place at front of cylinder
    tip.rotation.x = Math.PI / 2;
    projectileGroup.add(tip);
    
    // Add small fins for missile look
    const finGeometry = new THREE.BoxGeometry(0.1, 0.5, 0.5);
    const finMaterial = new THREE.MeshPhongMaterial({
      color: 0xDD5500,
    });
    
    // Create 4 fins around the missile
    for (let i = 0; i < 4; i++) {
      const fin = new THREE.Mesh(finGeometry, finMaterial);
      fin.position.set(0, 0, -0.8); 
      fin.rotation.z = (Math.PI / 2) * i;
      projectileGroup.add(fin);
    }
    
    // Add fire effect to back (more intense with particles)
    const fireGeometry = new THREE.ConeGeometry(0.3, 1.5, 8);
    const fireMaterial = new THREE.MeshPhongMaterial({
      color: 0xFF6600,
      emissive: 0xFF6600,
      emissiveIntensity: 1.0,
      transparent: true,
      opacity: 0.8
    });
    const fire = new THREE.Mesh(fireGeometry, fireMaterial);
    fire.position.set(0, 0, -1.7); // Place at back of cylinder
    fire.rotation.x = -Math.PI / 2; // Point backward
    projectileGroup.add(fire);
    
    // Add smaller inner fire cone for more detail
    const innerFireGeometry = new THREE.ConeGeometry(0.15, 2.0, 8);
    const innerFireMaterial = new THREE.MeshPhongMaterial({
      color: 0xFFFF00,
      emissive: 0xFFFF00,
      emissiveIntensity: 1.0,
      transparent: true,
      opacity: 0.9
    });
    const innerFire = new THREE.Mesh(innerFireGeometry, innerFireMaterial);
    innerFire.position.set(0, 0, -1.9); // Place at back of main fire
    innerFire.rotation.x = -Math.PI / 2; // Point backward
    projectileGroup.add(innerFire);
    
    // Position at spawn point and initially point more upwards
    projectileGroup.position.copy(projectilePosition);
    
    // Initially aim more upward instead of directly at target
    const upwardDirection = new THREE.Vector3(
      direction.x * 0.3, // Reduced horizontal component
      0.85,              // Strong upward component
      direction.z * 0.3  // Reduced horizontal component
    ).normalize();
    
    projectileGroup.lookAt(projectilePosition.clone().add(upwardDirection));
    
    // Add projectile to scene
    this.scene.add(projectileGroup);
    
    // Create projectile data object with launch data for realistic arc
    const projectile = {
      mesh: projectileGroup,
      targetPosition: targetPosition.clone(),
      velocity: upwardDirection.multiplyScalar(this.missileSpeed * 2.0), // Higher initial velocity
      startPosition: projectilePosition.clone(),
      startTime: Date.now(),
      lifetime: 7000, // 7 seconds - longer range
      damage: this.napalmDamage,
      type: 'napalm', // Identify as napalm projectile
      radius: this.napalmRadius, // Area of effect radius
      hit: false,
      // New properties for better trajectory
      launchPhase: true, // Start in launch phase (going up)
      launchDuration: 1500, // Time spent in launch phase (ms)
      guidancePhase: false, // Will enter guidance phase after launch
      initialDirection: upwardDirection.clone(),
      targetDirection: direction.clone()
    };
    
    // Add to active projectiles
    this.activeProjectiles.push(projectile);
    
    // Create a more intense launch effect
    this.createMissileLaunchEffect(projectilePosition);
  }
  
  /**
   * Create a more intense launch effect for napalm missiles
   * @param {THREE.Vector3} position Position to create the launch effect
   */
  createMissileLaunchEffect(position) {
    // Create a bright flash
    const flashGeometry = new THREE.SphereGeometry(0.8, 12, 12);
    const flashMaterial = new THREE.MeshBasicMaterial({
      color: 0xFFDD00,
      transparent: true,
      opacity: 0.9
    });
    
    const flash = new THREE.Mesh(flashGeometry, flashMaterial);
    flash.position.copy(position);
    this.scene.add(flash);
    
    // Create smoke cloud effect
    const smokeParticles = [];
    for (let i = 0; i < 8; i++) {
      const smokeSize = 0.4 + Math.random() * 0.8;
      const smokeGeometry = new THREE.SphereGeometry(smokeSize, 8, 8);
      const smokeMaterial = new THREE.MeshBasicMaterial({
        color: new THREE.Color(0.3 + Math.random() * 0.1, 0.3 + Math.random() * 0.1, 0.3 + Math.random() * 0.1),
        transparent: true,
        opacity: 0.5 + Math.random() * 0.2
      });
      
      const smoke = new THREE.Mesh(smokeGeometry, smokeMaterial);
      
      // Random position around launch point
      const offset = new THREE.Vector3(
        (Math.random() - 0.5) * 1.0,
        Math.random() * 0.5,
        (Math.random() - 0.5) * 1.0
      );
      
      smoke.position.copy(position).add(offset);
      this.scene.add(smoke);
      
      smokeParticles.push({
        mesh: smoke,
        material: smokeMaterial,
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 0.05,
          Math.random() * 0.1,
          (Math.random() - 0.5) * 0.05
        ),
        lifetime: 1000 + Math.random() * 500
      });
    }
    
    // Animate smoke and flash
    const startTime = Date.now();
    
    const animate = () => {
      const now = Date.now();
      const elapsed = now - startTime;
      
      // Fade and expand flash
      if (elapsed < 300) {
        const scale = 1 + (elapsed / 100);
        flash.scale.set(scale, scale, scale);
        flashMaterial.opacity = 0.9 * (1 - elapsed / 300);
      } else if (flash.parent) {
        this.scene.remove(flash);
      }
      
      // Update smoke particles
      for (let i = smokeParticles.length - 1; i >= 0; i--) {
        const particle = smokeParticles[i];
        
        if (elapsed > particle.lifetime) {
          this.scene.remove(particle.mesh);
          smokeParticles.splice(i, 1);
          continue;
        }
        
        // Move smoke upward and outward
        particle.mesh.position.add(particle.velocity);
        
        // Fade out smoke
        particle.material.opacity = Math.max(0, particle.material.opacity - 0.01);
      }
      
      // Continue animation if particles remain
      if (smokeParticles.length > 0 || elapsed < 300) {
        requestAnimationFrame(animate);
      }
    };
    
    animate();
  }
} 