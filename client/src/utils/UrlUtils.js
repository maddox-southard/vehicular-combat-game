/**
 * Check URL for portal entry parameters
 * @returns {Object|null} Portal parameters if present, null otherwise
 */
export function checkForPortalParameters() {
  const urlParams = new URLSearchParams(window.location.search);
  
  // Check if this is a portal entry
  if (urlParams.get('portal') === 'true') {
    return {
      portal: true,
      username: urlParams.get('username') || 'Portal Player',
      vehicle: urlParams.get('vehicle') || 'roadkill',
      color: urlParams.get('color') || 'blue',
      speed: parseFloat(urlParams.get('speed')) || 3,
      ref: urlParams.get('ref') || '',
      // Additional parameters
      avatar_url: urlParams.get('avatar_url') || '',
      team: urlParams.get('team') || '',
      speed_x: parseFloat(urlParams.get('speed_x')) || 0,
      speed_y: parseFloat(urlParams.get('speed_y')) || 0,
      speed_z: parseFloat(urlParams.get('speed_z')) || 0,
      rotation_x: parseFloat(urlParams.get('rotation_x')) || 0,
      rotation_y: parseFloat(urlParams.get('rotation_y')) || 0,
      rotation_z: parseFloat(urlParams.get('rotation_z')) || 0
    };
  }
  
  return null;
}

/**
 * Construct a portal exit URL
 * @param {Object} player Player information to include in URL
 * @param {string} targetUrl The base URL to redirect to
 * @returns {string} The constructed URL with parameters
 */
export function constructPortalExitUrl(player, targetUrl) {
  if (!targetUrl) {
    targetUrl = 'http://portal.pieter.com';
  }
  
  // Add query parameters
  let url = targetUrl;
  const hasParams = targetUrl.includes('?');
  const separator = hasParams ? '&' : '?';
  
  // Required parameters
  url += `${separator}portal=true`;
  url += `&username=${encodeURIComponent(player.username || 'Player')}`;
  url += `&color=${encodeURIComponent(player.color || 'blue')}`;
  url += `&speed=${encodeURIComponent(player.vehicle.speed || 3)}`;
  url += `&ref=${encodeURIComponent(window.location.href)}`;
  
  // Optional additional parameters
  if (player.vehicle) {
    // Get the vehicle velocities
    const velocity = player.vehicle.velocity || { x: 0, y: 0, z: 0 };
    url += `&speed_x=${encodeURIComponent(velocity.x || 0)}`;
    url += `&speed_y=${encodeURIComponent(velocity.y || 0)}`;
    url += `&speed_z=${encodeURIComponent(velocity.z || 0)}`;
    
    // Get the vehicle rotation
    const rotation = player.vehicle.mesh.rotation || { x: 0, y: 0, z: 0 };
    url += `&rotation_x=${encodeURIComponent(rotation.x || 0)}`;
    url += `&rotation_y=${encodeURIComponent(rotation.y || 0)}`;
    url += `&rotation_z=${encodeURIComponent(rotation.z || 0)}`;
  }
  
  // Add avatar URL if available
  if (player.avatar_url) {
    url += `&avatar_url=${encodeURIComponent(player.avatar_url)}`;
  }
  
  // Add team if available
  if (player.team) {
    url += `&team=${encodeURIComponent(player.team)}`;
  }
  
  return url;
}

/**
 * Check if the game should auto-start based on URL params
 * @returns {boolean} True if the game should auto-start
 */
export function shouldAutoStart() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('autostart') === 'true' || urlParams.get('portal') === 'true';
}

/**
 * Get server URL from environment variables or URL params
 * @returns {string} The server URL to connect to
 */
export function getServerUrl() {
  const urlParams = new URLSearchParams(window.location.search);
  const serverParam = urlParams.get('server');
  
  if (serverParam) {
    return serverParam;
  }
  
  return import.meta.env.PROD 
    ? 'https://your-production-server.com' 
    : 'http://localhost:3000';
} 