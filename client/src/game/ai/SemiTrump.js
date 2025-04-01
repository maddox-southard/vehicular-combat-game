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
    this.currentWeapon = 'ram'; // ram, freezeMissile, flamethrower
    this.weaponCooldowns = {
      ram: 2000,
      freezeMissile: 5000,
      flamethrower: 3000
    };
    this.lastWeaponUse = {
      ram: 0,
      freezeMissile: 0,
      flamethrower: 0
    };

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
    // TEMPORARY: Only handle perimeter roaming for model examination
    this.handlePerimeterRoaming(delta);
    
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

    // Separation - boss should push vehicles more than it gets pushed
    const pushBack = collision.normal.clone().multiplyScalar(collision.penetration * 0.3);
    vehicle.mesh.position.add(pushBack.clone().multiplyScalar(bossRatio));
    this.mesh.position.sub(pushBack.clone().multiplyScalar(vehicleRatio * 0.2)); // Boss barely moves

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
        vehicle.velocity.add(impulse.clone().multiplyScalar(bossRatio));
        if (this.velocity) {
          this.velocity.sub(impulse.clone().multiplyScalar(vehicleRatio * 0.1));
        }

        // Strong friction for vehicle during collision
        vehicle.velocity.multiplyScalar(0.6);
      }
    }

    // Apply damage to vehicle on collision
    const now = Date.now();
    const cooldown = 1000; // 1 second between collision damage
    
    if (!vehicle.lastBossCollisionDamage || now - vehicle.lastBossCollisionDamage > cooldown) {
      // Calculate damage based on boss's damage stat
      const damage = this.damage * (this.currentState === 'enraged' ? 1.5 : 1.0);
      vehicle.takeDamage(damage);
      
      // Update collision damage timestamp
      vehicle.lastBossCollisionDamage = now;
    }
  }

  /**
   * TEMPORARY: Handle perimeter roaming for model examination
   * @param {number} delta Time since last update in seconds
   */
  handlePerimeterRoaming(delta) {
    // Initialize waypoints if not defined
    if (!this.perimeterWaypoints) {
      // Define a set of points around the perimeter of the map
      // Using a 160x160 map size as in the original getPatrolPoint method
      const mapSize = 160;
      const margin = 20; // Stay this far from the edge
      
      this.perimeterWaypoints = [
        new THREE.Vector3(-mapSize/2 + margin, 0, -mapSize/2 + margin),  // Top left
        new THREE.Vector3(mapSize/2 - margin, 0, -mapSize/2 + margin),   // Top right
        new THREE.Vector3(mapSize/2 - margin, 0, mapSize/2 - margin),    // Bottom right
        new THREE.Vector3(-mapSize/2 + margin, 0, mapSize/2 - margin)    // Bottom left
      ];
      
      // Start at the first waypoint
      this.currentWaypointIndex = 0;
      this.nextWaypoint = this.perimeterWaypoints[0];
    }
    
    // Move towards the current waypoint
    const slowSpeed = this.speed; // Move at full speed for better observation
    this.moveTowards(this.nextWaypoint, slowSpeed, delta);
    
    // Check if we've reached the waypoint
    if (this.mesh.position.distanceTo(this.nextWaypoint) < 5) {
      // Move to the next waypoint
      this.currentWaypointIndex = (this.currentWaypointIndex + 1) % this.perimeterWaypoints.length;
      this.nextWaypoint = this.perimeterWaypoints[this.currentWaypointIndex];
      
      // Pause briefly at each corner
      // This isn't actually implementing a pause, but in a full implementation we would
    }
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
   * Move towards a target position
   * @param {THREE.Vector3} targetPosition Position to move towards
   * @param {number} speed Speed to move at
   * @param {number} delta Time since last update
   */
  moveTowards(targetPosition, speed, delta) {
    // Get direction to target
    const direction = targetPosition.clone().sub(this.mesh.position).normalize();

    // Calculate desired velocity
    this.velocity.x = direction.x * speed;
    this.velocity.z = direction.z * speed;

    // Apply velocity
    this.mesh.position.x += this.velocity.x * delta;
    this.mesh.position.z += this.velocity.z * delta;

    // Look in direction of movement
    this.lookAt(targetPosition);
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

    // Choose a weapon based on state and cooldowns
    let weapon = 'ram';

    if (this.currentState === 'enraged') {
      if (time - this.lastWeaponUse.flamethrower > this.weaponCooldowns.flamethrower) {
        weapon = 'flamethrower';
      } else if (time - this.lastWeaponUse.ram > this.weaponCooldowns.ram) {
        weapon = 'ram';
      }
    } else {
      // Choose weapon based on distance and cooldowns
      const distance = this.mesh.position.distanceTo(this.target.vehicle.mesh.position);

      if (distance < 10 && time - this.lastWeaponUse.ram > this.weaponCooldowns.ram) {
        weapon = 'ram';
      } else if (distance < 30 && time - this.lastWeaponUse.flamethrower > this.weaponCooldowns.flamethrower) {
        weapon = 'flamethrower';
      } else if (time - this.lastWeaponUse.freezeMissile > this.weaponCooldowns.freezeMissile) {
        weapon = 'freezeMissile';
      }
    }

    // Use the chosen weapon
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
    // This would normally spawn a missile projectile that tracks the target

    // In a full implementation, we'd create a missile object that moves
    // and applies a freeze effect on hit
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
   * @returns {boolean} True if the boss was destroyed
   */
  takeDamage(amount, attacker) {
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

    // Check if destroyed
    return this.health <= 0;
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
} 