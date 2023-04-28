var NodeCache = require('node-cache');

var cacheOptions = {
    stdTTL: 10 * 60, // 10 minutes
    checkperiod: 10 // 10 seconds
};

var keyCache =  new NodeCache(cacheOptions);
module.exports = keyCache;