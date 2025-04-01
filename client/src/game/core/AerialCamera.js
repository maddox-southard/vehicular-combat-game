import * as THREE from 'three';

/**
 * Creates and configures an aerial camera for overview shots
 */
export function createAerialCamera() {
  const camera = new THREE.PerspectiveCamera(
    60, // Field of view (slightly narrower than main camera)
    window.innerWidth / window.innerHeight, // Aspect ratio
    0.1, // Near clipping plane
    1000 // Far clipping plane
  );
  
  // Set initial position high above the map
  camera.position.set(0, 300, 0);
  camera.lookAt(0, 0, 0);
  
  return camera;
}

/**
 * Updates the aerial camera position
 * @param {THREE.Camera} aerialCamera The aerial camera to update
 * @param {number} delta Time delta since last update
 */
export function updateAerialCamera(aerialCamera, delta) {
  // Get current time for animation
  const time = performance.now();
  
  // Slowly rotate camera around the map
  const rotationSpeed = 0.25;
  const angle = (time / 10000) * rotationSpeed + Math.PI / 2;
  const radius = 280;
  
  aerialCamera.position.x = Math.sin(angle) * radius;
  aerialCamera.position.z = Math.cos(angle) * radius;
  
  // Keep height relatively constant but add a slight wave
  aerialCamera.position.y = 300 + Math.sin(time / 5000) * 10;
  
  // Look at the center of the map
  aerialCamera.lookAt(0, 0, 0);
} 