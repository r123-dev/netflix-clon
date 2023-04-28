var q = require('q');
var specHelpers = require('../../support/spec-helpers');
var failTest = require('../../support/fail-test');

describe('httpPublicKeyProvider', function() {
    var httpPublicKeyProvider;
    var request;
    var HttpPublicKeyProvider;

    beforeEach(function () {
        request = jasmine.createSpy('request');

        HttpPublicKeyProvider = specHelpers.requireWithMocks('server/keys/http-public-key-provider', {
            '../../jwt-authentication/request': request
        });
        httpPublicKeyProvider = HttpPublicKeyProvider.create('https://some-provider.com/bucket/');
    });

    it('should throw an error if base url does not end with a slash', function() {
        expect(function () {HttpPublicKeyProvider.create('https://some-provider.com');}).toThrow(
            new Error('Base URL must end with trailing slash'));
    });

    it('should fail if the request fails', function(done) {
        request.and.returnValue(q.reject('Failed request'));
        httpPublicKeyProvider.getKey('key-id')
            .then(failTest(done))
            .fail(function(error) {
                expect(error).toBeDefined();
                done();
            });
    });

    it('should return the key from request', function(done) {
        request.and.returnValue(q.resolve('Public Key'));
        httpPublicKeyProvider.getKey('key-id')
            .then(function(key) {
                expect(key).toBe('Public Key');
                done();
            })
            .fail(failTest(done));
    });

    it('should construct the correct url', function(done) {
        request.and.returnValue(q.resolve('Public Key'));
        httpPublicKeyProvider.getKey('issuer/file.pem')
            .then(function() {
                expect(request.calls.argsFor(0)[0]).toBe('https://some-provider.com/bucket/issuer/file.pem');
                done();
            })
            .fail(failTest(done));
    });

});
