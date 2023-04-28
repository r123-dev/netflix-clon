var _ = require('lodash');
var q = require('q');

var MirroredKeyProvider = function(providers) {

    /**
     * Provides a Key for a validated key identifier.
     *
     * @param {String} keyId - key identifier
     * @returns {String} the relevant key if found
     */
    this.getKey = function(keyId) {
        var allMirrors = [];
        _.forEach(providers, function(provider) {
            allMirrors.push(provider.getKey(keyId));
        });

        return q.any(allMirrors)
            .fail(function() {
                return q.reject(new Error('Could not retrieve public key from configured URL(s).'));
            });
    };
};

module.exports = {
    /**
     * Constructor of `MirroredKeyProvider` objects.
     *
     * @param {Array.<HttPublicKeyProvider>} providers - a list of http public key providers
     * @returns {MirroredKeyProvider}
     */
    create: function(providers) {

        if (!providers || providers.length === 0) {
            throw new Error('Mirrored key provider requires at least one provider.');
        }

        if (providers.length === 1) {
            return providers[0];
        }

        return new MirroredKeyProvider(providers);
    }
};