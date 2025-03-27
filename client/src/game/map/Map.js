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
  
  // Create boundary walls with rotating text displays
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
  washingtonMonument.position.set(0, 0, mapLength/2 - 50); // 50 units from south edge (scaled up)
  scene.add(washingtonMonument);
  objects.push(washingtonMonument);
  
  // Add monument collider
  const monumentCollider = new THREE.Box3().setFromObject(washingtonMonument);
  colliders.push(monumentCollider);
  
  // Create Capitol Building at north side - wider to nearly touch walls
  const capitolBuilding = createCapitolBuilding(mapWidth);
  capitolBuilding.position.set(0, 0, -mapLength/2 + 60); // 60 units from north edge (scaled up)
  scene.add(capitolBuilding);
  objects.push(capitolBuilding);
  
  // Add Capitol Building collider
  const capitolCollider = new THREE.Box3().setFromObject(capitolBuilding);
  colliders.push(capitolCollider);
  
  // Create trees and decorative elements
  const decorations = createTreesAndDecorations(mapWidth, mapLength);
  decorations.forEach(decoration => {
    scene.add(decoration);
    objects.push(decoration);
    
    // Add decoration collider
    const collider = new THREE.Box3().setFromObject(decoration);
    colliders.push(collider);
  });
  
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
  
  // Create boss spawn point - moved further south
  bossSpawnPoints.push({
    position: new THREE.Vector3(0, 0, mapLength/3), // Near the Washington Monument
    rotation: Math.PI // Facing north towards Capitol
  });
  
  // Update pickup locations for larger map
  const pickupLocations = [
    // Near Capitol
    { x: -60, z: -mapLength/2 + 100 },
    { x: 60, z: -mapLength/2 + 100 },
    
    // Near Washington Monument
    { x: -60, z: mapLength/2 - 80 },
    { x: 60, z: mapLength/2 - 80 },
    
    // Along the main central path
    { x: 0, z: -mapLength/4 },
    { x: 0, z: mapLength/4 },
    
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
    getPlayerSpawnPoint: () => {
      const index = Math.floor(Math.random() * playerSpawnPoints.length);
      return playerSpawnPoints[index];
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
      return position.x > -mapWidth/2 && 
             position.x < mapWidth/2 && 
             position.z > -mapLength/2 && 
             position.z < mapLength/2;
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
    const zPos = -length/2 + (i * crossPathSpacing);
    
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
  
  // Create base - larger for more realism
  const baseGeometry = new THREE.BoxGeometry(36, 6, 36);
  const base = new THREE.Mesh(baseGeometry, material);
  base.position.y = 3;
  base.castShadow = true;
  base.receiveShadow = true;
  group.add(base);
  
  // Create obelisk - taller and thicker for more realism
  const obeliskHeight = 120; // Increased height
  const segments = 5;
  const segmentHeight = obeliskHeight / segments;
  
  for (let i = 0; i < segments; i++) {
    const topRadius = Math.max(0.6, 5 * (1 - (i + 1) / segments)); // Thicker
    const bottomRadius = 5 * (1 - i / segments); // Thicker
    
    const segmentGeometry = new THREE.CylinderGeometry(
      topRadius, bottomRadius, segmentHeight, 4
    );
    
    const segment = new THREE.Mesh(segmentGeometry, material);
    segment.position.y = 6 + segmentHeight/2 + i * segmentHeight;
    segment.castShadow = true;
    segment.receiveShadow = true;
    group.add(segment);
  }
  
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
    color: 0xffffff, // Pure white
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
  leftWing.position.set(-(mainWidth/2 + wingWidth/2), 15, 0);
  leftWing.castShadow = true;
  leftWing.receiveShadow = true;
  group.add(leftWing);
  
  // Create right wing
  const rightWingGeometry = new THREE.BoxGeometry(wingWidth, 30, 50);
  const rightWing = new THREE.Mesh(rightWingGeometry, material);
  rightWing.position.set(mainWidth/2 + wingWidth/2, 15, 0);
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
    column.position.set(-porticoWidth/2 + 4 + i * columnSpacing, 12, 50);
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
  
  return group;
}

/**
 * Creates boundary walls with rotating text displays
 * @param {number} width Width of the map
 * @param {number} length Length of the map
 * @param {THREE.Scene} scene The scene to add animations to
 * @returns {Array<THREE.Group>} Array of wall groups with text displays
 */
function createBoundaryWallsWithText(width, length, scene) {
  const walls = [];
  const wallHeight = 20;
  const wallThickness = 4;
  
  // Create material for walls - changed to white
  const wallMaterial = new THREE.MeshStandardMaterial({ 
    color: 0xffffff, // Pure white
    roughness: 0.6,
    metalness: 0.2
  });
  
  // Create text to display - array of strings that will rotate
  const textStrings = [
    "NSMBL.IO",
    "www.maddoxsouthard.com",
    "drive865.com"
  ];
  
  // North wall with text
  const northWallGroup = new THREE.Group();
  
  const northWallGeometry = new THREE.BoxGeometry(width, wallHeight, wallThickness);
  const northWall = new THREE.Mesh(northWallGeometry, wallMaterial);
  northWall.position.set(0, wallHeight/2, -length/2 - wallThickness/2);
  northWall.castShadow = true;
  northWall.receiveShadow = true;
  northWallGroup.add(northWall);
  
  // Add text display to north wall
  const northTextDisplay = createRotatingTextDisplay(textStrings, width * 0.8, scene);
  northTextDisplay.position.set(0, wallHeight * 0.6, -length/2 - wallThickness);
  northTextDisplay.rotation.y = Math.PI;
  northWallGroup.add(northTextDisplay);
  
  walls.push(northWallGroup);
  
  // South wall with text
  const southWallGroup = new THREE.Group();
  
  const southWallGeometry = new THREE.BoxGeometry(width, wallHeight, wallThickness);
  const southWall = new THREE.Mesh(southWallGeometry, wallMaterial);
  southWall.position.set(0, wallHeight/2, length/2 + wallThickness/2);
  southWall.castShadow = true;
  southWall.receiveShadow = true;
  southWallGroup.add(southWall);
  
  // Add text display to south wall
  const southTextDisplay = createRotatingTextDisplay(textStrings, width * 0.8, scene);
  southTextDisplay.position.set(0, wallHeight * 0.6, length/2 + wallThickness);
  southWallGroup.add(southTextDisplay);
  
  walls.push(southWallGroup);
  
  // East wall with text
  const eastWallGroup = new THREE.Group();
  
  const eastWallGeometry = new THREE.BoxGeometry(wallThickness, wallHeight, length);
  const eastWall = new THREE.Mesh(eastWallGeometry, wallMaterial);
  eastWall.position.set(width/2 + wallThickness/2, wallHeight/2, 0);
  eastWall.castShadow = true;
  eastWall.receiveShadow = true;
  eastWallGroup.add(eastWall);
  
  // Add text display to east wall
  const eastTextDisplay = createRotatingTextDisplay(textStrings, length * 0.8, scene);
  eastTextDisplay.position.set(width/2 + wallThickness, wallHeight * 0.6, 0);
  eastTextDisplay.rotation.y = -Math.PI / 2;
  eastWallGroup.add(eastTextDisplay);
  
  walls.push(eastWallGroup);
  
  // West wall with text
  const westWallGroup = new THREE.Group();
  
  const westWallGeometry = new THREE.BoxGeometry(wallThickness, wallHeight, length);
  const westWall = new THREE.Mesh(westWallGeometry, wallMaterial);
  westWall.position.set(-width/2 - wallThickness/2, wallHeight/2, 0);
  westWall.castShadow = true;
  westWall.receiveShadow = true;
  westWallGroup.add(westWall);
  
  // Add text display to west wall
  const westTextDisplay = createRotatingTextDisplay(textStrings, length * 0.8, scene);
  westTextDisplay.position.set(-width/2 - wallThickness, wallHeight * 0.6, 0);
  westTextDisplay.rotation.y = Math.PI / 2;
  westWallGroup.add(westTextDisplay);
  
  walls.push(westWallGroup);
  
  return walls;
}

/**
 * Creates a rotating text display for the wall
 * @param {Array<string>} textStrings Array of strings to display in rotation
 * @param {number} width Width of the text display
 * @param {THREE.Scene} scene Scene to add animation to
 * @returns {THREE.Group} Group containing the text display
 */
function createRotatingTextDisplay(textStrings, width, scene) {
  const textGroup = new THREE.Group();
  
  // Create a canvas to generate texture for text
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = 1024;
  canvas.height = 128;
  
  // Create display panel
  const panelGeometry = new THREE.PlaneGeometry(width, width * 0.1);
  const panelMaterial = new THREE.MeshBasicMaterial({ 
    color: 0x000000,
    opacity: 0.7,
    transparent: true
  });
  const panel = new THREE.Mesh(panelGeometry, panelMaterial);
  textGroup.add(panel);
  
  // Create text mesh with initial text
  const textTexture = new THREE.CanvasTexture(canvas);
  const textMaterial = new THREE.MeshBasicMaterial({
    map: textTexture,
    transparent: true
  });
  
  const textMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(width, width * 0.08),
    textMaterial
  );
  textMesh.position.z = 0.1; // Slightly in front of the panel
  textGroup.add(textMesh);
  
  // Draw initial text
  updateTextTexture(ctx, textStrings[0], canvas.width, canvas.height);
  textTexture.needsUpdate = true;
  
  // Set up text rotation
  let currentTextIndex = 0;
  const textRotationInterval = 5000; // 5 seconds per text string
  
  function rotateText() {
    currentTextIndex = (currentTextIndex + 1) % textStrings.length;
    updateTextTexture(ctx, textStrings[currentTextIndex], canvas.width, canvas.height);
    textTexture.needsUpdate = true;
  }
  
  // Set up interval for rotating text
  const intervalId = setInterval(rotateText, textRotationInterval);
  
  // Store interval ID on the mesh to clean up later if needed
  textMesh.userData.intervalId = intervalId;
  
  return textGroup;
}

/**
 * Updates the text texture with new text
 * @param {CanvasRenderingContext2D} ctx Canvas context
 * @param {string} text Text to draw
 * @param {number} width Canvas width
 * @param {number} height Canvas height
 */
function updateTextTexture(ctx, text, width, height) {
  // Clear canvas
  ctx.clearRect(0, 0, width, height);
  
  // Set text properties
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 72px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  // Draw text
  ctx.fillText(text, width / 2, height / 2);
}

/**
 * Creates trees and decorative elements for the National Mall
 * @param {number} width Map width
 * @param {number} length Map length
 * @returns {Array<THREE.Object3D>} Array of decoration objects
 */
function createTreesAndDecorations(width, length) {
  const decorations = [];
  
  // Create trees along the edges of the pathways
  // Number of trees to place - increased for larger map
  const treeCount = 80;
  
  // Create tree positions along the main pathways
  const treePositions = [];
  
  // Trees along central path
  for (let i = 0; i < 20; i++) { // More trees
    const zOffset = -length * 0.4 + (i * length * 0.8 / 19);
    treePositions.push({ x: -50, z: zOffset }); // Wider spacing
    treePositions.push({ x: 50, z: zOffset }); // Wider spacing
  }
  
  // Trees in the quadrants - adjusted for larger map
  for (let x = -width/3; x <= width/3; x += width/3) {
    for (let z = -length/3; z <= length/3; z += length/3) {
      if (x !== 0 || z !== 0) { // Updated condition to place trees in center too
        treePositions.push({ x, z });
        
        // Add more trees in each quadrant
        treePositions.push({ x: x * 0.7, z: z * 0.7 });
        treePositions.push({ x: x * 1.2, z: z * 0.7 });
        treePositions.push({ x: x * 0.7, z: z * 1.2 });
      }
    }
  }
  
  // Create trees at random positions from the list
  for (let i = 0; i < Math.min(treeCount, treePositions.length); i++) {
    const index = Math.floor(Math.random() * treePositions.length);
    const pos = treePositions.splice(index, 1)[0]; // Remove the position from the list
    
    if (pos) {
      const tree = createTree();
      tree.position.set(
        pos.x + (Math.random() * 10 - 5), // Add some randomness
        0,
        pos.z + (Math.random() * 10 - 5)
      );
      decorations.push(tree);
    }
  }
  
  return decorations;
}

/**
 * Creates a tree
 * @returns {THREE.Group} Tree model
 */
function createTree() {
  const tree = new THREE.Group();
  
  // Tree trunk
  const trunkGeometry = new THREE.CylinderGeometry(0.6, 1, 4, 8);
  const trunkMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x8B4513,
    roughness: 0.9,
    metalness: 0.0
  });
  const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
  trunk.position.y = 2;
  trunk.castShadow = true;
  tree.add(trunk);
  
  // Tree foliage (low poly)
  const foliageGeometry = new THREE.OctahedronGeometry(3, 0); // Simple octahedron shape
  const foliageMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x447755,
    roughness: 0.8,
    metalness: 0.0
  });
  const foliage = new THREE.Mesh(foliageGeometry, foliageMaterial);
  foliage.position.y = 5;
  foliage.castShadow = true;
  tree.add(foliage);
  
  return tree;
} 