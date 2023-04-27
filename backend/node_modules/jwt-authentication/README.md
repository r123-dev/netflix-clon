# JWT Authentication

[![Build Status](https://drone.io/bitbucket.org/atlassianlabs/jwt-authentication/status.png)](https://drone.io/bitbucket.org/atlassianlabs/jwt-authentication/latest)

> A library to create and verify json web tokens for service to service authentication purposes.

**Note:** This library is a work in progress and does not yet have a stable api. If stability is important to you wait for the 1.0.0 release.

[Json Web Tokens](http://jwt.io/) (JWTs) are a secure way to represent claims that are to be transferred between two parties.
However on its own JWT does not provide an end to end authentication mechanism.
Some of the missing pieces include key distribution, default token expiry and a standard set of claims.
The JWT Authentication is a solution to these problems.

## Features

### Client

* Create JWT tokens signed with a private key
* Add custom claims to a token
* Add expiry to tokens

### Server

* Validate a JWT token
* Automatically retrieve the public key of the issuer of the token
* Validate the token expiry

## API

Refer to the [api documentation](https://bitbucket.org/atlassianlabs/jwt-authentication/src/master/docs/API.md) for details on how to use the api.

## Example

### Client

```
var jwtAuthentication = require('jwt-authentication');
var generator = jwtAuthentication.client.create();

var claims = {
    iss: process.env.ASAP_ISSUER,
    sub: 'name-of-client',
    aud: 'name-of-server'
};

var options = {
    privateKey: process.env.ASAP_PRIVATE_KEY,
    kid: process.env.ASAP_KEY_ID
};

generator.generateAuthorizationHeader(claims, options, function (error, headerValue) {
    if (error) {
        console.log('Generating the token failed.', error);
    } else {
        //assign headerValue to the Authorization header of your request object
        console.log(headerValue); // -> "Bearer [token]"
    }
});
```

### Server

```
var jwtAuthentication = require('jwt-authentication');

var authenticator = jwtAuthentication.server.create({
    publicKeyServer: process.env.ASAP_PUBLIC_KEY_REPOSITORY_URL,
    resourceServerAudience: process.env.ASAP_AUDIENCE,
    ignoreMaxLifeTime: false // Setting this property to true will skip the 1 hour max lifetime checks and make your server less secure. Do not include this if you are not sure what you are doing.
});

var authorizedSubjects = ['an-issuer'];

authenticator.validate(token, authorizedSubjects, function (error, claims) {
    if (error) {
        console.log('Validating the token failed.', error);
    } else {
        console.log('the token claims are', claims);
    }
});
```

## Public Key Server

The tokens are cryptographically signed using [RSA](http://en.wikipedia.org/wiki/RSA_%28cryptosystem%29). This means the token creators need a public and private key pair. Only the token creator should have access to the private key and it should be distributed to these services using a secure mechanism. The public key needs to be accessible to the receiver of the token. This is where the public key server fits into the picture.

The public key server is a third party that token receivers trust. The public keys of token creators are published to this server. When the token receiver receives a token it will look at the `kid` claim of the token, retrieve the key for that issuer from the public key server and use it to validate the token.
It is possible to provide a mirrored base url for the public key server. The urls must be seperated by a pipe with a whitespace " | ". The authenticator will try to fetch a key from both urls and use the first one to be delivered. If one of the servers is not available, it will wait until at least one of them returns a valid key or all of them fail.

For example if the following token is sent:
`{"alg": "HS256", "typ": "JWT", "kid": "name-of-client/key-id.pem"}.{"iss": "name-of-client", "sub": "name-of-client"}.[signature]`

The token receiver will use the public key found at:
`https://public-key-server.com/name-of-client/key-id.pem`

## Creating the public and private key pair

### Private Key

```
openssl genrsa -out private.pem 2048
```

This command will generate a private key. This private key must be kept secret, and should be distributed to the token generator in a secure way. Do not commit this key to version control.

### Public Key

```
openssl rsa -in private.pem -outform PEM -pubout -out public.pem
```

This command will generate a public key corresponding to the private key. This key should be uploaded to the public key server so receivers of tokens can validate the token.

## Changelog

Refer to the [changelog](https://bitbucket.org/atlassianlabs/jwt-authentication/src/master/docs/CHANGELOG.md) for a list of changes made in each version.

## Contributing

### Development Requirements

* nodejs 0.10.26
* npm 1.4.3
* grunt-cli 0.1.13

### Setting up a development environment

1. Clone the repository
1. `npm install` to install the npm dependencies
1. `grunt` to run a sanity check to ensure everything is working

### During development

* Use `grunt watch` to run the unit tests. When the relevant files are changed the unit tests will automatically be run.
* Use `grunt watchIntegrationTest` to run the integration tests. When the relevant files are changed the integration tests will automatically be run.
* Use `grunt docs` to preview the generated `docs/CHANGELOG.md` and `docs/API.md` files. **Do not commit these**, they are committed during the release task.
* Use `grunt` as a sanity check before pushing.

### Documentation

This library uses [JSDoc](http://usejsdoc.org/) to document it's public api. If you are making changes to the api please update the JSDoc accordingly.

### Changelog

This library automatically generates the changelog from the commit messages. To facilitate this please follow [these conventions](https://github.com/bcoe/conventional-changelog-standard/blob/master/convention.md) in your commit messages.

### Releasing

* Run `grunt release:patch` to release a patch version of the library.
* Run `grunt release:minor` to release a minor version of the library.
* Run `grunt release:major` to release a major version of the library.
