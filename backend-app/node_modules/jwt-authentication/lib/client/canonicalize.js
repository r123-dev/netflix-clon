'use strict';

var nodeForge = require('node-forge');

var DATA_URI_PATTERN = /^data:application\/pkcs8;kid=([\w.\-\+/]+);base64,([a-zA-Z0-9+/=]+)$/;

function parsePrivateKey(privateKeyDerBase64) {
    var privateKeyDerBuffer = nodeForge.util.decode64(privateKeyDerBase64);
    var privateKeyAsn1 = nodeForge.asn1.fromDer(privateKeyDerBuffer);
    var privateKeyObj = nodeForge.pki.privateKeyFromAsn1(privateKeyAsn1);
    var privateKeyPem = nodeForge.pki.privateKeyToPem(privateKeyObj);
    return privateKeyPem.toString('base64').trim();
}

function canonicalizePrivateKey(keyId, privateKey) {

    var uriDecodedPrivateKey = decodeURIComponent(privateKey);

    if (!uriDecodedPrivateKey.startsWith('data:')) {
        return privateKey;
    }

    var match = DATA_URI_PATTERN.exec(uriDecodedPrivateKey);
    
    if (!match) {
        throw new Error('Malformed Data URI');
    }

    if (keyId !== match[1]) {
        throw new Error('Supplied key id does not match the one included in data uri.');
    }

    return parsePrivateKey(match[2]);
}

module.exports = canonicalizePrivateKey;
