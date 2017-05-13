const config = {
  PORT: process.env.PORT || 8000,
  BASE_URL: process.env.BASE_URL || 'http://localhost:8000/',
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/url-shortener',
  KEY_LEN: process.env.KEY_LEN || 4
};

module.exports = config;
