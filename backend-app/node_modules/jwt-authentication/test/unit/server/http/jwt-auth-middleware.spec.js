var jwtMiddleware = require('../../../../lib/server/http/jwt-auth-middleware');
var errorKeys = require('../../../../lib/server/http/errorKeys');

describe('jwtAuthMiddleware', function() {
    var authMiddleware;
    var jwtAuthenticator;
    var logger;
    var response;
    var next;

    var getRequestWithHeader = function(headerValue) {
        return {
            headers: headerValue || {}
        };
    };

    beforeEach(function() {
        jwtAuthenticator = jasmine.createSpyObj('jwtAuthenticator', ['validate']);
        jwtAuthenticator.validate.and.callFake(function(token, authorizedSubjects, callback) {
            callback(null, {claims: 'claims'});
        });
        logger = jasmine.createSpyObj('logger', ['info']);
        response = jasmine.createSpyObj('response', ['end', 'setHeader']);
        next = jasmine.createSpy('next');

        authMiddleware = jwtMiddleware.create(jwtAuthenticator, ['an-issuer'], logger);
    });

    it('should fail if authorization header is not set', function(done) {
        authMiddleware(getRequestWithHeader(), response, next)
            .then(function() {
                expect(next).not.toHaveBeenCalled();
                expect(logger.info.calls.argsFor(0)[0].message)
                    .toBe('Request had missing or incorrect credentials.');
                var error = JSON.parse(response.end.calls.argsFor(0)[0]);
                expect(error.errorDetails.originalError)
                    .toBe('Missing authorization header');
                expect(error.errorKey).toBe(errorKeys.missingHeader);
                expect(response.statusCode).toBe(401);
                done();
            });
    });

    it('should fail if authorization header has wrong format', function(done) {
        authMiddleware(getRequestWithHeader({authorization: 'wrong-format'}), response, next)
            .then(function() {
                expect(next).not.toHaveBeenCalled();
                expect(logger.info.calls.argsFor(0)[0].message)
                    .toBe('Request had missing or incorrect credentials.');
                var error = JSON.parse(response.end.calls.argsFor(0)[0]);
                expect(error.errorDetails.originalError)
                    .toBe('Authorization header has a wrong format');
                expect(response.statusCode).toBe(401);
                expect(error.errorKey).toBe(errorKeys.wrongHeaderFormat);
                done();
            });
    });

    it('should fail if authorization header has wrong scheme', function(done) {
        authMiddleware(getRequestWithHeader({authorization: 'Base someauth'}), response, next)
            .then(function() {
                expect(next).not.toHaveBeenCalled();
                expect(logger.info.calls.argsFor(0)[0].message)
                    .toBe('Request had missing or incorrect credentials.');
                var error = JSON.parse(response.end.calls.argsFor(0)[0]);
                expect(error.errorDetails.originalError)
                    .toBe('Authorization header has a wrong scheme');
                expect(response.statusCode).toBe(401);
                expect(error.errorKey).toBe(errorKeys.wrongScheme);
                done();
            });
    });

    it('should parse the auth header and call next if validation succeeds', function(done) {
        var request = getRequestWithHeader({authorization: 'Bearer someauth'});
        authMiddleware(request, response, next)
            .then(function() {
                expect(next).toHaveBeenCalled();
                var validationArgs = jwtAuthenticator.validate.calls.argsFor(0);
                expect(validationArgs[0]).toBe('someauth');
                expect(validationArgs[1]).toEqual(['an-issuer']);
                expect(request.claims).toEqual({claims: 'claims'});
                done();

            });
    });

    it('should parse the auth header and fail if validation fails', function(done) {
        jwtAuthenticator.validate.and.callFake(function(token, authorizedSubjects, callback) {
            callback(new Error('Validation failed'), {claims: 'claims'});
        });
        authMiddleware = jwtMiddleware.create(jwtAuthenticator, ['an-issuer'], logger);
        authMiddleware(getRequestWithHeader({authorization: 'Bearer someauth'}), response, next)
            .then(function() {
                expect(next).not.toHaveBeenCalled();
                expect(logger.info.calls.argsFor(0)[0].message)
                    .toBe('Request had missing or incorrect credentials.');
                expect(JSON.parse(response.end.calls.argsFor(0)[0]).errorDetails.originalError)
                    .toBe('Validation failed');
                expect(response.statusCode).toBe(401);
                done();
            });
    });

});
