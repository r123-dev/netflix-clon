var q = require('q');
var errorKeys = require('./errorKeys');

var logInfo = function(logger, request, message) {
    if (logger) {
        logger.info({
            requestContext: {
                url: request.originalUrl
            },
            message: message
        });
    }
};

var handleSuccessfulAuthentication = function(request, claims, next) {
    request.claims = claims;
    next();
};

var handleFailure = function(request, response, error, logger) {
    var err = error.error || error;
    response.setHeader('Content-Type', 'application/json');
    response.statusCode = 401;
    var unauthorizedMessage = 'Request had missing or incorrect credentials.';
    response.end(JSON.stringify({
        errorDetails: {
            message: unauthorizedMessage,
            originalError: err.message
        },
        errorKey: err.key
    }));
    logInfo(logger, request, unauthorizedMessage);

};

var validateToken = function(jwtValidator, authorizedSubjects, token) {
    var validIssuers = authorizedSubjects || [];
    return q.nfcall(jwtValidator.validate, token, validIssuers);
};

var validateFormat = function(authHeader) {
    var parts = authHeader.split(' ');
    if (!parts || parts.length !== 2) {
        var error = new Error('Authorization header has a wrong format');
        error.key = errorKeys.wrongHeaderFormat;
        throw error;
    }

    return parts;
};

var validateScheme = function(schemeAndToken) {
    var authScheme = schemeAndToken[0];
    if (authScheme !== 'Bearer') {
        var error = new Error('Authorization header has a wrong scheme');
        error.key = errorKeys.wrongScheme;
        throw error;
    }

    return schemeAndToken[1];
};

var getBearerToken = function(request) {
    var authHeader = request.headers.authorization;
    if (!authHeader) {
        var error = new Error('Missing authorization header');
        error.key = errorKeys.missingHeader;
        throw error;
    }

    return q(authHeader)
        .then(function(authHeader) {
            return validateFormat(authHeader);
        })
        .then(function(schemeAndToken) {
            return validateScheme(schemeAndToken);
        })
        .then(function(token) {
            return token;
        });
};

/** @module */
module.exports = {
    /**
     * @callback next
     */

    /**
     * @callback JWTAuthMiddlewareCallback
     * @param {Object} request - http request
     * @param {Object} response - http response
     * @param {next} next - function to call the next middleware
     */

    /**
     * Constructor of http middleware function for jwt authentication.
     *
     * @example
     * ```js
     * var server = require('jwt-authentication').server;
     * var validator = server.create({
     *                                 publicKeyBaseUrl: 'https://public-key-server.com/',
     *                                 resourceServerAudience: 'my-service'
     *                               });
     * var authMiddleware = require('jwt-authentication').httpAuthMiddleware;
     * var validator = server.create(validator);
     * ```
     * @param {Validator} jwtValidator - `Validator` object
     * @param {Array.<String>} authorizedSubjects - array of authorized subject
     * @param {Object} [logger] - optional logger object to log 401 errors
     * @returns {JWTAuthMiddlewareCallback} - middleware function to authenticate requests
     */
    create: function(jwtValidator, authorizedSubjects, logger) {
        return function(request, response, next) {
            return q(null)
                .then(function() {
                    return getBearerToken(request);
                })
                .then(function(token) {
                    return validateToken(jwtValidator, authorizedSubjects, token);
                })
                .then(function(claims) {
                    handleSuccessfulAuthentication(request, claims, next);
                })
                .fail(function(error) {
                    handleFailure(request, response, error, logger);
                });
        };
    }
};