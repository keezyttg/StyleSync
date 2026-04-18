const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Block Node.js-only packages inside the Firebase Functions folder
// from being bundled into the React Native app
config.resolver.blockList = /.*\/functions\/node_modules\/.*/;

module.exports = config;
