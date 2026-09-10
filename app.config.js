/**
 * Dynamic Expo config.
 *
 * app.json remains the source of truth. This file only adds a web base path when
 * EXPO_BASE_URL is set, which is needed to host the web build on a GitHub Pages
 * project sub-path (e.g. /Diganta). Native builds are unaffected.
 */
module.exports = ({ config }) => {
  const baseUrl = process.env.EXPO_BASE_URL;
  if (!baseUrl) {
    return config;
  }
  return {
    ...config,
    experiments: {
      ...(config.experiments ?? {}),
      baseUrl,
    },
  };
};
