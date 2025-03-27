/**
 * Configuration for all available vehicles
 * These match the vehicles from Twisted Metal III
 */
export const VEHICLES = {
  auger: {
    name: 'Auger',
    speed: 2,
    armor: 4,
    damage: 3,
    handling: 2,
    description: 'A heavily armored mining vehicle with drill attachments.',
    specialWeapon: 'Mine Layer',
    modelScale: 1.2
  },
  axel: {
    name: 'Axel',
    speed: 3,
    armor: 3,
    damage: 3,
    handling: 3,
    description: 'A balanced vehicle with wheels attached directly to the driver.',
    specialWeapon: 'Shock Wave',
    modelScale: 1.0
  },
  clubKid: {
    name: 'Club Kid',
    speed: 4,
    armor: 2,
    damage: 2,
    handling: 4,
    description: 'A nimble dance-club-themed vehicle with flashy lights.',
    specialWeapon: 'Disco Ball',
    modelScale: 0.9
  },
  firestarter: {
    name: 'Firestarter',
    speed: 4,
    armor: 2,
    damage: 3,
    handling: 3,
    description: 'A high-speed fire truck with flame attacks.',
    specialWeapon: 'Flame Spray',
    modelScale: 1.1
  },
  flowerPower: {
    name: 'Flower Power',
    speed: 3,
    armor: 2,
    damage: 2,
    handling: 4,
    description: 'A hippie van with flower decorations.',
    specialWeapon: 'Peace Bomb',
    modelScale: 1.0
  },
  hammerhead: {
    name: 'Hammerhead',
    speed: 2,
    armor: 4,
    damage: 3,
    handling: 2,
    description: 'A reinforced SUV with ramming capabilities.',
    specialWeapon: 'Ram Charge',
    modelScale: 1.1
  },
  mrGrimm: {
    name: 'Mr. Grimm',
    speed: 5,
    armor: 1,
    damage: 4,
    handling: 5,
    description: 'A motorcycle with a grim reaper theme.',
    specialWeapon: 'Soul Collector',
    modelScale: 0.8
  },
  outlaw: {
    name: 'Outlaw',
    speed: 3,
    armor: 3,
    damage: 3,
    handling: 3,
    description: 'A police car with pursuit capabilities.',
    specialWeapon: 'Taser',
    modelScale: 1.0
  },
  roadkill: {
    name: 'Roadkill',
    speed: 4,
    armor: 2,
    damage: 3,
    handling: 3,
    description: 'A sports car with post-apocalyptic modifications.',
    specialWeapon: 'Remote Bomb',
    modelScale: 1.0
  },
  spectre: {
    name: 'Spectre',
    speed: 5,
    armor: 1,
    damage: 3,
    handling: 4,
    description: 'A ghostly sports car with stealth capabilities.',
    specialWeapon: 'Ghost Missile',
    modelScale: 0.9
  },
  thumper: {
    name: 'Thumper',
    speed: 3,
    armor: 3,
    damage: 3,
    handling: 3,
    description: 'A lowrider with sound-based attacks.',
    specialWeapon: 'Sound Wave',
    modelScale: 1.0
  },
  warthog: {
    name: 'Warthog',
    speed: 2,
    armor: 5,
    damage: 3,
    handling: 2,
    description: 'A military tank with heavy armor.',
    specialWeapon: 'Patriot Missiles',
    modelScale: 1.3
  }
};

/**
 * Get vehicle stats with normalized values (0-1)
 * @param {string} vehicleId The vehicle ID
 * @returns {Object} Normalized vehicle stats
 */
export function getNormalizedVehicleStats(vehicleId) {
  const vehicle = VEHICLES[vehicleId];
  if (!vehicle) return null;
  
  return {
    speed: vehicle.speed / 5,
    armor: vehicle.armor / 5,
    damage: vehicle.damage / 5,
    handling: vehicle.handling / 5
  };
}

/**
 * Get the default weapon for a vehicle
 * @param {string} vehicleId The vehicle ID
 * @returns {string} The default weapon type
 */
export function getDefaultWeapon(vehicleId) {
  // All vehicles start with a machine gun
  return 'machineGun';
}

/**
 * Get the special weapon for a vehicle
 * @param {string} vehicleId The vehicle ID
 * @returns {string} The special weapon type
 */
export function getSpecialWeapon(vehicleId) {
  const vehicle = VEHICLES[vehicleId];
  if (!vehicle) return null;
  
  // Map vehicle special weapons to weapon IDs
  const specialWeapons = {
    'Auger': 'mineLayer',
    'Axel': 'shockWave',
    'Club Kid': 'discoBall',
    'Firestarter': 'flameSpray',
    'Flower Power': 'peaceBomb',
    'Hammerhead': 'ramCharge',
    'Mr. Grimm': 'soulCollector',
    'Outlaw': 'taser',
    'Roadkill': 'remoteBomb',
    'Spectre': 'ghostMissile',
    'Thumper': 'soundWave',
    'Warthog': 'patriotMissiles'
  };
  
  return specialWeapons[vehicle.name] || 'machineGun';
} 