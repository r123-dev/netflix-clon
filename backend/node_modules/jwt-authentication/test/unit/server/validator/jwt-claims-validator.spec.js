var specHelpers = require('../../support/spec-helpers');
var failTest = require('../../support/fail-test');
var _ = require('lodash');
var NOW = Math.floor(new Date(2000, 1, 1, 1, 1, 1, 1) / 1000); // arbitrary date

var VALID_JWT_CLAIMS = {
    'iss': 'an-issuer',
    'sub': 'an-issuer',
    'aud': 'an-audience',
    'jti': '1a880a9a38ab4890044a7b8f06baefca34bbf6e3',
    'iat': NOW,
    'exp': NOW + 30,
    'nbf': NOW
};

var VALID_JWT_CLAIMS_WITH_AUD_ARR = {
    'iss': 'an-issuer',
    'sub': 'an-issuer',
    'aud': ['an-audience', 'another-audience'],
    'jti': '1a880a9a38ab4890044a7b8f06baefca34bbf6e3',
    'iat': NOW,
    'exp': NOW + 30,
    'nbf': NOW
};

var VALID_JWT_HEADER = {
    kid: 'an-issuer/key.pem'
};

var VALID_ISSUER = 'an-issuer';
var VALID_AUD = 'an-audience';
var VALID_CONFIG = {
    resourceServerAudience: VALID_AUD
};

var fakeCurrentTime = {
    get: function() {
        return NOW;
    }
};

describe('jwtClaimsValidator', function () {
    var validator;
    beforeEach(function() {
        validator = specHelpers.requireWithMocks('/server/validator/jwt-claims-validator', {
            '../../common/current-time': fakeCurrentTime
        });
    });

    it('should reject jwt if issuer is blank', function(done) {
        var invalidToken = _.clone(VALID_JWT_CLAIMS);
        invalidToken.iss = '';
        validator.validate([VALID_ISSUER], VALID_CONFIG, VALID_JWT_HEADER, invalidToken)
            .then(failTest(done))
            .fail(function(error) {
                expect(error).toBeDefined();
                expect(error.message).toBe('Issuer cannot be blank');
                done();
            });

    });

    it('should reject jwt if subject is not authorised by the valid issuers list', function(done) {
        var invalidToken = _.clone(VALID_JWT_CLAIMS);
        invalidToken.iss = 'different-issuer';
        invalidToken.sub = 'different-issuer';
        validator.validate([VALID_ISSUER], VALID_CONFIG, VALID_JWT_HEADER, invalidToken)
            .then(failTest(done))
            .fail(function(error) {
                expect(error).toBeDefined();
                expect(error.message).toBe('Unknown or unauthorized subject');
                done();
            });
    });

    it('should reject jwt if the audience is invalid', function(done) {
        var invalidToken = _.clone(VALID_JWT_CLAIMS);
        invalidToken.aud = 'invalid-audience';
        validator.validate([VALID_ISSUER], VALID_CONFIG, VALID_JWT_HEADER, invalidToken)
            .then(failTest(done))
            .fail(function(error) {
                expect(error).toBeDefined();
                expect(error.message).toBe('Unrecognised audience');
                done();
            });
    });

    it('should reject jwt if the audience array is invalid', function(done) {
        var invalidToken = _.clone(VALID_JWT_CLAIMS_WITH_AUD_ARR);
        invalidToken.aud = ['invalid-audience-1', 'invalid-audience-1'];
        validator.validate([VALID_ISSUER], VALID_CONFIG, VALID_JWT_HEADER, invalidToken)
            .then(failTest(done))
            .fail(function(error) {
                expect(error).toBeDefined();
                expect(error.message).toBe('Unrecognised audience');
                done();
            });
    });

    it('should reject jwt that was issued immediately after its expiry', function(done) {
        var invalidToken = _.clone(VALID_JWT_CLAIMS);
        invalidToken.iat = VALID_JWT_CLAIMS.exp + 1;
        validator.validate([VALID_ISSUER], VALID_CONFIG, VALID_JWT_HEADER, invalidToken)
            .then(failTest(done))
            .fail(function(error) {
                expect(error).toBeDefined();
                expect(error.message).toBe('Expiry time set before issue time');
                done();
            });
    });

    it('should reject jwt that was valid immediately before the time it was issued', function(done) {
        var invalidToken = _.clone(VALID_JWT_CLAIMS);
        invalidToken.nbf = VALID_JWT_CLAIMS.iat - 1;
        validator.validate([VALID_ISSUER], VALID_CONFIG, VALID_JWT_HEADER, invalidToken)
            .then(failTest(done))
            .fail(function(error) {
                expect(error).toBeDefined();
                expect(error.message).toBe('The token must not be valid before it was issued');
                done();
            });
    });

    it('should reject jwt that is never valid', function(done) {
        var invalidToken = _.clone(VALID_JWT_CLAIMS);
        invalidToken.nbf = VALID_JWT_CLAIMS.exp + 1;
        validator.validate([VALID_ISSUER], VALID_CONFIG, VALID_JWT_HEADER, invalidToken)
            .then(failTest(done))
            .fail(function(error) {
                expect(error).toBeDefined();
                expect(error.message).toBe('The expiry time must be after the not-before time');
                done();
            });
    });

    it('should reject jwt if lifetime exceeds one hour and ignoreMaxLifeTime is undefined', function(done) {
        var invalidToken = _.clone(VALID_JWT_CLAIMS);
        invalidToken.exp = VALID_JWT_CLAIMS.exp + 2 * 60 * 60;
        validator.validate([VALID_ISSUER], VALID_CONFIG, VALID_JWT_HEADER, invalidToken)
            .then(failTest(done))
            .fail(function(error) {
                expect(error).toBeDefined();
                expect(error.message).toBe('Token exceeds lifetime limit of 3600 seconds');
                done();
            });
    });

    it('should reject jwt if lifetime exceeds one hour and ignoreMaxLifeTime is false', function(done) {
        var invalidToken = _.clone(VALID_JWT_CLAIMS);
        invalidToken.exp = VALID_JWT_CLAIMS.exp + 2 * 60 * 60;
        var config = _.extend({ignoreMaxLifeTime: false}, VALID_CONFIG);
        validator.validate([VALID_ISSUER], config, VALID_JWT_HEADER, invalidToken)
            .then(failTest(done))
            .fail(function(error) {
                expect(error).toBeDefined();
                expect(error.message).toBe('Token exceeds lifetime limit of 3600 seconds');
                done();
            });
    });

    it('should not reject jwt if lifetime exceeds one hour and ignoreMaxLifeTime is true', function(done) {
        var invalidToken = _.clone(VALID_JWT_CLAIMS);
        invalidToken.exp = VALID_JWT_CLAIMS.exp + 2 * 60 * 60;
        var config = _.extend({ignoreMaxLifeTime: true}, VALID_CONFIG);
        validator.validate([VALID_ISSUER], config, VALID_JWT_HEADER, invalidToken)
            .then(function(claims) {
                expect(claims).toBeDefined();
                done();
            })
            .fail(failTest(done));
    });

    it('should reject jwt that has expired', function(done) {
        var invalidToken = _.clone(VALID_JWT_CLAIMS);
        invalidToken.iat = NOW - 31;
        invalidToken.nbf = NOW - 31;
        invalidToken.exp = NOW - 31;
        validator.validate([VALID_ISSUER], VALID_CONFIG, VALID_JWT_HEADER, invalidToken)
            .then(failTest(done))
            .fail(function(error) {
                expect(error).toBeDefined();
                expect(error.message).toBe('The token has already expired');
                done();
            });
    });

    it('should reject jwt that is not valid yet when using not before', function(done) {
        var invalidToken = _.clone(VALID_JWT_CLAIMS);
        invalidToken.iat = NOW;
        invalidToken.nbf = NOW + 31;
        invalidToken.exp = NOW + 31;
        validator.validate([VALID_ISSUER], VALID_CONFIG, VALID_JWT_HEADER, invalidToken)
            .then(failTest(done))
            .fail(function(error) {
                expect(error).toBeDefined();
                expect(error.message).toBe('The token is not valid yet');
                done();
            });
    });

    it('should reject jwt that is not valid yet when not using not before', function(done) {
        var invalidToken = _.clone(VALID_JWT_CLAIMS);
        invalidToken.iat = NOW + 31;
        invalidToken.nbf = null;
        invalidToken.exp = NOW + 31;
        validator.validate([VALID_ISSUER], VALID_CONFIG, VALID_JWT_HEADER, invalidToken)
            .then(failTest(done))
            .fail(function(error) {
                expect(error).toBeDefined();
                expect(error.message).toBe('The token is not valid yet');
                done();
            });
    });

    it('should reject jwt if kid does not start with issuer', function(done) {
        var invalidHeader = _.clone(VALID_JWT_HEADER);
        invalidHeader.kid = 'some-other/key.pem';
        validator.validate([VALID_ISSUER], VALID_CONFIG, invalidHeader, VALID_JWT_CLAIMS)
            .then(failTest(done))
            .fail(function(error) {
                expect(error).toBeDefined();
                expect(error.message).toBe('The issuer claim does not match the key id');
                done();
            });
    });

    it('should accept a valid jwt token', function(done) {
        validator.validate([VALID_ISSUER], VALID_CONFIG, VALID_JWT_HEADER, VALID_JWT_CLAIMS)
            .then(function(claims) {
                expect(claims).toBeDefined();
                done();
            })
            .fail(failTest(done));
    });

    it('should accept a valid jwt token with an audience array in claims', function(done) {
        validator.validate([VALID_ISSUER], VALID_CONFIG, VALID_JWT_HEADER, VALID_JWT_CLAIMS_WITH_AUD_ARR)
            .then(function(claims) {
                expect(claims).toBeDefined();
                done();
            })
            .fail(failTest(done));
    });
});