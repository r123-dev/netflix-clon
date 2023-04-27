var MirroredKeyProvider = require('./mirrored-key-provider');
var HttpPublicKeyProvider = require('./http-public-key-provider');
var urlParser = require('url');

var parseMirroredUrls = function(mirroredUrl) {
    var urls = mirroredUrl.split(/\s+\|\s+/);
    return urls.map(function(url) {

        if (url.indexOf('|') > 0) {
            throw new Error('Pipe must be encoded');
        }

        var uri = urlParser.parse(url.trim());
        if (!uri.protocol || uri.protocol.indexOf('http')) {
            throw new Error('Only http(s) repository keys are supported');
        } else {
            return url.trim();
        }
    });
};

var parseMirroredKeyProviders = function(mirroredUrl) {
    var urls = parseMirroredUrls(mirroredUrl);
    return urls.map(function(url) {
        return HttpPublicKeyProvider.create(url);
    });
};

module.exports = {
    /**
     * Constructor of `HttpPublicKeyProvider` objects. The factory supports multiple key providers for fail overs.
     * The key repositories can be specified as mirrored in the public key base url.
     * Mirrored key repositories must be separated by the pipe (|) character,
     * with one or more whitespace before and after the pipe.
     *
     * @param {Object} config
     * @param {String} config.publicKeyBaseUrl -
     * A base url for the server containing the public keys of the issuers of the tokens.
     * @param {String} config.resourceServerAudience - all JWT messages will need to have this audience to be valid
     * @returns {MirroredHttpKeyProvider}
     */
    create: function(config) {

        if (!config || !config.publicKeyBaseUrl) {
            throw new Error('Required config value config.publicKeyServer is missing.');
        }

        return MirroredKeyProvider.create(parseMirroredKeyProviders(config.publicKeyBaseUrl));
    }
};