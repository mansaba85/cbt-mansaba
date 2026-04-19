// Dynamic API Base URL based on the current window location
// This allows network access via IP address without hardcoding
export const API_BASE_URL = `http://${window.location.hostname}:3001`;

// Helper for API endpoints
export const getApiUrl = (path: string) => {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${cleanPath}`;
};
