import * as THREE from 'three';

/**
 * Creates the Washington D.C. map
 * @param {THREE.Scene} scene The Three.js scene
 * @returns {Object} The map object with helper methods
 */
export function createMap(scene) {
  // Map dimensions - Doubled in size
  const mapWidth = 320;
  const mapLength = 480; // Longer in z-direction

  // Storage for map elements
  const objects = [];
  const colliders = [];
  const playerSpawnPoints = [];
  const bossSpawnPoints = [];
  const pickupSpawnPoints = [];

  // Create ground with National Mall layout
  const ground = createNationalMallGround(mapWidth, mapLength);
  scene.add(ground);
  objects.push(ground);

  // Create boundary walls with image displays
  const walls = createBoundaryWallsWithText(mapWidth, mapLength, scene);
  walls.forEach(wall => {
    scene.add(wall);
    objects.push(wall);

    // Add wall collider
    const collider = new THREE.Box3().setFromObject(wall);
    colliders.push(collider);
  });

  // Create Washington Monument at south side - enlarged for more realism
  const washingtonMonument = createWashingtonMonument();
  washingtonMonument.position.set(0, 0, mapLength / 2 - 30); // Moved closer to south wall, 30 units from edge
  scene.add(washingtonMonument);
  objects.push(washingtonMonument);

  // Add monument collider
  const monumentCollider = new THREE.Box3().setFromObject(washingtonMonument);
  colliders.push(monumentCollider);

  // Create Capitol Building at north side - wider to nearly touch walls
  const capitolBuilding = createCapitolBuilding(mapWidth);
  capitolBuilding.position.set(0, 0, -mapLength / 2 + 60); // 60 units from north edge (scaled up)
  scene.add(capitolBuilding);
  objects.push(capitolBuilding);

  // Add Capitol Building collider - using precise colliders instead of one bounding box
  const capitolColliders = createCapitolBuildingColliders(capitolBuilding, mapWidth);
  colliders.push(...capitolColliders);

  // Create player spawn points - Repositioned to north side, near Capitol, facing the Washington Monument (south)
  const spawnCount = 8;
  const spawnWidth = mapWidth * 0.6; // Spawn within 60% of the map width
  for (let i = 0; i < spawnCount; i++) {
    const xPos = (i / (spawnCount - 1) - 0.5) * spawnWidth; // Evenly distributed across the width
    const zPos = 0; // Center of the map in z-direction

    playerSpawnPoints.push({
      position: new THREE.Vector3(xPos, 0, zPos),
      rotation: 0 // Facing south (towards the Washington Monument)
    });

    // Debug visualization of spawn points
    /*
    const marker = new THREE.Mesh(
      new THREE.CylinderGeometry(0.5, 0.5, 3, 8),
      new THREE.MeshBasicMaterial({ color: 0x00ff00 })
    );
    marker.position.set(xPos, 1.5, zPos);
    scene.add(marker);
    */
  }

  // Create washington monument spawn points (for portal entries)
  const washingtonSpawnPoints = [];
  for (let i = 0; i < spawnCount; i++) {
    const xPos = (i / (spawnCount - 1) - 0.5) * spawnWidth; // Evenly distributed across the width
    const zPos = mapLength / 2 - 60; // Near the Washington Monument
    
    washingtonSpawnPoints.push({
      position: new THREE.Vector3(xPos, 0, zPos),
      rotation: Math.PI // Facing north (towards the Capitol Building)
    });
  }

  // Create capitol building spawn points (for normal spawns)
  const capitolSpawnPoints = [];
  for (let i = 0; i < spawnCount; i++) {
    const xPos = (i / (spawnCount - 1) - 0.5) * spawnWidth; // Evenly distributed across the width
    const zPos = -mapLength / 2 + 135; // Near the Capitol Building
    
    capitolSpawnPoints.push({
      position: new THREE.Vector3(xPos, 0, zPos),
      rotation: 0 // Facing south (towards the Washington Monument)
    });
  }

  // Create boss spawn point - moved further south
  bossSpawnPoints.push({
    position: new THREE.Vector3(0, 0, mapLength / 3), // Near the Washington Monument
    rotation: Math.PI // Facing north towards Capitol
  });

  // Update pickup locations for larger map
  const pickupLocations = [
    // Near Capitol
    { x: -60, z: -mapLength / 2 + 100 },
    { x: 60, z: -mapLength / 2 + 100 },

    // Near Washington Monument
    { x: -60, z: mapLength / 2 - 80 },
    { x: 60, z: mapLength / 2 - 80 },

    // Along the main central path
    { x: 0, z: -mapLength / 4 },
    { x: 0, z: mapLength / 4 },

    // In the quadrants
    { x: -80, z: -80 },
    { x: 80, z: -80 },
    { x: -80, z: 80 },
    { x: 80, z: 80 },

    // Center area pickup points
    { x: -30, z: 0 },
    { x: 30, z: 0 }
  ];

  pickupLocations.forEach(loc => {
    pickupSpawnPoints.push({
      position: new THREE.Vector3(loc.x, 1, loc.z)
    });

    // Debug visualization of pickup points
    /*
    const marker = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshBasicMaterial({ color: 0x0000ff })
    );
    marker.position.set(loc.x, 1, loc.z);
    scene.add(marker);
    */
  });

  // Return map object with methods
  return {
    objects,
    colliders,

    // Get random player spawn point
    getPlayerSpawnPoint: (fromPortal = false) => {
      if (fromPortal) {
        // Spawn near Washington Monument if entering through portal
        const index = Math.floor(Math.random() * washingtonSpawnPoints.length);
        return washingtonSpawnPoints[index];
      } else {
        // Spawn near Capitol Building for normal spawns
        const index = Math.floor(Math.random() * capitolSpawnPoints.length);
        return capitolSpawnPoints[index];
      }
    },

    // Get boss spawn point
    getBossSpawnPoint: () => {
      return bossSpawnPoints[0];
    },

    // Get random pickup spawn point
    getPickupSpawnPoint: () => {
      const index = Math.floor(Math.random() * pickupSpawnPoints.length);
      return pickupSpawnPoints[index];
    },

    // Check if position is within map bounds
    isInBounds: (position) => {
      return position.x > -mapWidth / 2 &&
        position.x < mapWidth / 2 &&
        position.z > -mapLength / 2 &&
        position.z < mapLength / 2;
    },

    // Get map dimensions
    getDimensions: () => {
      return { width: mapWidth, length: mapLength };
    }
  };
}

/**
 * Creates the National Mall ground with lawn areas and pathways
 * @param {number} width Width of the ground
 * @param {number} length Length of the ground
 * @returns {THREE.Group} Group containing the ground elements
 */
function createNationalMallGround(width, length) {
  const group = new THREE.Group();

  // Base ground (grassy areas)
  const groundGeometry = new THREE.PlaneGeometry(width, length, 32, 32);
  const groundMaterial = new THREE.MeshStandardMaterial({
    color: 0x4ca64c, // Green for grass
    roughness: 0.9,
    metalness: 0.0
  });

  const ground = new THREE.Mesh(groundGeometry, groundMaterial);
  ground.rotation.x = -Math.PI / 2; // Rotate to horizontal
  ground.receiveShadow = true;
  group.add(ground);

  // Create pathways
  const pathways = createPathways(width, length);
  group.add(pathways);

  return group;
}

/**
 * Creates the National Mall pathways
 * @param {number} width Map width
 * @param {number} length Map length
 * @returns {THREE.Group} Group containing pathway meshes
 */
function createPathways(width, length) {
  const group = new THREE.Group();

  // Pathway material
  const pathMaterial = new THREE.MeshStandardMaterial({
    color: 0xd2b48c, // Tan color for paths
    roughness: 0.8,
    metalness: 0.1
  });

  // Central main path (from Capitol to Washington Monument)
  const mainPathWidth = 12;
  const mainPath = new THREE.Mesh(
    new THREE.PlaneGeometry(mainPathWidth, length * 0.9, 1, 1),
    pathMaterial
  );
  mainPath.rotation.x = -Math.PI / 2;
  mainPath.position.y = 0.02; // Slightly above ground to prevent z-fighting
  group.add(mainPath);

  // Horizontal cross paths (east-west)
  const crossPathCount = 4;
  const crossPathSpacing = length / (crossPathCount + 1);

  for (let i = 1; i <= crossPathCount; i++) {
    const zPos = -length / 2 + (i * crossPathSpacing);

    const crossPath = new THREE.Mesh(
      new THREE.PlaneGeometry(width * 0.8, 8, 1, 1),
      pathMaterial
    );
    crossPath.rotation.x = -Math.PI / 2;
    crossPath.position.set(0, 0.02, zPos);
    group.add(crossPath);
  }

  // Vertical side paths (north-south)
  const verticalPathCount = 4; // 2 on each side of main path
  const verticalPathSpacing = width / 6; // Spacing between vertical paths

  for (let i = 1; i <= verticalPathCount / 2; i++) {
    // Left side paths
    const leftPath = new THREE.Mesh(
      new THREE.PlaneGeometry(8, length * 0.8, 1, 1),
      pathMaterial
    );
    leftPath.rotation.x = -Math.PI / 2;
    leftPath.position.set(-i * verticalPathSpacing, 0.02, 0);
    group.add(leftPath);

    // Right side paths
    const rightPath = new THREE.Mesh(
      new THREE.PlaneGeometry(8, length * 0.8, 1, 1),
      pathMaterial
    );
    rightPath.rotation.x = -Math.PI / 2;
    rightPath.position.set(i * verticalPathSpacing, 0.02, 0);
    group.add(rightPath);
  }

  return group;
}

/**
 * Creates the Washington Monument
 * @returns {THREE.Group} Washington Monument model
 */
function createWashingtonMonument() {
  const group = new THREE.Group();

  // Create material for monument - already white
  const material = new THREE.MeshStandardMaterial({
    color: 0xffffff, // Pure white
    roughness: 0.5,
    metalness: 0.1
  });

  // Create base - smaller and flatter
  const baseGeometry = new THREE.BoxGeometry(20, 2, 20);
  const base = new THREE.Mesh(baseGeometry, material);
  base.position.y = 1;
  base.castShadow = true;
  base.receiveShadow = true;
  group.add(base);

  // Create obelisk body - straight sides
  const bodyWidth = 10;
  const bodyHeight = 110;
  const bodyGeometry = new THREE.BoxGeometry(bodyWidth, bodyHeight, bodyWidth);
  const body = new THREE.Mesh(bodyGeometry, material);
  body.position.y = bodyHeight / 2 + 2; // Position above base
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  // Create pyramidal top
  const pyramidHeight = 15;
  const pyramidGeometry = new THREE.ConeGeometry(bodyWidth / 2 * 1.414, pyramidHeight, 4); // Square base cone
  const pyramid = new THREE.Mesh(pyramidGeometry, material);
  pyramid.position.y = bodyHeight + 2 + pyramidHeight / 2; // Position above body
  pyramid.rotation.y = Math.PI / 4; // Rotate 45 degrees to align with body
  pyramid.castShadow = true;
  pyramid.receiveShadow = true;
  group.add(pyramid);

  return group;
}

/**
 * Creates the Capitol Building
 * @param {number} mapWidth The width of the map (for sizing)
 * @returns {THREE.Group} Capitol Building model
 */
function createCapitolBuilding(mapWidth) {
  const group = new THREE.Group();

  // Create material for Capitol Building
  const material = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.5,
    metalness: 0.1
  });

  // Determine width based on map dimensions
  const buildingWidth = mapWidth * 0.85; // 85% of map width to leave minimal gap
  const mainWidth = buildingWidth * 0.6; // Main building is 60% of total width
  const wingWidth = (buildingWidth - mainWidth) / 2; // Each wing takes up the remaining space

  // Main building base
  const baseGeometry = new THREE.BoxGeometry(mainWidth, 20, 60);
  const base = new THREE.Mesh(baseGeometry, material);
  base.position.y = 10;
  base.castShadow = true;
  base.receiveShadow = true;
  group.add(base);

  // Create steps leading up to the Capitol - at the south side (front) of the building
  const stepsGeometry = new THREE.BoxGeometry(mainWidth * 0.7, 4, 20);
  const steps = new THREE.Mesh(stepsGeometry, material);
  steps.position.set(0, 2, 40); // Positive Z is south (front) in the scene
  steps.castShadow = true;
  steps.receiveShadow = true;
  group.add(steps);

  // Create left wing
  const leftWingGeometry = new THREE.BoxGeometry(wingWidth, 30, 50);
  const leftWing = new THREE.Mesh(leftWingGeometry, material);
  leftWing.position.set(-(mainWidth / 2 + wingWidth / 2), 15, 0);
  leftWing.castShadow = true;
  leftWing.receiveShadow = true;
  group.add(leftWing);

  // Create right wing
  const rightWingGeometry = new THREE.BoxGeometry(wingWidth, 30, 50);
  const rightWing = new THREE.Mesh(rightWingGeometry, material);
  rightWing.position.set(mainWidth / 2 + wingWidth / 2, 15, 0);
  rightWing.castShadow = true;
  rightWing.receiveShadow = true;
  group.add(rightWing);

  // Create central portico (columned entrance) - at the south side (front)
  const porticoGeometry = new THREE.BoxGeometry(mainWidth * 0.4, 30, 20);
  const portico = new THREE.Mesh(porticoGeometry, material);
  portico.position.set(0, 15, 40); // Aligned with steps
  portico.castShadow = true;
  portico.receiveShadow = true;
  group.add(portico);

  // Create columns for the portico - positioned in front of portico (further south)
  const columnCount = 8;
  const porticoWidth = mainWidth * 0.4;
  const columnSpacing = (porticoWidth - 8) / (columnCount - 1);
  for (let i = 0; i < columnCount; i++) {
    const columnGeometry = new THREE.CylinderGeometry(2, 2, 24, 8);
    const column = new THREE.Mesh(columnGeometry, material);
    // Position columns in a single row in front of the portico
    column.position.set(-porticoWidth / 2 + 4 + i * columnSpacing, 12, 50);
    column.castShadow = true;
    column.receiveShadow = true;
    group.add(column);
  }

  // Create the dome - centered on the main building
  const domeGeometry = new THREE.SphereGeometry(20, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2);
  const dome = new THREE.Mesh(domeGeometry, material);
  dome.position.set(0, 30, 0); // Centered on the building
  dome.castShadow = true;
  dome.receiveShadow = true;
  group.add(dome);

  // Create the dome base
  const domeBaseGeometry = new THREE.CylinderGeometry(24, 24, 10, 16);
  const domeBase = new THREE.Mesh(domeBaseGeometry, material);
  domeBase.position.set(0, 25, 0); // Centered under the dome
  domeBase.castShadow = true;
  domeBase.receiveShadow = true;
  group.add(domeBase);

  // Create the small dome top
  const domeTipGeometry = new THREE.CylinderGeometry(1, 4, 6, 8);
  const domeTip = new THREE.Mesh(domeTipGeometry, material);
  domeTip.position.set(0, 44, 0); // On top of the dome
  domeTip.castShadow = true;
  domeTip.receiveShadow = true;
  group.add(domeTip);

  // Create backdoor entrance
  const entranceWidth = mainWidth * 0.5;
  const entranceHeight = 24;
  const entranceDepth = 48;

  // Cut out entrance from main building using CSG or by creating a tunnel
  const entranceGeometry = new THREE.BoxGeometry(entranceWidth, entranceHeight, entranceDepth);
  const entrance = new THREE.Mesh(entranceGeometry, material);
  entrance.position.set(0, entranceHeight / 2, -25); // Place on north side
  group.add(entrance);

  // Add subtle pink polka dot markers leading to entrance
  const dotMaterial = new THREE.MeshStandardMaterial({
    color: 0xff69b4,
    emissive: 0xff69b4,
    emissiveIntensity: 0.3
  });

  [-2, -1, 0, 1, 2].forEach(x => {
    const dot = new THREE.Mesh(
      new THREE.CircleGeometry(0.5, 16),
      dotMaterial
    );
    dot.rotation.x = -Math.PI / 2; // Lay flat
    dot.position.set(x * 2, 0.1, -35); // Trail leading to entrance
    group.add(dot);
  });

  return group;
}

/**
 * Creates precise colliders for the Capitol Building
 * @param {THREE.Group} capitolBuilding The Capitol Building group
 * @param {number} mapWidth The width of the map
 * @returns {Array<THREE.Box3>} Array of collider boxes
 */
function createCapitolBuildingColliders(capitolBuilding, mapWidth) {
  const colliders = [];
  const buildingWidth = mapWidth * 0.85; // 85% of map width
  const mainWidth = buildingWidth * 0.6; // Main building is 60% of total width
  const wingWidth = (buildingWidth - mainWidth) / 2; // Each wing takes up the remaining space

  // Extract building position for offset calculations
  const buildingPosition = capitolBuilding.position.clone();

  // Main building base collider
  const baseCollider = new THREE.Box3();
  baseCollider.set(
    new THREE.Vector3(
      buildingPosition.x - mainWidth / 2,
      buildingPosition.y,
      buildingPosition.z - 30
    ),
    new THREE.Vector3(
      buildingPosition.x + mainWidth / 2,
      buildingPosition.y + 20,
      buildingPosition.z + 30
    )
  );
  colliders.push(baseCollider);

  // Left wing collider - more precise to match visual shape
  const leftWingCollider = new THREE.Box3();
  leftWingCollider.set(
    new THREE.Vector3(
      buildingPosition.x - (mainWidth / 2 + wingWidth),
      buildingPosition.y,
      buildingPosition.z - 25
    ),
    new THREE.Vector3(
      buildingPosition.x - mainWidth / 2,
      buildingPosition.y + 30,
      buildingPosition.z + 25
    )
  );
  colliders.push(leftWingCollider);

  // Right wing collider - more precise to match visual shape
  const rightWingCollider = new THREE.Box3();
  rightWingCollider.set(
    new THREE.Vector3(
      buildingPosition.x + mainWidth / 2,
      buildingPosition.y,
      buildingPosition.z - 25
    ),
    new THREE.Vector3(
      buildingPosition.x + (mainWidth / 2 + wingWidth),
      buildingPosition.y + 30,
      buildingPosition.z + 25
    )
  );
  colliders.push(rightWingCollider);

  // Portico (front entrance) collider - more precise to match visual shape
  const porticoWidth = mainWidth * 0.4;
  const porticoCollider = new THREE.Box3();
  porticoCollider.set(
    new THREE.Vector3(
      buildingPosition.x - porticoWidth / 2,
      buildingPosition.y,
      buildingPosition.z + 30
    ),
    new THREE.Vector3(
      buildingPosition.x + porticoWidth / 2,
      buildingPosition.y + 30,
      buildingPosition.z + 50
    )
  );
  colliders.push(porticoCollider);

  // Dome collider - using a box that approximates the dome's circular base
  const domeRadius = 24; // Match the dome base radius
  const domeCollider = new THREE.Box3();
  domeCollider.set(
    new THREE.Vector3(
      buildingPosition.x - domeRadius,
      buildingPosition.y + 20,
      buildingPosition.z - domeRadius
    ),
    new THREE.Vector3(
      buildingPosition.x + domeRadius,
      buildingPosition.y + 44, // Height of the dome tip
      buildingPosition.z + domeRadius
    )
  );
  colliders.push(domeCollider);

  // Steps collider (for better precision)
  const stepsWidth = mainWidth * 0.7;
  const stepsCollider = new THREE.Box3();
  stepsCollider.set(
    new THREE.Vector3(
      buildingPosition.x - stepsWidth / 2,
      buildingPosition.y,
      buildingPosition.z + 50
    ),
    new THREE.Vector3(
      buildingPosition.x + stepsWidth / 2,
      buildingPosition.y + 4,
      buildingPosition.z + 60
    )
  );
  colliders.push(stepsCollider);

  return colliders;
}

// Billboard class for displaying signs above walls
class Billboard {
  constructor(scene, textureURLs, width, height, position, rotation) {
    this.scene = scene;
    this.textureURLs = Array.isArray(textureURLs) ? textureURLs : [textureURLs];
    this.width = width;
    this.height = height;
    this.position = position;
    this.rotation = rotation;
    this.mesh = null;
    this.light = null;
    this.currentTextureIndex = 0;
    this.textures = [];

    // Load all textures
    this.loadTextures();

    // Set up initial billboard
    this.createBillboard();

    // Set up interval to change textures
    this.startImageRotation();
  }

  loadTextures() {
    const textureLoader = new THREE.TextureLoader();
    this.textureURLs.forEach(url => {
      const texture = textureLoader.load(url);
      this.textures.push(texture);
    });
  }

  createBillboard() {
    // Create material with texture
    const material = new THREE.MeshBasicMaterial({
      map: this.textures[this.currentTextureIndex],
      side: THREE.DoubleSide,
      transparent: true
    });

    // Create billboard mesh
    this.mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(this.width, this.height),
      material
    );

    // Set position and rotation
    this.mesh.position.copy(this.position);
    this.mesh.rotation.copy(this.rotation);

    // Add light to make the billboard more visible
    this.light = new THREE.PointLight(0xffffff, 1, 50);
    this.light.position.set(
      this.position.x,
      this.position.y + 3, // Light positioned above the billboard
      this.position.z
    );

    // Add to scene
    this.scene.add(this.mesh);
    this.scene.add(this.light);
  }

  startImageRotation() {
    setInterval(() => {
      this.currentTextureIndex = (this.currentTextureIndex + 1) % this.textures.length;
      this.updateTexture();
    }, 10000); // Change every 5 seconds
  }

  updateTexture() {
    if (this.mesh) {
      this.mesh.material.map = this.textures[this.currentTextureIndex];
      this.mesh.material.needsUpdate = true;
    }
  }
}

/**
 * Creates boundary walls with image displays
 * @param {number} width Width of the map
 * @param {number} length Length of the map
 * @param {THREE.Scene} scene The scene to add animations to
 * @returns {Array<THREE.Mesh>} Array of wall meshes
 */
function createBoundaryWallsWithText(width, length, scene) {
  const walls = [];
  const wallHeight = 20;
  const wallThickness = 4;

  // Create materials
  const wallMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff, // White
    roughness: 0.6,
    metalness: 0.2
  });

  // North wall
  const northWall = new THREE.Mesh(
    new THREE.BoxGeometry(width, wallHeight, wallThickness),
    wallMaterial
  );
  northWall.position.set(0, wallHeight / 2, -length / 2 - wallThickness / 2);
  northWall.castShadow = true;
  northWall.receiveShadow = true;
  walls.push(northWall);

  // South wall
  const southWall = new THREE.Mesh(
    new THREE.BoxGeometry(width, wallHeight, wallThickness),
    wallMaterial
  );
  southWall.position.set(0, wallHeight / 2, length / 2 + wallThickness / 2);
  southWall.castShadow = true;
  southWall.receiveShadow = true;
  walls.push(southWall);

  // East wall
  const eastWall = new THREE.Mesh(
    new THREE.BoxGeometry(wallThickness, wallHeight, length),
    wallMaterial
  );
  eastWall.position.set(width / 2 + wallThickness / 2, wallHeight / 2, 0);
  eastWall.castShadow = true;
  eastWall.receiveShadow = true;
  walls.push(eastWall);

  // All SVG images in assets
  const svgImages = [
    '/src/assets/www.maddoxsouthard.com.svg',
    '/src/assets/www.drive865.com.svg',
    '/src/assets/www.nsmbl.io.svg'
  ];

  // East wall billboard - positioned on top of the wall
  const eastBillboardPosition = new THREE.Vector3(
    width / 2 + wallThickness / 2,           // Same x as wall
    wallHeight + (length * 0.25 * 0.2) / 2, // Top of wall + half billboard height
    0                                    // Same z as wall
  );
  const eastBillboardRotation = new THREE.Euler(0, -Math.PI / 2, 0);

  const eastBillboard = new Billboard(
    scene,
    svgImages,
    length * 0.25,                 // Width
    length * 0.25 * 0.2,           // Height
    eastBillboardPosition,
    eastBillboardRotation
  );

  // West wall
  const westWall = new THREE.Mesh(
    new THREE.BoxGeometry(wallThickness, wallHeight, length),
    wallMaterial
  );
  westWall.position.set(-width / 2 - wallThickness / 2, wallHeight / 2, 0);
  westWall.castShadow = true;
  westWall.receiveShadow = true;
  walls.push(westWall);

  // West wall billboard - positioned on top of the wall
  const westBillboardPosition = new THREE.Vector3(
    -width / 2 - wallThickness / 2,           // Same x as wall
    wallHeight + (length * 0.25 * 0.2) / 2,  // Top of wall + half billboard height
    0                                     // Same z as wall
  );
  const westBillboardRotation = new THREE.Euler(0, Math.PI / 2, 0);

  const westBillboard = new Billboard(
    scene,
    svgImages,
    length * 0.25,                 // Width
    length * 0.25 * 0.2,           // Height
    westBillboardPosition,
    westBillboardRotation
  );

  return walls;
} 