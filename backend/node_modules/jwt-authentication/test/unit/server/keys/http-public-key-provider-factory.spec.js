var specHelpers = require('../../support/spec-helpers');

describe('httpPublicKeyProvider', function() {
    var MirroredKeyProvider;
    var HttpPublicKeyProvider;
    var keyProviderFactory;
    var keyProvider;

    beforeEach(function () {
        MirroredKeyProvider = jasmine.createSpyObj('MirroredKeyProvider', ['create']);
        HttpPublicKeyProvider = jasmine.createSpyObj('HttpPublicKeyProvider', ['create']);

        keyProviderFactory = specHelpers.requireWithMocks('/server/keys/http-public-key-provider-factory', {
            './mirrored-key-provider': MirroredKeyProvider,
            './http-public-key-provider': HttpPublicKeyProvider
        });

    });

    it('should throw an error if config.publicKeyServer is not set', function() {
        expect(function () {keyProviderFactory.create({foo: 'bar'});}).toThrow(
            new Error('Required config value config.publicKeyServer is missing.'));
    });

    it('should reject unknown schemes' , function() {
        expect(function() {
            keyProviderFactory.create({publicKeyBaseUrl: 'unknown://server1.com'});
        }).toThrow(new Error('Only http(s) repository keys are supported'));
    });

    it('should reject file scheme' , function() {
        expect(function() {
            keyProviderFactory.create({publicKeyBaseUrl: 'file:///opt/keys'});
        }).toThrow(new Error('Only http(s) repository keys are supported'));
    });

    it('should reject relative urls' , function() {
        expect(function() {
            keyProviderFactory.create({publicKeyBaseUrl: '/server1/com'});
        }).toThrow(new Error('Only http(s) repository keys are supported'));
    });

    it('should reject if the pipe misses trailing whitespace' , function() {
        expect(function() {
            keyProviderFactory.create({publicKeyBaseUrl: 'https://server1.com |https://server2.com'});
        }).toThrow(new Error('Pipe must be encoded'));
    });

    it('should reject if the pipe misses leading whitespace' , function() {
        expect(function() {
            keyProviderFactory.create({publicKeyBaseUrl: 'https://server1.com| https://server2.com'});
        }).toThrow(new Error('Pipe must be encoded'));
    });

    it('should parse mirrored url on the pipe splitter', function() {
        keyProvider = keyProviderFactory.create({publicKeyBaseUrl: 'https://server1.com | https://server2.com'});
        expect(MirroredKeyProvider.create).toHaveBeenCalled();
        expect(HttpPublicKeyProvider.create.calls.count()).toBe(2);
        expect(HttpPublicKeyProvider.create.calls.argsFor(0)[0]).toBe('https://server1.com');
        expect(HttpPublicKeyProvider.create.calls.argsFor(1)[0]).toBe('https://server2.com');
    });
});