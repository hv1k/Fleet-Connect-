// pwa-icons.js - SVG icon generator for PWA manifest
// Generates icon data URLs on-demand for inline use

const PWAIcons = {
  // Generate 192x192 icon
  get192x192() {
    return `data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 192 192'><rect width='192' height='192' rx='45' fill='%2360a5fa'/><text x='96' y='135' font-size='120' font-weight='bold' fill='%230a0a0f' text-anchor='middle' font-family='Outfit, sans-serif'>F</text></svg>`;
  },

  // Generate 512x512 icon (maskable)
  get512x512() {
    return `data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 512 512'><rect width='512' height='512' rx='120' fill='%2360a5fa'/><text x='256' y='360' font-size='320' font-weight='bold' fill='%230a0a0f' text-anchor='middle' font-family='Outfit, sans-serif'>F</text></svg>`;
  },

  // Generate inline icon for install banner
  getSmallIcon() {
    return `data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 48 48'><rect width='48' height='48' rx='12' fill='%2360a5fa'/><text x='24' y='36' font-size='30' font-weight='bold' fill='%230a0a0f' text-anchor='middle' font-family='Outfit, sans-serif'>F</text></svg>`;
  },

  // Generate icon with dark background (for home screen)
  getDarkIcon() {
    return `data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 192 192'><defs><linearGradient id='grad' x1='0%' y1='0%' x2='100%' y2='100%'><stop offset='0%' style='stop-color:%2360a5fa;stop-opacity:1' /><stop offset='100%' style='stop-color:%233b82f6;stop-opacity:1' /></linearGradient></defs><rect width='192' height='192' rx='45' fill='url(%23grad)'/><text x='96' y='135' font-size='120' font-weight='bold' fill='white' text-anchor='middle' font-family='Outfit, sans-serif' style='filter:drop-shadow(0 2px 4px rgba(0,0,0,0.3))'>F</text></svg>`;
  },

  // Generate notification icon (simple badge)
  getNotificationIcon() {
    return `data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'><circle cx='32' cy='32' r='32' fill='%2360a5fa'/><text x='32' y='48' font-size='40' font-weight='bold' fill='white' text-anchor='middle' font-family='Outfit, sans-serif'>F</text></svg>`;
  }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PWAIcons;
}
