// @ts-check
const pkg = require('./package.json')

/**
 * Kept until the Phase 4.7 rsbuild migration because `expo export:web` still
 * reads Expo config. Native project/plugin settings were removed with the
 * native project files in Phase 4.6.
 *
 * @param {import('@expo/config-types').ExpoConfig} _config
 * @returns {{ expo: import('@expo/config-types').ExpoConfig }}
 */
module.exports = function (_config) {
  return {
    expo: {
      version: pkg.version,
      name: 'Bluesky',
      slug: 'bluesky',
      scheme: 'bluesky',
      owner: 'blueskysocial',
      userInterfaceStyle: 'automatic',
      primaryColor: '#006AFF',
      web: {
        favicon: './assets/favicon.png',
      },
    },
  }
}
