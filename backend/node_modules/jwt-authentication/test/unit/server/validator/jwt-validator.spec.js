var specHelpers = require('../../support/spec-helpers');
var q = require('q');

describe('jwtValidator', function() {
    var keyProviderFactory;
    var validatorFactory;
    var claimsValidator;
    var validator;
    var jsonWebToken;

    beforeEach(function () {
        keyProviderFactory = jasmine.createSpyObj('keyProviderFactory', ['create']);
        keyProviderFactory.create.and.callFake(function() {
            return {
                getKey: function() {return q.resolve('some key');}
            };
        });

        claimsValidator = jasmine.createSpyObj('claimsValidator', ['validate']);
        claimsValidator.validate.and.callFake(function() {return q.resolve({claims: ''});});

        jsonWebToken = jasmine.createSpyObj('jsonWebToken', ['create', 'decode', 'verify']);
        jsonWebToken.decode.and.returnValue({header: {kid: 'default-issuer/key.pem'},
            payload: {iss: 'default-issuer'}});
        jsonWebToken.verify.and.returnValue(q());
        jsonWebToken.create.and.returnValue('');

        validatorFactory = specHelpers.requireWithMocks('/server/validator/jwt-validator', {
            '../keys/http-public-key-provider-factory': keyProviderFactory,
            './jwt-claims-validator': claimsValidator,
            '../../jwt-authentication/json-web-token': jsonWebToken
        });
        validator = validatorFactory.create({
            publicKeyBaseUrl: 'http://server.com',
            resourceServerAudience: 'a-service-audience',
            ignoreMaxLifeTime: false
        });
    });

    it('should throw an error if config.publicKeyBaseUrl is not set', function() {
        expect(function () {validatorFactory.create({foo: 'bar'});}).toThrow(
            new Error('Required config value config.publicKeyBaseUrl is missing.'));
    });

    it('should throw an error if config.resourceServerAudience is not set', function() {
        expect(function () {validatorFactory.create({publicKeyBaseUrl: 'http://server.com'});}).toThrow(
            new Error('Required config value config.resourceServerAudience is missing.'));
    });

    it('should fail if the jwt token cannot be parsed', function(done) {
        jsonWebToken.decode.and.returnValue(null);
        validator.validate('invalid token', ['issuer1'], function(error) {
            expect(error).toBeDefined();
            expect(error.message).toBe('Token could not be parsed');
            done();
        });
    });

    it('should fail if the key id has path traversal components', function(done) {
        jsonWebToken.decode.and.returnValue({header: {kid: '../default-issuer/key.pem'},
            payload: {iss: 'default-issuer'}});
        validator.validate('valid token', ['issuer1'], function(error) {
            expect(error).toBeDefined();
            expect(error.message).toBe('Path traversal components not allowed in kid');
            done();
        });
    });

    it('should fail if the key id has invalid format', function(done) {
        jsonWebToken.decode.and.returnValue({header: {kid: '/default-issuer/key.pem'},
            payload: {iss: 'default-issuer'}});
        validator.validate('valid token', ['issuer1'], function(error) {
            expect(error).toBeDefined();
            expect(error.message).toBe('Invalid format of kid');
            done();
        });
        jsonWebToken.decode.and.returnValue({header: {kid: 'default-issuer//key.pem'},
            payload: {iss: 'default-issuer'}});
        validator.validate('valid token', ['issuer1'], function(error) {
            expect(error).toBeDefined();
            expect(error.message).toBe('Invalid format of kid');
            done();
        });
    });

    it('should fail if the key id has invalid characters', function(done) {
        jsonWebToken.decode.and.returnValue(
            {
                header: {kid: 'default-issuer/key.pem?invalid=invalid'},
                payload: {iss: 'default-issuer'}
            }
        );
        validator.validate('valid token', ['issuer1'], function(error) {
            expect(error).toBeDefined();
            expect(error.message).toBe('Invalid character found in kid');
            done();
        });
    });

    it('should fail if the private key is not retrievable', function(done) {
        keyProviderFactory.create.and.callFake(function() {
            return {
                getKey: function() {
                    return q.reject(new Error('Key is not retrivable'));
                }
            };
        });
        validator = validatorFactory.create({
            publicKeyBaseUrl: 'http://server.com',
            resourceServerAudience: 'a-service-audience'
        });
        validator.validate('valid token', ['issuer1'], function(error) {
            expect(error).toBeDefined();
            expect(error.message).toBe('Key is not retrivable');
            done();
        });

    });

    it('should fail if the token is not verifiable', function(done) {
        jsonWebToken.verify.and.returnValue(q.reject(new Error('Token is not verifiable')));
        validator.validate('valid token', ['issuer1'], function(error) {
            expect(error).toBeDefined();
            expect(error.message).toBe('Token is not verifiable');
            done();
        });
    });

    it('should call claims validator with correct parameters', function(done) {
        jsonWebToken.decode.and.returnValue({header: {kid: 'default-issuer/key.pem'},
            payload: {iss: 'default-issuer'}});
        jsonWebToken.verify.and.returnValue(q.resolve({iss: 'default-issuer'}));
        validator.validate('valid token', ['issuer1'], function() {
            expect(claimsValidator.validate.calls.argsFor(0)[0][0]).toBe('issuer1');
            expect(claimsValidator.validate.calls.argsFor(0)[1].resourceServerAudience).toBe('a-service-audience');
            expect(claimsValidator.validate.calls.argsFor(0)[1].ignoreMaxLifeTime).toBe(false);
            expect(claimsValidator.validate.calls.argsFor(0)[2].kid).toBe('default-issuer/key.pem');
            expect(claimsValidator.validate.calls.argsFor(0)[3].iss).toBe('default-issuer');
            done();
        });
    });

    it('should return claims on success', function(done) {
        claimsValidator.validate.and.returnValue(q.resolve({iss: 'issuer-1'}));
        validator.validate('valid token', ['issuer1'], function(error, claims) {
            expect(error).toBeNull();
            expect(claims).toBeDefined();
            expect(claims.iss).toBe('issuer-1');
            done();
        });
    });

});
