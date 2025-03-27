/**
 * Sets up control handlers for the player vehicle
 * @param {Object} vehicle The player's vehicle
 */
export function setupControls(vehicle) {
  // Store keys currently pressed
  const keysPressed = {};
  
  // Key map for controls
  const keyMap = {
    forward: ['w', 'ArrowUp'],
    backward: ['s', 'ArrowDown'],
    left: ['a', 'ArrowLeft'],
    right: ['d', 'ArrowRight'],
    fire: [' ', 'Space'],
    special: ['f', 'Control'],
    switchWeapon: ['e', 'Tab']
  };
  
  // Add keydown listener
  window.addEventListener('keydown', (event) => {
    const key = event.key;
    keysPressed[key] = true;
    
    // Check if pressed key is mapped to a control
    for (const [control, keys] of Object.entries(keyMap)) {
      if (keys.includes(key)) {
        // Special case for switch weapon (one-time action)
        if (control === 'switchWeapon') {
          vehicle.switchWeapon();
        } else {
          vehicle.controls[control] = true;
        }
        
        // Prevent default for game control keys
        event.preventDefault();
      }
    }
  });
  
  // Add keyup listener
  window.addEventListener('keyup', (event) => {
    const key = event.key;
    keysPressed[key] = false;
    
    // Check if released key is mapped to a control
    for (const [control, keys] of Object.entries(keyMap)) {
      if (keys.includes(key)) {
        // Don't reset switchWeapon (it's a one-time action)
        if (control !== 'switchWeapon') {
          vehicle.controls[control] = false;
        }
        
        // Prevent default for game control keys
        event.preventDefault();
      }
    }
  });
  
  // Add touch controls for mobile devices
  setupTouchControls(vehicle);
  
  return {
    // Function to check if a specific key is pressed
    isKeyPressed: (key) => keysPressed[key] || false,
    
    // Clean up function
    removeListeners: () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      removeTouchControls();
    }
  };
}

/**
 * Sets up touch controls for mobile devices
 * @param {Object} vehicle The player's vehicle
 */
function setupTouchControls(vehicle) {
  // Only add touch controls if device supports touch
  if (!('ontouchstart' in window)) return;
  
  // Create touch UI elements
  createTouchUI();
  
  // Add touch event listeners
  const touchButtons = document.querySelectorAll('.touch-button');
  
  touchButtons.forEach(button => {
    const control = button.dataset.control;
    
    button.addEventListener('touchstart', (event) => {
      event.preventDefault();
      if (control === 'switchWeapon') {
        vehicle.switchWeapon();
      } else {
        vehicle.controls[control] = true;
      }
    });
    
    if (control !== 'switchWeapon') {
      button.addEventListener('touchend', (event) => {
        event.preventDefault();
        vehicle.controls[control] = false;
      });
      
      button.addEventListener('touchcancel', (event) => {
        event.preventDefault();
        vehicle.controls[control] = false;
      });
    }
  });
}

/**
 * Creates the touch UI elements
 */
function createTouchUI() {
  // Only create if not already present
  if (document.getElementById('touch-controls')) return;
  
  // Create touch controls container
  const touchControls = document.createElement('div');
  touchControls.id = 'touch-controls';
  touchControls.style.position = 'absolute';
  touchControls.style.bottom = '20px';
  touchControls.style.left = '0';
  touchControls.style.width = '100%';
  touchControls.style.display = 'flex';
  touchControls.style.justifyContent = 'space-between';
  touchControls.style.pointerEvents = 'none';
  document.body.appendChild(touchControls);
  
  // Create left side controls (movement)
  const leftControls = document.createElement('div');
  leftControls.className = 'touch-control-group';
  leftControls.style.display = 'grid';
  leftControls.style.gridTemplateColumns = 'repeat(3, 60px)';
  leftControls.style.gridTemplateRows = 'repeat(3, 60px)';
  leftControls.style.gap = '5px';
  leftControls.style.margin = '10px';
  
  // Movement buttons
  const buttonStyles = {
    width: '60px',
    height: '60px',
    borderRadius: '50%',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    fontSize: '24px',
    fontWeight: 'bold',
    pointerEvents: 'auto'
  };
  
  // Create D-pad style controls
  const forwardButton = createTouchButton('▲', 'forward', { ...buttonStyles, gridColumn: '2', gridRow: '1' });
  const leftButton = createTouchButton('◄', 'left', { ...buttonStyles, gridColumn: '1', gridRow: '2' });
  const backwardButton = createTouchButton('▼', 'backward', { ...buttonStyles, gridColumn: '2', gridRow: '3' });
  const rightButton = createTouchButton('►', 'right', { ...buttonStyles, gridColumn: '3', gridRow: '2' });
  
  leftControls.appendChild(forwardButton);
  leftControls.appendChild(leftButton);
  leftControls.appendChild(backwardButton);
  leftControls.appendChild(rightButton);
  
  // Create right side controls (actions)
  const rightControls = document.createElement('div');
  rightControls.className = 'touch-control-group';
  rightControls.style.display = 'flex';
  rightControls.style.flexDirection = 'column';
  rightControls.style.gap = '10px';
  rightControls.style.margin = '10px';
  
  // Action buttons
  const fireButton = createTouchButton('FIRE', 'fire', {
    ...buttonStyles,
    width: '80px',
    height: '80px',
    backgroundColor: 'rgba(255, 50, 50, 0.6)'
  });
  
  const specialButton = createTouchButton('SPECIAL', 'special', {
    ...buttonStyles,
    width: '70px',
    height: '70px',
    backgroundColor: 'rgba(50, 50, 255, 0.6)'
  });
  
  const switchButton = createTouchButton('SWITCH', 'switchWeapon', {
    ...buttonStyles,
    width: '60px',
    height: '60px',
    backgroundColor: 'rgba(50, 255, 50, 0.6)'
  });
  
  rightControls.appendChild(fireButton);
  rightControls.appendChild(specialButton);
  rightControls.appendChild(switchButton);
  
  // Add controls to the container
  touchControls.appendChild(leftControls);
  touchControls.appendChild(rightControls);
}

/**
 * Creates a touch button element
 * @param {string} text Button text
 * @param {string} control Control name
 * @param {Object} styles CSS styles
 * @returns {HTMLElement} The created button
 */
function createTouchButton(text, control, styles) {
  const button = document.createElement('div');
  button.className = 'touch-button';
  button.dataset.control = control;
  button.innerText = text;
  
  // Apply styles
  Object.assign(button.style, styles);
  
  return button;
}

/**
 * Removes touch UI elements
 */
function removeTouchControls() {
  const touchControls = document.getElementById('touch-controls');
  if (touchControls) {
    touchControls.remove();
  }
} 