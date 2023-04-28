var request = require('../../jwt-authentication/request');
var url = require('url');

var HttpPublicKeyProvider = function(baseUrl) {

    /**
     * Provides a Key for a validated key identifier.
     *
     * @param {String} keyId - key identifier
     * @returns {String} the relevant key if found
     */
    this.getKey = function(keyId) {
        var keyUrl = url.resolve(baseUrl, keyId);
        return request(keyUrl);
    };
};

module.exports = {

    /**
     * Constructor of `HttpPublicKeyProvider` objects.
     *
     * @param {String} baseUrl - a base url for key retrieval
     * @param {EventEmitter} eventEmitter - an event emitter
     * @returns {HttpPublicKeyProvider}
     */
    create: function(baseUrl, eventEmitter) {
        if (baseUrl.lastIndexOf('/') !== baseUrl.length - 1) {
            throw new Error('Base URL must end with trailing slash');
        }
        return new HttpPublicKeyProvider(baseUrl, eventEmitter);
    }
};