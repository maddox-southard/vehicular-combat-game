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
      ref: urlParams.get('ref') || ''
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
  
  url += `${separator}portal=true`;
  url += `&username=${encodeURIComponent(player.username || 'Player')}`;
  url += `&vehicle=${encodeURIComponent(player.vehicle || 'roadkill')}`;
  url += `&color=${encodeURIComponent(player.color || 'blue')}`;
  url += `&speed=${encodeURIComponent(player.speed || 3)}`;
  url += `&ref=${encodeURIComponent(window.location.href)}`;
  
  return url;
}

/**
 * Check if the game should auto-start based on URL params
 * @returns {boolean} True if the game should auto-start
 */
export function shouldAutoStart() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('autostart') === 'true';
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