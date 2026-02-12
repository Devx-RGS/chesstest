const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Add .html and .bin to asset extensions so engine files can be loaded via require()
config.resolver.assetExts.push("html", "bin");

module.exports = config;
