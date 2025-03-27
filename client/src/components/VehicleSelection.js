import { VEHICLES } from '../game/vehicles/VehicleConfig';

/**
 * Setup the vehicle selection UI
 * @param {Function} onVehicleSelect Callback function when vehicle is selected
 * @param {Object} portalParams Optional parameters from portal entry
 */
export function setupVehicleSelection(onVehicleSelect, portalParams = null) {
  const vehiclesContainer = document.getElementById('vehicles-container');
  
  // If coming from a portal with vehicle params, skip selection
  if (portalParams && portalParams.vehicle) {
    // Auto-select vehicle from portal params
    setTimeout(() => {
      onVehicleSelect(portalParams.vehicle, portalParams.username || 'Portal Player');
    }, 500);
    return;
  }
  
  // Clear container
  vehiclesContainer.innerHTML = '';
  
  // Get all vehicle entries and sort them
  const vehicleEntries = Object.entries(VEHICLES);
  let currentIndex = 0;
  
  // Vehicle descriptive names mapping
  const vehicleDescriptions = {
    auger: 'Rock Driller',
    axel: 'Wheel Man',
    clubKid: 'Party Van',
    firestarter: 'Flame Truck',
    flowerPower: 'Hippie Van',
    hammerhead: 'Monster Truck',
    mrGrimm: 'Death Cycle',
    outlaw: 'Police Cruiser',
    roadkill: 'Apocalypse Coupe',
    spectre: 'Ghost Racer',
    thumper: 'Bass Bomber',
    warthog: 'War Tank'
  };
  
  // Create navigation buttons
  const navigationContainer = document.createElement('div');
  navigationContainer.className = 'vehicle-navigation';
  navigationContainer.innerHTML = `
    <button id="prev-vehicle" class="nav-button">&lt;</button>
    <button id="next-vehicle" class="nav-button">&gt;</button>
    <button id="select-vehicle" class="select-button">SELECT</button>
  `;
  vehiclesContainer.appendChild(navigationContainer);
  
  // Create vehicle display container
  const vehicleDisplay = document.createElement('div');
  vehicleDisplay.id = 'vehicle-display';
  vehiclesContainer.appendChild(vehicleDisplay);
  
  // Function to display current vehicle
  function displayVehicle(index) {
    const [vehicleId, vehicle] = vehicleEntries[index];
    const vehicleDescription = vehicleDescriptions[vehicleId] || vehicle.name;
    
    vehicleDisplay.innerHTML = `
      <h3 class="vehicle-name">${vehicleDescription}</h3>
      <div class="vehicle-image" style="height: 150px; background-color: #333;"></div>
      <div class="vehicle-stats">
        <div class="stat">
          <div>Speed</div>
          <div class="stat-bar">
            <div class="stat-fill" style="width: ${vehicle.speed * 20}%"></div>
          </div>
        </div>
        <div class="stat">
          <div>Armor</div>
          <div class="stat-bar">
            <div class="stat-fill" style="width: ${vehicle.armor * 20}%"></div>
          </div>
        </div>
        <div class="stat">
          <div>Damage</div>
          <div class="stat-bar">
            <div class="stat-fill" style="width: ${vehicle.damage * 20}%"></div>
          </div>
        </div>
        <div class="stat">
          <div>Handling</div>
          <div class="stat-bar">
            <div class="stat-fill" style="width: ${vehicle.handling * 20}%"></div>
          </div>
        </div>
      </div>
    `;
    
    // Create or update 3D preview if needed
    createVehiclePreview(vehicleId, document.querySelector('.vehicle-image'));
    
    // Store current vehicle ID for selection
    vehicleDisplay.dataset.vehicleId = vehicleId;
  }
  
  // Navigate to previous vehicle
  function prevVehicle() {
    currentIndex = (currentIndex - 1 + vehicleEntries.length) % vehicleEntries.length;
    displayVehicle(currentIndex);
  }
  
  // Navigate to next vehicle
  function nextVehicle() {
    currentIndex = (currentIndex + 1) % vehicleEntries.length;
    displayVehicle(currentIndex);
  }
  
  // Select current vehicle
  function selectVehicle() {
    const vehicleId = vehicleDisplay.dataset.vehicleId;
    // Use a default player name instead of prompting
    const playerName = 'Player';
    
    // Call the selection callback directly
    onVehicleSelect(vehicleId, playerName);
  }
  
  // Add event listeners for navigation buttons
  document.getElementById('prev-vehicle').addEventListener('click', prevVehicle);
  document.getElementById('next-vehicle').addEventListener('click', nextVehicle);
  document.getElementById('select-vehicle').addEventListener('click', selectVehicle);
  
  // Add keyboard event listeners
  document.addEventListener('keydown', function(event) {
    if (document.getElementById('vehicle-selection').style.display !== 'none') {
      if (event.key === 'ArrowLeft') {
        prevVehicle();
        event.preventDefault();
      } else if (event.key === 'ArrowRight') {
        nextVehicle();
        event.preventDefault();
      } else if (event.key === 'Enter') {
        selectVehicle();
        event.preventDefault();
      }
    }
  });
  
  // Display the first vehicle initially
  displayVehicle(currentIndex);
}

/**
 * Create a 3D preview of the vehicle
 * @param {string} vehicleId The vehicle ID to preview
 * @param {HTMLElement} container The container to add the preview to
 */
export function createVehiclePreview(vehicleId, container) {
  // This would create a Three.js scene with the vehicle model
  // For the initial implementation, we'll skip this
} 