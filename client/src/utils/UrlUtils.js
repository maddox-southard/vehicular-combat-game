/**
 * Check URL for portal entry parameters
 * @returns {Object|null} Portal parameters if present, null otherwise
 */
export function checkForPortalParameters() {
  const urlParams = new URLSearchParams(window.location.search);
  
  // Check if this is a portal entry
  if (urlParams.get('portal') === 'true') {
    // Use name parameter or fallback to username parameter
    const playerName = urlParams.get('name') || urlParams.get('username') || 'Portal Player';
    
    // Create the portal params object
    const portalParams = {
      portal: true,
      username: playerName,
      ref: urlParams.get('ref') || '',
    };
    
    // Add all other URL parameters to portalParams without validation
    // This ensures we can pass them to the next portal without checking them
    for (const [key, value] of urlParams.entries()) {
      // Skip the ones we already added
      if (!['portal', 'name', 'username', 'ref'].includes(key)) {
        portalParams[key] = value;
      }
    }
    
    return portalParams;
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
  
  // Ensure the targetUrl has a protocol
  if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
    targetUrl = 'https://' + targetUrl;
  }
  
  // Make sure there's no accidental path issues by parsing and reconstructing
  try {
    const parsedUrl = new URL(targetUrl);
    // Only use the origin (protocol + hostname + port) for clean URLs
    targetUrl = parsedUrl.origin;
    // Add path if it exists and is not just '/'
    if (parsedUrl.pathname && parsedUrl.pathname !== '/') {
      targetUrl += parsedUrl.pathname;
    }
    // Add search parameters if they exist
    if (parsedUrl.search && parsedUrl.search !== '?') {
      targetUrl += parsedUrl.search;
    }
  } catch (e) {
    console.error('Error parsing targetUrl:', e);
    // Use a default as fallback
    targetUrl = 'http://portal.pieter.com';
  }
  
  // Get all URL parameters from the current page to preserve them
  const currentUrlParams = new URLSearchParams(window.location.search);
  const portalParams = new URLSearchParams();
  
  // Always include these core parameters
  portalParams.set('portal', 'true');
  
  // Use name instead of username for compatibility
  portalParams.set('name', player.username || 'Player');
  
  // Set ref to our origin
  portalParams.set('ref', window.location.origin);
  
  // Copy all other parameters from the original request
  for (const [key, value] of currentUrlParams.entries()) {
    // Skip the ones we just set or don't want to forward
    if (!['portal', 'name', 'username', 'ref'].includes(key)) {
      portalParams.set(key, value);
    }
  }
  
  // Add query parameters to the URL
  const hasParams = targetUrl.includes('?');
  const separator = hasParams ? '&' : '?';
  
  return targetUrl + separator + portalParams.toString();
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