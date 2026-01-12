// metro.config.js
const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// [추가] mjs 확장자를 처리하도록 설정
config.resolver.sourceExts.push("mjs");

module.exports = config;
