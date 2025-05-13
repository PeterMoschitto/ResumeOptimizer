module.exports = function override(config, env) {
  config.resolve.fallback = {
    ...config.resolve.fallback,
    "fs": false,
    "http": false,
    "https": false,
    "url": false,
    "zlib": false
  };
  return config;
}; 