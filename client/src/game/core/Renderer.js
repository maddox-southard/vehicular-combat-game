import * as THREE from 'three';

/**
 * Creates and configures the WebGL renderer
 */
export function createRenderer() {
  const renderer = new THREE.WebGLRenderer({ 
    antialias: true,
    powerPreference: 'high-performance'
  });
  
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio > 2 ? 2 : window.devicePixelRatio);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;
  
  return renderer;
}

/**
 * Creates and configures the scene
 */
export function createScene() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x87ceeb); // Sky blue background
  
  // Add ambient light
  const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
  scene.add(ambientLight);
  
  // Add directional light (sun)
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(50, 200, 100);
  directionalLight.castShadow = true;
  directionalLight.shadow.mapSize.width = 1024;
  directionalLight.shadow.mapSize.height = 1024;
  directionalLight.shadow.camera.near = 0.5;
  directionalLight.shadow.camera.far = 500;
  directionalLight.shadow.camera.left = -100;
  directionalLight.shadow.camera.right = 100;
  directionalLight.shadow.camera.top = 100;
  directionalLight.shadow.camera.bottom = -100;
  scene.add(directionalLight);
  
  // Add hemisphere light
  const hemisphereLight = new THREE.HemisphereLight(0xffffbb, 0x080820, 0.6);
  scene.add(hemisphereLight);
  
  return scene;
}

/**
 * Creates and configures the camera
 */
export function createCamera() {
  const camera = new THREE.PerspectiveCamera(
    75, // Field of view
    window.innerWidth / window.innerHeight, // Aspect ratio
    0.1, // Near clipping plane
    1000 // Far clipping plane
  );
  
  // Set initial camera position to match the third-person view
  camera.position.set(0, 5, 15);
  
  return camera;
}

/**
 * Updates the camera to follow a target object
 */
export function updateCamera(camera, target, delta) {
  if (!target) return;
  
  // Calculate ideal position (behind and slightly above the target)
  // Lower height and closer distance for a more immersive driving view
  const idealOffset = new THREE.Vector3(0, 5, 15); 
  
  // Apply rotation of the vehicle to the camera offset
  // This makes the camera follow behind the vehicle as it turns
  const quaternion = new THREE.Quaternion();
  quaternion.setFromEuler(new THREE.Euler(0, target.rotation.y, 0));
  idealOffset.applyQuaternion(quaternion);
  idealOffset.add(target.position);
  
  // Smoothly move camera towards ideal position (more responsive)
  camera.position.lerp(idealOffset, 1.0 - Math.pow(0.01, delta));
  
  // Look slightly ahead of the target to see where you're going
  const lookTarget = target.position.clone();
  lookTarget.y += 2; // Look slightly above the vehicle
  camera.lookAt(lookTarget);
} 