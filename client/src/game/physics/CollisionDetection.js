import * as THREE from 'three';

/**
 * Checks if a vehicle has collided with map perimeter walls
 * @param {Object} vehicle The vehicle to check collision for
 * @param {Object} map The map object containing bounds information
 * @returns {Object|null} Collision information or null if no collision
 */
export function checkWallCollision(vehicle, map) {
  // Get map dimensions
  const dimensions = map.getDimensions();
  const halfWidth = dimensions.width / 2;
  const halfLength = dimensions.length / 2;
  
  // Get vehicle position
  const position = vehicle.mesh.position.clone();
  
  // Get vehicle size (approximating from collision box)
  const boundingBox = vehicle.collisionBox.clone();
  const size = new THREE.Vector3();
  boundingBox.getSize(size);
  
  // Vehicle radius (using the larger of width/length)
  const vehicleRadius = Math.max(size.x, size.z) / 2;
  
  // Check for collisions with each wall and prevent vehicle from moving through
  let collision = null;
  
  // North wall collision (negative Z)
  if (position.z - vehicleRadius < -halfLength) {
    collision = {
      normal: new THREE.Vector3(0, 0, 1),
      penetration: Math.abs(position.z - vehicleRadius + halfLength),
      position: new THREE.Vector3(position.x, position.y, -halfLength + vehicleRadius)
    };
  }
  // South wall collision (positive Z)
  else if (position.z + vehicleRadius > halfLength) {
    collision = {
      normal: new THREE.Vector3(0, 0, -1),
      penetration: Math.abs(position.z + vehicleRadius - halfLength),
      position: new THREE.Vector3(position.x, position.y, halfLength - vehicleRadius)
    };
  }
  // East wall collision (positive X)
  else if (position.x + vehicleRadius > halfWidth) {
    collision = {
      normal: new THREE.Vector3(-1, 0, 0),
      penetration: Math.abs(position.x + vehicleRadius - halfWidth),
      position: new THREE.Vector3(halfWidth - vehicleRadius, position.y, position.z)
    };
  }
  // West wall collision (negative X)
  else if (position.x - vehicleRadius < -halfWidth) {
    collision = {
      normal: new THREE.Vector3(1, 0, 0),
      penetration: Math.abs(position.x - vehicleRadius + halfWidth),
      position: new THREE.Vector3(-halfWidth + vehicleRadius, position.y, position.z)
    };
  }
  
  return collision;
}

/**
 * Checks if a vehicle has collided with map objects (Washington Monument, Capitol Building, etc.)
 * @param {Object} vehicle The vehicle to check collision for
 * @param {Object} map The map object containing object colliders
 * @returns {Object|null} Collision information or null if no collision
 */
export function checkObjectCollision(vehicle, map) {
  // Skip if no colliders in map
  if (!map.colliders || map.colliders.length === 0) {
    return null;
  }
  
  // Vehicle collision box
  const vehicleBox = vehicle.collisionBox;
  
  // Check collision with each object collider
  for (const objectCollider of map.colliders) {
    if (vehicleBox.intersectsBox(objectCollider)) {
      // Collision detected, calculate collision information
      
      // Get vehicle position
      const vehiclePosition = vehicle.mesh.position.clone();
      
      // Calculate the closest point on the object collider to the vehicle center
      const closestPoint = new THREE.Vector3();
      objectCollider.clampPoint(vehiclePosition, closestPoint);
      
      // Calculate direction vector from closest point to vehicle (this is the normal)
      const normal = new THREE.Vector3().subVectors(vehiclePosition, closestPoint).normalize();
      
      // Calculate penetration depth (approximate)
      // Get vehicle size
      const vehicleSize = new THREE.Vector3();
      vehicleBox.getSize(vehicleSize);
      const vehicleRadius = Math.max(vehicleSize.x, vehicleSize.z) / 2;
      
      // Penetration is distance from vehicle to closest point minus vehicle radius
      const penetration = vehicleRadius - vehiclePosition.distanceTo(closestPoint);
      
      // Only resolve if actually penetrating
      if (penetration > 0) {
        // Calculate corrected position
        const correctedPosition = vehiclePosition.clone().add(
          normal.clone().multiplyScalar(penetration)
        );
        
        return {
          normal,
          penetration,
          position: correctedPosition
        };
      }
    }
  }
  
  return null;
}

/**
 * Resolves a wall collision by updating vehicle position and velocity
 * @param {Object} vehicle The vehicle to resolve collision for
 * @param {Object} collision The collision information
 */
export function resolveWallCollision(vehicle, collision) {
  if (!collision) return;
  
  // Set vehicle position to collision position (prevents wall penetration)
  vehicle.mesh.position.copy(collision.position);
  
  // Calculate reflection of velocity against the wall normal
  const dot = vehicle.velocity.dot(collision.normal);
  if (dot < 0) {
    const reflection = collision.normal.clone().multiplyScalar(2 * dot);
    vehicle.velocity.sub(reflection);
    
    // Add a dampening effect (energy loss from collision)
    vehicle.velocity.multiplyScalar(0.5);
  }
  
  // Update collision box with new position
  vehicle.updateCollisionBox();
} 