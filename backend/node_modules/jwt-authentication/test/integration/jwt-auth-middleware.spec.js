var fs = require('fs');
var jwtGeneratorFactory = require('../../lib/client/jwt-generator');
var q = require('q');
var request = require('request');
var failTest = require('../unit/support/fail-test');

describe ('jwt-auth-middlerware', function () {

    var privateKey = fs.readFileSync('test/integration/key-server/an-issuer/private.pem');
    var privateKeyDataUri = fs.readFileSync('test/integration/key-server/an-issuer/private-datauri');
    var incorrectPrivateKey = fs.readFileSync('test/integration/key-server/an-issuer/private-wrong.pem');

    var createGenerator = function () {
        return jwtGeneratorFactory.create();
    };

    var invokeGenerateToken = function (claims, options, callback) {
        return createGenerator().generateToken(claims, options, callback);
    };

    var requestWithAuthHeader = function(headerValue, requestUrl) {
        var url = requestUrl || 'http://localhost:8000/needs/auth';
        var options = {
            auth: {
                'bearer': headerValue
            }

        };
        return q.nfcall(request, url, options);
    };

    it('should authenticate valid token', function (done) {
        var claims = {iss: 'an-issuer', sub: 'an-issuer', aud: 'an-audience'};
        var options = {kid: 'an-issuer/public.pem', privateKey: privateKey};
        invokeGenerateToken(claims, options, function (error, headerValue) {
            requestWithAuthHeader(headerValue)
                .then(function(responseAndBody) {
                    var response = responseAndBody[0];
                    var body = responseAndBody[1];
                    expect(body).toBe('Ok');
                    expect(response.statusCode).toBe(200);
                    done();
                }).fail(failTest(done));
        });
    });

    it('should authenticate valid token generated from dataUri', function (done) {
        var claims = {iss: 'an-issuer', sub: 'an-issuer', aud: 'an-audience'};
        var options = {kid: 'an-issuer/public.pem', privateKey: privateKeyDataUri};
        invokeGenerateToken(claims, options, function (error, headerValue) {
            requestWithAuthHeader(headerValue)
                .then(function(responseAndBody) {
                    var response = responseAndBody[0];
                    var body = responseAndBody[1];
                    expect(body).toBe('Ok');
                    expect(response.statusCode).toBe(200);
                    done();
                }).fail(failTest(done));
        });
    });

    it('should authenticate valid token with audience array', function (done) {
        var claims = {iss: 'an-issuer', sub: 'an-issuer', aud: ['an-audience', 'another-audience']};
        var options = {kid: 'an-issuer/public.pem', privateKey: privateKey};
        invokeGenerateToken(claims, options, function (error, headerValue) {
            requestWithAuthHeader(headerValue)
                .then(function(responseAndBody) {
                    var response = responseAndBody[0];
                    var body = responseAndBody[1];
                    expect(body).toBe('Ok');
                    expect(response.statusCode).toBe(200);
                    done();
                }).fail(failTest(done));
        });
    });

    it('should return 401, if the token is invalid', function (done) {
        var claims = {iss: 'an-issuer', sub: 'an-issuer', aud: 'an-audience'};
        var options = {kid: 'an-issuer/public.pem', privateKey: incorrectPrivateKey};
        invokeGenerateToken(claims, options, function (error, headerValue) {
            requestWithAuthHeader(headerValue)
                .then(function(responseAndBody) {
                    var response = responseAndBody[0];
                    var body = JSON.parse(responseAndBody[1]);
                    expect(body).toEqual({
                        'errorDetails': {
                            'message':'Request had missing or incorrect credentials.',
                            'originalError':'invalid signature'
                        }
                    });
                    expect(response.statusCode).toBe(401);
                    done();
                })
                .fail(failTest(done));
        });
    });

    it('should return 401, if the issuer is not authorised to access the resource', function (done) {
        var claims = {iss: 'an-issuer', sub: 'an-issuer', aud: 'an-audience'};
        var options = {kid: 'an-issuer/public.pem', privateKey: privateKey};
        invokeGenerateToken(claims, options, function (error, headerValue) {
            requestWithAuthHeader(headerValue, 'http://localhost:8000/different/issuer')
                .then(function(responseAndBody) {
                    var response = responseAndBody[0];
                    var body = JSON.parse(responseAndBody[1]);
                    expect(body).toEqual({
                        'errorDetails': {
                            'message':'Request had missing or incorrect credentials.',
                            'originalError':'Unknown or unauthorized subject'
                        }
                    });
                    expect(response.statusCode).toBe(401);
                    done();
                })
                .fail(failTest(done));
        });
    });

});